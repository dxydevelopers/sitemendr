require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('connect_timeout=')) {
  process.env.DATABASE_URL = `${process.env.DATABASE_URL}&connect_timeout=30`;
}

const prisma = new PrismaClient();

const defaultBuildMilestones = [
  {
    title: 'Scope lock',
    description: 'Confirm requirements, deliverables, access, and the working plan.',
    status: 'completed',
    progress: 100,
    order: 1
  },
  {
    title: 'Experience design',
    description: 'Shape the screens, flows, and interface direction before build-out.',
    status: 'in_progress',
    progress: 20,
    order: 2
  },
  {
    title: 'Development',
    description: 'Build the approved product features and connect required integrations.',
    status: 'pending',
    progress: 0,
    order: 3
  },
  {
    title: 'Staging review',
    description: 'Prepare a staging version for client checks and final adjustments.',
    status: 'pending',
    progress: 0,
    order: 4
  },
  {
    title: 'Launch',
    description: 'Move the approved build live and verify the production setup.',
    status: 'pending',
    progress: 0,
    order: 5
  },
  {
    title: 'Handoff',
    description: 'Share access, notes, and any final operating guidance.',
    status: 'pending',
    progress: 0,
    order: 6
  }
];

async function main() {
  const requestIdOrTitle = process.argv[2];
  if (!requestIdOrTitle) {
    throw new Error('Usage: node scripts/resetBuildStartMilestones.js <project-request-id-or-title>');
  }

  const request = await prisma.projectRequest.findFirst({
    where: {
      serviceType: 'build',
      OR: [
        { id: requestIdOrTitle },
        { title: requestIdOrTitle }
      ]
    },
    select: { id: true, title: true }
  });

  if (!request) {
    throw new Error(`Build request not found: ${requestIdOrTitle}`);
  }

  await prisma.buildMilestone.deleteMany({
    where: { projectRequestId: request.id }
  });

  await prisma.buildMilestone.createMany({
    data: defaultBuildMilestones.map((milestone) => ({
      projectRequestId: request.id,
      ...milestone
    }))
  });

  console.log(`Reset build milestones for ${request.title || request.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
