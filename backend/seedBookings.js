const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const services = [
    {
      name: 'UI/UX Design Review',
      description: 'Professional design review of your site architecture by our lead architects.',
      duration: 45,
      price: 150,
      isActive: true
    },
    {
      name: 'Performance Optimization Consultation',
      description: 'Deep dive into your site performance metrics with tailored optimization strategy.',
      duration: 60,
      price: 200,
      isActive: true
    },
    {
      name: 'Security Audit & Hardening',
      description: 'Comprehensive security review and implementation of advanced protection protocols.',
      duration: 90,
      price: 350,
      isActive: true
    },
    {
      name: 'Custom Module Integration',
      description: 'Consultation for building and deploying bespoke functional modules to your node.',
      duration: 60,
      price: 250,
      isActive: true
    },
    {
      name: 'Digital Strategy Session',
      description: 'Strategic planning session to maximize your ROI and scaling potential.',
      duration: 45,
      price: 180,
      isActive: true
    }
  ];

  console.log('Seeding booking services...');

  for (const service of services) {
    const slug = service.name.toLowerCase().replace(/\s+/g, '-');
    await prisma.service.upsert({
      where: { id: slug },
      update: service,
      create: {
        ...service,
        id: slug
      }
    });
  }

  console.log('Booking services seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
