-- Focused indexes for high-traffic dashboard, auth, subscription, and socket queries.
-- Run this against Supabase manually, outside a transaction, because CONCURRENTLY
-- cannot run inside an explicit transaction block.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_role_idx"
  ON "User" ("role");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Assessment_status_createdAt_idx"
  ON "Assessment" ("status", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Assessment_userId_createdAt_idx"
  ON "Assessment" ("userId", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Lead_status_createdAt_idx"
  ON "Lead" ("status", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Lead_createdAt_idx"
  ON "Lead" ("createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Payment_status_createdAt_idx"
  ON "Payment" ("status", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Payment_userId_createdAt_idx"
  ON "Payment" ("userId", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Subscription_userId_status_createdAt_idx"
  ON "Subscription" ("userId", "status", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Subscription_status_createdAt_idx"
  ON "Subscription" ("status", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "ProjectRequest_serviceType_status_updatedAt_idx"
  ON "ProjectRequest" ("serviceType", "status", "updatedAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "ProjectRequest_userId_updatedAt_idx"
  ON "ProjectRequest" ("userId", "updatedAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "ChatSession_status_updatedAt_idx"
  ON "ChatSession" ("status", "updatedAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "ChatMessage_sessionId_timestamp_idx"
  ON "ChatMessage" ("sessionId", "timestamp");
