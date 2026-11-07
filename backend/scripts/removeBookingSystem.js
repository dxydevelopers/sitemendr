require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required to remove the booking tables.');
  process.exit(1);
}

if (!process.argv.includes('--confirm')) {
  console.error('This permanently removes only the Booking and Service tables and their records.');
  console.error('Re-run with -- --confirm after checking the configured database target.');
  process.exit(1);
}

const prisma = new PrismaClient();
const quoteIdentifier = (value) => `"${String(value).replaceAll('"', '""')}"`;

async function main() {
  const target = new URL(process.env.DATABASE_URL);
  const [{ databaseName, schemaName }] = await prisma.$queryRaw`
    SELECT current_database() AS "databaseName", current_schema() AS "schemaName"
  `;
  const schema = quoteIdentifier(schemaName);

  console.log(`Removing booking data from ${target.hostname}/${databaseName} (${schemaName} schema).`);

  const counts = await prisma.$transaction(async (tx) => {
    const tables = await tx.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ${schemaName}
        AND table_type = 'BASE TABLE'
        AND table_name IN ('Booking', 'Service')
    `;
    const tableNames = new Set(tables.map((table) => table.table_name));
    const bookingCount = tableNames.has('Booking')
      ? (await tx.$queryRawUnsafe(`SELECT count(*)::int AS count FROM ${schema}."Booking"`))[0].count
      : 0;
    const serviceCount = tableNames.has('Service')
      ? (await tx.$queryRawUnsafe(`SELECT count(*)::int AS count FROM ${schema}."Service"`))[0].count
      : 0;

    // Deliberately omit CASCADE so unexpected dependencies stop the migration
    // instead of deleting objects outside the booking feature.
    await tx.$executeRawUnsafe(`DROP TABLE IF EXISTS ${schema}."Booking"`);
    await tx.$executeRawUnsafe(`DROP TABLE IF EXISTS ${schema}."Service"`);

    const remainingTables = await tx.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ${schemaName}
        AND table_type = 'BASE TABLE'
        AND table_name IN ('Booking', 'Service')
    `;
    if (remainingTables.length) throw new Error('Booking tables still exist after cleanup.');

    return { bookingCount, serviceCount };
  });

  console.log(`Removed ${counts.bookingCount} booking record(s) and ${counts.serviceCount} booking service record(s).`);
  console.log('Booking tables are removed. No user, project, payment, or subscription rows were changed.');
}

main()
  .catch((error) => {
    console.error('Failed to remove booking data:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
