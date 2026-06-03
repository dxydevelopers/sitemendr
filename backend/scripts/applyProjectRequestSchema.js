const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const statements = [
`ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "userId" TEXT`,
`CREATE TABLE IF NOT EXISTS "ProjectRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "assessmentId" TEXT,
  "subscriptionId" TEXT,
  "title" TEXT NOT NULL,
  "businessName" TEXT,
  "serviceType" TEXT NOT NULL DEFAULT 'build',
  "packageIntent" TEXT,
  "budget" TEXT,
  "timeline" TEXT,
  "summary" TEXT,
  "status" TEXT NOT NULL DEFAULT 'submitted',
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "quotedAmount" DOUBLE PRECISION,
  "quoteCurrency" TEXT NOT NULL DEFAULT 'USD',
  "paymentAgreementType" TEXT,
  "paymentAgreementStatus" TEXT NOT NULL DEFAULT 'pending',
  "depositAmount" DOUBLE PRECISION,
  "totalAgreedAmount" DOUBLE PRECISION,
  "paymentDueDate" TIMESTAMP(3),
  "paymentInstructions" TEXT,
  "paymentConfirmedAt" TIMESTAMP(3),
  "stagingUrl" TEXT,
  "stagingNotes" TEXT,
  "stagingReviewStatus" TEXT NOT NULL DEFAULT 'not_sent',
  "stagingReviewedAt" TIMESTAMP(3),
  "launchUrl" TEXT,
  "launchNotes" TEXT,
  "launchApprovedAt" TIMESTAMP(3),
  "handoffNotes" TEXT,
  "completionNotes" TEXT,
  "completionAcknowledgedAt" TIMESTAMP(3),
  "adminNotes" TEXT,
  "clientNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "ProjectRequest_pkey" PRIMARY KEY ("id")
)`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "paymentAgreementType" TEXT`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "paymentAgreementStatus" TEXT NOT NULL DEFAULT 'pending'`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "depositAmount" DOUBLE PRECISION`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "totalAgreedAmount" DOUBLE PRECISION`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "paymentDueDate" TIMESTAMP(3)`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "paymentInstructions" TEXT`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "paymentConfirmedAt" TIMESTAMP(3)`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "stagingUrl" TEXT`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "stagingNotes" TEXT`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "stagingReviewStatus" TEXT NOT NULL DEFAULT 'not_sent'`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "stagingReviewedAt" TIMESTAMP(3)`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "launchUrl" TEXT`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "launchNotes" TEXT`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "launchApprovedAt" TIMESTAMP(3)`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "handoffNotes" TEXT`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "completionNotes" TEXT`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "completionAcknowledgedAt" TIMESTAMP(3)`,
`ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3)`,
`CREATE TABLE IF NOT EXISTS "BuildMilestone" (
  "id" TEXT NOT NULL,
  "projectRequestId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0,
  "dueDate" TIMESTAMP(3),
  "clientNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BuildMilestone_pkey" PRIMARY KEY ("id")
)`,
`CREATE UNIQUE INDEX IF NOT EXISTS "ProjectRequest_assessmentId_key" ON "ProjectRequest"("assessmentId")`,
`CREATE INDEX IF NOT EXISTS "ProjectRequest_userId_idx" ON "ProjectRequest"("userId")`,
`CREATE INDEX IF NOT EXISTS "BuildMilestone_projectRequestId_idx" ON "BuildMilestone"("projectRequestId")`,
`DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Assessment_userId_fkey') THEN
    ALTER TABLE "Assessment"
      ADD CONSTRAINT "Assessment_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectRequest_userId_fkey') THEN
    ALTER TABLE "ProjectRequest"
      ADD CONSTRAINT "ProjectRequest_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectRequest_assessmentId_fkey') THEN
    ALTER TABLE "ProjectRequest"
      ADD CONSTRAINT "ProjectRequest_assessmentId_fkey"
      FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectRequest_subscriptionId_fkey') THEN
    ALTER TABLE "ProjectRequest"
      ADD CONSTRAINT "ProjectRequest_subscriptionId_fkey"
      FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BuildMilestone_projectRequestId_fkey') THEN
    ALTER TABLE "BuildMilestone"
      ADD CONSTRAINT "BuildMilestone_projectRequestId_fkey"
      FOREIGN KEY ("projectRequestId") REFERENCES "ProjectRequest"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
`
];

async function main() {
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
  console.log('ProjectRequest schema is ready.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
