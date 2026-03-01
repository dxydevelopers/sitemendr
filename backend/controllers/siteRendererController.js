const { prisma } = require('../config/db');
const logger = require('../config/logger');

exports.renderSite = async (req, res, next) => {
  try {
    const host = req.headers.host;
    const mainDomain = process.env.MAIN_DOMAIN || 'sitemendr.com';
    const apiDomain = process.env.API_DOMAIN || 'api.sitemendr.com';

    // Skip if it's the main domain or API domain
    if (host === mainDomain || host === apiDomain || host === 'localhost:5000') {
      return next();
    }

    let subscription;

    // Check if it's a subdomain of sitemendr.com
    if (host.endsWith(`.${mainDomain}`)) {
      const subdomain = host.split('.')[0];
      subscription = await prisma.subscription.findFirst({
        where: {
          siteName: {
            equals: subdomain,
            mode: 'insensitive'
          },
          status: { in: ['active', 'suspended'] }
        },
        include: {
          template: true
        }
      });
    } else {
      // Check for custom domain
      const customDomain = await prisma.customDomain.findFirst({
        where: {
          domain: host,
          subscription: {
            status: { in: ['active', 'suspended'] }
          }
        },
        include: {
          subscription: {
            include: {
              template: true
            }
          }
        }
      });
      
      if (customDomain) {
        subscription = customDomain.subscription;
      }
    }

    if (!subscription || !subscription.template) {
      // If no subscription found, or no template, continue to 404
      return next();
    }

    // Check for payment enforcement (if suspended)
    const isSuspended = subscription.status === 'suspended' || subscription.suspended === true;
    
    if (isSuspended) {
        return res.status(402).send(`
            <html>
                <head>
                    <title>Site Suspended | Sitemendr</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #020617; color: white; margin: 0; overflow: hidden;">
                    <div style="position: absolute; inset: 0; opacity: 0.1; pointer-events: none; background-image: linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px); background-size: 40px 40px;"></div>
                    <div style="text-align: center; border: 1px solid rgba(255,255,255,0.1); padding: 4rem 2rem; border-radius: 2.5rem; background: rgba(30, 41, 59, 0.5); backdrop-filter: blur(20px); max-width: 500px; width: 90%; position: relative; z-index: 10; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                        <div style="width: 80px; height: 80px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>
                        <h1 style="font-size: 2rem; font-weight: 900; margin-bottom: 1rem; letter-spacing: -0.025em; text-transform: uppercase;">Node Suspended</h1>
                        <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 2.5rem; font-weight: 500;">This environment has been temporarily deactivated due to an outstanding billing protocol.</p>
                        <a href="${process.env.FRONTEND_URL}/payment/reactivate" style="display: inline-block; background: #2563eb; color: white; padding: 1rem 2.5rem; border-radius: 1rem; text-decoration: none; font-weight: 800; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.2s ease; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);">Reactivate Now</a>
                        <p style="margin-top: 2rem; font-size: 0.75rem; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Sitemendr Infrastructure System v4.2.0</p>
                    </div>
                </body>
            </html>
        `);
    }

    // Check for grace period overlay
    const now = new Date();
    const isExpired = subscription.expiresAt && subscription.expiresAt < now;
    const daysOverdue = isExpired ? Math.floor((now - subscription.expiresAt) / (1000 * 60 * 60 * 24)) : 0;
    
    let overlayHtml = '';
    if (isExpired && daysOverdue > 0) {
        overlayHtml = `
            <div id="sitemendr-payment-overlay" style="position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); z-index: 9999; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(12px); border: 1px solid rgba(239, 68, 68, 0.3); padding: 1.25rem 2rem; border-radius: 1.5rem; display: flex; align-items: center; gap: 2rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); min-width: 320px; font-family: sans-serif;">
                <div style="flex-shrink: 0; width: 40px; height: 40px; background: rgba(239, 68, 68, 0.1); border-radius: 1rem; display: flex; align-items: center; justify-content: center;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                </div>
                <div style="flex: 1;">
                    <p style="margin: 0; font-size: 0.875rem; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.05em;">Payment Overdue</p>
                    <p style="margin: 0.25rem 0 0; font-size: 0.75rem; color: #94a3b8; font-weight: 500;">Site will be suspended in ${Math.max(0, 14 - daysOverdue)} days.</p>
                </div>
                <a href="${process.env.FRONTEND_URL}/payment/billing" style="background: #ef4444; color: white; padding: 0.625rem 1.25rem; border-radius: 0.75rem; text-decoration: none; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.2s ease;">Settle Now</a>
                <button onclick="this.parentElement.remove()" style="background: transparent; border: none; color: #475569; cursor: pointer; padding: 0.5rem; margin-right: -0.5rem;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg></button>
            </div>
        `;
    }

    // Render the template
    const { html, css, js } = subscription.template;
    
    // Simple injection of CSS and JS if they are separate
    let finalHtml = html;
    
    if (css && !html.includes('<style>')) {
        finalHtml = finalHtml.replace('</head>', `<style>${css}</style></head>`);
    }
    
    if (js && !html.includes('<script>')) {
        finalHtml = finalHtml.replace('</body>', `<script>${js}</script></body>`);
    }

    if (overlayHtml) {
        if (finalHtml.includes('</body>')) {
            finalHtml = finalHtml.replace('</body>', `${overlayHtml}</body>`);
        } else if (finalHtml.includes('</BODY>')) {
            finalHtml = finalHtml.replace('</BODY>', `${overlayHtml}</BODY>`);
        } else {
            finalHtml = finalHtml + overlayHtml;
        }
    }

    res.send(finalHtml);

  } catch (error) {
    logger.error('Site Rendering Error', {
      errorCode: 'SITE_RENDERING_ERROR',
      error: error.message,
      host: req.headers.host
    });
    res.status(500).send('Infrastructure sync error');
  }
};
