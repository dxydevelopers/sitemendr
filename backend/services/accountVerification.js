const crypto = require('crypto');

const hashToken = (value) => crypto.createHash('sha256').update(value).digest('hex');

const getPhoneChannels = () => ({
  sms: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID),
  whatsapp: Boolean(
    process.env.WHATSAPP_BUSINESS_NUMBER
    && process.env.META_WHATSAPP_PHONE_NUMBER_ID
    && process.env.META_APP_SECRET
    && process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ),
});

const requestPhoneCode = async ({ to, channel, code }) => {
  const channels = getPhoneChannels();
  if (channel === 'whatsapp') {
    if (!channels.whatsapp) throw new Error('WhatsApp verification is not configured.');
    const businessNumber = process.env.WHATSAPP_BUSINESS_NUMBER.replace(/\D/g, '');
    const formattedCode = `${code.slice(0, 3)} XXX ${code.slice(3)}`;
    const message = `Hi Sitemendr, I'm verifying my phone number. Code: ${formattedCode}`;
    const encodedMessage = encodeURIComponent(message);
    return {
      whatsappLink: `https://wa.me/${businessNumber}?text=${encodedMessage}`,
      whatsappWebLink: `https://web.whatsapp.com/send?phone=${businessNumber}&text=${encodedMessage}`,
    };
  }
  if (!channels.sms) throw new Error('SMS verification is not configured.');

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const auth = Buffer.from(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const payload = new URLSearchParams({ To: to, Channel: channel });
  const response = await fetch(`https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/Verifications`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload,
    signal: AbortSignal.timeout(12000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !['pending', 'approved'].includes(body.status)) {
    throw new Error(body.message || `Delivery provider returned ${response.status}.`);
  }
};

const hashPhoneCode = ({ userId, phone, code }) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET must be configured before phone codes can be created.');
  return crypto.createHmac('sha256', secret).update(`${userId}:${phone}:${code}`).digest('hex');
};

const checkPhoneCode = async ({ to, code }) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const auth = Buffer.from(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const payload = new URLSearchParams({ To: to, Code: code });
  const response = await fetch(`https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload,
    signal: AbortSignal.timeout(12000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status >= 500) throw new Error(`Verification provider returned ${response.status}.`);
    return false;
  }
  return body.status === 'approved';
};

module.exports = { getPhoneChannels, hashToken, hashPhoneCode, requestPhoneCode, checkPhoneCode };
