ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "productionMode" TEXT NOT NULL DEFAULT 'hybrid';
ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "productionSourceNote" TEXT;
