import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"
import { ingestionLimiter } from "@/lib/rate-limit"
import { encryptSecret, hashNetworkIdentifier } from "@/lib/security-crypto"
import { proposeContentMetadata } from "@/lib/ai/content-ingestion"

const createIngestionSchema = z.object({
  sourceType: z.enum(["DRIVE_FILE", "DRIVE_FOLDER", "DIRECT_UPLOAD"]),
  sourceRef: z.string().trim().min(3).max(2_000),
  instructions: z.string().trim().max(2_000).optional(),
})

function validSource(input: z.infer<typeof createIngestionSchema>) {
  if (input.sourceType === "DIRECT_UPLOAD") return /^upload:[A-Za-z0-9_-]+$/.test(input.sourceRef)
  try {
    const url = new URL(input.sourceRef)
    return url.protocol === "https:" && ["drive.google.com", "docs.google.com"].includes(url.hostname)
  } catch {
    return false
  }
}

function publicJob<T extends { sourceRefEncrypted?: string }>(job: T) {
  const { sourceRefEncrypted: _secret, ...safe } = job
  return safe
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const jobs = await prisma.ingestionJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      requestedBy: { select: { fullName: true } },
      reviewedBy: { select: { fullName: true } },
      content: { select: { id: true, titleFr: true, status: true } },
      asset: { select: { id: true, kind: true, status: true, deliveryProvider: true } },
    },
  })
  return NextResponse.json({ jobs: jobs.map(publicJob) }, { headers: { "Cache-Control": "private, no-store" } })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const limit = await ingestionLimiter.check(user.id)
  if (!limit.allowed) return NextResponse.json({ error: "Limite AI atteinte" }, { status: 429 })

  const parsed = createIngestionSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success || !validSource(parsed.data)) {
    return NextResponse.json({ error: "Source Drive ou upload invalide" }, { status: 400 })
  }

  let encrypted: string
  try {
    encrypted = encryptSecret(parsed.data.sourceRef)
  } catch {
    return NextResponse.json({ error: "Chiffrement serveur non configuré" }, { status: 503 })
  }

  const job = await prisma.ingestionJob.create({
    data: {
      requestedById: user.id,
      sourceType: parsed.data.sourceType,
      sourceRefEncrypted: encrypted,
      instructions: parsed.data.instructions,
      status: "ANALYZING",
      progressPercent: 10,
    },
  })

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  try {
    const sourceLabel = parsed.data.sourceType === "DIRECT_UPLOAD"
      ? parsed.data.sourceRef
      : new URL(parsed.data.sourceRef).pathname.split("/").filter(Boolean).at(-1) || "Drive item"
    const analysis = await proposeContentMetadata({
      sourceType: parsed.data.sourceType,
      sourceLabel,
      instructions: parsed.data.instructions,
    })
    const updated = await prisma.ingestionJob.update({
      where: { id: job.id },
      data: {
        status: "REVIEW_REQUIRED",
        progressPercent: 40,
        proposal: analysis.proposal,
        confidence: analysis.proposal.confidence,
      },
    })
    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        action: "AI_INGESTION_PROPOSED",
        targetType: "IngestionJob",
        targetId: job.id,
        ipHash: hashNetworkIdentifier(ip),
        metadata: { model: process.env.OPENAI_INGESTION_MODEL || "gpt-5-mini", ...analysis.usage },
      },
    })
    return NextResponse.json(publicJob(updated), { status: 201 })
  } catch (error) {
    const code = error instanceof Error ? error.message : "ANALYSIS_FAILED"
    const updated = await prisma.ingestionJob.update({
      where: { id: job.id },
      data: {
        status: code === "OPENAI_NOT_CONFIGURED" ? "WAITING_FOR_CONFIGURATION" : "FAILED",
        errorCode: code,
        errorMessage: "L'analyse automatique n'a pas pu être terminée.",
      },
    })
    return NextResponse.json(publicJob(updated), { status: code === "OPENAI_NOT_CONFIGURED" ? 202 : 502 })
  }
}
