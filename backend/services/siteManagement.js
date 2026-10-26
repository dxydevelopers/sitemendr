const { prisma } = require('../config/db');

const isBuildManagementUnlocked = build => {
  if (!build) return true;
  // Existing subscriptions that did not come from the Build Journey remain manageable.
  const agreedTotal = Number(build.totalAgreedAmount || build.quotedAmount || 0);
  const remaining = Math.max(Math.round((agreedTotal - Number(build.depositAmount || 0)) * 100) / 100, 0);
  return build.status === 'completed'
    && Boolean(build.completionAcknowledgedAt)
    && !build.handoffIssuesReportedAt
    && (agreedTotal <= 0 || Boolean(build.paymentConfirmedAt))
    && (remaining <= 0 || Boolean(build.finalPaymentConfirmedAt));
};

async function getSiteManagementLockReason(userId, subscriptionId) {
  const build = await prisma.projectRequest.findFirst({
    where: { userId, subscriptionId, serviceType: 'build' },
    orderBy: { updatedAt: 'desc' },
    select: {
      status: true,
      completionAcknowledgedAt: true,
      handoffIssuesReportedAt: true,
      finalPaymentConfirmedAt: true,
      paymentConfirmedAt: true,
      totalAgreedAmount: true,
      quotedAmount: true,
      depositAmount: true
    }
  });

  return isBuildManagementUnlocked(build) ? null : 'Site management unlocks after handoff acceptance and payment closeout.';
}

module.exports = { isBuildManagementUnlocked, getSiteManagementLockReason };
