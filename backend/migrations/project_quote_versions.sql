CREATE TABLE IF NOT EXISTS "ProjectQuoteVersion" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectRequestId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'sent',
  "snapshot" JSONB NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectQuoteVersion_projectRequestId_fkey"
    FOREIGN KEY ("projectRequestId") REFERENCES "ProjectRequest"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProjectQuoteVersion_projectRequestId_version_key"
    UNIQUE ("projectRequestId", "version")
);

CREATE INDEX IF NOT EXISTS "ProjectQuoteVersion_projectRequestId_status_createdAt_idx"
  ON "ProjectQuoteVersion"("projectRequestId", "status", "createdAt");
