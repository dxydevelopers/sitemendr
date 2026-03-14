const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const resources = [
    {
      title: 'Getting Started with Sitemendr',
      description: 'A comprehensive guide to launching your first AI-driven website protocol.',
      type: 'GUIDE',
      url: 'https://docs.zencoder.ai/getting-started',
      content: 'Learn how to configure your node, select a blueprint, and deploy to the global CDN.'
    },
    {
      title: 'Visual Editor Mastery',
      description: 'Master the high-fidelity visual content editor to refine your site architecture.',
      type: 'DOCUMENTATION',
      url: 'https://docs.zencoder.ai/editor',
      content: 'Detailed documentation on using the visual editor, neural rewriting, and asset management.'
    },
    {
      title: 'Domain Integration Protocol',
      description: 'Step-by-step instructions for connecting your custom domain to our infrastructure.',
      type: 'GUIDE',
      url: 'https://docs.zencoder.ai/domains',
      content: 'DNS configuration details for various providers including Cloudflare, GoDaddy, and Namecheap.'
    },
    {
      title: 'E-commerce Deployment',
      description: 'Learn how to activate and manage your digital storefront modules.',
      type: 'GUIDE',
      url: 'https://docs.zencoder.ai/ecommerce',
      content: 'Configuring product catalogs, payment gateways, and inventory tracking systems.'
    },
    {
      title: 'Performance Optimization AI',
      description: 'Technical deep dive into how our AI optimizes your site for Core Web Vitals.',
      type: 'DOCUMENTATION',
      url: 'https://docs.zencoder.ai/performance',
      content: 'Understanding FCP, LCP, and CLS optimizations performed automatically by Sitemendr.'
    },
    {
      title: 'Security & Compliance Matrix',
      description: 'Overview of the security protocols protecting your node and data integrity.',
      type: 'DOCUMENTATION',
      url: 'https://docs.zencoder.ai/security',
      content: 'Information about SSL encryption, DDoS protection, and data privacy standards.'
    }
  ];

  console.log('Seeding resources...');

  for (const resource of resources) {
    await prisma.resource.upsert({
      where: { id: resource.title.toLowerCase().replace(/\s+/g, '-') },
      update: resource,
      create: {
        ...resource,
        id: resource.title.toLowerCase().replace(/\s+/g, '-')
      }
    });
  }

  console.log('Resources seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
