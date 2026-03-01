const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing subscription query...');
    const subs = await prisma.subscription.findMany({ take: 1 });
    console.log('Success!', subs);
  } catch (err) {
    console.error('FAILED:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
