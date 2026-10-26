'use client';

import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronRight, CreditCard, Search, ArrowLeftRight, CircleAlert, Clock3, Wallet } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { BillingItem, BillingInvoiceItem, BillingReceiptItem, BillingRefundItem, ClientProject } from './ClientDashboard_types';
import { BillingDocumentDetail, ContractDetail, SubscriptionDetail, TransactionDetail } from './BillingDetailViews';

interface ClientBillingProps {
  billing: BillingItem[];
  invoices: BillingInvoiceItem[];
  receipts: BillingReceiptItem[];
  refunds: BillingRefundItem[];
  projects: ClientProject[];
  unavailable: boolean;
  onRetry: () => void;
  onOpenBuildJourney: (projectRequestId: string) => void;
  onOpenAddons: () => void;
}

const statusTone: Record<string, string> = {
  completed: 'text-expert-green',
  success: 'text-expert-green',
  active: 'text-expert-green',
  pending: 'text-amber-300',
  processing: 'text-amber-300',
  open: 'text-amber-300',
  overdue: 'text-red-400',
  partial: 'text-amber-300',
  paid: 'text-expert-green',
  processed: 'text-expert-green',
  void: 'text-white/34',
  voided: 'text-white/34',
  failed: 'text-red-400',
  superseded: 'text-white/34',
  cancelled: 'text-white/34',
};

const formatMoney = (amountInSubunits: number, currency?: string) =>
  `${currency || 'USD'} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((amountInSubunits || 0) / 100)}`;

const groupMinorAmounts = (items: BillingItem[]) => items.reduce<Record<string, number>>((totals, item) => {
  const currency = (item.currency || 'USD').toUpperCase();
  totals[currency] = (totals[currency] || 0) + Number(item.amount || 0);
  return totals;
}, {});

const formatCurrencyTotals = (totals: Record<string, number>) => Object.entries(totals)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([currency, amount]) => formatMoney(amount, currency))
  .join(' · ') || '—';

function SummaryCard({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: string }) {
  return (
    <article className="min-w-0 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#121923] to-[#0d1118] p-4 sm:p-5">
      <div className="flex items-center gap-2 text-[11px] font-semibold text-white/45">{icon}{label}</div>
      <p className={`mt-4 break-words text-lg font-semibold sm:text-xl ${tone}`}>{value}</p>
      <p className="mt-1 text-[11px] leading-5 text-white/38">{detail}</p>
    </article>
  );
}

function CurrencyRatesPanel({ defaultTarget }: { defaultTarget: string }) {
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [majors, setMajors] = useState<string[]>([]);
  const [target, setTarget] = useState(defaultTarget);
  const [search, setSearch] = useState('');

  useEffect(() => {
  apiClient.getCurrencyRates().then((res) => {
  if (res.success) {
  setRates(res.rates);
  setMajors(res.majors);
  }
  setLoading(false);
  }).catch(() => setLoading(false));
  }, []);

  const allCodes = useMemo(() => Object.keys(rates).sort(), [rates]);
  const visibleCodes = useMemo(() => {
  const pool = search.trim() ? allCodes.filter((code) => code.includes(search.trim().toUpperCase())) : majors;
  return pool.filter((code) => code !== target).slice(0, search.trim() ? 12 : undefined);
  }, [search, allCodes, majors, target]);

  const convert = (fromCode: string) => {
  const fromRate = rates[fromCode];
  const targetRate = rates[target];
  if (!fromRate || !targetRate) return null;
  return targetRate / fromRate;
  };

  if (loading) return <div className="py-8 text-center text-sm text-white/34">Loading rates...</div>;

  return (
  <div>
  <div className="flex flex-wrap items-center justify-between gap-4">
  <div className="relative flex-1 sm:max-w-xs">
  <Search className="pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
  <input
  type="text"
  placeholder="Search a currency code..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="w-full border-b border-white/14 bg-transparent py-2 pl-6 text-sm text-white outline-none transition focus:border-ai-blue"
  />
  </div>
  <div className="flex items-center gap-2 text-[10px] font-semibold text-white/40">
  <ArrowLeftRight className="h-3.5 w-3.5" />
  Compare against
  <select value={target} onChange={(e) => setTarget(e.target.value)} className="border-b border-white/14 bg-transparent px-1 py-1 text-ai-blue outline-none">
  {allCodes.map((code) => <option key={code} value={code} className="bg-black">{code}</option>)}
  </select>
  </div>
  </div>

  <div className="mt-5 grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3">
  {visibleCodes.length === 0 ? (
  <p className="col-span-full py-8 text-sm text-white/34">No matching currency.</p>
  ) : visibleCodes.map((code) => {
  const rate = convert(code);
  return (
  <div key={code} className="border-t border-white/8 px-2 py-3 sm:px-4">
  <p className="text-sm leading-6 text-white/72">
  <span className="font-medium text-white">{code}</span>
  <span className="mx-2 text-white/25">→</span>
  <span className="font-semibold text-white">{rate != null ? rate.toFixed(rate < 1 ? 4 : 2) : '—'}</span>
  <span className="ml-2 text-white/42">{target}</span>
  </p>
  </div>
  );
  })}
  </div>
  </div>
  );
}

export default function ClientBilling({ billing, invoices, receipts, refunds, projects, unavailable, onRetry, onOpenBuildJourney, onOpenAddons }: ClientBillingProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const view = searchParams.get('view');
  const recordId = searchParams.get('id');

  const navigateTo = useCallback((nextView: string | null, id?: string) => {
  const params = new URLSearchParams(searchParams.toString());
  if (nextView) params.set('view', nextView); else params.delete('view');
  if (id) params.set('id', id); else params.delete('id');
  router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const buildContracts = useMemo(() => projects.filter((p) => p.recordType === 'request' && p.serviceType === 'build'), [projects]);
  const preferredCurrency = billing[0]?.preferredCurrency || 'USD';
  const selectedTransaction = view === 'transaction' && recordId ? billing.find((item) => item.id === recordId) : null;
  const selectedInvoice = view === 'invoice' && recordId ? invoices.find((item) => item.id === recordId) : undefined;
  const selectedReceipt = view === 'receipt' && recordId ? receipts.find((item) => item.id === recordId) : undefined;
  const completedPayments = useMemo(() => billing.filter(item => item.status === 'completed'), [billing]);
  const processingPayments = useMemo(() => billing.filter(item => ['pending', 'processing'].includes(item.status)), [billing]);
  const failedPayments = useMemo(() => billing.filter(item => item.status === 'failed'), [billing]);
  const visiblePayments = useMemo(() => billing.filter(item => item.status !== 'superseded'), [billing]);
  const mostRecentChannelItem = completedPayments.find((item) => item.channel);
  const paidByCurrency = useMemo(() => groupMinorAmounts(completedPayments), [completedPayments]);
  const dueByCurrency = useMemo(() => invoices
    .filter(invoice => ['open', 'overdue'].includes(invoice.status))
    .reduce<Record<string, number>>((totals, invoice) => {
      const currency = (invoice.currency || 'USD').toUpperCase();
      totals[currency] = (totals[currency] || 0) + Number(invoice.amountMinor || 0);
      return totals;
    }, {}), [invoices]);
  const processingByCurrency = useMemo(() => groupMinorAmounts(processingPayments), [processingPayments]);
  const refundDueByCurrency = useMemo(() => refunds
    .filter(refund => ['pending', 'partial'].includes(refund.status))
    .reduce<Record<string, number>>((totals, refund) => {
      const currency = (refund.currency || 'USD').toUpperCase();
      const remaining = Math.max(Number(refund.amountMinor || 0) - Number(refund.processedAmountMinor || 0), 0);
      totals[currency] = (totals[currency] || 0) + remaining;
      return totals;
    }, {}), [refunds]);

  if (view === 'contract' && recordId) return <div className="animate-fade-in pb-16"><ContractDetail contractId={recordId} /></div>;
  if (view === 'subscription' && recordId) return <div className="animate-fade-in pb-16"><SubscriptionDetail subscriptionId={recordId} /></div>;
  if (view === 'invoice' && recordId) return <BillingDocumentDetail kind="invoice" invoice={selectedInvoice} onOpenBuildJourney={onOpenBuildJourney} onOpenAddons={onOpenAddons} />;
  if (view === 'receipt' && recordId) return <BillingDocumentDetail kind="receipt" receipt={selectedReceipt} payment={selectedReceipt ? billing.find(item => item.id === selectedReceipt.paymentId) : undefined} />;
  if (selectedTransaction) return <div className="animate-fade-in pb-16"><TransactionDetail transaction={selectedTransaction} onOpenBuildJourney={onOpenBuildJourney} /></div>;

  return (
  <div className="animate-fade-in pb-16">
  <div className="space-y-6">
  <div className="px-2">
  <h2 className="text-xl font-semibold text-white">Billing</h2>
  <p className="mt-1 text-sm leading-6 text-white/42">Payments and agreed charges across your Sitemendr workspace.</p>
  </div>

  {unavailable && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
  <div><p className="text-sm font-semibold text-amber-100">Billing couldn’t be refreshed</p><p className="mt-1 text-xs leading-5 text-white/52">The records shown may be out of date. Try again to load your latest invoices and payments.</p></div>
  <button type="button" onClick={onRetry} className="min-h-10 shrink-0 rounded-lg border border-amber-200/25 px-3 text-xs font-semibold text-amber-100 transition hover:bg-amber-200/[0.08]">Retry billing</button>
  </div>}

  <section aria-label="Billing summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
  <SummaryCard icon={<Wallet className="h-4 w-4" />} label="Payments received" value={formatCurrencyTotals(paidByCurrency)} detail="Verified transactions before refunds" tone="text-emerald-200" />
  <SummaryCard icon={<CreditCard className="h-4 w-4" />} label="Agreed due" value={formatCurrencyTotals(dueByCurrency)} detail="Open invoices awaiting payment" tone="text-white" />
  <SummaryCard icon={<Clock3 className="h-4 w-4" />} label="Processing" value={formatCurrencyTotals(processingByCurrency)} detail={`${processingPayments.length} payment attempt${processingPayments.length === 1 ? '' : 's'} awaiting a result`} tone="text-amber-200" />
  <SummaryCard icon={<ArrowLeftRight className="h-4 w-4" />} label="Refunds pending" value={formatCurrencyTotals(refundDueByCurrency)} detail="Approved amount still to be processed" tone="text-amber-200" />
  <SummaryCard icon={<CircleAlert className="h-4 w-4" />} label="Failed" value={`${failedPayments.length}`} detail={failedPayments.length ? 'Open a payment record to see its reference and service.' : 'No failed payment attempts'} tone={failedPayments.length ? 'text-red-200' : 'text-white'} />
  </section>

  <p className="px-2 text-[11px] leading-5 text-white/35">Totals use the original transaction currency. Build Journey payment requests create invoice records; receipts appear after payment verification.</p>

  {(invoices.length > 0 || receipts.length > 0 || refunds.length > 0) && (
  <section className="grid gap-4 xl:grid-cols-2">
  {invoices.length > 0 && <article className="rounded-2xl border border-white/[0.08] bg-[#0d1118] p-4 sm:p-5">
  <h3 className="text-sm font-semibold text-white">Invoices</h3>
  <div className="mt-3 divide-y divide-white/[0.07]">{invoices.map((invoice) => <button key={invoice.id} type="button" onClick={() => navigateTo('invoice', invoice.id)} className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-white/[0.025]">
  <div className="min-w-0"><p className="truncate text-sm text-white/85">{invoice.description}</p><p className="mt-1 text-[10px] text-white/38">{invoice.invoiceNumber} · {new Date(invoice.issuedAt).toLocaleDateString()}</p></div>
  <div className="flex shrink-0 items-center gap-3"><div className="text-right"><p className="text-sm font-semibold text-white">{formatMoney(invoice.amountMinor, invoice.currency)}</p><p className={`mt-1 text-[10px] font-semibold ${statusTone[invoice.status] || 'text-white/50'}`}>{invoice.status.replace(/_/g, ' ')}</p></div><ChevronRight className="h-4 w-4 text-white/20" /></div>
  </button>)}</div></article>}
  {receipts.length > 0 && <article className="rounded-2xl border border-white/[0.08] bg-[#0d1118] p-4 sm:p-5">
  <h3 className="text-sm font-semibold text-white">Receipts</h3>
  <div className="mt-3 divide-y divide-white/[0.07]">{receipts.map((receipt) => <button key={receipt.id} type="button" onClick={() => navigateTo('receipt', receipt.id)} className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-white/[0.025]">
  <div className="min-w-0"><p className="truncate text-sm text-white/85">{receipt.receiptNumber}</p><p className="mt-1 text-[10px] text-white/38">Issued {new Date(receipt.issuedAt).toLocaleDateString()}</p></div>
  <div className="flex shrink-0 items-center gap-3"><p className="text-sm font-semibold text-white">{formatMoney(receipt.amountMinor, receipt.currency)}</p><ChevronRight className="h-4 w-4 text-white/20" /></div>
  </button>)}</div></article>}
  {refunds.length > 0 && <article className="rounded-2xl border border-white/[0.08] bg-[#0d1118] p-4 sm:p-5 xl:col-span-2">
  <h3 className="text-sm font-semibold text-white">Refunds</h3>
  <div className="mt-3 divide-y divide-white/[0.07]">{refunds.map((refund) => <div key={refund.id} className="flex items-center justify-between gap-3 py-3">
  <div className="min-w-0"><p className="truncate text-sm text-white/85">{refund.refundNumber}</p><p className="mt-1 truncate text-[10px] text-white/38">{refund.externalReferences?.length ? `Refund references ${refund.externalReferences.join(', ')}` : refund.externalReference ? `Reference ${refund.externalReference}` : 'Awaiting admin processing'}{refund.processedAt ? ` · ${new Date(refund.processedAt).toLocaleDateString()}` : ''}</p>{(refund.sourcePaymentReferences || []).map((reference) => { const source = billing.find(item => item.reference === reference); return source ? <button key={reference} type="button" onClick={() => navigateTo('transaction', source.id)} className="mt-1 mr-2 text-[10px] text-ai-blue hover:underline">Payment {reference}</button> : null; })}</div>
  <div className="shrink-0 text-right"><p className="text-sm font-semibold text-white">{refund.processedAmountMinor ? formatMoney(refund.processedAmountMinor, refund.currency) : formatMoney(refund.amountMinor, refund.currency)}</p>{refund.status === 'partial' && <p className="text-[10px] text-white/35">of {formatMoney(refund.amountMinor, refund.currency)}</p>}<p className={`mt-1 text-[10px] font-semibold ${statusTone[refund.status] || 'text-white/50'}`}>{refund.status.replace(/_/g, ' ')}</p></div>
  </div>)}</div></article>}
  </section>)}

  {buildContracts.length > 0 && (
  <section className="rounded-2xl border border-white/[0.08] bg-[#0d1118] p-4 sm:p-5">
  <div className="px-1 pb-4">
  <p className="text-sm font-semibold text-white">Build agreements</p>
  <p className="mt-1 text-xs text-white/40">Payment actions remain in Build Journey.</p>
  </div>
  <div className="divide-y divide-white/[0.07]">
  {buildContracts.map((contract) => (
  <button key={contract.id} type="button" onClick={() => navigateTo('contract', contract.id)} className="group flex w-full items-center justify-between gap-4 px-1 py-4 text-left transition hover:bg-white/[0.025]">
  <div className="min-w-0">
  <p className="truncate text-sm font-semibold text-white">{contract.businessName || contract.name || 'Untitled project'}</p>
  <p className={`mt-1 text-[10px] font-semibold ${contract.status === 'completed' ? 'text-expert-green' : 'text-amber-300/90'}`}>{contract.status?.replace(/_/g, ' ')}</p>
  <p className="mt-1 text-[11px] text-white/40">{contract.totalAgreedAmount ? `Agreed ${contract.quoteCurrency || 'USD'} ${contract.totalAgreedAmount.toLocaleString()}` : contract.paymentAgreementStatus === 'sent' ? 'Deposit due' : 'No payment terms issued'}</p>
  </div>
  <ChevronRight className="h-4 w-4 shrink-0 text-white/18 transition group-hover:translate-x-1 group-hover:text-white/55" />
  </button>
  ))}
  </div>
  </section>
  )}

  <section className="border-b border-white/12 pb-6">
  <div className="px-2 pb-4">
  <p className="text-[10px] font-semibold text-white/34">Transactions</p>
  </div>
  {visiblePayments.length === 0 ? (
  <p className="px-2 text-sm leading-6 text-white/34">No transactions yet.</p>
  ) : (
  <div className="divide-y divide-white/12">
  {visiblePayments.map((item) => (
  <button key={item.id} type="button" onClick={() => navigateTo('transaction', item.id)} className="group flex w-full items-center justify-between gap-4 px-2 py-3.5 text-left transition hover:bg-white/[0.01]">
  <div className="min-w-0">
  <p className="truncate text-sm font-semibold text-white">{item.description}</p>
  <p className="mt-1 truncate text-[11px] text-white/40">{typeof item.metadata?.projectName === 'string' ? item.metadata.projectName : item.serviceType?.replace(/_/g, ' ') || 'Sitemendr payment'}</p>
  <p className="mt-1 font-mono text-[10px] text-white/28">{new Date(item.createdAt).toLocaleDateString()}</p>
  </div>
  <div className="flex shrink-0 items-center gap-4">
  <div className="text-right">
  <p className="text-sm font-semibold text-white">{formatMoney(item.amount, item.currency)}</p>
  <p className={`text-[10px] font-semibold ${statusTone[item.status] || 'text-white/50'}`}>{item.status === 'pending' ? 'Processing' : item.status.replace(/_/g, ' ')}</p>
  </div>
  <ChevronRight className="h-4 w-4 text-white/18 transition group-hover:translate-x-1 group-hover:text-white/55" />
  </div>
  </button>
  ))}
  </div>
  )}
  </section>

  <section className="border-b border-white/12 pb-6">
  <div className="px-2 pb-4">
  <p className="text-[10px] font-semibold text-white/34">Currency rates</p>
  </div>
  <div className="px-2">
  <CurrencyRatesPanel defaultTarget={preferredCurrency} />
  </div>
  </section>

  <section className="pt-0.5">
  <p className="px-2 text-[10px] font-semibold text-white/34">Payment method</p>
  <div className="mt-4 flex items-center gap-4 px-2">
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
  </div>
  );
}
