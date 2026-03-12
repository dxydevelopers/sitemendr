const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tiers = [
    {
      name: 'Starter Supporter',
      slug: 'starter',
      description: 'The essential supporter tier to help us grow.',
      monthlyPrice: 5,
      discountPercent: 5,
      displayOrder: 1,
      perks: ['exclusive-badge', 'supporter-wall', 'community-access'],
    },
    {
      name: 'Standard Supporter',
      slug: 'standard',
      description: 'More rewards and early access to new features.',
      monthlyPrice: 15,
      discountPercent: 10,
      displayOrder: 2,
      perks: ['early-access', 'voting-rights', 'starter-perks'],
    },
    {
      name: 'Plus Supporter',
      slug: 'plus',
      description: 'Deeply involved in our product direction.',
      monthlyPrice: 30,
      discountPercent: 15,
      displayOrder: 3,
      perks: ['roundtable-invites', 'product-council', 'standard-perks'],
    },
    {
      name: 'Premium Supporter',
      slug: 'premium',
      description: 'High-level access and public spotlight.',
      monthlyPrice: 60,
      discountPercent: 20,
      displayOrder: 4,
      perks: ['ama-access', 'spotlight-status', 'plus-perks'],
    },
    {
      name: 'Founders Circle',
      slug: 'founders-circle',
      description: 'The ultimate tier for our most dedicated partners.',
      monthlyPrice: 100,
      discountPercent: 25,
      displayOrder: 5,
      perks: ['private-sessions', 'vip-support', 'premium-perks'],
    },
  ];

  console.log('Seeding supporter tiers...');

  for (const tier of tiers) {
    const upsertedTier = await prisma.supporterTier.upsert({
      where: { slug: tier.slug },
      update: tier,
      create: tier,
    });
    console.log(`- Upserted tier: ${upsertedTier.name} (${upsertedTier.id})`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
