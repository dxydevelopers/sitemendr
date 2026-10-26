// components/client-dashboard/BillingDetailViews.tsx
//
// The three drill-down views the billing page navigates into.

'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Clock, Printer, CheckCircle2, FileText, Download } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { BillingInvoiceItem, BillingItem, BillingReceiptItem } from './ClientDashboard_types';

const formatMoney = (amountInSubunits: number, currency?: string) =>
  `${currency || 'USD'} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((amountInSubunits || 0) / 100)}`;

const formatMajorUnits = (amount: number, currency?: string) =>
  `${currency || 'USD'} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0)}`;

const statusTone: Record<string, string> = {
  completed: 'text-expert-green',
  success: 'text-expert-green',
  active: 'text-expert-green',
  paid: 'text-expert-green',
  processed: 'text-expert-green',
  pending: 'text-amber-300',
  processing: 'text-amber-300',
  open: 'text-amber-300',
  partial: 'text-amber-300',
  overdue: 'text-red-400',
  failed: 'text-red-400',
  superseded: 'text-white/34',
  cancelled: 'text-white/34',
  void: 'text-white/34',
  voided: 'text-white/34',
};

export function BillingDocumentDetail({
  kind,
  invoice,
  receipt,
  payment,
  onOpenBuildJourney,
  onOpenAddons,
}: {
  kind: 'invoice' | 'receipt';
  invoice?: BillingInvoiceItem;
  receipt?: BillingReceiptItem;
  payment?: BillingItem;
  onOpenBuildJourney?: (projectRequestId: string) => void;
  onOpenAddons?: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const isInvoice = kind === 'invoice';
  const title = isInvoice ? invoice?.description : receipt?.snapshot?.description || payment?.description || 'Sitemendr payment';
  const number = isInvoice ? invoice?.invoiceNumber : receipt?.receiptNumber;
  const amount = isInvoice ? invoice?.amountMinor : receipt?.amountMinor;
  const currency = isInvoice ? invoice?.currency : receipt?.currency;
  const account = isInvoice ? invoice?.user : receipt?.user;
  const projectName = typeof invoice?.snapshot?.projectName === 'string' ? invoice.snapshot.projectName : null;
  const paymentReference = receipt?.snapshot?.reference || payment?.reference;
  const documentDate = isInvoice ? invoice?.issuedAt : receipt?.issuedAt;
  const documentStatus = isInvoice ? invoice?.status : 'paid';
  const invoiceIsVoided = isInvoice && ['void', 'voided'].includes(String(invoice?.status || '').toLowerCase());
  const printDocument = () => {
    document.body.classList.add('billing-document-printing');
    const cleanup = () => document.body.classList.remove('billing-document-printing');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(cleanup, 60000);
    window.print();
  };
  const downloadDocument = async () => {
    if (!number || !receipt && !invoice) return;
    setDownloading(true);
    setDownloadError('');
    try {
      await apiClient.downloadClientBillingPdf(kind, (invoice || receipt)!.id);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Could not download this document.');
    } finally {
      setDownloading(false);
    }
  };
  if ((isInvoice && !invoice) || (!isInvoice && !receipt)) {
    return <div className="border-y border-white/12 py-12 text-center text-sm text-white/45">This billing document could not be found.</div>;
  }

  return (
    <div className="animate-fade-in pb-16">
      <style jsx global>{`
        @media print {
          body.billing-document-printing * { visibility: hidden !important; }
          body.billing-document-printing #billing-print-document,
          body.billing-document-printing #billing-print-document * { visibility: visible !important; }
          body.billing-document-printing #billing-print-document { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; max-width: none !important; min-height: 100vh !important; margin: 0 !important; padding: 42px !important; border: 0 !important; border-radius: 0 !important; background: #fff !important; color: #111827 !important; box-shadow: none !important; }
          body.billing-document-printing #billing-print-document * { color: #111827 !important; border-color: #d1d5db !important; }
          body.billing-document-printing .billing-print-hide { display: none !important; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 billing-print-hide">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{isInvoice ? 'Billing document' : 'Payment confirmation'}</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{isInvoice ? 'Invoice' : 'Receipt'} {number}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadDocument} disabled={downloading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-ai-blue/25 bg-ai-blue/[0.07] px-4 text-xs font-semibold text-white/85 transition hover:border-ai-blue/45 hover:text-white disabled:opacity-50">
            <Download className="h-4 w-4" /> {downloading ? 'Preparing PDF…' : 'Download PDF'}
          </button>
          <button type="button" onClick={printDocument} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.035] px-4 text-xs font-semibold text-white/80 transition hover:border-ai-blue/40 hover:text-white">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>
      {downloadError && <p role="alert" className="mb-3 text-xs text-red-300 billing-print-hide">{downloadError}</p>}

      <article id="billing-print-document" className="mx-auto max-w-3xl rounded-2xl border border-white/[0.1] bg-[#10151d] p-6 text-white shadow-2xl shadow-black/20 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-white/10 pb-7">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-ai-blue/15 text-ai-blue"><FileText className="h-5 w-5" /></div>
              <div><p className="text-lg font-semibold tracking-tight">Sitemendr</p><p className="text-[11px] text-white/42">Client workspace billing</p></div>
            </div>
            <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.17em] text-white/38">{isInvoice ? 'Invoice issued to' : 'Receipt issued to'}</p>
            <p className="mt-2 text-sm font-semibold">{account?.name || 'Sitemendr client'}</p>
            {account?.email && <p className="mt-1 text-xs text-white/55">{account.email}</p>}
          </div>
          <div className="min-w-52 text-left sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-white/38">{isInvoice ? 'Invoice number' : 'Receipt number'}</p>
            <p className="mt-2 break-all font-mono text-sm font-semibold">{number}</p>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.17em] text-white/38">{isInvoice ? 'Issued' : 'Paid on'}</p>
            <p className="mt-2 text-sm">{documentDate ? new Date(documentDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-white/38">{isInvoice ? 'Charge description' : 'Payment received for'}</p><p className="mt-2 text-base font-semibold">{title}</p>{projectName && <p className="mt-1 text-xs text-white/48">Project: {projectName}</p>}</div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone[documentStatus || ''] || 'text-white/60'}`}>
            {!isInvoice && <CheckCircle2 className="h-3.5 w-3.5" />}{documentStatus?.replace(/_/g, ' ') || '—'}
          </span>
        </div>

        <div className="mt-7 overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-[1fr_auto] gap-4 bg-white/[0.035] px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-white/45"><span>Description</span><span>Amount</span></div>
          <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-5"><span className="text-sm">{title}</span><span className="text-sm font-semibold tabular-nums">{formatMoney(amount || 0, currency)}</span></div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-white/38">{isInvoice ? invoice?.status === 'paid' ? 'Paid on' : 'Due date' : 'Payment reference'}</p><p className="mt-2 break-all text-sm font-medium">{isInvoice ? (invoice?.status === 'paid' && invoice?.paidAt ? new Date(invoice.paidAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : invoice?.dueAt ? new Date(invoice.dueAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Due upon request') : (paymentReference || '—')}</p></div>
          <div className="rounded-xl border border-white/10 p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-white/38">{isInvoice ? 'Payment stage' : 'Payment method'}</p><p className="mt-2 text-sm font-medium">{isInvoice ? (invoice?.stage.replace(/_/g, ' ') || 'Service charge') : (payment?.channel || payment?.paymentMethod || 'Online payment').replace(/_/g, ' ')}</p></div>
        </div>

        {isInvoice && invoice && invoice.snapshot && (typeof invoice.snapshot.agreedTotal === 'number' || typeof invoice.snapshot.deposit === 'number') && <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 rounded-xl border border-white/10 px-4 py-3 text-xs"><span className="text-white/48">Agreed project total <strong className="ml-1 font-semibold text-white/80">{formatMajorUnits(Number(invoice.snapshot.agreedTotal || 0), invoice.currency)}</strong></span><span className="text-white/48">Deposit <strong className="ml-1 font-semibold text-white/80">{formatMajorUnits(Number(invoice.snapshot.deposit || 0), invoice.currency)}</strong></span></div>}
        {invoiceIsVoided && <div role="status" className="mt-7 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs leading-5 text-white/55">This invoice has been voided and can’t be paid. Contact Sitemendr if you believe a new payment request should be issued.</div>}
        {isInvoice && invoice && !invoiceIsVoided && invoice.status !== 'paid' && <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ai-blue/20 bg-ai-blue/[0.06] px-4 py-3"><p className="text-xs leading-5 text-white/65">{invoice.serviceType === 'addon' ? 'Retry or review this site add-on from the Add-ons area. Payments are verified automatically before a receipt is issued.' : 'Continue this project payment in Build Journey. Payments are verified automatically before a receipt is issued.'}</p>{invoice.projectRequestId && onOpenBuildJourney ? <button type="button" onClick={() => onOpenBuildJourney(invoice.projectRequestId!)} className="min-h-9 shrink-0 rounded-lg border border-ai-blue/30 px-3 text-xs font-semibold text-ai-blue transition hover:bg-ai-blue/10">Open Build Journey</button> : invoice.serviceType === 'addon' && onOpenAddons ? <button type="button" onClick={onOpenAddons} className="min-h-9 shrink-0 rounded-lg border border-ai-blue/30 px-3 text-xs font-semibold text-ai-blue transition hover:bg-ai-blue/10">Open Add-ons</button> : null}</div>}
        {!isInvoice && <p className="mt-8 border-t border-white/10 pt-5 text-xs leading-5 text-white/45">This receipt confirms that Sitemendr verified the payment shown above. Keep the receipt number and payment reference for your records.</p>}
      </article>
    </div>
  );
}

interface ContractDetailProps {
  contractId: string;
}

interface ContractPayment {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
  channel?: string;
  cardType?: string | null;
  last4?: string | null;
  bank?: string | null;
}

interface CancellationSettlement {
  currency?: string;
  chargeTotal?: number;
  paidTotal?: number;
  refundDue?: number;
  balanceDue?: number;
  refundedTotal?: number;
  refundStatus?: string;
  settlementStatus?: string;
  lastRefundReference?: string;
}

export function ContractDetail({ contractId }: ContractDetailProps) {
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<{ id: string; title: string; businessName?: string; status: string; totalAgreedAmount?: number; depositAmount?: number; paidAmount?: number; remainingBalance?: number; paymentDueDate?: string | null; paymentAgreementStatus?: string; quoteCurrency?: string; completedAt?: string; cancellationSettlement?: CancellationSettlement | null } | null>(null);
  const [payments, setPayments] = useState<ContractPayment[]>([]);

  useEffect(() => {
  let cancelled = false;
  setLoading(true);
  apiClient.getContractBilling(contractId).then((res) => {
  if (cancelled) return;
  if (res.success) {
  setContract(res.contract as typeof contract);
  setPayments(res.payments as ContractPayment[]);
  }
  setLoading(false);
  }).catch(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };
  }, [contractId]);

  if (loading) {
  return <div className="animate-fade-in"><p className="py-16 text-center text-sm text-white/34">Loading contract...</p></div>;
  }

  if (!contract) {
  return <div className="animate-fade-in"><p className="py-16 text-center text-sm text-white/34">Contract not found.</p></div>;
  }

  const isCompleted = contract.status === 'completed';
  const settlement = contract.cancellationSettlement;
  const refundRemaining = Math.max(Number(settlement?.refundDue || 0) - Number(settlement?.refundedTotal || 0), 0);

  return (
  <div className="animate-fade-in">
  <div className="border-y border-white/12 py-6">
  <p className="text-[10px] font-semibold text-ai-blue">One-time contract</p>
  <h2 className="mt-2 text-2xl font-semibold text-white">{contract.businessName || contract.title || 'Untitled project'}</h2>
  <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-5">
  <div>
  <p className="text-[10px] font-semibold text-white/28">Status</p>
  <p className={`mt-2 text-sm font-semibold ${isCompleted ? 'text-expert-green' : 'text-amber-300'}`}>{contract.status.replace(/_/g, ' ')}</p>
  </div>
  <div>
  <p className="text-[10px] font-semibold text-white/28">Total agreed</p>
  <p className="mt-2 text-sm font-semibold text-white">{contract.totalAgreedAmount ? formatMajorUnits(contract.totalAgreedAmount, contract.quoteCurrency) : 'Not yet quoted'}</p>
  </div>
  <div>
  <p className="text-[10px] font-semibold text-white/28">Deposit</p>
  <p className="mt-2 text-sm font-semibold text-white">{contract.depositAmount ? formatMajorUnits(contract.depositAmount, contract.quoteCurrency) : '—'}</p>
  </div>
  <div>
  <p className="text-[10px] font-semibold text-white/28">Paid</p>
  <p className="mt-2 text-sm font-semibold text-emerald-200">{formatMajorUnits(Number(contract.paidAmount || 0), contract.quoteCurrency)}</p>
  </div>
  <div>
  <p className="text-[10px] font-semibold text-white/28">Remaining balance</p>
  <p className="mt-2 text-sm font-semibold text-white">{formatMajorUnits(Number(contract.remainingBalance || 0), contract.quoteCurrency)}</p>
  </div>
  <div>
  <p className="text-[10px] font-semibold text-white/28">{isCompleted ? 'Completed' : 'Started'}</p>
  <p className="mt-2 text-sm font-semibold text-white">{isCompleted && contract.completedAt ? new Date(contract.completedAt).toLocaleDateString() : 'In progress'}</p>
  </div>
  </div>
  </div>

  {settlement && (
  <div className="border-b border-white/12 py-6">
  <p className="text-[10px] font-semibold text-amber-300">Cancellation closeout</p>
  {settlement.settlementStatus === 'reversed' && <p className="mt-3 text-sm leading-6 text-white/60">The cancellation calculation was voided when the build reopened. No refund was processed.</p>}
  <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3">
  <div><p className="text-[10px] font-semibold text-white/28">Charges for completed work and costs</p><p className="mt-2 text-sm font-semibold text-white">{formatMajorUnits(Number(settlement.chargeTotal || 0), settlement.currency)}</p></div>
  <div><p className="text-[10px] font-semibold text-white/28">Payments received</p><p className="mt-2 text-sm font-semibold text-white">{formatMajorUnits(Number(settlement.paidTotal || 0), settlement.currency)}</p></div>
  {Number(settlement.balanceDue) > 0 && <div><p className="text-[10px] font-semibold text-white/28">Remaining balance</p><p className="mt-2 text-sm font-semibold text-amber-300">{formatMajorUnits(Number(settlement.balanceDue), settlement.currency)}</p></div>}
  {Number(settlement.refundDue) > 0 && settlement.settlementStatus !== 'reversed' && <div><p className="text-[10px] font-semibold text-white/28">Refund status</p><p className={`mt-2 text-sm font-semibold ${refundRemaining <= 0 ? 'text-expert-green' : 'text-amber-300'}`}>{refundRemaining <= 0 ? `Recorded · ${formatMajorUnits(Number(settlement.refundedTotal || 0), settlement.currency)}` : `${settlement.refundStatus === 'partial' ? 'Remaining' : 'Pending'} · ${formatMajorUnits(refundRemaining, settlement.currency)}`}</p>{settlement.lastRefundReference && <p className="mt-1 break-all font-mono text-[10px] text-white/34">Ref {settlement.lastRefundReference}</p>}</div>}
  </div>
  </div>
  )}

  <div className="py-6">
  <p className="text-[10px] font-semibold text-white/34">Payment history</p>
  <div className="mt-4 divide-y divide-white/12">
  {payments.length === 0 ? (
  <p className="py-10 text-center text-sm text-white/34">No payments recorded for this contract yet.</p>
  ) : payments.map((payment) => (
  <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
  <div className="min-w-0">
  <p className="text-sm font-semibold text-white">{payment.description}</p>
  <p className="mt-1 font-mono text-[10px] text-white/34">{payment.reference}</p>
  {payment.status === 'superseded' && <p className="mt-1 text-[10px] font-semibold text-amber-300/70">Superseded by a later attempt</p>}
  </div>
  <div className="text-right">
  <p className="text-sm font-semibold text-white">{formatMoney(payment.amount, payment.currency)}</p>
  <p className={`text-[10px] font-semibold ${statusTone[payment.status] || 'text-white/50'}`}>{payment.status}</p>
  </div>
  <p className="w-full text-right text-xs text-white/34 sm:w-auto">{new Date(payment.createdAt).toLocaleDateString()}</p>
  </div>
  ))}
  </div>
  </div>
  </div>
  );
}

interface SubscriptionDetailProps {
  subscriptionId: string;
}

export function SubscriptionDetail({}: SubscriptionDetailProps) {
  return (
  <div className="animate-fade-in">
  <div className="border-y border-white/12 py-16 text-center">
  <RefreshCw className="mx-auto mb-4 h-6 w-6 text-white/15" />
  <p className="text-sm font-semibold text-white/50">Care subscriptions aren&apos;t available to purchase yet.</p>
  <p className="mx-auto mt-2 max-w-sm text-xs text-white/30">Once you have an active plan, its next charge date, next charge amount, and full invoice history will show up here.</p>
  </div>
  </div>
  );
}

interface TransactionDetailProps {
  transaction: BillingItem & { metadata?: { projectRequestId?: string } | null };
  onOpenBuildJourney?: (projectRequestId: string) => void;
}

export function TransactionDetail({ transaction, onOpenBuildJourney }: TransactionDetailProps) {
  const [relatedAttempts, setRelatedAttempts] = useState<ContractPayment[]>([]);
  const projectRequestId = transaction.metadata?.projectRequestId;

  useEffect(() => {
  if (!projectRequestId) return;
  let cancelled = false;
  apiClient.getContractBilling(projectRequestId).then((res) => {
  if (cancelled || !res.success) return;
  const others = (res.payments as ContractPayment[]).filter((p) => p.id !== transaction.id && p.status !== transaction.status);
  setRelatedAttempts(others);
  }).catch(() => {});
  return () => { cancelled = true; };
  }, [projectRequestId, transaction.id, transaction.status]);

  return (
  <div className="animate-fade-in">
  <div className="border-y border-white/12 py-5">
  <div className="flex flex-wrap items-start justify-between gap-4">
  <div className="min-w-0">
  <p className={`text-[10px] font-semibold ${statusTone[transaction.status] || 'text-white/50'}`}>{transaction.status.replace(/_/g, ' ')}</p>
  <h2 className="mt-2 max-w-2xl text-[26px] font-semibold text-white sm:text-[28px]">{transaction.description}</h2>
  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/42">
  Payment record for this billing event.
  </p>
  </div>
  <div className="shrink-0 border border-white/12 bg-transparent px-3.5 py-3 text-right">
  <p className="text-[10px] font-semibold text-white/28">Amount</p>
  <p className="mt-2 text-[26px] font-semibold text-white sm:text-[28px]">{formatMoney(transaction.amount, transaction.currency)}</p>
  {transaction.convertedAmount != null && <p className="mt-1 text-xs text-white/38">≈ {formatMajorUnits(transaction.convertedAmount, transaction.preferredCurrency)}</p>}
  </div>
  </div>

  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
  <div className="border border-white/12 bg-transparent px-3.5 py-3.5">
  <p className="text-[10px] font-semibold text-white/28">Reference</p>
  <p className="mt-2 break-all font-mono text-xs font-semibold leading-5 text-white">{transaction.reference}</p>
  </div>
  <div className="border border-white/12 bg-transparent px-3.5 py-3.5">
  <p className="text-[10px] font-semibold text-white/28">Channel</p>
  <p className="mt-2 text-xs font-semibold text-white">{transaction.cardType ? `${transaction.cardType} •••• ${transaction.last4 || ''}` : (transaction.channel || 'card').replace(/_/g, ' ')}</p>
  {transaction.bank && <p className="mt-1 text-[10px] text-white/34">{transaction.bank}</p>}
  </div>
  <div className="border border-white/12 bg-transparent px-3.5 py-3.5">
  <p className="text-[10px] font-semibold text-white/28">Type</p>
  <p className="mt-2 text-xs font-semibold capitalize text-white">{(transaction.serviceType || '').replace(/_/g, ' ') || '—'}</p>
  </div>
  <div className="border border-white/12 bg-transparent px-3.5 py-3.5">
  <p className="text-[10px] font-semibold text-white/28">Date</p>
  <p className="mt-2 text-xs font-semibold text-white">{new Date(transaction.createdAt).toLocaleString()}</p>
  </div>
  </div>
  </div>

  {transaction.status === 'failed' && projectRequestId && onOpenBuildJourney && (
  <div className="mt-5 flex flex-col gap-3 rounded-xl border border-red-400/15 bg-red-400/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
  <p className="text-xs leading-5 text-white/60">This build payment did not complete. Return to Build Journey to review the current payment step and try again.</p>
  <button type="button" onClick={() => onOpenBuildJourney(projectRequestId)} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-red-300/25 px-4 text-xs font-semibold text-red-100 transition hover:bg-red-300/10">Open Build Journey</button>
  </div>
  )}

  {relatedAttempts.length > 0 && (
  <div className="py-5">
  <div className="mb-3.5 flex items-center justify-between gap-3">
  <div className="flex items-center gap-2">
  <Clock className="h-3.5 w-3.5 text-white/30" />
  <p className="text-[10px] font-semibold text-white/34">Earlier attempts</p>
  </div>
  <span className="border border-white/12 bg-transparent px-2.5 py-1 text-[10px] font-semibold text-white/40">
  {relatedAttempts.length} related
  </span>
  </div>
  <div className="max-h-80 overflow-auto border border-white/12 bg-transparent">
  {relatedAttempts.map((attempt) => (
  <div key={attempt.id} className="grid grid-cols-1 gap-3 border-b border-white/12 px-3.5 py-3.5 last:border-b-0 sm:grid-cols-[1.5fr_auto_auto] sm:items-center">
  <div className="min-w-0">
  <p className="font-mono text-[10px] text-white/34">{attempt.reference}</p>
  <p className="mt-1 truncate text-sm font-semibold text-white/80">{attempt.description}</p>
  </div>
  <span className={`text-[10px] font-semibold ${statusTone[attempt.status] || 'text-white/50'}`}>{attempt.status}</span>
  <p className="text-xs text-white/34 sm:text-right">{new Date(attempt.createdAt).toLocaleString()}</p>
  </div>
  ))}
  </div>
  </div>
  )}

  </div>
  );
}
