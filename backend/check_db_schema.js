const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseSchema() {
  console.log('Checking for SupporterTier table in database...');
  try {
    // Try a raw query to check if the table exists
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SupporterTier'
      );
    `;
    console.log('Table existence check result:', JSON.stringify(tableCheck, null, 2));
    
    if (tableCheck[0].exists) {
      console.log('SupporterTier table EXISTS.');
      const count = await prisma.supporterTier.count();
      console.log('Row count in SupporterTier:', count);
    } else {
      console.log('SupporterTier table does NOT exist in the database!');
    }
  } catch (error) {
    console.error('Database check failed:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('CONFIRMED: Table does not exist according to Prisma error.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseSchema();
