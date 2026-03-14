'use client';

import React from 'react';
import { CreditCard, Download, ExternalLink, Clock } from 'lucide-react';

interface BillingItem {
  id: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  reference: string;
}

interface Subscription {
  id: string;
  siteName?: string;
  customName?: string;
  planType: string;
  status: string;
  expiresAt?: string;
  price?: number;
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
  subscriptions?: Subscription[];
}

const BillingViewer: React.FC<BillingViewerProps> = ({ billing, paymentMethod, subscriptions = [] }) => {
  return (
    <div className="space-y-8 lg:space-y-12 animate-fade-in pb-20">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-ai-blue" />
          Financial Ledger
        </h2>
      </div>

      {/* Subscription Summary */}
      {subscriptions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="bg-white/[0.01] border border-white/5 rounded-[32px] p-8 lg:p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <Zap className="w-20 h-20" />
              </div>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="text-[8px] font-black text-ai-blue uppercase tracking-[0.3em] block mb-2">Active Protocol</span>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">{sub.siteName || sub.customName || 'Untitled Project'}</h3>
                </div>
                <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                  sub.status.toLowerCase() === 'active' 
                    ? 'bg-expert-green/10 border-expert-green/20 text-expert-green' 
                    : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                }`}>
                  {sub.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Architecture</p>
                  <p className="text-xs font-black text-white uppercase">{sub.planType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Renewal_Date</p>
                  <p className="text-xs font-black text-white uppercase">{sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : 'Lifetime'}</p>
                </div>
              </div>
              
              <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-ai-blue">
                  {sub.price ? `$${sub.price.toFixed(2)} / period` : 'Deployment Active'}
                </div>
                <button className="text-[8px] font-black text-white/40 hover:text-white uppercase tracking-[0.2em] transition-colors">Manage Subscription →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-medium-gray px-2">Transaction History</h3>
        {/* Mobile Billing Cards */}
        <div className="block lg:hidden space-y-4">
        {billing.length > 0 ? (
          billing.map((item) => (
            <div key={item.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black font-mono text-ai-blue uppercase">{item.reference}</p>
                  <p className="text-xs font-black uppercase mt-1">{item.description}</p>
                </div>
                <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border ${
                  item.status.toLowerCase() === 'completed' || item.status.toLowerCase() === 'success' 
                    ? 'bg-expert-green/10 border-expert-green/20 text-expert-green' 
                    : item.status.toLowerCase() === 'failed' 
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                }`}>
                  {item.status}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-medium-gray text-[10px] font-bold uppercase">
                  <Clock className="w-3 h-3" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
                <p className="text-sm font-black text-white">${(item.amount / 100).toFixed(2)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl opacity-30">
            <p className="text-[10px] font-black uppercase">No transaction records</p>
          </div>
        )}
      </div>

      <div className="hidden lg:block bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.03]">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-medium-gray">Reference</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-medium-gray">Date</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-medium-gray">Description</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-medium-gray">Amount</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-medium-gray">Status</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-medium-gray">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {billing.length > 0 ? (
                billing.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-6">
                      <p className="text-[10px] font-black font-mono text-ai-blue uppercase truncate w-32">
                        {item.reference}
                      </p>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-medium-gray">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase">{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="text-xs font-black uppercase tracking-tight">{item.description}</p>
                    </td>
                    <td className="p-6">
                      <p className="text-sm font-black text-white">${(item.amount / 100).toFixed(2)}</p>
                    </td>
                    <td className="p-6">
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border ${
                        item.status.toLowerCase() === 'completed' || item.status.toLowerCase() === 'success' 
                          ? 'bg-expert-green/10 border-expert-green/20 text-expert-green' 
                          : item.status.toLowerCase() === 'failed' 
                          ? 'bg-red-500/10 border-red-500/20 text-red-400'
                          : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-6">
                      <button className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-ai-blue hover:text-white transition-colors">
                        <Download className="w-3 h-3" />
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <p className="text-[10px] font-black text-medium-gray uppercase tracking-widest">No transaction records found in database</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 lg:p-8 bg-white/[0.02] border border-white/5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
            <CreditCard className="w-12 h-12" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-ai-blue mb-4">Payment Method</h3>
          {paymentMethod ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-white/5 rounded border border-white/10 flex items-center justify-center">
                <span className="text-[8px] font-black italic uppercase">{paymentMethod.brand || 'CARD'}</span>
              </div>
              <div>
                <p className="text-xs font-black uppercase">Ending in {paymentMethod.last4}</p>
                <p className="text-[10px] text-medium-gray font-bold uppercase">Expires {paymentMethod.expMonth}/{paymentMethod.expYear}</p>
              </div>
            </div>
          ) : (
            <div className="bg-ai-blue/5 border border-ai-blue/20 p-4 rounded-xl">
              <p className="text-[10px] text-ai-blue font-black uppercase">No active payment method attached</p>
            </div>
          )}
          <button className="mt-8 text-[9px] font-black text-medium-gray hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
            {paymentMethod ? 'Update Security Credentials' : 'Add Payment Method'} <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="p-6 lg:p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-tech-purple mb-4">Billing Contact</h3>
          <p className="text-xs font-black uppercase mb-1">Accounts Payable</p>
          <p className="text-[10px] text-medium-gray font-bold uppercase">billing@sitemendr.com</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
              Change Email
            </button>
            <button className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
              Request Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingViewer;
