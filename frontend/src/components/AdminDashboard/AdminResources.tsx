'use client';

import { useEffect, useState } from 'react';
import { BookOpen, ExternalLink, LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import { apiClient } from '@/lib/api';

type Resource = { id: string; title: string; description: string; type: string; url?: string | null };
type ResourceForm = { title: string; description: string; type: string; url: string };
const emptyForm: ResourceForm = { title: '', description: '', type: 'guide', url: '' };

export default function AdminResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ResourceForm>(emptyForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.getAdminResources();
      if (!response.success) throw new Error(response.message || 'Could not load resources.');
      setResources(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load resources.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const reset = () => { setEditingId(null); setForm(emptyForm); setError(''); };
  const edit = (resource: Resource) => {
    setEditingId(resource.id);
    setForm({ title: resource.title, description: resource.description || '', type: resource.type || 'guide', url: resource.url || '' });
    setNotice(''); setError('');
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    try {
      const response = editingId
        ? await apiClient.updateAdminResource(editingId, form)
        : await apiClient.createAdminResource(form);
      if (!response.success) throw new Error(response.message || 'Could not save resource.');
      setNotice(editingId ? 'Resource updated.' : 'Resource added to the client library.');
      reset(); await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save resource.');
    } finally { setSaving(false); }
  };

  const remove = async (resource: Resource) => {
    if (!window.confirm(`Remove “${resource.title}” from the client resource library?`)) return;
    setError(''); setNotice('');
    try {
      const response = await apiClient.deleteAdminResource(resource.id);
      if (!response.success) throw new Error(response.message || 'Could not remove resource.');
      if (editingId === resource.id) reset();
      setResources(current => current.filter(item => item.id !== resource.id));
      setNotice('Resource removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove resource.');
    }
  };

  return <section className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-tech-purple">Support library</p><h2 className="mt-2 text-2xl font-semibold text-white">Client resources</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Maintain the guides and links clients see in their workspace. Changes appear in the resource library.</p></div>
      <div className="rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm text-white/65">{resources.length} {resources.length === 1 ? 'resource' : 'resources'}</div>
    </header>

    {(error || notice) && <div role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-400/25 bg-red-400/10 text-red-200' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'}`}>{error || notice}</div>}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)]">
      <div className="space-y-3">
        {loading ? <div className="flex items-center gap-3 rounded-2xl border border-white/10 p-8 text-sm text-white/50"><LoaderCircle className="h-4 w-4 animate-spin" />Loading resources…</div>
          : resources.length ? resources.map(resource => <article key={resource.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-5">
            <div className="flex min-w-0 items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tech-purple/10 text-tech-purple"><BookOpen className="h-5 w-5" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{resource.title}</h3><span className="rounded-full bg-white/[.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/50">{resource.type}</span></div><p className="mt-1 text-sm leading-5 text-white/45">{resource.description || 'No description provided.'}</p>{resource.url && <p className="mt-2 flex items-center gap-1.5 break-all text-xs text-ai-blue"><ExternalLink className="h-3 w-3 shrink-0" />{resource.url}</p>}</div></div>
            <div className="flex shrink-0 gap-2"><button onClick={() => edit(resource)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/70 hover:bg-white/[.06]" aria-label={`Edit ${resource.title}`}><Pencil className="h-3.5 w-3.5" />Edit</button><button onClick={() => void remove(resource)} className="grid h-10 w-10 place-items-center rounded-lg border border-red-400/15 text-red-300/70 hover:bg-red-400/10 hover:text-red-200" aria-label={`Remove ${resource.title}`}><Trash2 className="h-4 w-4" /></button></div>
          </article>) : <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/45">No resources yet. Add the first guide using the form.</div>}
      </div>

      <form onSubmit={save} className="h-fit space-y-4 rounded-2xl border border-white/10 bg-white/[.025] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-white">{editingId ? 'Edit resource' : 'Add a resource'}</h3>{editingId ? <button type="button" onClick={reset} className="grid h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/10" aria-label="Cancel edit"><X className="h-4 w-4" /></button> : <Plus className="h-4 w-4 text-tech-purple" />}</div>
        <label className="block space-y-1.5 text-xs font-medium text-white/55">Title<input required maxLength={140} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="min-h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-tech-purple/60" placeholder="Getting started with your workspace" /></label>
        <label className="block space-y-1.5 text-xs font-medium text-white/55">Description<textarea maxLength={1000} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-tech-purple/60" placeholder="A short explanation of what this guide covers." /></label>
        <label className="block space-y-1.5 text-xs font-medium text-white/55">Type<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="min-h-11 w-full rounded-lg border border-white/10 bg-[#101218] px-3 text-sm text-white outline-none focus:border-tech-purple/60"><option value="guide">Guide</option><option value="documentation">Documentation</option><option value="video">Video</option><option value="tool">Tool</option><option value="other">Other</option></select></label>
        <label className="block space-y-1.5 text-xs font-medium text-white/55">Destination link<input type="text" maxLength={2048} value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className="min-h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-tech-purple/60" placeholder="/resources/getting-started or https://…" /><span className="block text-[11px] leading-5 text-white/35">Leave blank to show the resource as being prepared.</span></label>
        <button disabled={saving} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-tech-purple px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{editingId ? 'Save changes' : 'Add to library'}</button>
      </form>
    </div>
  </section>;
}
