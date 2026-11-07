-- Store verified OAuth identities on existing Sitemendr client accounts.
-- Nullable provider IDs keep password-only accounts unchanged.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "googleId" TEXT,
  ADD COLUMN IF NOT EXISTS "githubId" TEXT,
  ADD COLUMN IF NOT EXISTS "appleId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User" ("googleId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_githubId_key" ON "User" ("githubId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_appleId_key" ON "User" ("appleId");
