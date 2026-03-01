'use client';

import { Cookie, Info, ShieldCheck, Settings2, ChevronRight, Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function CookiePolicy() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const sections = [
    {
      title: 'Essential Cookies',
      content: 'These essential cookies are necessary for the technical operation of Sitemendr. They manage session states, security tokens, and authentication payloads across our distributed nodes.'
    },
    {
      title: 'Performance Cookies',
      content: 'Performance cookies allow us to monitor system health and user interaction patterns. This data helps our AI algorithms optimize load balancing and interface responsiveness.'
    },
    {
      title: 'Preference Cookies',
      content: 'Functional cookies remember your technical configurations, such as theme selection (Dark/System), language protocols, and dashboard customization settings.'
    },
    {
      title: 'Analytics Cookies',
      content: 'We use verified analytics partners (e.g., Google Analytics) to gather macro-level telemetry on infrastructure usage. No personally identifiable data is shared through these channels.'
    },
    {
      title: 'Cookie Settings',
      content: 'Users can modify their cookie protocols via browser settings or our Preference Terminal. Disabling essential cookies may result in system instability or loss of functionality.'
    }
  ];

  return (
    <main className="min-h-screen bg-black text-white pt-40 pb-32 relative overflow-hidden">
      {/* HUD Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-24 right-12 flex items-center gap-3">
          <Terminal className="w-4 h-4 text-ai-blue" />
          <span className="font-mono text-[8px] uppercase tracking-[0.4em]">Cookie Policy</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ai-blue/5 border border-ai-blue/20 mb-8">
            <Cookie className="w-4 h-4 text-ai-blue" />
            <span className="text-[10px] font-bold text-ai-blue uppercase tracking-[0.3em]">Data Storage</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black mb-12 tracking-tighter uppercase leading-none">
            Cookie_ <br />
            <span className="bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent italic">Registry</span>
          </h1>

          <div className="space-y-16">
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
              <p className="text-white/60 font-mono text-xs uppercase tracking-widest leading-relaxed">
                Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) /* Protocol: Compliant */}
              </p>
            </div>

            {sections.map((section, i) => (
              <div key={i} className="group relative">
                <div className="flex items-start gap-8">
                  <div className="hidden md:flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-ai-blue group-hover:scale-110 transition-transform duration-500">
                      {i === 0 ? <ShieldCheck size={20} /> : i === 1 ? <Info size={20} /> : <Settings2 size={20} />}
                    </div>
                    {i !== sections.length - 1 && <div className="w-px h-full bg-gradient-to-b from-white/10 to-transparent my-4"></div>}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                      <ChevronRight className="w-4 h-4 text-ai-blue md:hidden" />
                      {section.title}
                    </h3>
                    <p className="text-white/40 leading-relaxed font-light text-lg">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-24 p-12 rounded-[3rem] bg-white/[0.02] border border-white/10">
              <h3 className="text-2xl font-black text-white uppercase mb-8 text-center">Cookie Preferences</h3>
              <div className="flex flex-col md:flex-row gap-6 justify-center">
                <button className="px-12 py-5 bg-ai-blue text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,102,255,0.2)]">
                  Accept All Cookies
                </button>
                <button className="px-12 py-5 bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-white/10 transition-all">
                  Essential Only
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
