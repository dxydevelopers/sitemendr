'use client';

import React, { useState } from 'react';
import { BookOpen, FileText, Video, Download, ExternalLink, Shield, Zap, Search as SearchIcon, ArrowRight } from 'lucide-react';

interface ResourceItem {
  id: string;
  title: string;
  type: string;
  url: string;
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
    const matchesFilter = activeFilter === 'ALL' || res.type.toUpperCase() === activeFilter;
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         res.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 lg:space-y-10 animate-fade-in pb-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 px-2">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-ai-blue" />
            Intelligence Repository
          </h2>
          <p className="text-[10px] text-medium-gray font-bold uppercase tracking-widest mt-1 opacity-60">Documentation and guides</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medium-gray" />
            <input 
              type="text"
              placeholder="Filter resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-[10px] font-black uppercase tracking-widest focus:border-ai-blue outline-none transition-all"
            />
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            {['ALL', 'DOCUMENTATION', 'GUIDE', 'VIDEO'].map((tag) => (
              <button 
                key={tag} 
                onClick={() => setActiveFilter(tag)}
                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
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
            <div key={resource.id} className="bg-white/[0.01] border border-white/5 p-8 rounded-[32px] hover:bg-white/[0.03] hover:border-white/20 transition-all group relative overflow-hidden flex flex-col h-full">
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

              <div className="space-y-2 mb-8">
                <span className="text-[8px] font-black text-ai-blue uppercase tracking-[0.4em] block">{resource.type}</span>
                <h3 className="text-sm font-black uppercase tracking-widest text-white leading-tight">{resource.title}</h3>
                <p className="text-[11px] text-white/30 font-medium uppercase tracking-tighter line-clamp-2 leading-relaxed">
                  {resource.description || 'Access tactical documentation and technical specifications for your digital infrastructure.'}
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ai-blue hover:text-white transition-colors"
                >
                  Retrieve Data <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white border border-white/5">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-24 text-center border border-dashed border-white/10 rounded-[40px] bg-white/[0.01]">
            <Zap className="w-16 h-16 text-white/5 mx-auto mb-6 animate-pulse" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">No active resources in current sector</p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-ai-blue/10 via-transparent to-tech-purple/10 border border-white/10 p-10 lg:p-14 rounded-[40px] relative overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="relative z-10 grid lg:grid-cols-3 gap-12 items-center">
          <div className="lg:col-span-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <Shield className="w-3 h-3 text-ai-blue" />
              <span className="text-[8px] font-black uppercase tracking-widest text-ai-blue">Tactical Support Active</span>
            </div>
            <h3 className="text-xl lg:text-2xl font-black uppercase tracking-tight text-white">Require Technical Reinforcement?</h3>
            <p className="text-xs lg:text-sm font-medium uppercase tracking-tight text-white/40 leading-relaxed max-w-2xl">
              Our core architects are standing by to assist with complex infrastructure deployment, security protocol implementation, or neural model fine-tuning.
            </p>
            <button 
              onClick={onSupportRequest}
              className="px-10 py-5 bg-ai-blue text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-xl shadow-ai-blue/20 flex items-center gap-4 active:scale-95"
            >
              Request Tactical Support
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

export default ResourceLibrary;
