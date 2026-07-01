const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugHandoff() {
  try {
    // Get all handoff/launched projects
    const projects = await prisma.projectRequest.findMany({
      where: {
        status: { in: ['handoff', 'launched', 'completed'] }
      },
      select: {
        id: true,
        status: true,
        clientNotes: true,
        handoffNotes: true,
        completionAcknowledgedAt: true,
        buildMilestones: {
          where: { title: 'Handoff' },
          select: {
            title: true,
            status: true,
            clientNote: true
          }
        }
      },
      take: 5
    });

    console.log('\n=== HANDOFF PROJECTS DEBUG ===\n');
    projects.forEach((p, i) => {
      console.log(`\n[${i + 1}] Project ID: ${p.id}`);
      console.log(`Status: ${p.status}`);
      console.log(`Client Notes: ${p.clientNotes || '(empty)'}`);
      console.log(`Handoff Notes: ${p.handoffNotes || '(empty)'}`);
      console.log(`Completion Acknowledged: ${p.completionAcknowledgedAt ? 'YES' : 'NO'}`);
      if (p.buildMilestones.length > 0) {
        console.log(`Handoff Milestone:`, p.buildMilestones[0]);
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }
}

debugHandoff();
