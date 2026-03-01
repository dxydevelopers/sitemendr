const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const assessments = await prisma.assessment.count();
    const subscriptions = await prisma.subscription.count();
    const activeSubs = await prisma.subscription.count({ where: { status: 'active' } });
    console.log(JSON.stringify({ assessments, subscriptions, activeSubs }, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
