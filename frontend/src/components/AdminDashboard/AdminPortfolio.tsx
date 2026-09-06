// components/admin-dashboard/AdminPortfolio.tsx
//
// Self-contained, like BlogEditor — manages its own fetching and state
// rather than going through useAdminDashboard(), since projects aren't
// needed anywhere else in the admin.

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Pencil, Eye, EyeOff, ArrowLeft, GripVertical, Upload } from 'lucide-react';
import { apiClient } from '@/lib/api';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

type ProjectCategory = 'BUSINESS' | 'WORKSPACE' | 'COMMERCE' | 'REPAIR';

type ProjectImageDraft = {
  url: string;
  description: string;
  displayOrder: number;
};

type Project = {
  id: string;
  title: string;
  slug: string;
  category: ProjectCategory;
  summary: string;
  problem: string;
  decision: string;
  result: string;
  liveUrl: string | null;
  featured: boolean;
  published: boolean;
  images: ProjectImageDraft[];
};

const EMPTY_FORM = {
  title: '',
  slug: '',
  category: 'BUSINESS' as ProjectCategory,
  summary: '',
  problem: '',
  decision: '',
  result: '',
  liveUrl: '',
  featured: false,
  published: false,
  images: [] as ProjectImageDraft[],
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminPortfolio() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    const res = await apiClient.get('/admin/portfolio/projects') as { success: boolean; data: Project[] };
    if (res.success) setProjects(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setView('form');
  };

  const openEdit = (project: Project) => {
    setForm({
      title: project.title,
      slug: project.slug,
      category: project.category,
      summary: project.summary,
      problem: project.problem,
      decision: project.decision,
      result: project.result,
      liveUrl: project.liveUrl || '',
      featured: project.featured,
      published: project.published,
      images: project.images,
    });
    setEditingId(project.id);
    setView('form');
  };

  const handleTogglePublish = async (project: Project) => {
    await apiClient.post(`/admin/portfolio/projects/${project.id}/publish`, {
      published: !project.published,
    });
    loadProjects();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await apiClient.delete(`/admin/portfolio/projects/${id}`);
    loadProjects();
  };

  const handleImageUpload = async (file: File, index: number) => {
    setUploadingIndex(index);
    const formData = new FormData();
    formData.append('file', file);
    // apiClient.uploadMedia already attaches the right auth token and hits
    // /media/upload — same upload your Asset Repository screen uses.
    const res = await apiClient.uploadMedia(formData) as { success: boolean; data: { url: string } };
    setUploadingIndex(null);
    if (res.success) {
      const fullUrl = `${API_URL}${res.data.url}`;
      setForm((f) => {
        const images = [...f.images];
        images[index] = { ...images[index], url: fullUrl };
        return { ...f, images };
      });
    }
  };

  const addImageSlot = () => {
    setForm((f) => ({
      ...f,
      images: [...f.images, { url: '', description: '', displayOrder: f.images.length }],
    }));
  };

  const removeImageSlot = (index: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const updateImageDescription = (index: number, description: string) => {
    setForm((f) => {
      const images = [...f.images];
      images[index] = { ...images[index], description };
      return { ...f, images };
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setForm((f) => {
      const images = [...f.images];
      const target = index + direction;
      if (target < 0 || target >= images.length) return f;
      [images[index], images[target]] = [images[target], images[index]];
      return { ...f, images: images.map((img, i) => ({ ...img, displayOrder: i })) };
    });
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      alert('Title and slug are both required — the slug is what the project\'s URL is built from.');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      liveUrl: form.liveUrl || null,
      images: form.images.filter((img) => img.url), // drop empty slots
    };
    const res = editingId
      ? await apiClient.put(`/admin/portfolio/projects/${editingId}`, payload) as { success: boolean; message?: string }
      : await apiClient.post('/admin/portfolio/projects', payload) as { success: boolean; message?: string };
    setSaving(false);
    if (res.success) {
      setView('list');
      loadProjects();
    } else {
      alert(res.message || 'Failed to save project');
    }
  };

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-ai-blue transition-colors';
  const labelClass = 'block text-[9px] font-black uppercase tracking-[0.2em] text-white/42 mb-2';

  // ------------------------------------------------------------------
  // FORM VIEW
  // ------------------------------------------------------------------
  if (view === 'form') {
    return (
      <div className="animate-fade-in space-y-6">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/52 hover:text-white transition">
          <ArrowLeft size={14} />
          Back to projects
        </button>

        <h2 className="text-xl font-black tracking-tighter uppercase flex items-center gap-3">
          <span className="w-1.5 h-6 bg-ai-blue rounded-full"></span>
          {editingId ? 'Edit Project' : 'New Project'}
        </h2>

        <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Title</label>
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title,
                    // Only auto-fill slug if it still matches what the title would
                    // generate — so a manually customized slug is never overwritten.
                    slug: f.slug === slugify(f.title) || f.slug === '' ? slugify(title) : f.slug,
                  }));
                }}
              />
            </div>
            <div>
              <label className={labelClass}>Slug</label>
              <input className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="business-website-example" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Category</label>
              <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ProjectCategory })}>
                <option value="BUSINESS">Business Website</option>
                <option value="WORKSPACE">Custom Workspace</option>
                <option value="COMMERCE">Commerce Setup</option>
                <option value="REPAIR">Repair & Recovery</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Live URL (optional)</label>
              <input className={inputClass} value={form.liveUrl} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} placeholder="https://" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Summary (shown on the grid card)</label>
            <input className={inputClass} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </div>

          <div className="grid gap-5">
            <div>
              <label className={labelClass}>Problem</label>
              <textarea className={inputClass} rows={3} value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Decision</label>
              <textarea className={inputClass} rows={3} value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Result</label>
              <textarea className={inputClass} rows={3} value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} />
            </div>
          </div>

          {/* Image-by-image narrative */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={labelClass + ' mb-0'}>Images & descriptions</label>
              <button onClick={addImageSlot} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-ai-blue hover:text-white transition">
                <Plus size={12} />
                Add image
              </button>
            </div>
            <div className="space-y-4">
              {form.images.map((img, i) => (
                <div key={i} className="flex gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                  <div className="flex flex-col items-center gap-1 pt-1 text-white/30">
                    <button onClick={() => moveImage(i, -1)} disabled={i === 0} className="disabled:opacity-20 hover:text-white transition"><GripVertical size={14} /></button>
                  </div>
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-white/5">
                    {img.url ? (
                      <Image src={img.url} alt="" fill unoptimized={process.env.NODE_ENV === 'development'} className="object-cover" />
                    ) : (
                      <label className="flex h-full w-full cursor-pointer items-center justify-center text-white/30 hover:text-white/60 transition">
                        {uploadingIndex === i ? '...' : <Upload size={18} />}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, i); }} />
                      </label>
                    )}
                  </div>
                  <textarea
                    className={inputClass + ' flex-1'}
                    rows={3}
                    placeholder="What's happening in this shot..."
                    value={img.description}
                    onChange={(e) => updateImageDescription(i, e.target.value)}
                  />
                  <button onClick={() => removeImageSlot(i)} className="self-start text-red-400/60 hover:text-red-400 transition"><Trash2 size={16} /></button>
                </div>
              ))}
              {form.images.length === 0 && (
                <p className="text-[11px] text-white/30 py-4 text-center">No images yet — add one above.</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              Published (visible to clients)
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="bg-ai-blue hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
              {saving ? 'Saving...' : 'Save project'}
            </button>
            <button onClick={() => setView('list')} className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // LIST VIEW
  // ------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
        <div className="flex flex-col">
          <h2 className="text-xl font-black tracking-tighter uppercase flex items-center gap-3">
            <span className="w-1.5 h-6 bg-ai-blue rounded-full"></span>
            Portfolio Projects
          </h2>
          <span className="text-[8px] font-black text-medium-gray uppercase tracking-[0.2em] mt-1">TOTAL: {projects.length}</span>
        </div>
        <button onClick={openNew} className="bg-ai-blue hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2">
          <Plus size={14} />
          New Project
        </button>
      </div>

      {loading ? (
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Loading...</p>
      ) : projects.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-medium-gray border border-dashed border-white/5 rounded-3xl">
          <Plus size={48} className="mb-4 opacity-20" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">No projects yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden group">
              <div className="relative aspect-video bg-white/5">
                {project.images[0]?.url && (
                  <Image src={project.images[0].url} alt="" fill unoptimized={process.env.NODE_ENV === 'development'} className="object-cover" />
                )}
                <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${project.published ? 'bg-green-500 text-black' : 'bg-white/20 text-white'}`}>
                  {project.published ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="p-4">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/40">{project.category}</p>
                <h3 className="mt-1 text-sm font-bold tracking-tight truncate">{project.title}</h3>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEdit(project)} className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1.5">
                    <Pencil size={11} /> Edit
                  </button>
                  <button onClick={() => handleTogglePublish(project)} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg">
                    {project.published ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button onClick={() => handleDelete(project.id)} className="bg-red-500/20 hover:bg-red-500/40 text-red-500 p-2 rounded-lg">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}