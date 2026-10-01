// Domain status for one site. Setup and request actions live in account Domains.
'use client';

import { useState } from 'react';
import { CircleAlert, CircleCheck, Terminal } from 'lucide-react';
import type { CustomDomain, ClientProject } from './ClientDashboard_types';
import type { UseClientDashboardReturn } from './useClientDashboard';

export default function SiteDomain({
  site, domains, dashboard,
}: { site: ClientProject; domains: CustomDomain[]; dashboard: UseClientDashboardReturn }) {
  const { handleVerifyDomain, handleDeleteDomain } = dashboard;
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/45">Domain settings for {site.name}</p>
        <a href="/dashboard/domains" className="inline-flex min-h-10 items-center self-start border border-white/10 px-4 text-xs font-semibold text-white/70 transition hover:border-ai-blue/35 hover:text-white sm:self-auto">
          Manage domains
        </a>
      </div>

      <div className="flex min-w-0 items-start gap-3 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
        <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-ai-blue" />
        <p className="break-words text-xs font-medium leading-relaxed text-white/60">
          To connect a domain, point its A record to{' '}
          <span className="font-semibold text-white">{process.env.NEXT_PUBLIC_INFRA_IP || '102.0.21.24'}</span>
          {' '}or its CNAME record to{' '}
          <span className="font-semibold text-white">{process.env.NEXT_PUBLIC_INFRA_CNAME || 'nodes.sitemendr.com'}</span>.
          {' '}Run verification after updating DNS.
        </p>
      </div>

      <div className="divide-y divide-white/[0.06] border border-white/[0.08] bg-white/[0.02]">
        {domains.length ? domains.map((domain: CustomDomain) => {
          const verified = domain.status?.toLowerCase() === 'verified';
          return (
            <div key={domain.id} className="flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0 space-y-1.5">
                <p className="break-all text-sm font-semibold text-white">{domain.domain}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold ${verified ? 'text-expert-green' : 'text-amber-300'}`}>
                    {verified ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
                    {domain.status || 'Pending'}
                  </span>
                  <span className="text-[10px] font-semibold text-white/40">{domain.setup} setup</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {!verified && (
                  <button type="button" onClick={() => handleVerifyDomain(domain.id, setVerifyingDomainId)} disabled={verifyingDomainId === domain.id} className="min-h-9 border border-ai-blue/30 px-4 py-2 text-[10px] font-semibold text-ai-blue transition hover:bg-ai-blue hover:text-white disabled:opacity-50">
                    {verifyingDomainId === domain.id ? 'Verifying…' : 'Verify'}
                  </button>
                )}
                <button type="button" onClick={() => handleDeleteDomain(domain.id)} className="min-h-9 border border-white/10 px-4 py-2 text-[10px] font-semibold text-red-400 transition hover:border-red-400/40 hover:bg-red-500/10">
                  Remove
                </button>
              </div>
            </div>
          );
        }) : (
          <p className="px-5 py-10 text-center text-sm text-white/40">No domain is connected to this site yet.</p>
        )}
      </div>
    </div>
  );
}
