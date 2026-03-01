const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSupport() {
  try {
    console.log('Testing SupportTicket query...');
    const tickets = await prisma.supportTicket.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    console.log('Success! Found', tickets.length, 'tickets');
    process.exit(0);
  } catch (err) {
    console.error('Error during SupportTicket query:', err);
    process.exit(1);
  }
}

testSupport();
