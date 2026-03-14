const { prisma } = require('../config/db');
const dns = require('dns').promises;
const { notifyAdmins } = require('../services/socketService');
const OpenAI = require('openai');
const Groq = require('groq-sdk');
const logger = require('../config/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

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
    if (subscription.performanceData && subscription.performanceData.metrics) {
      return res.json({
        success: true,
        vitals: subscription.performanceData.metrics,
        aiInsights: subscription.performanceData.insights,
        timestamp: subscription.performanceData.timestamp
      });
    }

    // Fallback to realistic values based on the plan type if no scan has been performed
    const isEnterprise = subscription.tier === 'enterprise';
    
    res.json({
      success: true,
      vitals: {
        performance: isEnterprise ? 98 : 92,
        accessibility: isEnterprise ? 100 : 96,
        bestPractices: 96,
        seo: 100,
        coreWebVitals: {
          lcp: isEnterprise ? '1.1s' : '1.8s',
          fid: '12ms',
          cls: '0.01'
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get site vitals', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to retrieve vitals' });
  }
};

// Get client projects (subscriptions)
exports.getProjects = async (req, res) => {
  try {
    const userId = req.user.userId;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      select: {
        id: true,
        siteName: true,
        customName: true,
        planType: true,
        domain: true,
        createdAt: true,
        suspended: true,
        reviewRequested: true,
        reviewNotes: true,
        revisionCount: true,
        milestones: true,
        purchasedAddons: true,
        template: {
          select: {
            isPublished: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map subscriptions to project-like objects for the dashboard
    const projects = subscriptions.map((sub) => {
      const milestones = sub.milestones;

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
        name: sub.siteName || sub.customName || 'Untitled Project',
        progress: progress,
        status: sub.suspended ? 'Suspended' : (progress === 100 ? 'Completed' : 'Operational'),
        planType: sub.planType,
        domain: sub.domain,
        createdAt: sub.createdAt,
        reviewRequested: sub.reviewRequested,
        reviewNotes: sub.reviewNotes,
        revisionCount: sub.revisionCount,
        milestones,
        purchasedAddons: sub.purchasedAddons || []
      };
    });

    res.json({
      success: true,
      projects
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
exports.getBilling = async (req, res) => {
  try {
    const userId = req.user.userId;

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      billing: payments
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
    const serverIP = '102.0.21.24'; // The public IP of our server

    try {
      // Resolve A records for the domain
      const records = await dns.resolve4(domain);
      const isVerified = records.includes(serverIP);

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
          message: `DNS verification failed. Expected A record ${serverIP}, but found ${records.join(', ')}.`,
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
          { userId: userId }
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
