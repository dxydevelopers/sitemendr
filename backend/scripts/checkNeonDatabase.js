const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config();

// Initialize Prisma Client
const prisma = new PrismaClient();

async function checkNeonDatabase() {
  try {
    console.log('🔍 Checking all data in Neon (PostgreSQL) database...\n');

    // Check Users
    const users = await prisma.user.findMany();
    console.log(`👥 Users: ${users.length}`);
    if (users.length > 0) {
      console.log('   Sample users:');
      users.slice(0, 3).forEach(user => {
        console.log(`   - ${user.name} (${user.email})`);
      });
    }

    // Check Products
    const products = await prisma.product.findMany();
    console.log(`\n📦 Products: ${products.length}`);
    if (products.length > 0) {
      console.log('   All products:');
      products.forEach(product => {
        console.log(`   - ${product.name} - $${product.price} (Stock: ${product.stock})`);
      });
    }

    // Check Orders
    const orders = await prisma.order.findMany();
    console.log(`\n📋 Orders: ${orders.length}`);
    if (orders.length > 0) {
      console.log('   Sample orders:');
      orders.slice(0, 3).forEach(order => {
        console.log(`   - Order ID: ${order.id} - Total: $${order.totalAmount} - Status: ${order.status}`);
      });
    }

    // Check Subscriptions
    const subscriptions = await prisma.subscription.findMany();
    console.log(`\n💳 Subscriptions: ${subscriptions.length}`);
    if (subscriptions.length > 0) {
      console.log('   Sample subscriptions:');
      subscriptions.slice(0, 3).forEach(sub => {
        console.log(`   - ${sub.siteName || sub.customName || 'Unnamed'} - Status: ${sub.status}`);
      });
    }

    // Check Blog Posts
    const blogPosts = await prisma.blogPost.findMany();
    console.log(`\n📝 Blog Posts: ${blogPosts.length}`);
    if (blogPosts.length > 0) {
      console.log('   Sample posts:');
      blogPosts.slice(0, 3).forEach(post => {
        console.log(`   - ${post.title} (${post.status})`);
      });
    }

    // Check Leads
    const leads = await prisma.lead.findMany();
    console.log(`\n🎯 Leads: ${leads.length}`);
    if (leads.length > 0) {
      console.log('   Sample leads:');
      leads.slice(0, 3).forEach(lead => {
        console.log(`   - ${lead.name} (${lead.email}) - Status: ${lead.status}`);
      });
    }

    // Check Services
    const services = await prisma.service.findMany();
    console.log(`\n🛠️  Services: ${services.length}`);
    if (services.length > 0) {
      console.log('   All services:');
      services.forEach(service => {
        console.log(`   - ${service.name} - $${service.price} - Duration: ${service.duration}min`);
      });
    }

    // Check Bookings
    const bookings = await prisma.booking.findMany();
    console.log(`\n📅 Bookings: ${bookings.length}`);
    if (bookings.length > 0) {
      console.log('   Sample bookings:');
      bookings.slice(0, 3).forEach(booking => {
        console.log(`   - ${booking.startTime} - Status: ${booking.status}`);
      });
    }

    // Check Payments
    const payments = await prisma.payment.findMany();
    console.log(`\n💰 Payments: ${payments.length}`);
    if (payments.length > 0) {
      console.log('   Sample payments:');
      payments.slice(0, 3).forEach(payment => {
        console.log(`   - ${payment.reference} - $${payment.amount} - Status: ${payment.status}`);
      });
    }

    // Check Assessments
    const assessments = await prisma.assessment.findMany();
    console.log(`\n📊 Assessments: ${assessments.length}`);

    // Check Support Tickets
    const supportTickets = await prisma.supportTicket.findMany();
    console.log(`\n🎫 Support Tickets: ${supportTickets.length}`);

    // Check Media
    const media = await prisma.media.findMany();
    console.log(`\n🖼️  Media Files: ${media.length}`);

    console.log('\n✅ Database check completed!');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('\n🗄️  PostgreSQL connection closed');
  }
}

// Run the check
checkNeonDatabase()
  .then(() => {
    console.log('\n✨ Check process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
