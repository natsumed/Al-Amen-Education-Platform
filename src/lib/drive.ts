import { createHash } from "node:crypto"
import { importPKCS8, SignJWT } from "jose"

const DRIVE_API = "https://www.googleapis.com/drive/v3"
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly"

export type DriveFile = {
  id: string
  name: string
  mimeType: string
  size?: string
  md5Checksum?: string
  modifiedTime?: string
  parents?: string[]
  owners?: Array<{ emailAddress?: string; displayName?: string }>
  permissions?: Array<{ type?: string; role?: string; emailAddress?: string }>
}

type DriveListResponse = { files?: DriveFile[]; nextPageToken?: string }

let cachedToken: { value: string; expiresAt: number } | null = null

function credentials() {
  const raw = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error("GOOGLE_DRIVE_NOT_CONFIGURED")
  const parsed = JSON.parse(raw) as { client_email?: string; private_key?: string }
  if (!parsed.client_email || !parsed.private_key) throw new Error("GOOGLE_DRIVE_CREDENTIALS_INVALID")
  return parsed as { client_email: string; private_key: string }
}

async function accessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value
  const service = credentials()
  const key = await importPKCS8(service.private_key.replace(/\\n/g, "\n"), "RS256")
  const assertion = await new SignJWT({ scope: DRIVE_SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(service.client_email)
    .setAudience(TOKEN_ENDPOINT)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key)
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
  })
  if (!response.ok) throw new Error("GOOGLE_DRIVE_TOKEN_FAILED")
  const data = await response.json() as { access_token?: string; expires_in?: number }
  if (!data.access_token) throw new Error("GOOGLE_DRIVE_TOKEN_INVALID")
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 }
  return data.access_token
}

async function driveFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, ...(init?.headers || {}) },
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`GOOGLE_DRIVE_HTTP_${response.status}`)
  return response.json() as Promise<T>
}

export function driveConfigured() {
  return Boolean(process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON && driveMastersFolderId())
}

/**
 * The worker is intentionally scoped to 01_Masters. The broader library root
 * is useful for provenance and review, but must never be treated as a source
 * of publishable learner content.
 */
export function driveMastersFolderId() {
  return process.env.GOOGLE_DRIVE_MASTERS_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || ""
}

export function hashDriveId(id: string) {
  return createHash("sha256").update(`drive:${id}`).digest("hex")
}

export function hasExpectedFileSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "application/pdf") return buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (mimeType === "image/jpeg") return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
  if (mimeType === "image/webp") return buffer.subarray(0, 4).equals(Buffer.from("RIFF")) && buffer.subarray(8, 12).equals(Buffer.from("WEBP"))
  if (mimeType === "video/mp4") return buffer.subarray(4, 8).equals(Buffer.from("ftyp"))
  if (mimeType === "video/webm") return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
  return false
}

export async function getDriveFile(fileId: string) {
  const fields = "id,name,mimeType,size,md5Checksum,modifiedTime,parents,owners,permissions"
  return driveFetch<DriveFile>(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(fields)}`)
}

export async function listDriveChildren(parentId: string) {
  const files: DriveFile[] = []
  let pageToken = ""
  do {
    const params = new URLSearchParams({
      q: `'${parentId.replace(/'/g, "\\'")}' in parents and trashed = false`,
      pageSize: "1000",
      fields: "nextPageToken,files(id,name,mimeType,size,md5Checksum,modifiedTime,parents,owners,permissions)",
      orderBy: "name",
    })
    if (pageToken) params.set("pageToken", pageToken)
    const page = await driveFetch<DriveListResponse>(`${DRIVE_API}/files?${params}`)
    files.push(...(page.files || []))
    pageToken = page.nextPageToken || ""
  } while (pageToken)
  return files
}

export async function listDriveTree(rootId = driveMastersFolderId()) {
  if (!rootId) throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID_REQUIRED")
  const output: Array<DriveFile & { relativePath: string }> = []
  const visit = async (folderId: string, relativePath: string, depth: number): Promise<void> => {
    if (depth > 12) throw new Error("GOOGLE_DRIVE_TREE_TOO_DEEP")
    for (const file of await listDriveChildren(folderId)) {
      const nextPath = relativePath ? `${relativePath}/${file.name}` : file.name
      if (file.mimeType === "application/vnd.google-apps.folder") await visit(file.id, nextPath, depth + 1)
      else output.push({ ...file, relativePath: nextPath })
    }
  }
  await visit(rootId, "", 0)
  return output
}

export type DriveLibraryEntry = (DriveFile & { relativePath: string; kind: "FILE" | "FOLDER" })

/** Returns a safe admin-facing index of the configured private masters tree. */
export async function listDriveLibrary(rootId = driveMastersFolderId()) {
  if (!rootId) throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID_REQUIRED")
  const output: DriveLibraryEntry[] = []
  const visit = async (folderId: string, relativePath: string, depth: number): Promise<void> => {
    if (depth > 12) throw new Error("GOOGLE_DRIVE_TREE_TOO_DEEP")
    for (const file of await listDriveChildren(folderId)) {
      const nextPath = relativePath ? `${relativePath}/${file.name}` : file.name
      if (file.mimeType === "application/vnd.google-apps.folder") {
        output.push({ ...file, relativePath: nextPath, kind: "FOLDER" })
        await visit(file.id, nextPath, depth + 1)
      } else {
        output.push({ ...file, relativePath: nextPath, kind: "FILE" })
      }
    }
  }
  await visit(rootId, "", 0)
  return output
}

export async function downloadDriveFile(fileId: string) {
  const response = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`, {
    headers: { Authorization: `Bearer ${await accessToken()}` },
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`GOOGLE_DRIVE_DOWNLOAD_${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

export function classifyDrivePath(relativePath: string, name: string) {
  const value = `${relativePath} ${name}`.toLocaleLowerCase()
  const edition = name.match(/(?:^|\s|[-_])0?(\d{1,2})(?:\s|[-_.]|$)/)?.[1]
  if (value.includes("cover") || value.includes("isbn") || value.includes("impression") || value.includes("print")) {
    return { category: "INTERNAL_PRODUCTION", audience: "INTERNAL", editionLabel: edition ? edition.padStart(2, "0") : null }
  }
  if (value.includes("teacher") || value.includes("maitre") || value.includes("fiche")) {
    return { category: "TEACHER_RESOURCE", audience: "TEACHER", editionLabel: edition ? edition.padStart(2, "0") : null }
  }
  if (value.includes("story") || value.includes("conte") || value.includes("abd") || /عبد|قصة|قصص/.test(value)) {
    return { category: "STORYBOOK", audience: "LEARNER", editionLabel: edition ? edition.padStart(2, "0") : null }
  }
  if (
    value.includes("workbook") || value.includes("writing") || value.includes("spelling") || value.includes("grammar") ||
    value.includes("conjugation") || value.includes("production") || value.includes("orthographe") ||
    value.includes("grammaire") || value.includes("conjugaison") || /كتاب|منهاج|كتابة|إملاء|املاء|قواعد|تصريف|تعبير/.test(value)
  ) {
    return { category: "STUDENT_WORKBOOK", audience: "LEARNER", editionLabel: edition ? edition.padStart(2, "0") : null }
  }
  return { category: "REVIEW_REQUIRED", audience: "INTERNAL", editionLabel: edition ? edition.padStart(2, "0") : null }
}

export function detectDriveLanguage(relativePath: string, name: string) {
  const value = `${relativePath} ${name}`.toLocaleLowerCase()
  if (/\b(english|anglais|en)\b/.test(value)) return "EN"
  if (/\b(french|francais|français|fr)\b/.test(value)) return "FR"
  if (/عربي|العربية|arabic|arabe/.test(value)) return "AR"
  return "MULTI"
}
