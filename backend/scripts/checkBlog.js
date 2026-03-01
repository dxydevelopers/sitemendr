const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.blogPost.count();
  logger.info('Blog posts count check', { count });
}

main()
  .catch(e => logger.error('Check blog failed', { error: e.message }))
  .finally(() => prisma.$disconnect());
