// components/client-dashboard/ClientDomains.tsx
'use client';

import { useState } from 'react';
import { Terminal, Plus, CircleCheck, CircleAlert, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { CustomDomain, ClientProject } from './ClientDashboard_types';
import type { UseClientDashboardReturn } from './useClientDashboard';

export default function ClientDomains({
  dashboard, projects, domains: domainsOverride,
}: { dashboard: UseClientDashboardReturn; projects: ClientProject[]; domains?: CustomDomain[] }) {
  const { domains: allDomains, fetchData, handleVerifyDomain, handleDeleteDomain } = dashboard;
  const domains = domainsOverride ?? allDomains;
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [isManagedDomainModalOpen, setIsManagedDomainModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState({ domain: '', siteId: '', setup: 'self' });
  const [managedDomain, setManagedDomain] = useState({ domainInterest: '' });
  const [isSubmittingDomain, setIsSubmittingDomain] = useState(false);
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-black tracking-tight text-white">Custom Domains</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setIsManagedDomainModalOpen(true)} className="flex-1 border border-white/10 bg-white/[0.02] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 transition hover:border-ai-blue/30 hover:text-white sm:flex-none">
            Request managed
          </button>
          <button onClick={() => setIsDomainModalOpen(true)} className="flex-1 bg-ai-blue px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-black sm:flex-none">
            Attach new
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 border border-white/[0.08] bg-white/[0.02] p-5">
        <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-ai-blue" />
        <p className="text-xs font-medium leading-relaxed text-white/60">
          To activate your custom domain, point your A record to{' '}
          <span className="font-black text-white">{process.env.NEXT_PUBLIC_INFRA_IP || '102.0.21.24'}</span>
          {' '}or a CNAME record to{' '}
          <span className="font-black text-white">{process.env.NEXT_PUBLIC_INFRA_CNAME || 'nodes.sitemendr.com'}</span>.
          {' '}Once updated, run verification to prepare your certificate.
        </p>
      </div>

      <div className="hidden border border-white/[0.08] bg-white/[0.02] lg:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.08] text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
              <th className="px-6 py-4">Domain</th>
              <th className="px-6 py-4">Project</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {domains.map((d: CustomDomain) => {
              const verified = d.status?.toLowerCase() === 'verified';
              return (
                <tr key={d.id} className="text-sm font-semibold transition hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-white">{d.domain}</td>
                  <td className="px-6 py-4 text-white/60">{d.subscription?.siteName || d.subscription?.customName || 'Untitled'}</td>
                  <td className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">{d.setup}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${verified ? 'text-expert-green' : 'text-amber-300'}`}>
                      {verified ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
                      {d.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {!verified && (
                        <button onClick={() => handleVerifyDomain(d.id, setVerifyingDomainId)} disabled={verifyingDomainId === d.id} className="border border-ai-blue/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-ai-blue transition hover:bg-ai-blue hover:text-white disabled:opacity-50">
                          {verifyingDomainId === d.id ? '...' : 'Verify'}
                        </button>
                      )}
                      <button onClick={() => handleDeleteDomain(d.id)} className="border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-400 transition hover:border-red-400/40 hover:bg-red-500/10">
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {domains.length === 0 && (
          <div className="p-14 text-center text-xs font-semibold uppercase tracking-widest text-white/24">No domains attached yet</div>
        )}
      </div>

      <div className="space-y-3 lg:hidden">
        {domains.map((d: CustomDomain) => {
          const verified = d.status?.toLowerCase() === 'verified';
          return (
            <div key={d.id} className="space-y-4 border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">{d.domain}</p>
                  <p className="mt-1 truncate text-[11px] font-semibold text-white/40">
                    {d.subscription?.siteName || d.subscription?.customName || 'Untitled'}
                  </p>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${verified ? 'text-expert-green' : 'text-amber-300'}`}>
                  {verified ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
                  {d.status || 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Setup: {d.setup}</span>
                {!verified && (
                  <button onClick={() => handleVerifyDomain(d.id, setVerifyingDomainId)} disabled={verifyingDomainId === d.id} className="border border-ai-blue/30 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-ai-blue transition disabled:opacity-50">
                    {verifyingDomainId === d.id ? '...' : 'Verify'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {domains.length === 0 && (
          <div className="border border-dashed border-white/10 p-10 text-center text-xs font-semibold uppercase tracking-widest text-white/24">No domains attached</div>
        )}
      </div>

      {isDomainModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg border border-white/10 bg-[#05070a]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-7 py-5">
              <h3 className="text-base font-black tracking-tight text-white">Attach domain</h3>
              <button onClick={() => setIsDomainModalOpen(false)} className="text-white/40 transition hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5 p-7">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">Target project</label>
                <select className="w-full border border-white/10 bg-white/[0.02] p-3 text-sm text-white outline-none focus:border-ai-blue" value={newDomain.siteId} onChange={(e) => setNewDomain({ ...newDomain, siteId: e.target.value })}>
                  <option value="">Select a project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">Domain</label>
                <input type="text" placeholder="domain.tld" className="w-full border border-white/10 bg-white/[0.02] p-3 font-mono text-sm text-white outline-none focus:border-ai-blue" value={newDomain.domain} onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })} />
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
              }} disabled={isSubmittingDomain} className="w-full bg-ai-blue py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black disabled:opacity-50">
                {isSubmittingDomain ? 'Adding domain...' : 'Add domain'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isManagedDomainModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg border border-white/10 bg-[#05070a]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-7 py-5">
              <h3 className="text-base font-black tracking-tight text-white">Request managed DNS</h3>
              <button onClick={() => setIsManagedDomainModalOpen(false)} className="text-white/40 transition hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5 p-7">
              <p className="text-xs font-medium leading-relaxed text-white/60">Our team will handle DNS guidance, SSL certificates, and hosting setup for your project.</p>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">Desired domain</label>
                <input type="text" placeholder="yourbrand.com" className="w-full border border-white/10 bg-white/[0.02] p-3 font-mono text-sm text-white outline-none focus:border-ai-blue" value={managedDomain.domainInterest} onChange={(e) => setManagedDomain({ ...managedDomain, domainInterest: e.target.value })} />
              </div>
              <button onClick={async () => {
                if (!managedDomain.domainInterest) return;
                setIsSubmittingDomain(true);
                try {
                  await apiClient.requestManagedDomain(dashboard.user?.email || '', managedDomain.domainInterest);
                  alert('Deployment request received. A technician will contact you.');
                  setIsManagedDomainModalOpen(false);
                } catch { alert('Request failed.'); } finally { setIsSubmittingDomain(false); }
              }} disabled={isSubmittingDomain} className="w-full bg-ai-blue py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black disabled:opacity-50">
                {isSubmittingDomain ? 'Sending request...' : 'Request managed setup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}