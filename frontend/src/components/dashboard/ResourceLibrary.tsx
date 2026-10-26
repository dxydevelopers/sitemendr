'use client';

import React, { useState } from 'react';
import { BookOpen, FileText, Video, ExternalLink, Shield, Zap, Search as SearchIcon, ArrowRight } from 'lucide-react';

interface ResourceItem {
  id: string;
  title: string;
  type: string;
  url?: string | null;
  description?: string;
  category?: string;
}

interface ResourceLibraryProps {
  resources: ResourceItem[];
  onSupportRequest?: () => void;
}

const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ resources, onSupportRequest }) => {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = resources.filter(res => {
  const type = res.type.toUpperCase();
  const filterType = type === 'TOOL' ? 'OTHER' : type;
  const matchesFilter = activeFilter === 'ALL' || filterType === activeFilter;
  const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
  res.description?.toLowerCase().includes(searchQuery.toLowerCase());
  return matchesFilter && matchesSearch;
  });

  return (
  <div className="space-y-6 animate-fade-in pb-8 sm:space-y-8 sm:pb-12">
  <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
  <p className="text-sm text-white/45">Documentation and guides</p>
   
  <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row lg:w-auto">
  <div className="relative flex-1 sm:w-64">
  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medium-gray" />
  <input 
  type="text"
  placeholder="Filter resources..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-[10px] font-semibold focus:border-ai-blue outline-none transition-all"
  />
  </div>
  <div className="flex max-w-full shrink-0 overflow-x-auto bg-white/5 p-1 rounded-xl border border-white/5">
  {['ALL', 'DOCUMENTATION', 'GUIDE', 'VIDEO', 'OTHER'].map((tag) => (
  <button 
  key={tag} 
  onClick={() => setActiveFilter(tag)}
  className={`shrink-0 px-3 py-1.5 rounded-lg text-[8px] font-semibold transition-all ${
  activeFilter === tag ? 'bg-ai-blue text-white' : 'text-white/40 hover:text-white'
  }`}
  >
  {tag === 'DOCUMENTATION' ? 'DOCS' : tag}
  </button>
  ))}
  </div>
  </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {filteredResources.length > 0 ? (
  filteredResources.map((resource) => (
  (() => {
  const display = getResourcePresentation(resource);
  return (
  <div key={resource.id} className="bg-white/[0.01] border border-white/5 p-5 sm:p-7 rounded-2xl hover:bg-white/[0.03] hover:border-white/20 transition-all group relative overflow-hidden flex flex-col h-full">
  <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-10 transition-opacity">
  {resource.type.toLowerCase().includes('video') ? (
  <Video className="w-20 h-20" />
  ) : (
  <FileText className="w-20 h-20" />
  )}
  </div>
   
  <div className={`w-12 h-12 rounded-2xl mb-8 flex items-center justify-center ${
  resource.type.toLowerCase().includes('video') ? 'bg-orange-500/10 text-orange-500' : 'bg-ai-blue/10 text-ai-blue'
  }`}>
  {resource.type.toLowerCase().includes('video') ? <Video className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
  </div>

  <div className="space-y-2 mb-6">
  <span className="text-[8px] font-semibold text-ai-blue block">{display.type}</span>
  <h3 className="text-sm font-semibold text-white leading-tight">{display.title}</h3>
  <p className="text-[11px] text-white/30 font-medium line-clamp-2 leading-relaxed">
  {display.description || 'Access documentation, guides, and files connected to your Sitemendr workspace.'}
  </p>
  </div>

  <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
  {(() => {
    const href = getResourceHref(resource.url, resource.title);
    return href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined} className="flex items-center gap-2 text-[10px] font-semibold text-ai-blue hover:text-white transition-colors">
      Open resource <ExternalLink className="w-3.5 h-3.5" />
    </a> : <span className="text-[10px] font-medium text-white/35">Content is being prepared</span>;
  })()}
  </div>
  </div>
  );
  })()
  ))
  ) : (
  <div className="col-span-full p-10 sm:p-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
  <Zap className="w-16 h-16 text-white/5 mx-auto mb-6 animate-pulse" />
  <p className="text-[10px] font-semibold text-white/20 ">No resources found</p>
  </div>
  )}
  </div>

  <div className="bg-gradient-to-br from-ai-blue/10 via-transparent to-tech-purple/10 border border-white/10 p-6 sm:p-8 lg:p-10 rounded-2xl relative overflow-hidden group">
  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]"></div>
  <div className="relative z-10 grid gap-8 lg:grid-cols-3 lg:items-center">
  <div className="lg:col-span-2 space-y-6">
  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
  <Shield className="w-3 h-3 text-ai-blue" />
  <span className="text-[8px] font-semibold text-ai-blue">Support available</span>
  </div>
  <h3 className="text-xl lg:text-2xl font-semibold text-white">Need help with a resource?</h3>
  <p className="max-w-2xl text-sm leading-6 text-white/45">Ask support if you need help finding a resource.</p>
  <button 
  onClick={onSupportRequest}
  className="min-h-11 px-5 py-3 bg-ai-blue text-white font-semibold text-[11px] rounded-xl hover:bg-ai-blue/85 transition-colors flex items-center gap-3 active:scale-[0.99]"
  >
  Request support
  <ArrowRight className="w-4 h-4" />
  </button>
  </div>
  <div className="hidden lg:flex justify-center">
  <div className="w-48 h-48 rounded-[48px] bg-white/[0.02] border border-white/5 flex items-center justify-center relative group">
  <div className="absolute inset-0 bg-ai-blue/5 blur-3xl rounded-full animate-pulse"></div>
  <BookOpen className="w-20 h-20 text-ai-blue/20 group-hover:scale-110 group-hover:text-ai-blue transition-all duration-700" />
  </div>
  </div>
  </div>
  </div>
  </div>
  );
};

function getResourceHref(value?: string | null, title?: string) {
  if (!value) return null;
  if (value.startsWith('/')) return value;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    if (url.hostname === 'example.com' || url.hostname.endsWith('.example.com')) return title?.startsWith('SEO Best Practices') ? '/resources/seo-basics' : null;
    if (url.hostname === 'youtube.com' && url.pathname.includes('sitemendr-walkthrough')) return '/resources/getting-started';
    if (url.hostname === 'docs.zencoder.ai') {
      if (title === 'Visual Editor Mastery') return '/resources/editor';
      if (title === 'E-commerce Deployment') return '/resources/commerce';
      if (title === 'Security & Compliance Matrix') return '/resources/security';
      if (title === 'Performance Optimization AI') return '/resources/performance';
      if (title === 'Domain Integration Protocol') return '/resources/domains';
      if (title === 'Getting Started with Sitemendr') return '/resources/getting-started';
    }
    return url.toString();
  } catch {
    return null;
  }
}

function getResourcePresentation(resource: ResourceItem) {
  if (resource.title === 'SEO Best Practices 2024') return {
    title: 'Search visibility basics', type: 'Guide',
    description: 'A practical checklist for helping search engines understand and show your website.'
  };
  if (resource.title === 'Dashboard Overview Video') return {
    title: 'Getting started with your workspace', type: 'Guide',
    description: 'Find project updates, contact the team, and manage a finished site.'
  };
  if (resource.title === 'Visual Editor Mastery') return { title: 'Working with your site editor', type: 'Guide', description: 'Make focused changes and review a site safely before publishing.' };
  if (resource.title === 'E-commerce Deployment') return { title: 'Commerce setup basics', type: 'Guide', description: 'Keep product, checkout, fulfillment, and customer updates connected.' };
  if (resource.title === 'Security & Compliance Matrix') return { title: 'Security and account safety', type: 'Guide', description: 'Practical steps for protecting account access and connected services.' };
  if (resource.title === 'Performance Optimization AI') return { title: 'Performance optimization tips', type: 'Guide', description: 'Understand site checks, read point-in-time results, and ask for help with a specific issue.' };
  if (resource.title === 'Domain Integration Protocol') return { title: 'Custom domain setup', type: 'Guide', description: 'Register a domain with a provider you choose, then connect and verify it in Sitemendr.' };
  if (resource.title === 'Getting Started with Sitemendr') return { title: 'Getting started with your workspace', type: 'Guide', description: 'Find project updates, contact the team, and manage a finished site.' };
  const type = resource.type.toLowerCase() === 'tool' ? 'Guide' : resource.type;
  return { title: resource.title, type, description: resource.description };
}

export default ResourceLibrary;
