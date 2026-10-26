// Domain status for one site. Account-wide setup and attachment live in Domains.
'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Check, CheckCircle2, CircleAlert, Copy, ExternalLink, Globe2, LoaderCircle, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import type { CustomDomain, ClientProject } from './ClientDashboard_types';
import type { UseClientDashboardReturn } from './useClientDashboard';
import { apiClient } from '@/lib/api';

export default function SiteDomain({
  site, domains, dashboard,
}: { site: ClientProject; domains: CustomDomain[]; dashboard: UseClientDashboardReturn }) {
  const { handleVerifyDomain, handleDeleteDomain } = dashboard;
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, Awaited<ReturnType<UseClientDashboardReturn['handleVerifyDomain']>>>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [formError, setFormError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const ip = dashboard.domainDnsTargets.a;
  const hasDnsTarget = Boolean(ip);
  const canManageDomain = site.canManageSite !== false;

  const connectDomain = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const domain = domainInput.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split(/[/?#]/)[0]
      .replace(/\.$/, '');
    const labels = domain.split('.');
    const valid = domain.length <= 253 && labels.length >= 2 && labels.every(label =>
      label.length > 0 && label.length <= 63
      && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)
    );
    if (!valid) {
      setFormError('Enter a valid domain, such as yourbusiness.co.ke.');
      return;
    }

    setIsAdding(true);
    setFormError('');
    try {
      const response = await apiClient.addCustomDomain({ domain, siteId: site.id, setup: 'self' });
      if (!response.success) {
        setFormError(response.message || 'Could not connect this domain. Please try again.');
        return;
      }
      if (response.domain) {
        const createdDomain = response.domain;
        dashboard.setDomains(current => [...current, {
          ...createdDomain,
          id: createdDomain.id,
          domain: createdDomain.domain || domain,
          setup: createdDomain.setup || 'self',
          siteId: site.id,
          status: createdDomain.status || 'pending',
        }]);
      }
      setDomainInput('');
      setIsAddOpen(false);
    } catch {
      setFormError('Could not connect this domain. Check your connection and try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      window.setTimeout(() => setCopiedValue(current => current === value ? null : current), 1600);
    } catch { /* Copy is an enhancement; the value remains selectable. */ }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#121923] to-[#0d1118] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-200"><Globe2 className="h-3.5 w-3.5" /> Site domain</div>
          <h2 className="text-lg font-semibold">{site.name}</h2>
          <p className="mt-1 text-xs text-white/45">{canManageDomain ? 'Connect, verify, and manage the domain for this site.' : 'Domain controls are read-only while this site is in development.'}</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          {canManageDomain && <button type="button" onClick={() => { setIsAddOpen(value => !value); setFormError(''); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ai-blue px-4 text-xs font-semibold text-white transition hover:bg-sky-400">
            {isAddOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}{isAddOpen ? 'Cancel' : 'Connect domain to this site'}
          </button>}
          {canManageDomain && <button type="button" onClick={() => dashboard.router.push('/dashboard?tab=domains')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-xs font-semibold text-white/70 transition hover:border-ai-blue/35 hover:text-white">
            All domains <ExternalLink className="h-3.5 w-3.5" />
          </button>}
        </div>
      </div>

      {isAddOpen && canManageDomain && (
        <form onSubmit={connectDomain} className="space-y-3 rounded-2xl border border-ai-blue/20 bg-ai-blue/[0.035] p-4 sm:p-5">
          <div>
            <h3 className="text-sm font-semibold">Connect a domain to {site.name}</h3>
            <p className="mt-1 text-xs leading-5 text-white/45">Enter a domain you already own. Sitemendr will show the DNS records to add after it is connected.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="yourbusiness.co.ke" value={domainInput} onChange={event => { setDomainInput(event.target.value); setFormError(''); }} className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3.5 font-mono text-xs text-white outline-none placeholder:text-white/25 focus:border-ai-blue/60" />
            <button type="submit" disabled={isAdding || !hasDnsTarget} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ai-blue px-4 text-xs font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-45">{isAdding ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}{isAdding ? 'Connecting' : <>Connect domain <ArrowRight className="h-3.5 w-3.5" /></>}</button>
          </div>
          {formError && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-xs leading-5 text-red-200">{formError}</p>}
          {!hasDnsTarget && <p role="status" className="text-xs text-amber-100/70">Domain setup is unavailable until Sitemendr configures its hosting address.</p>}
        </form>
      )}

      {domains.length ? (
        <div className="space-y-4">
          {domains.map(domain => {
            const verified = ['verified', 'active'].includes(domain.status?.toLowerCase() || '');
            return (
              <article key={domain.id} className="rounded-2xl border border-white/[0.08] bg-[#0d1118] p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-all text-base font-semibold">{domain.domain}</h3>
                    <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${verified ? 'border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-200' : 'border-amber-300/15 bg-amber-300/[0.06] text-amber-100'}`}>
                      {verified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}{domain.status || 'DNS setup needed'}
                    </div>
                    {verified && <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${domain.sslEnabled ? 'border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-200' : 'border-amber-300/15 bg-amber-300/[0.06] text-amber-100'}`}>{domain.sslEnabled ? 'HTTPS ready' : 'HTTPS pending'}</div>}
                  </div>
                  <div className="flex gap-2">
                    {!verified && <button type="button" onClick={async () => { const result = await handleVerifyDomain(domain.id, setVerifyingDomainId); if (result) setVerificationResults(current => ({ ...current, [domain.id]: result })); }} disabled={verifyingDomainId === domain.id || !hasDnsTarget || !canManageDomain} title={!canManageDomain ? 'Domain management unlocks after handoff acceptance and payment closeout.' : !hasDnsTarget ? 'Sitemendr hosting DNS targets are not configured.' : undefined} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ai-blue px-4 text-xs font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50">
                      {verifyingDomainId === domain.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}{verifyingDomainId === domain.id ? 'Checking DNS' : 'Verify DNS'}
                    </button>}
                    <button type="button" onClick={() => handleDeleteDomain(domain.id)} disabled={!canManageDomain} title={!canManageDomain ? 'Domain management unlocks after handoff acceptance and payment closeout.' : undefined} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium text-white/55 transition hover:border-red-400/30 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                  </div>
                </div>

                {!canManageDomain ? (
          <p role="status" className="mt-4 rounded-xl border border-sky-300/15 bg-sky-300/[0.04] p-3 text-xs leading-5 text-sky-100/75">Domain controls unlock after handoff acceptance and payment closeout. Follow the site’s current step in Build Journey.</p>
                ) : verified ? (
                  <p className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-3 text-xs leading-5 text-emerald-100/75"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />DNS is pointing to Sitemendr. Certificate provisioning may take a little longer after verification.</p>
                ) : (
                  <div className="mt-5 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                    <p className="text-xs font-semibold">Finish connecting this domain</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">At your domain provider, add both records below. Keep your email MX records unchanged.</p>
                    {hasDnsTarget ? <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Record type="A" host="@" value={ip} copied={copiedValue === ip} onCopy={() => copyValue(ip)} />
                      <Record type="A" host="www" value={ip} copied={copiedValue === ip} onCopy={() => copyValue(ip)} />
                    </div> : <p role="status" className="mt-3 rounded-lg border border-amber-300/15 bg-amber-300/[0.05] p-3 text-xs leading-5 text-amber-100/75">Domain setup is unavailable until Sitemendr configures its hosting DNS targets.</p>}
                    <p className="mt-3 text-[11px] leading-5 text-white/35">DNS updates can take time to appear. Return here and choose Verify DNS when you’ve saved both records.</p>
                  </div>
                )}
                {verificationResults[domain.id]?.checks && <div aria-live="polite" className="mt-3 grid gap-2 sm:grid-cols-2">{(['root', 'www'] as const).map(hostKey => {
                  const check = verificationResults[domain.id]?.checks?.[hostKey];
                  return check ? <p key={hostKey} className={`rounded-lg border px-3 py-2 text-[11px] ${check.verified ? 'border-emerald-400/15 bg-emerald-400/[0.04] text-emerald-100/75' : 'border-amber-300/15 bg-amber-300/[0.04] text-amber-100/75'}`}>{check.verified ? '✓' : '•'} {check.hostname}: {check.verified ? 'pointing to Sitemendr' : 'DNS record not detected yet'}</p> : null;
                })}</div>}
                {verificationResults[domain.id]?.message && <p aria-live="polite" className={`mt-3 rounded-lg border px-3 py-2 text-[11px] leading-5 ${verificationResults[domain.id]?.verified ? 'border-emerald-400/15 bg-emerald-400/[0.04] text-emerald-100/75' : 'border-amber-300/15 bg-amber-300/[0.04] text-amber-100/75'}`}>{verificationResults[domain.id]?.message}</p>}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-5 py-10 text-center">
          <Globe2 className="mx-auto h-6 w-6 text-white/30" />
          <h3 className="mt-3 text-sm font-semibold">{canManageDomain ? 'No domain connected to this site' : 'Domain setup opens after handoff'}</h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/45">{canManageDomain ? 'Connect a domain you already own directly to this site. Domain purchases through Sitemendr are not available yet.' : 'Your site is still moving through Build Journey. Domain setup unlocks after handoff acceptance and payment closeout.'}</p>
          {canManageDomain ? <button type="button" onClick={() => { setIsAddOpen(true); setFormError(''); }} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-xs font-semibold text-white/70 transition hover:border-ai-blue/35 hover:text-white"><Plus className="h-3.5 w-3.5" />Connect a domain to this site</button> : <button type="button" onClick={() => dashboard.router.push('/dashboard?tab=projects')} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-xs font-semibold text-white/70 transition hover:border-ai-blue/35 hover:text-white">Open Build Journey <ExternalLink className="h-3.5 w-3.5" /></button>}
        </div>
      )}
    </div>
  );
}

function Record({ type, host, value, copied, onCopy }: { type: 'A'; host: string; value: string; copied: boolean; onCopy: () => void }) {
  return <div className="min-w-0 rounded-lg border border-white/[0.07] bg-[#10151d] p-3">
    <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-wider text-sky-200">{type} record</span><span className="text-[10px] text-white/35">Host <code className="text-white/65">{host}</code></span></div>
    <div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 break-all text-[11px] leading-5 text-white/75">{value}</code><button type="button" onClick={onCopy} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-white/10 px-2 text-[10px] font-semibold text-white/55 transition hover:text-white">{copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy'}</button></div>
  </div>;
}
