ALTER TABLE "Content" ADD COLUMN "displayTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Content" ADD COLUMN "primaryLanguage" TEXT NOT NULL DEFAULT 'MULTI';
ALTER TABLE "Content" ADD COLUMN "category" TEXT;

UPDATE "Content"
SET "displayTitle" = COALESCE(NULLIF("titleFr", ''), NULLIF("titleAr", ''), NULLIF("titleEn", ''), 'Sans titre')
WHERE "displayTitle" = '';

ALTER TABLE "Content" ALTER COLUMN "titleAr" SET DEFAULT '';
ALTER TABLE "Content" ALTER COLUMN "titleFr" SET DEFAULT '';
ALTER TABLE "Content" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

CREATE INDEX "Content_category_status_idx" ON "Content"("category", "status");
