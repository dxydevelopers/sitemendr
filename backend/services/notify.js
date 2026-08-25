const { prisma } = require('../config/db');
const { sendEmail } = require('../config/email');
const { wrapEmailShell } = require('./emailShell');
const logger = require('../config/logger');

/**
 * Fills {{placeholders}} in a template string with values from data.
 * Any placeholder with no matching key is replaced with an empty string.
 */
const renderTemplate = (template, data = {}) => {
  return (template || '').replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
  });
};

/**
 * Central notification gate.
 * Every controller should call this instead of sendEmail() directly.
 *
 * Subject and HTML body are NOT passed in anymore — they live on the
 * NotificationRule row (subject, htmlTemplate) and are rendered here.
 * The caller only passes the dynamic data the template needs.
 *
 * @param {string} slug - matches NotificationRule.slug, e.g. 'verify-email'
 * @param {object} data
 * @param {string} data.to - recipient email address (required unless recipientType is admin/specific_email)
 * @param {string} [data.replyToOverride] - per-send Reply-To override (e.g. a lead's own email), takes priority over the rule's stored replyTo
 * @param {...any} data.* - any other values the template's {{placeholders}} need
 */
const notify = async (slug, data = {}) => {
  let rule;
  try {
    rule = await prisma.notificationRule.findUnique({ where: { slug } });
  } catch (error) {
    logger.error('NOTIFY_RULE_LOOKUP_FAILED', { slug, error: error.message });
    // Fail closed on lookup errors — don't send if we can't confirm the rule's status
    return { sent: false, reason: 'rule_lookup_failed' };
  }

  if (!rule) {
    logger.warn('NOTIFY_RULE_NOT_FOUND', { slug });
    return { sent: false, reason: 'rule_not_found' };
  }

  if (rule.status !== 'active') {
    logger.info('NOTIFY_SKIPPED_INACTIVE', { slug, status: rule.status });
    return { sent: false, reason: rule.status };
  }

  if (!rule.channels.includes('email')) {
    logger.info('NOTIFY_SKIPPED_NO_EMAIL_CHANNEL', { slug, channels: rule.channels });
    return { sent: false, reason: 'no_email_channel' };
  }

  const recipient = rule.recipientType === 'specific_email'
    ? rule.recipientOverride
    : rule.recipientType === 'admin' || rule.recipientType === 'all_admins'
      ? (process.env.ADMIN_EMAIL || 'admin@sitemendr.com')
      : data.to;

  if (!recipient) {
    logger.error('NOTIFY_NO_RECIPIENT', { slug, recipientType: rule.recipientType });
    return { sent: false, reason: 'no_recipient' };
  }

  const subject = renderTemplate(rule.subject, data);
  const innerHtml = renderTemplate(rule.htmlTemplate, data);
  const html = wrapEmailShell(innerHtml);

  if (!subject || !innerHtml) {
    logger.warn('NOTIFY_EMPTY_CONTENT', { slug, hasSubject: !!subject, hasHtml: !!innerHtml });
  }

  const replyTo = data.replyToOverride || rule.replyTo || undefined;

  try {
    await sendEmail({
      to: recipient,
      from: rule.senderEmail
        ? `"${rule.senderName || 'Sitemendr'}" <${rule.senderEmail}>`
        : undefined, // falls back to config/email.js default
      replyTo,
      subject,
      html
    });

    logger.info('NOTIFY_SENT', { slug, to: recipient });
    return { sent: true };
  } catch (error) {
    logger.error('NOTIFY_SEND_FAILED', { slug, to: recipient, error: error.message });
    return { sent: false, reason: 'send_failed', error: error.message };
  }
};

module.exports = { notify };