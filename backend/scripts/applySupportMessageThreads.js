require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required to apply the support message threading migration.');
  process.exit(1);
}

if (!process.argv.includes('--confirm')) {
  console.error('This changes the configured database. Re-run with -- --confirm after verifying DATABASE_URL.');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const url = new URL(databaseUrl);
  console.log(`Applying support message threading migration to ${url.hostname}/${url.pathname.slice(1)}.`);

  await prisma.$executeRawUnsafe(
    'ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "threadId" TEXT'
  );

  const [constraint] = await prisma.$queryRawUnsafe(
    'SELECT 1 FROM pg_constraint WHERE conname = $1 LIMIT 1',
    'Message_threadId_fkey'
  );
  if (!constraint) {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE'
    );
  }

  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "Message_userId_createdAt_idx" ON "Message"("userId", "createdAt")'
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt")'
  );

  console.log('Support message threading migration applied successfully.');
}

main()
  .catch((error) => {
    console.error('Failed to apply support message threading migration:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
