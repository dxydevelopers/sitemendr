const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');
const prisma = new PrismaClient();

const resources = [
  {
    title: 'Getting Started Guide',
    description: 'Find project updates, contact the team, and manage a finished site from your Sitemendr workspace.',
    url: '/resources/getting-started',
    type: 'guide',
    legacyTitles: ['Getting Started with Sitemendr', 'Dashboard Overview Video']
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
    legacyTitles: ['Performance Optimization AI']
  },
  {
    title: 'Custom Domain Setup',
    description: 'Register a domain with a provider you choose, then connect and verify it in Sitemendr.',
    url: '/resources/domains',
    type: 'guide',
    legacyTitles: ['Domain Integration Protocol']
  },
  {
    title: 'Working with your site editor',
    description: 'Make focused changes and review a site safely before publishing.',
    url: '/resources/editor',
    type: 'guide',
    legacyTitles: ['Visual Editor Mastery']
  },
  {
    title: 'Commerce setup basics',
    description: 'Keep product, checkout, fulfillment, and customer updates connected.',
    url: '/resources/commerce',
    type: 'guide',
    legacyTitles: ['E-commerce Deployment']
  },
  {
    title: 'Security and account safety',
    description: 'Practical steps for protecting account access and connected services.',
    url: '/resources/security',
    type: 'guide',
    legacyTitles: ['Security & Compliance Matrix']
  }
];

async function main() {
  if (process.env.ALLOW_SEED !== 'true') {
    throw new Error('Seeding disabled. Set ALLOW_SEED=true to run this script.');
  }
  logger.info('Seeding client resources...');
  for (const resource of resources) {
    const { legacyTitles, ...data } = resource;
    const existing = await prisma.resource.findFirst({
      where: { title: { in: [data.title, ...legacyTitles] } },
      orderBy: { createdAt: 'asc' }
    });
    // Keep admin-managed body text, publish state, and resource identity intact.
    if (existing) await prisma.resource.update({ where: { id: existing.id }, data });
    else await prisma.resource.create({ data });
  }
  logger.info('Client resources seeded successfully');
}

main()
  .catch((error) => {
    logger.error('Resource seeding failed', { error: error.message });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
