'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Clock3, LoaderCircle, RefreshCw, Wrench } from 'lucide-react';
import { apiClient, type AddonFulfillmentPurchase } from '@/lib/api';

type QueueFilter = 'all' | 'pending' | 'in_progress' | 'fulfilled';

const statusLabel: Record<QueueFilter, string> = {
  all: 'All',
  pending: 'Needs setup',
  in_progress: 'In progress',
  fulfilled: 'Ready'
};

const statusTone: Record<string, string> = {
  pending: 'text-amber-300 bg-amber-300/10 border-amber-300/20',
  in_progress: 'text-ai-blue bg-ai-blue/10 border-ai-blue/20',
  fulfilled: 'text-expert-green bg-expert-green/10 border-expert-green/20'
};

export default function AdminAddonFulfillment() {
  const [purchases, setPurchases] = useState<AddonFulfillmentPurchase[]>([]);
  const [filter, setFilter] = useState<QueueFilter>('pending');
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.getAdminAddonPurchases();
      if (!response.success) throw new Error(response.message || 'Could not load add-on setup queue.');
      setPurchases(response.data || []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load add-on setup queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPurchases(); }, [loadPurchases]);

  const visiblePurchases = useMemo(() => filter === 'all'
    ? purchases
    : purchases.filter((purchase) => purchase.status === filter), [filter, purchases]);

  const updateStatus = async (purchase: AddonFulfillmentPurchase, status: 'pending' | 'in_progress' | 'fulfilled') => {
    const key = `${purchase.siteId}:${purchase.addon.id}`;
    setSavingKey(key);
    setError('');
    try {
      const response = await apiClient.updateAdminAddonFulfillment(
        purchase.siteId,
        purchase.addon.id,
        status,
        notes[key] || ''
      );
      if (!response.success) throw new Error(response.message || 'Could not update add-on setup.');
      setPurchases((current) => current.map((item) => item.siteId === purchase.siteId && item.addon.id === purchase.addon.id
        ? { ...item, status, adminNote: notes[key] || '', statusUpdatedAt: new Date().toISOString() }
        : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update add-on setup.');
    } finally {
      setSavingKey(null);
    }
  };

  const counts: Record<QueueFilter, number> = {
    all: purchases.length,
    pending: purchases.filter((purchase) => purchase.status === 'pending').length,
    in_progress: purchases.filter((purchase) => purchase.status === 'in_progress').length,
    fulfilled: purchases.filter((purchase) => purchase.status === 'fulfilled').length
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ai-blue">Site delivery</p>
          <h2 className="text-2xl font-semibold text-white">Add-on setup</h2>
          <p className="max-w-2xl text-sm leading-6 text-white/45">Review paid add-ons that need a Sitemendr setup step. Mark them ready after the work is complete.</p>
        </div>
        <button type="button" onClick={() => void loadPurchases()} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 border border-white/10 px-4 text-xs font-semibold text-white/70 transition hover:border-ai-blue/30 hover:text-white disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      <div className="flex gap-2 overflow-x-auto border-b border-white/[0.08] pb-3">
        {(['pending', 'in_progress', 'fulfilled', 'all'] as QueueFilter[]).map((value) => (
          <button key={value} type="button" onClick={() => setFilter(value)} className={`inline-flex min-h-9 shrink-0 items-center gap-2 border px-3 text-xs font-semibold transition ${filter === value ? 'border-ai-blue/30 bg-ai-blue/10 text-white' : 'border-white/[0.08] text-white/45 hover:text-white/75'}`}>
            {statusLabel[value]} <span className="text-[10px] opacity-60">{counts[value]}</span>
          </button>
        ))}
      </div>

      {error && <div role="alert" className="border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">{error}</div>}

      {loading ? (
        <div className="grid min-h-52 place-items-center text-white/40"><LoaderCircle className="h-6 w-6 animate-spin" /></div>
      ) : visiblePurchases.length ? (
        <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {visiblePurchases.map((purchase) => {
            const key = `${purchase.siteId}:${purchase.addon.id}`;
            const busy = savingKey === key;
            return (
              <article key={key} className="grid gap-5 py-5 md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.8fr)_auto] md:items-center">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{purchase.addon.name}</h3>
                    <span className={`inline-flex items-center gap-1 border px-2 py-1 text-[9px] font-semibold ${statusTone[purchase.status] || statusTone.pending}`}>
                      {purchase.status === 'fulfilled' ? <Check className="h-3 w-3" /> : purchase.status === 'in_progress' ? <Wrench className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                      {statusLabel[purchase.status as QueueFilter] || 'Needs setup'}
                    </span>
                  </div>
                  <p className="truncate text-xs font-medium text-white/65">{purchase.siteName}{purchase.domain ? ` · ${purchase.domain}` : ''}</p>
                  <p className="truncate text-[11px] text-white/38">{purchase.user.name} · {purchase.user.email}</p>
                  {purchase.paymentId && <p className="truncate font-mono text-[9px] text-white/25">Payment {purchase.paymentId}</p>}
                </div>

                <div className="space-y-2">
                  <label className="sr-only" htmlFor={`addon-note-${key}`}>Setup note</label>
                  <textarea id={`addon-note-${key}`} value={notes[key] ?? purchase.adminNote ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [key]: event.target.value }))} maxLength={1000} rows={2} placeholder="Optional note for the client" className="w-full resize-y border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs text-white/80 outline-none placeholder:text-white/25 focus:border-ai-blue/40" />
                  {purchase.purchasedAt && <p className="text-[10px] text-white/32">Purchased {new Date(purchase.purchasedAt).toLocaleDateString()}</p>}
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  {purchase.status !== 'in_progress' && purchase.status !== 'fulfilled' && <button type="button" onClick={() => void updateStatus(purchase, 'in_progress')} disabled={busy} className="min-h-9 border border-ai-blue/25 px-3 text-[10px] font-semibold text-ai-blue transition hover:bg-ai-blue/10 disabled:opacity-50">Start setup</button>}
                  {purchase.status !== 'fulfilled' && <button type="button" onClick={() => void updateStatus(purchase, 'fulfilled')} disabled={busy} className="min-h-9 bg-expert-green px-3 text-[10px] font-semibold text-[#06120b] transition hover:brightness-110 disabled:opacity-50">{busy ? 'Saving…' : 'Mark ready'}</button>}
                  {purchase.status === 'fulfilled' && <button type="button" onClick={() => void updateStatus(purchase, 'in_progress')} disabled={busy} className="min-h-9 border border-white/10 px-3 text-[10px] font-semibold text-white/55 transition hover:text-white disabled:opacity-50">Reopen setup</button>}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="grid min-h-56 place-items-center border-y border-white/[0.08] px-5 text-center">
          <div className="space-y-2"><h3 className="text-sm font-semibold text-white">Nothing in this queue</h3><p className="text-xs text-white/40">Paid add-ons that need admin setup will appear here.</p></div>
        </div>
      )}
    </section>
  );
}
