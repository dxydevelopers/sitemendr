// components/admin-dashboard/AdminBilling.tsx
//
// Covers "subscriptions" (site management) and "review" (human
// enhancement queue) - both revolve around Subscription records and
// both can open the same TemplateEditor, so they share this file.

'use client';

import dynamic from 'next/dynamic';
import { ShoppingBag, Trash2, Layout, Eye } from 'lucide-react';
import type { Subscription, Addon } from './types';

const TemplateEditor = dynamic(() => import('../dashboard/TemplateEditor'), { ssr: false });

interface AdminBillingProps {
  view: 'subscriptions' | 'review';
  subscriptions: Subscription[];
  reviewProjects: Subscription[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  selectedSubscriptionForEditor: string | null;
  setSelectedSubscriptionForEditor: (id: string | null) => void;
  isSystemWorking: boolean;
  onTriggerAIGeneration: (id: string) => void;
  onSuspendSubscription: (id: string, currentStatus: string) => void;
  onDeleteSubscription: (id: string) => void;
  onUpdateReview: (id: string, notes: string, increment?: boolean) => void;
  onCompleteReview: (id: string) => void;
  onDeploySite: (id: string) => void;
}

export default function AdminBilling({
  view, subscriptions, reviewProjects, searchTerm, setSearchTerm, filterStatus, setFilterStatus,
  selectedSubscriptionForEditor, setSelectedSubscriptionForEditor, isSystemWorking,
  onTriggerAIGeneration, onSuspendSubscription, onDeleteSubscription, onUpdateReview, onCompleteReview, onDeploySite,
}: AdminBillingProps) {
  if (selectedSubscriptionForEditor) {
    return (
      <div className="animate-fade-in">
        <button onClick={() => setSelectedSubscriptionForEditor(null)} className="mb-6 text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:text-white">← Back to list</button>
        <TemplateEditor subscriptionId={selectedSubscriptionForEditor} onClose={() => setSelectedSubscriptionForEditor(null)} />
      </div>
    );
  }

  if (view === 'subscriptions') {
    const filtered = subscriptions.filter(sub => (filterStatus === 'ALL' || sub.tier === filterStatus)
      && ((sub.customName || sub.siteName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (sub.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (sub.id || '').toLowerCase().includes(searchTerm.toLowerCase())));
    return (
      <div className="animate-fade-in">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-white">Site Management</h2>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/34">{subscriptions.filter(s => s.status === 'active').length} active / {subscriptions.length} total deployments</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input type="text" placeholder="Search nodes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="min-h-10 flex-1 border border-white/10 bg-white/[0.03] px-4 text-[10px] font-black uppercase tracking-widest text-white outline-none transition focus:border-ai-blue md:w-64" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="min-h-10 border border-white/10 bg-white/[0.03] px-4 text-[10px] font-black uppercase tracking-widest text-white outline-none transition focus:border-ai-blue">
              <option value="ALL">All tiers</option><option value="ai_foundation">AI foundation</option><option value="pro_enhancement">Pro enhancement</option><option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {filtered.length === 0 && (
            <p className="py-16 text-center text-sm text-white/34">No sites match these filters.</p>
          )}
          {filtered.map((sub, i) => (
            <div key={sub.id || i} className="flex flex-wrap items-center justify-between gap-8 py-6">
              <div className="min-w-[280px] flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-ai-blue">ID {(sub.id || '').slice(0, 8)}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${sub.status === 'active' ? 'text-expert-green' : 'text-red-400'}`}>{sub.status}</span>
                </div>
                <h3 className="flex items-center gap-3 text-lg font-black tracking-tight text-white">
                  {sub.customName || sub.siteName}
                  {!sub.isCurrent && <span className="border border-white/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white/34">Previous</span>}
                </h3>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-[9px] font-black uppercase tracking-widest text-white/34">
                  <span>Client: <span className="text-white/70">{sub.user?.name || 'Guest'}</span></span>
                  <span className="text-white/15">|</span>
                  <span>Plan: <span className="text-ai-blue">{sub.planType}</span></span>
                  <span className="text-white/15">|</span>
                  <span>Tier: <span className="text-tech-purple">{sub.tier?.replace(/_/g, ' ')}</span></span>
                </div>
                {sub.purchasedAddons && sub.purchasedAddons.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {sub.purchasedAddons.map((addon: Addon, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 border border-expert-green/20 px-2 py-1 text-[8px] font-black uppercase text-expert-green"><ShoppingBag className="h-2.5 w-2.5" />{addon.name}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/28">Billing state</p>
                  <p className={`mt-1 text-[10px] font-black uppercase ${sub.paymentStatus === 'PAID' ? 'text-expert-green' : 'text-amber-300'}`}>{sub.paymentStatus}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => onTriggerAIGeneration(sub.id)} disabled={isSystemWorking} className="min-h-10 border border-ai-blue/30 px-4 text-[9px] font-black uppercase tracking-widest text-ai-blue transition hover:bg-ai-blue/10 disabled:opacity-50">{isSystemWorking ? 'Processing...' : 'Initialize AI'}</button>
                  <button onClick={() => onSuspendSubscription(sub.id, sub.status)} className={`min-h-10 border px-4 text-[9px] font-black uppercase tracking-widest transition ${sub.status === 'suspended' ? 'border-expert-green/30 text-expert-green hover:bg-expert-green/10' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'}`}>{sub.status === 'suspended' ? 'Unsuspend' : 'Suspend'}</button>
                  <button onClick={() => onDeleteSubscription(sub.id)} className="grid h-10 w-10 place-items-center border border-white/10 text-white/50 transition hover:border-red-500/40 hover:text-red-400" title="Delete node"><Trash2 className="h-4 w-4" /></button>
                  <button onClick={() => setSelectedSubscriptionForEditor(sub.id)} className="inline-flex min-h-10 items-center gap-2 border border-white/10 px-4 text-[9px] font-black uppercase tracking-widest text-white/70 transition hover:border-white/30 hover:text-white"><Layout className="h-3 w-3" />Refine</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // view === 'review'
  const filteredReview = reviewProjects.filter(p => (p.customName || p.siteName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.domain || '').toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-5 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-white">Human Enhancement Queue</h2>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/34">{reviewProjects.length} pending review{reviewProjects.length === 1 ? '' : 's'}</p>
        </div>
        <input type="text" placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="min-h-10 border border-white/10 bg-white/[0.03] px-4 text-[10px] font-black uppercase tracking-widest text-white outline-none transition focus:border-ai-blue md:w-64" />
      </div>

      {reviewProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-white/10 py-20 text-center">
          <Eye className="mb-4 h-8 w-8 text-white/15" />
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/34">No projects currently awaiting review</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 divide-y divide-white/10 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-3">
          {filteredReview.map((project, i) => (
            <div key={project.id || i} className="p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black uppercase tracking-tight text-white">{project.domain || 'no-domain.sitemendr.com'}</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase text-white/34">{project.tier?.replace(/_/g, ' ')}</p>
                </div>
                <span className={`shrink-0 text-[8px] font-black uppercase tracking-widest ${project.status === 'active' ? 'text-expert-green' : 'text-amber-300'}`}>{project.status}</span>
              </div>

              <div className="mb-5 space-y-2 border-t border-white/10 pt-4">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/34"><span>Owner</span><span className="text-white/70">{project.user?.email || 'Unknown'}</span></div>
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/34"><span>Requested</span><span className="text-white/70">{new Date(project.createdAt || Date.now()).toLocaleDateString()}</span></div>
                {(project.revisionCount ?? 0) > 0 && <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-ai-blue"><span>Revisions</span><span>{project.revisionCount}</span></div>}
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-[8px] font-black uppercase tracking-widest text-white/28">Review notes</label>
                <textarea defaultValue={project.reviewNotes || ''} onBlur={(e) => { if (e.target.value !== (project.reviewNotes || '')) onUpdateReview(project.id, e.target.value); }} className="h-20 w-full resize-none border border-white/10 bg-white/[0.02] p-3 text-[10px] text-white outline-none transition focus:border-ai-blue/40" placeholder="Enter design feedback..."></textarea>
              </div>

              <div className="mb-3 flex gap-2">
                <button onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/preview/${project.id}`, '_blank')} className="flex flex-1 items-center justify-center gap-2 border border-white/10 py-2.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/70 transition hover:border-white/30 hover:text-white"><Eye size={12} />Preview</button>
                <button onClick={() => onCompleteReview(project.id)} className="flex-1 border border-expert-green/25 py-2.5 text-[9px] font-black uppercase tracking-[0.16em] text-expert-green transition hover:bg-expert-green/10">Complete review</button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedSubscriptionForEditor(project.id)} className="flex-1 border border-white/10 py-2.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/60 transition hover:border-white/30 hover:text-white">Edit template</button>
                <button onClick={() => onDeploySite(project.id)} className="flex-1 border border-ai-blue/25 py-2.5 text-[9px] font-black uppercase tracking-[0.16em] text-ai-blue transition hover:bg-ai-blue/10">Deploy live</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}