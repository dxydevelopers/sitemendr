CREATE TABLE IF NOT EXISTS "StudioTask" (
  "id" TEXT PRIMARY KEY,
  "projectRequestId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "area" TEXT NOT NULL DEFAULT 'build',
  "status" TEXT NOT NULL DEFAULT 'open',
  "owner" TEXT,
  "dueDate" TIMESTAMP(3),
  "note" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudioTask_projectRequestId_fkey" FOREIGN KEY ("projectRequestId") REFERENCES "ProjectRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "StudioTask_projectRequestId_area_status_idx" ON "StudioTask"("projectRequestId", "area", "status");

CREATE TABLE IF NOT EXISTS "StudioLink" (
  "id" TEXT PRIMARY KEY,
  "projectRequestId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "url" TEXT,
  "type" TEXT NOT NULL DEFAULT 'link',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudioLink_projectRequestId_fkey" FOREIGN KEY ("projectRequestId") REFERENCES "ProjectRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "StudioLink_projectRequestId_type_idx" ON "StudioLink"("projectRequestId", "type");

CREATE TABLE IF NOT EXISTS "StudioBlocker" (
  "id" TEXT PRIMARY KEY,
  "projectRequestId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "area" TEXT NOT NULL DEFAULT 'general',
  "status" TEXT NOT NULL DEFAULT 'open',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudioBlocker_projectRequestId_fkey" FOREIGN KEY ("projectRequestId") REFERENCES "ProjectRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "StudioBlocker_projectRequestId_status_idx" ON "StudioBlocker"("projectRequestId", "status");

CREATE TABLE IF NOT EXISTS "StudioUpdate" (
  "id" TEXT PRIMARY KEY,
  "projectRequestId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "visibility" TEXT NOT NULL DEFAULT 'client',
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudioUpdate_projectRequestId_fkey" FOREIGN KEY ("projectRequestId") REFERENCES "ProjectRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "StudioUpdate_projectRequestId_visibility_createdAt_idx" ON "StudioUpdate"("projectRequestId", "visibility", "createdAt");

ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "productionMode" TEXT NOT NULL DEFAULT 'hybrid';
ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "productionSourceNote" TEXT;
