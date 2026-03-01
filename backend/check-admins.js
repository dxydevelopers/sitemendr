const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: {
      role: 'admin'
    },
    select: {
      email: true,
      name: true
    }
  });
  console.log('Admin Users:', JSON.stringify(admins, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
