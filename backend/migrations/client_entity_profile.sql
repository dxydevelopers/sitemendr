-- Add optional client entity identity fields for Business, Organisation, and Agency accounts.
-- Existing users and their project/payment data are preserved.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "entityName" TEXT,
  ADD COLUMN IF NOT EXISTS "entityContactEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "entityPhone" TEXT;
