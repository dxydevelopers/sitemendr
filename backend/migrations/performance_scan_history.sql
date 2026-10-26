-- Additive Performance history and request context storage.
-- This migration preserves all existing client and billing data.
BEGIN;

CREATE TABLE IF NOT EXISTS "PerformanceScan" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "strategy" TEXT NOT NULL DEFAULT 'mobile',
  "score" INTEGER,
  "metrics" JSONB NOT NULL,
  "recommendations" JSONB,
  "issues" JSONB,
  "conditions" JSONB,
  "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PerformanceScan_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProjectRequest"
  ADD COLUMN IF NOT EXISTS "performanceContext" JSONB;

CREATE INDEX IF NOT EXISTS "PerformanceScan_subscriptionId_scannedAt_idx"
  ON "PerformanceScan" ("subscriptionId", "scannedAt");
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PerformanceScan_subscriptionId_fkey'
      AND conrelid = 'public."PerformanceScan"'::regclass
  ) THEN
    ALTER TABLE "PerformanceScan"
      ADD CONSTRAINT "PerformanceScan_subscriptionId_fkey"
      FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
