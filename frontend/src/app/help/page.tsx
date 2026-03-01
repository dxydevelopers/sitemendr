'use client';

import { LifeBuoy, Search, Cpu, MessageSquare, BookOpen, ChevronRight, Activity, Zap } from 'lucide-react';

export default function HelpCenter() {
  const categories = [
    { name: 'Getting Started', icon: <Cpu className="w-5 h-5 text-ai-blue" />, count: 12 },
    { name: 'Website Management', icon: <Activity className="w-5 h-5 text-expert-green" />, count: 8 },
    { name: 'Billing & Payments', icon: <LifeBuoy className="w-5 h-5 text-tech-purple" />, count: 5 },
    { name: 'AI Configuration', icon: <Zap className="w-5 h-5 text-pink-500" />, count: 15 },
  ];

  return (
    <main className="min-h-screen bg-darker-bg text-light-text pt-32 pb-20 relative overflow-hidden">
      {/* Background Technical Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,102,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-ai-blue/5 border border-ai-blue/20 mb-8">
            <LifeBuoy className="w-4 h-4 text-ai-blue animate-pulse" />
            <span className="text-[10px] font-mono font-black text-ai-blue uppercase tracking-[0.4em]">SUPPORT AVAILABLE</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-8 tracking-tighter uppercase">
            Support <span className="italic text-ai-blue">Hub</span>
          </h1>
          
          <div className="max-w-2xl mx-auto relative group mt-12">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-medium-gray group-hover:text-ai-blue transition-colors w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search for help..." 
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-6 pl-16 pr-8 text-white font-mono placeholder:text-medium-gray/30 focus:outline-none focus:border-ai-blue/50 focus:bg-white/[0.05] transition-all"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {categories.map((cat) => (
            <div key={cat.name} className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-ai-blue/30 transition-all duration-500 group cursor-pointer">
              <div className="p-4 bg-white/[0.03] rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2">{cat.name}</h3>
              <p className="text-[10px] font-mono text-medium-gray uppercase tracking-widest">{cat.count} articles available</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase flex items-center gap-4">
              <BookOpen className="text-ai-blue w-6 h-6" />
              Recent Articles
            </h2>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.04] transition-all cursor-pointer">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-tight group-hover:text-ai-blue transition-colors">How to Optimize Website Performance</h3>
                  <p className="text-[10px] font-mono text-medium-gray uppercase tracking-widest">Updated: January 2024</p>
                </div>
                <ChevronRight className="text-white/20 group-hover:text-ai-blue group-hover:translate-x-2 transition-all" />
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase flex items-center gap-4">
              <MessageSquare className="text-tech-purple w-6 h-6" />
              Contact Us
            </h2>
            <div className="p-10 rounded-3xl bg-gradient-to-br from-ai-blue/10 via-tech-purple/5 to-transparent border border-white/5 relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">Need Personal Assistance?</h3>
                <p className="text-xs text-medium-gray font-mono leading-relaxed uppercase tracking-tighter mb-8 opacity-60">
                  Direct encrypted link for complex issue resolution. Response typically within 24h.
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    <span className="text-ai-blue">EMAIL:</span> support@sitemendr.com
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    <span className="text-ai-blue">PHONE:</span> +254 790 057 596
                  </div>
                </div>
                <button className="w-full py-4 bg-ai-blue text-white font-mono text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,102,255,0.3)]">
                  Contact Support
                </button>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-[0.05] group-hover:opacity-10 transition-opacity">
                <LifeBuoy size={160} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
