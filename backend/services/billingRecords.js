const { prisma } = require('../config/db');
const { notify } = require('./notify');
const logger = require('../config/logger');

const makeNumber = (prefix) => `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${require('crypto').randomBytes(4).toString('hex').toUpperCase()}`;

async function issueBuildInvoice(request, stage) {
  if (!request?.id || !request.userId) return null;
  const amount = stage === 'deposit'
    ? Number(request.depositAmount || request.totalAgreedAmount || request.quotedAmount || 0)
    : Math.max(Number(request.totalAgreedAmount || request.quotedAmount || 0) - Number(request.depositAmount || 0), 0);
  const amountMinor = Math.round(amount * 100);
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) return null;

  const where = { projectRequestId_stage: { projectRequestId: request.id, stage } };
  const existing = await prisma.billingInvoice.findUnique({ where });
  if (existing) return existing;
  const issuedAt = new Date();
  const dueAt = stage === 'deposit' ? (request.paymentDueDate || null) : issuedAt;
  const nextReminderAt = dueAt
    ? new Date(Math.max(issuedAt.getTime() + 24 * 60 * 60 * 1000, new Date(dueAt).getTime() - 24 * 60 * 60 * 1000))
    : null;

  const quote = await prisma.projectQuoteVersion.findFirst({
    where: { projectRequestId: request.id, status: 'accepted' },
    orderBy: { version: 'desc' },
    select: { id: true, version: true, snapshot: true }
  });
  try {
    return await prisma.billingInvoice.create({
    data: {
      invoiceNumber: makeNumber('SMI'),
      userId: request.userId,
      projectRequestId: request.id,
      stage,
      serviceType: 'build',
      description: `${stage === 'deposit' ? 'Build agreement deposit' : 'Build final balance'} - ${request.title || request.businessName || 'Website project'}`,
      amountMinor,
      currency: String(request.quoteCurrency || quote?.snapshot?.currency || 'USD').toUpperCase(),
      issuedAt,
      dueAt,
      nextReminderAt,
      snapshot: {
        projectRequestId: request.id,
        projectName: request.title || request.businessName || 'Website project',
        quoteVersionId: quote?.id || null,
        quoteVersion: quote?.version || null,
        acceptedQuote: quote?.snapshot || null,
        agreedTotal: Number(request.totalAgreedAmount || request.quotedAmount || 0),
        deposit: Number(request.depositAmount || 0)
      }
    }
    });
  } catch (error) {
    if (error.code === 'P2002') return prisma.billingInvoice.findUnique({ where });
    throw error;
  }
}

async function issueAddonInvoice({ userId, subscriptionId, addon, siteName }) {
  if (!userId || !subscriptionId || !addon?.id) return null;
  const where = { subscriptionId_stage: { subscriptionId, stage: `addon:${addon.id}` } };
  const existing = await prisma.billingInvoice.findUnique({ where });
  if (existing) return existing;
  try {
    return await prisma.billingInvoice.create({
      data: {
        invoiceNumber: makeNumber('SMI'),
        userId,
        subscriptionId,
        stage: `addon:${addon.id}`,
        serviceType: 'addon',
        description: `${addon.name} add-on${siteName ? ` for ${siteName}` : ''}`,
        amountMinor: Math.round(Number(addon.price) * 100),
        currency: 'USD',
        status: 'open',
        snapshot: { addonId: addon.id, addonName: addon.name, subscriptionId, siteName: siteName || null }
      }
    });
  } catch (error) {
    if (error.code === 'P2002') return prisma.billingInvoice.findUnique({ where });
    throw error;
  }
}

async function issueReceiptForPayment(payment) {
  if (!payment || payment.status !== 'completed') return null;
  const existing = await prisma.billingReceipt.findUnique({ where: { paymentId: payment.id } });
  if (existing) return existing;
  const invoiceId = payment.invoiceId || null;
  try {
    return await prisma.billingReceipt.create({
    data: {
      receiptNumber: makeNumber('SMR'),
      userId: payment.userId,
      paymentId: payment.id,
      invoiceId,
      amountMinor: Math.round(Number(payment.amount)),
      currency: String(payment.currency || 'USD').toUpperCase(),
      snapshot: {
        reference: payment.reference,
        description: payment.description,
        serviceType: payment.serviceType,
        paidAt: payment.updatedAt || payment.createdAt
      }
    }
    });
  } catch (error) {
    if (error.code === 'P2002') return prisma.billingReceipt.findUnique({ where: { paymentId: payment.id } });
    throw error;
  }
}

async function runInvoiceReminders() {
  const now = new Date();
  const dueInvoices = await prisma.billingInvoice.findMany({
    where: {
      status: { in: ['open', 'overdue'] },
      reminderCount: { lt: 3 },
      nextReminderAt: { lte: now },
      dueAt: { not: null }
    },
    include: { user: { select: { email: true } } },
    orderBy: { nextReminderAt: 'asc' },
    take: 100
  });
  let sent = 0;

  for (const invoice of dueInvoices) {
    const nextCount = invoice.reminderCount + 1;
    const dueAt = new Date(invoice.dueAt);
    const nextReminderAt = nextCount >= 3
      ? null
      : new Date(Math.max(
          nextCount === 1 ? dueAt.getTime() : dueAt.getTime() + 3 * 24 * 60 * 60 * 1000,
          now.getTime() + 24 * 60 * 60 * 1000
        ));
    const claim = await prisma.billingInvoice.updateMany({
      where: {
        id: invoice.id,
        status: { in: ['open', 'overdue'] },
        reminderCount: invoice.reminderCount,
        nextReminderAt: invoice.nextReminderAt
      },
      data: {
        reminderCount: nextCount,
        lastReminderAt: now,
        nextReminderAt,
        ...(dueAt < now ? { status: 'overdue' } : {})
      }
    });
    if (!claim.count) continue;

    // A checkout may start after the reminder query but before its claim.
    // Recheck the invoice before contacting the client so an active payment
    // attempt does not receive a stale "please pay" reminder.
    const currentInvoice = await prisma.billingInvoice.findUnique({
      where: { id: invoice.id },
      select: { status: true }
    });
    if (!currentInvoice || !['open', 'overdue'].includes(currentInvoice.status)) {
      if (currentInvoice?.status === 'processing') {
        await prisma.billingInvoice.updateMany({
          where: { id: invoice.id, status: 'processing', reminderCount: nextCount, lastReminderAt: now },
          data: {
            reminderCount: invoice.reminderCount,
            lastReminderAt: invoice.lastReminderAt,
            nextReminderAt: invoice.nextReminderAt
          }
        });
      }
      continue;
    }

    const amount = `${invoice.currency} ${(invoice.amountMinor / 100).toFixed(2)}`;
    const dueDate = dueAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?tab=billing`;
    let dashboardDelivered = false;
    let emailDelivered = false;
    try {
      const message = await prisma.message.findFirst({
        where: { userId: invoice.userId, subject: `Payment reminder: ${invoice.invoiceNumber}`, content: { startsWith: `Reminder ${nextCount} of 3:` } },
        select: { id: true }
      });
      if (!message) {
        await prisma.message.create({
          data: {
            userId: invoice.userId,
            subject: `Payment reminder: ${invoice.invoiceNumber}`,
            content: `Reminder ${nextCount} of 3: ${invoice.description}. ${amount} is due ${dueDate}. Open Billing in your Sitemendr dashboard to review the invoice.`,
            sender: 'Sitemendr Billing'
          }
        });
      }
      dashboardDelivered = true;
    } catch (error) {
      logger.error('BILLING_REMINDER_DASHBOARD_DELIVERY_FAILED', { invoiceId: invoice.id, reminderNumber: nextCount, error: error.message });
    }
    try {
      const email = await notify('billing-invoice-reminder', {
        to: invoice.user?.email,
        invoiceNumber: invoice.invoiceNumber,
        reminderNumber: nextCount,
        description: invoice.description,
        amount,
        dueDate,
        dashboardUrl
      });
      if (email.sent) {
        emailDelivered = true;
        sent += 1;
      }
    } catch (error) {
      logger.error('BILLING_REMINDER_EMAIL_DELIVERY_FAILED', { invoiceId: invoice.id, reminderNumber: nextCount, error: error.message });
    }
    if (!dashboardDelivered && !emailDelivered) {
      // Release the reminder slot so the next scheduled run can retry. Keep the
      // invoice's due/overdue state and avoid consuming one of the three reminders.
      await prisma.billingInvoice.updateMany({
        where: { id: invoice.id, reminderCount: nextCount, lastReminderAt: now },
        data: { reminderCount: invoice.reminderCount, lastReminderAt: invoice.lastReminderAt, nextReminderAt: new Date(now.getTime() + 60 * 60 * 1000) }
      });
    }
  }
  return { considered: dueInvoices.length, emailSent: sent };
}

async function reconcileCompletedPaymentBillingRecords(limit = 250) {
  const payments = await prisma.payment.findMany({
    where: {
      status: 'completed',
      OR: [
        { receipt: { is: null } },
        { invoice: { is: { status: { notIn: ['paid', 'void'] } } } }
      ]
    },
    select: {
      id: true,
      status: true,
      invoiceId: true,
      updatedAt: true,
      createdAt: true,
      receipt: { select: { id: true } },
      invoice: { select: { status: true } }
    },
    orderBy: { updatedAt: 'asc' },
    take: limit
  });

  let reconciled = 0;
  let failed = 0;
  for (const payment of payments) {
    if (payment.receipt && (!payment.invoiceId || ['paid', 'void'].includes(payment.invoice?.status))) continue;
    try {
      if (!payment.receipt) {
        const fullPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
        await issueReceiptForPayment(fullPayment);
      }
      if (payment.invoiceId && payment.invoice?.status !== 'void' && payment.invoice?.status !== 'paid') {
        await prisma.billingInvoice.updateMany({
          where: { id: payment.invoiceId, status: { notIn: ['paid', 'void'] } },
          data: { status: 'paid', paidAt: payment.updatedAt || payment.createdAt }
        });
      }
      reconciled += 1;
    } catch (error) {
      failed += 1;
      logger.error('BILLING_RECORD_RECONCILIATION_FAILED', { paymentId: payment.id, error: error.message });
    }
  }

  return { scanned: payments.length, reconciled, failed };
}

async function reconcilePayableBuildInvoices() {
  const requests = await prisma.projectRequest.findMany({
    where: {
      serviceType: 'build',
      OR: [
        { status: 'payment_agreement', paymentAgreementStatus: 'sent' },
        { status: 'handoff', completionAcknowledgedAt: { not: null }, handoffIssuesReportedAt: null, finalPaymentConfirmedAt: null }
      ]
    },
    select: {
      id: true,
      userId: true,
      title: true,
      businessName: true,
      status: true,
      paymentAgreementStatus: true,
      paymentDueDate: true,
      completionAcknowledgedAt: true,
      handoffIssuesReportedAt: true,
      finalPaymentConfirmedAt: true,
      depositAmount: true,
      totalAgreedAmount: true,
      quotedAmount: true,
      quoteCurrency: true
    },
    take: 250
  });

  let ensured = 0;
  let failed = 0;
  for (const request of requests) {
    const stage = request.status === 'payment_agreement' ? 'deposit' : 'final_balance';
    try {
      await issueBuildInvoice(request, stage);
      ensured += 1;
    } catch (error) {
      failed += 1;
      logger.error('BUILD_INVOICE_RECONCILIATION_FAILED', { projectRequestId: request.id, stage, error: error.message });
    }
  }
  return { considered: requests.length, ensured, failed };
}

module.exports = {
  issueBuildInvoice,
  issueAddonInvoice,
  issueReceiptForPayment,
  runInvoiceReminders,
  reconcileCompletedPaymentBillingRecords,
  reconcilePayableBuildInvoices
};
