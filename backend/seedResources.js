const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const resources = [
  {
    title: 'Getting Started Guide',
    description: 'Find project updates, contact the team, and manage a finished site from your Sitemendr workspace.',
    type: 'guide',
    url: '/resources/getting-started',
    legacyTitles: ['Getting Started with Sitemendr']
  },
  {
    title: 'Search Visibility Basics',
    description: 'A practical checklist for helping search engines understand and show your website.',
    type: 'guide',
    url: '/resources/seo-basics',
    legacyTitles: ['SEO Best Practices 2024']
  },
  {
    title: 'Performance Optimization Tips',
    description: 'Understand site checks, read point-in-time results, and ask for help with a specific issue.',
    type: 'guide',
    url: '/resources/performance',
    legacyTitles: ['Performance Optimization AI']
  },
  {
    title: 'Custom Domain Setup',
    description: 'Register a domain with a provider you choose, then connect and verify it in Sitemendr.',
    type: 'guide',
    url: '/resources/domains',
    legacyTitles: ['Domain Integration Protocol']
  },
  {
    title: 'Working with your site editor',
    description: 'Make focused changes and review a site safely before publishing.',
    type: 'guide',
    url: '/resources/editor',
    legacyTitles: ['Visual Editor Mastery']
  },
  {
    title: 'Commerce setup basics',
    description: 'Keep product, checkout, fulfillment, and customer updates connected.',
    type: 'guide',
    url: '/resources/commerce',
    legacyTitles: ['E-commerce Deployment']
  },
  {
    title: 'Security and account safety',
    description: 'Practical steps for protecting account access and connected services.',
    type: 'guide',
    url: '/resources/security',
    legacyTitles: ['Security & Compliance Matrix']
  }
];

async function main() {
  if (process.env.ALLOW_SEED !== 'true') {
    throw new Error('Seeding disabled. Set ALLOW_SEED=true to run this script.');
  }

  for (const resource of resources) {
    const { legacyTitles, ...data } = resource;
    const existing = await prisma.resource.findFirst({
      where: { title: { in: [data.title, ...legacyTitles] } },
      orderBy: { createdAt: 'asc' }
    });
    if (existing) await prisma.resource.update({ where: { id: existing.id }, data });
    else await prisma.resource.create({ data });
  }
}

main()
  .catch((error) => {
    console.error('Resource seeding failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
