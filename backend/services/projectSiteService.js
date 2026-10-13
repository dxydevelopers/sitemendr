const { prisma } = require('../config/db');
const { notifyUser, notifyAdmins } = require('./socketService');

/**
 * Link a fully accepted and settled Build request to the client's managed-site
 * area. This is idempotent so payment callbacks and admin closeout can safely
 * converge on the same site record.
 */
async function ensureCompletedBuildSite(projectRequestId) {
  let createdSite = false;
  const site = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${projectRequestId}))`;
    const request = await tx.projectRequest.findFirst({
      where: { id: projectRequestId, serviceType: 'build' },
      select: {
        id: true,
        userId: true,
        quoteCurrency: true,
        subscriptionId: true,
        status: true,
        title: true,
        businessName: true,
        packageIntent: true,
        launchUrl: true,
        quotedAmount: true,
        totalAgreedAmount: true,
        depositAmount: true,
        paymentConfirmedAt: true,
        finalPaymentConfirmedAt: true,
        completionAcknowledgedAt: true,
        handoffIssuesReportedAt: true,
        completedAt: true
      }
    });

    if (!request || request.status !== 'completed' || !request.completionAcknowledgedAt || request.handoffIssuesReportedAt) return null;
    const agreedTotal = Number(request.totalAgreedAmount || request.quotedAmount || 0);
    const deposit = Number(request.depositAmount || 0);
    const remaining = Math.max(Math.round((agreedTotal - deposit) * 100) / 100, 0);
    if ((agreedTotal > 0 && !request.paymentConfirmedAt) || (remaining > 0 && !request.finalPaymentConfirmedAt)) return null;

    if (request.subscriptionId) {
      return tx.subscription.findFirst({
        where: { id: request.subscriptionId, userId: request.userId },
        include: { milestones: { orderBy: { order: 'asc' } } }
      });
    }

    let domain = null;
    try {
      domain = new URL(request.launchUrl).host || null;
    } catch {
      domain = null;
    }

    const paidPayments = await tx.payment.findMany({
      where: {
        userId: request.userId,
        status: 'completed',
        serviceType: { in: ['build_agreement', 'build_final_balance'] },
        metadata: { path: ['projectRequestId'], equals: request.id }
      },
      select: { amount: true }
    });
    const totalPaid = paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0) / 100, 0);
    const validTiers = new Set(['ai_foundation', 'pro_enhancement', 'enterprise', 'self_hosted']);
    const tier = validTiers.has(String(request.packageIntent || '')) ? request.packageIntent : 'enterprise';

    const site = await tx.subscription.create({
      data: {
        userId: request.userId,
        siteName: request.businessName || request.title || 'Completed build',
        tier,
        planType: 'self_hosted',
        price: agreedTotal || null,
        totalPaid,
        lastPaymentDate: request.finalPaymentConfirmedAt || request.paymentConfirmedAt || request.completedAt || new Date(),
        expiresAt: null,
        domain,
        status: 'active',
        milestones: {
          create: [
            { title: 'Build delivery', status: 'completed', progress: 100, order: 1 },
            { title: 'Client handoff', status: 'completed', progress: 100, order: 2 },
            { title: 'Payment closeout', status: 'completed', progress: 100, order: 3 }
          ]
        }
      }
    });

    const linked = await tx.projectRequest.updateMany({
      where: { id: request.id, subscriptionId: null },
      data: { subscriptionId: site.id }
    });
    if (linked.count === 1) {
      createdSite = true;
      return {
        ...site,
        milestones: await tx.milestone.findMany({ where: { subscriptionId: site.id }, orderBy: { order: 'asc' } })
      };
    }

    await tx.milestone.deleteMany({ where: { subscriptionId: site.id } });
    await tx.subscription.delete({ where: { id: site.id } });
    const latest = await tx.projectRequest.findUnique({ where: { id: request.id }, select: { subscriptionId: true } });
    return latest?.subscriptionId
      ? tx.subscription.findFirst({
          where: { id: latest.subscriptionId, userId: request.userId },
          include: { milestones: { orderBy: { order: 'asc' } } }
        })
      : null;
  });

  if (createdSite && site) {
    const payload = { requestId: projectRequestId, siteId: site.id };
    notifyUser(site.userId, 'build_site_linked', payload);
    notifyAdmins('build_site_linked', payload);
  }
  return site;
}

module.exports = { ensureCompletedBuildSite };
