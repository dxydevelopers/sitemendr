// components/client-dashboard/BillingDetailViews.tsx
//
// The three drill-down views the billing page navigates into.

'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { BillingItem } from './ClientDashboard_types';

const formatMoney = (amountInSubunits: number, currency?: string) =>
  `${currency || 'USD'} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((amountInSubunits || 0) / 100)}`;

const formatMajorUnits = (amount: number, currency?: string) =>
  `${currency || 'USD'} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0)}`;

const statusTone: Record<string, string> = {
  completed: 'text-expert-green',
  success: 'text-expert-green',
  active: 'text-expert-green',
  pending: 'text-amber-300',
  processing: 'text-amber-300',
  failed: 'text-red-400',
  superseded: 'text-white/34',
  cancelled: 'text-white/34',
};

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

export function ContractDetail({ contractId }: ContractDetailProps) {
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<{ id: string; title: string; businessName?: string; status: string; totalAgreedAmount?: number; quoteCurrency?: string; completedAt?: string } | null>(null);
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

  return (
    <div className="animate-fade-in">
      <div className="border-y border-white/12 py-6">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-ai-blue">One-time contract</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{contract.businessName || contract.title || 'Untitled project'}</h2>
        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/28">Status</p>
            <p className={`mt-2 text-sm font-black uppercase ${isCompleted ? 'text-expert-green' : 'text-amber-300'}`}>{contract.status.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/28">Total agreed</p>
            <p className="mt-2 text-sm font-black text-white">{contract.totalAgreedAmount ? formatMajorUnits(contract.totalAgreedAmount, contract.quoteCurrency) : 'Not yet quoted'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/28">{isCompleted ? 'Completed' : 'Started'}</p>
            <p className="mt-2 text-sm font-black text-white">{isCompleted && contract.completedAt ? new Date(contract.completedAt).toLocaleDateString() : 'In progress'}</p>
          </div>
        </div>
      </div>

      <div className="py-6">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/34">Payment history</p>
        <div className="mt-4 divide-y divide-white/12">
          {payments.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/34">No payments recorded for this contract yet.</p>
          ) : payments.map((payment) => (
            <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{payment.description}</p>
                <p className="mt-1 font-mono text-[10px] text-white/34">{payment.reference}</p>
                {payment.status === 'superseded' && <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-amber-300/70">Superseded by a later attempt</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-white">{formatMoney(payment.amount, payment.currency)}</p>
                <p className={`text-[9px] font-black uppercase tracking-widest ${statusTone[payment.status] || 'text-white/50'}`}>{payment.status}</p>
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
}

export function TransactionDetail({ transaction }: TransactionDetailProps) {
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
            <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${statusTone[transaction.status] || 'text-white/50'}`}>{transaction.status.replace(/_/g, ' ')}</p>
            <h2 className="mt-2 max-w-2xl text-[26px] font-black tracking-tight text-white sm:text-[28px]">{transaction.description}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/42">
              Payment record for this billing event.
            </p>
          </div>
          <div className="shrink-0 border border-white/12 bg-transparent px-3.5 py-3 text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Amount</p>
            <p className="mt-2 text-[26px] font-black tracking-tight text-white sm:text-[28px]">{formatMoney(transaction.amount, transaction.currency)}</p>
            {transaction.convertedAmount != null && <p className="mt-1 text-xs text-white/38">≈ {formatMajorUnits(transaction.convertedAmount, transaction.preferredCurrency)}</p>}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="border border-white/12 bg-transparent px-3.5 py-3.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/28">Reference</p>
            <p className="mt-2 break-all font-mono text-xs font-semibold leading-5 text-white">{transaction.reference}</p>
          </div>
          <div className="border border-white/12 bg-transparent px-3.5 py-3.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/28">Channel</p>
            <p className="mt-2 text-xs font-semibold text-white">{transaction.cardType ? `${transaction.cardType} •••• ${transaction.last4 || ''}` : (transaction.channel || 'card').replace(/_/g, ' ')}</p>
            {transaction.bank && <p className="mt-1 text-[10px] text-white/34">{transaction.bank}</p>}
          </div>
          <div className="border border-white/12 bg-transparent px-3.5 py-3.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/28">Type</p>
            <p className="mt-2 text-xs font-semibold capitalize text-white">{(transaction.serviceType || '').replace(/_/g, ' ') || '—'}</p>
          </div>
          <div className="border border-white/12 bg-transparent px-3.5 py-3.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/28">Date</p>
            <p className="mt-2 text-xs font-semibold text-white">{new Date(transaction.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {relatedAttempts.length > 0 && (
        <div className="py-5">
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-white/30" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/34">Earlier attempts</p>
            </div>
            <span className="rounded-full border border-white/12 bg-transparent px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/40">
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
                <span className={`text-[9px] font-black uppercase tracking-widest ${statusTone[attempt.status] || 'text-white/50'}`}>{attempt.status}</span>
                <p className="text-xs text-white/34 sm:text-right">{new Date(attempt.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}




