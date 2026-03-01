const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');
const prisma = new PrismaClient();

const resources = [
  {
    title: 'Getting Started Guide',
    description: 'A comprehensive guide on how to use the Sitemendr dashboard and manage your digital infrastructure.',
    url: '/resources/getting-started',
    type: 'guide'
  },
  {
    title: 'SEO Best Practices 2024',
    description: 'Learn the latest strategies to rank your website higher on search engines.',
    url: 'https://example.com/seo-guide',
    type: 'documentation'
  },
  {
    title: 'Dashboard Overview Video',
    description: 'A 5-minute video walkthrough of all the features available in your client dashboard.',
    url: 'https://youtube.com/sitemendr-walkthrough',
    type: 'tool'
  },
  {
    title: 'Performance Optimization Tips',
    description: 'How to keep your site running at sub-second speeds using our edge network.',
    url: '/resources/performance',
    type: 'guide'
  },
  {
    title: 'Custom Domain Setup',
    description: 'Step-by-step instructions for connecting your own domain to Sitemendr.',
    url: '/resources/domains',
    type: 'documentation'
  }
];

async function main() {
  if (process.env.ALLOW_SEED !== 'true') {
    logger.error('Seeding disabled. Set ALLOW_SEED=true to run this script.');
    process.exit(1);
  }
  logger.info('Seeding resources...');
  for (const resource of resources) {
    await prisma.resource.create({
      data: resource
    });
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

