'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, CreditCard, Layout } from 'lucide-react';
import { apiClient } from '@/lib/api';

type SubscriptionDetail = {
  id: string;
  status?: string;
  planType?: string;
  tier?: string;
  siteName?: string;
  customName?: string;
  user?: { name?: string; email?: string };
  paymentStatus?: string;
  lastPaymentDate?: string;
  createdAt?: string;
  expiresAt?: string;
  isCurrent?: boolean;
};

export default function AdminSubscriptionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id || '');
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(null);

  const loadSubscription = useCallback(async () => {
    try {
      const response = await apiClient.getAdminSubscriptions() as { success: boolean; data?: SubscriptionDetail[] };
      if (!response.success) {
        setSubscription(null);
        return;
      }

      const match = (response.data || []).find((item) => item.id === id) || null;
      setSubscription(match);
    } catch (error) {
      console.error('Failed to load subscription details:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="relative mx-auto flex max-w-6xl flex-col gap-7 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(255,184,0,0.12),transparent_70%)]" />
        <button
          type="button"
          onClick={() => router.push('/admin/subscriptions')}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/42 transition hover:text-white"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          Back to billing
        </button>

        <header className="border-b border-white/12 pb-6">
          <p className="text-[9px] font-black uppercase tracking-[0.28em] text-amber-300/80">Billing & Agreements</p>
          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <h1 className="truncate text-[32px] font-black tracking-tight text-white">{subscription?.customName || subscription?.siteName || id}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">
                Billing state, agreement health, and admin actions in one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <span className="inline-flex items-center gap-2 border border-white/12 bg-white/[0.02] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/80">
                <CreditCard className="h-4 w-4 text-amber-300" />
                {subscription?.status || 'Loading'}
              </span>
              <span className="inline-flex items-center border border-white/12 bg-white/[0.02] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/64">
                {subscription?.paymentStatus || 'Unknown billing'}
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-px border border-white/10 bg-white/[0.04] md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'ID', value: id },
            { label: 'Billing', value: subscription?.paymentStatus || 'Unknown' },
            { label: 'Tier', value: subscription?.tier || 'Unknown' },
            { label: 'Plan', value: subscription?.planType || 'Unknown' },
          ].map(item => (
            <div key={item.label} className="bg-[#05070a] px-5 py-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">{item.label}</p>
              <p className="mt-3 text-[15px] font-semibold tracking-tight text-white">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="border border-white/12 bg-white/[0.02] p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/34">Client</p>
            <p className="mt-2 text-sm font-semibold text-white">{subscription?.user?.name || 'Guest'}</p>
            <p className="mt-1 text-sm text-white/48">{subscription?.user?.email || 'No email on file'}</p>
          </div>
          <div className="border border-white/12 bg-white/[0.02] p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/34">Dates</p>
            <p className="mt-2 text-sm text-white/48">Created: {subscription?.createdAt ? new Date(subscription.createdAt).toLocaleDateString() : 'Unknown'}</p>
            <p className="mt-1 text-sm text-white/48">Last payment: {subscription?.lastPaymentDate ? new Date(subscription.lastPaymentDate).toLocaleDateString() : 'Unknown'}</p>
            <p className="mt-1 text-sm text-white/48">Expires: {subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'Unknown'}</p>
          </div>
        </section>

        <section className="border border-white/12 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
            <Layout className="h-4 w-4 text-ai-blue" />
            Management
          </div>
          <div className="mt-4 grid gap-px overflow-hidden border border-white/10 bg-white/5 sm:grid-cols-2 xl:grid-cols-3">
            {['Review payment state', 'Check agreement status', 'Suspend or restore access'].map((item) => (
              <button
                type="button"
                key={item}
                className={`group flex min-h-20 flex-col justify-between bg-[#05070a] px-4 py-4 text-left transition hover:bg-white/[0.03] ${
                  item === 'Review payment state' ? 'ring-1 ring-inset ring-amber-300/20' : ''
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/24">Action</span>
                <span className={`text-sm font-semibold tracking-tight transition group-hover:text-white ${item === 'Review payment state' ? 'text-amber-100' : 'text-white/86'}`}>
                  {item}
                </span>
              </button>
            ))}
          </div>
        </section>

        {loading && <div className="text-sm text-white/42">Loading billing record...</div>}
        {!loading && !subscription && <div className="text-sm text-white/42">No billing record found for this deployment.</div>}
      </div>
    </main>
  );
}
