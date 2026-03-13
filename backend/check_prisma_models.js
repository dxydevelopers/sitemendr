const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('Available models in Prisma Client:');
const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
console.log(models.join(', '));

console.log('\nChecking specifically for supporterTier:');
console.log('prisma.supporterTier:', !!prisma.supporterTier);

prisma.$disconnect();
