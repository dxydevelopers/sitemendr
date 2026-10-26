const { prisma } = require('../config/db');
const { notifyUser, notifyAdmins } = require('../services/socketService');
const OpenAI = require('openai');
const Groq = require('groq-sdk');
const logger = require('../config/logger');
const { convertCurrencyAmount, normalizeCurrency } = require('../utils/currency');
const { recordProjectEvent } = require('../services/projectConversation');
const { ensureCompletedBuildSite } = require('../services/projectSiteService');
const { verifyDomainDns, getHostingDomainTarget } = require('../services/domainDnsService');
const { issueBuildInvoice } = require('../services/billingRecords');
const { isBuildManagementUnlocked, getSiteManagementLockReason } = require('../services/siteManagement');
const { AVAILABILITY_SUMMARY_DAYS, AVAILABILITY_HISTORY_RETENTION_DAYS } = require('../services/performancePolicy');

const getStoredAvailability = performanceData => ({
  status: performanceData?.status === 'UP' || performanceData?.status === 'DOWN' ? performanceData.status : null,
  latency: Number.isFinite(Number(performanceData?.latency)) && Number(performanceData?.latency) > 0
    ? Number(performanceData.latency)
    : null,
  statusCode: Number.isFinite(Number(performanceData?.statusCode)) && Number(performanceData?.statusCode) > 0
    ? Number(performanceData.statusCode)
    : null,
  lastChecked: typeof performanceData?.lastChecked === 'string' ? performanceData.lastChecked : null,
  error: typeof performanceData?.error === 'string' ? performanceData.error : null
});

const isPerformanceContextMigrationPending = error => error?.code === 'P2022'
  && /performanceContext/i.test(`${error?.meta?.column || ''} ${error?.message || ''}`);

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const reviewChatSelect = `"id","projectRequestId","senderId","senderRole","message","kind","choices","selectedChoice","attachments","readByAdmin","readByClient","createdAt"`;

const handoffChatSelect = `"id","projectRequestId","senderId","senderRole","message","kind","choices","selectedChoice","attachments","readByAdmin","readByClient","createdAt"`;
const projectConversationSelect = `"id","projectRequestId","senderId","senderRole","message","kind","choices","selectedChoice","attachments","eventData","readByAdmin","readByClient","createdAt"`;

const getProjectConversation = async (requestId) => prisma.$queryRawUnsafe(
  `SELECT ${projectConversationSelect}
   FROM "ProjectConversationMessage"
   WHERE "projectRequestId" = $1
   ORDER BY "createdAt" ASC, "id" ASC`,
  requestId
);

const sanitizeReviewChatChoices = (choices) => {
  if (!Array.isArray(choices)) return null;
  const cleaned = choices
    .map(choice => typeof choice === 'string' ? choice.trim() : '')
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : null;
};

const normalizeReviewChatKind = (kind, choices) => {
  if (kind === 'choice_response') return 'choice_response';
  if (kind === 'file') return 'file';
  if (kind === 'question' || (Array.isArray(choices) && choices.length)) return 'question';
  return 'message';
};

const mapProjectRequestForClient = (request) => {
  const statusProgress = {
    submitted: 10,
    in_review: 25,
    quote_ready: 40,
    quoted: 40,
    approved: 55,
    payment_agreement: 62,
    in_development: 70,
    staging_review: 85,
    launched: 92,
    handoff: 96,
    completed: 100,
    cancelled: 0,
    archived: 0
  };
  const milestoneProgress = request.buildMilestones?.length
    ? Math.round(
        request.buildMilestones.reduce((sum, milestone) => {
          if (milestone.status === 'completed') return sum + 100;
          return sum + (milestone.progress || 0);
        }, 0) / request.buildMilestones.length
      )
    : null;

  return {
    id: request.id,
    recordType: 'request',
    canManageSite: false,
    assessmentId: request.assessmentId,
    subscriptionId: request.subscriptionId,
    serviceType: request.serviceType,
    name: request.title || request.businessName || 'Untitled request',
    businessName: request.businessName,
    progress: milestoneProgress ?? statusProgress[request.status] ?? 10,
    status: request.status,
    planType: request.packageIntent,
    budget: request.budget,
    timeline: request.timeline,
    summary: request.summary,
    priority: request.priority,
    quotedAmount: request.quotedAmount,
    quoteCurrency: request.quoteCurrency,
    paymentAgreementType: request.paymentAgreementType,
    paymentAgreementStatus: request.paymentAgreementStatus,
    depositAmount: request.depositAmount,
    totalAgreedAmount: request.totalAgreedAmount,
    paymentDueDate: request.paymentDueDate,
    paymentInstructions: request.paymentInstructions,
    paymentConfirmedAt: request.paymentConfirmedAt,
    productionMode: request.productionMode,
    productionSourceNote: request.productionSourceNote,
    stagingUrl: request.stagingUrl,
    stagingNotes: request.stagingNotes,
    stagingReviewStatus: request.stagingReviewStatus,
    stagingReviewedAt: request.stagingReviewedAt,
    launchUrl: request.launchUrl,
    launchNotes: request.launchNotes,
    launchApprovedAt: request.launchApprovedAt,
    handoffNotes: request.handoffNotes,
    completionNotes: request.completionNotes,
    completionAcknowledgedAt: request.completionAcknowledgedAt,
    handoffIssuesReportedAt: request.handoffIssuesReportedAt,
    finalPaymentConfirmedAt: request.finalPaymentConfirmedAt,
    completedAt: request.completedAt,
    buildMilestones: request.buildMilestones,
    studioLinks: request.studioLinks,
    studioUpdates: request.studioUpdates,
    quoteVersions: request.quoteVersions,
    clientNotes: request.clientNotes,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    isCurrent: ['submitted', 'in_review', 'quote_ready', 'quoted', 'approved', 'payment_agreement', 'in_development', 'staging_review', 'launched', 'handoff'].includes(request.status),
    reviewRequested: request.status === 'in_review',
    reviewNotes: request.adminNotes,
    assessment: request.assessment
  };
};

// Get client dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subscriptionId } = req.query;

    const subscriptions = await prisma.subscription.findMany({
      where: { 
        userId,
        ...(subscriptionId && { id: subscriptionId })
      },
      select: { id: true, performanceData: true }
    });

    const selectedPerformance = subscriptionId && subscriptions[0]?.performanceData && typeof subscriptions[0].performanceData === 'object'
      ? subscriptions[0].performanceData
      : null;
    const measuredLatency = Number(selectedPerformance?.latency);

    res.json({
      success: true,
      stats: {
        activeNodes: subscriptions.length,
        uptime: null,
        securityLevel: null,
        latency: Number.isFinite(measuredLatency) && measuredLatency > 0 ? measuredLatency : null,
        availabilityStatus: selectedPerformance?.status === 'UP' || selectedPerformance?.status === 'DOWN'
          ? selectedPerformance.status
          : null,
        lastChecked: typeof selectedPerformance?.lastChecked === 'string' ? selectedPerformance.lastChecked : null,
        metricsAvailable: Boolean(selectedPerformance?.lastChecked)
      }
    });
  } catch (error) {
    logger.error('Failed to get client dashboard stats', {
      errorCode: 'GET_CLIENT_STATS_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard stats'
    });
  }
};

// Get site vitals (Performance, SEO, Accessibility)
exports.getSiteVitals = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.userId;

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId }
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // Check if we have stored performance data
    if (subscription.performanceData?.provider === 'pagespeed' && subscription.performanceData.metrics) {
      return res.json({
        success: true,
        vitals: subscription.performanceData.metrics,
        aiInsights: subscription.performanceData.insights,
        strategy: subscription.performanceData.strategy || 'mobile',
        timestamp: subscription.performanceData.timestamp,
        availability: getStoredAvailability(subscription.performanceData)
      });
    }

    res.json({
      success: true,
      vitals: null,
      aiInsights: null,
      strategy: null,
      timestamp: null,
      availability: getStoredAvailability(subscription.performanceData)
    });
  } catch (error) {
    logger.error('Failed to get site vitals', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to retrieve vitals' });
  }
};

exports.getPerformanceScans = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.userId;
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
      select: { id: true }
    });
    if (!subscription) return res.status(404).json({ success: false, message: 'Site not found.' });

    const scans = await prisma.performanceScan.findMany({
      where: { subscriptionId },
      orderBy: { scannedAt: 'desc' },
      take: 50
    });
    res.json({ success: true, data: scans });
  } catch (error) {
    if (error?.code === 'P2021' || error?.meta?.code === '42P01') {
      return res.json({ success: true, data: [], historyAvailable: false });
    }
    logger.error('GET_CLIENT_PERFORMANCE_SCANS_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to load performance scan history.' });
  }
};

exports.getSiteAvailabilityHistory = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.userId;
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
      select: { id: true }
    });
    if (!subscription) return res.status(404).json({ success: false, message: 'Site not found.' });

    const since = new Date(Date.now() - AVAILABILITY_SUMMARY_DAYS * 24 * 60 * 60 * 1000);
    const [checks, scheduledTotal, scheduledUp] = await Promise.all([
      prisma.siteAvailabilityCheck.findMany({
        where: { subscriptionId, checkedAt: { gte: since } },
        orderBy: { checkedAt: 'desc' },
        take: 100,
        select: { id: true, status: true, statusCode: true, responseTimeMs: true, error: true, source: true, checkedAt: true }
      }),
      prisma.siteAvailabilityCheck.count({
        where: { subscriptionId, source: 'scheduled', checkedAt: { gte: since } }
      }),
      prisma.siteAvailabilityCheck.count({
        where: { subscriptionId, source: 'scheduled', status: 'UP', checkedAt: { gte: since } }
      })
    ]);

    res.json({
      success: true,
      data: checks,
      summary: {
        periodDays: AVAILABILITY_SUMMARY_DAYS,
        retentionDays: AVAILABILITY_HISTORY_RETENTION_DAYS,
        scheduledChecks: scheduledTotal,
        uptimePercent: scheduledTotal ? Math.round((scheduledUp / scheduledTotal) * 10000) / 100 : null
      }
    });
  } catch (error) {
    if (error?.code === 'P2021' || error?.meta?.code === '42P01') {
      return res.json({ success: true, data: [], historyAvailable: false, summary: { periodDays: AVAILABILITY_SUMMARY_DAYS, retentionDays: AVAILABILITY_HISTORY_RETENTION_DAYS, scheduledChecks: 0, uptimePercent: null } });
    }
    logger.error('GET_CLIENT_SITE_AVAILABILITY_HISTORY_ERROR:', error);
    res.status(500).json({ success: false, message: 'Site availability history could not be loaded.' });
  }
};

exports.getPerformanceRequests = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.userId;
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
      select: { id: true }
    });
    if (!subscription) return res.status(404).json({ success: false, message: 'Site not found.' });

    const requests = await prisma.projectRequest.findMany({
      where: { userId, subscriptionId, serviceType: 'performance' },
      select: {
        id: true,
        title: true,
        businessName: true,
        serviceType: true,
        summary: true,
        status: true,
        quotedAmount: true,
        quoteCurrency: true,
        paymentAgreementType: true,
        paymentAgreementStatus: true,
        performanceContext: true,
        completionNotes: true,
        createdAt: true,
        updatedAt: true,
        quoteVersions: { orderBy: { version: 'desc' } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });
    const invoices = requests.length ? await prisma.billingInvoice.findMany({
      where: {
        userId,
        projectRequestId: { in: requests.map(request => request.id) },
        stage: { startsWith: 'performance_' }
      },
      orderBy: { issuedAt: 'desc' }
    }) : [];
    const invoicesByRequest = new Map();
    for (const invoice of invoices) {
      if (!invoicesByRequest.has(invoice.projectRequestId)) invoicesByRequest.set(invoice.projectRequestId, []);
      invoicesByRequest.get(invoice.projectRequestId).push(invoice);
    }
    res.json({ success: true, data: requests.map(request => ({ ...request, invoices: invoicesByRequest.get(request.id) || [] })) });
  } catch (error) {
    if (isPerformanceContextMigrationPending(error)) {
      return res.status(503).json({ success: false, message: 'Performance request storage is not ready yet. Apply the pending Performance migration.' });
    }
    logger.error('GET_CLIENT_PERFORMANCE_REQUESTS_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to load performance requests.' });
  }
};

exports.createPerformanceRequest = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.userId;
    const goal = typeof req.body?.goal === 'string' ? req.body.goal.trim() : '';
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';
    const scanId = typeof req.body?.scanId === 'string' ? req.body.scanId : null;
    const findingIndex = req.body?.findingIndex;
    const evidenceLinksInput = Array.isArray(req.body?.evidenceLinks) ? req.body.evidenceLinks : [];

    if (!goal || goal.length > 3000) {
      return res.status(400).json({ success: false, message: 'Describe the improvement you want (up to 3000 characters).' });
    }
    if (notes.length > 3000) return res.status(400).json({ success: false, message: 'Notes must be 3000 characters or fewer.' });
    if (evidenceLinksInput.length > 5) return res.status(400).json({ success: false, message: 'Add up to five evidence links.' });

    const evidenceLinks = [];
    for (const candidate of evidenceLinksInput) {
      if (typeof candidate !== 'string' || candidate.length > 2048) {
        return res.status(400).json({ success: false, message: 'Each evidence item must be a valid HTTPS link.' });
      }
      try {
        const evidenceUrl = new URL(candidate);
        if (evidenceUrl.protocol !== 'https:') throw new Error('Unsupported protocol');
        evidenceLinks.push(evidenceUrl.toString());
      } catch {
        return res.status(400).json({ success: false, message: 'Each evidence item must be a valid HTTPS link.' });
      }
    }

    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
      select: { id: true, siteName: true, customName: true, domain: true }
    });
    if (!subscription) return res.status(404).json({ success: false, message: 'Site not found.' });

    const lockReason = await getSiteManagementLockReason(userId, subscriptionId);
    if (lockReason) return res.status(403).json({ success: false, message: lockReason });

    let scan = null;
    let selectedFinding = null;
    if (scanId) {
      scan = await prisma.performanceScan.findFirst({
        where: { id: scanId, subscriptionId },
        select: {
          id: true,
          url: true,
          provider: true,
          strategy: true,
          score: true,
          metrics: true,
          recommendations: true,
          issues: true,
          conditions: true,
          scannedAt: true
        }
      });
      if (!scan) return res.status(400).json({ success: false, message: 'Choose a scan from this site.' });

      if (findingIndex !== undefined && findingIndex !== null) {
        const recommendations = Array.isArray(scan.recommendations) ? scan.recommendations : [];
        if (!Number.isInteger(findingIndex) || findingIndex < 0 || findingIndex >= recommendations.length) {
          return res.status(400).json({ success: false, message: 'Choose a finding from the selected scan.' });
        }
        selectedFinding = recommendations[findingIndex];
      }
    } else if (findingIndex !== undefined && findingIndex !== null) {
      return res.status(400).json({ success: false, message: 'A scan is required when selecting a finding.' });
    }

    const findingTitle = typeof selectedFinding?.task === 'string' ? selectedFinding.task.trim() : '';
    const title = `Performance improvement: ${(findingTitle || goal).slice(0, 100)}`;
    const performanceContext = {
      goal,
      notes: notes || null,
      evidenceLinks,
      baseline: scan ? {
        scanId: scan.id,
        url: scan.url,
        provider: scan.provider,
        strategy: scan.strategy,
        score: scan.score,
        metrics: scan.metrics,
        scannedAt: scan.scannedAt.toISOString(),
        finding: selectedFinding
      } : null
    };

    const request = await prisma.projectRequest.create({
      data: {
        userId,
        subscriptionId,
        serviceType: 'performance',
        title,
        businessName: subscription.siteName || subscription.customName || subscription.domain || 'Client site',
        summary: goal,
        status: 'submitted',
        performanceContext,
        conversationMessages: {
          create: {
            senderId: userId,
            senderRole: 'client',
            message: goal,
            attachments: evidenceLinks.length ? evidenceLinks.map(url => ({ type: 'link', url })) : null,
            eventData: { type: 'performance_request_submitted', scanId: scan?.id || null }
          }
        }
      },
      select: {
        id: true,
        userId: true,
        subscriptionId: true,
        title: true,
        businessName: true,
        serviceType: true,
        summary: true,
        status: true,
        performanceContext: true,
        createdAt: true,
        updatedAt: true,
        conversationMessages: { orderBy: { createdAt: 'asc' }, take: 1 }
      }
    });
    const payload = { request };
    notifyAdmins('performance_request_created', payload);
    if (request.conversationMessages?.[0]) {
      notifyAdmins('project_conversation_message', { requestId: request.id, message: request.conversationMessages[0] });
    }
    res.status(201).json({ success: true, data: request, message: 'Performance request sent to Sitemendr.' });
  } catch (error) {
    if (isPerformanceContextMigrationPending(error)) {
      return res.status(503).json({ success: false, message: 'Performance request storage is not ready yet. Apply the pending Performance migration.' });
    }
    logger.error('CREATE_CLIENT_PERFORMANCE_REQUEST_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to create performance request.' });
  }
};

exports.respondToPerformanceQuote = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;
    const action = req.body?.action;
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const termsAccepted = req.body?.termsAccepted === true;
    if (!['accept', 'decline', 'discuss'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Choose accept, decline, or discuss for this proposal.' });
    }
    if (action === 'discuss' && (!message || message.length > 4000)) {
      return res.status(400).json({ success: false, message: 'Add a short message to discuss the proposal.' });
    }
    if (action === 'accept' && !termsAccepted) {
      return res.status(400).json({ success: false, message: 'Confirm the proposal scope and payment terms before accepting.' });
    }

    const request = await prisma.projectRequest.findFirst({
      where: { id: requestId, userId, serviceType: 'performance' },
      select: { id: true, userId: true, title: true, status: true }
    });
    if (!request) return res.status(404).json({ success: false, message: 'Performance request not found.' });
    if (action === 'accept' && request.status === 'awaiting_payment') {
      const acceptedQuote = await prisma.projectQuoteVersion.findFirst({
        where: { projectRequestId: requestId, status: 'accepted' },
        orderBy: { version: 'desc' },
        select: { version: true }
      });
      const existingInvoice = acceptedQuote ? await prisma.billingInvoice.findUnique({
        where: { projectRequestId_stage: { projectRequestId: requestId, stage: `performance_quote_${acceptedQuote.version}` } }
      }) : null;
      if (existingInvoice) return res.json({ success: true, data: request, invoice: existingInvoice, message: 'Proposal already accepted. Continue to payment.' });
    }
    const quote = await prisma.projectQuoteVersion.findFirst({
      where: { projectRequestId: requestId, status: 'sent' },
      orderBy: { version: 'desc' },
      select: { id: true, version: true, snapshot: true }
    });

    if (action === 'discuss') {
      if (!quote || request.status !== 'scope_and_quote') return res.status(409).json({ success: false, message: 'There is no current proposal to discuss.' });
      const chatMessage = await prisma.projectConversationMessage.create({
        data: { projectRequestId: requestId, senderId: userId, senderRole: 'client', message }
      });
      notifyAdmins('project_conversation_message', { requestId, message: chatMessage });
      res.json({ success: true, data: chatMessage, message: 'Your question was added to the proposal conversation.' });
      return;
    }

    if (action === 'decline') {
      if (!quote || request.status !== 'scope_and_quote') return res.status(409).json({ success: false, message: 'There is no current proposal to decline.' });
      const outcome = await prisma.$transaction(async tx => {
        const quoteTransition = await tx.projectQuoteVersion.updateMany({ where: { id: quote.id, status: 'sent' }, data: { status: 'declined' } });
        const requestTransition = await tx.projectRequest.updateMany({ where: { id: requestId, userId, status: 'scope_and_quote' }, data: { status: 'declined', rejectedAt: new Date() } });
        if (quoteTransition.count !== 1 || requestTransition.count !== 1) throw Object.assign(new Error('The proposal changed before your response was saved.'), { code: 'PERFORMANCE_STATE_CHANGED' });
        return tx.projectConversationMessage.create({
          data: {
            projectRequestId: requestId,
            senderId: userId,
            senderRole: 'client',
            message: message || 'I have declined this proposal.',
            eventData: { type: 'performance_quote_declined', quoteVersionId: quote.id, version: quote.version }
          }
        });
      });
      notifyAdmins('project_conversation_message', { requestId, message: outcome });
      const updated = await prisma.projectRequest.findUnique({ where: { id: requestId } });
      notifyAdmins('performance_request_updated', { request: updated });
      notifyUser(userId, 'performance_request_updated', { request: updated });
      return res.json({ success: true, data: updated, message: 'Proposal declined.' });
    }

    if (!quote || request.status !== 'scope_and_quote') return res.status(409).json({ success: false, message: 'There is no current proposal waiting for acceptance.' });

    const snapshot = quote.snapshot && typeof quote.snapshot === 'object' ? quote.snapshot : {};
    const totalAmount = Number(snapshot.totalAgreedAmount || snapshot.amount || 0);
    const paymentSchedule = snapshot.paymentSchedule;
    const invoiceAmount = paymentSchedule === 'deposit_balance' ? Number(snapshot.depositAmount || 0) : totalAmount;
    const currency = String(snapshot.currency || 'USD').toUpperCase();
    const amountMinor = Math.round(invoiceAmount * 100);
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0 || !/^[A-Z]{3}$/.test(currency)) {
      return res.status(409).json({ success: false, message: 'The proposal does not contain valid payment terms. Ask Sitemendr to review it.' });
    }

    const result = await prisma.$transaction(async tx => {
      const quoteTransition = await tx.projectQuoteVersion.updateMany({ where: { id: quote.id, status: 'sent' }, data: { status: 'accepted', acceptedAt: new Date() } });
      const requestTransition = await tx.projectRequest.updateMany({
        where: { id: requestId, userId, status: 'scope_and_quote' },
        data: {
          status: 'awaiting_payment',
          approvedAt: new Date(),
          paymentAgreementStatus: 'sent',
          paymentConfirmedAt: null,
          finalPaymentConfirmedAt: null
        }
      });
      if (quoteTransition.count !== 1 || requestTransition.count !== 1) throw Object.assign(new Error('The proposal changed before your acceptance was saved.'), { code: 'PERFORMANCE_STATE_CHANGED' });
      const now = new Date();
      const dueAt = snapshot.paymentDueDate ? new Date(snapshot.paymentDueDate) : null;
      const invoice = await tx.billingInvoice.create({
        data: {
          invoiceNumber: `SMI-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${require('crypto').randomBytes(4).toString('hex').toUpperCase()}`,
          userId,
          projectRequestId: requestId,
          stage: `performance_quote_${quote.version}`,
          serviceType: 'performance',
          description: `Performance improvement payment - ${request.title}`,
          amountMinor,
          currency,
          status: 'open',
          issuedAt: now,
          dueAt,
          nextReminderAt: dueAt ? new Date(Math.max(now.getTime() + 24 * 60 * 60 * 1000, dueAt.getTime() - 24 * 60 * 60 * 1000)) : null,
          snapshot: {
            projectRequestId: requestId,
            projectName: request.title,
            quoteVersionId: quote.id,
            quoteVersion: quote.version,
            acceptedQuote: snapshot,
            paymentStage: paymentSchedule === 'deposit_balance' ? 'deposit' : 'full'
          }
        }
      });
      const event = await tx.projectConversationMessage.create({
        data: {
          projectRequestId: requestId,
          senderId: userId,
          senderRole: 'system',
          kind: 'event',
          message: `Client accepted proposal version ${quote.version}. The invoice is ready for payment.`,
          eventData: { type: 'performance_quote_accepted', quoteVersionId: quote.id, version: quote.version, invoiceId: invoice.id, amountMinor, currency }
        }
      });
      const updated = await tx.projectRequest.findUnique({ where: { id: requestId } });
      return { invoice, event, request: updated };
    });

    notifyAdmins('project_conversation_message', { requestId, message: result.event });
    notifyUser(userId, 'project_conversation_message', { requestId, message: result.event });
    notifyAdmins('performance_request_updated', { request: result.request });
    notifyUser(userId, 'performance_request_updated', { request: result.request });
    res.json({ success: true, data: result.request, invoice: result.invoice, message: 'Proposal accepted. Review the invoice to begin payment.' });
  } catch (error) {
    if (error.code === 'PERFORMANCE_STATE_CHANGED') return res.status(409).json({ success: false, message: error.message });
    logger.error('RESPOND_TO_PERFORMANCE_QUOTE_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to respond to the Performance proposal.' });
  }
};

exports.respondToPerformanceReview = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;
    const action = req.body?.action;
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!['accept', 'changes'].includes(action)) return res.status(400).json({ success: false, message: 'Choose whether to accept the work or request changes.' });
    if (action === 'changes' && (!message || message.length > 4000)) return res.status(400).json({ success: false, message: 'Describe the changes you need (up to 4000 characters).' });

    const request = await prisma.projectRequest.findFirst({
      where: { id: requestId, userId, serviceType: 'performance' },
      select: { id: true, userId: true, title: true, subscriptionId: true, status: true }
    });
    if (!request) return res.status(404).json({ success: false, message: 'Performance request not found.' });
    const quote = await prisma.projectQuoteVersion.findFirst({
      where: { projectRequestId: requestId, status: 'accepted' }, orderBy: { version: 'desc' },
      select: { id: true, version: true, snapshot: true }
    });
    if (!quote) return res.status(409).json({ success: false, message: 'The accepted Performance proposal could not be found.' });

    if (action === 'accept' && request.status === 'awaiting_final_payment') {
      const invoice = await prisma.billingInvoice.findUnique({ where: { projectRequestId_stage: { projectRequestId: requestId, stage: `performance_balance_${quote.version}` } } });
      if (invoice) return res.json({ success: true, data: request, invoice, message: 'Work is accepted. The final balance invoice is ready.' });
    }
    if (action === 'accept' && request.status === 'completed') {
      return res.json({ success: true, data: request, message: 'This Performance request is already complete.' });
    }
    if (request.status !== 'ready_for_review') return res.status(409).json({ success: false, message: 'This Performance work is not waiting for review.' });

    if (action === 'changes') {
      const result = await prisma.$transaction(async tx => {
        const changed = await tx.projectRequest.updateMany({ where: { id: requestId, userId, serviceType: 'performance', status: 'ready_for_review' }, data: { status: 'in_progress' } });
        if (changed.count !== 1) throw Object.assign(new Error('The review stage changed. Refresh and try again.'), { code: 'PERFORMANCE_STATE_CHANGED' });
        const chatMessage = await tx.projectConversationMessage.create({
          data: { projectRequestId: requestId, senderId: userId, senderRole: 'client', message, eventData: { type: 'performance_changes_requested', quoteVersionId: quote.id } }
        });
        return { chatMessage, updated: await tx.projectRequest.findUnique({ where: { id: requestId } }) };
      });
      notifyAdmins('project_conversation_message', { requestId, message: result.chatMessage });
      notifyUser(userId, 'performance_request_updated', { request: result.updated });
      notifyAdmins('performance_request_updated', { request: result.updated });
      return res.json({ success: true, data: result.updated, message: 'Your change request was sent to Sitemendr.' });
    }

    const snapshot = quote.snapshot && typeof quote.snapshot === 'object' ? quote.snapshot : {};
    const paymentSchedule = snapshot.paymentSchedule;
    const balanceAmount = Math.max(0, Math.round((Number(snapshot.totalAgreedAmount || snapshot.amount || 0) - Number(snapshot.depositAmount || 0)) * 100) / 100);
    let invoice = null;
    const outcome = await prisma.$transaction(async tx => {
      const shouldInvoiceBalance = paymentSchedule === 'deposit_balance' && balanceAmount > 0;
      const changed = await tx.projectRequest.updateMany({
        where: { id: requestId, userId, serviceType: 'performance', status: 'ready_for_review' },
        data: shouldInvoiceBalance
          ? { status: 'awaiting_final_payment' }
          : { status: 'completed', completedAt: new Date(), finalPaymentConfirmedAt: new Date() }
      });
      if (changed.count !== 1) throw Object.assign(new Error('The review stage changed. Refresh and try again.'), { code: 'PERFORMANCE_STATE_CHANGED' });

      if (paymentSchedule === 'deposit_balance' && balanceAmount > 0) {
        invoice = await tx.billingInvoice.findUnique({ where: { projectRequestId_stage: { projectRequestId: requestId, stage: `performance_balance_${quote.version}` } } });
        if (!invoice) {
          const now = new Date();
          const dueAt = snapshot.balanceDueDate ? new Date(snapshot.balanceDueDate) : now;
          invoice = await tx.billingInvoice.create({
            data: {
              invoiceNumber: `SMI-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${require('crypto').randomBytes(4).toString('hex').toUpperCase()}`,
              userId, projectRequestId: requestId, stage: `performance_balance_${quote.version}`, serviceType: 'performance',
              description: `Performance improvement balance - ${request.title}`, amountMinor: Math.round(balanceAmount * 100),
              currency: String(snapshot.currency || 'USD').toUpperCase(), status: 'open', issuedAt: now,
              dueAt,
              nextReminderAt: new Date(Math.max(now.getTime() + 24 * 60 * 60 * 1000, dueAt.getTime() - 24 * 60 * 60 * 1000)),
              snapshot: { projectRequestId: requestId, projectName: request.title, quoteVersionId: quote.id, quoteVersion: quote.version, paymentStage: 'balance', acceptedQuote: snapshot }
            }
          });
        }
      }
      const event = await tx.projectConversationMessage.create({
        data: {
          projectRequestId: requestId, senderId: userId, senderRole: 'system', kind: 'event',
          message: invoice ? 'Client accepted the completed Performance work. The final balance invoice is ready.' : 'Client accepted the completed Performance work.',
          eventData: { type: 'performance_work_accepted', quoteVersionId: quote.id, invoiceId: invoice?.id || null }
        }
      });
      return { event, updated: await tx.projectRequest.findUnique({ where: { id: requestId } }) };
    });
    notifyAdmins('project_conversation_message', { requestId, message: outcome.event });
    notifyUser(userId, 'project_conversation_message', { requestId, message: outcome.event });
    notifyUser(userId, 'performance_request_updated', { request: outcome.updated });
    notifyAdmins('performance_request_updated', { request: outcome.updated });
    return res.json({ success: true, data: outcome.updated, invoice, message: invoice ? 'Work accepted. Pay the final balance to complete this request.' : 'Work accepted. This Performance request is complete.' });
  } catch (error) {
    if (error.code === 'PERFORMANCE_STATE_CHANGED') return res.status(409).json({ success: false, message: error.message });
    logger.error('RESPOND_TO_PERFORMANCE_REVIEW_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to record the Performance review.' });
  }
};

// Get Build projects only. Care and Merchant work belong to their own dashboard areas.
exports.getProjects = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [projectRequests, subscriptions] = await Promise.all([
      prisma.projectRequest.findMany({
        where: { userId, serviceType: 'build' },
        include: {
          assessment: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              results: true,
              responses: true
            }
          },
          buildMilestones: {
            orderBy: { order: 'asc' }
          },
          studioLinks: {
            where: { type: { in: ['preview', 'design'] } },
            orderBy: { createdAt: 'desc' }
          },
          studioUpdates: {
            where: { visibility: 'client' },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          quoteVersions: { orderBy: { version: 'desc' }, take: 10 }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.subscription.findMany({
        where: {
          userId,
          tier: { not: 'maintenance' }
        },
        select: {
          id: true,
          siteName: true,
          customName: true,
          price: true,
          totalPaid: true,
          lastPaymentDate: true,
          planType: true,
          domain: true,
          status: true,
          createdAt: true,
          suspended: true,
          reviewRequested: true,
          reviewNotes: true,
          revisionCount: true,
          milestones: {
            select: {
              id: true,
              title: true,
              status: true,
              progress: true,
              order: true
            }
          },
          purchasedAddons: true,
          projectRequests: {
            // A completed build can be returned to handoff if an issue is
            // reopened. Keep its linked-site projection in sync with that state.
            where: { serviceType: 'build' },
            orderBy: { updatedAt: 'desc' },
            take: 1,
            select: {
              status: true,
              launchUrl: true,
              launchApprovedAt: true,
              completionAcknowledgedAt: true,
              handoffIssuesReportedAt: true,
              finalPaymentConfirmedAt: true,
              paymentConfirmedAt: true,
              completedAt: true,
              quoteCurrency: true,
              totalAgreedAmount: true,
              quotedAmount: true,
              depositAmount: true
            }
          },
          template: {
            select: {
              isPublished: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const completedRequestsWithoutSites = projectRequests.filter(request => request.status === 'completed' && !request.subscriptionId);
    const recoveredSites = await Promise.all(completedRequestsWithoutSites.map(async request => {
      const site = await ensureCompletedBuildSite(request.id);
      if (site) request.subscriptionId = site.id;
      return site ? { site, request } : null;
    }));

    const requestProjects = projectRequests.map(mapProjectRequestForClient);

    // Map subscriptions to project-like objects for the dashboard
    const subscriptionProjects = subscriptions.map((sub) => {
      const milestones = sub.milestones;
      const linkedBuild = sub.projectRequests[0];

      // Calculate overall progress from milestones
      let progress = 0;
      if (milestones && milestones.length > 0) {
        const totalMilestones = milestones.length;
        const completedMilestones = milestones.filter(m => m.status === 'completed').length;
        const inProgressMilestones = milestones.filter(m => m.status === 'in_progress');
        
        // Count completed as 100%, in_progress by their individual progress value
        const completedWeight = completedMilestones * 100;
        const inProgressWeight = inProgressMilestones.reduce((acc, m) => acc + (m.progress || 0), 0);
        
        progress = Math.round((completedWeight + inProgressWeight) / totalMilestones);
      } else {
        // Default progress if no milestones exist - base it on project state
        if (sub.suspended) {
          progress = 0;
        } else if (sub.template && sub.template.isPublished) {
          progress = 100;
        } else if (sub.template) {
          progress = 75;
        } else if (sub.reviewRequested) {
          progress = 50;
        } else {
          progress = 25;
        }
      }

      return {
        id: sub.id,
        recordType: 'project',
        canManageSite: isBuildManagementUnlocked(linkedBuild),
        name: sub.siteName || sub.customName || 'Untitled Project',
        businessName: sub.siteName || sub.customName || undefined,
        progress: progress,
        status: sub.suspended ? 'suspended' : (linkedBuild?.status === 'handoff' ? 'handoff' : (progress === 100 ? 'completed' : 'active')),
        planType: sub.planType,
        domain: sub.domain,
        siteUrl: linkedBuild?.launchUrl || (sub.domain ? `https://${sub.domain}` : undefined),
        launchUrl: linkedBuild?.launchUrl || undefined,
        launchApprovedAt: linkedBuild?.launchApprovedAt?.toISOString?.() || undefined,
        completionAcknowledgedAt: linkedBuild?.completionAcknowledgedAt?.toISOString?.() || undefined,
        paymentConfirmedAt: linkedBuild?.paymentConfirmedAt?.toISOString?.() || undefined,
        handoffIssuesReportedAt: linkedBuild?.handoffIssuesReportedAt?.toISOString?.() || undefined,
        completedAt: linkedBuild?.completedAt?.toISOString?.() || undefined,
        quotedAmount: linkedBuild?.totalAgreedAmount ?? linkedBuild?.quotedAmount ?? sub.price ?? undefined,
        totalAgreedAmount: linkedBuild?.totalAgreedAmount ?? sub.price ?? undefined,
        quoteCurrency: linkedBuild?.quoteCurrency || undefined,
        totalPaid: sub.totalPaid,
        lastPaymentDate: sub.lastPaymentDate?.toISOString?.() || undefined,
        isCurrent: sub.status === 'active',
        createdAt: sub.createdAt,
        reviewRequested: sub.reviewRequested,
        reviewNotes: sub.reviewNotes,
        revisionCount: sub.revisionCount,
        milestones,
        purchasedAddons: sub.purchasedAddons || []
      };
    });

    const existingSiteIds = new Set(subscriptionProjects.map(site => site.id));
    const recoveredSiteProjects = recoveredSites
      .filter(entry => Boolean(entry?.site && !existingSiteIds.has(entry.site.id)))
      .map(({ site, request }) => ({
        id: site.id,
        recordType: 'project',
        name: site.siteName || site.customName || 'Completed build',
        businessName: site.siteName || site.customName || undefined,
        progress: 100,
        status: site.suspended ? 'suspended' : 'completed',
        planType: site.planType,
        domain: site.domain,
        siteUrl: request.launchUrl || (site.domain ? `https://${site.domain}` : undefined),
        launchUrl: request.launchUrl || undefined,
        launchApprovedAt: request.launchApprovedAt?.toISOString?.() || undefined,
        completionAcknowledgedAt: request.completionAcknowledgedAt?.toISOString?.() || undefined,
        completedAt: request.completedAt?.toISOString?.() || undefined,
        quotedAmount: request.totalAgreedAmount ?? request.quotedAmount ?? site.price ?? undefined,
        totalAgreedAmount: request.totalAgreedAmount ?? site.price ?? undefined,
        quoteCurrency: request.quoteCurrency || undefined,
        totalPaid: site.totalPaid,
        lastPaymentDate: site.lastPaymentDate?.toISOString?.() || undefined,
        isCurrent: site.status === 'active',
        createdAt: site.createdAt,
        milestones: site.milestones || [],
        purchasedAddons: site.purchasedAddons || []
      }));

    const projects = [...requestProjects, ...subscriptionProjects, ...recoveredSiteProjects];

    res.json({
      success: true,
      projects,
      data: projects
    });
  } catch (error) {
    logger.error('Failed to get client projects', {
      errorCode: 'GET_CLIENT_PROJECTS_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects'
    });
  }
};

exports.respondToHandoff = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;
    let { action, message } = req.body;

    const validActions = ['complete', 'issue'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid handoff response'
      });
    }

    // Sanitize message - limit to reasonable length and remove suspiciously large content
    if (message && message.length > 5000) {
      // If message is suspiciously large, try to extract just the meaningful part
      const lines = message.split('\n').map(l => l.trim()).filter(Boolean);
      // Take only lines that look like actual messages (not too long, not special characters)
      const meaningfulLines = lines.filter(line => line.length < 200 && !line.match(/^[\d\/]+$/) && !line.match(/^[a-z0-9]+@/) && !line.match(/^(http|Step|Launch|Handoff|Close|Open)/i));
      if (meaningfulLines.length > 0) {
        message = meaningfulLines.slice(0, 5).join('\n'); // Take first 5 meaningful lines
        console.log(`[HANDOFF] Message was suspiciously large (${message.length}), sanitized to: ${message.substring(0, 100)}...`);
      } else {
        message = message.substring(0, 500); // Fallback to first 500 chars
      }
    }

    const request = await prisma.projectRequest.findFirst({
      where: {
        id: requestId,
        userId,
        serviceType: 'build'
      },
      include: {
        assessment: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            results: true,
            responses: true
          }
        },
        buildMilestones: {
          orderBy: { order: 'asc' }
        },
        studioLinks: {
          where: { type: { in: ['preview', 'design'] } },
          orderBy: { createdAt: 'desc' }
        },
        studioUpdates: {
          where: { visibility: 'client' },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Build request not found'
      });
    }

    if (request.status !== 'handoff') {
      return res.status(400).json({
        success: false,
        message: 'This build is not waiting for handoff response'
      });
    }
    if (action === 'complete' && request.handoffIssuesReportedAt) {
      return res.status(409).json({
        success: false,
        message: 'The team must confirm the handoff issue is resolved before you can accept delivery again.'
      });
    }

    const label = action === 'complete'
      ? 'Client acknowledged handoff and completion.'
      : 'Client reported a handoff issue.';
    const noteParts = [
      request.clientNotes,
      `${label}${message ? `\nClient message: ${message}` : ''}`
    ].filter(Boolean);

    const remainingBalance = Math.max((request.totalAgreedAmount || request.quotedAmount || 0) - (request.depositAmount || 0), 0);
    const hasFinalBalance = remainingBalance > 0;

    const handoffTransition = await prisma.projectRequest.updateMany({
      where: {
        id: request.id,
        userId,
        status: 'handoff',
        handoffIssuesReportedAt: request.handoffIssuesReportedAt || null,
        completionAcknowledgedAt: request.completionAcknowledgedAt || null
      },
      data: {
        status: action === 'complete' ? (hasFinalBalance && !request.finalPaymentConfirmedAt ? 'handoff' : 'completed') : 'handoff',
        completionAcknowledgedAt: action === 'complete' ? new Date() : null,
        completedAt: action === 'complete' && (!hasFinalBalance || request.finalPaymentConfirmedAt) ? new Date() : action === 'issue' ? null : request.completedAt,
        completionNotes: action === 'complete' ? (message || request.completionNotes) : request.completionNotes,
        handoffIssuesReportedAt: action === 'issue' ? new Date() : request.handoffIssuesReportedAt,
        clientNotes: noteParts.join('\n\n')
      }
    });
    if (handoffTransition.count !== 1) {
      return res.status(409).json({ success: false, message: 'The handoff changed while you were responding. Refresh the project and try again.' });
    }
    const updated = await prisma.projectRequest.findUnique({ where: { id: request.id } });

    const handoffMilestone = request.buildMilestones.find((milestone) => milestone.title === 'Handoff');

    if (action === 'complete') {
      if (hasFinalBalance && !request.finalPaymentConfirmedAt) {
        await issueBuildInvoice({ ...request, totalAgreedAmount: request.totalAgreedAmount || request.quotedAmount }, 'final_balance');
      }
      await prisma.buildMilestone.updateMany({
        where: { projectRequestId: request.id },
        data: { status: 'completed', progress: 100 }
      });
    } else if (handoffMilestone) {
      await prisma.buildMilestone.update({
        where: { id: handoffMilestone.id },
        data: {
          status: 'blocked',
          progress: Math.max(handoffMilestone.progress || 0, 70),
          clientNote: message || 'Client reported a handoff issue.'
        }
      });
    }

    await recordProjectEvent(
      request.id,
      action === 'complete' ? 'handoff_accepted' : 'handoff_issue_reported',
      action === 'complete' ? 'Client accepted the handoff.' : 'Client reported a handoff issue.',
      { message: message || null }
    );
    if (updated.status === 'completed') {
      await recordProjectEvent(request.id, 'build_completed', 'Build completed after handoff acceptance and required payments were confirmed.');
      await ensureCompletedBuildSite(request.id);
    }

    const responseRequest = await prisma.projectRequest.findUnique({
      where: { id: request.id },
      include: {
        assessment: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            results: true,
            responses: true
          }
        },
        buildMilestones: {
          orderBy: { order: 'asc' }
        },
        studioLinks: {
          where: { type: { in: ['preview', 'design'] } },
          orderBy: { createdAt: 'desc' }
        },
        studioUpdates: {
          where: { visibility: 'client' },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (responseRequest) {
      notifyUser(request.userId, 'project_request_updated', { request: responseRequest });
      notifyAdmins('project_request_updated', { request: responseRequest });
      if (action === 'issue') {
        notifyAdmins('new_client_message', { requestId: request.id, message: message || 'Client reported a handoff issue.' });
      }
    }

    res.json({
      success: true,
      data: updated,
      message: action === 'complete'
        ? updated.status === 'completed'
          ? 'Build handoff accepted and the agreement is fully settled.'
          : 'Build handoff accepted. The remaining balance is still due before the build can close.'
        : 'Your handoff note has been sent to the team.'
    });
  } catch (error) {
    logger.error('RESPOND_TO_HANDOFF_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to handoff'
    });
  }
};

exports.respondToStagingReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;
    const { action, message } = req.body;

    const validActions = ['approve', 'changes'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staging review response'
      });
    }

    const request = await prisma.projectRequest.findFirst({
      where: {
        id: requestId,
        userId,
        serviceType: 'build'
      },
      include: {
        buildMilestones: true
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Build request not found'
      });
    }

    if (request.status !== 'staging_review') {
      return res.status(400).json({
        success: false,
        message: 'This build is not waiting for staging review'
      });
    }
    if (request.stagingReviewStatus && request.stagingReviewStatus !== 'sent') {
      return res.status(409).json({
        success: false,
        message: 'A decision has already been recorded for this preview. Wait for the team to send an updated preview.'
      });
    }

    const label = action === 'approve'
      ? 'Client approved staging for launch.'
      : 'Client requested staging changes.';
    const noteParts = [
      request.clientNotes,
      `${label}${message ? `\nClient message: ${message}` : ''}`
    ].filter(Boolean);

    const reviewTransition = await prisma.projectRequest.updateMany({
      where: {
        id: request.id,
        userId,
        status: 'staging_review',
        OR: [{ stagingReviewStatus: 'sent' }, { stagingReviewStatus: null }]
      },
      data: {
        status: 'staging_review',
        stagingReviewStatus: action === 'approve' ? 'approved' : 'changes_requested',
        stagingReviewedAt: new Date(),
        launchApprovedAt: action === 'approve' ? new Date() : request.launchApprovedAt,
        clientNotes: noteParts.join('\n\n')
      }
    });
    if (reviewTransition.count !== 1) {
      return res.status(409).json({
        success: false,
        message: 'This preview already has a decision. Wait for the team to send an updated preview.'
      });
    }
    const updated = await prisma.projectRequest.findUnique({ where: { id: request.id } });

    const stagingMilestone = request.buildMilestones.find((milestone) => milestone.title === 'Staging review');
    const launchMilestone = request.buildMilestones.find((milestone) => milestone.title === 'Launch');

    if (action === 'approve') {
      if (stagingMilestone) {
        await prisma.buildMilestone.update({
          where: { id: stagingMilestone.id },
          data: { status: 'completed', progress: 100 }
        });
      }
      if (launchMilestone) {
        await prisma.buildMilestone.update({
          where: { id: launchMilestone.id },
          data: { status: 'in_progress', progress: Math.max(launchMilestone.progress || 0, 30) }
        });
      }
    } else if (stagingMilestone) {
      await prisma.buildMilestone.update({
        where: { id: stagingMilestone.id },
        data: {
          status: 'blocked',
          progress: Math.max(stagingMilestone.progress || 0, 50),
          clientNote: message || 'Client requested changes during staging review.'
        }
      });
    }

    await recordProjectEvent(
      request.id,
      action === 'approve' ? 'preview_approved' : 'preview_changes_requested',
      action === 'approve' ? 'Client approved the preview for launch.' : 'Client requested changes to the preview.',
      { message: message || null, previewUrl: request.stagingUrl || null }
    );

    const responseRequest = await prisma.projectRequest.findUnique({
      where: { id: request.id },
      include: {
        assessment: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            results: true,
            responses: true
          }
        },
        buildMilestones: {
          orderBy: { order: 'asc' }
        },
        studioLinks: {
          where: { type: { in: ['preview', 'design'] } },
          orderBy: { createdAt: 'desc' }
        },
        studioUpdates: {
          where: { visibility: 'client' },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (responseRequest) {
      notifyUser(request.userId, 'project_request_updated', { request: responseRequest });
      notifyAdmins('project_request_updated', { request: responseRequest });
    }

    res.json({
      success: true,
      data: mapProjectRequestForClient(responseRequest || updated),
      message: action === 'approve'
        ? 'Staging approved. The team can prepare launch.'
        : 'Your change request has been sent to the team.'
    });
  } catch (error) {
    logger.error('RESPOND_TO_STAGING_REVIEW_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to staging review'
    });
  }
};

exports.getReviewChatMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;

    const request = await prisma.projectRequest.findFirst({
      where: {
        id: requestId,
        userId,
        serviceType: 'build'
      },
      select: { id: true, status: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Build request not found' });
    }
    if (request.status !== 'handoff') {
      return res.status(409).json({ success: false, message: 'Handoff messages can only be sent while the build is awaiting handoff review.' });
    }

    const messages = await getProjectConversation(requestId);

    await prisma.$executeRawUnsafe(`UPDATE "ProjectConversationMessage" SET "readByClient" = true WHERE "projectRequestId" = $1 AND "senderRole" = 'admin'`, requestId);

    res.json({ success: true, data: messages });
  } catch (error) {
    logger.error('GET_CLIENT_REVIEW_CHAT_MESSAGES_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to load review chat' });
  }
};

exports.createReviewChatMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;
    const { message = '', kind = 'message', choices = null, selectedChoice = null, attachments = null } = req.body || {};
    const cleanedMessage = String(message || selectedChoice || '').trim();
    const cleanedChoices = sanitizeReviewChatChoices(choices);
    const cleanedKind = normalizeReviewChatKind(kind, cleanedChoices);

    if (!cleanedMessage && !attachments) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const request = await prisma.projectRequest.findFirst({
      where: {
        id: requestId,
        userId,
        serviceType: 'build'
      },
      select: { id: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Build request not found' });
    }

    const rows = await prisma.$queryRawUnsafe(
      `INSERT INTO "ProjectConversationMessage"
       ("projectRequestId","senderId","senderRole","message","kind","choices","selectedChoice","attachments","readByAdmin","readByClient")
       VALUES ($1,$2,'client',$3,$4,$5::jsonb,$6,$7::jsonb,false,true)
       RETURNING ${projectConversationSelect}`,
      requestId,
      userId,
      cleanedMessage,
      cleanedKind,
      JSON.stringify(cleanedChoices),
      selectedChoice ? String(selectedChoice).trim() : null,
      JSON.stringify(attachments || null)
    );

    const chatMessage = rows[0];
    notifyAdmins('project_conversation_message', { requestId, message: chatMessage });

    res.json({ success: true, data: chatMessage, message: 'Review message sent' });
  } catch (error) {
    logger.error('CREATE_CLIENT_REVIEW_CHAT_MESSAGE_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to send review message' });
  }
};

exports.getHandoffChatMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;

    const request = await prisma.projectRequest.findFirst({
      where: {
        id: requestId,
        userId,
        serviceType: 'build'
      },
      select: { id: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Build request not found' });
    }

    const messages = await getProjectConversation(requestId);

    await prisma.$executeRawUnsafe(`UPDATE "ProjectConversationMessage" SET "readByClient" = true WHERE "projectRequestId" = $1 AND "senderRole" = 'admin'`, requestId);

    res.json({ success: true, data: messages });
  } catch (error) {
    logger.error('GET_CLIENT_HANDOFF_CHAT_MESSAGES_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to load handoff chat' });
  }
};

exports.createHandoffChatMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;
    const { message = '', attachments = null } = req.body || {};
    const cleanedMessage = String(message || '').trim();

    if (!cleanedMessage && !attachments) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const request = await prisma.projectRequest.findFirst({
      where: { id: requestId, userId, serviceType: 'build' },
      select: { id: true, status: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Build request not found' });
    }
    if (request.status !== 'handoff') {
      return res.status(409).json({ success: false, message: 'Handoff messages can only be sent while the build is awaiting handoff review.' });
    }

    const chatMessage = await prisma.$transaction(async (tx) => {
      const transition = await tx.projectRequest.updateMany({
        where: { id: requestId, userId, serviceType: 'build', status: 'handoff' },
        data: {
          handoffIssuesReportedAt: new Date(),
          completionAcknowledgedAt: null,
          completedAt: null
        }
      });
      if (transition.count !== 1) return null;
      return tx.projectConversationMessage.create({
        data: {
          projectRequestId: requestId,
          senderId: userId,
          senderRole: 'client',
          message: cleanedMessage,
          kind: 'message',
          attachments: attachments || null,
          readByAdmin: false,
          readByClient: true
        }
      });
    });
    if (!chatMessage) return res.status(409).json({ success: false, message: 'The handoff is no longer open for review.' });

    notifyUser(userId, 'project_conversation_message', { requestId, message: chatMessage });
    notifyAdmins('project_conversation_message', { requestId, message: chatMessage });
    const updatedRequest = await prisma.projectRequest.findUnique({ where: { id: requestId } });
    notifyUser(userId, 'project_request_updated', { request: updatedRequest });
    notifyAdmins('project_request_updated', { request: updatedRequest });

    res.json({ success: true, data: chatMessage, message: 'Handoff message sent' });
  } catch (error) {
    logger.error('CREATE_CLIENT_HANDOFF_CHAT_MESSAGE_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to send handoff message' });
  }
};

exports.respondToProjectQuote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;
    const { action, message } = req.body;

    const validActions = ['accept', 'discuss'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quote response'
      });
    }

    const request = await prisma.projectRequest.findFirst({
      where: {
        id: requestId,
        userId,
        serviceType: 'build'
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Build request not found'
      });
    }

    if (request.status !== 'quote_ready') {
      return res.status(400).json({
        success: false,
        message: 'This build request is not waiting for quote response'
      });
    }

    const currentQuote = await prisma.projectQuoteVersion.findFirst({
      where: { projectRequestId: requestId, status: 'sent' },
      orderBy: { version: 'desc' }
    });
    if (!currentQuote) {
      return res.status(409).json({ success: false, message: 'There is no current quote version to accept. Ask the team to send the quote again.' });
    }

    const responseLabels = {
      accept: 'Client accepted the quote.',
      discuss: 'Client wants to discuss the quote.',
    };
    const noteParts = [
      request.clientNotes,
      `${responseLabels[action]}${message ? `\nClient message: ${message}` : ''}`
    ].filter(Boolean);

    const updated = await prisma.projectRequest.update({
      where: { id: request.id },
      data: {
        status: action === 'accept' ? 'approved' : 'quote_ready',
        approvedAt: action === 'accept' ? new Date() : request.approvedAt,
        clientNotes: noteParts.join('\n\n')
      }
    });

    if (action === 'accept') {
      await prisma.projectQuoteVersion.update({
        where: { id: currentQuote.id },
        data: { status: 'accepted', acceptedAt: new Date() }
      });
    }

    const messageRows = await prisma.$queryRawUnsafe(
      `INSERT INTO "ProjectConversationMessage"
       ("projectRequestId","senderId","senderRole","message","kind","eventData","readByAdmin","readByClient")
       VALUES ($1,$2,'client',$3,$4,$5::jsonb,false,true)
       RETURNING ${projectConversationSelect}`,
      requestId, userId,
      action === 'accept' ? `Client accepted quote version ${currentQuote.version}.` : (String(message || '').trim() || 'Client wants to discuss the quote.'),
      action === 'accept' ? 'event' : 'message',
      JSON.stringify(action === 'accept' ? { type: 'quote_accepted', quoteVersionId: currentQuote.id, version: currentQuote.version, quoteAmount: currentQuote.snapshot.amount, currency: currentQuote.snapshot.currency } : null)
    );
    notifyAdmins('project_conversation_message', { requestId, message: messageRows[0] });
    notifyUser(userId, 'project_request_updated', { request: updated });
    notifyAdmins('project_request_updated', { request: updated });

    res.json({
      success: true,
      data: updated,
      message: action === 'accept'
        ? 'Quote accepted. The build is ready for the next step.'
        : 'Your response has been sent to the team.'
    });
  } catch (error) {
    logger.error('RESPOND_TO_PROJECT_QUOTE_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to quote'
    });
  }
};

// Unified project conversation endpoints. These expose the migrated history
// and provide one write path for every stage of the build journey.
exports.getProjectConversation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;
    const request = await prisma.projectRequest.findFirst({
      where: { id: requestId, userId, serviceType: { in: ['build', 'performance', 'repair'] } },
      select: { id: true }
    });
    if (!request) return res.status(404).json({ success: false, message: 'Project request not found' });

    const messages = await getProjectConversation(requestId);
    await prisma.$executeRawUnsafe(`UPDATE "ProjectConversationMessage" SET "readByClient" = true WHERE "projectRequestId" = $1 AND "senderRole" = 'admin'`, requestId);
    res.json({ success: true, data: messages });
  } catch (error) {
    logger.error('GET_CLIENT_PROJECT_CONVERSATION_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to load project conversation' });
  }
};

exports.createProjectConversationMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;
    const { message = '', kind = 'message', choices = null, selectedChoice = null, attachments = null } = req.body || {};
    const cleanedMessage = String(message || selectedChoice || '').trim();
    const cleanedChoices = sanitizeReviewChatChoices(choices);
    const cleanedKind = normalizeReviewChatKind(kind, cleanedChoices);
    if (!cleanedMessage && !attachments) return res.status(400).json({ success: false, message: 'Message is required' });

    const request = await prisma.projectRequest.findFirst({
      where: { id: requestId, userId, serviceType: { in: ['build', 'performance', 'repair'] } },
      select: { id: true }
    });
    if (!request) return res.status(404).json({ success: false, message: 'Project request not found' });

    const rows = await prisma.$queryRawUnsafe(
      `INSERT INTO "ProjectConversationMessage"
       ("projectRequestId","senderId","senderRole","message","kind","choices","selectedChoice","attachments","readByAdmin","readByClient")
       VALUES ($1,$2,'client',$3,$4,$5::jsonb,$6,$7::jsonb,false,true)
       RETURNING ${projectConversationSelect}`,
      requestId, userId, cleanedMessage, cleanedKind, JSON.stringify(cleanedChoices),
      selectedChoice ? String(selectedChoice).trim() : null, JSON.stringify(attachments || null)
    );
    const chatMessage = rows[0];
    notifyAdmins('project_conversation_message', { requestId, message: chatMessage });
    res.json({ success: true, data: chatMessage, message: 'Project message sent' });
  } catch (error) {
    logger.error('CREATE_CLIENT_PROJECT_CONVERSATION_MESSAGE_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to send project message' });
  }
};

exports.createProjectLifecycleRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;
    const type = req.body?.type;
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!['pause', 'cancel'].includes(type)) return res.status(400).json({ success: false, message: 'Choose pause or cancellation.' });
    if (!message || message.length > 2000) return res.status(400).json({ success: false, message: 'Add a short reason (up to 2000 characters).' });

    const request = await prisma.projectRequest.findFirst({ where: { id: requestId, userId, serviceType: 'build' }, select: { id: true, status: true } });
    if (!request) return res.status(404).json({ success: false, message: 'Build request not found' });
    if (['completed', 'cancelled', 'archived'].includes(request.status) || (request.status === 'paused' && type === 'pause')) return res.status(409).json({ success: false, message: 'This build cannot accept that request in its current state.' });

    const pending = await prisma.$queryRawUnsafe(
      `SELECT "id" FROM "ProjectConversationMessage" WHERE "projectRequestId" = $1 AND "kind" = 'event' AND "eventData"->>'lifecycleStatus' = 'pending' LIMIT 1`, requestId
    );
    if (pending.length) return res.status(409).json({ success: false, message: 'There is already a pause or cancellation request waiting for the admin.' });

    const rows = await prisma.$queryRawUnsafe(
      `INSERT INTO "ProjectConversationMessage" ("projectRequestId","senderId","senderRole","message","kind","eventData","readByAdmin","readByClient")
       VALUES ($1,$2,'system',$3,'event',$4::jsonb,false,true) RETURNING ${projectConversationSelect}`,
      requestId, userId, message, JSON.stringify({ type: `${type}_requested`, lifecycleType: type, lifecycleStatus: 'pending', previousStatus: request.status })
    );
    notifyAdmins('project_conversation_message', { requestId, message: rows[0] });
    res.json({ success: true, data: rows[0], message: 'Request sent to the admin for confirmation.' });
  } catch (error) {
    logger.error('CREATE_PROJECT_LIFECYCLE_REQUEST_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to send the pause or cancellation request.' });
  }
};

exports.respondToBriefClarification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;
    const { message } = req.body;
    const cleanMessage = typeof message === 'string' ? message.trim() : '';

    if (!cleanMessage) {
      return res.status(400).json({
        success: false,
        message: 'Please add the clarification details before sending.'
      });
    }

    const request = await prisma.projectRequest.findFirst({
      where: {
        id: requestId,
        userId,
        serviceType: 'build'
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Build request not found'
      });
    }

    if (request.status !== 'in_review') {
      return res.status(400).json({
        success: false,
        message: 'This brief is not waiting for clarification.'
      });
    }

    const existingAdminNotes = request.adminNotes ? `${request.adminNotes}\n\n` : '';
    const updated = await prisma.projectRequest.update({
      where: { id: request.id },
      data: {
        status: 'in_review',
        clientNotes: `Client sent brief clarification.\nClient message: ${cleanMessage}`,
        adminNotes: `${existingAdminNotes}Client brief clarification:\n${cleanMessage}`
      }
    });

    const messageRows = await prisma.$queryRawUnsafe(
      `INSERT INTO "ProjectConversationMessage"
       ("projectRequestId","senderId","senderRole","message","kind","readByAdmin","readByClient")
       VALUES ($1,$2,'client',$3,'message',false,true)
       RETURNING ${projectConversationSelect}`,
      requestId, userId, cleanMessage
    );
    notifyAdmins('project_conversation_message', { requestId, message: messageRows[0] });

    res.json({
      success: true,
      data: updated,
      message: 'Your clarification has been sent to the team.'
    });
  } catch (error) {
    logger.error('RESPOND_TO_BRIEF_CLARIFICATION_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send brief clarification'
    });
  }
};

// Get client activities/logs
exports.getActivities = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [payments, tickets, domains] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3
      }),
      prisma.supportTicket.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3
      }),
      prisma.customDomain.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3
      })
    ]);

    const activities = [
      ...payments.map(p => ({
        id: p.id,
        title: 'Payment ' + p.status.toUpperCase(),
        time: new Date(p.createdAt).toLocaleTimeString(),
        date: p.createdAt,
        desc: p.description,
        type: 'payment'
      })),
      ...tickets.map(t => ({
        id: t.id,
        title: 'Support Ticket: ' + t.subject,
        time: new Date(t.createdAt).toLocaleTimeString(),
        date: t.createdAt,
        desc: 'Status updated to ' + t.status.toUpperCase(),
        type: 'file'
      })),
      ...domains.map(d => ({
        id: d.id,
        title: 'Domain Added: ' + d.domain,
        time: new Date(d.createdAt).toLocaleTimeString(),
        date: d.createdAt,
        desc: 'Status: ' + d.status.toUpperCase(),
        type: 'file'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    logger.error('Failed to get client activities', {
      errorCode: 'GET_CLIENT_ACTIVITIES_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activities'
    });
  }
};

// Get client billing history
// Pulls the real card/channel detail Paystack actually returned out of the raw
// gatewayResponse blob - same helper as the admin transactions view uses.
const extractChannelInfo = (payment) => {
  const auth = payment.gatewayResponse?.data?.authorization || payment.gatewayResponse?.authorization || null;
  if (!auth) {
    return { channel: payment.paymentMethod || 'card', cardType: null, last4: null, bank: null };
  }
  return {
    channel: auth.channel || payment.paymentMethod || 'card',
    cardType: auth.card_type || null,
    last4: auth.last4 || null,
    bank: auth.bank || null
  };
};

exports.getBilling = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [payments, user, invoices, receipts, refunds] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { defaultCurrency: true } }),
      prisma.billingInvoice.findMany({ where: { userId }, include: { user: { select: { name: true, email: true } } }, orderBy: { issuedAt: 'desc' } }),
      prisma.billingReceipt.findMany({ where: { userId }, include: { user: { select: { name: true, email: true } } }, orderBy: { issuedAt: 'desc' } }),
      prisma.billingRefund.findMany({ where: { userId }, orderBy: { processedAt: 'desc' } })
    ]);

    const preferredCurrency = user?.defaultCurrency || 'USD';
    const buildRequestIds = [...new Set(payments
      .filter(payment => ['build_agreement', 'build_final_balance'].includes(payment.serviceType))
      .map(payment => payment.metadata?.projectRequestId)
      .filter((id) => typeof id === 'string'))];
    const buildRequests = buildRequestIds.length
      ? await prisma.projectRequest.findMany({
          where: { id: { in: buildRequestIds }, userId, serviceType: 'build' },
          select: { id: true, title: true, businessName: true, subscriptionId: true }
        })
      : [];
    const buildById = new Map(buildRequests.map(request => [request.id, request]));
    const billing = payments.map((payment) => {
      const majorUnitAmount = (payment.amount || 0) / 100;
      const showConverted = normalizeCurrency(payment.currency) !== normalizeCurrency(preferredCurrency);
      const projectRequestId = payment.metadata?.projectRequestId;
      const buildRequest = typeof projectRequestId === 'string' ? buildById.get(projectRequestId) : undefined;
      return {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        gateway: payment.gateway,
        description: payment.description,
        reference: payment.reference,
        serviceType: payment.serviceType,
        invoiceId: payment.invoiceId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        metadata: {
          ...(payment.metadata && typeof payment.metadata === 'object' ? payment.metadata : {}),
          ...(buildRequest ? {
            projectRequestId: buildRequest.id,
            projectName: buildRequest.businessName || buildRequest.title,
            subscriptionId: buildRequest.subscriptionId || undefined
          } : {})
        },
        preferredCurrency,
        convertedAmount: showConverted ? convertCurrencyAmount(majorUnitAmount, payment.currency, preferredCurrency) : null,
        ...extractChannelInfo(payment)
      };
    });

    res.json({
      success: true,
      billing,
      invoices,
      receipts,
      refunds
    });
  } catch (error) {
    logger.error('Failed to get billing info', {
      errorCode: 'GET_BILLING_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve billing history'
    });
  }
};

// Get client messages
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.userId;

    const messages = await prisma.message.findMany({
      where: { userId, threadId: null },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    logger.error('Failed to get client messages', {
      errorCode: 'GET_MESSAGES_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages'
    });
  }
};

// Send a client message (to system/admin)
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const subject = typeof req.body.subject === 'string' ? req.body.subject.trim() : '';
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

    if (!subject || !content || subject.length > 180 || content.length > 10000) {
      return res.status(400).json({ success: false, message: 'Add a subject and message (up to 10,000 characters).' });
    }

    const message = await prisma.message.create({
      data: {
        userId,
        subject,
        content,
        sender: 'USER',
        isRead: true 
      }
    });

    // Notify admins of new client message
    notifyAdmins('new_client_message', {
      messageId: message.id,
      userId,
      subject,
      timestamp: message.createdAt
    });

    res.json({
      success: true,
      message
    });
  } catch (error) {
    logger.error('Failed to send client message', {
      errorCode: 'SEND_MESSAGE_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to transmit message'
    });
  }
};

exports.replyToMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content || content.length > 10000) {
      return res.status(400).json({ success: false, message: 'Write a reply of up to 10,000 characters.' });
    }

    const parent = await prisma.message.findFirst({ where: { id, userId, threadId: null } });
    if (!parent) return res.status(404).json({ success: false, message: 'Conversation not found.' });

    const reply = await prisma.message.create({
      data: { userId, threadId: parent.id, subject: parent.subject, content, sender: 'USER', isRead: true }
    });
    notifyAdmins('new_client_message', {
      messageId: reply.id, threadId: parent.id, userId, subject: parent.subject, timestamp: reply.createdAt
    });
    res.status(201).json({ success: true, message: reply });
  } catch (error) {
    logger.error('Failed to reply to client conversation', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to send reply' });
  }
};

// Mark message as read
exports.markMessageRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const message = await prisma.message.findFirst({ where: { id, userId, threadId: null } });
    if (!message) return res.status(404).json({ success: false, message: 'Conversation not found' });

    await prisma.message.updateMany({
      where: { OR: [{ id }, { threadId: id }], userId, sender: { not: 'USER' } },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to mark message as read', { error: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update a client message
exports.updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, content } = req.body;
    const userId = req.user.userId;

    const message = await prisma.message.findFirst({
      where: { id, userId }
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender !== 'USER' || message.threadId) {
      return res.status(403).json({ success: false, message: 'Cannot edit system messages' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { subject, content }
    });

    res.json({ success: true, message: updatedMessage });
  } catch (error) {
    logger.error('Failed to update message', { error: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get client resources
exports.getResources = async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      resources
    });
  } catch (error) {
    logger.error('Failed to get client resources', {
      errorCode: 'GET_RESOURCES_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve resources'
    });
  }
};

// Get client support tickets
exports.getSupportTickets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subscriptionId } = req.query;

    const where = { userId };
    if (subscriptionId) {
      where.subscriptionId = subscriptionId;
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    logger.error('Failed to get support tickets', {
      errorCode: 'GET_SUPPORT_TICKETS_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve support tickets'
    });
  }
};

// Create support ticket
exports.createSupportTicket = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subject, message, priority, subscriptionId } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    if (subscriptionId) {
      const ownedSite = await prisma.subscription.findFirst({
        where: { id: subscriptionId, userId },
        select: { id: true }
      });
      if (!ownedSite) {
        return res.status(403).json({
          success: false,
          message: 'This site is not available in your workspace'
        });
      }
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subscriptionId,
        subject,
        message,
        priority: priority || 'medium',
        status: 'open',
      }
    });

    res.status(201).json({
      success: true,
      ticket
    });
  } catch (error) {
    logger.error('Failed to create support ticket', {
      errorCode: 'CREATE_SUPPORT_TICKET_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket'
    });
  }
};

// Get client custom domains
exports.getDomains = async (req, res) => {
  try {
    const userId = req.user.userId;

    const domains = await prisma.customDomain.findMany({
      where: { userId },
      select: {
        id: true,
        siteId: true,
        domain: true,
        setup: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        sslEnabled: true,
        sslExpiresAt: true,
        subscription: {
          select: {
            siteName: true,
            customName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      domains,
      dnsTargets: {
        a: getHostingDomainTarget()
      }
    });
  } catch (error) {
    logger.error('Failed to get domains', {
      errorCode: 'GET_DOMAINS_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve custom domains'
    });
  }
};

// Add custom domain
exports.addDomain = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { domain: rawDomain, siteId, setup } = req.body;

    if (!rawDomain || !siteId) {
      return res.status(400).json({
        success: false,
        message: 'Domain name and site selection are required'
      });
    }

    // Accept a pasted URL, but persist only its normalized hostname.
    const domain = String(rawDomain)
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split(/[/?#]/)[0]
      .replace(/\.$/, '');
    const labels = domain.split('.');
    const isValidDomain = domain.length <= 253
      && labels.length >= 2
      && labels.every(label => label.length > 0
        && label.length <= 63
        && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label));

    if (!isValidDomain) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid domain name, such as yourbusiness.co.ke'
      });
    }

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: siteId,
        userId: userId
      },
      select: { id: true }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Invalid project selection'
      });
    }

    const lockReason = await getSiteManagementLockReason(userId, subscription.id);
    if (lockReason) {
      return res.status(409).json({ success: false, message: lockReason });
    }

    const existingDomain = await prisma.customDomain.findFirst({
      where: { domain: { equals: domain, mode: 'insensitive' } },
      select: { id: true, userId: true, siteId: true }
    });

    if (existingDomain) {
      const message = existingDomain.userId === userId
        ? 'This domain is already connected to one of your sites.'
        : 'This domain is already connected to another account.';
      return res.status(409).json({ success: false, message });
    }

    const data = {
      domain,
      siteId,
      userId,
      setup: setup || 'self'
    };

    const newDomain = await prisma.customDomain.create({
      data,
      select: {
        id: true,
        domain: true,
        setup: true,
        subscription: {
          select: {
            siteName: true,
            customName: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      domain: { ...newDomain, status: 'pending' }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'This domain is already connected.' });
    }
    logger.error('Failed to add domain', {
      errorCode: 'ADD_DOMAIN_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to connect custom domain'
    });
  }
};

// Move an existing domain connection to another site in the same client account.
exports.moveDomainToSite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { domainId } = req.params;
    const { siteId } = req.body;
    if (!siteId) return res.status(400).json({ success: false, message: 'Choose a site for this domain.' });

    const domain = await prisma.customDomain.findFirst({
      where: { id: domainId, userId },
      select: { id: true, siteId: true, domain: true }
    });
    if (!domain) return res.status(404).json({ success: false, message: 'Domain not found.' });

    const [sourceLock, targetSite] = await Promise.all([
      getSiteManagementLockReason(userId, domain.siteId),
      prisma.subscription.findFirst({
        where: { id: siteId, userId },
        select: { id: true }
      })
    ]);
    if (sourceLock) return res.status(409).json({ success: false, message: sourceLock });
    if (!targetSite) return res.status(403).json({ success: false, message: 'That site is not available in your account.' });

    const targetLock = await getSiteManagementLockReason(userId, targetSite.id);
    if (targetLock) return res.status(409).json({ success: false, message: targetLock });

    if (targetSite.id === domain.siteId) {
      return res.json({ success: true, message: 'This domain is already connected to that site.' });
    }

    await prisma.customDomain.update({ where: { id: domain.id }, data: { siteId: targetSite.id } });
    return res.json({ success: true, message: `${domain.domain} is now connected to the selected site.` });
  } catch (error) {
    logger.error('Failed to move domain connection', { errorCode: 'MOVE_DOMAIN_ERROR', error: error.message });
    return res.status(500).json({ success: false, message: 'Could not move this domain. Please try again.' });
  }
};

// Verify custom domain DNS
exports.verifyDomainDNS = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { domainId } = req.params;

    const customDomain = await prisma.customDomain.findFirst({
      where: {
        id: domainId,
        userId: userId
      }
    });

    if (!customDomain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    const lockReason = await getSiteManagementLockReason(userId, customDomain.siteId);
    if (lockReason) {
      return res.status(409).json({ success: false, message: lockReason });
    }

    try {
      const result = await verifyDomainDns(customDomain.domain);
      if (result.verified) {
        await prisma.customDomain.update({
          where: { id: domainId },
          data: { status: 'verified' }
        });

        return res.json({
          success: true,
          verified: true,
          sslEnabled: customDomain.sslEnabled,
          sslExpiresAt: customDomain.sslExpiresAt,
          message: 'Both the root domain and www are pointing to Sitemendr. HTTPS readiness is checked separately.',
          checks: result.checks,
          targets: { a: result.targetIp }
        });
      } else {
        await prisma.customDomain.update({
          where: { id: domainId },
          data: { status: 'pending', sslEnabled: false, sslExpiresAt: null }
        });
        return res.json({
          success: true,
          verified: false,
          message: 'DNS is not ready yet. Check the root and www records below, save any changes, then verify again.',
          checks: result.checks,
          targets: { a: result.targetIp }
        });
      }
    } catch (dnsError) {
      logger.error('DNS Resolution error', {
        errorCode: 'DNS_RESOLUTION_ERROR',
        error: dnsError.message,
        code: dnsError.code
      });
      return res.json({
        success: true,
        verified: false,
        message: 'We could not check DNS right now. Confirm the records are saved, allow time for DNS propagation, and try again.',
        error: dnsError.code
      });
    }

  } catch (error) {
    logger.error('Failed to verify domain', {
      errorCode: 'VERIFY_DOMAIN_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to verify domain'
    });
  }
};

// Remove a custom domain owned by the client, once the site is available for management.
exports.deleteDomain = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { domainId } = req.params;
    const customDomain = await prisma.customDomain.findFirst({
      where: { id: domainId, userId },
      select: { id: true, siteId: true }
    });

    if (!customDomain) {
      return res.status(404).json({ success: false, message: 'Domain not found' });
    }

    const lockReason = await getSiteManagementLockReason(userId, customDomain.siteId);
    if (lockReason) {
      return res.status(409).json({ success: false, message: lockReason });
    }

    await prisma.customDomain.delete({ where: { id: customDomain.id } });
    return res.json({ success: true, message: 'Domain removed' });
  } catch (error) {
    logger.error('Failed to remove domain', {
      errorCode: 'DELETE_DOMAIN_ERROR',
      error: error.message
    });
    return res.status(500).json({ success: false, message: 'Failed to remove domain' });
  }
};

// Get template for project
exports.getProjectTemplate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subscriptionId } = req.params;

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: userId
      }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    const template = await prisma.template.findUnique({
      where: { subscriptionId: subscriptionId }
    });

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Failed to get project template', {
      errorCode: 'GET_PROJECT_TEMPLATE_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve project template'
    });
  }
};

// Get milestones for project
exports.getProjectMilestones = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subscriptionId } = req.params;

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: userId
      }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    const milestones = await prisma.milestone.findMany({
      where: { subscriptionId: subscriptionId },
      orderBy: { order: 'asc' }
    });

    res.json({
      success: true,
      data: milestones
    });
  } catch (error) {
    logger.error('Failed to get project milestones', {
      errorCode: 'GET_PROJECT_MILESTONES_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve project milestones'
    });
  }
};

// Request Human Review for project
exports.requestProjectReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subscriptionId } = req.params;

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: userId
      },
      include: {
        user: true
      }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    // Update subscription to request review
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { reviewRequested: true }
    });

    // Create a milestone for the review
    await prisma.milestone.create({
      data: {
        subscriptionId,
        title: 'HUMAN_REFINEMENT_INITIALIZED',
        description: 'Design experts are currently reviewing your project for performance and aesthetic enhancements.',
        status: 'in_progress',
        progress: 10,
        order: (await prisma.milestone.count({ where: { subscriptionId } })) + 1
      }
    });

    res.json({
      success: true,
      message: 'REVIEW_PROTOCOL_ACTIVATED'
    });
  } catch (error) {
    logger.error('Failed to request review', {
      errorCode: 'REQUEST_REVIEW_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to activate review protocol'
    });
  }
};

// Optimize content using AI
exports.optimizeContent = async (req, res) => {
  try {
    const { content, type, instructions } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const prompt = `
      You are the Sitemendr Neural Content Optimizer. 
      Refine the following ${type || 'text'} content for a high-tech, professional website within the Sitemendr ecosystem.
      Instructions: ${instructions || 'Make it more compelling, clear, and professional.'}
      
      Original Content:
      "${content}"
      
      Provide only the refined content string in your response, nothing else.
    `;

    let optimizedContent;
    try {
      if (!openai) throw new Error('OPENAI_API_KEY is not configured');
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      optimizedContent = completion.choices[0].message.content.trim().replace(/^"(.*)"$/, '$1');
    } catch (oaError) {
      logger.error('OpenAI content optimization failed, trying Groq', { error: oaError.message });
      
      try {
        if (!groq) throw new Error('GROQ_API_KEY is not configured');
        const groqCompletion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });
        optimizedContent = groqCompletion.choices[0].message.content.trim().replace(/^"(.*)"$/, '$1');
      } catch (groqError) {
        logger.error('Groq content optimization failed', { error: groqError.message });
        throw new Error('All AI services failed to optimize content');
      }
    }

    res.json({
      success: true,
      data: optimizedContent
    });
  } catch (error) {
    logger.error('Failed to optimize content', {
      errorCode: 'OPTIMIZE_CONTENT_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to optimize content'
    });
  }
};

// Update project template
exports.updateProjectTemplate = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { html, css, js } = req.body;

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: req.user.userId
      }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    // Update or create template
    const template = await prisma.template.upsert({
      where: { subscriptionId: subscriptionId },
      update: {
        html,
        css,
        js,
      },
      create: {
        subscriptionId,
        html,
        css,
        js,
      }
    });

    res.json({
      success: true,
      message: 'Template updated successfully',
      template: template
    });
  } catch (error) {
    logger.error('Failed to update project template', {
      errorCode: 'UPDATE_PROJECT_TEMPLATE_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update project template'
    });
  }
};

// Regenerate AI Template for project
exports.regenerateProjectAI = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.userId;

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: userId
      },
      include: {
        user: { select: { email: true } }
      }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    // Find the latest assessment for this user
    const assessment = await prisma.assessment.findFirst({
      where: {
        OR: [
          { lead: { email: subscription.user.email } },
          { lead: { ownerId: userId } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!assessment) {
      return res.status(400).json({
        success: false,
        message: 'No technical assessment found to guide regeneration'
      });
    }

    const { generateTemplateAI } = require('./assessment');
    
    // Trigger regeneration
    await generateTemplateAI(subscriptionId, assessment.responses, assessment.results || {});

    res.json({
      success: true,
      message: 'PROJECT_NEURAL_REGENERATION_COMPLETE'
    });
  } catch (error) {
    logger.error('Failed to regenerate project template', {
      errorCode: 'REGENERATE_PROJECT_AI_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to process neural regeneration'
    });
  }
};

// Export Project Codebase (for self_hosted plan)
exports.exportProjectCodebase = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.userId;

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: userId
      },
      select: {
        id: true,
        planType: true,
        siteName: true
      }
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if plan allows export (self_hosted or enterprise)
    if (subscription.planType !== 'self_hosted' && subscription.planType !== 'enterprise') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your current plan does not support codebase export. Please upgrade to the Self-Hosted or Enterprise plan.' 
      });
    }

    const template = await prisma.template.findUnique({
      where: { subscriptionId }
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Project source files not found' });
    }

    // Return the source code bundled
    res.json({
      success: true,
      data: {
        name: subscription.siteName || 'sitemendr-export',
        files: {
          'index.html': template.html,
          'styles.css': template.css,
          'script.js': template.js
        },
        instructions: "To deploy: Host these files on any static hosting provider (Vercel, Netlify, or your own server)."
      }
    });
  } catch (error) {
    logger.error('Failed to export codebase', {
      errorCode: 'EXPORT_CODEBASE_ERROR',
      error: error.message
    });
    res.status(500).json({ success: false, message: 'Failed to bundle codebase for export' });
  }
};

// Get client assessments
exports.getAssessments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const assessments = await prisma.assessment.findMany({
      where: { 
        OR: [
          { userId },
          { projectRequest: { userId } },
          { lead: { ownerId: userId } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      assessments
    });
  } catch (error) {
    logger.error('Failed to get client assessments', {
      errorCode: 'GET_CLIENT_ASSESSMENTS_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assessments'
    });
  }
};

// Scoped payment history for a single Build contract - used by the billing page's
// drill-down view so a client sees only that project's own deposit/final payments,
// not the whole account's transaction list. Relies on metadata.projectRequestId,
// which every Build payment already carries (see paymentController.js).
exports.getContractBilling = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const request = await prisma.projectRequest.findFirst({
      where: { id, userId, serviceType: 'build' },
      select: {
        id: true,
        subscriptionId: true,
        title: true,
        businessName: true,
        status: true,
        paymentAgreementStatus: true,
        paymentDueDate: true,
        paymentConfirmedAt: true,
        finalPaymentConfirmedAt: true,
        completionAcknowledgedAt: true,
        handoffIssuesReportedAt: true,
        depositAmount: true,
        totalAgreedAmount: true,
        quotedAmount: true,
        quoteCurrency: true,
        completedAt: true
      }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    const settlementEvents = await prisma.$queryRawUnsafe(
      `SELECT "eventData"->'cancellationSettlement' AS "cancellationSettlement"
       FROM "ProjectConversationMessage"
       WHERE "projectRequestId" = $1 AND "kind" = 'event' AND "eventData"->>'type' = 'cancel_confirmed'
       ORDER BY "createdAt" DESC LIMIT 1`,
      id
    );

    const payments = await prisma.payment.findMany({
      where: {
        userId,
        metadata: { path: ['projectRequestId'], equals: id }
      },
      select: {
        id: true,
        reference: true,
        amount: true,
        currency: true,
        status: true,
        paymentMethod: true,
        gateway: true,
        description: true,
        serviceType: true,
        invoiceId: true,
        metadata: true,
        gatewayResponse: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const acceptedQuote = await prisma.projectQuoteVersion.findFirst({
      where: { projectRequestId: id, status: 'accepted' },
      orderBy: { version: 'desc' },
      select: { id: true, version: true, snapshot: true, acceptedAt: true }
    });
    const totalAgreedAmount = Number(request.totalAgreedAmount || acceptedQuote?.snapshot?.totalAgreedAmount || acceptedQuote?.snapshot?.amount || request.quotedAmount || 0);
    const depositAmount = Number(request.depositAmount || acceptedQuote?.snapshot?.depositAmount || 0);
    const paidAmount = payments
      .filter(payment => payment.status === 'completed')
      .reduce((total, payment) => total + Number(payment.amount || 0) / 100, 0);
    const remainingBalance = Math.max(Math.round((totalAgreedAmount - paidAmount) * 100) / 100, 0);

    res.json({
      success: true,
      contract: {
        ...request,
        totalAgreedAmount,
        depositAmount,
        paidAmount,
        remainingBalance,
        acceptedQuote: acceptedQuote ? {
          id: acceptedQuote.id,
          version: acceptedQuote.version,
          acceptedAt: acceptedQuote.acceptedAt,
          snapshot: acceptedQuote.snapshot
        } : null,
        cancellationSettlement: settlementEvents[0]?.cancellationSettlement || null
      },
      payments: payments.map((payment) => {
        const { gatewayResponse, ...safePayment } = payment;
        return { ...safePayment, ...extractChannelInfo(payment) };
      })
    });
  } catch (error) {
    logger.error('Failed to get contract billing', {
      errorCode: 'GET_CONTRACT_BILLING_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contract billing history'
    });
  }
};
