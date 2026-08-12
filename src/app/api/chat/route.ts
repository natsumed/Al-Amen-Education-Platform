import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import { auth } from "@/lib/auth"
import { buildAssistantSystemPrompt } from "@/lib/chat-assistant"
import { createAmenallahAgentTools, type AgentSession } from "@/lib/ai/agent-tools"
import { smartOfflineReply } from "@/lib/ai/smart-offline-agent"

export const runtime = "nodejs"
export const maxDuration = 60

type ChatMode = "gemini" | "openai" | "offline"

/** Prefer lite models on free tier — less 503 “high demand”. */
const DEFAULT_GEMINI_PRIMARY = "gemini-3.5-flash-lite"
const DEFAULT_GEMINI_FALLBACKS =
  "gemini-3.1-flash-lite,gemini-flash-lite-latest,gemini-3.5-flash"

function resolveChatMode(): ChatMode {
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "gemini"
  if (process.env.OPENAI_API_KEY) return "openai"
  return "offline"
}

function geminiModelChain(): string[] {
  const primary = (process.env.GEMINI_MODEL || DEFAULT_GEMINI_PRIMARY).trim()
  const extras = (process.env.GEMINI_FALLBACK_MODELS || DEFAULT_GEMINI_FALLBACKS)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  return [...new Set([primary, ...extras])]
}

function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role !== "user") continue
    const parts = m.parts || []
    const text = parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n")
      .trim()
    if (text) return text
  }
  return ""
}

function offlineStreamResponse(text: string, mode: ChatMode = "offline") {
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const id = "offline-text"
      writer.write({ type: "text-start", id })
      writer.write({ type: "text-delta", id, delta: text })
      writer.write({ type: "text-end", id })
    },
  })
  return createUIMessageStreamResponse({
    stream,
    headers: { "X-Chat-Mode": mode },
  })
}

function isCapacityError(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.name} ${err.message}` : String(err)
  return /high demand|UNAVAILABLE|503|RetryError|overloaded|resource.?exhausted|429/i.test(
    msg
  )
}

type ResolvedLlm =
  | { provider: "gemini"; apiKey: string; modelIds: string[] }
  | { provider: "openai"; apiKey: string; modelIds: string[] }

function resolveLlm(): ResolvedLlm | null {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (geminiKey) {
    return { provider: "gemini", apiKey: geminiKey, modelIds: geminiModelChain() }
  }
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      modelIds: [process.env.OPENAI_MODEL || "gpt-4o-mini"],
    }
  }
  return null
}

/** Status for UI banner */
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  const mode = resolveChatMode()
  return Response.json({
    mode,
    label:
      mode === "gemini"
        ? "Agent Gemini"
        : mode === "openai"
          ? "Agent OpenAI"
          : "Mode local (DB)",
    models: mode === "gemini" ? geminiModelChain() : undefined,
  })
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const role = session.user.role || "STUDENT"
    if (role === "ADMIN") {
      return new Response(
        JSON.stringify({
          error: "Le chatbot est destiné aux élèves, parents et enseignants.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await req.json()
    const messages = (body.messages || []) as UIMessage[]
    const lang = (body.lang === "ar" ? "ar" : "fr") as "fr" | "ar"
    const userText = lastUserText(messages)

    if (!userText) {
      return new Response(JSON.stringify({ error: "Message vide" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const agentSession: AgentSession = {
      userId: session.user.id,
      role,
      lang,
    }

    const llm = resolveLlm()
    if (!llm) {
      const { text } = await smartOfflineReply(userText, agentSession)
      return offlineStreamResponse(text, "offline")
    }

    const tools = createAmenallahAgentTools(agentSession)
    const modelMessages = await convertToModelMessages(messages)
    const system = buildAssistantSystemPrompt(role, lang)
    const mode: ChatMode = llm.provider === "gemini" ? "gemini" : "openai"

    const google =
      llm.provider === "gemini"
        ? createGoogleGenerativeAI({ apiKey: llm.apiKey })
        : null
    const openai =
      llm.provider === "openai" ? createOpenAI({ apiKey: llm.apiKey }) : null

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        let lastErr: unknown
        for (const modelId of llm.modelIds) {
          try {
            const model =
              llm.provider === "gemini" && google
                ? google(modelId)
                : openai!(modelId)

            const result = streamText({
              model,
              system,
              messages: modelMessages,
              tools,
              stopWhen: stepCountIs(8),
              temperature: 0.25,
              // Fail over to next model faster on free-tier 503s
              maxRetries: 1,
            })

            writer.merge(result.toUIMessageStream())
            await result.text
            return
          } catch (err) {
            lastErr = err
            console.warn(
              `[chat] model ${modelId} failed${isCapacityError(err) ? " (capacity)" : ""}:`,
              err instanceof Error ? err.message : err
            )
          }
        }

        console.error("POST /api/chat all models failed → offline", lastErr)
        const { text } = await smartOfflineReply(userText, agentSession)
        const note =
          lang === "ar"
            ? "\n\n_(الخدمة السحابية مشغولة — إجابة محلية من قاعدة البيانات.)_"
            : "\n\n_(Gemini saturé temporairement — réponse locale depuis la base.)_"
        const id = "fallback-text"
        writer.write({ type: "text-start", id })
        writer.write({ type: "text-delta", id, delta: text + note })
        writer.write({ type: "text-end", id })
      },
      onError: (error) => {
        if (error instanceof Error) {
          if (isCapacityError(error)) {
            return lang === "ar"
              ? "الخدمة مشغولة. أعد المحاولة بعد لحظات."
              : "Service Gemini saturé. Réessayez dans un instant."
          }
          return error.message
        }
        return String(error)
      },
    })

    return createUIMessageStreamResponse({
      stream,
      headers: { "X-Chat-Mode": mode },
    })
  } catch (err: unknown) {
    console.error("POST /api/chat", err)
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
