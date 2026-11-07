-- Additive account profile and verification fields. Existing account data is preserved.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "pendingPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "phoneVerificationCodeHash" TEXT,
  ADD COLUMN IF NOT EXISTS "phoneVerificationExpires" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "phoneVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "pendingEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "emailChangeTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "emailChangeExpires" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "billingAddressLine1" TEXT,
  ADD COLUMN IF NOT EXISTS "billingAddressLine2" TEXT,
  ADD COLUMN IF NOT EXISTS "billingCity" TEXT,
  ADD COLUMN IF NOT EXISTS "billingPostalCode" TEXT,
  ADD COLUMN IF NOT EXISTS "billingCountry" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_pendingEmail_key"
  ON "User" ("pendingEmail")
  WHERE "pendingEmail" IS NOT NULL;
