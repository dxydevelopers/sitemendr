CREATE TABLE IF NOT EXISTS "HandoffChatMessage" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectRequestId" TEXT NOT NULL,
  "senderId" TEXT,
  "senderRole" TEXT NOT NULL DEFAULT 'client',
  "message" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'message',
  "choices" JSONB,
  "selectedChoice" TEXT,
  "attachments" JSONB,
  "readByAdmin" BOOLEAN NOT NULL DEFAULT false,
  "readByClient" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HandoffChatMessage_projectRequestId_fkey"
    FOREIGN KEY ("projectRequestId") REFERENCES "ProjectRequest"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "HandoffChatMessage_projectRequestId_createdAt_idx"
  ON "HandoffChatMessage"("projectRequestId", "createdAt");

CREATE INDEX IF NOT EXISTS "HandoffChatMessage_projectRequestId_senderRole_readByAdmin_readByClient_idx"
  ON "HandoffChatMessage"("projectRequestId", "senderRole", "readByAdmin", "readByClient");
