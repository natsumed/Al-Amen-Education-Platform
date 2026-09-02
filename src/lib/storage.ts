import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const BUCKET = "content"

function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function uploadFile(file: File, path: string): Promise<string | null> {
  const supabaseAdmin = getAdminClient()
  if (!supabaseAdmin) {
    console.warn("Supabase not configured — upload skipped")
    return null
  }

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) {
    console.error("Upload error:", error)
    return null
  }

  return data.path
}

export async function uploadBuffer(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<string | null> {
  const supabaseAdmin = getAdminClient()
  if (!supabaseAdmin) {
    console.warn("Supabase not configured — upload skipped")
    return null
  }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true })

  if (error) {
    console.error("Upload buffer error:", error)
    return null
  }

  return data.path
}

export async function getSignedUrl(path: string, expiresInSeconds = 300): Promise<string | null> {
  const supabaseAdmin = getAdminClient()
  if (!supabaseAdmin) return null

  const relativePath = path.includes("/storage/v1/object/public/")
    ? path.split(`/storage/v1/object/public/${BUCKET}/`)[1]
    : path

  if (!relativePath || /^https?:\/\//i.test(relativePath)) return null

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(relativePath, expiresInSeconds)

  if (error) {
    console.error("Signed URL error:", error)
    return null
  }

  return data.signedUrl
}

export async function deleteFile(path: string): Promise<boolean> {
  const supabaseAdmin = getAdminClient()
  if (!supabaseAdmin) return false

  const relativePath = path.includes("/storage/v1/object/public/")
    ? path.split(`/storage/v1/object/public/${BUCKET}/`)[1]
    : path

  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([relativePath])
  if (error) {
    console.error("Delete error:", error)
    return false
  }
  return true
}

export function getContentPath(
  contentId: string,
  type: "thumbnail" | "pdf" | "gif" | "file",
  filename: string
): string {
  return `${contentId}/${type}/${filename}`
}
