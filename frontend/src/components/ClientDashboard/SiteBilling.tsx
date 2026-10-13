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
import { ChevronRight, CreditCard, ArrowLeft } from 'lucide-react';
import type { BillingItem, ClientProject } from './ClientDashboard_types';
import { TransactionDetail } from './BillingDetailViews';

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

export default function SiteBilling({ site, billing }: { site: ClientProject; billing: BillingItem[] }) {
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  const selectedTransaction = selectedTransactionId ? billing.find((b) => b.id === selectedTransactionId) || null : null;
  const mostRecentChannelItem = billing.find((item) => item.channel);
  const buildPayments = billing.filter((item) => ['build_agreement', 'build_final_balance'].includes(item.serviceType || ''));

  const currency = site.quoteCurrency || billing[0]?.currency || 'USD';
  const totalAgreed = site.totalAgreedAmount;
  const totalPaidMajor = buildPayments
  .filter((item) => PAID_STATUSES.has(item.status))
  .reduce((sum, item) => sum + (item.amount || 0) / 100, 0);
  const outstanding = typeof totalAgreed === 'number' ? Math.max(0, totalAgreed - totalPaidMajor) : null;

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
