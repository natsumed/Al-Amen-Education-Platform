import { randomUUID } from "node:crypto"
import { prisma } from "../src/lib/prisma"
import { expireStalePayments, reconcileClicToPayPayment } from "../src/lib/payment/service"
import { getClicToPayReadiness } from "../src/lib/payment/clictopay"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function claim(paymentId: string) {
  const leaseId = randomUUID()
  const now = new Date()
  const claimed = await prisma.payment.updateMany({
    where: {
      id: paymentId,
      OR: [{ processingLeaseExpiresAt: null }, { processingLeaseExpiresAt: { lt: now } }],
    },
    data: { processingLeaseId: leaseId, processingLeaseExpiresAt: new Date(now.getTime() + 4 * 60_000) },
  })
  return claimed.count ? leaseId : null
}

async function release(paymentId: string, leaseId: string) {
  await prisma.payment.updateMany({
    where: { id: paymentId, processingLeaseId: leaseId },
    data: { processingLeaseId: null, processingLeaseExpiresAt: null },
  })
}

async function processUnresolved() {
  const now = new Date()
  const candidate = await prisma.payment.findFirst({
    where: {
      provider: "CLICTOPAY",
      status: { in: ["REDIRECT_READY", "PROCESSING", "RECONCILIATION_REQUIRED", "REFUND_PENDING"] },
      createdAt: { lt: new Date(now.getTime() - 2 * 60_000) },
      OR: [{ processingLeaseExpiresAt: null }, { processingLeaseExpiresAt: { lt: now } }],
    },
    orderBy: { updatedAt: "asc" },
  })
  if (!candidate) return false
  const leaseId = await claim(candidate.id)
  if (!leaseId) return true
  try {
    await reconcileClicToPayPayment(candidate.id)
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYMENT_RECONCILIATION_FAILED"
    await prisma.payment.update({
      where: { id: candidate.id },
      data: { status: "RECONCILIATION_REQUIRED", failureCode: code.slice(0, 100), reconciledAt: new Date() },
    })
  } finally {
    await release(candidate.id, leaseId)
  }
  return true
}

async function processDailyVerification() {
  const now = new Date()
  const candidate = await prisma.payment.findFirst({
    where: {
      provider: "CLICTOPAY",
      status: "SUCCEEDED",
      settledAt: { gt: new Date(now.getTime() - 45 * 86_400_000) },
      OR: [{ reconciledAt: null }, { reconciledAt: { lt: new Date(now.getTime() - 86_400_000) } }],
      AND: [{ OR: [{ processingLeaseExpiresAt: null }, { processingLeaseExpiresAt: { lt: now } }] }],
    },
    orderBy: { reconciledAt: "asc" },
  })
  if (!candidate) return false
  const leaseId = await claim(candidate.id)
  if (!leaseId) return true
  try {
    await reconcileClicToPayPayment(candidate.id, { force: true })
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYMENT_DAILY_VERIFICATION_FAILED"
    await prisma.payment.update({ where: { id: candidate.id }, data: { failureCode: code.slice(0, 100) } })
  } finally {
    await release(candidate.id, leaseId)
  }
  return true
}

try {
  while (true) {
    await expireStalePayments()
    if (!getClicToPayReadiness().available) {
      await sleep(5 * 60_000)
      continue
    }
    const processed = await processUnresolved() || await processDailyVerification()
    if (!processed) await sleep(5 * 60_000)
  }
} finally {
  await prisma.$disconnect()
}
