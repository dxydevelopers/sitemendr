-- Add an index that keeps the bounded availability-history cleanup efficient.
CREATE INDEX IF NOT EXISTS "SiteAvailabilityCheck_checkedAt_idx"
  ON "SiteAvailabilityCheck" ("checkedAt");
