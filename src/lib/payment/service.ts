import { createHash, randomBytes } from "node:crypto"
import {
  EntitlementStatus,
  PaymentGrantSource,
  PaymentProductKind,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from "@prisma/client"
import { prisma } from "../prisma"
import { encryptSecret } from "../security-crypto"
import type { AuthUser } from "../request-auth"
import {
  getClicToPayReadiness,
  isMockClicToPayEnabled,
  MockClicToPayProvider,
  SmtClicToPayProvider,
} from "./clictopay"
import { getPaidSubscriptionPlan, isPaidSubscriptionPlan, millisToTnd } from "./catalog"
import { nextSubscriptionWindow, paymentVerificationMatches } from "./rules"
import type { GatewayPaymentStatus } from "./types"

const UNRESOLVED: PaymentStatus[] = [
  "CREATED",
  "PENDING_REVIEW",
  "REDIRECT_READY",
  "PROCESSING",
  "RECONCILIATION_REQUIRED",
]

function clicToPayProvider() {
  return isMockClicToPayEnabled() ? new MockClicToPayProvider() : new SmtClicToPayProvider()
}

type Db = Prisma.TransactionClient

export type CreatePaymentInput = {
  productKind: "SUBSCRIPTION" | "CONTENT"
  productId: string
  provider: "MANUAL_CASH" | "CLICTOPAY"
  beneficiaryId?: string
  idempotencyKey: string
  termsAccepted: true
}

type ProductSnapshot = {
  productKind: PaymentProductKind
  productId: string
  productTitle: string
  plan: string | null
  planDurationDays: number | null
  amountMillis: number
  targetUserId: string
}

function merchantOrderRef() {
  return `AMEN-${randomBytes(16).toString("hex").toUpperCase()}`
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 86_400_000)
}

function publicPayment<T extends {
  id: string
  merchantOrderRef: string
  status: PaymentStatus
  provider: PaymentProvider
  productKind: PaymentProductKind
  productId: string
  productTitle: string
  amountMillis: number
  currency: string
  beneficiaryUserId: string | null
  expiresAt: Date | null
}>(payment: T, redirectUrl?: string) {
  return {
    paymentId: payment.id,
    merchantOrderRef: payment.merchantOrderRef,
    status: payment.status,
    provider: payment.provider,
    productKind: payment.productKind,
    productId: payment.productId,
    productTitle: payment.productTitle,
    amountMillis: payment.amountMillis,
    amountTnd: millisToTnd(payment.amountMillis),
    currency: payment.currency,
    beneficiaryUserId: payment.beneficiaryUserId,
    expiresAt: payment.expiresAt,
    redirectUrl,
  }
}

async function findTargetUser(tx: Db, payer: AuthUser, beneficiaryIdentifier?: string) {
  if (payer.role !== "PARENT") {
    if (!['STUDENT', 'TEACHER'].includes(payer.role)) throw new Error("PAYMENT_ROLE_FORBIDDEN")
    return tx.user.findUniqueOrThrow({
      where: { id: payer.id },
      select: { id: true, role: true, email: true, fullName: true, preferredLanguage: true },
    })
  }

  if (!beneficiaryIdentifier) throw new Error("PAYMENT_BENEFICIARY_REQUIRED")
  const normalized = beneficiaryIdentifier.trim().toLowerCase()
  const child = await tx.user.findFirst({
    where: {
      role: "STUDENT",
      OR: [{ id: beneficiaryIdentifier }, { publicId: beneficiaryIdentifier }, { email: normalized }],
    },
    select: { id: true, role: true, email: true, fullName: true, preferredLanguage: true },
  })
  if (!child) throw new Error("PAYMENT_BENEFICIARY_NOT_FOUND")
  const link = await tx.parentLink.findUnique({
    where: { parentId_studentId: { parentId: payer.id, studentId: child.id } },
    select: { status: true },
  })
  if (link?.status !== "ACCEPTED") throw new Error("PAYMENT_BENEFICIARY_LINK_REQUIRED")
  return child
}

async function resolveProduct(tx: Db, payer: AuthUser, input: CreatePaymentInput): Promise<ProductSnapshot> {
  const target = await findTargetUser(tx, payer, input.beneficiaryId)

  if (input.productKind === "SUBSCRIPTION") {
    if (!isPaidSubscriptionPlan(input.productId)) throw new Error("PAYMENT_PRODUCT_INVALID")
    const plan = getPaidSubscriptionPlan(input.productId)
    if (target.role !== plan.role) throw new Error("PAYMENT_PLAN_ROLE_MISMATCH")
    return {
      productKind: "SUBSCRIPTION",
      productId: plan.id,
      productTitle: plan.title,
      plan: plan.id,
      planDurationDays: plan.durationDays,
      amountMillis: plan.amountMillis,
      targetUserId: target.id,
    }
  }

  const content = await tx.content.findUnique({
    where: { id: input.productId },
    select: {
      id: true,
      titleFr: true,
      titleAr: true,
      isFree: true,
      price: true,
      priceMillis: true,
      status: true,
      audience: true,
      assets: { where: { status: "READY" }, select: { id: true }, take: 1 },
    },
  })
  if (!content || content.status !== "PUBLISHED" || content.isFree) throw new Error("PAYMENT_CONTENT_NOT_PURCHASABLE")
  if (content.audience === "INTERNAL" || content.audience === "TEACHER" && target.role !== "TEACHER") {
    throw new Error("PAYMENT_CONTENT_ROLE_FORBIDDEN")
  }
  if (!content.assets.length) throw new Error("PAYMENT_CONTENT_NOT_READY")
  const amountMillis = content.priceMillis ?? (content.price == null ? 0 : Math.round(content.price * 1_000))
  if (!Number.isSafeInteger(amountMillis) || amountMillis <= 0) throw new Error("PAYMENT_CONTENT_PRICE_INVALID")
  const purchase = await tx.purchase.findUnique({
    where: { userId_contentId: { userId: target.id, contentId: content.id } },
    select: { status: true },
  })
  if (purchase?.status === "ACTIVE") throw new Error("PAYMENT_CONTENT_ALREADY_OWNED")

  return {
    productKind: "CONTENT",
    productId: content.id,
    productTitle: content.titleFr || content.titleAr,
    plan: null,
    planDurationDays: null,
    amountMillis,
    targetUserId: target.id,
  }
}

function validateRedirectUrl(value: string) {
  const parsed = new URL(value)
  const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  if (isMockClicToPayEnabled()) {
    if (parsed.origin !== appUrl.origin) throw new Error("PAYMENT_REDIRECT_HOST_INVALID")
    return
  }
  if (parsed.protocol !== "https:") throw new Error("PAYMENT_REDIRECT_HTTPS_REQUIRED")
  const configured = (process.env.CLICTOPAY_ALLOWED_REDIRECT_HOSTS || "")
    .split(",").map((host) => host.trim().toLowerCase()).filter(Boolean)
  if (!configured.includes(parsed.hostname.toLowerCase())) throw new Error("PAYMENT_REDIRECT_HOST_INVALID")
}

export function getAvailablePaymentMethods() {
  const clic = getClicToPayReadiness()
  return [
    { provider: "MANUAL_CASH" as const, available: true, reason: null },
    { provider: "CLICTOPAY" as const, available: clic.available, reason: clic.reason, mode: clic.mode },
  ]
}

export async function createPaymentOrder(payer: AuthUser, input: CreatePaymentInput) {
  if (input.provider === "CLICTOPAY" && !getClicToPayReadiness().available) {
    throw new Error("PAYMENT_METHOD_UNAVAILABLE")
  }

  const idempotencyFingerprint = createHash("sha256").update(JSON.stringify({
    userId: payer.id,
    productKind: input.productKind,
    productId: input.productId,
    provider: input.provider,
    beneficiaryId: input.beneficiaryId?.trim().toLowerCase() || null,
  })).digest("hex")

  const payment = await prisma.$transaction(async (tx) => {
    const existing = await tx.payment.findUnique({
      where: { userId_idempotencyKey: { userId: payer.id, idempotencyKey: input.idempotencyKey } },
    })
    if (existing) {
      if (existing.idempotencyFingerprint !== idempotencyFingerprint) {
        throw new Error("PAYMENT_IDEMPOTENCY_KEY_REUSED")
      }
      return existing
    }

    const product = await resolveProduct(tx, payer, input)
    const beneficiaryUserId = product.targetUserId === payer.id ? null : product.targetUserId
    const duplicate = await tx.payment.findFirst({
      where: {
        userId: payer.id,
        beneficiaryUserId,
        productKind: product.productKind,
        productId: product.productId,
        status: { in: UNRESOLVED },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
    })
    if (duplicate) {
      if (duplicate.provider !== input.provider) throw new Error("PAYMENT_ORDER_ALREADY_PENDING")
      return duplicate
    }

    const now = new Date()
    const created = await tx.payment.create({
      data: {
        userId: payer.id,
        beneficiaryUserId,
        productKind: product.productKind,
        productId: product.productId,
        productTitle: product.productTitle,
        plan: product.plan,
        planDurationDays: product.planDurationDays,
        amount: millisToTnd(product.amountMillis),
        amountMillis: product.amountMillis,
        currency: "TND",
        provider: input.provider,
        status: input.provider === "MANUAL_CASH" ? "PENDING_REVIEW" : "CREATED",
        merchantOrderRef: merchantOrderRef(),
        idempotencyKey: input.idempotencyKey,
        idempotencyFingerprint,
        termsAcceptedAt: now,
        initiatedAt: now,
        expiresAt: input.provider === "MANUAL_CASH" ? addDays(now, 7) : addDays(now, 1),
        itemType: product.productKind,
        itemId: product.productId,
      },
    })
    await tx.auditEvent.create({
      data: {
        userId: payer.id,
        action: "PAYMENT_CREATED",
        targetType: "Payment",
        targetId: created.id,
        metadata: { provider: created.provider, productKind: created.productKind, amountMillis: created.amountMillis },
      },
    })
    if (created.provider === "MANUAL_CASH") {
      await queuePaymentEmail(tx, created, {
        type: "PAYMENT_CASH_PENDING",
        subject: "Paiement en espèces en attente — Amenallah Edition",
        detail: "Votre demande est enregistrée. L’accès sera activé après confirmation de la réception du paiement.",
      })
    }
    return created
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

  if (payment.provider === "MANUAL_CASH" || payment.status !== "CREATED") return publicPayment(payment)

  const provider = clicToPayProvider()
  const origin = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")
  try {
    const registration = await provider.registerPayment({
      paymentId: payment.id,
      merchantOrderRef: payment.merchantOrderRef,
      amountMillis: payment.amountMillis,
      currency: "TND",
      description: payment.productTitle,
      successUrl: `${origin}/checkout/clictopay/success?paymentId=${encodeURIComponent(payment.id)}`,
      failureUrl: `${origin}/checkout/clictopay/failure?paymentId=${encodeURIComponent(payment.id)}`,
      notificationUrl: `${origin}/api/payments/clictopay/notify`,
    })
    validateRedirectUrl(registration.redirectUrl)
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerOrderRef: registration.providerOrderRef,
        expiresAt: registration.expiresAt,
        redirectedAt: new Date(),
        status: "REDIRECT_READY",
      },
    })
    return publicPayment(updated, registration.redirectUrl)
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYMENT_INITIATION_FAILED"
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "INITIATION_FAILED", failureCode: code.slice(0, 100), failedAt: new Date() },
    })
    throw error
  }
}

function encryptedMail(subject: string, html: string, text: string) {
  if (!process.env.DATA_ENCRYPTION_KEY) return null
  return encryptSecret(JSON.stringify({ subject, html, text }))
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[character] || character))
}

async function queuePaymentEmail(tx: Db, payment: {
  id: string
  merchantOrderRef: string
  productTitle: string
  amountMillis: number
  userId: string
}, message: { type: string; subject: string; detail: string }) {
  const user = await tx.user.findUnique({
    where: { id: payment.userId },
    select: { email: true, fullName: true, preferredLanguage: true },
  })
  if (!user) return
  const amount = `${millisToTnd(payment.amountMillis).toFixed(3)} TND`
  const text = `Bonjour ${user.fullName},\n\n${message.detail}\n\nRéférence : ${payment.merchantOrderRef}\nProduit : ${payment.productTitle}\nMontant : ${amount}`
  const html = `<div style="font-family:Arial,sans-serif"><h1>Amenallah Edition</h1><p>Bonjour ${escapeHtml(user.fullName)},</p><p>${escapeHtml(message.detail)}</p><p>Référence : <strong>${escapeHtml(payment.merchantOrderRef)}</strong><br>Produit : ${escapeHtml(payment.productTitle)}<br>Montant : <strong>${amount}</strong></p></div>`
  const payloadEncrypted = encryptedMail(message.subject, html, text)
  if (!payloadEncrypted) return
  await tx.emailOutbox.upsert({
    where: { idempotencyKey: `${message.type}:${payment.id}` },
    update: {},
    create: {
      userId: payment.userId,
      type: message.type,
      recipient: user.email,
      locale: user.preferredLanguage || "fr",
      idempotencyKey: `${message.type}:${payment.id}`,
      payloadEncrypted,
    },
  })
}

async function queuePaymentReconciliationAlert(tx: Db, payment: {
  id: string
  merchantOrderRef: string
  productTitle: string
  amountMillis: number
}) {
  const recipient = process.env.SMTP_REPLY_TO || process.env.SMTP_USER
  if (!recipient) return
  const subject = "Alerte de rapprochement paiement — Amenallah Edition"
  const text = `Le paiement ${payment.merchantOrderRef} nécessite une vérification manuelle. Aucun accès supplémentaire ne doit être accordé avant rapprochement.`
  const html = `<div style="font-family:Arial,sans-serif"><h1>Alerte paiement</h1><p>${escapeHtml(text)}</p></div>`
  const payloadEncrypted = encryptedMail(subject, html, text)
  if (!payloadEncrypted) return
  await tx.emailOutbox.upsert({
    where: { idempotencyKey: `PAYMENT_RECONCILIATION:${payment.id}` },
    update: {},
    create: {
      type: "PAYMENT_RECONCILIATION",
      recipient,
      idempotencyKey: `PAYMENT_RECONCILIATION:${payment.id}`,
      payloadEncrypted,
    },
  })
}

async function queuePaymentReceipt(tx: Db, payment: {
  id: string
  merchantOrderRef: string
  productTitle: string
  amountMillis: number
  beneficiaryUserId: string | null
  userId: string
}) {
  await queuePaymentEmail(tx, payment, {
    type: "PAYMENT_RECEIVED",
    subject: "Paiement confirmé — Amenallah Edition",
    detail: "Votre paiement est confirmé et l’accès correspondant est actif.",
  })
}

async function grantSubscription(tx: Db, payment: {
  id: string
  userId: string
  beneficiaryUserId: string | null
  plan: string | null
  planDurationDays: number | null
}) {
  if (!payment.plan || !payment.planDurationDays) throw new Error("PAYMENT_PLAN_SNAPSHOT_INVALID")
  const targetUserId = payment.beneficiaryUserId || payment.userId
  const existingGrant = await tx.subscriptionGrant.findUnique({ where: { paymentId: payment.id } })
  if (existingGrant) return existingGrant

  const now = new Date()
  const latestGrant = await tx.subscriptionGrant.findFirst({
    where: { userId: targetUserId, status: "ACTIVE" },
    orderBy: { endsAt: "desc" },
  })
  const currentSubscription = await tx.subscription.findFirst({
    where: { userId: targetUserId, status: "ACTIVE" },
    orderBy: { endDate: "desc" },
  })
  const { startsAt, endsAt } = nextSubscriptionWindow({
    now,
    latestGrantEndsAt: latestGrant?.endsAt,
    currentSubscriptionEndsAt: currentSubscription?.endDate,
    durationDays: payment.planDurationDays,
  })
  const grant = await tx.subscriptionGrant.create({
    data: {
      userId: targetUserId,
      paymentId: payment.id,
      plan: payment.plan,
      source: "PAYMENT",
      durationDays: payment.planDurationDays,
      startsAt,
      endsAt,
    },
  })
  if (currentSubscription) {
    await tx.subscription.update({
      where: { id: currentSubscription.id },
      data: { plan: payment.plan, status: "ACTIVE", endDate: endsAt, autoRenew: false },
    })
  } else {
    await tx.subscription.create({
      data: { userId: targetUserId, plan: payment.plan, status: "ACTIVE", startDate: startsAt, endDate: endsAt, autoRenew: false },
    })
  }
  return grant
}

async function grantContent(tx: Db, payment: { id: string; userId: string; beneficiaryUserId: string | null; productId: string }) {
  const targetUserId = payment.beneficiaryUserId || payment.userId
  return tx.purchase.upsert({
    where: { userId_contentId: { userId: targetUserId, contentId: payment.productId } },
    update: { paymentId: payment.id, status: "ACTIVE", revokedAt: null },
    create: { userId: targetUserId, contentId: payment.productId, paymentId: payment.id, status: "ACTIVE" },
  })
}

export async function settleVerifiedPayment(
  paymentId: string,
  verified: GatewayPaymentStatus,
  eventId?: string,
  manualReview?: { actorId: string; action: string; reason: string }
) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } })
    if (!payment) throw new Error("PAYMENT_NOT_FOUND")
    if (payment.status === "SUCCEEDED") {
      if (eventId) {
        await tx.paymentEvent.update({ where: { id: eventId }, data: { processedAt: new Date(), processingError: null } })
      }
      return payment
    }
    if (!paymentVerificationMatches(payment, verified)) {
      const conflicted = await tx.payment.update({
        where: { id: payment.id },
        data: { status: "RECONCILIATION_REQUIRED", failureCode: "PAYMENT_VERIFICATION_MISMATCH", reconciledAt: new Date() },
      })
      await tx.auditEvent.create({
        data: { action: "PAYMENT_VERIFICATION_MISMATCH", targetType: "Payment", targetId: payment.id, metadata: { merchantOrderRef: payment.merchantOrderRef } },
      })
      await queuePaymentReconciliationAlert(tx, payment)
      return conflicted
    }
    if (verified.status !== "SUCCEEDED") throw new Error("PAYMENT_NOT_SUCCESSFUL")

    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: { in: UNRESOLVED } },
      data: { status: "PROCESSING" },
    })
    if (claimed.count !== 1) {
      const current = await tx.payment.findUniqueOrThrow({ where: { id: payment.id } })
      if (current.status === "SUCCEEDED") return current
      throw new Error("PAYMENT_STATE_CONFLICT")
    }

    if (payment.productKind === "SUBSCRIPTION") await grantSubscription(tx, payment)
    else await grantContent(tx, payment)

    const now = new Date()
    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCEEDED",
        providerOrderRef: verified.providerOrderRef || payment.providerOrderRef,
        providerTransactionRef: verified.providerTransactionRef || payment.providerTransactionRef,
        transactionRef: verified.providerTransactionRef || payment.transactionRef || payment.merchantOrderRef,
        verifiedAt: now,
        settledAt: now,
        reconciledAt: now,
        failureCode: null,
        failureMessage: null,
      },
    })
    if (eventId) {
      await tx.paymentEvent.update({ where: { id: eventId }, data: { processedAt: now, processingError: null } })
    }
    await tx.auditEvent.create({
      data: {
        userId: payment.userId,
        action: "PAYMENT_SUCCEEDED",
        targetType: "Payment",
        targetId: payment.id,
        metadata: { provider: payment.provider, productKind: payment.productKind, amountMillis: payment.amountMillis },
      },
    })
    if (manualReview) {
      await tx.auditEvent.create({
        data: {
          userId: manualReview.actorId,
          action: manualReview.action,
          targetType: "Payment",
          targetId: payment.id,
          metadata: { reason: manualReview.reason.slice(0, 500) },
        },
      })
    }
    await queuePaymentReceipt(tx, payment)
    return updated
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function approveManualCashPayment(adminId: string, paymentId: string, reason: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment) throw new Error("PAYMENT_NOT_FOUND")
  if (payment.provider !== "MANUAL_CASH") throw new Error("ONLINE_PAYMENT_MANUAL_APPROVAL_FORBIDDEN")
  if (payment.status !== "PENDING_REVIEW") throw new Error("PAYMENT_STATE_CONFLICT")
  return settleVerifiedPayment(payment.id, {
    merchantOrderRef: payment.merchantOrderRef,
    providerOrderRef: payment.providerOrderRef || undefined,
    providerTransactionRef: `CASH-${payment.merchantOrderRef}`,
    amountMillis: payment.amountMillis,
    currency: payment.currency,
    status: "SUCCEEDED",
    verified: true,
  }, undefined, { actorId: adminId, action: "MANUAL_CASH_APPROVED", reason })
}

export async function rejectManualCashPayment(adminId: string | undefined, paymentId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } })
    if (payment.provider !== "MANUAL_CASH" || payment.status !== "PENDING_REVIEW") {
      throw new Error("PAYMENT_STATE_CONFLICT")
    }
    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "DECLINED", failureCode: "MANUAL_CASH_REJECTED", failureMessage: reason.slice(0, 500), failedAt: new Date() },
    })
    await tx.auditEvent.create({
      data: { userId: adminId || null, action: "MANUAL_CASH_REJECTED", targetType: "Payment", targetId: paymentId, metadata: { reason: reason.slice(0, 500) } },
    })
    await queuePaymentEmail(tx, payment, {
      type: "PAYMENT_FAILED",
      subject: "Paiement non validé — Amenallah Edition",
      detail: "Votre demande de paiement en espèces n’a pas été validée. Contactez le support si vous pensez qu’il s’agit d’une erreur.",
    })
    return updated
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function processClicToPayNotification(rawBody: Buffer, headers: Headers) {
  const provider = clicToPayProvider()
  const notification = await provider.verifyNotification(rawBody, headers)
  const payment = await prisma.payment.findUnique({ where: { merchantOrderRef: notification.merchantOrderRef } })
  if (!payment || payment.provider !== "CLICTOPAY") throw new Error("PAYMENT_NOT_FOUND")
  const digest = createHash("sha256").update(rawBody).digest("hex")
  let event = await prisma.paymentEvent.findFirst({
    where: {
      OR: [
        { eventDigest: digest },
        ...(notification.providerEventRef
          ? [{ paymentId: payment.id, providerEventRef: notification.providerEventRef }]
          : []),
      ],
    },
  })
  if (event && event.eventDigest !== digest) {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: payment.id }, data: { status: "RECONCILIATION_REQUIRED", failureCode: "PAYMENT_NOTIFICATION_REPLAY_CONFLICT" } })
      await tx.auditEvent.create({ data: { action: "PAYMENT_NOTIFICATION_REPLAY_CONFLICT", targetType: "Payment", targetId: payment.id } })
      await queuePaymentReconciliationAlert(tx, payment)
    })
    throw new Error("PAYMENT_NOTIFICATION_REPLAY_CONFLICT")
  }
  if (!event) {
    try {
      event = await prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventType: "NOTIFICATION",
          eventDigest: digest,
          providerEventRef: notification.providerEventRef,
          normalizedStatus: notification.status,
          verified: notification.verified,
          metadata: notification.metadata,
        },
      })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error
      event = await prisma.paymentEvent.findUniqueOrThrow({ where: { eventDigest: digest } })
    }
  }
  if (!notification.verified) {
    await prisma.auditEvent.create({ data: { action: "PAYMENT_NOTIFICATION_REJECTED", targetType: "Payment", targetId: payment.id } })
    throw new Error("PAYMENT_NOTIFICATION_INVALID")
  }
  if (event.processedAt) return prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })
  if (!event.verified) {
    event = await prisma.paymentEvent.update({ where: { id: event.id }, data: { verified: true } })
  }
  const authoritative = await provider.queryPayment({
    merchantOrderRef: payment.merchantOrderRef,
    providerOrderRef: payment.providerOrderRef,
    amountMillis: payment.amountMillis,
    currency: payment.currency,
  })
  if (authoritative.status === "SUCCEEDED") {
    try {
      return await settleVerifiedPayment(payment.id, authoritative, event.id)
    } catch (error) {
      const current = await prisma.payment.findUnique({ where: { id: payment.id } })
      if (current?.status === "SUCCEEDED") {
        await prisma.paymentEvent.update({ where: { id: event.id }, data: { processedAt: new Date(), processingError: null } })
        return current
      }
      throw error
    }
  }
  if (authoritative.status === "REFUNDED") {
    if (!paymentVerificationMatches(payment, authoritative)) return applyVerifiedGatewayStatus(payment.id, { ...authoritative, status: "RECONCILIATION_REQUIRED" }, event.id)
    const refunded = await confirmPaymentRefund(payment.id)
    await prisma.paymentEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } })
    return refunded
  }
  return applyVerifiedGatewayStatus(payment.id, authoritative, event.id)
}

export async function applyVerifiedGatewayStatus(paymentId: string, verified: GatewayPaymentStatus, eventId?: string) {
  if (!["DECLINED", "CANCELLED", "EXPIRED", "REFUNDED"].includes(verified.status)) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({ where: { id: paymentId }, data: { status: "RECONCILIATION_REQUIRED", reconciledAt: new Date() } })
      await queuePaymentReconciliationAlert(tx, payment)
      if (eventId) await tx.paymentEvent.update({ where: { id: eventId }, data: { processedAt: new Date(), processingError: "UNSUPPORTED_PROVIDER_STATUS" } })
      return payment
    })
  }
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } })
    if (!paymentVerificationMatches(payment, verified)) {
      const conflicted = await tx.payment.update({ where: { id: payment.id }, data: { status: "RECONCILIATION_REQUIRED", failureCode: "PAYMENT_VERIFICATION_MISMATCH" } })
      await queuePaymentReconciliationAlert(tx, payment)
      return conflicted
    }
    const now = new Date()
    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: verified.status,
        providerTransactionRef: verified.providerTransactionRef || payment.providerTransactionRef,
        reconciledAt: now,
        failedAt: verified.status === "DECLINED" ? now : payment.failedAt,
        cancelledAt: verified.status === "CANCELLED" ? now : payment.cancelledAt,
      },
    })
    if (eventId) await tx.paymentEvent.update({ where: { id: eventId }, data: { processedAt: now } })
    if (["DECLINED", "CANCELLED", "EXPIRED"].includes(verified.status)) {
      await queuePaymentEmail(tx, payment, {
        type: "PAYMENT_FAILED",
        subject: "Paiement non abouti — Amenallah Edition",
        detail: "Le paiement n’a pas été finalisé. Aucun accès payant n’a été activé.",
      })
    }
    return updated
  })
}

export async function reconcileClicToPayPayment(paymentId: string, options: { force?: boolean } = {}) {
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } })
  if (payment.provider !== "CLICTOPAY") throw new Error("PAYMENT_PROVIDER_INVALID")
  if (payment.status === "REFUNDED") return payment
  if (payment.status === "SUCCEEDED" && !options.force) return payment
  const verified = await clicToPayProvider().queryPayment({
    merchantOrderRef: payment.merchantOrderRef,
    providerOrderRef: payment.providerOrderRef,
    amountMillis: payment.amountMillis,
    currency: payment.currency,
  })
  if (!paymentVerificationMatches(payment, verified)) {
    return prisma.$transaction(async (tx) => {
      const conflicted = await tx.payment.update({ where: { id: payment.id }, data: { status: "RECONCILIATION_REQUIRED", failureCode: "PAYMENT_VERIFICATION_MISMATCH" } })
      await queuePaymentReconciliationAlert(tx, payment)
      return conflicted
    })
  }
  if (payment.status === "REFUND_PENDING") {
    if (verified.status === "REFUNDED") return confirmPaymentRefund(payment.id)
    if (verified.status === "SUCCEEDED") {
      return prisma.payment.update({ where: { id: payment.id }, data: { reconciledAt: new Date(), failureMessage: null } })
    }
    return prisma.$transaction(async (tx) => {
      const conflicted = await tx.payment.update({
        where: { id: payment.id },
        data: { status: "RECONCILIATION_REQUIRED", failureCode: "PAYMENT_REFUND_STATUS_CONFLICT", reconciledAt: new Date() },
      })
      await queuePaymentReconciliationAlert(tx, payment)
      return conflicted
    })
  }
  if (payment.status === "SUCCEEDED") {
    if (verified.status === "REFUNDED") return confirmPaymentRefund(payment.id)
    if (verified.status === "SUCCEEDED") {
      return prisma.payment.update({ where: { id: payment.id }, data: { reconciledAt: new Date(), failureMessage: null } })
    }
    return prisma.$transaction(async (tx) => {
      const conflicted = await tx.payment.update({
        where: { id: payment.id },
        data: { status: "RECONCILIATION_REQUIRED", failureCode: "PAYMENT_SETTLEMENT_STATUS_CONFLICT", reconciledAt: new Date() },
      })
      await queuePaymentReconciliationAlert(tx, payment)
      return conflicted
    })
  }
  if (verified.status === "SUCCEEDED") return settleVerifiedPayment(payment.id, verified)
  if (verified.status === "REFUNDED") {
    return confirmPaymentRefund(payment.id)
  }
  return applyVerifiedGatewayStatus(payment.id, verified)
}

async function rebuildSubscriptionAfterReversal(tx: Db, reversed: {
  userId: string
  createdAt: Date
  endsAt: Date
}) {
  const now = new Date()
  if (reversed.endsAt > now) {
    const earlier = await tx.subscriptionGrant.findFirst({
      where: { userId: reversed.userId, status: "ACTIVE", createdAt: { lt: reversed.createdAt } },
      orderBy: { endsAt: "desc" },
    })
    let cursor = new Date(Math.max(now.getTime(), earlier?.endsAt.getTime() || 0))
    const later = await tx.subscriptionGrant.findMany({
      where: { userId: reversed.userId, status: "ACTIVE", createdAt: { gt: reversed.createdAt } },
      orderBy: { createdAt: "asc" },
    })
    for (const grant of later) {
      const endsAt = addDays(cursor, grant.durationDays)
      await tx.subscriptionGrant.update({ where: { id: grant.id }, data: { startsAt: cursor, endsAt } })
      cursor = endsAt
    }
  }
  const latest = await tx.subscriptionGrant.findFirst({
    where: { userId: reversed.userId, status: "ACTIVE", endsAt: { gt: now } },
    orderBy: { endsAt: "desc" },
  })
  const subscription = await tx.subscription.findFirst({ where: { userId: reversed.userId }, orderBy: { createdAt: "desc" } })
  if (!subscription) return
  if (!latest) {
    await tx.subscription.update({ where: { id: subscription.id }, data: { status: "EXPIRED", endDate: now } })
  } else {
    await tx.subscription.update({ where: { id: subscription.id }, data: { status: "ACTIVE", plan: latest.plan, endDate: latest.endsAt } })
  }
}

export async function confirmPaymentRefund(paymentId: string, actorId?: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: { subscriptionGrant: true, purchase: true },
    })
    if (payment.status === "REFUNDED") return payment
    if (!["SUCCEEDED", "REFUND_PENDING"].includes(payment.status)) throw new Error("PAYMENT_REFUND_STATE_INVALID")
    const now = new Date()
    if (payment.subscriptionGrant?.status === EntitlementStatus.ACTIVE) {
      await tx.subscriptionGrant.update({ where: { id: payment.subscriptionGrant.id }, data: { status: "REVERSED", reversedAt: now } })
      await rebuildSubscriptionAfterReversal(tx, payment.subscriptionGrant)
    }
    if (payment.purchase?.status === EntitlementStatus.ACTIVE) {
      await tx.purchase.update({ where: { id: payment.purchase.id }, data: { status: "REVERSED", revokedAt: now } })
    }
    const updated = await tx.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED", refundedAt: now, reconciledAt: now } })
    await tx.auditEvent.create({ data: { userId: actorId, action: "PAYMENT_REFUNDED", targetType: "Payment", targetId: payment.id } })
    await queuePaymentEmail(tx, payment, {
      type: "PAYMENT_REFUNDED",
      subject: "Remboursement confirmé — Amenallah Edition",
      detail: "Le remboursement associé à ce paiement est confirmé. L’accès financé uniquement par ce paiement a été recalculé.",
    })
    return updated
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function requestPaymentRefund(adminId: string, paymentId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } })
    if (payment.status === "REFUND_PENDING") return payment
    if (payment.status !== "SUCCEEDED") throw new Error("PAYMENT_REFUND_STATE_INVALID")
    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "REFUND_PENDING", failureMessage: reason.slice(0, 500) },
    })
    await tx.auditEvent.create({
      data: {
        userId: adminId,
        action: "PAYMENT_REFUND_REQUESTED",
        targetType: "Payment",
        targetId: payment.id,
        metadata: { provider: payment.provider, reason: reason.slice(0, 500) },
      },
    })
    return updated
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function expireStalePayments() {
  const now = new Date()
  return prisma.payment.updateMany({
    where: { status: { in: ["CREATED", "PENDING_REVIEW", "REDIRECT_READY"] }, expiresAt: { lt: now } },
    data: { status: "EXPIRED", failedAt: now, failureCode: "PAYMENT_EXPIRED" },
  })
}

export { PaymentGrantSource }
