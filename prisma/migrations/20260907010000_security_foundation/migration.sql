-- Backward-compatible security foundation. Legacy content URL columns remain
-- during the migration window and are removed only after all assets are moved.
ALTER TABLE "User"
  ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "passwordUpdatedAt" TIMESTAMP(3);

ALTER TABLE "Payment"
  ADD COLUMN "merchantOrderRef" TEXT,
  ADD COLUMN "amountMillis" INTEGER,
  ADD COLUMN "callbackDigest" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "reconciledAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Payment_merchantOrderRef_key" ON "Payment"("merchantOrderRef");

CREATE TABLE "ContentAsset" (
  "id" TEXT NOT NULL,
  "contentId" TEXT,
  "kind" TEXT NOT NULL,
  "sourceProvider" TEXT NOT NULL DEFAULT 'DRIVE',
  "sourceRefEncrypted" TEXT,
  "deliveryProvider" TEXT,
  "deliveryAssetId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "mimeType" TEXT,
  "checksumSha256" TEXT,
  "sizeBytes" BIGINT,
  "pageCount" INTEGER,
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IngestionJob" (
  "id" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "reviewedById" TEXT,
  "contentId" TEXT,
  "assetId" TEXT,
  "sourceType" TEXT NOT NULL,
  "sourceRefEncrypted" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "progressPercent" INTEGER NOT NULL DEFAULT 0,
  "instructions" TEXT,
  "proposal" JSONB,
  "confidence" DOUBLE PRECISION,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IngestionJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeviceSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "deviceName" TEXT,
  "attestedAt" TIMESTAMP(3),
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeviceSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefreshToken" (
  "id" TEXT NOT NULL,
  "deviceSessionId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlaybackSession" (
  "id" TEXT NOT NULL,
  "sessionCode" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "deviceSessionId" TEXT,
  "ipHash" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlaybackSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MfaCredential" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'TOTP',
  "secretEncrypted" TEXT NOT NULL,
  "recoveryCodesEncrypted" TEXT,
    "enabledAt" TIMESTAMP(3),
    "lastUsedCounter" BIGINT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MfaCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "ipHash" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MobileRelease" (
  "id" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "buildNumber" INTEGER NOT NULL,
  "url" TEXT NOT NULL,
  "checksumSha256" TEXT,
  "sizeBytes" BIGINT,
  "minimumVersion" TEXT,
  "appStoreUrl" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "releasedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MobileRelease_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentAsset_contentId_kind_idx" ON "ContentAsset"("contentId", "kind");
CREATE INDEX "ContentAsset_status_idx" ON "ContentAsset"("status");
CREATE INDEX "IngestionJob_status_createdAt_idx" ON "IngestionJob"("status", "createdAt");
CREATE INDEX "IngestionJob_requestedById_idx" ON "IngestionJob"("requestedById");
CREATE UNIQUE INDEX "DeviceSession_userId_deviceId_key" ON "DeviceSession"("userId", "deviceId");
CREATE INDEX "DeviceSession_userId_revokedAt_idx" ON "DeviceSession"("userId", "revokedAt");
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_deviceSessionId_expiresAt_idx" ON "RefreshToken"("deviceSessionId", "expiresAt");
CREATE UNIQUE INDEX "PlaybackSession_sessionCode_key" ON "PlaybackSession"("sessionCode");
CREATE INDEX "PlaybackSession_userId_endedAt_expiresAt_idx" ON "PlaybackSession"("userId", "endedAt", "expiresAt");
CREATE INDEX "PlaybackSession_contentId_idx" ON "PlaybackSession"("contentId");
CREATE UNIQUE INDEX "MfaCredential_userId_key" ON "MfaCredential"("userId");
CREATE INDEX "AuditEvent_userId_createdAt_idx" ON "AuditEvent"("userId", "createdAt");
CREATE INDEX "AuditEvent_action_createdAt_idx" ON "AuditEvent"("action", "createdAt");
CREATE UNIQUE INDEX "MobileRelease_platform_buildNumber_key" ON "MobileRelease"("platform", "buildNumber");
CREATE INDEX "MobileRelease_platform_isPublished_buildNumber_idx" ON "MobileRelease"("platform", "isPublished", "buildNumber");

ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IngestionJob" ADD CONSTRAINT "IngestionJob_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IngestionJob" ADD CONSTRAINT "IngestionJob_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IngestionJob" ADD CONSTRAINT "IngestionJob_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IngestionJob" ADD CONSTRAINT "IngestionJob_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "ContentAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DeviceSession" ADD CONSTRAINT "DeviceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_deviceSessionId_fkey" FOREIGN KEY ("deviceSessionId") REFERENCES "DeviceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaybackSession" ADD CONSTRAINT "PlaybackSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaybackSession" ADD CONSTRAINT "PlaybackSession_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaybackSession" ADD CONSTRAINT "PlaybackSession_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "ContentAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaybackSession" ADD CONSTRAINT "PlaybackSession_deviceSessionId_fkey" FOREIGN KEY ("deviceSessionId") REFERENCES "DeviceSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MfaCredential" ADD CONSTRAINT "MfaCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
