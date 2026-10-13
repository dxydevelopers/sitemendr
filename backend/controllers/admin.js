const { prisma } = require('../config/db');
const { verifyConnection } = require('../config/email');
const { notifyUser, notifyAdmins } = require('../services/socketService');
const { runSuspensionAutomation, suspendSubscription } = require('../scripts/suspensionAutomation');
const { verifyDomains } = require('../scripts/dnsWorker');
const logger = require('../config/logger');
const { recordProjectEvent } = require('../services/projectConversation');
const { ensureCompletedBuildSite } = require('../services/projectSiteService');
const { ADDONS, getAddon } = require('../services/addonCatalog');

const runInBatches = async (tasks, batchSize = 3) => {
  const results = [];

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    results.push(...await Promise.all(batch.map((task) => task())));
  }

  return results;
};

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

const isPublicHttpUrl = (value) => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol)
      && !/^(localhost|127\.0\.0\.1|0\.0\.0\.0|.*\.test)$/i.test(url.hostname);
  } catch {
    return false;
  }
};

const updateProjectPreviewUrl = async (projectRequestId, nextUrl) => {
  const current = await prisma.projectRequest.findUnique({
    where: { id: projectRequestId },
    select: { status: true, stagingUrl: true, stagingReviewStatus: true }
  });
  if (!current) return;
  const normalizedNextUrl = nextUrl || null;
  if ((current.stagingUrl || null) === normalizedNextUrl) return;

  await prisma.projectRequest.update({
    where: { id: projectRequestId },
    data: {
      stagingUrl: normalizedNextUrl,
      ...(current.status === 'staging_review' ? {
        stagingReviewStatus: 'sent',
        stagingReviewedAt: null,
        launchApprovedAt: null
      } : {})
    }
  });
};

exports.getAddonPurchases = async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { tier: { not: 'maintenance' } },
      select: {
        id: true,
        userId: true,
        siteName: true,
        customName: true,
        domain: true,
        purchasedAddons: true,
        user: { select: { name: true, email: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 1000
    });

    const purchases = subscriptions.flatMap((site) => {
      const addons = Array.isArray(site.purchasedAddons) ? site.purchasedAddons : [];
      return addons.flatMap((entry) => {
        const addonId = typeof entry === 'string' ? entry : entry?.id;
        const addon = getAddon(addonId);
        if (!addon || addon.fulfillmentMode !== 'admin') return [];
        return [{
          siteId: site.id,
          siteName: site.siteName || site.customName || 'Untitled site',
          domain: site.domain,
          user: site.user,
          addon: { id: addon.id, name: addon.name, price: addon.price },
          paymentId: typeof entry === 'object' ? entry.paymentId || null : null,
          purchasedAt: typeof entry === 'object' ? entry.purchasedAt || null : null,
          status: typeof entry === 'object' ? entry.fulfillmentStatus || 'pending' : 'pending',
          adminNote: typeof entry === 'object' ? entry.adminNote || '' : '',
          statusUpdatedAt: typeof entry === 'object' ? entry.statusUpdatedAt || null : null
        }];
      });
    });

    res.json({ success: true, data: purchases });
  } catch (error) {
    logger.error('GET_ADDON_PURCHASES_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to load add-on setup queue' });
  }
};

exports.updateAddonFulfillment = async (req, res) => {
  try {
    const { siteId, addonId } = req.params;
    const { status, adminNote = '' } = req.body;
    if (!getAddon(addonId) || getAddon(addonId).fulfillmentMode !== 'admin') {
      return res.status(404).json({ success: false, message: 'Admin-managed add-on not found' });
    }
    if (!['pending', 'in_progress', 'fulfilled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Choose a valid setup status' });
    }
    if (typeof adminNote !== 'string' || adminNote.length > 1000) {
      return res.status(400).json({ success: false, message: 'Setup note must be 1000 characters or fewer' });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`${siteId}:${addonId}`}))`;
      const site = await tx.subscription.findUnique({
        where: { id: siteId },
        select: { id: true, userId: true, purchasedAddons: true }
      });
      if (!site) return null;
      const addons = Array.isArray(site.purchasedAddons) ? site.purchasedAddons : [];
      const index = addons.findIndex((entry) => entry === addonId || entry?.id === addonId);
      if (index < 0) return null;

      const current = typeof addons[index] === 'object' && addons[index] !== null
        ? addons[index]
        : { id: addonId, name: getAddon(addonId).name };
      const updatedAddon = {
        ...current,
        fulfillmentMode: 'admin',
        fulfillmentStatus: status,
        adminNote: adminNote.trim(),
        statusUpdatedAt: new Date().toISOString(),
        statusUpdatedBy: req.user.userId
      };
      addons[index] = updatedAddon;
      await tx.subscription.update({ where: { id: site.id }, data: { purchasedAddons: addons } });
      return { userId: site.userId, addon: updatedAddon };
    });

    if (!result) return res.status(404).json({ success: false, message: 'The purchased add-on was not found on this site' });
    notifyUser(result.userId, 'addon_fulfillment_updated', { siteId, addonId, status });
    res.json({ success: true, data: result.addon });
  } catch (error) {
    logger.error('UPDATE_ADDON_FULFILLMENT_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to update add-on setup status' });
  }
};

const sanitizeReviewChatChoices = (choices) => {
  if (!Array.isArray(choices)) return null;
  const cleaned = choices
    .map(choice => typeof choice === 'string' ? choice.trim() : '')
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : null;
};

const normalizeReviewChatKind = (kind, choices) => {
  if (kind === 'question' || (Array.isArray(choices) && choices.length)) return 'question';
  if (kind === 'choice_response') return 'choice_response';
  if (kind === 'file') return 'file';
  return 'message';
};

// Get admin dashboard stats
exports.getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalLeads,
      totalAssessments,
      completedAssessments,
      activeSubscriptions,
      suspendedSubscriptions,
      totalRevenue,
      openTickets,
      recentLeads,
      recentAssessments
    ] = await runInBatches([
      () => prisma.user.count(),
      () => prisma.lead.count(),
      () => prisma.assessment.count(),
      () => prisma.assessment.count({ where: { status: 'completed' } }),
      () => prisma.subscription.count({ where: { status: 'active' } }),
      () => prisma.subscription.count({ where: { status: 'suspended' } }),
      () => prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true }
      }),
      () => prisma.supportTicket.count({ where: { status: { not: 'closed' } } }),
      () => prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true
        },
        take: 10
      }),
      () => prisma.assessment.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          responses: true
        },
        take: 10
      })
    ], 3);

    const conversionRate = totalAssessments > 0 
      ? ((completedAssessments / totalAssessments) * 100).toFixed(1) 
      : "0";

    // Get growth data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [userGrowthRaw, leadGrowthRaw] = await runInBatches([
      () => prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true }
      }),
      () => prisma.lead.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true }
      })
    ], 2);

    // Format growth data by day
    const formatDate = (date) => date.toISOString().split('T')[0];
    const growthMap = {};
    
    // Initialize last 30 days
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      growthMap[formatDate(d)] = { users: 0, leads: 0 };
    }

    userGrowthRaw.forEach(u => {
      const date = formatDate(u.createdAt);
      if (growthMap[date]) growthMap[date].users++;
    });

    leadGrowthRaw.forEach(l => {
      const date = formatDate(l.createdAt);
      if (growthMap[date]) growthMap[date].leads++;
    });

    const userGrowth = Object.keys(growthMap).sort().map(date => ({
      date,
      count: growthMap[date].users
    }));

    const leadGrowth = Object.keys(growthMap).sort().map(date => ({
      date,
      count: growthMap[date].leads
    }));

    res.json({
      success: true,
      data: {
        totalUsers,
        totalLeads,
        totalAssessments,
        conversionRate: `${conversionRate}%`,
        userGrowth,
        leadGrowth,
        recentLeads: recentLeads.map(l => ({
          id: l.id,
          name: l.name,
          email: l.email,
          status: l.status
        })),
        recentAssessments: recentAssessments.map(a => ({
          id: a.id,
          createdAt: a.createdAt,
          responses: a.responses
        })),
        subscriptions: {
          active: activeSubscriptions,
          suspended: suspendedSubscriptions,
          total: activeSubscriptions + suspendedSubscriptions
        },
        support: {
          openTickets
        },
        revenue: {
          total: (totalRevenue._sum.amount || 0) / 100
        }
      }
    });
  } catch (error) {
    logger.error('GET_ADMIN_STATS_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin stats'
    });
  }
};

// Run suspension automation manually
exports.runSuspensionCheck = async (req, res) => {
  try {
    const result = await runSuspensionAutomation();

    res.json({
      success: true,
      data: result,
      message: `Processed ${result.processed} subscriptions, suspended ${result.suspended}, notified ${result.notified}`
    });
  } catch (error) {
    logger.error('MANUAL_SUSPENSION_CHECK_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run suspension check'
    });
  }
};

// Manually suspend a subscription
exports.manualSuspend = async (req, res) => {
  try {
    const { subscriptionId, reason } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID is required'
      });
    }

    const result = await suspendSubscription(subscriptionId, reason);

    res.json({
      success: true,
      data: result,
      message: 'Subscription suspended successfully'
    });
  } catch (error) {
    logger.error('MANUAL_SUSPEND_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend subscription'
    });
  }
};

// Get payment enforcement settings
exports.getEnforcementSettings = async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'payment_enforcement' }
    });

    const defaultSettings = {
      ai_foundation: {
        overlayThreshold: 7,
        maxGracePeriod: 14,
        reminderFrequency: 'daily'
      },
      pro_enhancement: {
        overlayThreshold: 14,
        maxGracePeriod: 30,
        reminderFrequency: 'weekly'
      },
      enterprise: {
        overlayThreshold: 30,
        maxGracePeriod: 60,
        reminderFrequency: 'monthly'
      },
      self_hosted: {
        overlayThreshold: 365,
        maxGracePeriod: 730,
        reminderFrequency: 'yearly'
      },
      maintenance: {
        overlayThreshold: 3,
        maxGracePeriod: 7,
        reminderFrequency: 'daily'
      },
      automationEnabled: true,
      autoSuspendEnabled: true
    };

    res.json({
      success: true,
      data: setting ? setting.value : defaultSettings
    });
  } catch (error) {
    logger.error('GET_ENFORCEMENT_SETTINGS_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve enforcement settings'
    });
  }
};

// Update payment enforcement settings
exports.updateEnforcementSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    const updatedSetting = await prisma.setting.upsert({
      where: { key: 'payment_enforcement' },
      update: { value: settings },
      create: {
        key: 'payment_enforcement',
        value: settings
      }
    });

    res.json({
      success: true,
      data: updatedSetting.value,
      message: 'Enforcement settings updated'
    });
  } catch (error) {
    logger.error('UPDATE_ENFORCEMENT_SETTINGS_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update enforcement settings'
    });
  }
};

// Run DNS verification manually
exports.runDNSVerification = async (req, res) => {
  try {
    verifyDomains();

    res.json({
      success: true,
      message: 'DNS verification worker started in background'
    });
  } catch (error) {
    logger.error('MANUAL_DNS_VERIFICATION_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start DNS verification'
    });
  }
};
// Run security scan manually
exports.runSecurityScan = async (req, res) => {
  try {
    const { isDbConnected } = require('../config/db');

    const checks = [];

    const dbConnected = isDbConnected();
    checks.push({
      id: 'database',
      check: 'Database Connection',
      status: dbConnected ? 'good' : 'error',
      message: dbConnected ? 'Database connection healthy' : 'Database connection unavailable'
    });

    const cloudflareToken = process.env.CLOUDFLARE_API_TOKEN;
    const cloudflareZone = process.env.CLOUDFLARE_ZONE_ID;
    const hasCloudflare = Boolean(cloudflareToken && cloudflareToken !== 'your_cloudflare_token_for_dns_automation');
    const hasZone = Boolean(cloudflareZone && cloudflareZone !== 'your_cloudflare_zone_id');

    checks.push({
      id: 'dns',
      check: 'DNS Automation',
      status: hasCloudflare && hasZone ? 'good' : 'warning',
      message: hasCloudflare && hasZone ? 'Cloudflare DNS automation configured' : 'Cloudflare DNS automation not configured'
    });

    checks.push({
      id: 'ssl',
      check: 'SSL Provisioning',
      status: hasCloudflare && hasZone ? 'good' : 'warning',
      message: hasCloudflare && hasZone ? 'Cloudflare SSL automation configured' : 'Cloudflare SSL automation not configured'
    });

    const deployProvider = process.env.DEPLOYMENT_PROVIDER || 'local';
    const vercelToken = process.env.VERCEL_TOKEN;
    const netlifyToken = process.env.NETLIFY_TOKEN;
    let deployStatus = 'warning';
    let deployMessage = `Deployment provider set to ${deployProvider}`;

    if (deployProvider === 'vercel' && vercelToken && vercelToken !== 'your_vercel_token') {
      deployStatus = 'good';
      deployMessage = 'Vercel configured';
    } else if (deployProvider === 'netlify' && netlifyToken && netlifyToken !== 'your_netlify_token') {
      deployStatus = 'good';
      deployMessage = 'Netlify configured';
    } else if (deployProvider === 'local') {
      deployStatus = 'good';
      deployMessage = 'Local deployment enabled';
    }

    checks.push({
      id: 'deploy',
      check: 'Deployment Provider',
      status: deployStatus,
      message: deployMessage
    });

    const emailTransport = (process.env.EMAIL_TRANSPORT || 'smtp').toLowerCase();
    const hasEmailCreds = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    const emailOk = emailTransport === 'log' || hasEmailCreds;

    checks.push({
      id: 'email',
      check: 'Email Delivery',
      status: emailOk ? 'good' : 'warning',
      message: emailTransport === 'log'
        ? 'Email set to log transport'
        : hasEmailCreds
          ? 'SMTP credentials configured'
          : 'SMTP credentials missing'
    });

    const sslEnabled = process.env.SSL_ENABLED !== 'false';
    checks.push({
      id: 'security',
      check: 'Security Headers',
      status: 'good',
      message: 'Security middleware enabled'
    });

    res.json({
      success: true,
      data: {
        checks,
        config: {
          sslEnabled,
          deploymentProvider: deployProvider,
          emailTransport
        }
      }
    });
  } catch (error) {
    logger.error('SECURITY_SCAN_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run security scan'
    });
  }
};

// Lead management functions
exports.getLeads = async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: leads
    });
  } catch (error) {
    logger.error('GET_LEADS_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve leads'
    });
  }
};

exports.getLead = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({
      where: { id }
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    logger.error('GET_LEAD_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lead'
    });
  }
};

exports.updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const lead = await prisma.lead.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      data: lead,
      message: 'Lead status updated successfully'
    });
  } catch (error) {
    logger.error('UPDATE_LEAD_STATUS_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead status'
    });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.lead.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    logger.error('DELETE_LEAD_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lead'
    });
  }
};

// User management functions
exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        subscriptions: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('GET_USERS_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });

    res.json({
      success: true,
      data: user,
      message: 'User role updated successfully'
    });
  } catch (error) {
    logger.error('UPDATE_USER_ROLE_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
};

exports.toggleUserBan = async (req, res) => {
  try {
    const { id } = req.params;
    const { banned } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { banned }
    });

    res.json({
      success: true,
      data: user,
      message: `User ${banned ? 'banned' : 'unbanned'} successfully`
    });
  } catch (error) {
    logger.error('TOGGLE_USER_BAN_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user ban'
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Try deleting the user
    // Note: This might fail if there are dependent records in PostgreSQL
    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('DELETE_USER_ERROR:', error);
    
    // Check for P2003: Foreign key constraint failed
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user as they have active subscriptions or other associated records. Please cancel or delete those first.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

const buildRequestStatuses = [
  'submitted',
  'in_review',
  'quote_ready',
  'approved',
  'payment_agreement',
  'in_development',
  'paused',
  'staging_review',
  'launched',
  'handoff',
  'completed',
  'cancelled',
  'archived'
];

const buildMilestoneStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
const stagingReviewStatuses = ['not_sent', 'sent', 'changes_requested', 'approved'];

const defaultBuildMilestones = [
  {
    title: 'Scope lock',
    description: 'Confirm requirements, deliverables, access, and the working plan.',
    status: 'completed',
    progress: 100,
    order: 1
  },
  {
    title: 'Experience design',
    description: 'Shape the screens, flows, and interface direction before build-out.',
    status: 'pending',
    progress: 0,
    order: 2
  },
  {
    title: 'Development',
    description: 'Build the approved product features and connect required integrations.',
    status: 'pending',
    progress: 0,
    order: 3
  },
  {
    title: 'Staging review',
    description: 'Prepare a staging version for client checks and final adjustments.',
    status: 'pending',
    progress: 0,
    order: 4
  },
  {
    title: 'Launch',
    description: 'Move the approved build live and verify the production setup.',
    status: 'pending',
    progress: 0,
    order: 5
  },
  {
    title: 'Handoff',
    description: 'Share access, notes, and any final operating guidance.',
    status: 'pending',
    progress: 0,
    order: 6
  }
];

const projectRequestInclude = {
  user: true,
  assessment: {
    select: {
      id: true,
      responses: true,
      results: true,
      status: true,
      createdAt: true
    }
  },
  buildMilestones: {
    orderBy: { order: 'asc' }
  },
  studioTasks: {
    orderBy: [{ area: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }]
  },
  studioLinks: {
    orderBy: { createdAt: 'desc' }
  },
  studioBlockers: {
    orderBy: { createdAt: 'desc' }
  },
  studioUpdates: {
    orderBy: { createdAt: 'desc' },
    take: 20
  },
  quoteVersions: {
    orderBy: { version: 'desc' },
    take: 10
  }
};

const ensureDefaultBuildMilestones = async (projectRequestId) => {
  const existingCount = await prisma.buildMilestone.count({
    where: { projectRequestId }
  });

  if (existingCount > 0) return;

  await prisma.buildMilestone.createMany({
    data: defaultBuildMilestones.map((milestone) => ({
      projectRequestId,
      ...milestone
    }))
  });
};

const resetBuildStartMilestones = async (projectRequestId) => {
  await prisma.buildMilestone.deleteMany({
    where: { projectRequestId }
  });

  await prisma.buildMilestone.createMany({
    data: defaultBuildMilestones.map((milestone) => ({
      projectRequestId,
      ...milestone,
      status: milestone.order === 1 ? 'completed' : milestone.order === 2 ? 'in_progress' : 'pending',
      progress: milestone.order === 1 ? 100 : milestone.order === 2 ? 20 : 0,
      clientNote: null,
      dueDate: null
    }))
  });
};

// Build request management
exports.getProjectRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 200)
      : 100;
    const where = { serviceType: 'build' };
    if (status && status !== 'all') where.status = status;

    const requests = await prisma.projectRequest.findMany({
      where,
      include: projectRequestInclude,
      orderBy: { updatedAt: 'desc' },
      take: limit
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    logger.error('GET_PROJECT_REQUESTS_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve build requests'
    });
  }
};

exports.getReviewChatMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.projectRequest.findFirst({
      where: { id, serviceType: 'build' },
      select: { id: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Build request not found' });
    }

    const messages = await getProjectConversation(id);

    await prisma.$executeRawUnsafe(`UPDATE "ProjectConversationMessage" SET "readByAdmin" = true WHERE "projectRequestId" = $1 AND "senderRole" = 'client'`, id);

    res.json({ success: true, data: messages });
  } catch (error) {
    logger.error('GET_REVIEW_CHAT_MESSAGES_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to load review chat' });
  }
};

exports.createReviewChatMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message = '', kind = 'message', choices = null, selectedChoice = null, attachments = null } = req.body || {};
    const cleanedMessage = String(message || '').trim();
    const cleanedChoices = sanitizeReviewChatChoices(choices);
    const cleanedKind = normalizeReviewChatKind(kind, cleanedChoices);

    if (!cleanedMessage && !cleanedChoices?.length && !attachments) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const request = await prisma.projectRequest.findFirst({
      where: { id, serviceType: 'build' },
      select: { id: true, userId: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Build request not found' });
    }

    const rows = await prisma.$queryRawUnsafe(
      `INSERT INTO "ProjectConversationMessage"
       ("projectRequestId","senderId","senderRole","message","kind","choices","selectedChoice","attachments","readByAdmin","readByClient")
       VALUES ($1,$2,'admin',$3,$4,$5::jsonb,$6,$7::jsonb,true,false)
       RETURNING ${projectConversationSelect}`,
      id,
      req.user?.userId || null,
      cleanedMessage,
      cleanedKind,
      JSON.stringify(cleanedChoices),
      selectedChoice ? String(selectedChoice).trim() : null,
      JSON.stringify(attachments || null)
    );

    const chatMessage = rows[0];
    notifyUser(request.userId, 'project_conversation_message', { requestId: id, message: chatMessage });
    notifyAdmins('project_conversation_message', { requestId: id, message: chatMessage });

    res.json({ success: true, data: chatMessage, message: 'Review message sent' });
  } catch (error) {
    logger.error('CREATE_REVIEW_CHAT_MESSAGE_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to send review message' });
  }
};

exports.getHandoffChatMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.projectRequest.findFirst({
      where: { id, serviceType: 'build' },
      select: { id: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Build request not found' });
    }

    const messages = await getProjectConversation(id);

    await prisma.$executeRawUnsafe(`UPDATE "ProjectConversationMessage" SET "readByAdmin" = true WHERE "projectRequestId" = $1 AND "senderRole" = 'client'`, id);

    res.json({ success: true, data: messages });
  } catch (error) {
    logger.error('GET_HANDOFF_CHAT_MESSAGES_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to load handoff chat' });
  }
};

exports.createHandoffChatMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message = '', attachments = null } = req.body || {};
    const cleanedMessage = String(message || '').trim();

    if (!cleanedMessage && !attachments) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const request = await prisma.projectRequest.findFirst({
      where: { id, serviceType: 'build' },
      select: { id: true, userId: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Build request not found' });
    }

    const rows = await prisma.$queryRawUnsafe(
      `INSERT INTO "ProjectConversationMessage"
       ("id","projectRequestId","senderId","senderRole","message","kind","choices","selectedChoice","attachments","readByAdmin","readByClient")
       VALUES ($1,$2,$3,'admin',$4,'message',NULL,NULL,$5::jsonb,true,false)
       RETURNING ${projectConversationSelect}`,
      require('crypto').randomUUID(),
      id,
      req.user?.userId || null,
      cleanedMessage,
      JSON.stringify(attachments || null)
    );

    const chatMessage = rows[0];
    notifyUser(request.userId, 'project_conversation_message', { requestId: id, message: chatMessage });
    notifyAdmins('project_conversation_message', { requestId: id, message: chatMessage });

    res.json({ success: true, data: chatMessage, message: 'Handoff message sent' });
  } catch (error) {
    logger.error('CREATE_HANDOFF_CHAT_MESSAGE_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to send handoff message' });
  }
};

exports.getProjectConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.projectRequest.findFirst({
      where: { id, serviceType: 'build' },
      select: { id: true }
    });
    if (!request) return res.status(404).json({ success: false, message: 'Build request not found' });

    const messages = await getProjectConversation(id);
    await prisma.$executeRawUnsafe(`UPDATE "ProjectConversationMessage" SET "readByAdmin" = true WHERE "projectRequestId" = $1 AND "senderRole" = 'client'`, id);
    res.json({ success: true, data: messages });
  } catch (error) {
    logger.error('GET_ADMIN_PROJECT_CONVERSATION_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to load project conversation' });
  }
};

exports.createProjectConversationMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message = '', kind = 'message', choices = null, selectedChoice = null, attachments = null } = req.body || {};
    const cleanedMessage = String(message || '').trim();
    const cleanedChoices = sanitizeReviewChatChoices(choices);
    const cleanedKind = normalizeReviewChatKind(kind, cleanedChoices);
    if (!cleanedMessage && !cleanedChoices?.length && !attachments) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const request = await prisma.projectRequest.findFirst({
      where: { id, serviceType: 'build' },
      select: { id: true, userId: true }
    });
    if (!request) return res.status(404).json({ success: false, message: 'Build request not found' });

    const rows = await prisma.$queryRawUnsafe(
      `INSERT INTO "ProjectConversationMessage"
       ("projectRequestId","senderId","senderRole","message","kind","choices","selectedChoice","attachments","readByAdmin","readByClient")
       VALUES ($1,$2,'admin',$3,$4,$5::jsonb,$6,$7::jsonb,true,false)
       RETURNING ${projectConversationSelect}`,
      id, req.user?.userId || null, cleanedMessage, cleanedKind, JSON.stringify(cleanedChoices),
      selectedChoice ? String(selectedChoice).trim() : null, JSON.stringify(attachments || null)
    );
    const chatMessage = rows[0];
    notifyUser(request.userId, 'project_conversation_message', { requestId: id, message: chatMessage });
    notifyAdmins('project_conversation_message', { requestId: id, message: chatMessage });
    res.json({ success: true, data: chatMessage, message: 'Project message sent' });
  } catch (error) {
    logger.error('CREATE_ADMIN_PROJECT_CONVERSATION_MESSAGE_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to send project message' });
  }
};

exports.decideProjectLifecycleRequest = async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const { decision, settlementSelection } = req.body || {};
    const message = typeof req.body?.message === 'string' ? req.body.message : '';
    if (!['confirm', 'decline', 'resume', 'reopen'].includes(decision)) return res.status(400).json({ success: false, message: 'Choose confirm, decline, resume, or reopen.' });
    const rows = await prisma.$queryRawUnsafe(
      `SELECT "id","eventData" FROM "ProjectConversationMessage" WHERE "id" = $1 AND "projectRequestId" = $2 AND "kind" = 'event' LIMIT 1`, messageId, id
    );
    const requestEvent = rows[0];
    const eventData = requestEvent?.eventData || {};
    const lifecycleType = eventData.lifecycleType;
    const isResume = decision === 'resume';
    const isReopen = decision === 'reopen';
    if (!requestEvent || (isResume
      ? lifecycleType !== 'pause' || eventData.lifecycleStatus !== 'confirmed'
      : isReopen
        ? lifecycleType !== 'cancel' || eventData.lifecycleStatus !== 'confirmed'
      : !['pause', 'cancel'].includes(lifecycleType) || eventData.lifecycleStatus !== 'pending')) {
      return res.status(404).json({ success: false, message: 'Pending pause or cancellation request not found.' });
    }
    const request = await prisma.projectRequest.findFirst({ where: { id, serviceType: 'build' }, select: { id: true, userId: true, status: true, quoteCurrency: true } });
    if (!request) return res.status(404).json({ success: false, message: 'Build request not found.' });
    if ((isResume || isReopen) && !message.trim()) return res.status(400).json({ success: false, message: 'Add a reason for reopening or resuming the build.' });
    const lifecycleStatus = isResume ? 'resumed' : isReopen ? 'reopened' : decision === 'confirm' ? 'confirmed' : 'declined';
    let cancellationSettlement = null;
    if (decision === 'confirm' && lifecycleType === 'cancel') {
      const acceptedQuote = await prisma.projectQuoteVersion.findFirst({
        where: { projectRequestId: id, status: 'accepted' },
        orderBy: { version: 'desc' },
        select: { id: true, version: true, snapshot: true }
      });
      const selectedMilestones = Array.isArray(settlementSelection?.completedMilestoneIndexes) ? settlementSelection.completedMilestoneIndexes : [];
      const selectedCosts = Array.isArray(settlementSelection?.incurredCostIndexes) ? settlementSelection.incurredCostIndexes : [];
      const payments = await prisma.payment.findMany({
        where: {
          userId: request.userId,
          status: 'completed',
          serviceType: { in: ['build_agreement', 'build_final_balance'] },
          metadata: { path: ['projectRequestId'], equals: id }
        },
        select: { id: true, reference: true, amount: true, currency: true }
      });
      if (!acceptedQuote) {
        if (payments.length || selectedMilestones.length || selectedCosts.length) {
          return res.status(409).json({ success: false, message: 'This build has no accepted quote, but payment or charge selections exist. Review the contract before cancelling.' });
        }
        cancellationSettlement = {
          quoteVersionId: null,
          quoteVersion: null,
          currency: String(request.quoteCurrency || 'USD').toUpperCase(),
          completedMilestones: [],
          incurredCosts: [],
          milestoneCharges: 0,
          costCharges: 0,
          chargeTotal: 0,
          paidTotal: 0,
          refundDue: 0,
          balanceDue: 0,
          paymentReferences: [],
          refundStatus: 'not_due',
          recordedAt: new Date().toISOString()
        };
      } else {
        const snapshot = acceptedQuote.snapshot || {};
        const quotedMilestones = Array.isArray(snapshot.milestoneAmounts) ? snapshot.milestoneAmounts : [];
        const approvedCosts = Array.isArray(snapshot.nonRecoverableCosts) ? snapshot.nonRecoverableCosts : [];
        if (!snapshot.cancellationTerms || !settlementSelection) {
          return res.status(400).json({ success: false, message: 'The accepted quote and cancellation closeout selection are required before confirming cancellation.' });
        }
        const invalidMilestone = selectedMilestones.some(index => !Number.isInteger(index) || index < 0 || index >= quotedMilestones.length);
        const invalidCost = selectedCosts.some(index => !Number.isInteger(index) || index < 0 || index >= approvedCosts.length);
        if (invalidMilestone || invalidCost || new Set(selectedMilestones).size !== selectedMilestones.length || new Set(selectedCosts).size !== selectedCosts.length) {
          return res.status(400).json({ success: false, message: 'Closeout selections must match unique milestones and approved costs on the accepted quote.' });
        }
        const quoteCurrency = String(snapshot.currency || request.quoteCurrency || 'USD').toUpperCase();
      if (payments.some(payment => String(payment.currency || '').toUpperCase() !== quoteCurrency)) {
        return res.status(409).json({ success: false, message: 'Payments exist in a different currency from the accepted quote. Reconcile the converted amounts before confirming cancellation.' });
      }
      const completedMilestones = selectedMilestones.map(index => quotedMilestones[index]).map(item => ({ name: item.name, amount: Number(item.amount) }));
      const incurredCosts = selectedCosts.map(index => approvedCosts[index]).map(item => ({ name: item.name, amount: Number(item.amount), reason: item.reason }));
      const milestoneCharges = completedMilestones.reduce((sum, item) => sum + item.amount, 0);
      const costCharges = incurredCosts.reduce((sum, item) => sum + item.amount, 0);
      const paidTotal = payments.reduce((sum, payment) => sum + Number(payment.amount || 0) / 100, 0);
      const chargeTotal = milestoneCharges + costCharges;
      cancellationSettlement = {
        quoteVersionId: acceptedQuote.id,
        quoteVersion: acceptedQuote.version,
        currency: quoteCurrency,
        completedMilestones,
        incurredCosts,
        milestoneCharges,
        costCharges,
        chargeTotal,
        paidTotal,
        refundDue: Math.max(paidTotal - chargeTotal, 0),
        balanceDue: Math.max(chargeTotal - paidTotal, 0),
        paymentReferences: payments.map(payment => payment.reference),
        refundStatus: paidTotal > chargeTotal ? 'pending' : 'not_due',
        recordedAt: new Date().toISOString()
      };
      }
    }
    if (isResume) {
      if (request.status !== 'paused' || !buildRequestStatuses.includes(eventData.previousStatus)) return res.status(409).json({ success: false, message: 'The paused build cannot be resumed from its saved stage.' });
      await prisma.projectRequest.update({ where: { id }, data: { status: eventData.previousStatus } });
    } else if (isReopen) {
      const settlement = eventData.cancellationSettlement || {};
      if (request.status !== 'cancelled' || !buildRequestStatuses.includes(eventData.previousStatus)) return res.status(409).json({ success: false, message: 'This cancelled build cannot be reopened from its saved stage.' });
      if (Number(settlement.refundedTotal || 0) > 0) return res.status(409).json({ success: false, message: 'A refund has already been recorded. Create a new build agreement to continue work.' });
      cancellationSettlement = { ...settlement, settlementStatus: 'reversed', refundStatus: 'voided' };
      await prisma.projectRequest.update({ where: { id }, data: { status: eventData.previousStatus } });
    } else if (decision === 'confirm') {
      if (request.status !== eventData.previousStatus) return res.status(409).json({ success: false, message: 'The project stage changed after this request was sent. Review the latest stage before confirming.' });
      const nextStatus = lifecycleType === 'pause' ? 'paused' : 'cancelled';
      await prisma.projectRequest.update({ where: { id }, data: { status: nextStatus } });
    }
    const updatedEventRows = cancellationSettlement
      ? await prisma.$queryRawUnsafe(
        `UPDATE "ProjectConversationMessage"
         SET "eventData" = jsonb_set(jsonb_set("eventData", '{lifecycleStatus}', to_jsonb($2::text), true), '{cancellationSettlement}', $3::jsonb, true),
             "readByClient" = false WHERE "id" = $1 RETURNING ${projectConversationSelect}`,
        messageId, lifecycleStatus, JSON.stringify(cancellationSettlement)
      )
      : await prisma.$queryRawUnsafe(
        `UPDATE "ProjectConversationMessage" SET "eventData" = jsonb_set("eventData", '{lifecycleStatus}', to_jsonb($2::text), true), "readByClient" = false WHERE "id" = $1 RETURNING ${projectConversationSelect}`,
        messageId, lifecycleStatus
      );
    if (updatedEventRows[0]) {
      notifyUser(request.userId, 'project_conversation_message', { requestId: id, message: updatedEventRows[0] });
      notifyAdmins('project_conversation_message', { requestId: id, message: updatedEventRows[0] });
    }
    await recordProjectEvent(id, `${lifecycleType}_${lifecycleStatus}`, isResume ? `The admin resumed the build at its previous stage. ${message.trim()}` : isReopen ? `The admin reopened the cancelled build at its previous stage. ${message.trim()}` : `The admin ${decision === 'confirm' ? 'confirmed' : 'declined'} the ${lifecycleType} request.${message.trim() ? ` ${message.trim()}` : ''}`, { lifecycleType, lifecycleStatus, previousStatus: eventData.previousStatus || null, adminNote: message.trim() || null, ...(cancellationSettlement ? { cancellationSettlement } : {}) });
    const updated = await prisma.projectRequest.findUnique({ where: { id }, include: projectRequestInclude });
    notifyUser(request.userId, 'project_request_updated', { request: updated });
    notifyAdmins('project_request_updated', { request: updated });
    res.json({ success: true, data: updated, message: `Request ${lifecycleStatus}.` });
  } catch (error) {
    logger.error('DECIDE_PROJECT_LIFECYCLE_REQUEST_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to record the admin decision.' });
  }
};

exports.recordCancellationRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const amount = Number(req.body?.amount);
    const reference = typeof req.body?.reference === 'string' ? req.body.reference.trim() : '';
    const request = await prisma.projectRequest.findFirst({ where: { id, serviceType: 'build', status: 'cancelled' }, select: { id: true, userId: true } });
    if (!request) return res.status(409).json({ success: false, message: 'Refunds can only be recorded for a cancelled build.' });
    if (!Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.0001 || !reference || reference.length > 200) {
      return res.status(400).json({ success: false, message: 'Enter a positive refund amount and the external transaction reference.' });
    }
    const settlementRows = await prisma.$queryRawUnsafe(
      `SELECT "id","eventData" FROM "ProjectConversationMessage" WHERE "projectRequestId" = $1 AND "kind" = 'event' AND "eventData"->>'type' = 'cancel_confirmed' ORDER BY "createdAt" DESC LIMIT 1`, id
    );
    const settlementEvent = settlementRows[0];
    const settlement = settlementEvent?.eventData?.cancellationSettlement;
    if (!settlement || Number(settlement.refundDue) <= 0 || !['pending', 'partial'].includes(settlement.refundStatus)) {
      return res.status(409).json({ success: false, message: 'This cancellation has no outstanding refund due.' });
    }
    const duplicate = await prisma.$queryRawUnsafe(
      `SELECT "id" FROM "ProjectConversationMessage" WHERE "projectRequestId" = $1 AND "kind" = 'event' AND "eventData"->>'refundReference' = $2 LIMIT 1`, id, reference
    );
    if (duplicate.length) return res.status(409).json({ success: false, message: 'That refund reference has already been recorded.' });
    const refundedTotal = Number(settlement.refundedTotal || 0);
    const remainingBefore = Math.max(Number(settlement.refundDue) - refundedTotal, 0);
    if (amount > remainingBefore) return res.status(400).json({ success: false, message: 'The refund amount is greater than the remaining amount due.' });
    const nextRefundedTotal = Math.round((refundedTotal + amount) * 100) / 100;
    const remainingAfter = Math.max(Math.round((Number(settlement.refundDue) - nextRefundedTotal) * 100) / 100, 0);
    const updatedSettlement = {
      ...settlement,
      refundedTotal: nextRefundedTotal,
      refundStatus: remainingAfter === 0 ? 'processed' : 'partial',
      lastRefundReference: reference,
      lastRefundAmount: amount,
      lastRefundAt: new Date().toISOString()
    };
    const updatedRows = await prisma.$queryRawUnsafe(
      `UPDATE "ProjectConversationMessage" SET "eventData" = jsonb_set("eventData", '{cancellationSettlement}', $2::jsonb, true)
       WHERE "id" = $1 AND COALESCE("eventData"->'cancellationSettlement'->>'refundedTotal', '0') = $3
       RETURNING ${projectConversationSelect}`,
      settlementEvent.id, JSON.stringify(updatedSettlement), String(settlement.refundedTotal || 0)
    );
    if (!updatedRows.length) return res.status(409).json({ success: false, message: 'The refund record changed just now. Reload the conversation and try again.' });
    if (updatedRows[0]) {
      notifyUser(request.userId, 'project_conversation_message', { requestId: id, message: updatedRows[0] });
      notifyAdmins('project_conversation_message', { requestId: id, message: updatedRows[0] });
    }
    await recordProjectEvent(id, 'cancellation_refund_processed', `Admin recorded a refund of ${settlement.currency} ${amount}. External reference: ${reference}.`, {
      refundReference: reference,
      refundAmount: amount,
      currency: settlement.currency,
      refundedTotal: nextRefundedTotal,
      refundRemaining: remainingAfter,
      refundStatus: updatedSettlement.refundStatus,
      cancellationSettlement: updatedSettlement
    });
    const updated = await prisma.projectRequest.findUnique({ where: { id }, include: projectRequestInclude });
    notifyUser(request.userId, 'project_request_updated', { request: updated });
    notifyAdmins('project_request_updated', { request: updated });
    res.json({ success: true, data: updated, message: `Refund recorded. ${remainingAfter > 0 ? `${settlement.currency} ${remainingAfter} remains.` : 'The cancellation refund is fully recorded.'}` });
  } catch (error) {
    logger.error('RECORD_CANCELLATION_REFUND_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to record the cancellation refund.' });
  }
};

exports.updateProjectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      priority,
      quotedAmount,
      quoteCurrency,
      paymentAgreementType,
      paymentAgreementStatus,
      depositAmount,
      totalAgreedAmount,
      paymentDueDate,
      paymentInstructions,
      productionMode,
      productionSourceNote,
      stagingUrl,
      stagingNotes,
      stagingReviewStatus,
      launchUrl,
      launchNotes,
      handoffNotes,
      completionNotes,
      completionAcknowledgedAt,
      handoffIssuesReportedAt,
      finalPaymentConfirmedAt,
      adminNotes,
      clientNotes,
      packageIntent,
      timeline,
      budget,
      quoteMilestones,
      nonRecoverableCosts
    } = req.body;

    const currentTerms = await prisma.projectRequest.findUnique({
      where: { id },
      select: {
        quotedAmount: true,
        quoteCurrency: true,
        timeline: true,
        totalAgreedAmount: true,
        depositAmount: true,
        paymentAgreementType: true,
        paymentAgreementStatus: true,
        paymentDueDate: true,
        paymentInstructions: true,
        status: true,
        stagingUrl: true,
        stagingReviewStatus: true
      }
    });
    if (!currentTerms) return res.status(404).json({ success: false, message: 'Build request not found.' });
    const acceptedQuote = await prisma.projectQuoteVersion.findFirst({
      where: { projectRequestId: id, status: 'accepted' },
      orderBy: { version: 'desc' },
      select: { id: true }
    });

    const acceptedQuoteTermsChanged = acceptedQuote && (
      (quotedAmount !== undefined && quotedAmount !== '' && Number(quotedAmount) !== Number(currentTerms.quotedAmount))
      || (quoteCurrency !== undefined && String(quoteCurrency || 'USD').toUpperCase() !== String(currentTerms.quoteCurrency || 'USD').toUpperCase())
      || (timeline !== undefined && (timeline || '') !== (currentTerms.timeline || ''))
      || status === 'quote_ready'
    );
    if (acceptedQuoteTermsChanged) {
      return res.status(409).json({ success: false, message: 'This quote has already been accepted. Create a new build agreement to change its price or currency.' });
    }

    const agreementAlreadySent = ['sent', 'confirmed'].includes(String(currentTerms.paymentAgreementStatus || ''));
    const agreementTermsChanged = agreementAlreadySent && (
      (totalAgreedAmount !== undefined && Number(totalAgreedAmount || 0) !== Number(currentTerms.totalAgreedAmount || 0))
      || (depositAmount !== undefined && Number(depositAmount || 0) !== Number(currentTerms.depositAmount || 0))
      || (paymentAgreementType !== undefined && (paymentAgreementType || null) !== (currentTerms.paymentAgreementType || null))
      || (paymentDueDate !== undefined && String(paymentDueDate || '') !== String(currentTerms.paymentDueDate?.toISOString?.().slice(0, 10) || ''))
      || (paymentInstructions !== undefined && (paymentInstructions || '') !== (currentTerms.paymentInstructions || ''))
      || (paymentAgreementStatus !== undefined && paymentAgreementStatus !== currentTerms.paymentAgreementStatus)
    );
    if (agreementTermsChanged) {
      return res.status(409).json({ success: false, message: 'The payment agreement has already been sent. Keep its terms unchanged and create a new build agreement if they need to change.' });
    }

    if (status === 'payment_agreement' && paymentAgreementStatus === 'sent') {
      const agreedTotal = Number(totalAgreedAmount ?? currentTerms.totalAgreedAmount ?? currentTerms.quotedAmount ?? 0);
      const agreedDeposit = Number(depositAmount ?? currentTerms.depositAmount ?? 0);
      const agreementType = paymentAgreementType ?? currentTerms.paymentAgreementType;
      if (!acceptedQuote
        || agreementType !== 'deposit'
        || !Number.isFinite(agreedTotal)
        || !Number.isFinite(agreedDeposit)
        || agreedTotal <= 0
        || agreedDeposit <= 0
        || agreedDeposit > agreedTotal) {
        return res.status(400).json({
          success: false,
          message: 'Send a payment request only after quote acceptance, with a positive deposit no greater than the agreed total. The current flow supports a deposit followed by the final balance.'
        });
      }
    }

    if (status === 'quote_ready' && clientNotes !== undefined) {
      if (!Array.isArray(quoteMilestones) || !quoteMilestones.length || quoteMilestones.some(item => !item || typeof item.name !== 'string' || !item.name.trim() || !Number.isFinite(Number(item.amount)) || Number(item.amount) <= 0)) {
        return res.status(400).json({ success: false, message: 'Valid milestone names and amounts are required for a quote.' });
      }
      if (!Array.isArray(nonRecoverableCosts) || nonRecoverableCosts.some(item => !item || typeof item.name !== 'string' || !item.name.trim() || !Number.isFinite(Number(item.amount)) || Number(item.amount) <= 0 || typeof item.reason !== 'string' || !item.reason.trim())) {
        return res.status(400).json({ success: false, message: 'Each pre-approved non-recoverable cost needs a name, positive amount, and reason.' });
      }
      const amountForValidation = quotedAmount === undefined ? Number((await prisma.projectRequest.findUnique({ where: { id }, select: { quotedAmount: true } }))?.quotedAmount) : Number(quotedAmount);
      const milestoneTotal = quoteMilestones.reduce((sum, item) => sum + Number(item.amount), 0);
      if (!Number.isFinite(amountForValidation) || Math.abs(milestoneTotal - amountForValidation) > 0.01) {
        return res.status(400).json({ success: false, message: 'Milestone amounts must add up to the full quote amount.' });
      }
    }

    let previousRequestStatus = null;
    let completionGate = null;
    const data = {};
    if (status !== undefined) {
      if (!buildRequestStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid build request status'
        });
      }
      if (['paused', 'cancelled'].includes(status)) {
        const lifecycleType = status === 'paused' ? 'pause' : 'cancel';
        const latestLifecycleRequest = await prisma.$queryRawUnsafe(
          `SELECT "id","eventData" FROM "ProjectConversationMessage" WHERE "projectRequestId" = $1 AND "kind" = 'event' AND "eventData"->>'lifecycleType' = $2 ORDER BY "createdAt" DESC LIMIT 1`,
          id, lifecycleType
        );
        if (latestLifecycleRequest[0]?.eventData?.lifecycleStatus !== 'confirmed') return res.status(400).json({ success: false, message: 'Pause and cancellation status changes require a currently approved request in the project conversation.' });
      }
      if (status === 'in_development') {
        const currentRequest = await prisma.projectRequest.findUnique({
          where: { id },
          select: { status: true, paymentAgreementStatus: true, paymentConfirmedAt: true }
        });
        previousRequestStatus = currentRequest?.status || null;

        const canEnterDevelopmentFrom = ['payment_agreement', 'in_development', 'staging_review'];
        if (!acceptedQuote
          || !currentRequest
          || !canEnterDevelopmentFrom.includes(currentRequest.status)
          || currentRequest.paymentAgreementStatus !== 'confirmed'
          || !currentRequest.paymentConfirmedAt) {
          return res.status(400).json({
            success: false,
            message: 'Development requires an accepted quote, a verified deposit, and a valid build stage.'
          });
        }
      }
      if (status === 'staging_review') {
        const currentRequest = await prisma.projectRequest.findUnique({
          where: { id },
          select: {
            status: true,
            stagingUrl: true,
            studioLinks: { select: { type: true, url: true } },
            studioTasks: { select: { status: true } },
            studioBlockers: { select: { status: true } },
            studioUpdates: { where: { visibility: 'client' }, select: { id: true }, take: 1 }
          }
        });
        if (!['in_development', 'staging_review'].includes(currentRequest?.status)) {
          return res.status(400).json({
            success: false,
            message: 'A preview can only be sent for review from the development or preview-review stage.'
          });
        }
        const previewUrl = stagingUrl !== undefined ? stagingUrl : currentRequest.stagingUrl;
        const hasPublicPreview = isPublicHttpUrl(previewUrl)
          || currentRequest.studioLinks.some(link => link.type === 'preview' && isPublicHttpUrl(link.url));
        const hasProductionEvidence = currentRequest.studioLinks.some(link => ['design', 'repo', 'file', 'link'].includes(link.type));
        const hasCompletedWork = currentRequest.studioTasks.some(task => task.status === 'done');
        const hasOpenBlockers = currentRequest.studioBlockers.some(blocker => blocker.status !== 'resolved');
        if (!currentRequest.studioUpdates.length || !hasPublicPreview || !hasProductionEvidence || !hasCompletedWork || hasOpenBlockers) {
          return res.status(400).json({
            success: false,
            message: 'Review requires a client update, public preview, production evidence, completed work, and no open blockers.'
          });
        }
      }
      if (status === 'completed') {
        const currentRequest = await prisma.projectRequest.findUnique({
          where: { id },
          select: {
            status: true,
            completionAcknowledgedAt: true,
            handoffIssuesReportedAt: true,
            finalPaymentConfirmedAt: true,
            totalAgreedAmount: true,
            quotedAmount: true,
            depositAmount: true
          }
        });
        const finalBalance = Math.max((currentRequest?.totalAgreedAmount || currentRequest?.quotedAmount || 0) - (currentRequest?.depositAmount || 0), 0);
        if (currentRequest?.status !== 'handoff' || !currentRequest.completionAcknowledgedAt || currentRequest.handoffIssuesReportedAt || (finalBalance > 0 && !currentRequest.finalPaymentConfirmedAt)) {
          return res.status(400).json({
            success: false,
            message: 'Completion requires an active handoff, client acceptance, and verified final payment when a balance is due.'
          });
        }
        previousRequestStatus = currentRequest.status;
        completionGate = { finalBalance };
      }
      if (status === 'launched' || status === 'handoff') {
        const currentRequest = await prisma.projectRequest.findUnique({
          where: { id },
          select: {
            status: true,
            stagingReviewStatus: true,
            launchApprovedAt: true,
            stagingUrl: true,
            launchUrl: true,
            completionAcknowledgedAt: true,
            studioLinks: { select: { type: true, url: true } },
            studioTasks: { select: { status: true } },
            studioBlockers: { select: { status: true } },
            studioUpdates: { where: { visibility: 'client' }, select: { id: true }, take: 1 }
          }
        });
        const hasCurrentReviewReadiness = Boolean(currentRequest
          && currentRequest.studioUpdates.length > 0
          && (isPublicHttpUrl(currentRequest.stagingUrl) || currentRequest.studioLinks.some(link => link.type === 'preview' && isPublicHttpUrl(link.url)))
          && currentRequest.studioLinks.some(link => ['design', 'repo', 'file', 'link'].includes(link.type))
          && currentRequest.studioTasks.some(task => task.status === 'done')
          && currentRequest.studioBlockers.every(blocker => blocker.status === 'resolved'));
        const previewChangedDuringLaunch = stagingUrl !== undefined
          && (stagingUrl || null) !== (currentRequest?.stagingUrl || null);
        if (status === 'launched' && (currentRequest?.status !== 'staging_review'
          || currentRequest.stagingReviewStatus !== 'approved'
          || !currentRequest.launchApprovedAt
          || previewChangedDuringLaunch
          || !hasCurrentReviewReadiness
          || !isPublicHttpUrl(currentRequest.stagingUrl)
          || !isPublicHttpUrl(launchUrl || currentRequest.launchUrl || ''))) {
          return res.status(400).json({
            success: false,
            message: 'Launch requires the current public preview to be approved and a public live URL.'
          });
        }
        if (status === 'handoff' && (!['launched', 'completed'].includes(currentRequest?.status) || !/^https?:\/\//i.test(currentRequest.launchUrl || launchUrl || ''))) {
          return res.status(400).json({
            success: false,
            message: 'Handoff requires a live site with a valid URL'
          });
        }
        if (status === 'handoff' && currentRequest?.status === 'completed') {
          data.completionAcknowledgedAt = null;
          data.completedAt = null;
          // Keep a review marker so both dashboards distinguish a reopened
          // handoff from a fresh one waiting for its first client response.
          data.handoffIssuesReportedAt = new Date();
        }
      }
      data.status = status;
      data.reviewedAt = new Date();
    }
    if (priority !== undefined) data.priority = priority;
    if (quotedAmount !== undefined && quotedAmount !== '') data.quotedAmount = Number(quotedAmount);
    if (quoteCurrency !== undefined) data.quoteCurrency = quoteCurrency || 'USD';
    if (paymentAgreementType !== undefined) data.paymentAgreementType = paymentAgreementType || null;
    if (paymentAgreementStatus !== undefined) {
      const currentRequest = await prisma.projectRequest.findUnique({
        where: { id },
        select: { paymentAgreementStatus: true }
      });

      if (paymentAgreementStatus === 'confirmed' && currentRequest?.paymentAgreementStatus !== 'confirmed') {
        return res.status(400).json({
          success: false,
          message: 'Payment confirmation is handled by verified checkout'
        });
      }

      data.paymentAgreementStatus = paymentAgreementStatus || 'pending';
      if (paymentAgreementStatus !== 'confirmed') {
        data.paymentConfirmedAt = null;
      }
    }
    if (depositAmount !== undefined) data.depositAmount = depositAmount === '' || depositAmount === null ? null : Number(depositAmount);
    if (totalAgreedAmount !== undefined) data.totalAgreedAmount = totalAgreedAmount === '' || totalAgreedAmount === null ? null : Number(totalAgreedAmount);
    if (paymentDueDate !== undefined) data.paymentDueDate = paymentDueDate ? new Date(paymentDueDate) : null;
    if (paymentInstructions !== undefined) data.paymentInstructions = paymentInstructions;
    if (productionMode !== undefined) {
      if (!productionModes.includes(productionMode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid production mode'
        });
      }
      data.productionMode = productionMode;
    }
    if (productionSourceNote !== undefined) data.productionSourceNote = productionSourceNote || null;
    if (stagingUrl !== undefined) {
      data.stagingUrl = stagingUrl || null;
      if ((currentTerms.stagingUrl || null) !== (stagingUrl || null) && currentTerms.status === 'staging_review') {
        data.stagingReviewStatus = 'sent';
        data.stagingReviewedAt = null;
        data.launchApprovedAt = null;
      }
    }
    if (stagingNotes !== undefined) data.stagingNotes = stagingNotes;
    if (stagingReviewStatus !== undefined) {
      if (!stagingReviewStatuses.includes(stagingReviewStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid staging review status'
        });
      }
      if (stagingReviewStatus === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Preview approval must be recorded through the client review response.'
        });
      }
      data.stagingReviewStatus = stagingReviewStatus;
      if (stagingReviewStatus === 'approved' || stagingReviewStatus === 'changes_requested') {
        data.stagingReviewedAt = new Date();
      }
      if (stagingReviewStatus === 'approved') {
        data.launchApprovedAt = new Date();
      } else if (stagingReviewStatus === 'sent' || stagingReviewStatus === 'changes_requested' || stagingReviewStatus === 'not_sent') {
        data.launchApprovedAt = null;
      }
    }
    if (launchUrl !== undefined) data.launchUrl = launchUrl || null;
    if (launchNotes !== undefined) data.launchNotes = launchNotes;
    if (handoffNotes !== undefined) data.handoffNotes = handoffNotes;
    if (completionNotes !== undefined) data.completionNotes = completionNotes;
    if (finalPaymentConfirmedAt !== undefined) {
      return res.status(400).json({
        success: false,
        message: 'Final payment confirmation is handled by verified checkout'
      });
    }
    if (adminNotes !== undefined) data.adminNotes = adminNotes;
    if (clientNotes !== undefined) data.clientNotes = clientNotes;
    if (packageIntent !== undefined) data.packageIntent = packageIntent;
    if (timeline !== undefined) data.timeline = timeline;
    if (budget !== undefined) data.budget = budget;

    let request;
    if (status === 'completed' && completionGate) {
      const completionTransition = await prisma.projectRequest.updateMany({
        where: {
          id,
          status: 'handoff',
          completionAcknowledgedAt: { not: null },
          handoffIssuesReportedAt: null,
          ...(completionGate.finalBalance > 0 ? { finalPaymentConfirmedAt: { not: null } } : {})
        },
        data
      });
      if (completionTransition.count !== 1) {
        return res.status(409).json({ success: false, message: 'The handoff changed or has an unresolved issue. Refresh the project before completing it.' });
      }
      request = await prisma.projectRequest.findUnique({ where: { id }, include: projectRequestInclude });
    } else {
      request = await prisma.projectRequest.update({ where: { id }, data, include: projectRequestInclude });
    }

    if (status === 'quote_ready' && clientNotes !== undefined && Number(request.quotedAmount) > 0) {
      const latestQuote = await prisma.projectQuoteVersion.findFirst({
        where: { projectRequestId: id },
        orderBy: { version: 'desc' },
        select: { version: true }
      });
      await prisma.projectQuoteVersion.updateMany({
        where: { projectRequestId: id, status: 'sent' },
        data: { status: 'superseded' }
      });
      const quote = await prisma.projectQuoteVersion.create({
        data: {
          projectRequestId: id,
          version: (latestQuote?.version || 0) + 1,
          status: 'sent',
          createdBy: req.user?.userId || null,
          snapshot: {
            projectTitle: request.title,
            scope: request.clientNotes || request.summary || '',
            amount: request.quotedAmount,
            currency: request.quoteCurrency,
            timeline: request.timeline || null,
            totalAgreedAmount: request.totalAgreedAmount || request.quotedAmount,
            depositAmount: request.depositAmount || null,
            paymentSchedule: request.paymentAgreementType || null,
            milestoneAmounts: quoteMilestones.map(item => ({ name: item.name.trim(), amount: Number(item.amount) })),
            nonRecoverableCosts: nonRecoverableCosts.map(item => ({ name: item.name.trim(), amount: Number(item.amount), reason: item.reason.trim() })),
            cancellationTerms: 'On confirmed cancellation, completed milestones and listed pre-approved non-recoverable costs already incurred are charged. Any prepaid amount above that is refunded.'
          }
        }
      });
      const event = await prisma.projectConversationMessage.create({
        data: {
          projectRequestId: id,
          senderId: req.user?.userId || null,
          senderRole: 'system',
          kind: 'event',
          message: `Quote version ${quote.version} sent for review.`,
          eventData: { type: 'quote_sent', quoteVersionId: quote.id, version: quote.version, amount: request.quotedAmount, currency: request.quoteCurrency }
        }
      });
      notifyUser(request.userId, 'project_conversation_message', { requestId: id, message: event });
      notifyAdmins('project_conversation_message', { requestId: id, message: event });
      request = await prisma.projectRequest.findUnique({ where: { id }, include: projectRequestInclude });
    }

    if (status === 'in_development') {
      // A first start after the deposit creates the initial milestone plan.
      // Returning from preview review or a pause must preserve work already
      // recorded against those milestones.
      if (['approved', 'payment_agreement'].includes(previousRequestStatus)) {
        await resetBuildStartMilestones(id);
      } else {
        await ensureDefaultBuildMilestones(id);
      }
      request = await prisma.projectRequest.findUnique({
        where: { id },
        include: projectRequestInclude
      });
    }

    if (status === 'staging_review') {
      const stagingMilestone = request?.buildMilestones?.find((milestone) => milestone.title === 'Staging review');
      const launchMilestone = request?.buildMilestones?.find((milestone) => milestone.title === 'Launch');
      if (stagingMilestone) {
        await prisma.buildMilestone.update({
          where: { id: stagingMilestone.id },
          data: {
            status: 'in_progress',
            progress: data.stagingReviewStatus === 'sent' ? 80 : Math.max(stagingMilestone.progress || 0, 50)
          }
        });
      }
      if (launchMilestone && data.stagingReviewStatus === 'sent') {
        await prisma.buildMilestone.update({
          where: { id: launchMilestone.id },
          data: {
            status: 'pending',
            progress: 0
          }
        });
      }
      if (!data.stagingReviewStatus) {
        await prisma.projectRequest.update({
          where: { id },
          data: { stagingReviewStatus: 'sent' }
        });
      }
      request = await prisma.projectRequest.findUnique({
        where: { id },
        include: projectRequestInclude
      });
    }

    if (status === 'launched') {
      const launchMilestone = request?.buildMilestones?.find((milestone) => milestone.title === 'Launch');
      if (launchMilestone) {
        await prisma.buildMilestone.update({
          where: { id: launchMilestone.id },
          data: {
            status: 'in_progress',
            progress: launchMilestone.status === 'completed' ? 60 : Math.max(launchMilestone.progress || 0, 60)
          }
        });
      }
      request = await prisma.projectRequest.findUnique({
        where: { id },
        include: projectRequestInclude
      });
    }

    if (status === 'handoff') {
      const launchMilestone = request?.buildMilestones?.find((milestone) => milestone.title === 'Launch');
      const handoffMilestone = request?.buildMilestones?.find((milestone) => milestone.title === 'Handoff');
      const milestoneUpdates = [];
      if (launchMilestone) {
        milestoneUpdates.push(prisma.buildMilestone.update({
          where: { id: launchMilestone.id },
          data: { status: 'completed', progress: 100 }
        }));
      }
      if (handoffMilestone) {
        milestoneUpdates.push(prisma.buildMilestone.update({
          where: { id: handoffMilestone.id },
          data: {
            status: 'in_progress',
            progress: 70
          }
        }));
      }
      if (milestoneUpdates.length) await Promise.all(milestoneUpdates);
      request = await prisma.projectRequest.findUnique({
        where: { id },
        include: projectRequestInclude
      });
    }

    if (status === 'completed') {
      const currentRequest = await prisma.projectRequest.findUnique({
        where: { id },
        select: {
          status: true,
          completionAcknowledgedAt: true,
            handoffIssuesReportedAt: true,
          finalPaymentConfirmedAt: true,
          totalAgreedAmount: true,
          quotedAmount: true,
          depositAmount: true
        }
      });
      const finalBalance = Math.max((currentRequest?.totalAgreedAmount || currentRequest?.quotedAmount || 0) - (currentRequest?.depositAmount || 0), 0);
      if (previousRequestStatus !== 'handoff' || !currentRequest?.completionAcknowledgedAt || currentRequest.handoffIssuesReportedAt || (finalBalance > 0 && !currentRequest.finalPaymentConfirmedAt)) {
        return res.status(400).json({
          success: false,
          message: 'Completion requires an active handoff, client acceptance, and verified final payment when a balance is due.'
        });
      }
      await prisma.buildMilestone.updateMany({
        where: { projectRequestId: id },
        data: { status: 'completed', progress: 100 }
      });
      await prisma.projectRequest.update({
        where: { id },
        data: { completedAt: new Date() }
      });
      await ensureCompletedBuildSite(id);
      request = await prisma.projectRequest.findUnique({
        where: { id },
        include: projectRequestInclude
      });
    }

    const statusEvents = {
      in_development: ['production_started', 'Production started.'],
      staging_review: ['preview_shared', 'A preview is ready for client review.'],
      launched: ['site_launched', 'The site is live.'],
      handoff: ['handoff_prepared', 'The admin prepared the site handoff.'],
      completed: ['build_completed', 'Build completed after handoff and payment were confirmed.']
    };
    if (statusEvents[status]) {
      const [eventType, message] = statusEvents[status];
      const priorPreviewEvents = status === 'staging_review'
        ? await prisma.projectConversationMessage.findMany({ where: { projectRequestId: id }, select: { eventData: true } })
        : [];
      const previewVersion = status === 'staging_review'
        ? priorPreviewEvents.filter(item => item.eventData?.type === 'preview_shared').length + 1
        : undefined;
      await recordProjectEvent(id, eventType, message, {
        status,
        milestoneProgress: request.buildMilestones?.map(item => ({ name: item.title, status: item.status, progress: item.progress })) || [],
        ...(status === 'staging_review' ? { previewUrl: request.stagingUrl, version: previewVersion } : {}),
        ...(status === 'launched' ? { liveUrl: request.launchUrl } : {})
      });
    } else if (status === 'payment_agreement' && paymentAgreementStatus === 'sent') {
      await recordProjectEvent(id, 'payment_request_sent', 'The admin sent a deposit payment request.', {
        amount: request.depositAmount || request.totalAgreedAmount || request.quotedAmount,
        currency: request.quoteCurrency,
        dueDate: request.paymentDueDate
      });
    }

    notifyUser(request.userId, 'project_request_updated', { request });
    notifyAdmins('project_request_updated', { request });

    res.json({
      success: true,
      data: request,
      message: 'Build request updated'
    });
  } catch (error) {
    logger.error('UPDATE_PROJECT_REQUEST_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update build request'
    });
  }
};

exports.createDefaultBuildMilestones = async (req, res) => {
  try {
    const { id } = req.params;
    const projectRequest = await prisma.projectRequest.findUnique({
      where: { id },
      select: { id: true, serviceType: true }
    });

    if (!projectRequest || projectRequest.serviceType !== 'build') {
      return res.status(404).json({
        success: false,
        message: 'Build request not found'
      });
    }

    await ensureDefaultBuildMilestones(id);

    const request = await prisma.projectRequest.findUnique({
      where: { id },
      include: projectRequestInclude
    });

    if (request?.userId) {
      notifyUser(request.userId, 'project_request_updated', { request });
    }
    notifyAdmins('project_request_updated', { request });

    res.json({
      success: true,
      data: request,
      message: 'Build milestones are ready'
    });
  } catch (error) {
    logger.error('CREATE_BUILD_MILESTONES_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to prepare build milestones'
    });
  }
};

exports.updateBuildMilestone = async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const {
      title,
      description,
      status,
      progress,
      order,
      dueDate,
      clientNote
    } = req.body;

    const existing = await prisma.buildMilestone.findFirst({
      where: {
        id: milestoneId,
        projectRequestId: id
      }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Build milestone not found'
      });
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) {
      if (!buildMilestoneStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid build milestone status'
        });
      }
      data.status = status;
    }
    if (progress !== undefined) {
      const numericProgress = Number(progress);
      data.progress = Number.isFinite(numericProgress) ? Math.max(0, Math.min(100, numericProgress)) : existing.progress;
    }
    if (order !== undefined) data.order = Number(order) || existing.order;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (clientNote !== undefined) data.clientNote = clientNote;

    await prisma.buildMilestone.update({
      where: { id: milestoneId },
      data
    });

    if (status !== undefined && status !== existing.status) {
      await recordProjectEvent(id, 'milestone_updated', `${title || existing.title}: ${status.replace(/_/g, ' ')}.`, {
        milestoneId,
        milestone: title || existing.title,
        status,
        progress: data.progress ?? existing.progress
      });
    }

    const request = await prisma.projectRequest.findUnique({
      where: { id },
      include: projectRequestInclude
    });

    if (request?.userId) {
      notifyUser(request.userId, 'project_request_updated', { request });
    }
    notifyAdmins('project_request_updated', { request });

    res.json({
      success: true,
      data: request,
      message: 'Build milestone updated'
    });
  } catch (error) {
    logger.error('UPDATE_BUILD_MILESTONE_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update build milestone'
    });
  }
};

const studioTaskStatuses = ['open', 'active', 'blocked', 'done'];
const studioBlockerStatuses = ['open', 'resolved'];
const studioAreas = ['design', 'build', 'content', 'qa', 'preview', 'general'];
const studioLinkTypes = ['preview', 'design', 'file', 'access', 'repo', 'link', 'note'];
const studioUpdateVisibility = ['client', 'internal'];
const productionModes = ['inside_app', 'outside_tools', 'hybrid'];

const findProjectRequestOr404 = async (projectRequestId, res) => {
  const request = await prisma.projectRequest.findUnique({
    where: { id: projectRequestId },
    select: { id: true }
  });
  if (!request) {
    res.status(404).json({
      success: false,
      message: 'Build request not found'
    });
    return null;
  }
  return request;
};

const sendUpdatedProjectRequest = async (res, projectRequestId, message) => {
  const request = await prisma.projectRequest.findUnique({
    where: { id: projectRequestId },
    include: projectRequestInclude
  });

  if (request?.userId) {
    notifyUser(request.userId, 'project_request_updated', { request });
  }
  notifyAdmins('project_request_updated', { request });

  return res.json({
    success: true,
    data: request,
    message
  });
};

exports.createStudioTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, area = 'build', status = 'open', owner, dueDate, note, order } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }
    if (!studioAreas.includes(area)) {
      return res.status(400).json({ success: false, message: 'Invalid Studio area' });
    }
    if (!studioTaskStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid task status' });
    }
    if (!(await findProjectRequestOr404(id, res))) return;

    await prisma.studioTask.create({
      data: {
        projectRequestId: id,
        title: title.trim(),
        area,
        status,
        owner: owner || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        note: note || null,
        order: Number.isFinite(Number(order)) ? Number(order) : 0
      }
    });

    return sendUpdatedProjectRequest(res, id, 'Studio task created');
  } catch (error) {
    logger.error('CREATE_STUDIO_TASK_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to create Studio task' });
  }
};

exports.updateStudioTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { title, area, status, owner, dueDate, note, order } = req.body;

    const existing = await prisma.studioTask.findFirst({ where: { id: taskId, projectRequestId: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Studio task not found' });

    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (area !== undefined) {
      if (!studioAreas.includes(area)) return res.status(400).json({ success: false, message: 'Invalid Studio area' });
      data.area = area;
    }
    if (status !== undefined) {
      if (!studioTaskStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid task status' });
      data.status = status;
    }
    if (owner !== undefined) data.owner = owner || null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (note !== undefined) data.note = note || null;
    if (order !== undefined) data.order = Number.isFinite(Number(order)) ? Number(order) : existing.order;

    await prisma.studioTask.update({ where: { id: taskId }, data });

    return sendUpdatedProjectRequest(res, id, 'Studio task updated');
  } catch (error) {
    logger.error('UPDATE_STUDIO_TASK_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to update Studio task' });
  }
};

exports.deleteStudioTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const existing = await prisma.studioTask.findFirst({ where: { id: taskId, projectRequestId: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Studio task not found' });

    await prisma.studioTask.delete({ where: { id: taskId } });
    return sendUpdatedProjectRequest(res, id, 'Studio task deleted');
  } catch (error) {
    logger.error('DELETE_STUDIO_TASK_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to delete Studio task' });
  }
};

exports.createStudioLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, url, type = 'link', note } = req.body;
    if (!label?.trim()) return res.status(400).json({ success: false, message: 'Link label is required' });
    if (!studioLinkTypes.includes(type)) return res.status(400).json({ success: false, message: 'Invalid link type' });
    if (!(await findProjectRequestOr404(id, res))) return;

    await prisma.studioLink.create({
      data: { projectRequestId: id, label: label.trim(), url: url || null, type, note: note || null }
    });

    if (type === 'preview' && url) {
      await updateProjectPreviewUrl(id, url);
    }

    return sendUpdatedProjectRequest(res, id, 'Studio link added');
  } catch (error) {
    logger.error('CREATE_STUDIO_LINK_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to add Studio link' });
  }
};

exports.updateStudioLink = async (req, res) => {
  try {
    const { id, linkId } = req.params;
    const { label, url, type, note } = req.body;
    const existing = await prisma.studioLink.findFirst({ where: { id: linkId, projectRequestId: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Studio link not found' });

    const data = {};
    if (label !== undefined) data.label = label.trim();
    if (url !== undefined) data.url = url || null;
    if (type !== undefined) {
      if (!studioLinkTypes.includes(type)) return res.status(400).json({ success: false, message: 'Invalid link type' });
      data.type = type;
    }
    if (note !== undefined) data.note = note || null;
    await prisma.studioLink.update({ where: { id: linkId }, data });

    const finalType = data.type || existing.type;
    const finalUrl = data.url !== undefined ? data.url : existing.url;
    if (finalType === 'preview') {
      await updateProjectPreviewUrl(id, finalUrl || null);
    } else if (existing.type === 'preview') {
      await updateProjectPreviewUrl(id, null);
    }

    return sendUpdatedProjectRequest(res, id, 'Studio link updated');
  } catch (error) {
    logger.error('UPDATE_STUDIO_LINK_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to update Studio link' });
  }
};

exports.createStudioBlocker = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, area = 'general', status = 'open', note } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Blocker title is required' });
    if (!studioAreas.includes(area)) return res.status(400).json({ success: false, message: 'Invalid blocker area' });
    if (!studioBlockerStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid blocker status' });
    if (!(await findProjectRequestOr404(id, res))) return;

    await prisma.studioBlocker.create({
      data: {
        projectRequestId: id,
        title: title.trim(),
        area,
        status,
        note: note || null,
        resolvedAt: status === 'resolved' ? new Date() : null
      }
    });

    return sendUpdatedProjectRequest(res, id, 'Studio blocker created');
  } catch (error) {
    logger.error('CREATE_STUDIO_BLOCKER_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to create Studio blocker' });
  }
};

exports.updateStudioBlocker = async (req, res) => {
  try {
    const { id, blockerId } = req.params;
    const { title, area, status, note } = req.body;
    const existing = await prisma.studioBlocker.findFirst({ where: { id: blockerId, projectRequestId: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Studio blocker not found' });

    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (area !== undefined) {
      if (!studioAreas.includes(area)) return res.status(400).json({ success: false, message: 'Invalid blocker area' });
      data.area = area;
    }
    if (status !== undefined) {
      if (!studioBlockerStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid blocker status' });
      data.status = status;
      data.resolvedAt = status === 'resolved' ? new Date() : null;
    }
    if (note !== undefined) data.note = note || null;
    await prisma.studioBlocker.update({ where: { id: blockerId }, data });

    return sendUpdatedProjectRequest(res, id, 'Studio blocker updated');
  } catch (error) {
    logger.error('UPDATE_STUDIO_BLOCKER_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to update Studio blocker' });
  }
};

exports.createStudioUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, visibility = 'client' } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Update message is required' });
    if (!studioUpdateVisibility.includes(visibility)) return res.status(400).json({ success: false, message: 'Invalid update visibility' });
    if (!(await findProjectRequestOr404(id, res))) return;

    await prisma.studioUpdate.create({
      data: {
        projectRequestId: id,
        message: message.trim(),
        visibility,
        createdBy: req.user?.userId || null
      }
    });

    if (visibility === 'client') {
      const existing = await prisma.projectRequest.findUnique({ where: { id }, select: { clientNotes: true } });
      await prisma.projectRequest.update({
        where: { id },
        data: { clientNotes: `${existing?.clientNotes ? `${existing.clientNotes}\n\n` : ''}Studio update: ${message.trim()}` }
      });
      await recordProjectEvent(id, 'progress_update', message.trim(), { visibility: 'client' });
    }

    return sendUpdatedProjectRequest(res, id, 'Studio update published');
  } catch (error) {
    logger.error('CREATE_STUDIO_UPDATE_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to publish Studio update' });
  }
};

// Support ticket management
exports.getAllSupportTickets = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: tickets.map(t => ({
        ...t,
        lastMessage: t.messages[0]?.content
      }))
    });
  } catch (error) {
    logger.error('GET_ALL_SUPPORT_TICKETS_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve support tickets'
    });
  }
};

exports.updateSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status, priority }
    });

    res.json({
      success: true,
      data: ticket,
      message: 'Support ticket updated successfully'
    });
  } catch (error) {
    logger.error('UPDATE_SUPPORT_TICKET_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update support ticket'
    });
  }
};

exports.getSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    logger.error('GET_SUPPORT_TICKET_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve support ticket'
    });
  }
};

exports.addSupportTicketMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const message = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        senderId: req.user.userId, // Admin ID
        content,
        isAdmin: true
      }
    });

    // Notify the user of the new support message (in-app only — email removed as part of notification cleanup)
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        select: { userId: true }
      });
      
      if (ticket) {
        notifyUser(ticket.userId, 'new_support_message', {
          ticketId: id,
          messageId: message.id,
          timestamp: message.createdAt
        });
        // NOTE: support response email removed as part of notification cleanup.
        // If this needs an email again later, wire it via notify() and the registry.
      }
    } catch (err) {
      logger.error('Error notifying user of support message', err);
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    logger.error('ADD_SUPPORT_MESSAGE_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Milestone management
exports.createMilestone = async (req, res) => {
  try {
    const { subscriptionId, title, description, order } = req.body;

    if (!subscriptionId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID and title are required'
      });
    }

    const milestone = await prisma.milestone.create({
      data: {
        subscriptionId,
        title,
        description,
        order: order || 0,
        status: 'pending',
        progress: 0
      }
    });

    res.status(201).json({
      success: true,
      data: milestone
    });
  } catch (error) {
    logger.error('CREATE_MILESTONE_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create milestone'
    });
  }
};

exports.updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, progress, order } = req.body;

    const milestone = await prisma.milestone.update({
      where: { id },
      data: { title, description, status, progress, order }
    });

    res.json({
      success: true,
      data: milestone,
      message: 'Milestone updated successfully'
    });
  } catch (error) {
    logger.error('UPDATE_MILESTONE_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update milestone'
    });
  }
};

exports.deleteMilestone = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.milestone.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Milestone deleted successfully'
    });
  } catch (error) {
    logger.error('DELETE_MILESTONE_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete milestone'
    });
  }
};

exports.getSubscriptionMilestones = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const milestones = await prisma.milestone.findMany({
      where: { subscriptionId },
      orderBy: { order: 'asc' }
    });
    res.json({
      success: true,
      data: milestones
    });
  } catch (error) {
    logger.error('GET_ADMIN_MILESTONES_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve milestones'
    });
  }
};

// Assessment overview
exports.getAssessments = async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      include: {
        lead: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: assessments.map(a => ({
        ...a,
        name: a.lead?.name || 'Anonymous',
        email: a.lead?.email
      }))
    });
  } catch (error) {
    logger.error('GET_ASSESSMENTS_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assessments'
    });
  }
};

// Get all subscriptions (for milestone management)
exports.getSubscriptions = async (req, res) => {
  try {
    // Mitigate schema mismatch by explicitly selecting known columns
    const subscriptions = await prisma.subscription.findMany({
      select: {
        id: true,
        userId: true,
        siteName: true,
        customName: true,
        price: true,
        planType: true,
        domain: true,
        status: true,
        tier: true,
        reviewRequested: true,
        reviewNotes: true,
        revisionCount: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: subscriptions.map(s => ({
        ...s,
        client: s.user,
        paymentStatus: s.status === 'active' ? 'PAID' : 'PENDING'
      }))
    });
  } catch (error) {
    logger.error('GET_ADMIN_SUBSCRIPTIONS_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscriptions'
    });
  }
};

// Trigger AI Template Generation
exports.triggerAIGeneration = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch subscription with assessment context
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      select: {
        id: true,
        user: { select: { email: true } }
      }
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // Find the latest assessment for this user/email to get requirements
    const assessment = await prisma.assessment.findFirst({
      where: {
        lead: {
          email: subscription.user.email
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!assessment) {
      return res.status(400).json({ success: false, message: 'No assessment data found to guide AI generation' });
    }

    const { generateTemplateAI } = require('./assessment');
    
    // Start generation in background or await? 
    // Usually generation takes 10-30s, so we await for now to confirm success
    await generateTemplateAI(subscription.id, assessment.responses, assessment.results || {});

    res.json({
      success: true,
      message: 'AI Generation completed successfully'
    });
  } catch (error) {
    logger.error('AI_GENERATION_TRIGGER_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI generation: ' + error.message
    });
  }
};

// Get Template for refinement
exports.getTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await prisma.template.findUnique({
      where: { subscriptionId: id }
    });

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('GET_TEMPLATE_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve template' });
  }
};

// Update Template (Human Refinement)
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { html, css, js } = req.body;

    const template = await prisma.template.update({
      where: { subscriptionId: id },
      data: { html, css, js }
    });

    res.json({
      success: true,
      data: template,
      message: 'Template refined successfully'
    });
  } catch (error) {
    logger.error('UPDATE_TEMPLATE_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to refine template' });
  }
};

// Update Subscription Review Notes
exports.updateSubscriptionReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNotes, incrementRevision, reviewRequested, status } = req.body;

    const data = {};
    
    if (reviewNotes !== undefined) data.reviewNotes = reviewNotes;
    if (reviewRequested !== undefined) data.reviewRequested = reviewRequested;
    if (status !== undefined) data.status = status;
    
    if (incrementRevision) {
      data.revisionCount = {
        increment: 1
      };
    }

    const subscription = await prisma.subscription.update({
      where: { id },
      data,
      select: {
        id: true,
        user: { select: { name: true, email: true } }
      }
    });

    // NOTE: review-notes-updated and review-completed emails removed as part
    // of notification cleanup. If these need to send again later, wire them
    // via notify() and the registry.

    return res.json({
      success: true,
      data: subscription,
      message: 'Review record updated successfully'
    });
  } catch (error) {
    logger.error('UPDATE_SUBSCRIPTION_REVIEW_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to update review record' });
  }
};

// Deploy Template (Go Live)
exports.deployTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { deployTemplate } = require('../services/deploymentService');

    // Run actual deployment logic
    const deployment = await deployTemplate(id);

    if (!deployment.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Deployment failed: ' + deployment.message 
      });
    }

    // NOTE: site-deployed-live notification email removed as part of
    // notification cleanup. If this needs an email again later, wire it
    // via notify() and the registry.

    res.json({
      success: true,
      data: deployment,
      message: 'Site deployed and published successfully'
    });
  } catch (error) {
    logger.error('DEPLOY_TEMPLATE_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to deploy template' });
  }
};

/**
 * Comment Moderation
 */
exports.getComments = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const comments = await prisma.comment.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        blogPost: { select: { title: true, slug: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: comments });
  } catch (error) {
    logger.error('GET_COMMENTS_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve comments' });
  }
};

exports.updateCommentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const comment = await prisma.comment.update({
      where: { id },
      data: { status }
    });

    res.json({ success: true, data: comment, message: `Comment ${status}` });
  } catch (error) {
    logger.error('UPDATE_COMMENT_STATUS_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to update comment status' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.comment.delete({ where: { id } });
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    logger.error('DELETE_COMMENT_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};

/**
 * System Health & Monitoring
 */
exports.getSystemHealth = async (req, res) => {
  try {
    const health = {
      timestamp: new Date(),
      services: {
        database: { status: 'unknown' },
        openai: { status: 'unknown' },
        groq: { status: 'unknown' },
        paystack: { status: 'unknown' },
        email: { status: 'active' }
      },
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version
      }
    };

    // Check Database
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database.status = 'healthy';
    } catch (e) {
      health.services.database.status = 'unhealthy';
      health.services.database.error = e.message;
    }

    // Check OpenAI API (Basic check)
    if (process.env.OPENAI_API_KEY) {
      health.services.openai.status = 'configured';
    } else {
      health.services.openai.status = 'missing_key';
    }

    // Check Groq API
    if (process.env.GROQ_API_KEY) {
      health.services.groq.status = 'configured';
    } else {
      health.services.groq.status = 'missing_key';
    }

    // Check Paystack
    if (process.env.PAYSTACK_SECRET_KEY) {
      health.services.paystack.status = 'configured';
    } else {
      health.services.paystack.status = 'missing_key';
    }

    // Check Email SMTP
    const isEmailHealthy = await verifyConnection();
    health.services.email.status = isEmailHealthy ? 'healthy' : 'unhealthy';

    res.json({ success: true, data: health });
  } catch (error) {
    logger.error('GET_SYSTEM_HEALTH_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve system health' });
  }
};

/**
 * Booking Management
 */
exports.getAdminBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        service: true,
        user: { select: { name: true, email: true } }
      },
      orderBy: { startTime: 'desc' }
    });
    res.json({ success: true, data: bookings });
  } catch (error) {
    logger.error('GET_ADMIN_BOOKINGS_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: { user: { select: { name: true, email: true } } }
    });

    // NOTE: booking-status-updated notification email removed as part of
    // notification cleanup. If this needs an email again later, wire it
    // via notify() and the registry.

    res.json({ success: true, data: booking, message: 'Booking status updated' });
  } catch (error) {
    logger.error('UPDATE_BOOKING_STATUS_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.booking.delete({ where: { id } });
    res.json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    logger.error('DELETE_BOOKING_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to delete booking' });
  }
};

exports.deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if exists
    const sub = await prisma.subscription.findUnique({
      where: { id }
    });

    if (!sub) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // Attempt to delete. Dependencies might block this in Prisma/Postgres
    await prisma.subscription.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Subscription node deleted successfully' });
  } catch (error) {
    logger.error('DELETE_SUBSCRIPTION_ERROR:', error);
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete subscription while related records (like templates or domains) exist. This safety check prevents orphaned infrastructure.'
      });
    }
    res.status(500).json({ success: false, message: 'Failed to delete subscription' });
  }
};

exports.deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.assessment.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Assessment record deleted successfully' });
  } catch (error) {
    logger.error('DELETE_ASSESSMENT_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to delete assessment' });
  }
};

// Pulls the real card/channel detail Paystack actually returned out of the raw
// gatewayResponse blob, since the paymentMethod column itself never gets updated
// past its generic "card" default - the real detail only lives in the JSON dump.
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

exports.getAllTransactions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 25, 1), 100);
    const { status, serviceType, search, startDate, endDate } = req.query;

    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (serviceType && serviceType !== 'ALL') where.serviceType = serviceType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.payment.count({ where })
    ]);

    const data = transactions.map((payment) => ({
      id: payment.id,
      reference: payment.reference,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      serviceType: payment.serviceType,
      description: payment.description,
      gateway: payment.gateway,
      createdAt: payment.createdAt,
      payer: payment.user ? { id: payment.user.id, name: payment.user.name, email: payment.user.email } : null,
      ...extractChannelInfo(payment)
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('GET_ALL_TRANSACTIONS_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to load transactions' });
  }
};
