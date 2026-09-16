ALTER TABLE "Content"
  ADD COLUMN "titleEn" TEXT,
  ADD COLUMN "descriptionEn" TEXT,
  ADD COLUMN "language" TEXT NOT NULL DEFAULT 'MULTI',
  ADD COLUMN "audience" TEXT NOT NULL DEFAULT 'LEARNER',
  ADD COLUMN "collectionKey" TEXT,
  ADD COLUMN "storyKey" TEXT,
  ADD COLUMN "editionLabel" TEXT;

ALTER TABLE "ContentAsset"
  ADD COLUMN "sourceFileIdHash" TEXT,
  ADD COLUMN "sourceFileName" TEXT,
  ADD COLUMN "locale" TEXT,
  ADD COLUMN "assetRole" TEXT NOT NULL DEFAULT 'PRIMARY';

CREATE INDEX "ContentAsset_sourceFileIdHash_idx" ON "ContentAsset"("sourceFileIdHash");

CREATE TABLE "ContentIntake" (
  "id" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceProvider" TEXT NOT NULL DEFAULT 'DRIVE',
  "sourceRefEncrypted" TEXT,
  "sourceFileIdHash" TEXT NOT NULL,
  "sourceFileName" TEXT NOT NULL,
  "sourceFolder" TEXT,
  "sourceEmailRef" TEXT,
  "mimeType" TEXT,
  "sizeBytes" BIGINT,
  "checksumSha256" TEXT,
  "language" TEXT,
  "category" TEXT,
  "titleAr" TEXT,
  "titleFr" TEXT,
  "titleEn" TEXT,
  "grade" TEXT,
  "subject" TEXT,
  "audience" TEXT,
  "collectionKey" TEXT,
  "storyKey" TEXT,
  "editionLabel" TEXT,
  "coverRelationship" TEXT,
  "ownership" TEXT,
  "sharingState" TEXT,
  "duplicateOfId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "aiProposal" JSONB,
  "reviewNotes" TEXT,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "reviewedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentIntake_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentIntake_sourceFileIdHash_key" ON "ContentIntake"("sourceFileIdHash");
CREATE INDEX "ContentIntake_status_createdAt_idx" ON "ContentIntake"("status", "createdAt");
CREATE INDEX "ContentIntake_category_language_idx" ON "ContentIntake"("category", "language");
CREATE INDEX "ContentIntake_storyKey_idx" ON "ContentIntake"("storyKey");
