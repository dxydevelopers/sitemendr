-- Add nullable threading metadata to existing messages. Existing rows remain
-- root messages and no client content is modified or deleted.
ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "threadId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Message_threadId_fkey'
  ) THEN
    ALTER TABLE "Message"
      ADD CONSTRAINT "Message_threadId_fkey"
      FOREIGN KEY ("threadId") REFERENCES "Message"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Message_userId_createdAt_idx"
  ON "Message"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Message_threadId_createdAt_idx"
  ON "Message"("threadId", "createdAt");
