const { prisma } = require('../config/db');
const axios = require('axios');
const logger = require('../config/logger');

/**
 * SSL Worker - Provisions certificates for custom domains
 * Interfaces with Cloudflare API for automated SSL management
 */
async function provisionSSL() {
  logger.info('Starting SSL Provisioning Worker');
  
  const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
  const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!CLOUDFLARE_API_TOKEN || CLOUDFLARE_API_TOKEN === 'your_cloudflare_token_for_dns_automation') {
    logger.warn('Cloudflare API Token missing or placeholder - skipping real SSL provisioning');
    // Maintain mock for development if no token provided
    if (isProduction) { return; }
    return await runMockProvisioning();
  }

  if (!CLOUDFLARE_ZONE_ID || CLOUDFLARE_ZONE_ID === 'your_cloudflare_zone_id') {
    logger.warn('Cloudflare Zone ID missing or placeholder - skipping real SSL provisioning');
    if (isProduction) { return; }
    return await runMockProvisioning();
  }

  try {
    const domains = await prisma.customDomain.findMany({
      where: {
        status: 'active',
        OR: [
          { sslEnabled: false },
          { sslExpiresAt: { lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }
        ]
      }
    });

    logger.info(`Checking SSL for ${domains.length} domains requiring attention`);

    for (const domainRecord of domains) {
      const { domain } = domainRecord;
      logger.info(`Provisioning SSL for ${domain} via Cloudflare API`);

      try {
        // 1. Ensure SSL setting is 'Full' or 'Strict' in Cloudflare
        await axios.patch(
          `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/settings/ssl`,
          { value: 'full' },
          { headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` } }
        );

        // 2. Enable Always Use HTTPS
        await axios.patch(
          `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/settings/always_use_https`,
          { value: 'on' },
          { headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` } }
        );

        // 3. Mock success metadata for internal tracking (Cloudflare handles the actual cert)
        const sslEnabled = true;
        const sslExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

        await prisma.customDomain.update({
          where: { id: domainRecord.id },
          data: {
            sslEnabled,
            sslExpiresAt,
            updatedAt: new Date()
          }
        });

        logger.info(`SSL configuration updated for ${domain}`, {
          errorCode: 'SSL_PROVISIONED',
          domain
        });
      } catch (provisionError) {
        logger.error(`Cloudflare SSL config failed for ${domain}`, {
          errorCode: 'SSL_PROVISIONING_ERROR',
          domain,
          error: provisionError.response?.data?.errors || provisionError.message
        });
      }
    }
  } catch (error) {
    logger.error('SSL Worker Error', {
      errorCode: 'SSL_WORKER_CRITICAL_ERROR',
      error: error.message
    });
  }
}

async function runMockProvisioning() {
  if (process.env.NODE_ENV === 'production') {
    logger.warn('Mock SSL provisioning is disabled in production');
    return;
  }
  // Original mock logic for development environments without API keys
  try {
    const domains = await prisma.customDomain.findMany({
      where: {
        status: 'active',
        OR: [
          { sslEnabled: false },
          { sslExpiresAt: { lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }
        ]
      }
    });

    for (const domainRecord of domains) {
      const { domain } = domainRecord;
      const sslEnabled = true;
      const sslExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      await prisma.customDomain.update({
        where: { id: domainRecord.id },
        data: { sslEnabled, sslExpiresAt, updatedAt: new Date() }
      });
      logger.info(`MOCK: SSL provisioned for ${domain}`);
    }
  } catch (err) {
    logger.error('Mock SSL Error', { error: err.message });
  }
}

if (require.main === module) {
  provisionSSL()
    .then(() => process.exit(0))
    .catch(err => {
      logger.error('SSL Worker Startup Error', {
        errorCode: 'SSL_WORKER_STARTUP_ERROR',
        error: err.message
      });
      process.exit(1);
    });
}

module.exports = { provisionSSL };




