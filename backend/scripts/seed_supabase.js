const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  if (process.env.ALLOW_SEED !== 'true') {
    console.error('Seeding disabled. Set ALLOW_SEED=true to run this script.');
    process.exit(1);
  }
  console.log('Seeding Supabase...');

  const adminEmail = 'admin@sitemendr.com';
  const adminId = '65bb3e76c720c24a68656660';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  const shouldUpdatePassword = true;

  if (!process.env.ADMIN_SEED_PASSWORD) {
    console.error('ADMIN_SEED_PASSWORD is required to seed admin user.');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  // Create an admin user first if not exists
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Admin User',
      role: 'admin',
      ...(shouldUpdatePassword ? { password: hashedPassword } : {})
    },
    create: {
      id: adminId,
      name: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    }
  });

  // Seed Blog Post
  await prisma.blogPost.upsert({
    where: { slug: 'how-to-build-professional-website-2024' },
    update: {
      title: 'How to Build a Professional Website in 2024',
      excerpt: 'Learn the key steps to creating a stunning website that converts visitors into customers.',
      content: 'In this comprehensive guide, we walk you through the essential steps to building a professional website that not only looks great but also drives real business results. From choosing the right design to optimizing for search engines, we cover everything you need to know.',
      status: 'published',
      authorId: admin.id,
      publishedAt: new Date()
    },
    create: {
      title: 'How to Build a Professional Website in 2024',
      slug: 'how-to-build-professional-website-2024',
      excerpt: 'Learn the key steps to creating a stunning website that converts visitors into customers.',
      content: 'In this comprehensive guide, we walk you through the essential steps to building a professional website that not only looks great but also drives real business results. From choosing the right design to optimizing for search engines, we cover everything you need to know.',
      status: 'published',
      authorId: admin.id,
      publishedAt: new Date()
    }
  });
  console.log('Seed: Blog post created');

  // Seed Product (idempotent)
  const existingProduct = await prisma.product.findFirst({
    where: { name: 'Professional Website Package' }
  });
  if (existingProduct) {
    await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        description: 'Full-featured professional website with custom design, mobile responsiveness, and SEO optimization.',
        price: 49900,
        stock: 100,
        category: 'Development',
        isActive: true
      }
    });
  } else {
    await prisma.product.create({
      data: {
        name: 'Professional Website Package',
        description: 'Full-featured professional website with custom design, mobile responsiveness, and SEO optimization.',
        price: 49900,
        stock: 100,
        category: 'Development'
      }
    });
  }
  console.log('Seed: Product created');

  // Seed Service (idempotent)
  const existingService = await prisma.service.findFirst({
    where: { name: 'Website Consultation' }
  });
  if (existingService) {
    await prisma.service.update({
      where: { id: existingService.id },
      data: {
        description: '1-hour strategy session to discuss your website goals and requirements.',
        duration: 60,
        price: 15000,
        isActive: true
      }
    });
  } else {
    await prisma.service.create({
      data: {
        name: 'Website Consultation',
        description: '1-hour strategy session to discuss your website goals and requirements.',
        duration: 60,
        price: 15000
      }
    });
  }
  console.log('Seed: Service created');

  console.log('Supabase seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

