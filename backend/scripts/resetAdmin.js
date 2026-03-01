
const { PrismaClient } = require('@prisma/client');
const { getDb, connectDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  await connectDB();
  const db = getDb();
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Update MongoDB
  const mongoResult = await db.collection('users').updateOne(
    { email: 'admin@sitemendr.com' },
    { $set: { password: hashedPassword, role: 'admin' } },
    { upsert: true }
  );
  console.log('MongoDB admin updated');

  // Update PostgreSQL
  await prisma.user.upsert({
    where: { email: 'admin@sitemendr.com' },
    update: { password: hashedPassword, role: 'admin' },
    create: { 
      id: 'admin-id', // Optional if you want a specific ID
      email: 'admin@sitemendr.com', 
      password: hashedPassword, 
      role: 'admin',
      name: 'Admin User'
    }
  });
  console.log('PostgreSQL admin updated');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  process.exit(0);
});
