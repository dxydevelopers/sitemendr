-- Preserve existing client-visible resources while enabling admin drafts.
ALTER TABLE "Resource"
ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT TRUE;
