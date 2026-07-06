// components/client-dashboard/ClientDomains.tsx
'use client';

import { useState } from 'react';
import { Terminal, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { CustomDomain, ClientProject } from './types';
import type { UseClientDashboardReturn } from './useClientDashboard';

export default function ClientDomains({
  dashboard, projects,
}: { dashboard: UseClientDashboardReturn; projects: ClientProject[] }) {
  const { domains, fetchData, handleVerifyDomain, handleDeleteDomain } = dashboard;
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [isManagedDomainModalOpen, setIsManagedDomainModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState({ domain: '', siteId: '', setup: 'self' });
  const [managedDomain, setManagedDomain] = useState({ domainInterest: '' });
  const [isSubmittingDomain, setIsSubmittingDomain] = useState(false);
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-bold uppercase tracking-tight">Custom Domains</h2>
        <div className="flex flex-wrap gap-2 lg:gap-4 w-full sm:w-auto">
          <button onClick={() => setIsManagedDomainModalOpen(true)} className="flex-1 sm:flex-none px-4 lg:px-6 py-2 bg-ai-blue/10 border border-ai-blue/20 text-ai-blue font-black text-[9px] lg:text-[10px] uppercase tracking-widest rounded-lg hover:bg-ai-blue hover:text-white transition-all">Request Managed</button>
          <button onClick={() => setIsDomainModalOpen(true)} className="flex-1 sm:flex-none px-4 lg:px-6 py-2 bg-expert-green text-dark-bg font-black text-[9px] lg:text-[10px] uppercase tracking-widest rounded-lg">Attach New</button>
        </div>
      </div>

      <div className="bg-ai-blue/10 border border-ai-blue/20 p-4 lg:p-6 rounded-2xl">
        <h3 className="text-[10px] font-black uppercase text-ai-blue mb-2 flex items-center gap-2"><Terminal className="w-4 h-4" /> DNS Configuration</h3>
        <p className="text-[10px] text-white/70 uppercase leading-relaxed">
          To activate your custom domain, point your A records to the Sitemendr hosting address: <span className="text-white font-black">{process.env.NEXT_PUBLIC_INFRA_IP || '102.0.21.24'}</span>
          {' '}or use a CNAME record pointing to: <span className="text-white font-black">{process.env.NEXT_PUBLIC_INFRA_CNAME || 'nodes.sitemendr.com'}</span>. Once updated, run verification to prepare your certificate.
        </p>
      </div>

      <div className="hidden lg:block bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.03] text-[9px] font-black uppercase text-medium-gray">
              <th className="p-6">Domain</th><th className="p-6">Project</th><th className="p-6">Type</th><th className="p-6">Status</th><th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {domains.map((d: CustomDomain) => (
              <tr key={d.id} className="text-[10px] font-bold uppercase hover:bg-white/[0.01] transition-colors group">
                <td className="p-6 text-white group-hover:text-ai-blue transition-colors">{d.domain}</td>
                <td className="p-6 text-white/60">{d.subscription?.siteName || d.subscription?.customName || 'Untitled'}</td>
                <td className="p-6"><span className="px-2 py-0.5 bg-white/5 rounded text-[8px] text-white/40">{d.setup}</span></td>
                <td className="p-6"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${d.status?.toLowerCase() === 'verified' ? 'bg-expert-green/10 text-expert-green' : 'bg-orange-500/10 text-orange-500'}`}>{d.status || 'Pending'}</span></td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-3">
                    {d.status?.toLowerCase() !== 'verified' && (
                      <button onClick={() => handleVerifyDomain(d.id, setVerifyingDomainId)} disabled={verifyingDomainId === d.id} className="px-3 py-1 bg-ai-blue text-black text-[8px] font-black uppercase tracking-widest rounded hover:bg-white transition-all disabled:opacity-50">
                        {verifyingDomainId === d.id ? '...' : 'Verify'}
                      </button>
                    )}
                    <button onClick={() => handleDeleteDomain(d.id)} className="px-3 py-1 bg-white/5 border border-white/10 text-red-400 text-[8px] font-black uppercase tracking-widest rounded hover:bg-red-500/10 transition-all">Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {domains.length === 0 && <div className="p-20 text-center opacity-20 uppercase tracking-widest font-mono text-xs italic">Primary DNS records return null</div>}
      </div>

      <div className="block lg:hidden space-y-4">
        {domains.map((d: CustomDomain) => (
          <div key={d.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-black uppercase text-white">{d.domain}</p>
                <p className="text-[8px] text-medium-gray uppercase mt-1">Project: {d.subscription?.siteName || d.subscription?.customName || 'Untitled'}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${d.status?.toLowerCase() === 'verified' ? 'bg-expert-green/10 text-expert-green' : 'bg-orange-500/10 text-orange-500'}`}>{d.status || 'Pending'}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <span className="text-[8px] text-medium-gray uppercase tracking-widest">Setup: {d.setup}</span>
              {d.status?.toLowerCase() !== 'verified' && (
                <button onClick={() => handleVerifyDomain(d.id, setVerifyingDomainId)} disabled={verifyingDomainId === d.id} className="px-4 py-2 bg-ai-blue text-black text-[9px] font-black uppercase tracking-widest rounded-lg disabled:opacity-50">
                  {verifyingDomainId === d.id ? '...' : 'VERIFY'}
                </button>
              )}
            </div>
          </div>
        ))}
        {domains.length === 0 && <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl opacity-30"><p className="text-[10px] font-black uppercase">No domains attached</p></div>}
      </div>

      {isDomainModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-darker-bg border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tight text-white">Attach System Domain</h3>
              <button onClick={() => setIsDomainModalOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">Target Project</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-ai-blue" value={newDomain.siteId} onChange={(e) => setNewDomain({ ...newDomain, siteId: e.target.value })}>
                  <option value="">Select Operational Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">Domain Endpoint</label>
                <input type="text" placeholder="domain.tld" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-ai-blue font-mono" value={newDomain.domain} onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })} />
              </div>
              <button onClick={async () => {
                if (!newDomain.domain || !newDomain.siteId) return;
                setIsSubmittingDomain(true);
                try {
                  await apiClient.addCustomDomain({ siteId: newDomain.siteId, domain: newDomain.domain, setup: newDomain.setup });
                  alert('Domain added. Please update DNS records.');
                  fetchData();
                  setIsDomainModalOpen(false);
                } catch { alert('Link failed.'); } finally { setIsSubmittingDomain(false); }
              }} disabled={isSubmittingDomain} className="w-full py-4 bg-ai-blue text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-white hover:text-black transition-all shadow-lg shadow-ai-blue/20 disabled:opacity-50">
                {isSubmittingDomain ? 'Adding domain...' : 'Add domain'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isManagedDomainModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-darker-bg border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tight text-white">Request Managed DNS</h3>
              <button onClick={() => setIsManagedDomainModalOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-xs text-white/60 leading-relaxed uppercase font-mono tracking-tighter">Our team will handle DNS guidance, SSL certificates, and hosting setup for your project.</p>
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">Desired Domain</label>
                <input type="text" placeholder="yourbrand.com" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-ai-blue font-mono" value={managedDomain.domainInterest} onChange={(e) => setManagedDomain({ ...managedDomain, domainInterest: e.target.value })} />
              </div>
              <button onClick={async () => {
                if (!managedDomain.domainInterest) return;
                setIsSubmittingDomain(true);
                try {
                  await apiClient.requestManagedDomain(dashboard.user?.email || '', managedDomain.domainInterest);
                  alert('Deployment request received. A technician will contact you.');
                  setIsManagedDomainModalOpen(false);
                } catch { alert('Request failed.'); } finally { setIsSubmittingDomain(false); }
              }} disabled={isSubmittingDomain} className="w-full py-4 bg-tech-purple text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-white hover:text-black transition-all shadow-lg shadow-tech-purple/20 disabled:opacity-50">
                {isSubmittingDomain ? 'Sending request...' : 'Request managed setup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
