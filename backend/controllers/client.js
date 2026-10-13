const { prisma } = require('../config/db');
const dns = require('dns').promises;
const { notifyUser, notifyAdmins } = require('../services/socketService');
const OpenAI = require('openai');
const Groq = require('groq-sdk');
const logger = require('../config/logger');
const { convertCurrencyAmount, normalizeCurrency } = require('../utils/currency');
const { recordProjectEvent } = require('../services/projectConversation');
const { ensureCompletedBuildSite } = require('../services/projectSiteService');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

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
      select: {
        id: true,
        tier: true,
        status: true,
        expiresAt: true,
        performanceData: true
      }
    });

    const activeNodes = subscriptions.length;
    
    // Use stored performance data if available, otherwise generate stable simulated data
    let uptime = 99.9;
    let latency = 14;
    let securityLevel = 'MAX';

    if (activeNodes > 0) {
      const sub = subscriptions[0]; // Primary or filtered subscription
      const perf = sub.performanceData || {};
      
      uptime = perf.uptime || (sub.status === 'suspended' ? 98.4 : 99.9);
      latency = perf.latency || (sub.tier === 'enterprise' ? 8 : (sub.status === 'suspended' ? 24 : 14));
      securityLevel = perf.securityLevel || (sub.tier === 'enterprise' ? 'ELITE' : 'MAX');

      // Add very minor jitter if it's live data
      uptime = parseFloat((uptime + (Math.random() * 0.01 - 0.005)).toFixed(2));
      latency = Math.round(latency + (Math.random() * 2 - 1));
    }

    res.json({
      success: true,
      stats: {
        activeNodes,
        uptime,
        securityLevel,
        latency
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
        timestamp: subscription.performanceData.timestamp
      });
    }

    res.json({
      success: true,
      vitals: null,
      aiInsights: null,
      timestamp: null
    });
  } catch (error) {
    logger.error('Failed to get site vitals', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to retrieve vitals' });
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
            where: { serviceType: 'build', status: { in: ['completed', 'handoff'] } },
            orderBy: { updatedAt: 'desc' },
            take: 1,
            select: {
              status: true,
              launchUrl: true,
              launchApprovedAt: true,
              completionAcknowledgedAt: true,
              handoffIssuesReportedAt: true,
              completedAt: true,
              quoteCurrency: true,
              totalAgreedAmount: true,
              quotedAmount: true
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
      where: { id: requestId, userId, serviceType: 'build' },
      select: { id: true }
    });
    if (!request) return res.status(404).json({ success: false, message: 'Build request not found' });

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
      where: { id: requestId, userId, serviceType: 'build' },
      select: { id: true }
    });
    if (!request) return res.status(404).json({ success: false, message: 'Build request not found' });

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

    const [payments, user] = await Promise.all([
      prisma.payment.findMany({
        where: {
          userId,
          status: { notIn: ['pending', 'superseded'] }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { defaultCurrency: true } })
    ]);

    const preferredCurrency = user?.defaultCurrency || 'USD';
    const billing = payments.map((payment) => {
      const majorUnitAmount = (payment.amount || 0) / 100;
      const showConverted = normalizeCurrency(payment.currency) !== normalizeCurrency(preferredCurrency);
      return {
        ...payment,
        preferredCurrency,
        convertedAmount: showConverted ? convertCurrencyAmount(majorUnitAmount, payment.currency, preferredCurrency) : null,
        ...extractChannelInfo(payment)
      };
    });

    res.json({
      success: true,
      billing
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
      where: { userId },
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
    const { subject, content } = req.body;

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

// Mark message as read
exports.markMessageRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await prisma.message.updateMany({
      where: { id, userId },
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

    if (message.sender !== 'USER') {
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
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
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
      domains
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
    const { domain, siteId, setup } = req.body;

    if (!domain || !siteId) {
      return res.status(400).json({
        success: false,
        message: 'Domain name and site selection are required'
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

    const domain = customDomain.domain;
    const serverIP = process.env.INFRA_IP || '102.0.21.24';
    const targetCname = process.env.INFRA_CNAME || 'nodes.sitemendr.com';

    try {
      let records = [];
      let isVerified = false;

      try {
        records = await dns.resolve4(domain);
        isVerified = records.includes(serverIP);
      } catch { /* Try the supported CNAME setup below. */ }

      if (!isVerified) {
        try {
          const cnameRecords = await dns.resolveCname(domain);
          records = [...records, ...cnameRecords];
          isVerified = cnameRecords.some(record => record.replace(/\.$/, '').toLowerCase() === targetCname.replace(/\.$/, '').toLowerCase());
        } catch { /* No matching CNAME is published yet. */ }
      }

      if (isVerified) {
        await prisma.customDomain.update({
          where: { id: domainId },
          data: { status: 'verified' }
        });

        return res.json({
          success: true,
          verified: true,
          message: 'DNS verified successfully. Your site is now live on this domain.',
          records
        });
      } else {
        return res.json({
          success: true,
          verified: false,
          message: `DNS verification failed. Expected an A record for ${serverIP} or a CNAME to ${targetCname}, but found ${records.join(', ') || 'no matching records'}.`,
          records
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
        message: 'Could not resolve domain. Please ensure you have added the A record and allowed time for propagation (up to 24-48 hours).',
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
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      optimizedContent = completion.choices[0].message.content.trim().replace(/^"(.*)"$/, '$1');
    } catch (oaError) {
      logger.error('OpenAI content optimization failed, trying Groq', { error: oaError.message });
      
      try {
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
      select: { id: true, title: true, businessName: true, status: true, totalAgreedAmount: true, quoteCurrency: true, completedAt: true }
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
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      contract: { ...request, cancellationSettlement: settlementEvents[0]?.cancellationSettlement || null },
      payments: payments.map((payment) => ({ ...payment, ...extractChannelInfo(payment) }))
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
