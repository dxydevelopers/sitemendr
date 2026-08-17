'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, CreditCard, Search, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Transaction {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  serviceType: string;
  description: string;
  gateway: string;
  createdAt: string;
  payer: { id: string; name: string; email: string } | null;
  channel: string;
  cardType: string | null;
  last4: string | null;
  bank: string | null;
}

const formatAmount = (amountInSubunits: number, currency: string) =>
  `${currency} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((amountInSubunits || 0) / 100)}`;

const statusTone: Record<string, string> = {
  completed: 'text-expert-green',
  success: 'text-expert-green',
  pending: 'text-amber-300',
  failed: 'text-red-400',
  superseded: 'text-white/34',
};

const statusIcon = (status: string) => {
  if (status === 'completed' || status === 'success') return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === 'pending') return <CircleDashed className="h-3.5 w-3.5" />;
  if (status === 'failed') return <AlertTriangle className="h-3.5 w-3.5" />;
  return <CreditCard className="h-3.5 w-3.5" />;
};

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('ALL');
  const [openMenu, setOpenMenu] = useState<'status' | 'type' | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getTransactions({
        page,
        limit: 25,
        status: statusFilter,
        serviceType: serviceTypeFilter,
        search: searchTerm || undefined,
      });
      if (res.success) {
        setTransactions(res.data as Transaction[]);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, serviceTypeFilter, searchTerm]);

  useEffect(() => {
    const timeout = setTimeout(loadTransactions, searchTerm ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [loadTransactions, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, serviceTypeFilter, searchTerm]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="animate-fade-in space-y-5">
      <section className="border-b border-white/10 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="inline-flex items-center border border-white/10 bg-white/[0.02] px-3 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-white/42">
            {pagination.total} total records
          </div>
        </div>

        <div className="mt-4 grid gap-3 border-y border-white/10 py-3 lg:grid-cols-[minmax(0,1fr)_11rem_11rem] lg:items-end">
          <label className="relative">
            <span className="mb-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.24em] text-white/24">
              <Search className="h-3 w-3" />
              Search
            </span>
            <Search className="pointer-events-none absolute left-3 top-[2.4rem] h-3.5 w-3.5 text-white/28" />
            <input
              type="text"
              placeholder="Search name, email, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-h-10 w-full rounded-xl border border-white/12 bg-[#05070a] py-2.5 pl-9 pr-4 text-[11px] font-semibold tracking-[0.12em] text-white outline-none transition placeholder:text-white/24 focus:border-white/22 focus:ring-0"
            />
          </label>

          <div className="relative">
            <span className="mb-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.24em] text-white/24">
              <SlidersHorizontal className="h-3 w-3" />
              Status
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(openMenu === 'status' ? null : 'status');
              }}
              className="flex min-h-10 w-full items-center justify-between rounded-xl border border-white/12 bg-[#05070a] px-3 py-2.5 text-left text-[11px] font-semibold tracking-[0.12em] text-white transition hover:border-white/20"
            >
              <span>{statusFilter === 'ALL' ? 'All status' : statusFilter}</span>
              <ChevronDown className="h-4 w-4 text-white/28" />
            </button>
            {openMenu === 'status' && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden border border-white/12 bg-[#05070a] shadow-2xl shadow-black/40">
                {[
                  ['ALL', 'All status'],
                  ['completed', 'Completed'],
                  ['pending', 'Pending'],
                  ['failed', 'Failed'],
                  ['superseded', 'Superseded'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusFilter(value);
                      setOpenMenu(null);
                    }}
                    className="block w-full px-3 py-2 text-left text-[11px] font-semibold tracking-[0.12em] text-white/72 transition hover:bg-white/[0.04] hover:text-white"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <span className="mb-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.24em] text-white/24">
              <SlidersHorizontal className="h-3 w-3" />
              Type
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(openMenu === 'type' ? null : 'type');
              }}
              className="flex min-h-10 w-full items-center justify-between rounded-xl border border-white/12 bg-[#05070a] px-3 py-2.5 text-left text-[11px] font-semibold tracking-[0.12em] text-white transition hover:border-white/20"
            >
              <span>{serviceTypeFilter === 'ALL' ? 'All types' : serviceTypeFilter.replace(/_/g, ' ')}</span>
              <ChevronDown className="h-4 w-4 text-white/28" />
            </button>
            {openMenu === 'type' && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden border border-white/12 bg-[#05070a] shadow-2xl shadow-black/40">
                {[
                  ['ALL', 'All types'],
                  ['build', 'Build'],
                  ['care', 'Care'],
                  ['addon', 'Add-on'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setServiceTypeFilter(value);
                      setOpenMenu(null);
                    }}
                    className="block w-full px-3 py-2 text-left text-[11px] font-semibold tracking-[0.12em] text-white/72 transition hover:bg-white/[0.04] hover:text-white"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-white/20">
        <div className="hidden grid-cols-12 gap-4 border-b border-white/20 px-4 py-3 text-[8px] font-black uppercase tracking-[0.22em] text-white/28 xl:grid">
          <div className="col-span-3">Payer</div>
          <div className="col-span-2">Reference</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-2">Channel</div>
          <div className="col-span-1">Amount</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2 text-right">Date</div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/34">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="mx-auto mb-4 h-8 w-8 text-white/15" />
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/34">No transactions match these filters</p>
          </div>
        ) : (
          <div className="divide-y divide-white/20">
            {transactions.map((tx) => (
              <div key={tx.id} className="grid grid-cols-1 gap-4 border-b border-white/20 px-1 py-4 transition hover:bg-white/[0.02] xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_auto] xl:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[11px] font-black uppercase tracking-tight text-white">{tx.payer?.name || 'Unknown'}</p>
                    <span className={`inline-flex items-center gap-1 border border-white/12 px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] ${statusTone[tx.status] || 'text-white/50'}`}>
                      {statusIcon(tx.status)}
                      {tx.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[9px] font-medium text-white/34">{tx.payer?.email || '—'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center border border-white/20 bg-transparent px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/60">
                      {tx.serviceType?.replace(/_/g, ' ')}
                    </span>
                    <span className="inline-flex items-center border border-white/20 bg-transparent px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/60">
                      {tx.cardType ? `${tx.cardType} •••• ${tx.last4 || ''}` : tx.channel?.replace(/_/g, ' ')}
                    </span>
                    {tx.bank && (
                      <span className="inline-flex items-center border border-white/20 bg-transparent px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
                        {tx.bank}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-1 xl:justify-items-start">
                  <p className="text-[8px] font-black uppercase tracking-[0.22em] text-white/28">Reference</p>
                  <p className="font-mono text-[9px] font-black text-ai-blue">{tx.reference}</p>
                </div>

                <div className="grid gap-1 xl:justify-items-start">
                  <p className="text-[8px] font-black uppercase tracking-[0.22em] text-white/28">Amount</p>
                  <p className="text-[10px] font-black text-white">{formatAmount(tx.amount, tx.currency)}</p>
                </div>

                <div className="flex items-center justify-between xl:justify-end">
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase tracking-[0.22em] text-white/28">Date</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/34">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="ml-4 h-4 w-4 text-white/24" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/34">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="grid h-9 w-9 place-items-center border border-white/10 text-white/60 transition hover:border-white/20 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="grid h-9 w-9 place-items-center border border-white/10 text-white/60 transition hover:border-white/20 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


