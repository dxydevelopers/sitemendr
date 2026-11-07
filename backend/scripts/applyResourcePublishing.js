require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required to apply the resource publishing migration.');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const target = new URL(process.env.DATABASE_URL);
  const [database] = await prisma.$queryRaw`SELECT current_database() AS name, current_schema() AS schema`;
  const [table] = await prisma.$queryRaw`SELECT to_regclass('"Resource"')::text AS name`;
  if (!table?.name) throw new Error(`Expected Resource table was not found in ${database.name}.${database.schema}.`);

  const before = await prisma.resource.count();
  const columns = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'Resource'
      AND column_name = 'isPublished'
  `;

  console.log(`Resource publishing migration target: ${target.hostname}/${database.name} (${database.schema} schema).`);
  if (columns.length) {
    console.log('Resource.isPublished already exists; no schema change was needed.');
  } else {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Resource" ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT TRUE'
    );
    console.log('Added Resource.isPublished with TRUE as the default for existing resources.');
  }

  const after = await prisma.resource.count();
  if (before !== after) throw new Error(`Resource count changed during migration (${before} before, ${after} after).`);

  const [definition] = await prisma.$queryRaw`
    SELECT column_default, is_nullable
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'Resource'
      AND column_name = 'isPublished'
  `;
  if (!definition || definition.is_nullable !== 'NO' || !String(definition.column_default).includes('true')) {
    throw new Error('Resource.isPublished exists but does not have the expected NOT NULL TRUE default.');
  }

  console.log(`Verified Resource.isPublished; ${after} existing resource records remain.`);
}

main()
  .catch((error) => {
    console.error('Failed to apply resource publishing migration:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
