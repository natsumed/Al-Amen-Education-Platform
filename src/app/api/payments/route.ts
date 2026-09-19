import { randomUUID } from "node:crypto"
import { PaymentStatus, Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"
import { paymentLimiter } from "@/lib/rate-limit"
import { createPaymentSchema } from "@/lib/validations"
import { createPaymentOrder } from "@/lib/payment"

function validMutationOrigin(req: NextRequest) {
  const origin = req.headers.get("origin")
  if (!origin) return true
  const allowed = [process.env.NEXT_PUBLIC_APP_URL, process.env.AUTH_URL, process.env.NEXTAUTH_URL]
    .filter(Boolean).map((value) => new URL(value!).origin)
  return allowed.includes(origin)
}

function statusForError(code: string) {
  if (code.includes("FORBIDDEN") || code.includes("ROLE") || code.includes("LINK_REQUIRED")) return 403
  if (code.includes("NOT_FOUND")) return 404
  if (code.includes("ALREADY") || code.includes("STATE_CONFLICT") || code.includes("IDEMPOTENCY")) return 409
  if (code.includes("UNAVAILABLE") || code.includes("NOT_CONFIGURED") || code.includes("OFFICIAL_KIT")) return 503
  return 400
}

export async function POST(req: NextRequest) {
  try {
    if (!validMutationOrigin(req)) return NextResponse.json({ error: "Origin forbidden" }, { status: 403 })
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const limit = await paymentLimiter.check(user.id)
    if (!limit.allowed) return NextResponse.json({ error: "Trop de tentatives de paiement", retryAt: limit.resetAt }, { status: 429 })

    const parsed = createPaymentSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const value = parsed.data
    const productKind = value.productKind || value.itemType!
    const productId = value.productId || value.plan || value.itemId!
    const provider = value.provider === "MANUAL" ? "MANUAL_CASH" : value.provider
    const suppliedKey = req.headers.get("idempotency-key")?.trim()
    const idempotencyKey = suppliedKey && /^[a-zA-Z0-9_.:-]{8,100}$/.test(suppliedKey) ? suppliedKey : randomUUID()
    const result = await createPaymentOrder(user, {
      productKind, productId, provider, beneficiaryId: value.beneficiaryId,
      idempotencyKey, termsAccepted: true,
    })
    return NextResponse.json(result, {
      status: result.status === "PENDING_REVIEW" ? 202 : 201,
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYMENT_CREATE_FAILED"
    console.error("Payment create failed", { code })
    return NextResponse.json({ error: code, code }, { status: statusForError(code), headers: { "Cache-Control": "no-store" } })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const url = new URL(req.url)
    const page = Math.max(1, Number(url.searchParams.get("page") || 1))
    const statusParam = url.searchParams.get("status")
    if (statusParam && !Object.values(PaymentStatus).includes(statusParam as PaymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 })
    }
    const status = statusParam as PaymentStatus | null
    const limit = 20
    const where: Prisma.PaymentWhereInput = {
      ...(user.role === "ADMIN" ? {} : { userId: user.id }),
      ...(status ? { status } : {}),
    }
    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        select: {
          id: true, userId: true, beneficiaryUserId: true, productKind: true, productId: true,
          productTitle: true, amountMillis: true, currency: true, provider: true, status: true,
          merchantOrderRef: true, failureCode: true, createdAt: true, updatedAt: true,
          settledAt: true, refundedAt: true, expiresAt: true,
          user: { select: { fullName: true, email: true, publicId: true } },
          beneficiary: { select: { fullName: true, email: true, publicId: true, id: true } },
        },
        orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      prisma.payment.count({ where }),
    ])
    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) }, { headers: { "Cache-Control": "private, no-store" } })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
