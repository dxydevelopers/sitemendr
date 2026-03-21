const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const tiers = await prisma.supporterTier.findMany();
    console.log('SupporterTiers:', JSON.stringify(tiers, null, 2));
  } catch (error) {
    console.error('Error checking SupporterTier:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
