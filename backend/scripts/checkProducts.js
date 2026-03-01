const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config();

// Initialize Prisma Client
const prisma = new PrismaClient();

async function checkProducts() {
  try {
    console.log('📋 Checking products in PostgreSQL (Neon database)...\n');

    // Fetch all products from PostgreSQL
    const products = await prisma.product.findMany();
    
    console.log(`✅ Found ${products.length} products in PostgreSQL (Neon)\n`);
    
    if (products.length === 0) {
      console.log('⚠️  No products found in the database.');
    } else {
      console.log('Products:');
      products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Price: $${product.price}`);
        console.log(`   Stock: ${product.stock}`);
        console.log(`   Category: ${product.category || 'N/A'}`);
        console.log(`   Active: ${product.isActive ? 'Yes' : 'No'}`);
        console.log(`   Created: ${product.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('\n🗄️  PostgreSQL connection closed');
  }
}

// Run the check
checkProducts()
  .then(() => {
    console.log('\n✨ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
