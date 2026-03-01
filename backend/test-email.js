require('dotenv').config({path: 'c:/monorepo/sitemendr/backend/.env'});
const { sendEmail } = require('c:/monorepo/sitemendr/backend/config/email');

async function test() {
  try {
    const res = await sendEmail({
      to: 'vnsdrwn@gmail.com',
      subject: 'Test Email From Zencoder',
      html: '<h1>System integrity test</h1><p>If you see this, email sending is working.</p>'
    });
    console.log('SUCCESS:', res.messageId);
  } catch (err) {
    console.error('FAILED:', err.message);
  }
}

test();
