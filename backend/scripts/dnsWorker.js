const dns = require('dns').promises;
const { prisma } = require('../config/db');
const axios = require('axios');
const logger = require('../config/logger');

/**
 * Verifies DNS settings and automates DNS record creation if Cloudflare is configured.
 */
async function verifyDomains() {
  logger.info('Starting DNS Verification Worker');
  
  const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
  const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

  try {
    const domains = await prisma.customDomain.findMany({
      where: {
        OR: [
          { status: 'pending' },
          { status: 'active' }
        ]
      }
    });

    logger.info(`Checking ${domains.length} domains`);

    const TARGET_IP = process.env.INFRA_IP || '102.0.21.24'; 
    const TARGET_CNAME = process.env.INFRA_CNAME || 'nodes.sitemendr.com';

    for (const domainRecord of domains) {
      try {
        const { domain } = domainRecord;
        logger.info(`Verifying domain: ${domain}`);

        // 1. Attempt Cloudflare Automation if token is available
        if (CLOUDFLARE_API_TOKEN && CLOUDFLARE_API_TOKEN !== 'your_cloudflare_token_for_dns_automation') {
          if (!CLOUDFLARE_ZONE_ID || CLOUDFLARE_ZONE_ID === 'your_cloudflare_zone_id') {
            logger.warn('Cloudflare Zone ID missing or placeholder - skipping DNS automation');
          } else {
            await automateCloudflareDNS(domain, TARGET_IP, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID);
          }
        }

        let isValid = false;
        
        // Check A records
        try {
          const aRecords = await dns.resolve4(domain);
          if (aRecords.includes(TARGET_IP)) {
            isValid = true;
          }
        } catch (e) {}

        // Check CNAME records if A record didn't match
        if (!isValid) {
          try {
            const cnameRecords = await dns.resolveCname(domain);
            if (cnameRecords.some(r => r.includes(TARGET_CNAME))) {
              isValid = true;
            }
          } catch (e) {}
        }

        // Update record in database
        await prisma.customDomain.update({
          where: { id: domainRecord.id },
          data: {
            status: isValid ? 'active' : 'failed',
            updatedAt: new Date()
          }
        });

        logger.info(`Domain verification result: ${domain}`, {
          errorCode: isValid ? 'DNS_VALID' : 'DNS_INVALID',
          domain,
          isValid
        });
      } catch (err) {
        logger.error(`Error verifying domain ${domainRecord.domain}`, { error: err.message });
      }
    }
    
    logger.info('DNS Verification cycle complete');
  } catch (error) {
    logger.error('DNS Worker Error', {
      errorCode: 'DNS_WORKER_CRITICAL_ERROR',
      error: error.message
    });
  }
}

async function automateCloudflareDNS(domain, ip, token, zoneId) {
  try {
    logger.info(`Attempting Cloudflare DNS automation for ${domain}`);
    
    // Check if record already exists
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${domain}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.result.length > 0) {
      logger.info(`DNS record for ${domain} already exists in Cloudflare`);
      return;
    }

    // Create A record
    await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        type: 'A',
        name: domain,
        content: ip,
        ttl: 1, // Auto
        proxied: true
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    logger.info(`Successfully created Cloudflare DNS record for ${domain}`);
  } catch (error) {
    logger.error(`Cloudflare DNS automation failed for ${domain}`, {
      error: error.response?.data?.errors || error.message
    });
  }
}

// If run directly
if (require.main === module) {
  verifyDomains()
    .then(() => process.exit(0))
    .catch(err => {
      logger.error('DNS Worker Startup Error', {
        errorCode: 'DNS_WORKER_STARTUP_ERROR',
        error: err.message
      });
      process.exit(1);
    });
}

module.exports = { verifyDomains };



