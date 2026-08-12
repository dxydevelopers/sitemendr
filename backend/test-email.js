const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sendEmail } = require(path.join(__dirname, 'config/email'));

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
