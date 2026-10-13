CREATE TABLE IF NOT EXISTS "ProjectConversationMessage" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectRequestId" TEXT NOT NULL,
  "senderId" TEXT,
  "senderRole" TEXT NOT NULL DEFAULT 'client',
  "message" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'message',
  "choices" JSONB,
  "selectedChoice" TEXT,
  "attachments" JSONB,
  "eventData" JSONB,
  "readByAdmin" BOOLEAN NOT NULL DEFAULT false,
  "readByClient" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectConversationMessage_projectRequestId_fkey"
    FOREIGN KEY ("projectRequestId") REFERENCES "ProjectRequest"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProjectConversationMessage_projectRequestId_createdAt_idx"
  ON "ProjectConversationMessage"("projectRequestId", "createdAt");

CREATE INDEX IF NOT EXISTS "ProjectConversationMessage_projectRequestId_senderRole_readByAdmin_readByClient_idx"
  ON "ProjectConversationMessage"("projectRequestId", "senderRole", "readByAdmin", "readByClient");

-- Preserve both previous threads and their timestamps/read state in the new
-- single chronological project conversation. The source ID is retained so
-- the migration can be safely re-run.
INSERT INTO "ProjectConversationMessage"
  ("id", "projectRequestId", "senderId", "senderRole", "message", "kind", "choices", "selectedChoice", "attachments", "readByAdmin", "readByClient", "createdAt")
SELECT 'review:' || "id", "projectRequestId", "senderId", "senderRole", "message", "kind", "choices", "selectedChoice", "attachments", "readByAdmin", "readByClient", "createdAt"
FROM "ReviewChatMessage"
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ProjectConversationMessage"
  ("id", "projectRequestId", "senderId", "senderRole", "message", "kind", "choices", "selectedChoice", "attachments", "readByAdmin", "readByClient", "createdAt")
SELECT 'handoff:' || "id", "projectRequestId", "senderId", "senderRole", "message", "kind", "choices", "selectedChoice", "attachments", "readByAdmin", "readByClient", "createdAt"
FROM "HandoffChatMessage"
ON CONFLICT ("id") DO NOTHING;
