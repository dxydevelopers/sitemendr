'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CTASectionProps {
  onStartAssessment: () => void;
}

export default function CTASection({ onStartAssessment }: CTASectionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    const element = document.getElementById('cta-section');
    if (element) observer.observe(element);
    return () => { if (element) observer.unobserve(element); };
  }, []);

  return (
    <section id="cta-section" className="relative py-24 overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,102,255,0.05)_0%,transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:200px_200px]"></div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="w-full h-[2px] bg-ai-blue/10 absolute top-0 animate-[scan_8s_linear_infinite]"></div>
        </div>
        <div className="absolute top-12 left-12 w-24 h-24 border-t-2 border-l-2 border-white/10"></div>
        <div className="absolute top-12 right-12 w-24 h-24 border-t-2 border-r-2 border-white/10"></div>
        <div className="absolute bottom-12 left-12 w-24 h-24 border-b-2 border-l-2 border-white/10"></div>
        <div className="absolute bottom-12 right-12 w-24 h-24 border-b-2 border-r-2 border-white/10"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full bg-ai-blue/5 border border-ai-blue/20 mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="relative flex h-2 w-2">
            <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ai-blue opacity-75"></div>
            <div className="relative inline-flex rounded-full h-2 w-2 bg-ai-blue"></div>
          </div>
          <span className="text-[10px] font-mono font-black text-ai-blue uppercase tracking-[0.4em]">Get Started Today</span>
        </div>

        <h2 className={`text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-[0.85] transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          Ready to Grow Your Business? <br />
          <span className="italic bg-gradient-to-r from-ai-blue via-tech-purple to-expert-green bg-clip-text text-transparent">Limits</span>
        </h2>

        <p className={`text-xl md:text-2xl text-medium-gray mb-12 max-w-3xl mx-auto leading-relaxed font-medium transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          Start the Sitemendr process to transform your digital presence and help your business grow.
        </p>

        <div className={`mb-12 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { id: 'NODE_01', title: 'Smart Check', desc: 'Complete technical and planning AI data analysis to ensure your project starts right' },
              { id: 'NODE_02', title: 'Quick Build', desc: 'Independent system building with expert oversight and quality assurance' },
              { id: 'NODE_03', title: 'Expert Connect', desc: 'Direct link to top system engineers for ongoing support and guidance' }
            ].map((item, i) => (
              <div key={i} className="group relative bg-[#0a0a0a]/50 backdrop-blur-xl border border-white/5 p-6 hover:border-ai-blue/30 transition-all duration-700 overflow-hidden text-left">
                <div className="absolute top-0 left-0 w-1 h-full bg-ai-blue/0 group-hover:bg-ai-blue/50 transition-all"></div>
                <div className="absolute top-4 right-6 font-mono text-[8px] text-white/20 tracking-widest">{item.id}</div>
                <h3 className="text-white text-xl font-black mb-4 tracking-tight group-hover:text-ai-blue transition-colors font-mono uppercase">{item.title}</h3>
                <p className="text-medium-gray text-sm font-medium leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className={`flex flex-col sm:flex-row gap-8 justify-center items-center transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <button onClick={() => onStartAssessment()} className="group relative px-12 py-8 bg-white text-dark-bg font-black text-xl overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-r from-ai-blue to-tech-purple translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <span className="relative z-10 group-hover:text-white transition-colors duration-500 uppercase tracking-[0.2em] text-xs font-mono">Start Now</span>
          </button>
          <Link href="/contact" className="px-12 py-8 bg-transparent hover:bg-white/5 border border-white/10 text-white font-black text-xl transition-all duration-500 active:scale-95 backdrop-blur-sm uppercase tracking-[0.2em] text-xs font-mono">
            Contact Us
          </Link>
        </div>

        <div className={`mt-16 pt-12 border-t border-white/5 flex flex-wrap justify-center gap-x-16 gap-y-8 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-40' : 'opacity-0'}`}>
          {[
            { label: 'Fast Response', color: 'bg-ai-blue' },
            { label: 'Full Encryption', color: 'bg-tech-purple' },
            { label: '24/7 System Support', color: 'bg-expert-green' },
            { label: 'Standard Security', color: 'bg-pink-500' }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 text-[9px] font-mono font-black text-medium-gray uppercase tracking-[0.3em]">
              <div className={`w-1.5 h-1.5 rounded-full ${item.color}`}></div>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          from { transform: translateY(-100%); }
          to { transform: translateY(1000%); }
        }
      `}</style>
    </section>
  );
}
