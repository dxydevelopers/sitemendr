require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { convertCurrencyAmount, replaceCurrencyAmountInText } = require('../utils/currency');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const forcedSourceCurrency = process.argv.find(arg => arg.startsWith('--from='))?.split('=')[1];
  if (!email) {
    throw new Error('Usage: node scripts/syncUserBuildCurrency.js email@example.com [--from=USD]');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, defaultCurrency: true }
  });

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  const requests = await prisma.projectRequest.findMany({
    where: {
      userId: user.id,
      serviceType: 'build',
      paymentAgreementStatus: { not: 'confirmed' },
      status: { notIn: ['completed', 'cancelled', 'archived'] }
    },
    select: {
      id: true,
      title: true,
      quoteCurrency: true,
      depositAmount: true,
      totalAgreedAmount: true,
      quotedAmount: true,
      paymentInstructions: true
    }
  });

  for (const request of requests) {
    const fromCurrency = forcedSourceCurrency || request.quoteCurrency || 'USD';
    const quotedAmount = request.quotedAmount
      ? convertCurrencyAmount(request.quotedAmount, fromCurrency, user.defaultCurrency)
      : request.quotedAmount;
    const totalAgreedAmount = request.totalAgreedAmount
      ? convertCurrencyAmount(request.totalAgreedAmount, fromCurrency, user.defaultCurrency)
      : request.totalAgreedAmount;
    const depositAmount = request.depositAmount
      ? convertCurrencyAmount(request.depositAmount, fromCurrency, user.defaultCurrency)
      : request.depositAmount;
    const dueNow = depositAmount || totalAgreedAmount || quotedAmount;
    const paymentInstructions = replaceCurrencyAmountInText(request.paymentInstructions, user.defaultCurrency, dueNow);

    await prisma.projectRequest.update({
      where: { id: request.id },
      data: {
        quoteCurrency: user.defaultCurrency,
        quotedAmount,
        totalAgreedAmount,
        depositAmount,
        paymentInstructions
      }
    });

    console.log(`synced ${request.title || request.id} from ${fromCurrency} to ${user.defaultCurrency}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
