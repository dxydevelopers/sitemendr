const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  if (process.env.ALLOW_SEED !== 'true') {
    console.error('Seeding disabled. Set ALLOW_SEED=true to run this script.');
    process.exit(1);
  }
  console.log('Seeding Supabase...');

  const adminEmail = 'admin@sitemendr.com';
  const adminId = '65bb3e76c720c24a68656660';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  const shouldUpdatePassword = true;

  if (!process.env.ADMIN_SEED_PASSWORD) {
    console.error('ADMIN_SEED_PASSWORD is required to seed admin user.');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Admin User',
      role: 'admin',
      ...(shouldUpdatePassword ? { password: hashedPassword } : {})
    },
    create: {
      id: adminId,
      name: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    }
  });
  
  console.log('Seed: Product created');

  console.log('Supabase seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

