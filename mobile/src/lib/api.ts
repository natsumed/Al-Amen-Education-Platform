import Constants from "expo-constants"
import { Platform } from "react-native"

/**
 * Resolve API base URL for Expo Go / emulator / device.
 *
 * Priority:
 * 1. EXPO_PUBLIC_API_URL
 * 2. Same LAN host as Metro (phone + PC on Wi‑Fi) → http://HOST:3000
 * 3. Android emulator loopback → http://10.0.2.2:3000
 * 4. localhost (web / iOS simulator)
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "")
  if (fromEnv) return fromEnv

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2
      ?.extra?.expoClient?.hostUri ||
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost

  if (hostUri) {
    const host = String(hostUri).split(":")[0]
    if (host) {
      // USB + adb reverse: Metro is 127.0.0.1 — API must be too (also reversed).
      // Emulator without reverse still needs 10.0.2.2 (handled below when no hostUri).
      if (host === "localhost" || host === "127.0.0.1") {
        if (Platform.OS === "android" && !Constants.isDevice) {
          return "http://10.0.2.2:3000"
        }
        return "http://127.0.0.1:3000"
      }
      return `http://${host}:3000`
    }
  }

  if (Platform.OS === "android") return "http://10.0.2.2:3000"
  return "http://localhost:3000"
}

export const API_BASE_URL = getApiBaseUrl()

export type MobileUser = {
  id: string
  email: string
  fullName: string
  role: string
  avatarUrl?: string | null
  publicId?: string
}

export type ContentItem = {
  id: string
  titleAr: string
  titleFr: string
  descriptionAr?: string | null
  descriptionFr?: string | null
  grade: string
  subject: string
  contentType: string
  isFree: boolean
  thumbnailUrl?: string | null
  access?: { canAccess: boolean; canDownload: boolean; isSubscribed: boolean }
  mediaLocked?: boolean
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options
  const base = getApiBaseUrl()
  const res = await fetch(`${base}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  }
  return data as T
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: MobileUser }>("/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) =>
    request<{ user: MobileUser & { subscriptions?: unknown[] } }>("/api/mobile/auth/me", {
      token,
    }),

  listContent: (params: Record<string, string | number | undefined> = {}, token?: string | null) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.set(k, String(v))
    })
    const qs = q.toString()
    return request<{ items: ContentItem[]; total: number; page: number; totalPages: number }>(
      `/api/content${qs ? `?${qs}` : ""}`,
      { token }
    )
  },

  getContent: (id: string, token?: string | null) =>
    request<ContentItem & { access?: ContentItem["access"]; mediaLocked?: boolean }>(
      `/api/content/${id}`,
      { token }
    ),

  getMedia: (id: string, token: string) =>
    request<{
      media: {
        youtubeUrl: string | null
        pdfUrl: string | null
        gifUrl: string | null
        fileUrls: string[]
      }
      canDownload: boolean
    }>(`/api/content/${id}/media`, { token }),

  parentChildren: (token: string) =>
    request<{
      links: Array<{
        id: string
        status: string
        student: {
          id: string
          publicId?: string
          fullName: string
          email: string
        }
      }>
    }>("/api/parents/children", { token }),
}
