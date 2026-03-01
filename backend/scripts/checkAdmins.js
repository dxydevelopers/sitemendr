const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({ where: { role: 'admin' } });
  console.log('Admin users:', admins.map(u => ({ email: u.email, role: u.role })));
  logger.info('Admin users list', { admins });
}

main()
  .catch(e => {
    logger.error('Failed to check admins', { error: e.message });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
