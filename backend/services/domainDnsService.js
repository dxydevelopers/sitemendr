const dns = require('dns').promises;
const net = require('net');

const NO_RECORD_CODES = new Set(['ENODATA', 'ENOTFOUND', 'NXDOMAIN', 'ENOTIMP']);
const normalizeTarget = value => String(value || '').trim().replace(/\.$/, '').toLowerCase();

const getHostingDomainTarget = () => {
  const targetIp = String(process.env.INFRA_IP || '').trim();
  return net.isIPv4(targetIp) ? targetIp : '';
};

const readHostRecords = async hostname => {
  const aRecords = await dns.resolve4(hostname).catch(error => {
    if (NO_RECORD_CODES.has(error.code)) return [];
    throw error;
  });

  // resolve4 follows CNAME chains, so A, CNAME, or ALIAS customer records are
  // accepted as long as they ultimately resolve to Sitemendr's configured IP.
  return { aRecords };
};

async function verifyDomainDns(domain) {
  const targetIp = getHostingDomainTarget();
  if (!targetIp) {
    throw new Error('Configure INFRA_IP with the live Sitemendr hosting address before verifying custom domains.');
  }

  const root = normalizeTarget(domain);
  const www = `www.${root}`;
  const [rootRecords, wwwRecords] = await Promise.all([
    readHostRecords(root),
    readHostRecords(www)
  ]);

  const checks = {
    root: {
      hostname: root,
      verified: rootRecords.aRecords.includes(targetIp),
      aRecords: rootRecords.aRecords
    },
    www: {
      hostname: www,
      verified: wwwRecords.aRecords.includes(targetIp),
      aRecords: wwwRecords.aRecords
    }
  };

  return {
    verified: checks.root.verified && checks.www.verified,
    checks,
    targetIp
  };
}

module.exports = { verifyDomainDns, getHostingDomainTarget };
