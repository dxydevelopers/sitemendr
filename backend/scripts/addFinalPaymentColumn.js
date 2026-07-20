const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const existing = await prisma.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns WHERE table_name='ProjectRequest' AND column_name='finalPaymentConfirmedAt'`
  );
  if (existing.length > 0) {
    console.log('finalPaymentConfirmedAt column already exists');
  } else {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "ProjectRequest" ADD COLUMN IF NOT EXISTS "finalPaymentConfirmedAt" TIMESTAMP(3)`
    );
    console.log('finalPaymentConfirmedAt column added');
  }
  await prisma.$disconnect();
})().catch((err) => { console.error(err.message); process.exit(1); });
