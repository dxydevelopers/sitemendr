const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sendEmail } = require(path.join(__dirname, 'config/email'));
const { wrapEmailShell } = require(path.join(__dirname, 'services/emailShell'));

async function test() {
  try {
    const res = await sendEmail({
      to: 'vnsdrwn@gmail.com',
      subject: 'Sitemendr email layout check',
      html: wrapEmailShell('<h1 style="margin:0 0 16px;color:#101828;font-size:24px;line-height:1.3;">Email layout check</h1><p>If you can read this message, the configured email transport is delivering Sitemendr email.</p>', {
        preheader: 'A preview of the Sitemendr email layout.'
      })
    });
    console.log('SUCCESS:', res.messageId);
  } catch (err) {
    console.error('FAILED:', err.message);
  }
}

test();
