const { prisma } = require('../config/db');
const logger = require('../config/logger');
const { verifyDomainDns, getHostingDomainTarget } = require('../services/domainDnsService');

/**
 * Re-checks client-owned DNS records. This worker must never write records to
 * Sitemendr's Cloudflare zone: customer DNS is managed at their own provider.
 */
async function verifyDomains() {
  logger.info('Starting DNS verification worker');

  if (!getHostingDomainTarget()) {
    logger.warn('DNS verification skipped: INFRA_IP is missing or is not a valid IPv4 address.');
    return;
  }

  try {
    const domains = await prisma.customDomain.findMany({
      where: { status: { in: ['pending', 'verified', 'active'] } },
      select: { id: true, domain: true, status: true, sslEnabled: true, sslExpiresAt: true }
    });

    for (const domainRecord of domains) {
      try {
        const result = await verifyDomainDns(domainRecord.domain);
        const nextStatus = result.verified ? 'verified' : 'pending';
        if (domainRecord.status !== nextStatus || (!result.verified && (domainRecord.sslEnabled || domainRecord.sslExpiresAt))) {
          await prisma.customDomain.update({
            where: { id: domainRecord.id },
            data: result.verified
              ? { status: nextStatus }
              : { status: nextStatus, sslEnabled: false, sslExpiresAt: null }
          });
        }
        logger.info('Domain DNS check complete', {
          domain: domainRecord.domain,
          verified: result.verified,
          rootVerified: result.checks.root.verified,
          wwwVerified: result.checks.www.verified
        });
      } catch (error) {
        // A temporary DNS resolver error should not change a customer's state.
        logger.warn('Domain DNS check could not complete', {
          domain: domainRecord.domain,
          error: error.message
        });
      }
    }

    logger.info(`DNS verification cycle complete (${domains.length} domains)`);
  } catch (error) {
    logger.error('DNS verification worker failed', {
      errorCode: 'DNS_WORKER_CRITICAL_ERROR',
      error: error.message
    });
  }
}

if (require.main === module) {
  verifyDomains()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('DNS worker startup failed', { error: error.message });
      process.exit(1);
    });
}

module.exports = { verifyDomains };
