// components/admin-dashboard/AdminTransactions.tsx
//
// Real, unified view of every Payment record across every client, regardless of
// what it was for (Build contracts today; Care and Add-ons once those exist too -
// this view needs no changes when they land, since serviceType already varies).
// Self-contained: fetches and paginates its own data rather than routing through
// the big shared useAdminDashboard hook, since pagination/filter state here is
// only relevant to this one screen.

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
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

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('ALL');
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
    }
    setLoading(false);
  }, [page, statusFilter, serviceTypeFilter, searchTerm]);

  useEffect(() => {
    const timeout = setTimeout(loadTransactions, searchTerm ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [loadTransactions, searchTerm]);

  useEffect(() => { setPage(1); }, [statusFilter, serviceTypeFilter, searchTerm]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-5 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-white">Transactions</h2>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/34">{pagination.total} total records</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <input type="text" placeholder="Search name, email, reference..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="min-h-10 w-full border border-white/10 bg-white/[0.03] pl-9 pr-4 text-[10px] font-black uppercase tracking-widest text-white outline-none transition focus:border-ai-blue" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-h-10 border border-white/10 bg-white/[0.03] px-4 text-[10px] font-black uppercase tracking-widest text-white outline-none transition focus:border-ai-blue">
            <option value="ALL">All status</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="superseded">Superseded</option>
          </select>
          <select value={serviceTypeFilter} onChange={(e) => setServiceTypeFilter(e.target.value)} className="min-h-10 border border-white/10 bg-white/[0.03] px-4 text-[10px] font-black uppercase tracking-widest text-white outline-none transition focus:border-ai-blue">
            <option value="ALL">All types</option><option value="build">Build</option><option value="care">Care</option><option value="addon">Add-on</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 text-[9px] font-black uppercase tracking-[0.14em] text-white/28">
              <th className="px-2 py-4 font-black">Payer</th>
              <th className="px-2 py-4 font-black">Reference</th>
              <th className="px-2 py-4 font-black">Type</th>
              <th className="px-2 py-4 font-black">Channel</th>
              <th className="px-2 py-4 font-black">Amount</th>
              <th className="px-2 py-4 font-black">Status</th>
              <th className="px-2 py-4 text-right font-black">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr><td colSpan={7} className="py-16 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/34">Loading transactions...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center">
                <CreditCard className="mx-auto mb-4 h-8 w-8 text-white/15" />
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/34">No transactions match these filters</p>
              </td></tr>
            ) : transactions.map((tx) => (
              <tr key={tx.id} className="transition hover:bg-white/[0.02]">
                <td className="px-2 py-4">
                  <p className="text-[11px] font-black uppercase tracking-tight text-white">{tx.payer?.name || 'Unknown'}</p>
                  <p className="text-[9px] font-medium text-white/34">{tx.payer?.email || '—'}</p>
                </td>
                <td className="px-2 py-4"><p className="font-mono text-[9px] font-black text-ai-blue">{tx.reference}</p></td>
                <td className="px-2 py-4"><span className="text-[8px] font-black uppercase tracking-widest text-tech-purple">{tx.serviceType?.replace(/_/g, ' ')}</span></td>
                <td className="px-2 py-4">
                  <p className="text-[9px] font-black uppercase text-white/70">{tx.cardType ? `${tx.cardType} •••• ${tx.last4 || ''}` : tx.channel?.replace(/_/g, ' ')}</p>
                  {tx.bank && <p className="mt-0.5 text-[8px] uppercase text-white/30">{tx.bank}</p>}
                </td>
                <td className="px-2 py-4"><p className="text-[10px] font-black text-white">{formatAmount(tx.amount, tx.currency)}</p></td>
                <td className="px-2 py-4"><span className={`text-[9px] font-black uppercase tracking-widest ${statusTone[tx.status] || 'text-white/50'}`}>{tx.status}</span></td>
                <td className="px-2 py-4 text-right"><p className="text-[9px] font-black uppercase tracking-widest text-white/34">{new Date(tx.createdAt).toLocaleDateString()}</p></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/34">Page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="grid h-9 w-9 place-items-center border border-white/10 text-white/60 transition hover:border-white/30 hover:text-white disabled:opacity-30"><ChevronLeft className="h-3.5 w-3.5" /></button>
            <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="grid h-9 w-9 place-items-center border border-white/10 text-white/60 transition hover:border-white/30 hover:text-white disabled:opacity-30"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}
    </div>
  );
}