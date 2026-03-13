const { prisma } = require('./config/db');
const logger = require('./config/logger');

async function testSupporterTiers() {
  try {
    console.log('Checking if supporterTier model exists in prisma client...');
    console.log('prisma.supporterTier:', !!prisma.supporterTier);
    
    if (prisma.supporterTier) {
      console.log('Fetching supporter tiers...');
      const tiers = await prisma.supporterTier.findMany();
      console.log('Tiers found:', tiers.length);
      console.log(JSON.stringify(tiers, null, 2));
    } else {
      console.error('ERROR: supporterTier model is MISSING from Prisma client!');
      const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
      console.log('Available models:', models.join(', '));
    }
  } catch (error) {
    console.error('Error fetching tiers:', error.message);
    if (error.message.includes('does not exist in the current database')) {
      console.error('HINT: The table likely does not exist in the database. Need to run migrations.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testSupporterTiers();
