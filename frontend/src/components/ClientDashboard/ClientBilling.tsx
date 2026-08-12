'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronRight, CreditCard, Search, ArrowLeftRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { BillingItem, ClientProject } from './ClientDashboard_types';
import { ContractDetail, SubscriptionDetail, TransactionDetail } from './BillingDetailViews';

interface ClientBillingProps {
  billing: BillingItem[];
  projects: ClientProject[];
}

const statusTone: Record<string, string> = {
  completed: 'text-expert-green',
  success: 'text-expert-green',
  active: 'text-expert-green',
  pending: 'text-amber-300',
  failed: 'text-red-400',
  superseded: 'text-white/34',
  cancelled: 'text-white/34',
};

const formatMoney = (amountInSubunits: number, currency?: string) =>
  `${currency || 'USD'} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((amountInSubunits || 0) / 100)}`;

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
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/44">
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
              <p className="text-[13px] leading-6 text-white/72">
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

export default function ClientBilling({ billing, projects }: ClientBillingProps) {
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

  const buildContracts = useMemo(() => projects.filter((p) => p.recordType === 'request'), [projects]);
  const careSubscriptions: ClientProject[] = [];
  const preferredCurrency = billing[0]?.preferredCurrency || 'USD';
  const mostRecentChannelItem = billing.find((item) => item.channel);
  const selectedTransaction = view === 'transaction' && recordId ? billing.find((item) => item.id === recordId) : null;

  if (view === 'contract' && recordId) return <div className="animate-fade-in pb-16"><ContractDetail contractId={recordId} /></div>;
  if (view === 'subscription' && recordId) return <div className="animate-fade-in pb-16"><SubscriptionDetail subscriptionId={recordId} /></div>;
  if (selectedTransaction) return <div className="animate-fade-in pb-16"><TransactionDetail transaction={selectedTransaction} /></div>;

  return (
    <div className="animate-fade-in pb-16">
      <div className="space-y-8">
        {buildContracts.length > 0 && (
          <section className="border-b border-white/10 pb-7">
            <div className="px-2 pb-4">
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-ai-blue/80">Contracts</p>
            </div>
            <div className="divide-y divide-white/10">
              {buildContracts.map((contract) => (
                <button key={contract.id} type="button" onClick={() => navigateTo('contract', contract.id)} className="group flex w-full items-center justify-between gap-5 px-2 py-4 text-left transition hover:bg-white/[0.015]">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold tracking-tight text-white">{contract.businessName || contract.name || 'Untitled project'}</p>
                    <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.18em] ${contract.status === 'completed' ? 'text-expert-green' : 'text-amber-300/90'}`}>{contract.status?.replace(/_/g, ' ')}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/18 transition group-hover:translate-x-1 group-hover:text-white/55" />
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="border-b border-white/10 pb-7">
          <div className="px-2 pb-4">
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-expert-green/80">Care subscriptions</p>
          </div>
          {careSubscriptions.length === 0 ? (
            <p className="px-2 text-sm leading-6 text-white/34">No active care subscriptions.</p>
          ) : (
            <div className="divide-y divide-white/10">
              {careSubscriptions.map((sub) => (
                <button key={sub.id} type="button" onClick={() => navigateTo('subscription', sub.id)} className="group flex w-full items-center justify-between gap-5 px-2 py-4 text-left transition hover:bg-white/[0.015]">
                  <p className="truncate text-[15px] font-semibold tracking-tight text-white">{sub.name}</p>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/18 transition group-hover:translate-x-1 group-hover:text-white/55" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="border-b border-white/10 pb-7">
          <div className="px-2 pb-4">
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/34">Transactions</p>
          </div>
          {billing.length === 0 ? (
            <p className="px-2 text-sm leading-6 text-white/34">No transactions yet.</p>
          ) : (
            <div className="divide-y divide-white/10">
              {billing.map((item) => (
                <button key={item.id} type="button" onClick={() => navigateTo('transaction', item.id)} className="group flex w-full items-center justify-between gap-5 px-2 py-4 text-left transition hover:bg-white/[0.015]">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold tracking-tight text-white">{item.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-white/28">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right">
                      <p className="text-[15px] font-black tracking-tight text-white">{formatMoney(item.amount, item.currency)}</p>
                      <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${statusTone[item.status] || 'text-white/50'}`}>{item.status}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/18 transition group-hover:translate-x-1 group-hover:text-white/55" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="border-b border-white/10 pb-7">
          <div className="px-2 pb-4">
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/34">Currency rates</p>
          </div>
          <div className="px-2">
            <CurrencyRatesPanel defaultTarget={preferredCurrency} />
          </div>
        </section>

        <section className="pt-1">
          <p className="px-2 text-[9px] font-black uppercase tracking-[0.24em] text-white/34">Payment method</p>
          <div className="mt-4 flex items-center gap-4 px-2">
            <CreditCard className="h-5 w-5 shrink-0 text-white/24" />
            {mostRecentChannelItem ? (
              <p className="text-[15px] font-semibold tracking-tight text-white">
                Last used: {mostRecentChannelItem.cardType ? `${mostRecentChannelItem.cardType} •••• ${mostRecentChannelItem.last4 || ''}` : (mostRecentChannelItem.channel || 'card').replace(/_/g, ' ')}
              </p>
            ) : (
              <p className="text-[15px] text-white/40">No payment history yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
