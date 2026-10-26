-- Additive Repair request context; preserves existing request data.
ALTER TABLE "ProjectRequest"
  ADD COLUMN IF NOT EXISTS "repairContext" JSONB;
