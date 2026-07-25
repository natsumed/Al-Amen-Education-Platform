import { NextRequest, NextResponse } from "next/server"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
])

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const form = await req.formData()
    const file = form.get("file")
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Fichier image requis" }, { status: 400 })
    }

    const ext = ALLOWED.get(file.type)
    if (!ext) {
      return NextResponse.json(
        { error: "Formats acceptés: JPG, JPEG, PNG" },
        { status: 400 }
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image trop volumineuse (max 2 Mo)" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const dir = path.join(process.cwd(), "public", "uploads", "avatars")
    await mkdir(dir, { recursive: true })

    const filename = `${session.user.id}.${ext}`
    const diskPath = path.join(dir, filename)
    await writeFile(diskPath, buffer)

    // Cache-bust so browsers refresh the new image
    const avatarUrl = `/uploads/avatars/${filename}?v=${Date.now()}`

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl },
      select: {
        id: true,
        publicId: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        phone: true,
        preferredLanguage: true,
        emailNotifications: true,
      },
    })

    return NextResponse.json({ avatarUrl, user })
  } catch (error) {
    console.error("POST /api/users/me/avatar", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
