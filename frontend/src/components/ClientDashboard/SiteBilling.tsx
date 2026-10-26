// components/client-dashboard/SiteBilling.tsx
//
// The room's own Billing tab — a single, honest financial summary for
// this one site, not a stack of redundant sections.
//
// Earlier version embedded ContractDetail (from BillingDetailViews.tsx)
// here as well as its own transaction list — but ContractDetail's own
// "payment history" and this file's "Transactions" list use the exact
// same filter (metadata.projectRequestId === site.id), so it was
// rendering the same payments twice in two different styles, plus a
// redundant "One-time contract" header duplicating the room's own
// header above it. Fixed by building one real summary directly from
// `site` (already loaded, no extra fetch needed) and keeping exactly
// one transaction list. TransactionDetail is still reused for drill-down
// since that one shows genuinely different, per-transaction-only data
// (reference, channel, related earlier attempts).

'use client';

import { useState } from 'react';
import { ChevronRight, CreditCard, ArrowLeft, FileText, ReceiptText, RotateCcw } from 'lucide-react';
import type { BillingItem, BillingInvoiceItem, BillingReceiptItem, BillingRefundItem, ClientProject } from './ClientDashboard_types';
import { BillingDocumentDetail, TransactionDetail } from './BillingDetailViews';

const statusTone: Record<string, string> = {
  completed: 'text-expert-green',
  success: 'text-expert-green',
  active: 'text-expert-green',
  pending: 'text-amber-300',
  failed: 'text-red-400',
  superseded: 'text-white/34',
  cancelled: 'text-white/34',
};

const PAID_STATUSES = new Set(['completed', 'success', 'active']);

const formatMoney = (amountInSubunits: number, currency?: string) =>
  `${currency || 'USD'} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((amountInSubunits || 0) / 100)}`;

const formatMajorUnits = (amount: number, currency?: string) =>
  `${currency || 'USD'} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0)}`;

const formatCurrencyTotals = (totals: Record<string, number>) => {
  const entries = Object.entries(totals).filter(([, amount]) => amount > 0);
  return entries.length ? entries.map(([currency, amount]) => formatMoney(amount, currency)).join(' · ') : '—';
};

const sumByCurrency = <T,>(items: T[], getAmount: (item: T) => number, getCurrency: (item: T) => string | undefined) =>
  items.reduce<Record<string, number>>((totals, item) => {
    const currency = (getCurrency(item) || 'USD').toUpperCase();
    totals[currency] = (totals[currency] || 0) + getAmount(item);
    return totals;
  }, {});

export default function SiteBilling({ site, billing, invoices, receipts, refunds, unavailable, onRefreshBilling, onOpenBuildJourney, onOpenAddons }: {
  site: ClientProject;
  billing: BillingItem[];
  invoices: BillingInvoiceItem[];
  receipts: BillingReceiptItem[];
  refunds: BillingRefundItem[];
  unavailable: boolean;
  onRefreshBilling: () => Promise<unknown>;
  onOpenBuildJourney: (projectRequestId: string) => void;
  onOpenAddons: () => void;
}) {
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<{ kind: 'invoice' | 'receipt'; id: string } | null>(null);

  const selectedTransaction = selectedTransactionId ? billing.find((b) => b.id === selectedTransactionId) || null : null;
  const selectedInvoice = selectedDocument?.kind === 'invoice' ? invoices.find(item => item.id === selectedDocument.id) : undefined;
  const selectedReceipt = selectedDocument?.kind === 'receipt' ? receipts.find(item => item.id === selectedDocument.id) : undefined;
  const selectedReceiptPayment = selectedReceipt ? billing.find(item => item.id === selectedReceipt.paymentId) : undefined;
  const mostRecentChannelItem = billing.find((item) => item.channel);
  const buildPayments = billing.filter((item) => ['build_agreement', 'build_final_balance'].includes(item.serviceType || ''));

  const currency = site.quoteCurrency || billing[0]?.currency || 'USD';
  const totalAgreed = site.totalAgreedAmount;
  const totalPaidMajor = buildPayments
  .filter((item) => PAID_STATUSES.has(item.status))
  .reduce((sum, item) => sum + (item.amount || 0) / 100, 0);
  const outstanding = typeof totalAgreed === 'number' ? Math.max(0, totalAgreed - totalPaidMajor) : null;
  const received = sumByCurrency(billing.filter(item => item.status === 'completed'), item => Number(item.amount || 0), item => item.currency);
  const openInvoices = invoices.filter(item => ['open', 'overdue'].includes(item.status));
  const openInvoiceTotal = sumByCurrency(openInvoices, item => item.amountMinor, item => item.currency);
  const processingTotal = sumByCurrency(billing.filter(item => ['pending', 'processing'].includes(item.status)), item => Number(item.amount || 0), item => item.currency);
  const refundsRemaining = sumByCurrency(refunds.filter(item => ['pending', 'partial'].includes(item.status)), item => Math.max(item.amountMinor - Number(item.processedAmountMinor || 0), 0), item => item.currency);

  const refreshBilling = () => onRefreshBilling();

  if (selectedDocument?.kind === 'invoice' && selectedInvoice) {
    return <div className="space-y-5"><button type="button" onClick={() => setSelectedDocument(null)} className="inline-flex items-center gap-2 text-[10px] font-semibold text-white/50 transition hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Back to site billing</button><BillingDocumentDetail kind="invoice" invoice={selectedInvoice} onOpenBuildJourney={onOpenBuildJourney} onOpenAddons={onOpenAddons} /></div>;
  }
  if (selectedDocument?.kind === 'receipt' && selectedReceipt) {
    return <div className="space-y-5"><button type="button" onClick={() => setSelectedDocument(null)} className="inline-flex items-center gap-2 text-[10px] font-semibold text-white/50 transition hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Back to site billing</button><BillingDocumentDetail kind="receipt" receipt={selectedReceipt} payment={selectedReceiptPayment} /></div>;
  }

  if (selectedTransaction) {
  return (
  <div className="space-y-5">
  <button
  type="button"
  onClick={() => setSelectedTransactionId(null)}
  className="inline-flex items-center gap-2 text-[10px] font-semibold text-white/50 transition hover:text-white"
  >
  <ArrowLeft className="h-3.5 w-3.5" /> Back to billing
  </button>
  <TransactionDetail transaction={selectedTransaction} />
  </div>
  );
  }

  return (
  <div className="space-y-8">
  {unavailable && <div role="alert" className="flex flex-col gap-3 border border-amber-300/20 bg-amber-300/[0.05] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-amber-100">Billing couldn’t be refreshed</p><p className="mt-1 text-xs leading-5 text-white/52">The records shown may be out of date.</p></div><button type="button" onClick={refreshBilling} className="min-h-10 rounded-lg border border-amber-200/25 px-3 text-xs font-semibold text-amber-100">Retry billing</button></div>}
  <section aria-label="Site billing summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
  <Summary label="Payments received" value={formatCurrencyTotals(received)} detail="Verified payments for this site" tone="text-expert-green" />
  <Summary label="Invoices due" value={formatCurrencyTotals(openInvoiceTotal)} detail={`${openInvoices.length} open invoice${openInvoices.length === 1 ? '' : 's'}`} />
  <Summary label="Processing" value={formatCurrencyTotals(processingTotal)} detail="Awaiting payment confirmation" tone="text-amber-200" />
  <Summary label="Refunds pending" value={formatCurrencyTotals(refundsRemaining)} detail="Approved amount still to be processed" tone="text-amber-200" />
  </section>

  <section className="border border-white/[0.08] bg-white/[0.02]">
  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-4">
  <p className="text-[10px] font-semibold text-white/40">Contract summary</p>
  <span className={`text-[10px] font-semibold ${site.status === 'completed' ? 'text-expert-green' : 'text-amber-300'}`}>
  {site.status.replace(/_/g, ' ')}
  </span>
  </div>
  <div className="grid grid-cols-1 divide-y divide-white/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
  <div className="px-6 py-5">
  <p className="text-[10px] font-semibold text-white/40">Total agreed</p>
  <p className="mt-2 text-xl font-semibold text-white">
  {typeof totalAgreed === 'number' ? formatMajorUnits(totalAgreed, currency) : 'Not yet quoted'}
  </p>
  </div>
  <div className="px-6 py-5">
  <p className="text-[10px] font-semibold text-white/40">Build paid</p>
  <p className="mt-2 text-xl font-semibold text-expert-green">{formatMajorUnits(totalPaidMajor, currency)}</p>
  </div>
  <div className="px-6 py-5">
  <p className="text-[10px] font-semibold text-white/40">Build balance</p>
  <p className={`mt-2 text-xl font-semibold ${outstanding ? 'text-amber-300' : 'text-white'}`}>
  {outstanding == null ? '—' : formatMajorUnits(outstanding, currency)}
  </p>
  </div>
  </div>
  </section>

  {(invoices.length > 0 || receipts.length > 0) && <section className="grid gap-4 xl:grid-cols-2">
  {invoices.length > 0 && <article className="border border-white/[0.08] bg-white/[0.02] p-5"><h3 className="text-sm font-semibold text-white">Site invoices</h3><div className="mt-3 divide-y divide-white/[0.06]">{invoices.map(invoice => <button key={invoice.id} type="button" onClick={() => setSelectedDocument({ kind: 'invoice', id: invoice.id })} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-white/[0.025]"><div className="min-w-0"><p className="truncate text-xs text-white/80">{invoice.description}</p><p className="mt-1 text-[10px] text-white/35">{invoice.invoiceNumber} · {new Date(invoice.issuedAt).toLocaleDateString()}</p></div><div className="shrink-0 text-right"><p className="text-xs font-semibold text-white">{formatMoney(invoice.amountMinor, invoice.currency)}</p><p className={`mt-1 text-[10px] font-semibold ${statusTone[invoice.status] || 'text-white/45'}`}>{invoice.status}</p></div><FileText className="h-4 w-4 text-white/25" /></button>)}</div></article>}
  {receipts.length > 0 && <article className="border border-white/[0.08] bg-white/[0.02] p-5"><h3 className="text-sm font-semibold text-white">Site receipts</h3><div className="mt-3 divide-y divide-white/[0.06]">{receipts.map(receipt => <button key={receipt.id} type="button" onClick={() => setSelectedDocument({ kind: 'receipt', id: receipt.id })} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-white/[0.025]"><div className="min-w-0"><p className="truncate text-xs text-white/80">{receipt.snapshot?.description || receipt.receiptNumber}</p><p className="mt-1 text-[10px] text-white/35">{receipt.receiptNumber} · {new Date(receipt.issuedAt).toLocaleDateString()}</p></div><p className="shrink-0 text-xs font-semibold text-white">{formatMoney(receipt.amountMinor, receipt.currency)}</p><ReceiptText className="h-4 w-4 text-white/25" /></button>)}</div></article>}
  </section>}

  {refunds.length > 0 && <section className="border border-white/[0.08] bg-white/[0.02] p-5"><h3 className="text-sm font-semibold text-white">Site refunds</h3><div className="mt-3 divide-y divide-white/[0.06]">{refunds.map(refund => { const processed = Number(refund.processedAmountMinor || 0); const remaining = Math.max(Number(refund.amountMinor || 0) - processed, 0); return <div key={refund.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-xs text-white/80">{refund.refundNumber}</p><p className="mt-1 truncate text-[10px] text-white/35">{refund.externalReferences?.join(', ') || refund.externalReference || 'Awaiting processing'}{refund.processedAt ? ` · ${new Date(refund.processedAt).toLocaleDateString()}` : ''}</p></div><div className="shrink-0 text-right"><p className="text-xs font-semibold text-white">{formatMoney(processed, refund.currency)} refunded</p>{remaining > 0 && <p className="mt-1 text-[10px] text-white/35">{formatMoney(remaining, refund.currency)} remaining of {formatMoney(refund.amountMinor, refund.currency)}</p>}<p className={`mt-1 text-[10px] font-semibold ${statusTone[refund.status] || 'text-white/45'}`}>{refund.status}</p></div><RotateCcw className="h-4 w-4 text-white/25" /></div>; })}</div></section>}

  <section>
  <p className="mb-4 text-[10px] font-semibold text-white/40">Transactions</p>
  <div className="border border-white/[0.08] bg-white/[0.02]">
  {billing.length === 0 ? (
  <p className="p-10 text-center text-xs font-semibold text-white/24">No transactions for this site yet</p>
  ) : (
  <div className="divide-y divide-white/[0.06]">
  {billing.map((item) => (
  <button
  key={item.id}
  type="button"
  onClick={() => setSelectedTransactionId(item.id)}
  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-white/[0.02]"
  >
  <div className="min-w-0">
  <p className="truncate text-sm font-semibold text-white">{item.description}</p>
  <p className="mt-1 font-mono text-[10px] text-white/30">{new Date(item.createdAt).toLocaleDateString()}</p>
  </div>
  <div className="flex shrink-0 items-center gap-4">
  <div className="text-right">
  <p className="text-sm font-semibold text-white">{formatMoney(item.amount, item.currency)}</p>
  <p className={`text-[10px] font-semibold ${statusTone[item.status] || 'text-white/50'}`}>{item.status}</p>
  </div>
  <ChevronRight className="h-4 w-4 text-white/18" />
  </div>
  </button>
  ))}
  </div>
  )}
  </div>
  </section>

  <section>
  <p className="mb-4 text-[10px] font-semibold text-white/40">Payment method</p>
  <div className="flex items-center gap-4 border border-white/[0.08] bg-white/[0.02] p-6">
  <CreditCard className="h-5 w-5 shrink-0 text-white/24" />
  {mostRecentChannelItem ? (
  <p className="text-sm font-semibold text-white">
  Last used: {mostRecentChannelItem.cardType ? `${mostRecentChannelItem.cardType} •••• ${mostRecentChannelItem.last4 || ''}` : (mostRecentChannelItem.channel || 'card').replace(/_/g, ' ')}
  </p>
  ) : (
  <p className="text-sm text-white/40">No payment history yet.</p>
  )}
  </div>
  </section>
  </div>
  );
}

function Summary({ label, value, detail, tone = 'text-white' }: { label: string; value: string; detail: string; tone?: string }) {
  return <article className="border border-white/[0.08] bg-white/[0.02] p-4"><p className="text-[10px] font-semibold text-white/40">{label}</p><p className={`mt-2 break-words text-lg font-semibold ${tone}`}>{value}</p><p className="mt-1 text-[10px] leading-4 text-white/35">{detail}</p></article>;
}
