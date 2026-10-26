BEGIN;

CREATE TABLE IF NOT EXISTS "BillingInvoice" (
  "id" TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectRequestId" TEXT,
  "subscriptionId" TEXT,
  "stage" TEXT NOT NULL,
  "serviceType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "voidedAt" TIMESTAMP(3),
  "reminderCount" INTEGER NOT NULL DEFAULT 0,
  "lastReminderAt" TIMESTAMP(3),
  "nextReminderAt" TIMESTAMP(3),
  "snapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingInvoice_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "BillingInvoice" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "BillingInvoice_invoiceNumber_key" ON "BillingInvoice"("invoiceNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "BillingInvoice_projectRequestId_stage_key" ON "BillingInvoice"("projectRequestId", "stage");
CREATE UNIQUE INDEX IF NOT EXISTS "BillingInvoice_subscriptionId_stage_key" ON "BillingInvoice"("subscriptionId", "stage");
CREATE INDEX IF NOT EXISTS "BillingInvoice_userId_issuedAt_idx" ON "BillingInvoice"("userId", "issuedAt");
CREATE INDEX IF NOT EXISTS "BillingInvoice_status_dueAt_idx" ON "BillingInvoice"("status", "dueAt");
CREATE INDEX IF NOT EXISTS "BillingInvoice_status_nextReminderAt_idx" ON "BillingInvoice"("status", "nextReminderAt");
ALTER TABLE "BillingInvoice" ADD COLUMN IF NOT EXISTS "reminderCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BillingInvoice" ADD COLUMN IF NOT EXISTS "lastReminderAt" TIMESTAMP(3);
ALTER TABLE "BillingInvoice" ADD COLUMN IF NOT EXISTS "nextReminderAt" TIMESTAMP(3);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BillingInvoice_userId_fkey') THEN
    ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BillingInvoice_subscriptionId_fkey') THEN
    ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "BillingReceipt" (
  "id" TEXT NOT NULL,
  "receiptNumber" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "invoiceId" TEXT,
  "amountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "snapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillingReceipt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BillingReceipt_receiptNumber_key" ON "BillingReceipt"("receiptNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "BillingReceipt_paymentId_key" ON "BillingReceipt"("paymentId");
CREATE INDEX IF NOT EXISTS "BillingReceipt_userId_issuedAt_idx" ON "BillingReceipt"("userId", "issuedAt");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BillingReceipt_userId_fkey') THEN
    ALTER TABLE "BillingReceipt" ADD CONSTRAINT "BillingReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BillingReceipt_paymentId_fkey') THEN
    ALTER TABLE "BillingReceipt" ADD CONSTRAINT "BillingReceipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BillingReceipt_invoiceId_fkey') THEN
    ALTER TABLE "BillingReceipt" ADD CONSTRAINT "BillingReceipt_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "BillingRefund" (
  "id" TEXT NOT NULL,
  "refundNumber" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectRequestId" TEXT,
  "invoiceId" TEXT,
  "amountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "externalReference" TEXT,
  "externalReferences" JSONB,
  "sourcePaymentReferences" JSONB,
  "processedAmountMinor" INTEGER NOT NULL DEFAULT 0,
  "processedAt" TIMESTAMP(3),
  "snapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillingRefund_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BillingRefund_refundNumber_key" ON "BillingRefund"("refundNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "BillingRefund_externalReference_key" ON "BillingRefund"("externalReference");
CREATE INDEX IF NOT EXISTS "BillingRefund_userId_processedAt_idx" ON "BillingRefund"("userId", "processedAt");
CREATE INDEX IF NOT EXISTS "BillingRefund_projectRequestId_processedAt_idx" ON "BillingRefund"("projectRequestId", "processedAt");
ALTER TABLE "BillingRefund" ADD COLUMN IF NOT EXISTS "externalReferences" JSONB;
ALTER TABLE "BillingRefund" ADD COLUMN IF NOT EXISTS "processedAmountMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BillingRefund" ALTER COLUMN "externalReference" DROP NOT NULL;
ALTER TABLE "BillingRefund" ALTER COLUMN "processedAt" DROP NOT NULL;
ALTER TABLE "BillingRefund" ALTER COLUMN "status" SET DEFAULT 'pending';
UPDATE "BillingRefund" SET "processedAmountMinor" = "amountMinor" WHERE "status" = 'processed' AND "processedAmountMinor" = 0;
UPDATE "BillingRefund" SET "externalReferences" = jsonb_build_array("externalReference") WHERE "externalReference" IS NOT NULL AND "externalReferences" IS NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BillingRefund_userId_fkey') THEN
    ALTER TABLE "BillingRefund" ADD CONSTRAINT "BillingRefund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BillingRefund_invoiceId_fkey') THEN
    ALTER TABLE "BillingRefund" ADD CONSTRAINT "BillingRefund_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_invoiceId_fkey') THEN
    ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- Preserve invoice records for historical, verified add-on purchases.
INSERT INTO "BillingInvoice" (
  "id", "invoiceNumber", "userId", "subscriptionId", "stage", "serviceType", "description",
  "amountMinor", "currency", "status", "issuedAt", "paidAt", "snapshot", "updatedAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text),
  'SMI-' || to_char(p."createdAt", 'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  p."userId", s."id", 'addon:historical:' || p."id", 'addon', p."description",
  round(p."amount")::INTEGER, upper(COALESCE(p."currency", 'USD')), 'paid', p."createdAt", p."updatedAt",
  jsonb_build_object('addonId', p."metadata"->>'addonId', 'addonName', p."metadata"->>'addonName', 'subscriptionId', s."id", 'historicalBackfill', true, 'paymentReference', p."reference"),
  CURRENT_TIMESTAMP
FROM "Payment" p
JOIN "Subscription" s ON s."id" = p."metadata"->>'subscriptionId' AND s."userId" = p."userId"
WHERE p."status" = 'completed' AND p."serviceType" = 'addon' AND p."amount" > 0
ON CONFLICT ("subscriptionId", "stage") DO NOTHING;
UPDATE "Payment" p SET "invoiceId" = bi."id"
FROM "BillingInvoice" bi
WHERE bi."serviceType" = 'addon' AND bi."stage" = 'addon:historical:' || p."id"
  AND p."invoiceId" IS NULL;

-- Create billing records for build stages that were already payable before this migration.
INSERT INTO "BillingInvoice" (
  "id", "invoiceNumber", "userId", "projectRequestId", "stage", "serviceType", "description",
  "amountMinor", "currency", "status", "issuedAt", "dueAt", "nextReminderAt", "snapshot", "updatedAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text),
  'SMI-' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  pr."userId", pr."id", 'deposit', 'build', 'Build agreement deposit - ' || COALESCE(pr."title", pr."businessName", 'Website project'),
  round(COALESCE(pr."depositAmount", pr."totalAgreedAmount", pr."quotedAmount", 0) * 100)::INTEGER,
  upper(COALESCE(pr."quoteCurrency", 'USD')),
  CASE WHEN EXISTS (SELECT 1 FROM "Payment" p WHERE p."userId" = pr."userId" AND p."serviceType" = 'build_agreement' AND p."metadata"->>'projectRequestId' = pr."id" AND p."status" = 'pending') THEN 'processing' ELSE 'open' END,
  CURRENT_TIMESTAMP, pr."paymentDueDate",
  CASE WHEN pr."paymentDueDate" IS NULL THEN NULL ELSE GREATEST(CURRENT_TIMESTAMP + INTERVAL '1 day', pr."paymentDueDate" - INTERVAL '1 day') END,
  jsonb_build_object('projectRequestId', pr."id", 'projectName', COALESCE(pr."title", pr."businessName", 'Website project'), 'agreedTotal', COALESCE(pr."totalAgreedAmount", pr."quotedAmount", 0), 'deposit', COALESCE(pr."depositAmount", 0)),
  CURRENT_TIMESTAMP
FROM "ProjectRequest" pr
WHERE pr."serviceType" = 'build' AND pr."status" = 'payment_agreement' AND pr."paymentAgreementStatus" = 'sent'
  AND COALESCE(pr."depositAmount", pr."totalAgreedAmount", pr."quotedAmount", 0) > 0
ON CONFLICT ("projectRequestId", "stage") DO NOTHING;

INSERT INTO "BillingInvoice" (
  "id", "invoiceNumber", "userId", "projectRequestId", "stage", "serviceType", "description",
  "amountMinor", "currency", "status", "issuedAt", "dueAt", "nextReminderAt", "snapshot", "updatedAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text),
  'SMI-' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  pr."userId", pr."id", 'final_balance', 'build', 'Build final balance - ' || COALESCE(pr."title", pr."businessName", 'Website project'),
  round(GREATEST(COALESCE(pr."totalAgreedAmount", pr."quotedAmount", 0) - COALESCE(pr."depositAmount", 0), 0) * 100)::INTEGER,
  upper(COALESCE(pr."quoteCurrency", 'USD')),
  CASE WHEN EXISTS (SELECT 1 FROM "Payment" p WHERE p."userId" = pr."userId" AND p."serviceType" = 'build_final_balance' AND p."metadata"->>'projectRequestId' = pr."id" AND p."status" = 'pending') THEN 'processing' ELSE 'open' END,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 day',
  jsonb_build_object('projectRequestId', pr."id", 'projectName', COALESCE(pr."title", pr."businessName", 'Website project'), 'agreedTotal', COALESCE(pr."totalAgreedAmount", pr."quotedAmount", 0), 'deposit', COALESCE(pr."depositAmount", 0)),
  CURRENT_TIMESTAMP
FROM "ProjectRequest" pr
WHERE pr."serviceType" = 'build' AND pr."status" = 'handoff' AND pr."completionAcknowledgedAt" IS NOT NULL
  AND pr."handoffIssuesReportedAt" IS NULL AND pr."finalPaymentConfirmedAt" IS NULL
  AND GREATEST(COALESCE(pr."totalAgreedAmount", pr."quotedAmount", 0) - COALESCE(pr."depositAmount", 0), 0) > 0
ON CONFLICT ("projectRequestId", "stage") DO NOTHING;

-- Reconstruct paid invoices for completed Build stage payments that predate
-- billing records. Use the verified charge amount/currency as the historical
-- document basis and retain its reference in the invoice snapshot.
INSERT INTO "BillingInvoice" (
  "id", "invoiceNumber", "userId", "projectRequestId", "stage", "serviceType", "description",
  "amountMinor", "currency", "status", "issuedAt", "dueAt", "paidAt", "snapshot", "updatedAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text),
  'SMI-' || to_char(p."createdAt", 'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  p."userId", pr."id",
  CASE WHEN p."serviceType" = 'build_agreement' THEN 'deposit' ELSE 'final_balance' END,
  'build',
  CASE WHEN p."serviceType" = 'build_agreement' THEN 'Build agreement deposit - ' ELSE 'Build final balance - ' END || COALESCE(pr."title", pr."businessName", 'Website project'),
  round(p."amount")::INTEGER,
  upper(p."currency"),
  'paid', p."createdAt", p."createdAt", p."updatedAt",
  jsonb_build_object(
    'projectRequestId', pr."id",
    'projectName', COALESCE(pr."title", pr."businessName", 'Website project'),
    'historicalBackfill', true,
    'paymentReference', p."reference",
    'agreedTotal', COALESCE(pr."totalAgreedAmount", pr."quotedAmount", 0),
    'deposit', COALESCE(pr."depositAmount", 0)
  ),
  CURRENT_TIMESTAMP
FROM "Payment" p
JOIN "ProjectRequest" pr ON pr."id" = p."metadata"->>'projectRequestId' AND pr."userId" = p."userId"
WHERE p."status" = 'completed'
  AND p."serviceType" IN ('build_agreement', 'build_final_balance')
  AND p."amount" > 0
ON CONFLICT ("projectRequestId", "stage") DO NOTHING;

-- Do not associate legacy attempts whose charged amount/currency differs from
-- the invoice. Keep those attempts in account history, but leave them unlinked.
UPDATE "Payment" p SET "invoiceId" = NULL
FROM "BillingInvoice" bi
WHERE p."invoiceId" = bi."id"
  AND p."serviceType" IN ('build_agreement', 'build_final_balance')
  AND (round(p."amount")::INTEGER <> bi."amountMinor" OR upper(p."currency") <> upper(bi."currency"));

UPDATE "Payment" p SET "invoiceId" = bi."id"
FROM "BillingInvoice" bi
WHERE p."invoiceId" IS NULL
  AND round(p."amount")::INTEGER = bi."amountMinor"
  AND upper(p."currency") = upper(bi."currency")
  AND p."metadata"->>'projectRequestId' = bi."projectRequestId"
  AND ((p."serviceType" = 'build_agreement' AND bi."stage" = 'deposit')
    OR (p."serviceType" = 'build_final_balance' AND bi."stage" = 'final_balance'));
UPDATE "BillingReceipt" r SET "invoiceId" = p."invoiceId"
FROM "Payment" p
WHERE r."paymentId" = p."id" AND r."invoiceId" IS DISTINCT FROM p."invoiceId";
UPDATE "BillingInvoice" bi SET "status" = 'paid', "paidAt" = p."updatedAt"
FROM "Payment" p
WHERE p."invoiceId" = bi."id" AND p."status" = 'completed';
INSERT INTO "BillingReceipt" (
  "id", "receiptNumber", "userId", "paymentId", "invoiceId", "amountMinor", "currency", "issuedAt", "snapshot", "createdAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text),
  'SMR-' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  p."userId", p."id", p."invoiceId", round(p."amount")::INTEGER, upper(COALESCE(p."currency", 'USD')), p."updatedAt",
  jsonb_build_object('reference', p."reference", 'description', p."description", 'serviceType', p."serviceType", 'paidAt', p."updatedAt"), p."updatedAt"
FROM "Payment" p
WHERE p."status" = 'completed'
ON CONFLICT ("paymentId") DO NOTHING;

INSERT INTO "BillingRefund" (
  "id", "refundNumber", "userId", "projectRequestId", "amountMinor", "currency", "status",
  "externalReference", "externalReferences", "sourcePaymentReferences", "processedAmountMinor", "processedAt", "snapshot", "createdAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text),
  'SMF-' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  pr."userId", event."projectRequestId", round((event."eventData"->>'refundAmount')::numeric * 100)::INTEGER,
  upper(COALESCE(event."eventData"->>'currency', 'USD')), 'processed', event."eventData"->>'refundReference',
  jsonb_build_array(event."eventData"->>'refundReference'),
  COALESCE((SELECT jsonb_agg(p."reference") FROM "Payment" p WHERE p."userId" = pr."userId" AND p."status" = 'completed' AND p."serviceType" IN ('build_agreement', 'build_final_balance') AND p."metadata"->>'projectRequestId' = pr."id"), '[]'::jsonb),
  round((event."eventData"->>'refundAmount')::numeric * 100)::INTEGER,
  event."createdAt", event."eventData", event."createdAt"
FROM "ProjectConversationMessage" event
JOIN "ProjectRequest" pr ON pr."id" = event."projectRequestId"
WHERE event."kind" = 'event' AND event."eventData"->>'type' = 'cancellation_refund_processed'
  AND event."eventData"->>'refundReference' IS NOT NULL
ON CONFLICT ("externalReference") DO NOTHING;

INSERT INTO "NotificationRule" (
  "id", "slug", "name", "category", "trigger", "recipientType", "subject", "htmlTemplate",
  "availableVariables", "channels", "status", "sourceFile", "updatedAt"
) VALUES (
  'billing-invoice-reminder', 'billing-invoice-reminder', 'Billing invoice reminder', 'billing', 'Scheduled invoice reminder', 'user',
  'Payment reminder: {{invoiceNumber}}',
  '<p>Hello,</p><p>This is reminder {{reminderNumber}} of 3 for <strong>{{invoiceNumber}}</strong>: {{description}}.</p><p>Amount due: {{amount}}<br>Due date: {{dueDate}}</p><p><a href="{{dashboardUrl}}">Open your Sitemendr billing</a></p><p>If you have already paid, please allow time for verification.</p>',
  ARRAY['invoiceNumber','reminderNumber','description','amount','dueDate','dashboardUrl'], ARRAY['email'], 'active', 'billingRecords', CURRENT_TIMESTAMP
) ON CONFLICT ("slug") DO NOTHING;

COMMIT;
