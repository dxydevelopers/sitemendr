'use client';

import React from 'react';
import { CreditCard, Download, ExternalLink, Mail, FileSearch } from 'lucide-react';

interface BillingItem {
  id: string;
  amount: number;
  currency?: string;
  status: string;
  description: string;
  createdAt: string;
  reference: string;
  preferredCurrency?: string;
  convertedAmount?: number | null;
}

interface BuildContract {
  id: string;
  name: string;
  status: string;
  totalAgreedAmount?: number;
  quoteCurrency?: string;
  completedAt?: string;
}

interface CareSubscription {
  id: string;
  siteName?: string;
  customName?: string;
  planType?: string;
  status: string;
  expiresAt?: string;
  price?: number;
  currency?: string;
}

interface PaymentMethod {
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
}

interface BillingViewerProps {
  billing: BillingItem[];
  paymentMethod?: PaymentMethod | null;
  buildContracts?: BuildContract[];
  careSubscriptions?: CareSubscription[];
  onManageSubscription?: (subscriptionId: string) => void;
  onDownloadReceipt?: (billingId: string) => void;
  onUpdatePaymentMethod?: () => void;
  onChangeBillingEmail?: () => void;
  onRequestAudit?: () => void;
}

const formatMoney = (amountInSubunits: number, currency?: string) =>
  `${currency || 'USD'} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((amountInSubunits || 0) / 100)}`;

const formatMajorUnits = (amount: number, currency?: string) =>
  `${currency || 'USD'} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0)}`;

const statusTone: Record<string, string> = {
  completed: 'text-expert-green',
  success: 'text-expert-green',
  active: 'text-expert-green',
  pending: 'text-amber-300',
  failed: 'text-red-400',
  cancelled: 'text-white/34',
  superseded: 'text-white/34',
};

const BillingViewer: React.FC<BillingViewerProps> = ({ billing, paymentMethod, buildContracts = [], careSubscriptions = [], onManageSubscription, onDownloadReceipt, onUpdatePaymentMethod, onChangeBillingEmail, onRequestAudit }) => {
  const totalPaid = billing
    .filter((item) => ['completed', 'success'].includes(item.status))
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  const primaryCurrency = billing[0]?.currency || 'USD';

  return (
    <div className="animate-fade-in pb-16">
      {/* Header strip */}
      <div className="border-y border-white/10">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
          <div className="px-5 py-6">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Total paid</p>
            <p className="mt-2 text-xl font-black tracking-tight text-expert-green">{formatMoney(totalPaid, primaryCurrency)}</p>
          </div>
          <div className="px-5 py-6">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Build contracts</p>
            <p className="mt-2 text-xl font-black tracking-tight text-white">{buildContracts.length}</p>
          </div>
          <div className="px-5 py-6">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Care plans</p>
            <p className="mt-2 text-xl font-black tracking-tight text-white">{careSubscriptions.length}</p>
          </div>
          <div className="px-5 py-6">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Transactions</p>
            <p className="mt-2 text-xl font-black tracking-tight text-white">{billing.length}</p>
          </div>
        </div>
      </div>

      {/* Build contracts */}
      {buildContracts.length > 0 && (
        <div className="border-b border-white/10">
          <div className="px-2 pt-8 pb-4">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-ai-blue">Build contracts</p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-white/10 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            {buildContracts.map((contract) => {
              const isCompleted = contract.status === 'completed';
              return (
                <div key={contract.id} className="p-6 lg:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/28">One-time contract</p>
                      <h3 className="mt-1 truncate text-lg font-black tracking-tight text-white">{contract.name || 'Untitled project'}</h3>
                    </div>
                    <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest ${isCompleted ? 'text-expert-green' : 'text-amber-300'}`}>{contract.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-6 border-t border-white/10 pt-5">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/28">Total agreed</p>
                      <p className="mt-2 text-sm font-black text-white">{contract.totalAgreedAmount ? formatMajorUnits(contract.totalAgreedAmount, contract.quoteCurrency) : 'Not yet quoted'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/28">{isCompleted ? 'Completed' : 'Status'}</p>
                      <p className="mt-2 text-sm font-black text-white">{isCompleted && contract.completedAt ? new Date(contract.completedAt).toLocaleDateString() : 'In progress'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Care subscriptions */}
      <div className="border-b border-white/10">
        <div className="px-2 pt-8 pb-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-expert-green">Care subscriptions</p>
        </div>
        {careSubscriptions.length > 0 ? (
          <div className="grid grid-cols-1 divide-y divide-white/10 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            {careSubscriptions.map((sub) => (
              <div key={sub.id} className="p-6 lg:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/28">Active plan</p>
                    <h3 className="mt-1 truncate text-lg font-black tracking-tight text-white">{sub.siteName || sub.customName || 'Untitled Project'}</h3>
                  </div>
                  <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest ${statusTone[sub.status.toLowerCase()] || 'text-white/50'}`}>{sub.status}</span>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-6 border-t border-white/10 pt-5">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/28">Care level</p>
                    <p className="mt-2 text-sm font-black text-white">{(sub.planType || 'care_plan').replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/28">Renews</p>
                    <p className="mt-2 text-sm font-black text-white">{sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-ai-blue">{sub.price ? `${formatMajorUnits(sub.price, sub.currency)} / period` : 'Plan active'}</p>
                  <button onClick={() => onManageSubscription?.(sub.id)} className="text-[9px] font-black uppercase tracking-[0.14em] text-white/44 transition hover:text-white">Manage →</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center lg:px-8">
            <p className="text-sm font-semibold text-white/50">You don&apos;t have an active care subscription yet.</p>
            <p className="mt-2 text-xs text-white/30">Once you add ongoing care to a site, it&apos;ll show up here.</p>
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div className="border-b border-white/10">
        <div className="px-2 pt-8 pb-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/34">Transaction history</p>
        </div>

        {/* Mobile */}
        <div className="block lg:hidden divide-y divide-white/10">
          {billing.length === 0 ? (
            <p className="px-2 py-10 text-center text-sm text-white/34">No transactions yet.</p>
          ) : billing.map((item) => (
            <div key={item.id} className="px-2 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{item.description}</p>
                  <p className="mt-1 font-mono text-[10px] text-white/34">{item.reference}</p>
                </div>
                <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest ${statusTone[item.status.toLowerCase()] || 'text-white/50'}`}>{item.status}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-white">{formatMoney(item.amount, item.currency)}</p>
                  {item.convertedAmount != null && <p className="text-xs text-white/34">≈ {formatMajorUnits(item.convertedAmount, item.preferredCurrency)}</p>}
                </div>
                <p className="text-xs text-white/34">{new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop */}
        <div className="hidden lg:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-[9px] font-black uppercase tracking-[0.14em] text-white/28">
                <th className="px-2 py-3 font-black">Description</th>
                <th className="px-2 py-3 font-black">Reference</th>
                <th className="px-2 py-3 font-black">Amount</th>
                <th className="px-2 py-3 font-black">Status</th>
                <th className="px-2 py-3 text-right font-black">Date</th>
                <th className="px-2 py-3 text-right font-black">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {billing.length === 0 ? (
                <tr><td colSpan={6} className="px-2 py-10 text-center text-sm text-white/34">No transactions yet.</td></tr>
              ) : billing.map((item) => (
                <tr key={item.id} className="transition hover:bg-white/[0.02]">
                  <td className="px-2 py-4 text-sm font-semibold text-white">{item.description}</td>
                  <td className="px-2 py-4 font-mono text-xs text-white/40">{item.reference}</td>
                  <td className="px-2 py-4">
                    <p className="text-sm font-black text-white">{formatMoney(item.amount, item.currency)}</p>
                    {item.convertedAmount != null && <p className="text-xs text-white/34">≈ {formatMajorUnits(item.convertedAmount, item.preferredCurrency)}</p>}
                  </td>
                  <td className={`px-2 py-4 text-[10px] font-black uppercase tracking-widest ${statusTone[item.status.toLowerCase()] || 'text-white/50'}`}>{item.status}</td>
                  <td className="px-2 py-4 text-right text-xs text-white/40">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="px-2 py-4 text-right">
                    <button onClick={() => onDownloadReceipt?.(item.id)} className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-ai-blue transition hover:text-white"><Download className="h-3 w-3" />Get</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment method + billing contact */}
      <div className="grid grid-cols-1 divide-y divide-white/10 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="p-6 lg:p-8">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/34">Payment method</p>
          <div className="mt-5 flex items-center gap-4">
            <CreditCard className="h-5 w-5 shrink-0 text-white/30" />
            {paymentMethod ? (
              <p className="text-sm font-semibold text-white">{paymentMethod.brand} •••• {paymentMethod.last4}</p>
            ) : (
              <p className="text-sm text-white/44">No active payment method attached.</p>
            )}
          </div>
          <button onClick={onUpdatePaymentMethod} className="mt-5 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:text-white">
            {paymentMethod ? 'Update' : 'Add payment method'} <ExternalLink className="h-3 w-3" />
          </button>
        </div>
        <div className="p-6 lg:p-8">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/34">Billing contact</p>
          <div className="mt-5 flex items-center gap-4">
            <Mail className="h-5 w-5 shrink-0 text-white/30" />
            <div>
              <p className="text-sm font-semibold text-white">Accounts Payable</p>
              <p className="text-xs text-white/44">billing@sitemendr.com</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-5">
            <button onClick={onChangeBillingEmail} className="text-[9px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:text-white">Change email</button>
            <button onClick={onRequestAudit} className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/44 transition hover:text-white"><FileSearch className="h-3 w-3" />Request audit</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingViewer;