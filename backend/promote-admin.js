const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promoteAdmin(email) {
  if (!email) {
    console.error('Usage: node promote-admin.js <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'admin' }
    });

    console.log(`Successfully promoted ${updatedUser.name} (${updatedUser.email}) to ADMIN role.`);
  } catch (error) {
    console.error('Failed to promote user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
promoteAdmin(email);
