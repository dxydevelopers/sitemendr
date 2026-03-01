const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@sitemendr.com',
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true
    }
  });
  logger.info('Admin user created', { email: admin.email });
}

main()
  .catch(e => {
    logger.error('Failed to create admin user', { error: e.message });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
