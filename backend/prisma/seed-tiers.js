const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tiers = [
  {
    name: 'Starter Supporter',
    slug: 'starter',
    description: 'Support the evolution of Sitemendr and unlock core perks.',
    monthlyPrice: 5,
    discountPercent: 5,
    displayOrder: 1,
    isActive: true,
    perks: ['exclusive-badge', 'supporter-wall', 'community-access'],
  },
  {
    name: 'Standard Supporter',
    slug: 'standard',
    description: 'Elevate your support with more rewards and voting rights.',
    monthlyPrice: 15,
    discountPercent: 10,
    displayOrder: 2,
    isActive: true,
    perks: ['early-access', 'voting-rights', 'starter-perks'],
  },
  {
    name: 'Plus Supporter',
    slug: 'plus',
    description: 'Directly influence the product roadmap with council access.',
    monthlyPrice: 30,
    discountPercent: 15,
    displayOrder: 3,
    isActive: true,
    perks: ['roundtable-invites', 'product-council', 'standard-perks'],
  },
  {
    name: 'Premium Supporter',
    slug: 'premium',
    description: 'Maximum benefits and high-impact contribution.',
    monthlyPrice: 60,
    discountPercent: 20,
    displayOrder: 4,
    isActive: true,
    perks: ['ama-access', 'spotlight-status', 'plus-perks'],
  },
  {
    name: 'Founders Circle',
    slug: 'founders-circle',
    description: 'The ultimate way to support Sitemendr and its founders.',
    monthlyPrice: 100,
    discountPercent: 25,
    displayOrder: 5,
    isActive: true,
    perks: ['private-sessions', 'vip-support', 'premium-perks'],
  },
];

async function main() {
  console.log('Seeding supporter tiers...');
  
  for (const tier of tiers) {
    await prisma.supporterTier.upsert({
      where: { slug: tier.slug },
      update: tier,
      create: tier,
    });
    console.log(`- Seeded ${tier.name}`);
  }
  
  console.log('Supporter tiers seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
