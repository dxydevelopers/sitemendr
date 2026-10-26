const { prisma } = require('../config/db');
const { notifyUser, notifyAdmins } = require('./socketService');

// Sends at most two in-app reminders for a seven-day repair review window.
// An overdue review stays open until the client or Sitemendr takes an action.
exports.runRepairReviewReminders = async () => {
  const requests = await prisma.projectRequest.findMany({
    where: { serviceType: 'repair', status: 'ready_for_review' },
    select: { id: true, userId: true, title: true, repairContext: true }
  });
  const now = Date.now();
  let reminders = 0, overdue = 0;
  for (const request of requests) {
    const context = request.repairContext && typeof request.repairContext === 'object' ? request.repairContext : {};
    const dueAt = Date.parse(context.reviewDueAt || '');
    if (!Number.isFinite(dueAt)) continue;
    const count = Math.max(0, Number(context.reviewReminderCount) || 0);
    const threshold = dueAt - (count === 0 ? 3 : 1) * 86400000;
    if (count < 2 && now >= threshold) {
      const sent = await prisma.$transaction(async tx => {
        const current = await tx.projectRequest.findFirst({ where: { id: request.id, serviceType: 'repair', status: 'ready_for_review' }, select: { repairContext: true } });
        const latest = current?.repairContext && typeof current.repairContext === 'object' ? current.repairContext : {};
        if ((Number(latest.reviewReminderCount) || 0) !== count || latest.reviewDueAt !== context.reviewDueAt) return false;
        await tx.projectRequest.update({ where: { id: request.id }, data: { repairContext: { ...latest, reviewReminderCount: count + 1, lastReviewReminderAt: new Date(now).toISOString() } } });
        await tx.projectConversationMessage.create({ data: { projectRequestId: request.id, senderRole: 'system', kind: 'event', message: `Reminder ${count + 1} of 2: your repair is ready for review. You can accept it, request an in-scope change, or extend the review period once. No response will not count as acceptance.`, eventData: { type: 'repair_review_reminder', reminder: count + 1, reviewDueAt: context.reviewDueAt } } });
        return true;
      });
      if (!sent) continue;
      notifyUser(request.userId, 'repair_review_reminder', { requestId: request.id, title: request.title, dueAt: context.reviewDueAt, reminder: count + 1 });
      reminders += 1;
    } else if (count >= 2 && now > dueAt && context.reviewOverdue !== true) {
      const next = { ...context, reviewOverdue: true, reviewOverdueAt: new Date(now).toISOString() };
      await prisma.projectRequest.update({ where: { id: request.id }, data: { repairContext: next } });
      await prisma.projectConversationMessage.create({ data: { projectRequestId: request.id, senderRole: 'system', kind: 'event', message: 'The repair review window passed. The request remains open and has been sent to Sitemendr for follow-up; it was not automatically accepted.', eventData: { type: 'repair_review_overdue', reviewDueAt: context.reviewDueAt } } });
      notifyAdmins('repair_review_overdue', { requestId: request.id, userId: request.userId, title: request.title });
      overdue += 1;
    }
  }
  return { reminders, overdue };
};
