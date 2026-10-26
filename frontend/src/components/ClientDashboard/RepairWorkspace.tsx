'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Clock3, ExternalLink, LoaderCircle, Plus, Wrench } from 'lucide-react';
import { apiClient, type RepairRequestRecord } from '@/lib/api';
import type { ClientProject } from './ClientDashboard_types';

const statusLabel: Record<string, string> = {
  submitted: 'Received', reviewing: 'Initial review', awaiting_diagnosis_payment: 'Diagnosis fee approval', diagnosing: 'Diagnosing', awaiting_client_info: 'Waiting for your details', proposal_ready: 'Proposal ready', declined: 'Proposal declined', awaiting_payment: 'Payment needed', in_progress: 'Repair in progress', ready_for_review: 'Ready for your review', awaiting_final_payment: 'Final balance due', cancel_requested: 'Cancellation under review', cancelled: 'Cancelled', completed: 'Complete'
};
const money = (amountMinor: number, currency: string) => `${currency} ${(amountMinor / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function RepairWorkspace({ projects }: { projects: ClientProject[] }) {
  const [items, setItems] = useState<RepairRequestRecord[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ hostType: 'sitemendr', siteId: '', siteUrl: '', title: '', description: '', steps: '', affectedPages: '', urgency: 'normal', evidence: '' });
  const selected = items.find(item => item.id === selectedId) || items[0];
  const managedSites = useMemo(() => projects.filter(project => project.recordType === 'project'), [projects]);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getClientRepairRequests();
      if (!response.success) throw new Error(response.message || 'Could not load repair requests.');
      setItems(response.data || []);
      setSelectedId(current => response.data?.some(item => item.id === current) ? current : response.data?.[0]?.id || '');
      setError('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load repair requests.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const response = await apiClient.createRepairRequest({ ...form, evidence: form.evidence.split('\n').map(value => value.trim()).filter(Boolean) });
      if (!response.success || !response.data) throw new Error(response.message || 'Could not submit your request.');
      setItems(current => [response.data!, ...current]); setSelectedId(response.data.id); setShowForm(false);
      setForm({ hostType: 'sitemendr', siteId: '', siteUrl: '', title: '', description: '', steps: '', affectedPages: '', urgency: 'normal', evidence: '' });
      setNotice('Repair request received. We’ll review it and update this conversation.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not submit your request.'); }
    finally { setSaving(false); }
  };

  const respondProposal = async (action: 'accept' | 'decline') => {
    if (!selected) return;
    setSaving(true); setError('');
    try { const response = await apiClient.respondToRepairProposal(selected.id, action, action === 'accept'); if (!response.success) throw new Error(response.message || 'Could not record your response.'); await refresh(); setNotice(action === 'accept' ? 'Proposal accepted. Pay the open invoice to start the repair.' : 'Proposal declined. This request is closed.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not record your response.'); }
    finally { setSaving(false); }
  };

  const respondReview = async (action: 'accept' | 'changes') => {
    if (!selected) return;
    const message = action === 'changes' ? window.prompt('Describe the in-scope change you need:') : '';
    if (action === 'changes' && !message?.trim()) return;
    setSaving(true); setError('');
    try { const response = await apiClient.respondToRepairReview(selected.id, action, message || ''); if (!response.success) throw new Error(response.message || 'Could not record your review.'); await refresh(); setNotice(action === 'accept' ? 'Review accepted. Any remaining balance is shown below.' : 'Your in-scope change request was sent.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not record your review.'); }
    finally { setSaving(false); }
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !message.trim()) return;
    setSaving(true); setError('');
    try { const response = await apiClient.sendClientProjectConversation(selected.id, { message: message.trim() }); if (!response.success) throw new Error(response.message || 'Could not send your message.'); setMessage(''); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not send your message.'); }
    finally { setSaving(false); }
  };

  const requestCancellation = async () => {
    if (!selected) return;
    const reason = window.prompt('Why do you want to cancel this repair? Sitemendr will calculate any completed diagnosis or approved work and show the refund or balance before closing it.');
    if (!reason?.trim()) return;
    setSaving(true); setError('');
    try { const response = await apiClient.requestRepairCancellation(selected.id, reason.trim()); if (!response.success) throw new Error(response.message || 'Could not request cancellation.'); await refresh(); setNotice('Cancellation sent to Sitemendr for settlement review. The request remains open until the settlement is confirmed.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not request cancellation.'); }
    finally { setSaving(false); }
  };

  const payInvoice = async (invoice: NonNullable<RepairRequestRecord['billingInvoices']>[number]) => {
    if (!selected) return;
    setSaving(true); setError('');
    try {
      const quote = selected.quoteVersions?.find(item => item.status === 'accepted');
      const response = await apiClient.initializePayment({ serviceType: 'repair_payment', amount: invoice.amountMinor / 100, currency: invoice.currency, description: invoice.description, metadata: { projectRequestId: selected.id, invoiceId: invoice.id, quoteVersionId: quote?.id, currency: invoice.currency, termsAccepted: !['repair_diagnosis', 'repair_cancellation_closeout'].includes(invoice.stage) } });
      const url = response.data?.paystack?.authorization_url;
      if (!response.success || !url) throw new Error(response.message || 'Could not start secure checkout.');
      window.location.assign(url);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not start secure checkout.'); setSaving(false); }
  };

  const field = 'mt-1.5 min-h-11 w-full border border-white/10 bg-[#10141a] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-sky-400/60';
  return <section className="mx-auto max-w-7xl space-y-6 text-white">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-sky-300">Site care</p><h1 className="mt-2 text-2xl font-semibold">Repair</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-white/55">Report an issue and follow diagnosis, approved scope, payment, and delivery in one request.</p></div>
      <button type="button" onClick={() => setShowForm(value => !value)} className="inline-flex min-h-11 items-center gap-2 bg-sky-400 px-4 text-sm font-semibold text-slate-950 hover:bg-sky-300"><Plus className="h-4 w-4" /> New repair request</button>
    </header>
    {notice && <div className="border border-emerald-400/20 bg-emerald-400/[.06] px-4 py-3 text-sm text-emerald-100">{notice}</div>}
    {error && <div role="alert" className="border border-rose-400/20 bg-rose-400/[.06] px-4 py-3 text-sm text-rose-100">{error}</div>}
    {showForm && <form onSubmit={submit} className="grid gap-4 border border-white/10 bg-white/[.025] p-4 sm:p-6 lg:grid-cols-2">
      <div className="lg:col-span-2"><h2 className="text-lg font-semibold">Tell us what needs fixing</h2><p className="mt-1 text-sm text-white/48">Never put passwords or private access keys in this form. We’ll arrange secure access only if diagnosis shows it is needed.</p></div>
      <label className="text-xs font-medium text-white/65">Website ownership<select className={field} value={form.hostType} onChange={event => setForm({ ...form, hostType: event.target.value, siteId: '' })}><option value="sitemendr">Site managed by Sitemendr</option><option value="external">Externally hosted site</option></select></label>
      {form.hostType === 'sitemendr' ? <label className="text-xs font-medium text-white/65">Site<select className={field} required value={form.siteId} onChange={event => setForm({ ...form, siteId: event.target.value })}><option value="">Choose a managed site</option>{managedSites.map(site => <option key={site.id} value={site.subscriptionId || site.id}>{site.name}</option>)}</select></label> : <label className="text-xs font-medium text-white/65">Public website URL<input className={field} type="url" required placeholder="https://example.com" value={form.siteUrl} onChange={event => setForm({ ...form, siteUrl: event.target.value })} /></label>}
      <label className="text-xs font-medium text-white/65">Issue title<input className={field} maxLength={180} required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Checkout button stops responding" /></label>
      <label className="text-xs font-medium text-white/65">Requested urgency<select className={field} value={form.urgency} onChange={event => setForm({ ...form, urgency: event.target.value })}><option value="normal">Normal</option><option value="urgent">Urgent — team will confirm timing</option></select></label>
      <label className="text-xs font-medium text-white/65 lg:col-span-2">What is happening?<textarea className={`${field} min-h-24`} required maxLength={5000} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
      <label className="text-xs font-medium text-white/65">Steps to reproduce<textarea className={`${field} min-h-20`} value={form.steps} onChange={event => setForm({ ...form, steps: event.target.value })} /></label>
      <label className="text-xs font-medium text-white/65">Affected pages or areas<textarea className={`${field} min-h-20`} value={form.affectedPages} onChange={event => setForm({ ...form, affectedPages: event.target.value })} /></label>
      <label className="text-xs font-medium text-white/65 lg:col-span-2">Evidence links (one public URL per line, up to five)<textarea className={`${field} min-h-16`} value={form.evidence} onChange={event => setForm({ ...form, evidence: event.target.value })} placeholder="https://..." /></label>
      <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-2"><p className="text-xs text-white/45">Sitemendr site diagnosis is included. External site diagnosis is priced after initial review and needs your approval before investigation.</p><button disabled={saving} className="inline-flex min-h-11 items-center gap-2 bg-sky-400 px-5 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />} Submit request</button></div>
    </form>}
    {loading ? <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-white/50"><LoaderCircle className="h-5 w-5 animate-spin" /> Loading your repair requests</div> : !items.length ? <div className="grid min-h-56 place-items-center border border-dashed border-white/12 p-6 text-center"><div><Wrench className="mx-auto h-6 w-6 text-sky-300"/><h2 className="mt-3 font-semibold">No repair requests yet</h2><p className="mt-1 text-sm text-white/48">When you report a problem, its updates and decisions will appear here.</p></div></div> : <div className="grid gap-4 lg:grid-cols-[minmax(250px,.75fr)_minmax(0,1.5fr)]">
      <nav className="space-y-2" aria-label="Repair requests">{items.map(item => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full border p-4 text-left transition ${selected?.id === item.id ? 'border-sky-300/35 bg-sky-300/[.06]' : 'border-white/10 bg-white/[.02] hover:bg-white/[.05]'}`}><span className="block truncate text-sm font-semibold">{item.title}</span><span className="mt-2 block text-xs text-white/45">{statusLabel[item.status] || item.status.replaceAll('_', ' ')}</span><span className="mt-3 block text-[11px] text-white/30">Updated {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</span></button>)}</nav>
      {selected && <article className="min-w-0 space-y-5 border border-white/10 bg-white/[.02] p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-white/40">Repair request</p><h2 className="mt-1 text-xl font-semibold">{selected.title}</h2><p className="mt-2 text-sm text-white/50">{selected.repairContext?.hostType === 'external' ? selected.repairContext?.siteUrl : selected.subscription?.customName || selected.subscription?.siteName || selected.subscription?.domain || 'Sitemendr managed site'} · {selected.priority === 'urgent' ? 'Urgency requested' : 'Normal priority'}</p></div><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 border border-sky-300/20 px-3 py-2 text-xs font-medium text-sky-100"><Clock3 className="h-3.5 w-3.5" />{statusLabel[selected.status] || selected.status}</span>{!['cancel_requested', 'cancelled', 'declined', 'completed'].includes(selected.status) && <button disabled={saving} onClick={() => void requestCancellation()} className="min-h-9 border border-rose-300/20 px-3 text-xs font-medium text-rose-200 disabled:opacity-40">Request cancellation</button>}</div></div>
        {selected.status === 'awaiting_diagnosis_payment' && <div className="flex gap-3 border border-amber-300/20 bg-amber-300/[.05] p-4 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200"/><div><p className="font-semibold text-amber-100">External site diagnosis needs approval</p><p className="mt-1 text-white/55">Investigation begins after the diagnosis invoice is paid. This is separate from approving the repair work.</p></div></div>}
        {(() => { const event = selected.conversationMessages?.slice().reverse().find(message => message.eventData?.type === 'repair_cancel_confirmed'); const settlement = event?.eventData?.settlement; return settlement ? <div className="space-y-2 border border-amber-300/20 bg-amber-300/[.04] p-4"><h3 className="text-sm font-semibold text-amber-100">Cancellation settlement</h3><p className="text-xs leading-5 text-white/60">{settlement.rule}</p><p className="text-sm text-white/75">Diagnosis {settlement.currency} {settlement.diagnosisCharge} · Completed work {settlement.currency} {settlement.completedWorkCharge}</p>{settlement.chargeReason && <p className="text-xs text-white/48">Work record: {settlement.chargeReason}</p>}<p className="text-sm font-semibold text-white">Charged {settlement.currency} {settlement.chargeTotal} · Paid {settlement.currency} {settlement.paidTotal}</p>{Number(settlement.refundDue) > 0 && <p className="text-sm font-semibold text-emerald-200">Refund remaining {settlement.currency} {Math.max(Number(settlement.refundDue) - Number(settlement.refundedTotal || 0), 0)} · {settlement.refundStatus}</p>}{settlement.lastRefundReference && <p className="break-all text-xs text-white/45">Paystack refund reference: {settlement.lastRefundReference}</p>}{Number(settlement.balanceDue) > 0 && <p className="text-sm font-semibold text-amber-200">Balance due {settlement.currency} {settlement.balanceDue}</p>}</div> : null; })()}
        {selected.status === 'proposal_ready' && (() => { const quote = selected.quoteVersions?.find(item => item.status === 'sent') || selected.quoteVersions?.[0]; const snap = quote?.snapshot || {}; const changeOrder = selected.repairContext?.proposalKind === 'change_order'; return <div className="space-y-3 border border-sky-300/20 bg-sky-300/[.04] p-4"><h3 className="font-semibold">{changeOrder ? 'Review a change to the approved scope' : 'Review proposed work'}</h3>{changeOrder && <p className="text-xs leading-5 text-white/50">Current work is paused while this extra scope and its price are reviewed. Declining it keeps the original approved repair in progress.</p>}<p className="whitespace-pre-wrap text-sm leading-6 text-white/70">{snap.scope}</p><p className="text-sm text-white/55">{snap.timeline} · {snap.paymentSchedule === 'deposit_balance' ? `Deposit ${snap.currency} ${snap.depositAmount} of ${snap.totalAgreedAmount}` : `Payment ${snap.currency} ${snap.totalAgreedAmount}`}</p><p className="text-xs leading-5 text-white/42">{snap.cancellationTerms}</p><label className="flex items-start gap-2 text-xs text-white/60"><input type="checkbox" id={`repair-terms-${selected.id}`} className="mt-0.5 accent-sky-300"/><span>I agree to the scope, timeline, payment schedule, and cancellation/refund terms above.</span></label><div className="flex flex-wrap gap-2"><button disabled={saving} onClick={() => { const checkbox = document.getElementById(`repair-terms-${selected.id}`) as HTMLInputElement; if (!checkbox?.checked) { setError('Accept the proposal terms before continuing.'); return; } void respondProposal('accept'); }} className="min-h-10 bg-sky-300 px-4 text-sm font-semibold text-slate-950 disabled:opacity-50">Accept proposal</button><button disabled={saving} onClick={() => void respondProposal('decline')} className="min-h-10 border border-white/15 px-4 text-sm text-white/70">Decline</button></div></div>; })()}
        {selected.status === 'ready_for_review' && <div className="space-y-3 border border-emerald-300/20 bg-emerald-300/[.04] p-4"><h3 className="font-semibold">Delivery review</h3>{selected.repairContext?.reviewOverdue && <p className="text-xs text-amber-200">Review is overdue. The request remains open and has not been accepted automatically.</p>}<p className="whitespace-pre-wrap text-sm leading-6 text-white/70">{selected.repairContext?.delivery?.summary}</p><p className="text-sm text-white/55">Checks: {selected.repairContext?.delivery?.checks}</p>{selected.repairContext?.delivery?.limitations && <p className="text-sm text-white/45">Limitations: {selected.repairContext.delivery.limitations}</p>}<p className="text-xs text-white/40">Please review within seven days. Request one extension if you need more time; no response will not count as acceptance.</p><div className="flex flex-wrap gap-2"><button disabled={saving} onClick={() => void respondReview('accept')} className="inline-flex min-h-10 items-center gap-2 bg-emerald-300 px-4 text-sm font-semibold text-slate-950"><Check className="h-4 w-4"/> Accept delivery</button><button disabled={saving} onClick={() => void respondReview('changes')} className="min-h-10 border border-white/15 px-4 text-sm text-white/70">Request in-scope change</button><button disabled={saving || Number(selected.repairContext?.reviewExtensionCount || 0) >= 1} onClick={async () => { setSaving(true); try { const response = await apiClient.respondToRepairReview(selected.id, 'extend'); if (!response.success) throw new Error(response.message || 'Could not extend the review period.'); await refresh(); setNotice('Your review period has been extended by seven days.'); } catch (err) { setError(err instanceof Error ? err.message : 'Could not extend the review period.'); } finally { setSaving(false); } }} className="min-h-10 border border-white/15 px-4 text-sm text-white/70 disabled:opacity-40">Extend review by 7 days</button></div></div>}
        {selected.billingInvoices?.length ? <div className="space-y-2"><h3 className="text-sm font-semibold">Invoices</h3>{selected.billingInvoices.map(invoice => <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 border border-white/10 px-4 py-3"><div><p className="text-sm font-medium">{invoice.description}</p><p className="mt-1 text-xs text-white/42">{money(invoice.amountMinor, invoice.currency)} · {invoice.status}</p></div>{['open', 'processing'].includes(invoice.status) && <button disabled={saving || (invoice.stage === 'repair_diagnosis' ? selected.status !== 'awaiting_diagnosis_payment' : invoice.stage === 'repair_cancellation_closeout' ? selected.status !== 'cancelled' : !['awaiting_payment', 'awaiting_final_payment'].includes(selected.status))} onClick={() => void payInvoice(invoice)} className="inline-flex min-h-9 items-center gap-2 bg-white px-3 text-xs font-semibold text-slate-950 disabled:opacity-40">Pay securely <ExternalLink className="h-3.5 w-3.5"/></button>}</div>)}</div> : null}
        {selected.conversationMessages?.length ? <div><h3 className="mb-3 text-sm font-semibold">Updates</h3><div className="space-y-2">{selected.conversationMessages.map(message => <div key={message.id} className={`max-w-[92%] border px-3 py-2.5 ${message.senderRole === 'client' ? 'ml-auto border-sky-300/15 bg-sky-300/[.06]' : 'border-white/10 bg-white/[.025]'}`}><p className="whitespace-pre-wrap text-sm leading-5 text-white/72">{message.message}</p><p className="mt-1 text-[10px] text-white/35">{message.senderRole === 'client' ? 'You' : message.senderRole === 'admin' ? 'Sitemendr' : 'Update'} · {new Date(message.createdAt).toLocaleString()}</p></div>)}</div></div> : null}
        <form onSubmit={sendMessage} className="border-t border-white/10 pt-4"><label htmlFor="repair-message" className="text-sm font-semibold">Conversation</label><p className="mt-1 text-xs text-white/40">Keep updates and questions attached to this repair.</p><div className="mt-3 flex gap-2"><input id="repair-message" value={message} onChange={event => setMessage(event.target.value)} className="min-h-11 min-w-0 flex-1 border border-white/10 bg-[#10141a] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-sky-400/50" placeholder="Write an update or question…" maxLength={4000}/><button disabled={saving || !message.trim()} className="min-h-11 shrink-0 bg-sky-300 px-4 text-sm font-semibold text-slate-950 disabled:opacity-40">Send</button></div></form>
      </article>}
    </div>}
  </section>;
}
