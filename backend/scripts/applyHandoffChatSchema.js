const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('connect_timeout=')) {
  process.env.DATABASE_URL = `${process.env.DATABASE_URL}&connect_timeout=30`;
}

const prisma = new PrismaClient();

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', 'handoff_chat_messages.sql'), 'utf8');
  const statements = sql.split(';').map(statement => statement.trim()).filter(Boolean);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  console.log(`Applied ${statements.length} handoff chat schema statements.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
