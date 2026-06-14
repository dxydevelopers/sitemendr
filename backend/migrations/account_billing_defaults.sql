ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "country" TEXT NOT NULL DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS "accountType" TEXT NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS "billingRegion" TEXT;

CREATE INDEX IF NOT EXISTS "User_country_defaultCurrency_idx"
  ON "User" ("country", "defaultCurrency");
