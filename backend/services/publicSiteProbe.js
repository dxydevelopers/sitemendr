const axios = require('axios');
const dns = require('node:dns/promises');
const net = require('node:net');

function isPublicAddress(address) {
  if (net.isIP(address) === 4) {
    const [a, b, c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2))))
      || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
      || (a === 203 && b === 0 && c === 113));
  }

  if (net.isIP(address) !== 6) return false;
  const normalized = address.toLowerCase();
  if (normalized.startsWith('::ffff:')) return isPublicAddress(normalized.slice(7));
  const firstSegment = Number.parseInt(normalized.split(':')[0] || '0', 16);
  return firstSegment >= 0x2000 && firstSegment <= 0x3fff && !normalized.startsWith('2001:db8:');
}

async function checkPublicSiteAvailability(target) {
  const input = typeof target === 'string' && /^[a-z][a-z\d+.-]*:\/\//i.test(target)
    ? target
    : `https://${target}`;
  let parsedUrl;
  try {
    parsedUrl = new URL(input);
  } catch {
    throw Object.assign(new Error('The site address is invalid.'), { code: 'INVALID_SITE_URL' });
  }
  const start = Date.now();
  const visited = new Set();
  const maxRedirects = 5;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const expectedPort = parsedUrl.protocol === 'https:' ? '443' : '80';
    if (!['http:', 'https:'].includes(parsedUrl.protocol)
      || parsedUrl.username
      || parsedUrl.password
      || (parsedUrl.port && parsedUrl.port !== expectedPort)) {
      throw Object.assign(new Error('Only public HTTP or HTTPS site addresses can be checked.'), { code: 'UNSAFE_SITE_URL' });
    }

    const currentUrl = parsedUrl.toString();
    if (visited.has(currentUrl)) {
      return {
        url: currentUrl,
        status: 'DOWN',
        responseTime: `${Date.now() - start}ms`,
        error: 'The site redirect loop could not be followed.',
        timestamp: new Date().toISOString()
      };
    }
    visited.add(currentUrl);

    const hostname = parsedUrl.hostname.replace(/^\[|\]$/g, '');
    let addresses;
    try {
      addresses = net.isIP(hostname)
        ? [{ address: hostname, family: net.isIP(hostname) }]
        : await dns.lookup(hostname, { all: true, verbatim: true });
    } catch {
      return {
        url: currentUrl,
        status: 'DOWN',
        responseTime: `${Date.now() - start}ms`,
        error: 'The site domain did not resolve.',
        timestamp: new Date().toISOString()
      };
    }
    if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) {
      throw Object.assign(new Error('This domain does not resolve exclusively to public internet addresses.'), { code: 'UNSAFE_SITE_ADDRESS' });
    }

    const pinnedAddress = addresses[0];
    try {
      const response = await axios.get(currentUrl, {
        timeout: 10000,
        maxRedirects: 0,
        proxy: false,
        validateStatus: () => true,
        lookup: (_hostname, options, callback) => options?.all
          ? callback(null, [{ address: pinnedAddress.address, family: pinnedAddress.family }])
          : callback(null, pinnedAddress.address, pinnedAddress.family)
      });
      const location = response.headers.location;
      if (response.status >= 300 && response.status < 400 && location) {
        if (redirectCount === maxRedirects) {
          return {
            url: currentUrl,
            status: 'DOWN',
            statusCode: response.status,
            responseTime: `${Date.now() - start}ms`,
            error: 'The site redirected too many times.',
            timestamp: new Date().toISOString()
          };
        }
        const nextUrl = new URL(location, parsedUrl);
        if (parsedUrl.protocol === 'https:' && nextUrl.protocol === 'http:') {
          return {
            url: currentUrl,
            status: 'DOWN',
            statusCode: response.status,
            responseTime: `${Date.now() - start}ms`,
            error: 'The site redirected to an insecure HTTP address.',
            timestamp: new Date().toISOString()
          };
        }
        parsedUrl = nextUrl;
        continue;
      }

      return {
        url: currentUrl,
        status: response.status < 500 ? 'UP' : 'DOWN',
        statusCode: response.status,
        responseTime: `${Date.now() - start}ms`,
        ...(response.status >= 500 ? { error: `HTTP ${response.status}` } : {}),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        url: currentUrl,
        status: 'DOWN',
        ...(error.response?.status ? { statusCode: error.response.status } : {}),
        responseTime: `${Date.now() - start}ms`,
        error: error.response?.status ? `HTTP ${error.response.status}` : 'The site did not respond.',
        timestamp: new Date().toISOString()
      };
    }
  }

  return { url: parsedUrl.toString(), status: 'DOWN', responseTime: `${Date.now() - start}ms`, error: 'The site could not be checked.', timestamp: new Date().toISOString() };
}

async function mergeSubscriptionPerformanceData(prismaOrTransaction, subscriptionId, update) {
  const serializedUpdate = JSON.stringify(update);
  const count = await prismaOrTransaction.$executeRaw`
    UPDATE "Subscription"
    SET "performanceData" = CASE
          WHEN jsonb_typeof("performanceData") = 'object' THEN "performanceData"
          ELSE '{}'::jsonb
        END || ${serializedUpdate}::jsonb,
        "updatedAt" = NOW()
    WHERE "id" = ${subscriptionId}
  `;
  if (count !== 1) throw new Error('The site no longer exists.');
}

async function saveSiteAvailabilityCheck(prisma, subscriptionId, result, source = 'scheduled') {
  const checkedAt = new Date(result.timestamp || Date.now());
  const responseTimeMs = Number.parseInt(result.responseTime, 10);
  return prisma.$transaction(async tx => {
    await mergeSubscriptionPerformanceData(tx, subscriptionId, {
      status: result.status,
      lastChecked: checkedAt.toISOString(),
      statusCode: result.statusCode || null,
      latency: Number.isFinite(responseTimeMs) ? responseTimeMs : null,
      error: result.error || null
    });
    return tx.siteAvailabilityCheck.create({
      data: {
        subscriptionId,
        status: result.status,
        statusCode: result.statusCode || null,
        responseTimeMs: Number.isFinite(responseTimeMs) ? responseTimeMs : null,
        error: result.error || null,
        source,
        checkedAt
      }
    });
  });
}

module.exports = { checkPublicSiteAvailability, mergeSubscriptionPerformanceData, saveSiteAvailabilityCheck };
