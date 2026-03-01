
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        contains: 'ivanopoppy',
        mode: 'insensitive'
      }
    }
  });
  console.log('Found users:', JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

checkUsers();
