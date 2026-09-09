/**
 * Resolve API base URL for standalone APK / emulator / Metro debug.
 *
 * Priority:
 * 0. Runtime override in development only — never permitted in a release build
 * 1. EXPO_PUBLIC_API_URL (required for release / EAS preview & production builds)
 * 2. Same LAN host as Metro (dev only)
 * 3. Android emulator → http://10.0.2.2:3000
 * 4. localhost
 */
import Constants from "expo-constants"
import { Platform } from "react-native"

let runtimeOverride: string | null = null
let refreshAccessToken: (() => Promise<string | null>) | null = null

export function setAuthRefreshHandler(handler: (() => Promise<string | null>) | null) {
  refreshAccessToken = handler
}

/** Call after loading AsyncStorage so a wrong baked URL can be fixed without a rebuild. */
export function setApiBaseUrlOverride(url: string | null) {
  if (!__DEV__) {
    runtimeOverride = null
    return
  }
  runtimeOverride = url ? url.replace(/\/$/, "") : null
}

export function getApiBaseUrlOverride(): string | null {
  return runtimeOverride
}

export function getApiBaseUrl(): string {
  if (__DEV__ && runtimeOverride) return runtimeOverride

  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "")
  if (fromEnv && !fromEnv.includes("REPLACE_WITH_YOUR_API_HOST")) {
    return fromEnv
  }

  // Release / standalone builds must bake a real URL at build time
  if (!__DEV__) {
    throw new Error(
      "EXPO_PUBLIC_API_URL manquant. Rebuild l'APK avec l'URL HTTPS de l'API (voir mobile/eas.json)."
    )
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2
      ?.extra?.expoClient?.hostUri ||
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost

  if (hostUri) {
    const host = String(hostUri).split(":")[0]
    if (host) {
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

export type MobileUser = {
  id: string
  email: string
  fullName: string
  role: string
  avatarUrl?: string | null
  publicId?: string
  phone?: string | null
  preferredLanguage?: "fr" | "ar" | null
  emailNotifications?: boolean
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
  reviews?: Array<{
    id: string
    rating: number
    comment?: string | null
    user?: { fullName: string; avatarUrl?: string | null }
  }>
}

export type Subscription = {
  id: string
  plan: string
  status: string
  startDate: string
  endDate: string
}

export type ProgressItem = {
  id: string
  contentId: string
  progressPercent: number
  completed: boolean
  lastAccessed: string
  content: ContentItem
}

export type DocumentManifest = {
  contentId: string
  pageCount: number
  currentPage: number
  pages: Array<{ page: number; url: string }>
  expiresIn: number
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null; _retried?: boolean } = {}
): Promise<T> {
  const { token, headers, _retried, ...rest } = options
  let base: string
  try {
    base = getApiBaseUrl()
  } catch (e) {
    throw e instanceof Error ? e : new Error("API URL invalide")
  }

  let res: Response
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)
    try {
      res = await fetch(`${base}${path}`, {
        ...rest,
        signal: rest.signal ?? controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
      })
    } finally {
      clearTimeout(timeout)
    }
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError"
    throw new Error(
      aborted
        ? `Délai dépassé vers l'API (${base}). Vérifiez que Next.js tourne.`
        : `Impossible de joindre le serveur. Vérifiez votre connexion et l'URL de l'API.\n${base}${path}`
    )
  }

  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && token && !_retried && refreshAccessToken) {
    const nextToken = await refreshAccessToken()
    if (nextToken) return request<T>(path, { ...options, token: nextToken, _retried: true })
  }
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  }
  return data as T
}

export const api = {
  login: (email: string, password: string, device: { deviceId: string; platform: string; deviceName?: string }, totpCode?: string) =>
    request<{ accessToken: string; token: string; refreshToken: string; expiresIn: number; user: MobileUser }>("/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, totpCode, ...device }),
    }),

  loginWithGoogle: (idToken: string, device: { deviceId: string; platform: string; deviceName?: string }, totpCode?: string) =>
    request<{ accessToken: string; token: string; refreshToken: string; expiresIn: number; user: MobileUser; onboardingRequired?: boolean }>("/api/mobile/auth/google", {
      method: "POST", body: JSON.stringify({ idToken, totpCode, ...device }),
    }),

  loginWithApple: (identityToken: string, device: { deviceId: string; platform: string; deviceName?: string }, totpCode?: string) =>
    request<{ accessToken: string; token: string; refreshToken: string; expiresIn: number; user: MobileUser; onboardingRequired?: boolean }>("/api/mobile/auth/apple", {
      method: "POST", body: JSON.stringify({ identityToken, totpCode, ...device }),
    }),

  refresh: (refreshToken: string) =>
    request<{ accessToken: string; token: string; refreshToken: string; expiresIn: number }>(
      "/api/mobile/auth/refresh",
      { method: "POST", body: JSON.stringify({ refreshToken }), _retried: true }
    ),

  logout: (token: string) =>
    request<{ ok: boolean }>("/api/mobile/auth/logout", { method: "POST", token, _retried: true }),

  me: (token: string) =>
    request<{ user: MobileUser & { subscriptions?: Subscription[] } }>("/api/mobile/auth/me", {
      token,
    }),

  register: (input: {
    fullName: string
    email: string
    password: string
    phone?: string
    role?: "STUDENT" | "TEACHER" | "PARENT"
    studentPublicId?: string
  }) =>
    request<{ status: "EMAIL_VERIFICATION_REQUIRED"; message: string; userId: string; publicId: string; maskedEmail: string; linkPending: boolean }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ role: "STUDENT", ...input }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resendVerification: (email: string) =>
    request<{ message: string }>("/api/auth/verify-email/resend", { method: "POST", body: JSON.stringify({ email }) }),

  onboarding: (token: string) =>
    request<{ user: MobileUser; mfaEnabled: boolean }>("/api/auth/onboarding", { token }),

  completeOnboarding: (token: string, input: { role: "STUDENT" | "PARENT" | "TEACHER"; preferredLanguage: "fr" | "ar"; phone?: string; studentPublicId?: string }) =>
    request<{ user: MobileUser; linkPending: boolean }>("/api/auth/onboarding", { method: "POST", token, body: JSON.stringify(input) }),

  startMfa: (token: string) =>
    request<{ secret: string; uri: string }>("/api/security/mfa", { method: "POST", token }),

  confirmMfa: (token: string, code: string) =>
    request<{ enabled: boolean; recoveryCodes: string[] }>("/api/security/mfa", { method: "PUT", token, body: JSON.stringify({ code }) }),

  verifyEmail: (token: string) => request<{ ok: boolean; message: string }>("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) }),

  resetPassword: (token: string, password: string, confirmPassword: string) => request<{ message: string }>("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password, confirmPassword }) }),

  currentRelease: (platform: "ANDROID" | "IOS", build: number) =>
    request<{ ready: boolean; updateRequired?: boolean; android: { minimumBuildNumber?: number | null; isMandatory?: boolean; updateRequired?: boolean; url: string; appStoreUrl?: string | null } | null; ios: { minimumBuildNumber?: number | null; isMandatory?: boolean; updateRequired?: boolean; url: string; appStoreUrl?: string | null } | null }>(`/api/mobile/releases/current?platform=${platform}&build=${build}`),

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

  getPlayback: (id: string, token: string) =>
    request<{ otp: string; playbackInfo: string; videoId: string; sessionCode: string; expiresIn: number }>(
      `/api/content/${id}/playback`,
      { method: "POST", token, body: JSON.stringify({ client: "mobile" }) }
    ),

  getDocumentManifest: (id: string, token: string, page = 1) =>
    request<DocumentManifest>(`/api/content/${id}/document/manifest?page=${page}`, { token }),

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
          avatarUrl?: string | null
          progress?: Array<{
            id: string
            progressPercent: number
            completed: boolean
            lastAccessed: string
            content: { id: string; titleFr: string; titleAr: string }
          }>
        }
      }>
    }>("/api/parents/children", { token }),

  getProgress: (token: string) =>
    request<{ items: ProgressItem[] }>("/api/progress", { token }),

  updateProgress: (token: string, contentId: string, progressPercent: number) =>
    request<ProgressItem>("/api/progress", {
      method: "POST",
      token,
      body: JSON.stringify({ contentId, progressPercent }),
    }),

  getSubscription: (token: string) =>
    request<{ subscription: Subscription | null }>("/api/subscriptions/me", { token }),

  getProfile: (token: string) =>
    request<{ user: MobileUser; subscription: Subscription | null }>("/api/users/me", { token }),

  updateProfile: (
    token: string,
    input: Partial<
      Pick<MobileUser, "fullName" | "phone" | "avatarUrl" | "preferredLanguage" | "emailNotifications">
    >
  ) =>
    request<{ user: MobileUser }>("/api/users/me", {
      method: "PATCH",
      token,
      body: JSON.stringify(input),
    }),

  changePassword: (
    token: string,
    input: { currentPassword: string; newPassword: string; confirmPassword: string }
  ) =>
    request<{ message: string }>("/api/users/me/password", {
      method: "POST",
      token,
      body: JSON.stringify(input),
    }),

  postReview: (token: string, contentId: string, rating: number, comment?: string) =>
    request<{ id: string }>("/api/reviews", {
      method: "POST",
      token,
      body: JSON.stringify({ contentId, rating, comment }),
    }),

  getInvitations: (token: string) =>
    request<{
      invitations: Array<{
        id: string
        parent: { id: string; fullName: string; email: string }
      }>
    }>("/api/parents/respond", { token }),

  respondInvitation: (token: string, linkId: string, action: "ACCEPT" | "REJECT") =>
    request<{ id: string; status: string }>("/api/parents/respond", {
      method: "POST",
      token,
      body: JSON.stringify({ linkId, action }),
    }),

  linkChild: (token: string, childIdentifier: string) =>
    request<{ id: string; status: string }>("/api/parents/link", {
      method: "POST",
      token,
      body: JSON.stringify({ childIdentifier }),
    }),

  askHelp: (token: string, message: string, language: "fr" | "ar") =>
    request<{ reply: string; mode: string }>("/api/mobile/chat", {
      method: "POST",
      token,
      body: JSON.stringify({ message, language }),
    }),

  registerPushToken: (token: string, expoPushToken: string) =>
    request<{ ok: boolean }>("/api/mobile/push/register", {
      method: "POST",
      token,
      body: JSON.stringify({ expoPushToken, platform: "android" }),
    }),

  unregisterPushToken: (token: string, expoPushToken: string) =>
    request<{ ok: boolean }>("/api/mobile/push/register", {
      method: "DELETE",
      token,
      body: JSON.stringify({ expoPushToken }),
    }),
}

export async function uploadAvatar(
  token: string,
  asset: { uri: string; mimeType?: string | null; fileName?: string | null }
): Promise<{ avatarUrl: string; user: MobileUser }> {
  const form = new FormData()
  form.append(
    "file",
    {
      uri: asset.uri,
      type: asset.mimeType || "image/jpeg",
      name: asset.fileName || "avatar.jpg",
    } as unknown as Blob
  )
  const response = await fetch(`${getApiBaseUrl()}/api/users/me/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${response.status}`)
  }
  return data as { avatarUrl: string; user: MobileUser }
}
