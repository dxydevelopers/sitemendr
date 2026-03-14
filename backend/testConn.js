const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing connection...');
    await prisma.$connect();
    console.log('Connected successfully!');
    const count = await prisma.user.count();
    console.log('User count:', count);
  } catch (e) {
    console.error('Connection failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
