require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Prisma attempting connection...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const assessments = await prisma.assessment.count({
    where: {
      createdAt: { gte: today }
    }
  });
  console.log('Assessments today:', assessments);

  const leads = await prisma.lead.findMany({
    where: {
      createdAt: { gte: today }
    },
    select: {
      email: true,
      createdAt: true,
      converted: true
    }
  });
  console.log('Leads today:', leads);

  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: today }
    },
    select: {
      email: true,
      createdAt: true,
      lastLogin: true
    }
  });
  console.log('Users today:', users);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
