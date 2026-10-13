const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('connect_timeout=')) {
  process.env.DATABASE_URL = `${process.env.DATABASE_URL}&connect_timeout=30`;
}

const prisma = new PrismaClient();

async function main() {
  const migrationFiles = ['project_conversation_messages.sql', 'project_quote_versions.sql'];
  let statementCount = 0;
  for (const file of migrationFiles) {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', file), 'utf8');
    const statements = sql.split(';').map(statement => statement.trim()).filter(Boolean);
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
      statementCount += 1;
    }
  }

  console.log(`Applied ${statementCount} project journey schema and migration statements.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
