import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side client with service role key for storage operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const BUCKET = "content"

export async function uploadFile(
  file: File,
  path: string
): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true })

  if (error) {
    console.error("Upload error:", error)
    return null
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

export async function uploadBuffer(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true })

  if (error) {
    console.error("Upload buffer error:", error)
    return null
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

export async function getSignedUrl(
  path: string,
  expiresInSeconds = 300
): Promise<string | null> {
  // Extract the relative path from a full public URL if needed
  const relativePath = path.includes("/storage/v1/object/public/")
    ? path.split(`/storage/v1/object/public/${BUCKET}/`)[1]
    : path

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
  const relativePath = path.includes("/storage/v1/object/public/")
    ? path.split(`/storage/v1/object/public/${BUCKET}/`)[1]
    : path

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([relativePath])

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
