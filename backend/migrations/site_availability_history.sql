-- Additive availability history for Performance monitoring.
-- Existing site and billing data is preserved.
BEGIN;

CREATE TABLE IF NOT EXISTS "SiteAvailabilityCheck" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "statusCode" INTEGER,
  "responseTimeMs" INTEGER,
  "error" TEXT,
  "source" TEXT NOT NULL DEFAULT 'scheduled',
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteAvailabilityCheck_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SiteAvailabilityCheck_subscriptionId_checkedAt_idx"
  ON "SiteAvailabilityCheck" ("subscriptionId", "checkedAt");
CREATE INDEX IF NOT EXISTS "SiteAvailabilityCheck_subscriptionId_source_checkedAt_idx"
  ON "SiteAvailabilityCheck" ("subscriptionId", "source", "checkedAt");
CREATE INDEX IF NOT EXISTS "SiteAvailabilityCheck_checkedAt_idx"
  ON "SiteAvailabilityCheck" ("checkedAt");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'SiteAvailabilityCheck_subscriptionId_fkey'
      AND conrelid = 'public."SiteAvailabilityCheck"'::regclass
  ) THEN
    ALTER TABLE "SiteAvailabilityCheck"
      ADD CONSTRAINT "SiteAvailabilityCheck_subscriptionId_fkey"
      FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
