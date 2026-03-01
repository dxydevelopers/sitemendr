const { MongoClient } = require('mongodb');
const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_URL = process.env.DATABASE_URL;

// Initialize Prisma Client (for PostgreSQL - former database)
const prisma = new PrismaClient();

async function migrateProducts() {
  let mongoClient;
  
  try {
    console.log('🚀 Starting product migration from PostgreSQL (Neon) to MongoDB...\n');

    // Connect to MongoDB (new database)
    console.log('📦 Connecting to MongoDB (new database)...');
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB\n');

    // Get MongoDB database and collection
    const db = mongoClient.db();
    const productsCollection = db.collection('products');

    // Fetch all products from PostgreSQL (former database)
    console.log('📋 Fetching products from PostgreSQL (former database)...');
    const postgresProducts = await prisma.product.findMany();
    console.log(`✅ Found ${postgresProducts.length} products in PostgreSQL\n`);

    if (postgresProducts.length === 0) {
      console.log('⚠️  No products found in PostgreSQL. Migration complete.');
      return;
    }

    // Transform and insert products into MongoDB
    console.log('🔄 Migrating products to MongoDB...');
    let successCount = 0;
    let errorCount = 0;

    for (const pgProduct of postgresProducts) {
      try {
        // Transform PostgreSQL product to MongoDB format
        const productData = {
          name: pgProduct.name,
          description: pgProduct.description,
          price: pgProduct.price,
          image: pgProduct.image,
          category: pgProduct.category,
          stock: pgProduct.stock,
          isActive: pgProduct.isActive,
          createdAt: pgProduct.createdAt,
          updatedAt: pgProduct.updatedAt,
        };

        // Create product in MongoDB
        await productsCollection.insertOne(productData);

        successCount++;
        console.log(`✅ Migrated: ${productData.name}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating product ${pgProduct.name} (${pgProduct.id}):`, error.message);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successfully migrated: ${successCount} products`);
    console.log(`   ❌ Failed to migrate: ${errorCount} products`);
    console.log(`   📦 Total processed: ${postgresProducts.length} products\n`);

    if (successCount > 0) {
      console.log('🎉 Migration completed successfully!');
    } else {
      console.log('⚠️  No products were migrated. Please check the errors above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close connections
    if (mongoClient) {
      await mongoClient.close();
      console.log('📦 MongoDB connection closed');
    }
    await prisma.$disconnect();
    console.log('🗄️  PostgreSQL connection closed');
  }
}

// Run the migration
migrateProducts()
  .then(() => {
    console.log('\n✨ Migration process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error during migration:', error);
    process.exit(1);
  });
