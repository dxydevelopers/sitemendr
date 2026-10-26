const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');
const prisma = new PrismaClient();

const resources = [
  {
    title: 'Getting Started Guide',
    description: 'Find project updates, contact the team, and manage a finished site from your Sitemendr workspace.',
    url: '/resources/getting-started',
    type: 'guide',
    legacyTitles: ['Dashboard Overview Video']
  },
  {
    title: 'Search Visibility Basics',
    description: 'A practical checklist for helping search engines understand and show your website.',
    url: '/resources/seo-basics',
    type: 'guide',
    legacyTitles: ['SEO Best Practices 2024']
  },
  {
    title: 'Performance Optimization Tips',
    description: 'Understand site checks, read point-in-time results, and ask for help with a specific issue.',
    url: '/resources/performance',
    type: 'guide',
    legacyTitles: []
  },
  {
    title: 'Custom Domain Setup',
    description: 'Register a domain with a provider you choose, then connect and verify it in Sitemendr.',
    url: '/resources/domains',
    type: 'guide',
    legacyTitles: []
  }
];

async function main() {
  if (process.env.ALLOW_SEED !== 'true') {
    logger.error('Seeding disabled. Set ALLOW_SEED=true to run this script.');
    process.exit(1);
  }
  logger.info('Seeding resources...');
  for (const resource of resources) {
    const { legacyTitles, ...data } = resource;
    const existing = await prisma.resource.findFirst({
      where: { title: { in: [data.title, ...legacyTitles] } },
      orderBy: { createdAt: 'asc' }
    });
    if (existing) await prisma.resource.update({ where: { id: existing.id }, data });
    else await prisma.resource.create({ data });
  }
  logger.info('Resources seeded successfully');
}

main()
  .catch((e) => {
    logger.error('Resource seeding failed', { error: e.message });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

