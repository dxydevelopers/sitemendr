require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    throw new Error('Usage: node scripts/checkUserBillingState.js email@example.com');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      country: true,
      defaultCurrency: true,
      accountType: true,
      billingRegion: true,
      projectRequests: {
        where: { serviceType: 'build' },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          quoteCurrency: true,
          depositAmount: true,
          totalAgreedAmount: true,
          paymentAgreementStatus: true,
          paymentInstructions: true
        }
      }
    }
  });

  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
