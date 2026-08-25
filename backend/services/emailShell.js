// backend/services/emailShell.js
//
// Shared branded wrapper for all outgoing emails. Every notification's
// unique inner content gets wrapped in this shell at send-time, so the
// header/footer/button styling live in exactly one place — change it
// here once, every email updates.

const wrapEmailShell = (innerHtml, options = {}) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const logoUrl = `${frontendUrl}/Sitemendr_Tech_Logo.png`;
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f5f7; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color:#05070a; padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle; padding-right:10px;">
                    
                  </td><img src="${logoUrl}" alt="Sitemendr" height="28" style="display:block; height:28px; width:auto;">
                  <td style="vertical-align:middle;">
                    <span style="color:#ffffff; font-size:15px; font-weight:800; letter-spacing:2px; text-transform:uppercase;">Sitemendr</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px; color:#1f2937; font-size:15px; line-height:1.6;">
              ${innerHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
              <p style="margin:0; color:#9ca3af; font-size:11px; line-height:1.5;">
                &copy; ${year} Sitemendr Technologies. This is an automated message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

module.exports = { wrapEmailShell };