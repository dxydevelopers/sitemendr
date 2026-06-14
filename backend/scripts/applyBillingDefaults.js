require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT NOT NULL DEFAULT \'US\'');
  await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "defaultCurrency" TEXT NOT NULL DEFAULT \'USD\'');
  await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountType" TEXT NOT NULL DEFAULT \'individual\'');
  await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingRegion" TEXT');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "User_country_defaultCurrency_idx" ON "User" ("country", "defaultCurrency")');

  console.log('account billing defaults migration applied');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
