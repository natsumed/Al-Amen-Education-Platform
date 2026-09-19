import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

function publicJob<T extends { sourceRefEncrypted?: string }>(job: T) {
  const { sourceRefEncrypted, ...safe } = job
  void sourceRefEncrypted
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
  return NextResponse.json({ error: "Cette ancienne route est désactivée. Utilisez la sélection Drive privée de /admin/content/new.", code: "USE_PRIVATE_DRIVE_INTAKE" }, { status: 410 })
}
