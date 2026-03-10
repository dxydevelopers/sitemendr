const nodemailer = require('nodemailer');
const axios = require('axios');
const logger = require('./logger');

const allowInsecure = process.env.EMAIL_ALLOW_INSECURE === 'true';
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailTransport = (process.env.EMAIL_TRANSPORT || 'smtp').toLowerCase();
const resendApiKey = process.env.RESEND_API_KEY;
const emailFromDefault = process.env.EMAIL_FROM || `"Sitemendr" <${emailUser || 'no-reply@sitemendr.local'}>`;
const useResend = emailTransport === 'resend';
const useLogTransport = emailTransport === 'log' || (!useResend && (!emailUser || !emailPass));

let transporter;
if (useResend && !resendApiKey) {
  logger.warn('RESEND_API_KEY missing; falling back to log transport');
}

if (useResend && resendApiKey) {
  transporter = null;
} else if (useLogTransport) {
  logger.warn('Email credentials missing or EMAIL_TRANSPORT=log; using log transport');
  transporter = nodemailer.createTransport({ jsonTransport: true });
} else {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // use SSL
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: allowInsecure ? { rejectUnauthorized: false } : undefined,
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

/**
 * Send an email using the configured transporter
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.from] - Sender name and email
 * @param {string} [options.replyTo] - Reply-To address
 */
const sendEmail = async ({ to, subject, html, from, replyTo }) => {
  logger.info('Sending email...', { to, subject });
  try {
    if (useResend && resendApiKey) {
      const payload = {
        from: from || emailFromDefault,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      };
      if (replyTo) {
        payload.reply_to = replyTo;
      }

      const response = await axios.post('https://api.resend.com/emails', payload, {
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      logger.info('Email sent successfully', {
        errorCode: 'EMAIL_SENT_SUCCESS',
        messageId: response.data?.id,
        to,
        subject
      });
      return response.data;
    }

    const info = await transporter.sendMail({
      from: from || emailFromDefault,
      to,
      subject,
      html,
      replyTo: replyTo || emailFromDefault,
    });
    if (useLogTransport) {
      logger.info('Email payload captured (log transport)', {
        errorCode: 'EMAIL_LOG_TRANSPORT',
        to,
        subject
      });
    }
    logger.info('Email sent successfully', {
      errorCode: 'EMAIL_SENT_SUCCESS',
      messageId: info.messageId,
      to,
      subject
    });
    return info;
  } catch (error) {
    logger.error('Email sending failed', {
      errorCode: 'EMAIL_SEND_ERROR',
      error: error.message,
      stack: error.stack,
      to,
      subject
    });
    throw error;
  }
};

const verifyConnection = async () => {
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
    await transporter.verify();
    logger.info('Email transporter verified successfully');
    return true;
  } catch (error) {
    logger.error('Email transporter verification failed', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
};

module.exports = {
  transporter,
  sendEmail,
  verifyConnection,
};
