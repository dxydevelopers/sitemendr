require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing Prisma connection to Supabase...');
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log('Successfully connected! Database time:', result[0].now);
  } catch (err) {
    console.error('Prisma connection failed:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
