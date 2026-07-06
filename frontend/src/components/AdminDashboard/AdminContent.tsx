// components/admin-dashboard/AdminContent.tsx
//
// Covers "media" and "blog". Blog is mostly just BlogEditor (already
// its own component) with a small header, so it's a one-liner here.

'use client';

import dynamic from 'next/dynamic';
import { Plus, FileText, Trash2 } from 'lucide-react';
import Image from 'next/image';
import type { MediaAsset } from './types';

const BlogEditor = dynamic(() => import('../BlogEditor'), { ssr: false });

interface AdminContentProps {
  view: 'media' | 'blog';
  media: MediaAsset[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  onUploadMedia: (file: File) => void;
  onDeleteMedia: (id: string) => void;
}

export default function AdminContent({ view, media, searchTerm, setSearchTerm, onUploadMedia, onDeleteMedia }: AdminContentProps) {
  if (view === 'blog') {
    return (
      <div className="animate-fade-in h-full">
        <div className="mb-6 flex flex-col">
          <span className="text-[8px] font-black text-ai-blue uppercase tracking-[0.3em] mb-1">Content_Nexus</span>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-3 uppercase"><span className="w-1.5 h-8 bg-ai-blue rounded-full"></span>Blog & News Editor</h2>
        </div>
        <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 h-[calc(100vh-250px)] overflow-y-auto">
          <BlogEditor />
        </div>
      </div>
    );
  }

  const filtered = media.filter(item => item.filename.toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
        <div className="flex flex-col">
          <h2 className="text-xl font-black tracking-tighter uppercase flex items-center gap-3"><span className="w-1.5 h-6 bg-green-500 rounded-full"></span>Asset Repository</h2>
          <span className="text-[8px] font-black text-medium-gray uppercase tracking-[0.2em] mt-1">TOTAL_ASSETS: {media.length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input type="text" placeholder="Search assets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors flex-1 md:w-64" />
          <button onClick={() => document.getElementById('media-upload-input')?.click()} className="bg-green-500 hover:bg-green-600 text-black px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2"><Plus size={14} />UPLOAD_ASSET</button>
        </div>
        <input id="media-upload-input" type="file" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onUploadMedia(file); }} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map((item, i) => (
          <div key={item.id || i} className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden group relative aspect-square">
            {item.mimetype.startsWith('image/') ? (
              <Image src={item.url} alt={item.filename} fill sizes="(min-width: 1024px) 16vw, (min-width: 768px) 25vw, 50vw" className="object-cover opacity-60 transition-opacity group-hover:opacity-100" />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-40"><FileText size={48} /></div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
              <p className="text-[8px] font-black uppercase truncate mb-2">{item.filename}</p>
              <div className="flex gap-2">
                <button onClick={() => {
                  const fullUrl = window.location.origin.includes('localhost') ? `http://localhost:5000${item.url}` : `${process.env.NEXT_PUBLIC_API_URL || ''}${item.url}`;
                  navigator.clipboard.writeText(fullUrl);
                  alert('URL copied to clipboard');
                }} className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-[7px] font-black uppercase">COPY_URL</button>
                <button onClick={() => onDeleteMedia(item.id)} className="bg-red-500/20 hover:bg-red-500/40 text-red-500 p-2 rounded-lg"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
        {media.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-medium-gray border border-dashed border-white/5 rounded-3xl">
            <Plus size={48} className="mb-4 opacity-20" /><p className="text-[10px] font-black uppercase tracking-[0.3em]">No assets uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
