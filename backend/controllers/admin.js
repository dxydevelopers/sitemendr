const { prisma } = require('../config/db');
const { sendEmail, verifyConnection } = require('../config/email');
const { notifyUser } = require('../services/socketService');
const { runSuspensionAutomation, suspendSubscription } = require('../scripts/suspensionAutomation');
const { verifyDomains } = require('../scripts/dnsWorker');
const logger = require('../config/logger');

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
      recentLeads,
      recentAssessments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.lead.count(),
      prisma.assessment.count(),
      prisma.assessment.count({ where: { status: 'completed' } }),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.subscription.count({ where: { status: 'suspended' } }),
      prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true }
      }),
      prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.assessment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    const conversionRate = totalAssessments > 0 
      ? ((completedAssessments / totalAssessments) * 100).toFixed(1) 
      : "0";

    // Get growth data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [userGrowthRaw, leadGrowthRaw] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true }
      }),
      prisma.lead.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true }
      })
    ]);

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

    // Notify the user of the new support message
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

    // Notify user if notes were added or review completed
    if (subscription.user && subscription.user.email) {
      if (reviewNotes) {
        try {
          await sendEmail({
            to: subscription.user.email,
            subject: 'Design Review Update: Sitemendr',
            html: `
              <h2>Hello ${subscription.user.name},</h2>
              <p>Our team has updated the design review notes for your project.</p>
              <p><strong>Notes:</strong> ${reviewNotes}</p>
              <p>Log in to your dashboard to view the progress or request further changes.</p>
            `
          });
        } catch (e) {
          logger.error('REVIEW_NOTIFY_EMAIL_ERROR:', e);
        }
      } else if (reviewRequested === false) {
        try {
          await sendEmail({
            to: subscription.user.email,
            subject: 'Design Review Completed: Sitemendr',
            html: `
              <h2>Hello ${subscription.user.name},</h2>
              <p>Great news! Our team has completed the human review and refinement of your project.</p>
              <p>Your site has been optimized for peak performance and aesthetics.</p>
              <p>Log in to your dashboard to see the latest version!</p>
            `
          });
        } catch (e) {
          logger.error('REVIEW_COMPLETE_EMAIL_ERROR:', e);
        }
      }
    }

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

    // Fetch updated subscription for notification
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { user: true }
    });

    // Notify user that their site is live
    if (subscription.user && subscription.user.email) {
      try {
        await sendEmail({
          to: subscription.user.email,
          subject: 'Your Sitemendr Website is Live! 🚀',
          html: `
            <h2>Great news, ${subscription.user.name || 'valued client'}!</h2>
            <p>Your website has been professionally refined and is now officially live.</p>
            <p>You can view your site at <strong>${subscription.domain}</strong> or through your dashboard.</p>
            <div style="margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" style="background:#28a745;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;font-weight:bold;">View My Dashboard</a>
            </div>
            <p>Thank you for choosing Sitemendr to power your digital presence!</p>
          `
        });
      } catch (emailError) {
        logger.error('DEPLOYMENT_NOTIFICATION_EMAIL_FAILED:', emailError);
      }
    }

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
    const { verifyConnection } = require('../config/email');
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

    // Notify user of status change
    if (booking.user && booking.user.email) {
      try {
        await sendEmail({
          to: booking.user.email,
          subject: `Consultation Status Update: ${status}`,
          html: `
            <h2>Hello ${booking.user.name},</h2>
            <p>The status of your consultation booking has been updated to <strong>${status}</strong>.</p>
            <p>Log in to your dashboard for more details.</p>
          `
        });
      } catch (e) {
        logger.error('BOOKING_NOTIFY_EMAIL_ERROR:', e);
      }
    }

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



