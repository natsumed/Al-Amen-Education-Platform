-- Expand the payment model without dropping the legacy amount/item columns.
-- ClicToPay remains disabled until the official SMT adapter is certified.
CREATE TYPE "PaymentProvider" AS ENUM ('MANUAL_CASH', 'CLICTOPAY');
CREATE TYPE "PaymentProductKind" AS ENUM ('SUBSCRIPTION', 'CONTENT');
CREATE TYPE "PaymentStatus" AS ENUM (
  'CREATED',
  'PENDING_REVIEW',
  'REDIRECT_READY',
  'PROCESSING',
  'SUCCEEDED',
  'DECLINED',
  'CANCELLED',
  'EXPIRED',
  'INITIATION_FAILED',
  'RECONCILIATION_REQUIRED',
  'REFUND_PENDING',
  'REFUNDED'
);
CREATE TYPE "PaymentGrantSource" AS ENUM ('PAYMENT', 'ADMIN_GRANT', 'LEGACY_IMPORT');
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'REVERSED');

ALTER TABLE "Payment"
  ADD COLUMN "productKind" "PaymentProductKind",
  ADD COLUMN "productId" TEXT,
  ADD COLUMN "productTitle" TEXT,
  ADD COLUMN "plan" TEXT,
  ADD COLUMN "planDurationDays" INTEGER,
  ADD COLUMN "providerOrderRef" TEXT,
  ADD COLUMN "providerTransactionRef" TEXT,
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "idempotencyFingerprint" TEXT,
  ADD COLUMN "failureCode" TEXT,
  ADD COLUMN "failureMessage" TEXT,
  ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
  ADD COLUMN "initiatedAt" TIMESTAMP(3),
  ADD COLUMN "redirectedAt" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "settledAt" TIMESTAMP(3),
  ADD COLUMN "failedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "refundedAt" TIMESTAMP(3),
  ADD COLUMN "processingLeaseId" TEXT,
  ADD COLUMN "processingLeaseExpiresAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Payment"
SET
  "amountMillis" = COALESCE("amountMillis", ROUND("amount" * 1000)::INTEGER),
  "merchantOrderRef" = COALESCE("merchantOrderRef", 'LEGACY-' || "id"),
  "productKind" = CASE WHEN "itemType" = 'CONTENT' THEN 'CONTENT' ELSE 'SUBSCRIPTION' END::"PaymentProductKind",
  "productId" = COALESCE("itemId", 'LEGACY'),
  "productTitle" = COALESCE("itemId", "itemType", 'Legacy payment'),
  "plan" = CASE WHEN "itemType" = 'SUBSCRIPTION' THEN "itemId" ELSE NULL END,
  "planDurationDays" = CASE
    WHEN "itemId" IN ('STUDENT_YEARLY', 'TEACHER_YEARLY') THEN 365
    WHEN "itemId" IN ('STUDENT_MONTHLY', 'TEACHER_MONTHLY') THEN 30
    ELSE NULL
  END;

ALTER TABLE "Payment"
  ALTER COLUMN "amountMillis" SET NOT NULL,
  ALTER COLUMN "merchantOrderRef" SET NOT NULL,
  ALTER COLUMN "productKind" SET NOT NULL,
  ALTER COLUMN "productId" SET NOT NULL,
  ALTER COLUMN "productTitle" SET NOT NULL,
  ALTER COLUMN "provider" TYPE "PaymentProvider"
    USING (CASE WHEN "provider" = 'CLICTOPAY' THEN 'CLICTOPAY' ELSE 'MANUAL_CASH' END)::"PaymentProvider",
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "PaymentStatus"
    USING (
      CASE
        WHEN "status" = 'SUCCESS' THEN 'SUCCEEDED'
        WHEN "status" = 'FAILED' THEN 'DECLINED'
        WHEN "status" = 'REFUNDED' THEN 'REFUNDED'
        WHEN "provider"::TEXT = 'MANUAL_CASH' AND "status" = 'PENDING' THEN 'PENDING_REVIEW'
        ELSE 'RECONCILIATION_REQUIRED'
      END
    )::"PaymentStatus",
  ALTER COLUMN "status" SET DEFAULT 'CREATED';

UPDATE "Payment"
SET "expiresAt" = "createdAt" + INTERVAL '7 days'
WHERE "status" = 'PENDING_REVIEW' AND "expiresAt" IS NULL;

CREATE UNIQUE INDEX "Payment_providerOrderRef_key" ON "Payment"("providerOrderRef");
CREATE UNIQUE INDEX "Payment_providerTransactionRef_key" ON "Payment"("providerTransactionRef");
CREATE UNIQUE INDEX "Payment_userId_idempotencyKey_key" ON "Payment"("userId", "idempotencyKey");
CREATE INDEX "Payment_provider_status_expiresAt_idx" ON "Payment"("provider", "status", "expiresAt");
CREATE INDEX "Payment_processingLeaseExpiresAt_idx" ON "Payment"("processingLeaseExpiresAt");

CREATE TABLE "PaymentEvent" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventDigest" TEXT NOT NULL,
  "providerEventRef" TEXT,
  "normalizedStatus" "PaymentStatus",
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "processingError" TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentEvent_eventDigest_key" ON "PaymentEvent"("eventDigest");
CREATE UNIQUE INDEX "PaymentEvent_paymentId_providerEventRef_key" ON "PaymentEvent"("paymentId", "providerEventRef");
CREATE INDEX "PaymentEvent_paymentId_createdAt_idx" ON "PaymentEvent"("paymentId", "createdAt");
CREATE INDEX "PaymentEvent_verified_createdAt_idx" ON "PaymentEvent"("verified", "createdAt");

CREATE TABLE "SubscriptionGrant" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "paymentId" TEXT,
  "plan" TEXT NOT NULL,
  "source" "PaymentGrantSource" NOT NULL,
  "durationDays" INTEGER NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
  "reversedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubscriptionGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SubscriptionGrant_paymentId_key" ON "SubscriptionGrant"("paymentId");
CREATE INDEX "SubscriptionGrant_userId_status_endsAt_idx" ON "SubscriptionGrant"("userId", "status", "endsAt");

INSERT INTO "SubscriptionGrant" (
  "id", "userId", "plan", "source", "durationDays", "startsAt", "endsAt", "status", "createdAt", "updatedAt"
)
SELECT
  'legacy-grant-' || "id",
  "userId",
  "plan",
  'LEGACY_IMPORT'::"PaymentGrantSource",
  GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("endDate" - "startDate")) / 86400)::INTEGER),
  "startDate",
  "endDate",
  'ACTIVE'::"EntitlementStatus",
  "createdAt",
  CURRENT_TIMESTAMP
FROM "Subscription"
WHERE "status" = 'ACTIVE';

ALTER TABLE "Content" ADD COLUMN "priceMillis" INTEGER;
UPDATE "Content" SET "priceMillis" = ROUND("price" * 1000)::INTEGER WHERE "price" IS NOT NULL;

ALTER TABLE "Purchase"
  ADD COLUMN "paymentId" TEXT,
  ADD COLUMN "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX "Purchase_paymentId_key" ON "Purchase"("paymentId");

ALTER TABLE "PaymentEvent"
  ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubscriptionGrant"
  ADD CONSTRAINT "SubscriptionGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubscriptionGrant"
  ADD CONSTRAINT "SubscriptionGrant_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Purchase"
  ADD CONSTRAINT "Purchase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_contentId_fkey";
ALTER TABLE "Purchase"
  ADD CONSTRAINT "Purchase_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
