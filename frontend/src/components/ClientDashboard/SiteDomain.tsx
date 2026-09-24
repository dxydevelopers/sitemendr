// components/client-dashboard/SiteDomain.tsx
//
// The room's own Domain tab — built specifically for a single site,
// not a reuse of ClientDomains.tsx. No "target project" selector is
// needed at all here, since there's only ever one possible target:
// this site.

'use client';

import { useState } from 'react';
import { Terminal, Plus, CircleCheck, CircleAlert, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { CustomDomain, ClientProject } from './ClientDashboard_types';
import type { UseClientDashboardReturn } from './useClientDashboard';

export default function SiteDomain({
  site, domains, dashboard,
}: { site: ClientProject; domains: CustomDomain[]; dashboard: UseClientDashboardReturn }) {
  const { fetchData, handleVerifyDomain, handleDeleteDomain, user } = dashboard;
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [isManagedDomainModalOpen, setIsManagedDomainModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState({ domain: '', setup: 'self' });
  const [managedDomain, setManagedDomain] = useState({ domainInterest: '' });
  const [isSubmittingDomain, setIsSubmittingDomain] = useState(false);
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-medium text-white">Domain</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setIsManagedDomainModalOpen(true)} className="flex-1 border border-white/10 bg-white/[0.02] px-4 py-2 text-[10px] font-medium text-white/70 transition hover:border-ai-blue/30 hover:text-white sm:flex-none">
            Request managed
          </button>
          <button onClick={() => setIsDomainModalOpen(true)} className="flex-1 bg-ai-blue px-4 py-2 text-[10px] font-medium text-white transition hover:bg-white hover:text-black sm:flex-none">
            Attach domain
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 border border-white/[0.08] bg-white/[0.02] p-5">
        <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-ai-blue" />
        <p className="text-xs font-medium leading-relaxed text-white/60">
          To activate a custom domain for this site, point its A record to{' '}
          <span className="font-semibold text-white">{process.env.NEXT_PUBLIC_INFRA_IP || '102.0.21.24'}</span>
          {' '}or a CNAME record to{' '}
          <span className="font-semibold text-white">{process.env.NEXT_PUBLIC_INFRA_CNAME || 'nodes.sitemendr.com'}</span>.
          {' '}Once updated, run verification to prepare its certificate.
        </p>
      </div>

      <div className="border border-white/[0.08] bg-white/[0.02]">
        {domains.length === 0 ? (
          <div className="p-14 text-center text-xs font-semibold text-white/24">No domain attached to this site yet</div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {domains.map((d: CustomDomain) => {
              const verified = d.status?.toLowerCase() === 'verified';
              return (
                <div key={d.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <p className="truncate text-sm font-semibold text-white">{d.domain}</p>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${verified ? 'text-expert-green' : 'text-amber-300'}`}>
                        {verified ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
                        {d.status || 'Pending'}
                      </span>
                      <span className="text-[10px] font-medium text-white/40">{d.setup} setup</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {!verified && (
                      <button onClick={() => handleVerifyDomain(d.id, setVerifyingDomainId)} disabled={verifyingDomainId === d.id} className="border border-ai-blue/30 px-4 py-2 text-[10px] font-medium text-ai-blue transition hover:bg-ai-blue hover:text-white disabled:opacity-50">
                        {verifyingDomainId === d.id ? '...' : 'Verify'}
                      </button>
                    )}
                    <button onClick={() => handleDeleteDomain(d.id)} className="border border-white/10 px-4 py-2 text-[10px] font-medium text-red-400 transition hover:border-red-400/40 hover:bg-red-500/10">
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isDomainModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg border border-white/10 bg-[#0A0C10]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-7 py-5">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-white">Attach domain</h3>
                <p className="mt-1 text-[10px] font-medium text-white/40">to {site.name}</p>
              </div>
              <button onClick={() => setIsDomainModalOpen(false)} className="text-white/40 transition hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5 p-7">
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-white/40">Domain</label>
                <input type="text" placeholder="domain.tld" className="w-full border border-white/10 bg-white/[0.02] p-3 font-mono text-sm text-white outline-none focus:border-ai-blue" value={newDomain.domain} onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })} />
              </div>
              <button onClick={async () => {
                if (!newDomain.domain) return;
                setIsSubmittingDomain(true);
                try {
                  await apiClient.addCustomDomain({ siteId: site.id, domain: newDomain.domain, setup: newDomain.setup });
                  alert('Domain added. Please update DNS records.');
                  fetchData();
                  setIsDomainModalOpen(false);
                  setNewDomain({ domain: '', setup: 'self' });
                } catch { alert('Link failed.'); } finally { setIsSubmittingDomain(false); }
              }} disabled={isSubmittingDomain} className="w-full bg-ai-blue py-3.5 text-[11px] font-medium text-white transition hover:bg-white hover:text-black disabled:opacity-50">
                {isSubmittingDomain ? 'Adding domain...' : 'Add domain'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isManagedDomainModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg border border-white/10 bg-[#0A0C10]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-7 py-5">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-white">Request managed DNS</h3>
                <p className="mt-1 text-[10px] font-medium text-white/40">for {site.name}</p>
              </div>
              <button onClick={() => setIsManagedDomainModalOpen(false)} className="text-white/40 transition hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5 p-7">
              <p className="text-xs font-medium leading-relaxed text-white/60">Our team will handle DNS guidance, SSL certificates, and hosting setup for this site.</p>
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-white/40">Desired domain</label>
                <input type="text" placeholder="yourbrand.com" className="w-full border border-white/10 bg-white/[0.02] p-3 font-mono text-sm text-white outline-none focus:border-ai-blue" value={managedDomain.domainInterest} onChange={(e) => setManagedDomain({ ...managedDomain, domainInterest: e.target.value })} />
              </div>
              <button onClick={async () => {
                if (!managedDomain.domainInterest) return;
                setIsSubmittingDomain(true);
                try {
                  await apiClient.requestManagedDomain(user?.email || '', managedDomain.domainInterest);
                  alert('Deployment request received. A technician will contact you.');
                  setIsManagedDomainModalOpen(false);
                  setManagedDomain({ domainInterest: '' });
                } catch { alert('Request failed.'); } finally { setIsSubmittingDomain(false); }
              }} disabled={isSubmittingDomain} className="w-full bg-ai-blue py-3.5 text-[11px] font-medium text-white transition hover:bg-white hover:text-black disabled:opacity-50">
                {isSubmittingDomain ? 'Sending request...' : 'Request managed setup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}