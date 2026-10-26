'use client';

import { useState } from 'react';
import {
  ArrowRight, Check, CheckCircle2, CircleAlert, CircleHelp, Copy, Globe2,
  LoaderCircle, Plus, RefreshCw, ShieldCheck, Trash2, X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { CustomDomain, ClientProject } from './ClientDashboard_types';
import type { UseClientDashboardReturn } from './useClientDashboard';
import { normalizeBuildStatus } from './utils';

type DomainForm = { domain: string; siteId: string; setup: 'self' };

const normalizeDomainInput = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/^https?:\/\//, '')
  .replace(/^www\./, '')
  .split(/[/?#]/)[0]
  .replace(/\.$/, '');

const isValidDomain = (domain: string) => domain.length <= 253
  && domain.includes('.')
  && domain.split('.').every(label =>
    label.length > 0 && label.length <= 63
    && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)
  );

const getSiteName = (project?: ClientProject) => project?.name || project?.businessName || 'Your site';

export default function ClientDomains({
  dashboard, projects,
}: { dashboard: UseClientDashboardReturn; projects: ClientProject[] }) {
  const { domains, domainDnsTargets, fetchData, handleVerifyDomain, handleDeleteDomain } = dashboard;
  const eligibleProjects = projects.filter(project =>
    project.recordType === 'project'
    && project.canManageSite !== false
    && ['completed', 'suspended'].includes(normalizeBuildStatus(project.status))
  );
  const siteById = new Map(eligibleProjects.map(project => [project.id, project]));
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<DomainForm>({ domain: '', siteId: '', setup: 'self' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [copyError, setCopyError] = useState('');
  const [movingDomainId, setMovingDomainId] = useState<string | null>(null);
  const [moveSiteId, setMoveSiteId] = useState('');
  const [moveError, setMoveError] = useState('');
  const [isMovingDomain, setIsMovingDomain] = useState(false);
  const [verificationResults, setVerificationResults] = useState<Record<string, Awaited<ReturnType<typeof apiClient.verifyDomainDNS>>>>({});

  const closeAdd = () => {
    setIsAddOpen(false);
    setFormError('');
    setForm({ domain: '', siteId: '', setup: 'self' });
  };

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      window.setTimeout(() => setCopiedValue(current => current === value ? null : current), 1600);
    } catch {
      setCopyError('Could not copy automatically. Select and copy the DNS value instead.');
    }
  };

  const submitDomain = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const domain = normalizeDomainInput(form.domain);
    if (!isValidDomain(domain)) {
      setFormError('Enter a valid domain, such as yourbusiness.co.ke.');
      return;
    }
    if (!form.siteId) {
      setFormError('Choose which site this domain should open.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const response = await apiClient.addCustomDomain({ ...form, domain });
      if (!response.success) {
        setFormError(response.message || 'We could not add this domain. Please try again.');
        return;
      }
      closeAdd();
      await fetchData();
    } catch {
      setFormError('We could not add this domain. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const moveDomain = async (domainId: string) => {
    if (!moveSiteId) {
      setMoveError('Choose the site this domain should open.');
      return;
    }
    setIsMovingDomain(true);
    setMoveError('');
    try {
      const response = await apiClient.moveCustomDomain(domainId, moveSiteId);
      if (!response.success) {
        setMoveError(response.message || 'Could not move this domain.');
        return;
      }
      setMovingDomainId(null);
      setMoveSiteId('');
      await fetchData();
    } catch {
      setMoveError('Could not move this domain. Please try again.');
    } finally {
      setIsMovingDomain(false);
    }
  };

  const domainCount = domains.length;
  const verifiedCount = domains.filter(domain => ['verified', 'active'].includes(domain.status?.toLowerCase() || '')).length;
  const hasDnsTarget = Boolean(domainDnsTargets.a);

  return (
    <section className="animate-fade-in space-y-6 text-white">
      <header className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#121923] via-[#0d1118] to-[#0b0e13] p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-ai-blue/20 bg-ai-blue/[0.08] px-3 py-1.5 text-[11px] font-semibold text-sky-200">
            <Globe2 className="h-3.5 w-3.5" /> Bring a domain you own
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Connect your domain</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
            Add a domain you already own, point its DNS to Sitemendr, and verify the connection here. Domain purchases and renewals through Sitemendr will be available later.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          disabled={!eligibleProjects.length || !hasDnsTarget}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ai-blue px-5 text-sm font-semibold text-white shadow-lg shadow-ai-blue/15 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Add a domain
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Connected domains" value={domainCount} detail="Domains in your workspace" icon={<Globe2 className="h-4 w-4" />} />
        <StatCard label="Verified" value={verifiedCount} detail="DNS points to Sitemendr" icon={<ShieldCheck className="h-4 w-4" />} />
        <StatCard label="Needs attention" value={domainCount - verifiedCount} detail="Finish DNS setup or verify" icon={<CircleAlert className="h-4 w-4" />} />
      </div>

      {!hasDnsTarget && (
        <div role="status" className="rounded-xl border border-amber-300/15 bg-amber-300/[0.05] px-4 py-3 text-xs leading-5 text-amber-100/75">
          Domain connections are temporarily unavailable because the Sitemendr hosting DNS target has not been configured. Try again later or contact support.
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1118]">
        <div className="flex flex-col gap-2 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-semibold">Your domains</h2>
            <p className="mt-1 text-xs text-white/40">Each domain is linked to one site. You can change its DNS with your current domain provider.</p>
          </div>
          {domainCount > 0 && <span className="text-xs text-white/40">{domainCount} {domainCount === 1 ? 'domain' : 'domains'}</span>}
        </div>

        {domains.length ? (
          <div className="divide-y divide-white/[0.06]">
            {domains.map((domain: CustomDomain) => {
              const verified = ['verified', 'active'].includes(domain.status?.toLowerCase() || '');
              const project = siteById.get(domain.siteId || '');
              const dnsIp = domainDnsTargets.a;
              return (
                <article key={domain.id} className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="break-all text-base font-semibold tracking-tight sm:text-lg">{domain.domain}</h3>
                        <StatusBadge verified={verified} label={domain.status || 'DNS setup needed'} />
                        {verified && <StatusBadge verified={Boolean(domain.sslEnabled)} label={domain.sslEnabled ? 'HTTPS ready' : 'HTTPS pending'} />}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/45">
                        <span>Connected to <span className="font-medium text-white/70">{project ? getSiteName(project) : domain.subscription?.siteName || domain.subscription?.customName || 'Site'}</span></span>
                        {project && eligibleProjects.length > 1 && <button type="button" onClick={() => { setMovingDomainId(movingDomainId === domain.id ? null : domain.id); setMoveSiteId(''); setMoveError(''); }} className="font-semibold text-sky-200/80 transition hover:text-sky-100">Change site</button>}
                      </div>

                      {movingDomainId === domain.id && (
                        <div className="mt-3 max-w-xl rounded-xl border border-ai-blue/20 bg-ai-blue/[0.04] p-3.5">
                          <label className="block text-[11px] font-semibold text-white/70" htmlFor={`move-domain-${domain.id}`}>Connect this domain to</label>
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                            <select id={`move-domain-${domain.id}`} value={moveSiteId} onChange={event => setMoveSiteId(event.target.value)} className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-[#111720] px-3 text-xs text-white outline-none focus:border-ai-blue/60">
                              <option value="">Choose a site</option>
                              {eligibleProjects.filter(candidate => candidate.id !== domain.siteId).map(candidate => <option key={candidate.id} value={candidate.id}>{getSiteName(candidate)}</option>)}
                            </select>
                            <button type="button" onClick={() => moveDomain(domain.id)} disabled={isMovingDomain || !moveSiteId} className="min-h-10 rounded-lg bg-ai-blue px-4 text-xs font-semibold text-white disabled:opacity-45">{isMovingDomain ? 'Moving…' : 'Move domain'}</button>
                            <button type="button" onClick={() => { setMovingDomainId(null); setMoveError(''); }} className="min-h-10 rounded-lg border border-white/10 px-3 text-xs font-medium text-white/60">Cancel</button>
                          </div>
                          <p className="mt-2 text-[11px] leading-5 text-white/40">This changes which Sitemendr site opens at this domain. Your registration and DNS settings at the provider stay unchanged.</p>
                          {moveError && <p role="alert" className="mt-2 text-[11px] text-amber-100/80">{moveError}</p>}
                        </div>
                      )}

                      {!verified ? (
                        <div className="mt-5 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                          <div className="mb-3 flex items-start gap-2.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ai-blue/15 text-[11px] font-bold text-sky-200">1</span>
                            <div>
                              <p className="text-xs font-semibold">Update DNS where you bought your domain</p>
                              <p className="mt-1 text-xs leading-5 text-white/45">Sign in to your domain provider, open DNS settings, and add both records below for <span className="font-medium text-white/70">{domain.domain}</span>.</p>
                            </div>
                          </div>
                          <div className="ml-0 grid gap-2 sm:ml-8 sm:grid-cols-2">
                            {dnsIp && <DnsRecord type="A" host="@" value={dnsIp} copied={copiedValue === dnsIp} onCopy={() => copyValue(dnsIp)} />}
                            {dnsIp && <DnsRecord type="A" host="www" value={dnsIp} copied={copiedValue === dnsIp} onCopy={() => copyValue(dnsIp)} />}
                          </div>
                          {copyError && <p role="status" className="ml-0 mt-2 text-[11px] text-amber-100/70 sm:ml-8">{copyError}</p>}
                          <div className="mt-4 flex items-start gap-2 border-t border-white/[0.06] pt-3 text-[11px] leading-5 text-white/40">
                            <CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            Keep existing email records (MX records) unchanged. DNS changes can take time to appear. Replace conflicting website records for these same hosts; do not remove unrelated records.
                          </div>
                          {!project && <p className="ml-0 mt-3 text-[11px] text-amber-100/70 sm:ml-8">Domain actions unlock after the site handoff is accepted and payment is closed out.</p>}
                        </div>
                      ) : (
                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-3 text-xs leading-5 text-emerald-100/75">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                          <span>Both the root domain and www point to Sitemendr. {domain.sslEnabled ? <>HTTPS is ready{domain.sslExpiresAt ? ` through ${new Date(domain.sslExpiresAt).toLocaleDateString()}` : ''}.</> : 'HTTPS is not ready yet. Certificate readiness is checked separately after DNS verification.'}</span>
                        </div>
                      )}

                      {verificationResults[domain.id]?.checks && (
                        <div aria-live="polite" className="mt-3 grid gap-2 sm:grid-cols-2">
                          {(['root', 'www'] as const).map(hostKey => {
                            const check = verificationResults[domain.id].checks?.[hostKey];
                            if (!check) return null;
                            return <p key={hostKey} className={`rounded-lg border px-3 py-2 text-[11px] ${check.verified ? 'border-emerald-400/15 bg-emerald-400/[0.04] text-emerald-100/75' : 'border-amber-300/15 bg-amber-300/[0.04] text-amber-100/75'}`}>
                              {check.verified ? '✓' : '•'} {check.hostname}: {check.verified ? 'pointing to Sitemendr' : 'DNS record not detected yet'}
                            </p>;
                          })}
                        </div>
                      )}
                      {verificationResults[domain.id]?.message && (
                        <p aria-live="polite" className={`mt-3 rounded-lg border px-3 py-2 text-[11px] leading-5 ${verificationResults[domain.id].verified ? 'border-emerald-400/15 bg-emerald-400/[0.04] text-emerald-100/75' : 'border-amber-300/15 bg-amber-300/[0.04] text-amber-100/75'}`}>
                          {verificationResults[domain.id].message}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 xl:pt-0.5">
                      {!verified && (
                        <button
                          type="button"
                          onClick={async () => {
                            const result = await handleVerifyDomain(domain.id, setVerifyingDomainId);
                            if (result) setVerificationResults(current => ({ ...current, [domain.id]: result }));
                          }}
                          disabled={verifyingDomainId === domain.id || !project || !hasDnsTarget}
                          title={!project ? 'Site management becomes available after handoff acceptance and payment closeout.' : undefined}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ai-blue px-4 text-xs font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {verifyingDomainId === domain.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                          {verifyingDomainId === domain.id ? 'Checking DNS' : 'Verify DNS'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteDomain(domain.id)}
                        disabled={!project}
                        title={!project ? 'Site management becomes available after handoff acceptance and payment closeout.' : undefined}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium text-white/55 transition hover:border-red-400/30 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" /><span>Remove</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center sm:py-16">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white/45"><Globe2 className="h-5 w-5" /></div>
            <h3 className="mt-4 text-sm font-semibold">No domains connected yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/45">Add a domain you already own, then follow the DNS steps here to connect it to a site.</p>
            <button type="button" onClick={() => setIsAddOpen(true)} disabled={!eligibleProjects.length || !hasDnsTarget} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-xs font-semibold text-white/75 transition hover:border-ai-blue/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Add a domain</button>
            {!eligibleProjects.length && <p className="mt-3 text-[11px] text-white/35">Domain connection is available after a site’s handoff and payment closeout.</p>}
          </div>
        )}
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-xs leading-5 text-white/45">
        <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
        <p><span className="font-semibold text-white/65">Don’t own a domain yet?</span> Sitemendr domain search and purchase are not available yet. For now, buy a domain from a provider you trust, then bring it here to connect. You remain in control of that provider account and its renewal until Sitemendr domain sales are available.</p>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget) closeAdd(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="add-domain-title" className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0d1118] shadow-2xl sm:max-w-xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:px-6">
              <div>
                <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-200"><span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> Step 1 of 2</div>
                <h2 id="add-domain-title" className="text-lg font-semibold">Add a domain you own</h2>
                <p className="mt-1 text-xs leading-5 text-white/45">We’ll link it to your site and show the DNS records to add next.</p>
              </div>
              <button type="button" onClick={closeAdd} aria-label="Close" className="rounded-lg p-2 text-white/45 transition hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={submitDomain} className="space-y-5 p-5 sm:p-6">
              <label className="block space-y-2">
                <span className="text-xs font-semibold text-white/75">Domain name</span>
                <input autoFocus type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="yourbusiness.co.ke" value={form.domain} onChange={event => { setForm(current => ({ ...current, domain: event.target.value })); setFormError(''); }} className="min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 font-mono text-sm text-white outline-none placeholder:text-white/25 focus:border-ai-blue/60" />
                <span className="block text-[11px] leading-5 text-white/40">Enter the domain you already own. You can paste it with or without https:// or www.</span>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold text-white/75">Which site should it open?</span>
                <select value={form.siteId} onChange={event => { setForm(current => ({ ...current, siteId: event.target.value })); setFormError(''); }} className="min-h-12 w-full rounded-xl border border-white/10 bg-[#111720] px-4 text-sm text-white outline-none focus:border-ai-blue/60">
                  <option value="">Choose a site</option>
                  {eligibleProjects.map(project => <option key={project.id} value={project.id}>{getSiteName(project)}</option>)}
                </select>
                {!eligibleProjects.length && <span className="block text-[11px] leading-5 text-amber-200/70">Your site will be selectable after handoff acceptance and payment closeout.</span>}
              </label>

              <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ai-blue/10 text-sky-200"><ShieldCheck className="h-4 w-4" /></span>
                <p className="text-xs leading-5 text-white/50">This only connects a domain you own. Sitemendr won’t change your registrar account or email settings. You’ll add the website DNS record with your current provider.</p>
              </div>

              {formError && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3.5 py-3 text-xs leading-5 text-red-200">{formError}</p>}

              <div className="flex flex-col-reverse gap-2 border-t border-white/[0.07] pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeAdd} className="min-h-11 rounded-lg border border-white/10 px-4 text-xs font-semibold text-white/65 transition hover:text-white">Cancel</button>
                <button type="submit" disabled={isSubmitting || !eligibleProjects.length || !hasDnsTarget} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ai-blue px-5 text-xs font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-45">{isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}{isSubmitting ? 'Adding domain…' : <>Add domain <ArrowRight className="h-3.5 w-3.5" /></>}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value, detail, icon }: { label: string; value: number; detail: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0d1118] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-white/50">{label}</span><span className="text-white/35">{icon}</span></div>
      <div className="mt-3 flex items-baseline gap-2"><span className="text-2xl font-semibold tracking-tight">{value}</span><span className="text-[11px] text-white/35">{detail}</span></div>
    </div>
  );
}

function StatusBadge({ verified, label }: { verified: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${verified ? 'border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-200' : 'border-amber-300/15 bg-amber-300/[0.06] text-amber-100'}`}>
      {verified ? <Check className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}{label}
    </span>
  );
}

function DnsRecord({ type, host, value, copied, onCopy }: { type: 'A'; host: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/[0.07] bg-[#10151d] p-3">
      <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-wider text-sky-200">{type} record</span><span className="text-[10px] text-white/35">Host <span className="font-mono text-white/65">{host}</span></span></div>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all text-[11px] leading-5 text-white/75">{value}</code>
        <button type="button" onClick={onCopy} aria-label={`Copy ${type} record value`} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-white/10 px-2 text-[10px] font-semibold text-white/55 transition hover:border-white/20 hover:text-white">{copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy'}</button>
      </div>
    </div>
  );
}
