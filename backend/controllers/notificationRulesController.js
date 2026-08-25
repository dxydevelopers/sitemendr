const { prisma } = require('../config/db');
const logger = require('../config/logger');

const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// GET /api/admin/notification-rules
exports.getNotificationRules = async (req, res) => {
  try {
    const rules = await prisma.notificationRule.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    logger.error('GET_NOTIFICATION_RULES_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification rules'
    });
  }
};

// GET /api/admin/notification-rules/categories
exports.getCategories = async (req, res) => {
  try {
    const rules = await prisma.notificationRule.findMany({
      select: { category: true },
      distinct: ['category']
    });

    res.json({
      success: true,
      data: rules.map(r => r.category).sort()
    });
  } catch (error) {
    logger.error('GET_NOTIFICATION_CATEGORIES_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories'
    });
  }
};

// GET /api/admin/notification-rules/:id
exports.getNotificationRule = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await prisma.notificationRule.findUnique({ where: { id } });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Notification rule not found'
      });
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    logger.error('GET_NOTIFICATION_RULE_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification rule'
    });
  }
};

// POST /api/admin/notification-rules
const validStatuses = ['active', 'paused', 'removed'];
const validRecipientTypes = ['user', 'admin', 'all_admins', 'specific_email'];

exports.createNotificationRule = async (req, res) => {
  try {
    const {
      slug,
      name,
      category,
      trigger,
      recipientType = 'user',
      recipientOverride,
      subject,
      htmlTemplate,
      senderName,
      senderEmail,
      replyTo,
      availableVariables = [],
      channels = ['email']
    } = req.body;

    if (!name || !category || !trigger || !subject || !htmlTemplate) {
      return res.status(400).json({
        success: false,
        message: 'name, category, trigger, subject, and htmlTemplate are required'
      });
    }

    if (!validRecipientTypes.includes(recipientType)) {
      return res.status(400).json({ success: false, message: 'Invalid recipient type' });
    }

    const finalSlug = slug ? slugify(slug) : slugify(name);

    const existing = await prisma.notificationRule.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A notification with slug "${finalSlug}" already exists`
      });
    }

    const rule = await prisma.notificationRule.create({
      data: {
        slug: finalSlug,
        name,
        category,
        trigger,
        recipientType,
        recipientOverride: recipientOverride || null,
        subject,
        htmlTemplate,
        senderName: senderName || null,
        senderEmail: senderEmail || null,
        replyTo: replyTo || null,
        availableVariables,
        channels,
        // Created fresh in the UI — no backend trigger wired yet, so default to paused
        // until an admin confirms the notify() call site actually exists and flips it active.
        status: 'paused',
        sourceFile: null
      }
    });

    logger.info('NOTIFICATION_RULE_CREATED', { id: rule.id, slug: rule.slug });

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Notification rule created. It is paused by default — wire it to a notify() call in the backend, then activate it.'
    });
  } catch (error) {
    logger.error('CREATE_NOTIFICATION_RULE_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification rule'
    });
  }
};

// PATCH /api/admin/notification-rules/:id
exports.updateNotificationRule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      subject,
      htmlTemplate,
      senderName,
      senderEmail,
      replyTo,
      recipientType,
      recipientOverride,
      name,
      trigger,
      category
    } = req.body;

    const data = {};

    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      data.status = status;
    }
    if (recipientType !== undefined) {
      if (!validRecipientTypes.includes(recipientType)) {
        return res.status(400).json({ success: false, message: 'Invalid recipient type' });
      }
      data.recipientType = recipientType;
    }
    if (subject !== undefined) data.subject = subject;
    if (htmlTemplate !== undefined) data.htmlTemplate = htmlTemplate;
    if (senderName !== undefined) data.senderName = senderName || null;
    if (senderEmail !== undefined) data.senderEmail = senderEmail || null;
    if (replyTo !== undefined) data.replyTo = replyTo || null;
    if (recipientOverride !== undefined) data.recipientOverride = recipientOverride || null;
    if (name !== undefined) data.name = name;
    if (trigger !== undefined) data.trigger = trigger;
    if (category !== undefined) data.category = category;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const rule = await prisma.notificationRule.update({
      where: { id },
      data
    });

    logger.info('NOTIFICATION_RULE_UPDATED', { id, slug: rule.slug, changes: Object.keys(data) });

    res.json({
      success: true,
      data: rule,
      message: 'Notification rule updated'
    });
  } catch (error) {
    logger.error('UPDATE_NOTIFICATION_RULE_ERROR:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Notification rule not found' });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update notification rule'
    });
  }
};

// DELETE /api/admin/notification-rules/:id
exports.deleteNotificationRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirm } = req.query;

    const rule = await prisma.notificationRule.findUnique({ where: { id } });

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Notification rule not found' });
    }

    if (rule.sourceFile && confirm !== 'true') {
      return res.status(409).json({
        success: false,
        requiresConfirmation: true,
        message: `This notification is wired to a live code path (${rule.sourceFile}). Deleting it will cause that trigger to silently fail to send. Confirm to proceed anyway.`
      });
    }

    await prisma.notificationRule.delete({ where: { id } });

    logger.info('NOTIFICATION_RULE_DELETED', { id, slug: rule.slug, sourceFile: rule.sourceFile });

    res.json({
      success: true,
      message: 'Notification rule deleted'
    });
  } catch (error) {
    logger.error('DELETE_NOTIFICATION_RULE_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification rule'
    });
  }
};

// GET /api/admin/notification-rules/email-config
exports.getEmailConfig = async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'email_config' } });

    res.json({
      success: true,
      data: setting?.value || { transport: 'smtp' }
    });
  } catch (error) {
    logger.error('GET_EMAIL_CONFIG_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve email configuration'
    });
  }
};

// PATCH /api/admin/notification-rules/email-config
const validTransports = ['smtp', 'resend', 'log'];

exports.updateEmailConfig = async (req, res) => {
  try {
    const { transport } = req.body;

    if (!transport || !validTransports.includes(transport)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transport. Must be one of: ${validTransports.join(', ')}`
      });
    }

    const setting = await prisma.setting.upsert({
      where: { key: 'email_config' },
      update: { value: { transport } },
      create: { key: 'email_config', value: { transport } }
    });

    logger.info('EMAIL_CONFIG_UPDATED', { transport });

    res.json({
      success: true,
      data: setting.value,
      message: 'Email configuration updated'
    });
  } catch (error) {
    logger.error('UPDATE_EMAIL_CONFIG_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email configuration'
    });
  }
};