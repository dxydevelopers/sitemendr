const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = 'Admin123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const admin = await prisma.user.update({
    where: {
      email: 'admin@sitemendr.com'
    },
    data: {
      password: hashedPassword
    }
  });
  
  console.log('Admin password reset successfully for:', admin.email);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
