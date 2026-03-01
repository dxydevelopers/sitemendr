const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting manual migration...');
  try {
    // Add columns to Subscription
    console.log('Adding columns to Subscription...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "suspended" BOOLEAN DEFAULT false`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "reviewRequested" BOOLEAN DEFAULT false`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "reviewNotes" TEXT`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "revisionCount" INTEGER DEFAULT 0`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "performanceData" JSONB`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "purchasedAddons" JSONB`);
      console.log('Subscription table updated.');
    } catch (e) {
      console.error('Error updating Subscription table:', e.message);
    }

    // Add columns to CustomDomain
    console.log('Adding columns to CustomDomain...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "CustomDomain" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pending'`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "CustomDomain" ADD COLUMN IF NOT EXISTS "sslEnabled" BOOLEAN DEFAULT false`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "CustomDomain" ADD COLUMN IF NOT EXISTS "sslExpiresAt" TIMESTAMP`);
      console.log('CustomDomain table updated.');
    } catch (e) {
      console.error('Error updating CustomDomain table:', e.message);
    }

    // Add columns to Comment
    console.log('Adding columns to Comment...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'approved'`);
      console.log('Comment table updated.');
    } catch (e) {
      console.error('Error updating Comment table:', e.message);
    }

    // Rename column in SupportMessage
    console.log('Renaming column in SupportMessage...');
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SupportMessage' AND column_name='userId') THEN
            ALTER TABLE "SupportMessage" RENAME COLUMN "userId" TO "senderId";
          END IF;
        END $$;
      `);
      console.log('SupportMessage table updated.');
    } catch (e) {
      console.error('Error updating SupportMessage table:', e.message);
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
