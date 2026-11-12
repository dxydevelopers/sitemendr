// Shared, email-client-safe branded wrapper for outgoing Sitemendr messages.
// Keep layout styles inline because many email clients strip external CSS.
const wrapEmailShell = (innerHtml, options = {}) => {
  const frontendUrl = (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://sitemendr.com').replace(/\/$/, '');
  const logoUrl = `${frontendUrl}/brand/logo-full-600.png`;
  const year = new Date().getFullYear();
  const safePreheader = String(options.preheader || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const preheader = safePreheader
    ? `<div style="display:none!important;max-height:0;max-width:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${safePreheader}</div>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <style>
    body { margin:0 !important; padding:0 !important; }
    .email-content h1, .email-content h2, .email-content h3 { color:#101828; line-height:1.35; margin:0 0 16px; }
    .email-content p { margin:0 0 16px; }
    .email-content p:last-child { margin-bottom:0; }
    .email-content a { color:#155eef; }
    .email-content ul, .email-content ol { padding-left:22px; }
    @media screen and (max-width:620px) {
      .email-outer { padding:20px 10px !important; }
      .email-header { padding:22px 22px !important; }
      .email-content { padding:30px 22px !important; }
      .email-footer { padding:20px 22px !important; }
      .email-logo { width:190px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f2f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#172033;-webkit-text-size-adjust:100%;">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background:#f2f5f9;">
    <tr>
      <td class="email-outer" align="center" style="padding:36px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="height:4px;background:#1769ff;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="email-header" style="padding:26px 34px;background:#07111f;">
              <img class="email-logo" src="${logoUrl}" alt="Sitemendr" width="220" style="display:block;width:220px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;">
            </td>
          </tr>
          <tr>
            <td class="email-content" style="padding:38px 40px;background:#ffffff;color:#172033;font-size:15px;line-height:1.7;overflow-wrap:anywhere;">
              ${innerHtml}
            </td>
          </tr>
          <tr>
            <td class="email-footer" style="padding:22px 34px;background:#f8fafc;border-top:1px solid #e8edf3;">
              <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">Sitemendr · Website projects, site care, and client support</p>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:11px;line-height:1.5;">© ${year} Sitemendr Technologies. This is an automated message.</p>
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
