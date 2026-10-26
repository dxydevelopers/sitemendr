const tls = require('tls');
const { prisma } = require('../config/db');
const logger = require('../config/logger');

function inspectHttpsCertificate(hostname, timeoutMs = 8000) {
  return new Promise(resolve => {
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const socket = tls.connect({
      host: hostname,
      port: 443,
      servername: hostname,
      rejectUnauthorized: true,
      timeout: timeoutMs
    });

    socket.once('secureConnect', () => {
      const certificate = socket.getPeerCertificate();
      const validTo = certificate?.valid_to ? new Date(certificate.valid_to) : null;
      const valid = socket.authorized && validTo instanceof Date
        && !Number.isNaN(validTo.valueOf()) && validTo > new Date();
      finish({ valid, validTo: valid ? validTo : null, error: valid ? null : socket.authorizationError || 'No valid certificate' });
      socket.end();
    });
    socket.once('timeout', () => {
      finish({ valid: false, validTo: null, error: 'Connection timed out' });
      socket.destroy();
    });
    socket.once('error', error => finish({ valid: false, validTo: null, error: error.message }));
  });
}

/**
 * Reports real HTTPS certificate readiness for both the root and www host.
 * Certificate issuance belongs to the web infrastructure; this worker only
 * records the externally observable result and never marks mock SSL as ready.
 */
async function provisionSSL() {
  try {
    const domains = await prisma.customDomain.findMany({
      where: { status: { in: ['verified', 'active'] } },
      select: { id: true, domain: true, sslEnabled: true, sslExpiresAt: true }
    });

    for (const domain of domains) {
      const rootHost = domain.domain.toLowerCase();
      const checks = await Promise.all([
        inspectHttpsCertificate(rootHost),
        inspectHttpsCertificate(`www.${rootHost}`)
      ]);
      const isReady = checks.every(check => check.valid);
      const expiries = checks.filter(check => check.valid).map(check => check.validTo);
      const expiresAt = isReady ? new Date(Math.min(...expiries.map(date => date.valueOf()))) : null;

      if (domain.sslEnabled !== isReady || domain.sslExpiresAt?.valueOf() !== expiresAt?.valueOf()) {
        await prisma.customDomain.update({
          where: { id: domain.id },
          data: { sslEnabled: isReady, sslExpiresAt: expiresAt }
        });
      }

      logger.info('HTTPS certificate readiness checked', {
        domain: rootHost,
        rootHttpsReady: checks[0].valid,
        wwwHttpsReady: checks[1].valid,
        sslEnabled: isReady,
        errors: checks.filter(check => !check.valid).map(check => check.error)
      });
    }
  } catch (error) {
    logger.error('HTTPS certificate readiness worker failed', {
      errorCode: 'SSL_WORKER_CRITICAL_ERROR',
      error: error.message
    });
  }
}

if (require.main === module) {
  provisionSSL()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('HTTPS readiness worker startup failed', { error: error.message });
      process.exit(1);
    });
}

module.exports = { provisionSSL, inspectHttpsCertificate };
