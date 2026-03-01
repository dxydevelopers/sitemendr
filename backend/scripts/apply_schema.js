require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    const sqlPath = path.join(__dirname, '../schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing schema SQL on Supabase...');
    
    // Split SQL into individual commands (very basic split, but usually works for Prisma output)
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    for (const command of commands) {
      try {
        await prisma.$executeRawUnsafe(command);
      } catch (cmdErr) {
        // Ignore "already exists" errors
        if (cmdErr.message.includes('already exists')) {
          continue;
        }
        console.warn(`Warning executing command: ${command.substring(0, 50)}...`);
        console.warn(`Error: ${cmdErr.message}`);
      }
    }

    console.log('Schema applied successfully!');
  } catch (err) {
    console.error('Failed to apply schema:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
