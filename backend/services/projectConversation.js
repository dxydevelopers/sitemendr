const { prisma } = require('../config/db');
const { notifyUser, notifyAdmins } = require('./socketService');

async function recordProjectEvent(projectRequestId, type, message, eventData = {}) {
  const request = await prisma.projectRequest.findFirst({
    where: { id: projectRequestId, serviceType: 'build' },
    select: { id: true, userId: true }
  });
  if (!request) return null;

  const event = await prisma.projectConversationMessage.create({
    data: {
      projectRequestId,
      senderRole: 'system',
      kind: 'event',
      message,
      eventData: { type, ...eventData }
    }
  });
  const payload = { requestId: projectRequestId, message: event };
  notifyUser(request.userId, 'project_conversation_message', payload);
  notifyAdmins('project_conversation_message', payload);
  return event;
}

module.exports = { recordProjectEvent };
