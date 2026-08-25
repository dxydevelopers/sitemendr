const nodemailer = require('nodemailer');
const axios = require('axios');
const { prisma } = require('./db');
const logger = require('./logger');

const allowInsecure = process.env.EMAIL_ALLOW_INSECURE === 'true';
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const resendApiKey = process.env.RESEND_API_KEY;
const emailFromDefault = process.env.EMAIL_FROM || `"Sitemendr" <${emailUser || 'no-reply@sitemendr.local'}>`;

let cachedTransport = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30000; // re-check the Setting row at most every 30s, not on every single email

const getActiveTransport = async () => {
  const now = Date.now();
  if (cachedTransport && (now - cachedAt) < CACHE_TTL_MS) {
    return cachedTransport;
  }

  let transport = (process.env.EMAIL_TRANSPORT || 'smtp').toLowerCase();
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'email_config' } });
    if (setting?.value?.transport) {
      transport = setting.value.transport;
    }
  } catch (error) {
    logger.warn('Could not read email_config Setting, falling back to .env EMAIL_TRANSPORT', { error: error.message });
  }

  cachedTransport = transport;
  cachedAt = now;
  return transport;
};

const smtpTransporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: { user: emailUser, pass: emailPass },
  tls: allowInsecure ? { rejectUnauthorized: false } : undefined,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

const logTransporter = nodemailer.createTransport({ jsonTransport: true });

/**
 * Send an email using whichever transport the Setting row (or .env fallback) currently selects.
 */
const sendEmail = async ({ to, subject, html, from, replyTo }) => {
  const transport = await getActiveTransport();
  const useResend = transport === 'resend';
  const useLogTransport = transport === 'log' || (!useResend && (!emailUser || !emailPass));

  logger.info('Sending email...', { to, subject, transport: useResend ? 'resend' : useLogTransport ? 'log' : 'smtp' });

  try {
    if (useResend) {
      if (!resendApiKey) {
        logger.warn('transport=resend but RESEND_API_KEY missing; falling back to log transport');
        const info = await logTransporter.sendMail({ from: from || emailFromDefault, to, subject, html, replyTo: replyTo || emailFromDefault });
        logger.info('Email payload captured (log transport fallback)', { to, subject });
        return info;
      }

      const payload = {
        from: from || emailFromDefault,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      };
      if (replyTo) payload.reply_to = replyTo;

      const response = await axios.post('https://api.resend.com/emails', payload, {
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      logger.info('Email sent successfully', { errorCode: 'EMAIL_SENT_SUCCESS', messageId: response.data?.id, to, subject });
      return response.data;
    }

    const activeTransporter = useLogTransport ? logTransporter : smtpTransporter;
    const info = await activeTransporter.sendMail({
      from: from || emailFromDefault,
      to,
      subject,
      html,
      replyTo: replyTo || emailFromDefault,
    });

    if (useLogTransport) {
      logger.info('Email payload captured (log transport)', { errorCode: 'EMAIL_LOG_TRANSPORT', to, subject });
    }
    logger.info('Email sent successfully', { errorCode: 'EMAIL_SENT_SUCCESS', messageId: info.messageId, to, subject });
    return info;
  } catch (error) {
    logger.error('Email sending failed', { errorCode: 'EMAIL_SEND_ERROR', error: error.message, stack: error.stack, to, subject });
    throw error;
  }
};

const verifyConnection = async () => {
  const transport = await getActiveTransport();
  const useResend = transport === 'resend';
  const useLogTransport = transport === 'log' || (!useResend && (!emailUser || !emailPass));

  if (useResend) {
    if (!resendApiKey) {
      logger.warn('Resend API key missing - email transport disabled');
      return false;
    }
    logger.info('Resend transport configured');
    return true;
  }
  if (useLogTransport) {
    logger.info('Email verification skipped (log transport)');
    return true;
  }
  logger.info('Verifying email transporter connection...');
  try {
    await smtpTransporter.verify();
    logger.info('Email transporter verified successfully');
    return true;
  } catch (error) {
    logger.error('Email transporter verification failed', { error: error.message, stack: error.stack });
    return false;
  }
};

module.exports = { sendEmail, verifyConnection };