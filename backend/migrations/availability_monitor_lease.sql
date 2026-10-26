-- Shared lease prevents duplicate uptime cycles across backend instances.
-- The row contains no client data and is safe to create additively.
CREATE TABLE IF NOT EXISTS "SiteAvailabilityMonitorLease" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "leaseUntil" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteAvailabilityMonitorLease_pkey" PRIMARY KEY ("id")
);
