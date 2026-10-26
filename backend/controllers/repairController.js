const { prisma } = require('../config/db');
const { notifyUser, notifyAdmins } = require('../services/socketService');
const logger = require('../config/logger');
const invoiceNumber = () => `SMI-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${require('crypto').randomBytes(4).toString('hex').toUpperCase()}`;

const publicUrl = value => {
  try {
    const url = new URL(String(value));
    return ['http:', 'https:'].includes(url.protocol) && !/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname);
  } catch { return false; }
};
const requestSelect = { id: true, userId: true, title: true, serviceType: true, status: true, priority: true, summary: true, repairContext: true, createdAt: true, updatedAt: true, quoteVersions: { orderBy: { version: 'desc' } }, conversationMessages: { orderBy: { createdAt: 'asc' } }, subscription: { select: { id: true, siteName: true, customName: true, domain: true } }, user: { select: { id: true, name: true, email: true } } };
const event = (tx, id, type, message, data = {}) => tx.projectConversationMessage.create({ data: { projectRequestId: id, senderRole: 'system', kind: 'event', message, eventData: { type, ...data } } });

exports.getClientRepairRequests = async (req, res) => {
  const data = await prisma.projectRequest.findMany({ where: { userId: req.user.userId, serviceType: 'repair' }, include: requestSelect, orderBy: { updatedAt: 'desc' } });
  const invoices = data.length ? await prisma.billingInvoice.findMany({ where: { userId: req.user.userId, projectRequestId: { in: data.map(request => request.id) } }, orderBy: { issuedAt: 'desc' } }) : [];
  const byRequest = new Map();
  for (const invoice of invoices) byRequest.set(invoice.projectRequestId, [...(byRequest.get(invoice.projectRequestId) || []), invoice]);
  for (const request of data) request.billingInvoices = byRequest.get(request.id) || [];
  res.json({ success: true, data });
};

exports.createRepairRequest = async (req, res) => {
  const { siteUrl, title, description, steps, affectedPages, urgency, hostType, siteId, evidence } = req.body || {};
  if (!title?.trim() || title.trim().length > 180 || !description?.trim() || description.trim().length > 5000) return res.status(400).json({ success: false, message: 'Add a short issue title and describe what is happening (up to 5,000 characters).' });
  if (!['sitemendr', 'external'].includes(hostType)) return res.status(400).json({ success: false, message: 'Choose whether this is a Sitemendr or external site.' });
  if (hostType === 'external' && !publicUrl(siteUrl)) return res.status(400).json({ success: false, message: 'Enter a public website URL starting with http:// or https://.' });
  if (!['normal', 'urgent'].includes(urgency)) return res.status(400).json({ success: false, message: 'Choose a valid urgency.' });
  if (hostType === 'sitemendr' && !siteId) return res.status(400).json({ success: false, message: 'Choose the Sitemendr site that needs repair.' });
  if (hostType === 'sitemendr') {
    const site = await prisma.subscription.findFirst({ where: { id: siteId, userId: req.user.userId }, select: { id: true } });
    if (!site) return res.status(403).json({ success: false, message: 'Choose a site in your workspace.' });
  }
  const links = Array.isArray(evidence) ? evidence.filter(item => typeof item === 'string' && publicUrl(item)).slice(0, 5) : [];
  const data = await prisma.projectRequest.create({ data: {
    userId: req.user.userId, subscriptionId: hostType === 'sitemendr' ? siteId : null, serviceType: 'repair',
    title: title.trim(), summary: description.trim(), priority: urgency,
    status: 'submitted', repairContext: { hostType, siteUrl: hostType === 'external' ? new URL(siteUrl).origin : null, steps: String(steps || '').slice(0, 5000), affectedPages: String(affectedPages || '').slice(0, 2000), evidence: links, diagnosisFee: hostType === 'sitemendr' ? 0 : null, diagnosisFeeStatus: hostType === 'sitemendr' ? 'included' : 'pending_review', reviewReminderCount: 0 }
  } });
  await prisma.projectConversationMessage.create({ data: { projectRequestId: data.id, senderId: req.user.userId, senderRole: 'client', message: description.trim() } });
  notifyAdmins('repair_request_created', { request: data });
  res.status(201).json({ success: true, data });
};

exports.respondToRepairProposal = async (req, res) => {
  const { action, termsAccepted } = req.body || {};
  const request = await prisma.projectRequest.findFirst({ where: { id: req.params.requestId, userId: req.user.userId, serviceType: 'repair' }, include: { quoteVersions: { where: { status: 'sent' }, orderBy: { version: 'desc' }, take: 1 } } });
  const quote = request?.quoteVersions?.[0];
  if (!request || request.status !== 'proposal_ready' || !quote) return res.status(409).json({ success: false, message: 'There is no current repair proposal to respond to.' });
  if (!['accept', 'decline'].includes(action)) return res.status(400).json({ success: false, message: 'Choose accept or decline.' });
  if (action === 'accept' && termsAccepted !== true) return res.status(400).json({ success: false, message: 'Accept the repair scope and payment terms before continuing.' });
  const isChangeOrder = request.repairContext?.proposalKind === 'change_order';
  const nextStatus = action === 'accept' ? 'awaiting_payment' : isChangeOrder ? 'in_progress' : 'declined';
  await prisma.$transaction(async tx => {
    await tx.projectQuoteVersion.update({ where: { id: quote.id }, data: { status: action === 'accept' ? 'accepted' : 'declined', ...(action === 'accept' ? { acceptedAt: new Date() } : {}) } });
    if (action === 'decline' && isChangeOrder) await tx.billingInvoice.updateMany({ where: { projectRequestId: request.id, stage: `repair_change_${quote.version}`, status: 'open' }, data: { status: 'void', voidedAt: new Date() } });
    await tx.projectRequest.update({ where: { id: request.id }, data: { status: nextStatus } });
    await event(tx, request.id, `repair_proposal_${action}`, action === 'accept' ? 'The client accepted the repair proposal and its terms.' : isChangeOrder ? 'The client declined the change order. The already approved repair will continue within its original scope.' : 'The client declined the repair proposal.', { quoteVersionId: quote.id, changeOrder: isChangeOrder });
  });
  notifyAdmins('repair_request_updated', { requestId: request.id, status: nextStatus });
  res.json({ success: true, data: { status: nextStatus } });
};

exports.respondToRepairReview = async (req, res) => {
  const { action, message } = req.body || {};
  const request = await prisma.projectRequest.findFirst({ where: { id: req.params.requestId, userId: req.user.userId, serviceType: 'repair', status: 'ready_for_review' } });
  if (!request) return res.status(409).json({ success: false, message: 'This repair is not waiting for client review.' });
  if (!['accept', 'changes', 'extend'].includes(action)) return res.status(400).json({ success: false, message: 'Choose accept, request an in-scope change, or request an extension.' });
  if (action === 'extend') {
    const context = request.repairContext && typeof request.repairContext === 'object' ? request.repairContext : {};
    if (Number(context.reviewExtensionCount || 0) >= 1) return res.status(409).json({ success: false, message: 'The review period has already been extended once. Message the team if you need more time.' });
    const dueAt = new Date(Date.now() + 7 * 86400000).toISOString();
    const updated = await prisma.projectRequest.update({ where: { id: request.id }, data: { repairContext: { ...context, reviewDueAt: dueAt, reviewReminderCount: 0, reviewExtensionCount: 1, reviewOverdue: false } } });
    await prisma.projectConversationMessage.create({ data: { projectRequestId: request.id, senderId: req.user.userId, senderRole: 'client', message: 'Please extend my repair review period by seven days.' } });
    notifyAdmins('repair_request_updated', { request: updated });
    return res.json({ success: true, data: { status: 'ready_for_review', reviewDueAt: dueAt } });
  }
  await prisma.$transaction(async tx => {
    const balance = await tx.billingInvoice.findFirst({ where: { projectRequestId: request.id, stage: { startsWith: 'repair_balance_' }, status: { in: ['open', 'processing'] } } });
    const status = action === 'changes' ? 'in_progress' : balance ? 'awaiting_final_payment' : 'completed';
    await tx.projectRequest.update({ where: { id: request.id }, data: { status, ...(status === 'completed' ? { completedAt: new Date() } : {}) } });
    await event(tx, request.id, action === 'accept' ? 'repair_accepted' : 'repair_changes_requested', action === 'accept' ? 'The client accepted the repair delivery.' : 'The client requested an in-scope repair change.', { message: String(message || '').slice(0, 3000) });
  });
  notifyAdmins('repair_request_updated', { requestId: request.id });
  res.json({ success: true, data: { status: action === 'accept' ? 'awaiting_final_payment' : 'in_progress' } });
};

exports.requestRepairCancellation = async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const request = await prisma.projectRequest.findFirst({ where: { id: req.params.requestId, userId: req.user.userId, serviceType: 'repair' } });
  if (!request) return res.status(404).json({ success: false, message: 'Repair request not found.' });
  if (!message || message.length > 2000) return res.status(400).json({ success: false, message: 'Add a short reason for cancelling (up to 2,000 characters).' });
  if (['completed', 'cancelled', 'declined', 'cancel_requested'].includes(request.status)) return res.status(409).json({ success: false, message: 'This repair cannot accept a cancellation request in its current state.' });
  const result = await prisma.$transaction(async tx => {
    const locked = await tx.$queryRawUnsafe(`SELECT "status" FROM "ProjectRequest" WHERE "id"=$1 AND "userId"=$2 FOR UPDATE`, request.id, req.user.userId);
    if (!locked.length || locked[0].status !== request.status) return null;
    const pendingCheckout = await tx.payment.findFirst({ where: { userId: request.userId, serviceType: 'repair_payment', status: { in: ['pending', 'processing'] }, metadata: { path: ['projectRequestId'], equals: request.id } }, select: { id: true } });
    if (pendingCheckout) return { checkoutPending: true };
    const changed = await tx.projectRequest.updateMany({ where: { id: request.id, userId: request.userId, serviceType: 'repair', status: request.status }, data: { status: 'cancel_requested' } });
    if (!changed.count) return null;
    const createdMessage = await tx.projectConversationMessage.create({ data: { projectRequestId: request.id, senderId: req.user.userId, senderRole: 'system', kind: 'event', message: `Client requested repair cancellation. Reason: ${message}`, eventData: { type: 'repair_cancel_requested', lifecycleStatus: 'pending', previousStatus: request.status, reason: message } } });
    return { message: createdMessage };
  });
  if (result?.checkoutPending) return res.status(409).json({ success: false, message: 'A payment checkout is still active. Wait for it to finish or fail, then request cancellation.' });
  if (!result) return res.status(409).json({ success: false, message: 'The repair stage changed. Refresh and try again.' });
  notifyAdmins('repair_cancellation_requested', { requestId: request.id, message: result.message });
  notifyUser(req.user.userId, 'repair_request_updated', { requestId: request.id, status: 'cancel_requested' });
  res.json({ success: true, data: result.message, message: 'Cancellation sent to Sitemendr for settlement review.' });
};

exports.setRepairDiagnosisFee = async (req, res) => {
  const fee = Number(req.body?.fee);
  const currency = String(req.body?.currency || 'USD').toUpperCase();
  const report = String(req.body?.report || '').trim();
  const request = await prisma.projectRequest.findFirst({ where: { id: req.params.id, serviceType: 'repair' } });
  if (!request || request.repairContext?.hostType !== 'external') return res.status(404).json({ success: false, message: 'External repair request not found.' });
  if (request.status !== 'submitted') return res.status(409).json({ success: false, message: 'Diagnosis pricing can only be set during initial review.' });
  if (!Number.isFinite(fee) || fee <= 0 || fee > 10000000 || !/^[A-Z]{3}$/.test(currency)) return res.status(400).json({ success: false, message: 'Set a valid diagnosis fee and currency.' });
  const invoice = await prisma.billingInvoice.create({ data: { invoiceNumber: invoiceNumber(), userId: request.userId, projectRequestId: request.id, stage: 'repair_diagnosis', serviceType: 'repair', description: `External site repair diagnosis: ${request.title}`, amountMinor: Math.round(fee * 100), currency, dueAt: new Date(Date.now() + 7 * 86400000) } });
  const updated = await prisma.projectRequest.update({ where: { id: request.id }, data: { status: 'awaiting_diagnosis_payment', repairContext: { ...request.repairContext, diagnosisFee: fee, diagnosisCurrency: currency, diagnosisReport: report, diagnosisFeeStatus: 'awaiting_payment', diagnosisInvoiceId: invoice.id } } });
  await prisma.projectConversationMessage.create({ data: { projectRequestId: request.id, senderRole: 'system', kind: 'event', message: `Sitemendr reviewed the request and set an external diagnosis fee of ${currency} ${fee}. Investigation begins after this invoice is paid.`, eventData: { type: 'repair_diagnosis_fee_set', invoiceId: invoice.id, amountMinor: invoice.amountMinor, currency, report } } });
  notifyUser(request.userId, 'repair_request_updated', { request: updated });
  res.json({ success: true, data: { request: updated, invoice } });
};

exports.sendRepairProposal = async (req, res) => {
  const { scope, timeline, amount, currency = 'USD', paymentSchedule, depositAmount = 0, report } = req.body || {};
  const total = Number(amount), deposit = Number(depositAmount);
  const request = await prisma.projectRequest.findFirst({ where: { id: req.params.id, serviceType: 'repair' } });
  if (!request || !['diagnosing', 'awaiting_client_info', 'in_progress'].includes(request.status)) return res.status(409).json({ success: false, message: 'This repair is not ready for a proposal.' });
  if (!scope?.trim() || scope.length > 5000 || !timeline?.trim() || timeline.length > 240 || !Number.isFinite(total) || total <= 0 || !/^[A-Z]{3}$/.test(currency) || !['full_upfront', 'deposit_balance'].includes(paymentSchedule) || (paymentSchedule === 'deposit_balance' && !(deposit > 0 && deposit < total))) return res.status(400).json({ success: false, message: 'Add a valid scope, timeline, currency, total, and payment schedule.' });
  if (request.status === 'in_progress') {
    const priorQuote = await prisma.projectQuoteVersion.findFirst({ where: { projectRequestId: request.id, status: 'accepted' }, orderBy: { version: 'desc' }, select: { snapshot: true } });
    if (priorQuote && String(priorQuote.snapshot?.currency || 'USD').toUpperCase() !== String(currency).toUpperCase()) return res.status(409).json({ success: false, message: 'A change order must use the currency from the accepted repair scope.' });
  }
  const result = await prisma.$transaction(async tx => {
    const latest = await tx.projectQuoteVersion.findFirst({ where: { projectRequestId: request.id }, orderBy: { version: 'desc' }, select: { version: true } });
    const version = (latest?.version || 0) + 1;
    const changeOrder = request.status === 'in_progress';
    await tx.projectQuoteVersion.updateMany({ where: { projectRequestId: request.id, status: 'sent' }, data: { status: 'superseded' } });
    const snapshot = { scope: scope.trim(), timeline: timeline.trim(), amount: total, totalAgreedAmount: total, currency, paymentSchedule: changeOrder ? 'full_upfront' : paymentSchedule, depositAmount: changeOrder ? 0 : paymentSchedule === 'deposit_balance' ? deposit : 0, report: String(report || '').slice(0, 5000), cancellationTerms: 'On cancellation, only a completed paid external diagnosis and completed repair work within the accepted quote and approved change orders are charged. Unperformed or unapproved work is not charged. Refund due equals verified payments minus those charges; if approved charges exceed payments, the difference remains due. Before repair work starts, only a completed paid diagnosis may be charged. Sitemendr records a processed refund with its Paystack reference.' };
    const quote = await tx.projectQuoteVersion.create({ data: { projectRequestId: request.id, version, status: 'sent', snapshot } });
    const firstDue = new Date(Date.now() + 7 * 86400000);
    const firstAmount = paymentSchedule === 'deposit_balance' ? deposit : total;
    const invoice = await tx.billingInvoice.create({ data: { invoiceNumber: invoiceNumber(), userId: request.userId, projectRequestId: request.id, stage: `${changeOrder ? 'repair_change' : 'repair_quote'}_${version}`, serviceType: 'repair', description: `${changeOrder ? 'Approved-scope change' : `Repair ${paymentSchedule === 'deposit_balance' ? 'deposit' : 'work payment'}`}: ${request.title}`, amountMinor: Math.round((changeOrder ? total : firstAmount) * 100), currency, dueAt: firstDue } });
    if (!changeOrder && paymentSchedule === 'deposit_balance') await tx.billingInvoice.create({ data: { invoiceNumber: invoiceNumber(), userId: request.userId, projectRequestId: request.id, stage: `repair_balance_${version}`, serviceType: 'repair', description: `Repair remaining balance: ${request.title}`, amountMinor: Math.round((total - deposit) * 100), currency, dueAt: firstDue } });
    await tx.projectRequest.update({ where: { id: request.id }, data: { status: 'proposal_ready', repairContext: { ...(request.repairContext || {}), proposalVersion: version, proposalKind: changeOrder ? 'change_order' : 'initial', diagnosisReport: String(report || request.repairContext?.diagnosisReport || '').slice(0, 5000), ...(!changeOrder ? { diagnosisCompletedAt: request.repairContext?.diagnosisCompletedAt || new Date().toISOString() } : {}), paymentSchedule: changeOrder ? 'full_upfront' : paymentSchedule } } });
    await event(tx, request.id, changeOrder ? 'repair_change_order_sent' : 'repair_proposal_sent', changeOrder ? 'Sitemendr paused work and sent a priced change order for approval.' : 'Sitemendr sent a repair scope, timeline, and payment proposal.', { quoteVersionId: quote.id, invoiceId: invoice.id });
    return { quote, invoice };
  });
  notifyUser(request.userId, 'repair_request_updated', { requestId: request.id, status: 'proposal_ready' });
  res.json({ success: true, data: result });
};

exports.submitRepairForReview = async (req, res) => {
  const { summary, checks, limitations = '' } = req.body || {};
  if (!summary?.trim() || !checks?.trim()) return res.status(400).json({ success: false, message: 'Add delivery notes and the checks performed.' });
  const request = await prisma.projectRequest.findFirst({ where: { id: req.params.id, serviceType: 'repair', status: 'in_progress' } });
  if (!request) return res.status(409).json({ success: false, message: 'Only an active, paid repair can be sent for review.' });
  const paidInvoices = await prisma.billingInvoice.findMany({ where: { projectRequestId: request.id, userId: request.userId, status: 'paid', stage: { startsWith: 'repair_quote_' } }, select: { id: true } });
  const paid = paidInvoices.length > 0;
  if (!paid) return res.status(409).json({ success: false, message: 'Confirm the approved repair payment before submitting delivery.' });
  const context = { ...(request.repairContext || {}), delivery: { summary: summary.trim(), checks: checks.trim(), limitations: String(limitations).slice(0, 3000), readyAt: new Date().toISOString() }, reviewDueAt: new Date(Date.now() + 7 * 86400000).toISOString(), reviewReminderCount: 0 };
  const updated = await prisma.projectRequest.update({ where: { id: request.id }, data: { status: 'ready_for_review', repairContext: context } });
  await prisma.projectConversationMessage.create({ data: { projectRequestId: request.id, senderRole: 'system', kind: 'event', message: 'The repair is ready for your review. Please check the delivery notes and respond within seven days; you can ask for an extension.', eventData: { type: 'repair_ready_for_review', reviewDueAt: context.reviewDueAt, delivery: context.delivery } } });
  notifyUser(request.userId, 'repair_request_updated', { request: updated });
  res.json({ success: true, data: updated });
};

exports.decideRepairCancellation = async (req, res) => {
  const { id, messageId } = req.params;
  const decision = req.body?.decision;
  const note = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const workCharge = Number(req.body?.workCharge || 0);
  const chargeReason = typeof req.body?.chargeReason === 'string' ? req.body.chargeReason.trim() : '';
  if (!['confirm', 'decline'].includes(decision)) return res.status(400).json({ success: false, message: 'Choose confirm or decline.' });
  const rows = await prisma.$queryRawUnsafe(`SELECT "id","eventData" FROM "ProjectConversationMessage" WHERE "id"=$1 AND "projectRequestId"=$2 AND "kind"='event' LIMIT 1`, messageId, id);
  const cancellationEvent = rows[0];
  const eventData = cancellationEvent?.eventData || {};
  if (!cancellationEvent || eventData.type !== 'repair_cancel_requested' || eventData.lifecycleStatus !== 'pending') return res.status(404).json({ success: false, message: 'Pending repair cancellation request not found.' });
  const request = await prisma.projectRequest.findFirst({ where: { id, serviceType: 'repair', status: 'cancel_requested' } });
  if (!request || !['cancel_requested', eventData.previousStatus].includes(request.status)) return res.status(409).json({ success: false, message: 'The repair stage changed while cancellation was under review.' });
  if (decision === 'decline' && !note) return res.status(400).json({ success: false, message: 'Add a short reason for declining cancellation.' });

  let settlement = null;
  let closeoutInvoice = null;
  if (decision === 'confirm') {
    if (!Number.isFinite(workCharge) || workCharge < 0 || (workCharge > 0 && !chargeReason)) return res.status(400).json({ success: false, message: 'Enter the value of completed repair work and explain the work completed.' });
    const acceptedQuotes = await prisma.projectQuoteVersion.findMany({ where: { projectRequestId: id, status: 'accepted' }, orderBy: { version: 'asc' }, select: { id: true, version: true, snapshot: true } });
    const quoteCurrencies = [...new Set(acceptedQuotes.map(quote => String(quote.snapshot?.currency || 'USD').toUpperCase()))];
    if (quoteCurrencies.length > 1) return res.status(409).json({ success: false, message: 'Accepted repair quotes use multiple currencies. Reconcile the contract before confirming cancellation.' });
    const payments = await prisma.payment.findMany({ where: { userId: request.userId, status: 'completed', serviceType: 'repair_payment', metadata: { path: ['projectRequestId'], equals: id } }, select: { reference: true, amount: true, currency: true, invoiceId: true } });
    const invoices = await prisma.billingInvoice.findMany({ where: { projectRequestId: id, serviceType: 'repair' }, select: { id: true, stage: true, status: true, amountMinor: true, currency: true } });
    const diagnosisInvoice = invoices.find(invoice => invoice.stage === 'repair_diagnosis' && invoice.status === 'paid');
    const previousStatus = eventData.previousStatus;
    const diagnosisComplete = Boolean(request.repairContext?.diagnosisCompletedAt)
      || ['proposal_ready', 'awaiting_payment', 'in_progress', 'ready_for_review', 'awaiting_final_payment'].includes(previousStatus);
    const diagnosisCharge = diagnosisInvoice && diagnosisComplete ? diagnosisInvoice.amountMinor / 100 : 0;
    const workStarted = ['in_progress', 'ready_for_review', 'awaiting_final_payment'].includes(previousStatus)
      || (previousStatus === 'proposal_ready' && request.repairContext?.proposalKind === 'change_order');
    if (workCharge > 0 && !workStarted) return res.status(400).json({ success: false, message: 'There is no completed repair work to charge at this stage.' });
    const authorizedWork = acceptedQuotes.reduce((sum, quote) => sum + Number(quote.snapshot?.totalAgreedAmount || quote.snapshot?.amount || 0), 0);
    if (workCharge > Math.round(authorizedWork * 100) / 100) return res.status(400).json({ success: false, message: 'The completed work charge cannot exceed the accepted repair quotes and change orders.' });
    if (previousStatus === 'awaiting_final_payment' && Math.round(workCharge * 100) !== Math.round(authorizedWork * 100)) return res.status(400).json({ success: false, message: 'The client accepted the finished repair. The cancellation settlement must charge the accepted work total.' });
    const currencies = [...new Set([...payments.map(payment => String(payment.currency || '').toUpperCase()), ...invoices.filter(invoice => invoice.status === 'paid').map(invoice => String(invoice.currency || '').toUpperCase())].filter(Boolean))];
    if (currencies.length > 1) return res.status(409).json({ success: false, message: 'Repair payments use more than one currency. Reconcile the ledger before confirming cancellation.' });
    const currency = currencies[0] || String(diagnosisInvoice?.currency || acceptedQuotes.at(-1)?.snapshot?.currency || 'USD').toUpperCase();
    const paidTotal = Math.round(payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)) / 100;
    const chargeTotal = Math.round((diagnosisCharge + workCharge) * 100) / 100;
    const refundDue = Math.max(Math.round((paidTotal - chargeTotal) * 100) / 100, 0);
    const balanceDue = Math.max(Math.round((chargeTotal - paidTotal) * 100) / 100, 0);
    settlement = {
      currency, diagnosisCharge, completedWorkCharge: workCharge, chargeReason: chargeReason || 'No repair work was completed.',
      chargeTotal, paidTotal, refundDue, balanceDue, refundedTotal: 0,
      paymentReferences: payments.map(payment => payment.reference),
      refundStatus: refundDue > 0 ? 'pending' : 'not_due',
      recordedAt: new Date().toISOString(),
      rule: 'Paid diagnosis work is charged once completed. Completed repair work is charged only within the accepted quote and change orders. Any paid amount above those charges is refunded; unpaid approved charges remain due.'
    };
  }

  const result = await prisma.$transaction(async tx => {
    const updatedStatus = decision === 'confirm' ? 'cancelled' : eventData.previousStatus;
    const changed = await tx.projectRequest.updateMany({ where: { id, userId: request.userId, serviceType: 'repair', status: 'cancel_requested' }, data: { status: updatedStatus } });
    if (changed.count !== 1) return null;
    const updatedEvents = await tx.$queryRawUnsafe(
      `UPDATE "ProjectConversationMessage" SET "eventData" = jsonb_set(jsonb_set("eventData", '{lifecycleStatus}', to_jsonb($2::text), true), '{cancellationSettlement}', $3::jsonb, true), "readByClient"=false WHERE "id"=$1 RETURNING "id","projectRequestId","senderId","senderRole","message","kind","eventData","createdAt"`,
      messageId, decision === 'confirm' ? 'confirmed' : 'declined', JSON.stringify(settlement)
    );
    if (!updatedEvents.length) return null;
    if (decision === 'confirm') {
      const pendingInvoices = await tx.billingInvoice.findMany({ where: { projectRequestId: id, serviceType: 'repair', stage: { startsWith: 'repair_' }, status: { in: ['open', 'overdue', 'processing'] } }, select: { id: true, snapshot: true, stage: true, status: true } });
      const cancelInvoiceStages = pendingInvoices.filter(invoice => invoice.stage !== 'repair_cancellation_closeout');
      const cancelInvoiceIds = cancelInvoiceStages.map(invoice => invoice.id);
      if (cancelInvoiceIds.length) {
        await tx.payment.updateMany({ where: { invoiceId: { in: cancelInvoiceIds }, status: { in: ['pending', 'processing'] } }, data: { status: 'superseded' } });
        await tx.billingInvoice.updateMany({ where: { id: { in: cancelInvoiceIds } }, data: { status: 'void', voidedAt: new Date(), nextReminderAt: null } });
      }
      if (settlement.refundDue > 0) {
        await tx.billingRefund.create({ data: {
          refundNumber: `SMF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${require('crypto').randomBytes(4).toString('hex').toUpperCase()}`,
          userId: request.userId, projectRequestId: id, invoiceId: null,
          amountMinor: Math.round(settlement.refundDue * 100), currency: settlement.currency, status: 'pending',
          sourcePaymentReferences: settlement.paymentReferences,
          snapshot: { reason: 'Repair cancellation settlement', chargeTotal: settlement.chargeTotal, diagnosisCharge: settlement.diagnosisCharge, completedWorkCharge: settlement.completedWorkCharge, chargeReason: settlement.chargeReason }
        } });
      }
      if (settlement.balanceDue > 0) {
        closeoutInvoice = await tx.billingInvoice.create({ data: {
          invoiceNumber: invoiceNumber(), userId: request.userId, projectRequestId: id, stage: 'repair_cancellation_closeout', serviceType: 'repair',
          description: `Repair cancellation closeout: ${request.title}`, amountMinor: Math.round(settlement.balanceDue * 100), currency: settlement.currency,
          dueAt: new Date(Date.now() + 7 * 86400000), snapshot: { projectRequestId: id, cancellationCloseout: true, chargeTotal: settlement.chargeTotal, paidTotal: settlement.paidTotal }
        } });
      }
    }
    await tx.projectConversationMessage.create({ data: { projectRequestId: id, senderRole: 'system', kind: 'event', message: decision === 'confirm'
      ? `Sitemendr confirmed cancellation. Completed diagnosis and approved work are charged; any refund or remaining balance is shown below. ${note}`
      : `Sitemendr declined the cancellation request. The repair returns to its previous stage. ${note}`,
    eventData: { type: decision === 'confirm' ? 'repair_cancel_confirmed' : 'repair_cancel_declined', settlement, invoiceId: closeoutInvoice?.id || null } } });
    return { event: updatedEvents[0], status: updatedStatus };
  });
  if (!result) return res.status(409).json({ success: false, message: 'The repair or cancellation request changed. Refresh and try again.' });
  notifyUser(request.userId, 'repair_request_updated', { requestId: id, status: result.status, settlement, invoice: closeoutInvoice });
  notifyAdmins('repair_request_updated', { requestId: id, status: result.status, settlement, invoice: closeoutInvoice });
  res.json({ success: true, data: { status: result.status, settlement, invoice: closeoutInvoice } });
};

exports.recordRepairCancellationRefund = async (req, res) => {
  const { id } = req.params;
  const amount = Number(req.body?.amount);
  const reference = typeof req.body?.reference === 'string' ? req.body.reference.trim() : '';
  const request = await prisma.projectRequest.findFirst({ where: { id, serviceType: 'repair', status: 'cancelled' } });
  if (!request) return res.status(409).json({ success: false, message: 'Refunds can only be recorded after a repair cancellation is confirmed.' });
  if (!Number.isFinite(amount) || amount <= 0 || !reference || reference.length > 200) return res.status(400).json({ success: false, message: 'Enter a positive refund amount and the Paystack refund reference.' });
  const settlementEvents = await prisma.projectConversationMessage.findMany({ where: { projectRequestId: id, kind: 'event', eventData: { path: ['type'], equals: 'repair_cancel_confirmed' } }, orderBy: { createdAt: 'desc' }, take: 1 });
  const eventMessage = settlementEvents[0];
  const settlement = eventMessage?.eventData?.settlement;
  if (!settlement || !['pending', 'partial'].includes(settlement.refundStatus)) return res.status(409).json({ success: false, message: 'This cancellation has no outstanding refund.' });
  const remaining = Math.max(Number(settlement.refundDue || 0) - Number(settlement.refundedTotal || 0), 0);
  if (amount > remaining || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.0001) return res.status(400).json({ success: false, message: 'Refund amount must be cents accurate and within the remaining amount due.' });
  const duplicate = await prisma.billingRefund.findMany({ where: { projectRequestId: id }, select: { externalReference: true, externalReferences: true } });
  if (duplicate.some(item => item.externalReference === reference || (Array.isArray(item.externalReferences) && item.externalReferences.includes(reference)))) return res.status(409).json({ success: false, message: 'That refund reference has already been recorded.' });
  const referenceInUse = await prisma.billingRefund.findUnique({ where: { externalReference: reference }, select: { id: true } });
  if (referenceInUse) return res.status(409).json({ success: false, message: 'That Paystack refund reference is already used on another refund.' });
  const nextTotal = Math.round((Number(settlement.refundedTotal || 0) + amount) * 100) / 100;
  const remainingAfter = Math.max(Math.round((Number(settlement.refundDue) - nextTotal) * 100) / 100, 0);
  const nextSettlement = { ...settlement, refundedTotal: nextTotal, refundStatus: remainingAfter === 0 ? 'processed' : 'partial', lastRefundReference: reference, lastRefundAmount: amount, lastRefundAt: new Date().toISOString() };
  const updated = await prisma.$transaction(async tx => {
    const refund = await tx.billingRefund.findFirst({ where: { projectRequestId: id, status: { in: ['pending', 'partial'] } }, orderBy: { createdAt: 'asc' } });
    if (!refund) return false;
    const rows = await tx.$queryRawUnsafe(`UPDATE "ProjectConversationMessage" SET "eventData"=jsonb_set("eventData", '{settlement}', $2::jsonb, true) WHERE "id"=$1 AND COALESCE("eventData"->'settlement'->>'refundedTotal','0')::numeric=$3::numeric RETURNING "id"`, eventMessage.id, JSON.stringify(nextSettlement), Number(settlement.refundedTotal || 0));
    if (!rows.length) return false;
    const refs = Array.isArray(refund.externalReferences) ? refund.externalReferences : [];
    await tx.billingRefund.update({ where: { id: refund.id }, data: { processedAmountMinor: Math.round(nextTotal * 100), status: remainingAfter === 0 ? 'processed' : 'partial', externalReference: reference, externalReferences: [...refs, reference], processedAt: new Date(), snapshot: { ...(refund.snapshot || {}), refundedTotal: nextTotal } } });
    await tx.projectConversationMessage.create({ data: { projectRequestId: id, senderRole: 'system', kind: 'event', message: `Sitemendr recorded a refund of ${settlement.currency} ${amount}. ${remainingAfter > 0 ? `${settlement.currency} ${remainingAfter} remains.` : 'The refund is complete.'}`, eventData: { type: 'repair_cancellation_refund_recorded', amount, currency: settlement.currency, reference, refundedTotal: nextTotal } } });
    return true;
  });
  if (!updated) return res.status(409).json({ success: false, message: 'The refund changed or was recorded already. Refresh and review the ledger.' });
  notifyUser(request.userId, 'repair_request_updated', { requestId: id });
  notifyAdmins('repair_request_updated', { requestId: id });
  res.json({ success: true, data: { refundedTotal: nextTotal, remaining: remainingAfter } });
};

exports.updateRepairStatus = async (req, res) => {
  const { status, message } = req.body || {};
  const allowed = ['reviewing', 'diagnosing', 'awaiting_client_info', 'declined'];
  if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Choose a supported repair status.' });
  const request = await prisma.projectRequest.findFirst({ where: { id: req.params.id, serviceType: 'repair' } });
  if (!request) return res.status(404).json({ success: false, message: 'Repair request not found.' });
  if (request.status === 'awaiting_diagnosis_payment' || ['awaiting_payment', 'in_progress', 'ready_for_review', 'completed'].includes(request.status)) return res.status(409).json({ success: false, message: 'This request is at a payment or delivery gate. Use its dedicated action.' });
  const updated = await prisma.projectRequest.update({ where: { id: request.id }, data: { status, ...(message ? { adminNotes: String(message).slice(0, 5000) } : {}) } });
  await prisma.projectConversationMessage.create({ data: { projectRequestId: request.id, senderRole: 'system', kind: 'event', message: message ? `Sitemendr updated the repair status: ${status.replace(/_/g, ' ')}. ${String(message).slice(0, 1000)}` : `Sitemendr updated the repair status: ${status.replace(/_/g, ' ')}.`, eventData: { type: 'repair_status_updated', status } } });
  notifyUser(request.userId, 'repair_request_updated', { request: updated });
  res.json({ success: true, data: updated });
};

for (const name of Object.keys(exports)) {
  const handler = exports[name];
  exports[name] = async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      logger.error('REPAIR_CONTROLLER_ERROR', { action: name, error: error.message });
      if (!res.headersSent) res.status(500).json({ success: false, message: 'Repair request could not be processed. Please try again.' });
    }
  };
}
