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
      <div className="space-y-4 animate-fade-in">
        <button onClick={() => setSelectedSubscriptionForEditor(null)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ai-blue hover:text-white transition-all mb-4">BACK_TO_LIST</button>
        <TemplateEditor subscriptionId={selectedSubscriptionForEditor} onClose={() => setSelectedSubscriptionForEditor(null)} />
      </div>
    );
  }

  if (view === 'subscriptions') {
    const filtered = subscriptions.filter(sub => (filterStatus === 'ALL' || sub.planType === filterStatus)
      && ((sub.customName || sub.siteName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (sub.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (sub.id || '').toLowerCase().includes(searchTerm.toLowerCase())));
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold tracking-tight uppercase flex items-center gap-3"><span className="w-1.5 h-6 bg-tech-purple rounded-full"></span>Site Management</h2>
            <span className="text-[8px] font-bold text-medium-gray uppercase tracking-[0.2em] mt-1">ACTIVE_DEPLOYMENTS: {subscriptions.length}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input type="text" placeholder="Search nodes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors flex-1 md:w-64" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors">
              <option value="ALL">ALL_PLANS</option><option value="ai_foundation">AI_FOUNDATION</option><option value="pro_enhancement">PRO_ENHANCEMENT</option><option value="enterprise">ENTERPRISE</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((sub, i) => (
            <div key={sub.id || i} className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl flex flex-wrap justify-between items-center gap-10 group hover:border-white/10 transition-all">
              <div className="flex-1 min-w-[280px]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[8px] font-black text-ai-blue uppercase tracking-[0.3em]">ID {(sub.id || '').slice(0, 8)}</span>
                  <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${sub.status === 'ACTIVE' ? 'bg-expert-green/20 text-expert-green' : 'bg-red-500/20 text-red-500'}`}>{sub.status}</span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">
                  {sub.customName || sub.siteName}
                  {!sub.isCurrent && <span className="ml-3 px-2 py-0.5 bg-white/5 border border-white/10 text-white/30 text-[7px] font-black rounded uppercase tracking-widest">Previous</span>}
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2"><span className="text-[8px] text-medium-gray font-black uppercase tracking-widest">Client:</span><span className="text-[9px] font-black uppercase">{sub.user?.name || 'GUEST'}</span></div>
                  <div className="w-[1px] h-3 bg-white/5"></div>
                  <div className="flex items-center gap-2"><span className="text-[8px] text-medium-gray font-black uppercase tracking-widest">Plan:</span><span className="text-[9px] font-black text-ai-blue uppercase">{sub.planType}</span></div>
                </div>
                {sub.purchasedAddons && sub.purchasedAddons.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {sub.purchasedAddons.map((addon: Addon, idx: number) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-expert-green/5 border border-expert-green/10 rounded-lg"><ShoppingBag className="w-2.5 h-2.5 text-expert-green" /><span className="text-[7px] font-black uppercase text-expert-green">{addon.name}</span></div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-12">
                <div className="text-right"><p className="text-[7px] font-black text-medium-gray uppercase tracking-widest mb-1">Billing_State</p><p className={`text-[10px] font-black uppercase ${sub.paymentStatus === 'PAID' ? 'text-expert-green' : 'text-orange-500'}`}>{sub.paymentStatus}</p></div>
                <div className="flex gap-3">
                  <button onClick={() => onTriggerAIGeneration(sub.id)} disabled={isSystemWorking} className="px-6 py-3 bg-ai-blue text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-ai-blue/20 disabled:opacity-50">{isSystemWorking ? 'PROCESSING...' : 'INITIALIZE_AI'}</button>
                  <button onClick={() => onSuspendSubscription(sub.id, sub.status)} className={`px-6 py-3 border text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all ${sub.status === 'SUSPENDED' ? 'bg-expert-green/20 border-expert-green text-expert-green' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>{sub.status === 'SUSPENDED' ? 'UNSUSPEND' : 'SUSPEND'}</button>
                  <button onClick={() => onDeleteSubscription(sub.id)} className="p-3 bg-white/5 border border-white/10 text-white hover:bg-red-500/20 hover:border-red-500/50 rounded-xl transition-all" title="DELETE NODE"><Trash2 className="w-4 h-4" /></button>
                  <button onClick={() => setSelectedSubscriptionForEditor(sub.id)} className="px-6 py-3 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all flex items-center gap-2"><Layout className="w-3 h-3" />REFINE</button>
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
        <div className="flex flex-col">
          <h2 className="text-lg font-black tracking-tighter uppercase flex items-center gap-3"><span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>Human Enhancement Queue</h2>
          <span className="text-[8px] font-black text-medium-gray uppercase tracking-[0.2em] mt-1">PENDING_REVIEWS: {reviewProjects.length}</span>
        </div>
        <div className="w-full md:w-64"><input type="text" placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReview.map((project, i) => (
          <div key={project.id || i} className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div><h3 className="text-sm font-black uppercase tracking-tight mb-1">{project.domain || 'no-domain.sitemendr.com'}</h3><p className="text-[10px] text-medium-gray uppercase font-bold">{project.tier}</p></div>
              <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${project.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>{project.status}</span>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-[9px] uppercase font-black tracking-widest text-medium-gray"><span>Owner</span><span className="text-white">{project.user?.email || 'Unknown'}</span></div>
              <div className="flex justify-between text-[9px] uppercase font-black tracking-widest text-medium-gray"><span>Requested</span><span className="text-white">{new Date(project.createdAt || Date.now()).toLocaleDateString()}</span></div>
              {(project.revisionCount ?? 0) > 0 && <div className="flex justify-between text-[9px] uppercase font-black tracking-widest text-ai-blue"><span>Revision_Count</span><span>{project.revisionCount}</span></div>}
            </div>
            <div className="mb-4">
              <label className="block text-[7px] font-black uppercase text-medium-gray tracking-widest mb-1.5">Review_Notes</label>
              <textarea defaultValue={project.reviewNotes || ''} onBlur={(e) => { if (e.target.value !== (project.reviewNotes || '')) onUpdateReview(project.id, e.target.value); }} className="w-full h-20 bg-white/[0.02] border border-white/5 rounded-xl p-3 text-[10px] focus:outline-none focus:border-ai-blue/30 transition-colors resize-none" placeholder="Enter design feedback..."></textarea>
            </div>
            <div className="flex gap-3 mb-3">
              <button onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/preview/${project.id}`, '_blank')} className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"><Eye size={12} />PREVIEW</button>
              <button onClick={() => onCompleteReview(project.id)} className="flex-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-green-500 transition-all">COMPLETE_REVIEW</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelectedSubscriptionForEditor(project.id)} className="flex-1 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all">EDIT_TEMPLATE</button>
              <button onClick={() => onDeploySite(project.id)} className="flex-1 bg-ai-blue/10 hover:bg-ai-blue/20 border border-ai-blue/20 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-ai-blue transition-all">DEPLOY_LIVE</button>
            </div>
          </div>
        ))}
        {reviewProjects.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-medium-gray border border-dashed border-white/5 rounded-3xl">
            <Eye size={48} className="mb-4 opacity-20" /><p className="text-[10px] font-black uppercase tracking-[0.3em]">No projects currently awaiting review</p>
          </div>
        )}
      </div>
    </div>
  );
}
