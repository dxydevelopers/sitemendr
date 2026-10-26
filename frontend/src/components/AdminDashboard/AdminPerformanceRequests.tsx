'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, MessageCircle, RefreshCw, Send, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface PerformanceRequest {
  id: string;
  title: string;
  businessName?: string | null;
  summary?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  paymentConfirmedAt?: string | null;
  completionNotes?: string | null;
  subscriptionId?: string | null;
  performanceContext?: {
    goal?: string;
    notes?: string | null;
    evidenceLinks?: string[];
    baseline?: {
      score?: number | null;
      url?: string;
      strategy?: string;
      scannedAt?: string;
      finding?: { task?: string; impact?: string } | null;
      metrics?: { vitals?: Record<string, string | null> };
    } | null;
    completion?: { note?: string; followupScan?: { score?: number | null; url?: string; strategy?: string; metrics?: { vitals?: Record<string, string | null> }; scannedAt?: string } | null } | null;
  } | null;
  quoteVersions?: Array<{
    id: string;
    version: number;
    status: string;
    snapshot: { scope?: string; amount?: number; currency?: string; timeline?: string; paymentSchedule?: string; depositAmount?: number };
  }>;
  user?: { name?: string | null; email?: string | null };
}

interface PerformanceScan {
  id: string;
  score?: number | null;
  url: string;
  scannedAt: string;
  strategy?: 'mobile' | 'desktop';
  conditions?: { formFactor?: string | null } | null;
}

interface AdminAvailabilitySite {
  subscriptionId: string;
  siteName: string;
  domain: string | null;
  clientName: string | null;
  clientEmail: string | null;
  status: 'UP' | 'DOWN' | null;
  lastChecked: string | null;
  statusCode: number | null;
  responseTimeMs: number | null;
  scheduledChecks: number;
  observedUptimePercent: number | null;
  summaryDays?: number;
  retentionDays?: number;
  recentTransitions?: Array<{ previousStatus: 'UP' | 'DOWN'; status: 'UP' | 'DOWN'; checkedAt: string }>;
}

interface ConversationMessage {
  id: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

export default function AdminPerformanceRequests() {
  const [requests, setRequests] = useState<PerformanceRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteScope, setQuoteScope] = useState('');
  const [quoteTimeline, setQuoteTimeline] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteCurrency, setQuoteCurrency] = useState('USD');
  const [quotePaymentSchedule, setQuotePaymentSchedule] = useState<'full_upfront' | 'deposit_balance'>('full_upfront');
  const [quoteDeposit, setQuoteDeposit] = useState('');
  const [quoteDueDate, setQuoteDueDate] = useState('');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [followupScanId, setFollowupScanId] = useState('');
  const [performanceScans, setPerformanceScans] = useState<PerformanceScan[]>([]);
  const [completionSubmitting, setCompletionSubmitting] = useState(false);
  const [availabilitySites, setAvailabilitySites] = useState<AdminAvailabilitySite[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availabilityPolicy, setAvailabilityPolicy] = useState<{ checkIntervalMinutes: number; summaryDays: number; retentionDays: number; cleanupEnabled: boolean } | null>(null);

  const selected = useMemo(() => requests.find(request => request.id === selectedId) || null, [requests, selectedId]);
  const baselineStrategy = selected?.performanceContext?.baseline?.strategy;
  const comparableScans = useMemo(() => performanceScans.filter(scan => {
    if (selected?.paymentConfirmedAt && new Date(scan.scannedAt) <= new Date(selected.paymentConfirmedAt)) return false;
    if (!baselineStrategy) return true;
    return (scan.strategy || scan.conditions?.formFactor || 'mobile') === baselineStrategy;
  }), [performanceScans, baselineStrategy, selected?.paymentConfirmedAt]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getAdminProjectRequests('performance') as { success: boolean; data?: PerformanceRequest[]; message?: string };
      if (!response.success) throw new Error(response.message || 'Performance requests could not be loaded.');
      const next = response.data || [];
      setRequests(next);
      setSelectedId(current => current && next.some(request => request.id === current) ? current : next[0]?.id || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Performance requests could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAvailability = useCallback(async () => {
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    try {
      const response = await apiClient.getAdminPerformanceAvailability();
      if (!response.success) throw new Error(response.message || 'Site availability could not be loaded.');
      setAvailabilitySites(response.data || []);
      setAvailabilityPolicy(response.policy || null);
      if (response.historyAvailable === false) setAvailabilityError('Availability history storage is not available. Showing latest recorded statuses only.');
    } catch (loadError) {
      setAvailabilityError(loadError instanceof Error ? loadError.message : 'Site availability could not be loaded.');
    } finally {
      setAvailabilityLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (requestId: string) => {
    setLoadingConversation(true);
    setError(null);
    try {
      const response = await apiClient.getAdminProjectConversation(requestId) as { success: boolean; data?: unknown[]; message?: string };
      if (!response.success) throw new Error(response.message || 'Conversation could not be loaded.');
      setMessages((response.data || []) as ConversationMessage[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Conversation could not be loaded.');
    } finally {
      setLoadingConversation(false);
    }
  }, []);

  useEffect(() => { void loadRequests(); }, [loadRequests]);
  useEffect(() => {
    void loadAvailability();
    const refreshAvailability = () => { void loadAvailability(); };
    window.addEventListener('sitemendr:site-availability-alert', refreshAvailability);
    return () => window.removeEventListener('sitemendr:site-availability-alert', refreshAvailability);
  }, [loadAvailability]);
  useEffect(() => {
    const onRequestUpdated = () => { void loadRequests(); };
    const onConversationMessage = (event: Event) => {
      const detail = (event as CustomEvent<{ requestId?: string; message?: ConversationMessage }>).detail;
      if (detail?.requestId !== selectedId || !detail.message) return;
      setMessages(current => current.some(message => message.id === detail.message?.id) ? current : [...current, detail.message as ConversationMessage]);
    };
    window.addEventListener('sitemendr:performance-request-updated', onRequestUpdated);
    window.addEventListener('sitemendr:project-conversation-message', onConversationMessage);
    return () => {
      window.removeEventListener('sitemendr:performance-request-updated', onRequestUpdated);
      window.removeEventListener('sitemendr:project-conversation-message', onConversationMessage);
    };
  }, [selectedId, loadRequests]);
  useEffect(() => {
    if (selectedId) void loadConversation(selectedId);
    else setMessages([]);
  }, [selectedId, loadConversation]);

  useEffect(() => {
    if (!selectedId) { setPerformanceScans([]); return; }
    let active = true;
    apiClient.getAdminPerformanceScans(selectedId).then(response => {
      if (!response.success) throw new Error('Performance scan history could not be loaded.');
      if (active) setPerformanceScans((response.data || []) as unknown as PerformanceScan[]);
    }).catch(scanError => {
      if (active) {
        setPerformanceScans([]);
        setError(scanError instanceof Error ? scanError.message : 'Performance scan history could not be loaded.');
      }
    });
    return () => { active = false; };
  }, [selectedId]);

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const response = await apiClient.sendAdminProjectConversation(selectedId, { message: draft.trim() });
      if (!response.success) throw new Error(response.message || 'Message could not be sent.');
      setDraft('');
      await loadConversation(selectedId);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const sendQuote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    setQuoteSubmitting(true);
    setError(null);
    try {
      const response = await apiClient.createAdminPerformanceQuote(selected.id, {
        scope: quoteScope.trim(),
        timeline: quoteTimeline.trim(),
        amount: Number(quoteAmount),
        currency: quoteCurrency,
        paymentSchedule: quotePaymentSchedule,
        depositAmount: quotePaymentSchedule === 'deposit_balance' ? Number(quoteDeposit) : 0,
        paymentDueDate: quoteDueDate || undefined,
      });
      if (!response.success) throw new Error(response.message || 'Proposal could not be sent.');
      setQuoteScope('');
      setQuoteTimeline('');
      setQuoteAmount('');
      setQuoteDeposit('');
      setQuoteDueDate('');
      await loadRequests();
      await loadConversation(selected.id);
    } catch (quoteError) {
      setError(quoteError instanceof Error ? quoteError.message : 'Proposal could not be sent.');
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const submitForReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || !completionNote.trim()) return;
    setCompletionSubmitting(true);
    setError(null);
    try {
      const response = await apiClient.submitAdminPerformanceReview(selected.id, { completionNote: completionNote.trim(), followupScanId: followupScanId || undefined });
      if (!response.success) throw new Error(response.message || 'Work could not be sent for review.');
      setCompletionNote('');
      setFollowupScanId('');
      await loadRequests();
      await loadConversation(selected.id);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Work could not be sent for review.');
    } finally {
      setCompletionSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl flex-col gap-5">
      <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ai-blue">Site operations</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Performance requests</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-white/45">Review the client’s goal and scan baseline, then continue the discussion in the same request thread.</p>
        </div>
        <button type="button" onClick={() => void loadRequests()} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 border border-white/10 px-4 text-xs font-semibold text-white/70 hover:text-white disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && <p role="alert" className="border border-rose-300/20 bg-rose-300/[0.05] px-4 py-3 text-xs text-rose-100/80">{error}</p>}

      <section className="border border-white/[0.08] bg-white/[0.015] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div><h3 className="text-xs font-semibold text-white">Client site availability</h3><p className="mt-1 text-[10px] text-white/40">Automatic checks every {availabilityPolicy?.checkIntervalMinutes || 15} minutes · {availabilityPolicy?.summaryDays || 30}-day uptime summary · detailed checks kept {availabilityPolicy?.retentionDays || 90} days</p>{availabilityPolicy && <p className={`mt-1 text-[9px] ${availabilityPolicy.cleanupEnabled ? 'text-emerald-200/55' : 'text-amber-100/70'}`}>{availabilityPolicy.cleanupEnabled ? 'Automatic history cleanup is active.' : 'Automatic history cleanup is waiting for availability history storage.'}</p>}</div>
          <button type="button" onClick={() => void loadAvailability()} disabled={availabilityLoading} className="inline-flex min-h-9 items-center gap-2 border border-white/10 px-3 text-[10px] font-semibold text-white/60 hover:text-white disabled:opacity-50"><RefreshCw className={`h-3 w-3 ${availabilityLoading ? 'animate-spin' : ''}`} />Refresh</button>
        </div>
        {availabilityError && <p role="status" className="mb-3 text-[10px] text-amber-100/70">{availabilityError}</p>}
        {availabilitySites.length ? <div className="grid gap-2 md:grid-cols-2">
          {[...availabilitySites].sort((a, b) => Number(b.status === 'DOWN') - Number(a.status === 'DOWN')).map(site => <div key={site.subscriptionId} className="flex min-w-0 items-center justify-between gap-3 border border-white/[0.06] px-3 py-2.5">
            <div className="min-w-0"><p className="truncate text-[11px] font-semibold text-white/80">{site.siteName}</p><p className="mt-1 truncate text-[9px] text-white/35">{site.clientName || site.clientEmail || 'Client'}{site.domain ? ` · ${site.domain}` : ''}</p><p className="mt-1 text-[9px] text-white/35">{site.lastChecked ? `Checked ${new Date(site.lastChecked).toLocaleString()}` : 'No check recorded yet'}</p>{site.recentTransitions?.slice(0, 2).map(transition => <p key={`${transition.status}-${transition.checkedAt}`} className={`mt-1 text-[9px] ${transition.status === 'DOWN' ? 'text-rose-200/70' : 'text-emerald-200/70'}`}>{transition.status === 'DOWN' ? 'Went unavailable' : 'Recovered'} · {new Date(transition.checkedAt).toLocaleString()}</p>)}</div>
            <div className="shrink-0 text-right"><p className={`text-[10px] font-semibold ${site.status === 'UP' ? 'text-emerald-300' : site.status === 'DOWN' ? 'text-rose-300' : 'text-white/40'}`}>{site.status || 'Not checked'}</p><p className="mt-1 text-[9px] text-white/35">{site.observedUptimePercent == null ? '—' : `${site.observedUptimePercent}%`} · {site.scheduledChecks} checks</p></div>
          </div>)}
        </div> : <p className="text-[10px] text-white/40">{availabilityLoading ? 'Loading site status…' : 'No managed sites are available for monitoring yet.'}</p>}
      </section>

      <div className="grid min-h-[36rem] flex-1 gap-4 lg:grid-cols-[minmax(16rem,0.85fr)_minmax(0,1.5fr)]">
        <section className="min-w-0 border border-white/[0.08] bg-white/[0.015]">
          <div className="border-b border-white/[0.07] px-4 py-3"><p className="text-xs font-semibold text-white">Inbox <span className="ml-1 text-white/35">{requests.length}</span></p></div>
          {loading && !requests.length ? <p className="p-5 text-xs text-white/40">Loading requests…</p> : requests.length ? <div className="divide-y divide-white/[0.06]">
            {requests.map(request => <button key={request.id} type="button" onClick={() => setSelectedId(request.id)} className={`w-full min-w-0 p-4 text-left transition ${selectedId === request.id ? 'bg-ai-blue/[0.09]' : 'hover:bg-white/[0.035]'}`}>
              <span className="flex items-center justify-between gap-3"><span className="truncate text-xs font-semibold text-white/85">{request.businessName || 'Client site'}</span><span className="shrink-0 text-[9px] capitalize text-white/35">{request.status.replace(/_/g, ' ')}</span></span>
              <span className="mt-1 block truncate text-[11px] text-white/55">{request.title}</span>
              <span className="mt-2 block truncate text-[10px] text-white/35">{request.user?.name || request.user?.email || 'Client'} · {new Date(request.updatedAt).toLocaleDateString()}</span>
            </button>)}
          </div> : <div className="p-5"><p className="text-xs font-semibold text-white/70">No performance requests yet</p><p className="mt-1 text-xs leading-5 text-white/40">Client requests will appear here once submitted.</p></div>}
        </section>

        {selected ? <section className="flex min-w-0 flex-col border border-white/[0.08] bg-white/[0.015]">
          <header className="border-b border-white/[0.07] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-[10px] font-semibold text-ai-blue">{selected.businessName || 'Client site'}</p><h3 className="mt-1 break-words text-base font-semibold text-white">{selected.title}</h3><p className="mt-1 text-[10px] text-white/40">{selected.user?.name || selected.user?.email || 'Client'} · submitted {new Date(selected.createdAt).toLocaleString()}</p></div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] capitalize text-white/55">{selected.status.replace(/_/g, ' ')}</span>
            </div>
          </header>

          <div className="grid gap-3 border-b border-white/[0.07] p-4 sm:grid-cols-2 sm:p-5">
            <div className="border border-white/[0.06] p-3"><p className="text-[9px] font-semibold uppercase tracking-wide text-white/35">Client goal</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-white/75">{selected.performanceContext?.goal || selected.summary || 'No goal provided.'}</p></div>
            <div className="border border-white/[0.06] p-3"><p className="text-[9px] font-semibold uppercase tracking-wide text-white/35">Scan baseline</p>{selected.performanceContext?.baseline ? <><p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-white/75"><Zap className="h-3.5 w-3.5 text-amber-300" /> Score {selected.performanceContext.baseline.score ?? '—'}/100</p><p className="mt-1 text-[10px] text-white/40">{selected.performanceContext.baseline.strategy || 'mobile'} · {selected.performanceContext.baseline.scannedAt ? new Date(selected.performanceContext.baseline.scannedAt).toLocaleString() : 'scan date unavailable'}</p>{selected.performanceContext.baseline.finding?.task && <p className="mt-2 text-[11px] leading-4 text-white/65">Selected: {selected.performanceContext.baseline.finding.task}</p>}</> : <p className="mt-2 text-xs text-white/40">General request, no scan attached.</p>}</div>
            {selected.performanceContext?.notes && <div className="border border-white/[0.06] p-3 sm:col-span-2"><p className="text-[9px] font-semibold uppercase tracking-wide text-white/35">Client notes</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-white/70">{selected.performanceContext.notes}</p></div>}
            {!!selected.performanceContext?.evidenceLinks?.length && <div className="border border-white/[0.06] p-3 sm:col-span-2"><p className="text-[9px] font-semibold uppercase tracking-wide text-white/35">Reference links</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">{selected.performanceContext.evidenceLinks.map(link => <a key={link} href={link} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-[11px] text-ai-blue hover:text-white">{link}<ArrowUpRight className="h-3 w-3 shrink-0" /></a>)}</div></div>}
            {selected.performanceContext?.completion?.note && <div className="border border-emerald-300/10 p-3 sm:col-span-2"><p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-100/45">Submitted completion</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-white/70">{selected.performanceContext.completion.note}</p>{selected.performanceContext.completion.followupScan && <p className="mt-2 text-[10px] text-white/40">Follow-up scan: {selected.performanceContext.completion.followupScan.score ?? '—'}/100 · {selected.performanceContext.completion.followupScan.url || ''}</p>}</div>}
          </div>

          {['submitted', 'scope_and_quote'].includes(selected.status) && <form onSubmit={sendQuote} className="space-y-3 border-b border-white/[0.07] p-4 sm:p-5">
            <div><h4 className="text-xs font-semibold text-white">Prepare a scoped proposal</h4><p className="mt-1 text-[10px] leading-4 text-white/40">The client reviews and accepts these terms before the matching invoice can be paid.</p></div>
            <label className="block space-y-1.5 text-[10px] font-semibold text-white/55">Work scope
              <textarea required maxLength={5000} value={quoteScope} onChange={event => setQuoteScope(event.target.value)} rows={3} className="w-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-normal leading-5 text-white outline-none focus:border-ai-blue/50" placeholder="Describe the specific improvements included and what completion means." />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-[10px] font-semibold text-white/55">Estimated timeline
                <input required maxLength={240} value={quoteTimeline} onChange={event => setQuoteTimeline(event.target.value)} className="min-h-10 w-full border border-white/10 bg-black/20 px-3 text-xs font-normal text-white outline-none focus:border-ai-blue/50" placeholder="e.g. 5 business days" />
              </label>
              <div className="grid grid-cols-[minmax(5rem,0.55fr)_minmax(0,1fr)] gap-2">
                <label className="space-y-1.5 text-[10px] font-semibold text-white/55">Currency
                  <input required minLength={3} maxLength={3} value={quoteCurrency} onChange={event => setQuoteCurrency(event.target.value.toUpperCase())} className="min-h-10 w-full border border-white/10 bg-black/20 px-3 text-xs font-normal uppercase text-white outline-none focus:border-ai-blue/50" />
                </label>
                <label className="space-y-1.5 text-[10px] font-semibold text-white/55">Total quote
                  <input required type="number" min="0.01" step="0.01" value={quoteAmount} onChange={event => setQuoteAmount(event.target.value)} className="min-h-10 w-full border border-white/10 bg-black/20 px-3 text-xs font-normal text-white outline-none focus:border-ai-blue/50" />
                </label>
              </div>
              <label className="space-y-1.5 text-[10px] font-semibold text-white/55">Payment schedule
                <select value={quotePaymentSchedule} onChange={event => setQuotePaymentSchedule(event.target.value as 'full_upfront' | 'deposit_balance')} className="min-h-10 w-full border border-white/10 bg-[#10141d] px-3 text-xs text-white outline-none focus:border-ai-blue/50">
                  <option value="full_upfront">Full payment before work</option>
                  <option value="deposit_balance">Deposit before work, balance after review</option>
                </select>
              </label>
              {quotePaymentSchedule === 'deposit_balance' && <label className="space-y-1.5 text-[10px] font-semibold text-white/55">Deposit due to start
                <input required type="number" min="0.01" step="0.01" value={quoteDeposit} onChange={event => setQuoteDeposit(event.target.value)} className="min-h-10 w-full border border-white/10 bg-black/20 px-3 text-xs font-normal text-white outline-none focus:border-ai-blue/50" />
              </label>}
              <label className="space-y-1.5 text-[10px] font-semibold text-white/55">Payment due date
                <input required type="date" value={quoteDueDate} onChange={event => setQuoteDueDate(event.target.value)} className="min-h-10 w-full border border-white/10 bg-black/20 px-3 text-xs font-normal text-white outline-none focus:border-ai-blue/50" />
              </label>
            </div>
            <div className="flex justify-end"><button type="submit" disabled={quoteSubmitting} className="min-h-10 bg-ai-blue px-4 text-xs font-semibold text-white disabled:opacity-50">{quoteSubmitting ? 'Sending proposal…' : 'Send proposal'}</button></div>
          </form>}

          {selected.status === 'in_progress' && <form onSubmit={submitForReview} className="space-y-3 border-b border-white/[0.07] p-4 sm:p-5">
            <div><h4 className="text-xs font-semibold text-white">Submit completed work for review</h4><p className="mt-1 text-[10px] leading-4 text-white/40">Summarize what changed and attach a scan from this site so the client can compare the result.</p></div>
            <label className="block space-y-1.5 text-[10px] font-semibold text-white/55">Completion summary<textarea required maxLength={5000} value={completionNote} onChange={event => setCompletionNote(event.target.value)} rows={3} className="w-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-normal leading-5 text-white outline-none focus:border-ai-blue/50" placeholder="Describe the completed improvements and any relevant notes." /></label>
            <label className="block space-y-1.5 text-[10px] font-semibold text-white/55">Required follow-up scan<select required value={followupScanId} onChange={event => setFollowupScanId(event.target.value)} className="min-h-10 w-full border border-white/10 bg-[#10141d] px-3 text-xs text-white outline-none focus:border-ai-blue/50"><option value="">Select a scan from this site</option>{comparableScans.map(scan => <option key={scan.id} value={scan.id}>{scan.score ?? '—'}/100 · {scan.strategy || scan.conditions?.formFactor || 'mobile'} · {new Date(scan.scannedAt).toLocaleString()}</option>)}</select>{comparableScans.length === 0 && <span className="block text-[9px] font-normal text-amber-100/60">{performanceScans.length === 0 ? 'No scans are available yet. Run a scan from the client’s Performance tab first.' : selected?.paymentConfirmedAt && !performanceScans.some(scan => new Date(scan.scannedAt) > new Date(selected.paymentConfirmedAt as string)) ? 'Run a new scan after the Performance payment is verified.' : `Run a ${baselineStrategy} scan so the client can compare it with the original baseline.`}</span>}</label>
            <div className="flex justify-end"><button type="submit" disabled={completionSubmitting || !completionNote.trim() || !followupScanId || !comparableScans.some(scan => scan.id === followupScanId)} className="min-h-10 bg-ai-blue px-4 text-xs font-semibold text-white disabled:opacity-50">{completionSubmitting ? 'Submitting…' : 'Send to client review'}</button></div>
          </form>}

          <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3"><MessageCircle className="h-4 w-4 text-ai-blue" /><h4 className="text-xs font-semibold text-white">Client conversation</h4><button type="button" onClick={() => void loadConversation(selected.id)} className="ml-auto text-[10px] font-semibold text-white/40 hover:text-white">Refresh</button></div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
            {loadingConversation ? <p className="py-8 text-center text-xs text-white/35">Loading conversation…</p> : messages.length ? messages.map(message => {
              const own = message.senderRole === 'admin';
              const system = message.senderRole === 'system';
              return <div key={message.id} className={`flex ${system ? 'justify-center' : own ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] px-3 py-2 ${system ? 'border border-white/[0.07] text-center text-[10px] text-white/40' : own ? 'bg-ai-blue/20 text-white/90' : 'border border-white/[0.08] bg-white/[0.035] text-white/80'}`}><p className="whitespace-pre-wrap break-words text-xs leading-5">{message.message}</p><p className="mt-1 text-[9px] text-white/35">{system ? 'Update' : own ? 'You' : 'Client'} · {new Date(message.createdAt).toLocaleString()}</p></div></div>;
            }) : <p className="py-8 text-center text-xs text-white/35">No messages yet. Reply to begin the conversation.</p>}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 border-t border-white/[0.07] p-3 sm:p-4">
            <input value={draft} onChange={event => setDraft(event.target.value)} maxLength={4000} placeholder="Write a message…" className="min-h-11 min-w-0 flex-1 border border-white/10 bg-black/20 px-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-ai-blue/60" />
            <button type="submit" disabled={sending || !draft.trim()} className="inline-flex min-h-11 items-center gap-2 bg-ai-blue px-4 text-xs font-semibold text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" />{sending ? 'Sending…' : 'Send'}</button>
          </form>
        </section> : <section className="grid place-items-center border border-white/[0.08] bg-white/[0.015] p-6 text-center"><div><MessageCircle className="mx-auto h-7 w-7 text-white/20" /><p className="mt-3 text-sm font-semibold text-white/65">Select a request</p><p className="mt-1 text-xs text-white/35">Client goals and scan context will show here.</p></div></section>}
      </div>
    </div>
  );
}
