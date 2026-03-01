'use client';

import { Zap, ShieldCheck, CreditCard, Activity, Rocket } from 'lucide-react';
import Link from 'next/link';

const benefits = [
  {
    id: 'PARAM-01',
    title: 'Fast Turnaround',
    description: 'Get your website built in weeks, not months. Our streamlined process delivers fast results.',
    icon: <Zap className="w-6 h-6" />,
    metric: '4 weeks'
  },
  {
    id: 'PARAM-02',
    title: 'Quality Guaranteed',
    description: 'Every website undergoes rigorous testing to ensure it works perfectly on all devices and browsers.',
    icon: <ShieldCheck className="w-6 h-6" />,
    metric: '99.9% Uptime'
  },
  {
    id: 'PARAM-03',
    title: 'Clear Pricing',
    description: 'No hidden fees or surprise costs. The price we quote is the price you pay.',
    icon: <CreditCard className="w-6 h-6" />,
    metric: 'No Hidden Fees'
  },
  {
    id: 'PARAM-04',
    title: 'Ongoing Support',
    description: 'We are here to help even after your website goes live. Get support whenever you need it.',
    icon: <Activity className="w-6 h-6" />,
    metric: '24/7 Available'
  }
];

export default function WhyChooseUs() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Infrastructure Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10"></div>
      
      {/* Background Pulse Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-ai-blue/5 rounded-full blur-[120px] animate-pulse"></div>

      {/* Scanning Line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02]">
        <div className="w-full h-[1px] bg-ai-blue animate-scan shadow-[0_0_8px_rgba(0,102,255,0.8)]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-4 px-3 py-1 rounded bg-expert-green/5 border border-expert-green/20 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-expert-green shadow-[0_0_8px_#10B981] animate-pulse"></div>
                <span className="font-mono text-[9px] font-bold text-expert-green uppercase tracking-[0.3em]">Why Choose Us</span>
              </div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-none uppercase">
              Built for <br />
              <span className="bg-gradient-to-r from-ai-blue via-tech-purple to-expert-green bg-clip-text text-transparent italic">Operational_Growth</span>
            </h2>
            <p className="text-xl text-medium-gray mb-12 leading-relaxed font-mono uppercase tracking-tight opacity-70 max-w-xl">
              We connect automatic efficiency with human creativity, providing digital items that bring important results.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="group relative p-6 border border-white/5 rounded-2xl hover:border-ai-blue/30 transition-all duration-700">
                  {/* HUD Corner Brackets */}
                  <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-white/10 group-hover:border-ai-blue/40 transition-colors"></div>
                  <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-white/10 group-hover:border-ai-blue/40 transition-colors"></div>

                  <div className="flex items-start justify-between mb-8">
                    <div className="w-14 h-14 rounded-xl bg-dark-bg border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:border-ai-blue/50 transition-all duration-500 shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-ai-blue/5 opacity-0 group-hover:opacity-100"></div>
                      {benefit.icon}
                    </div>
                    <div className="font-mono text-[8px] font-black text-expert-green bg-expert-green/5 px-2 py-1 rounded border border-expert-green/20 tracking-widest uppercase">
                      {benefit.metric}
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-white mb-3 tracking-tight group-hover:text-ai-blue transition-colors duration-500 uppercase">{benefit.title}</h3>
                  <p className="font-mono text-[10px] text-medium-gray leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity duration-500 uppercase tracking-tighter">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative lg:pl-10">
            {/* Core Engine Visual Card */}
            <div className="relative z-10 aspect-square rounded-3xl overflow-hidden group perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-br from-ai-blue/10 via-tech-purple/10 to-expert-green/10 group-hover:scale-110 transition-transform duration-1000"></div>
              
              {/* Glass Terminal Container */}
              <div className="absolute inset-0 backdrop-blur-3xl border border-white/10 m-4 rounded-2xl flex flex-col items-center justify-center text-center p-8 shadow-2xl overflow-hidden">
                {/* Technical HUD Elements */}
                <div className="absolute top-10 left-10 w-20 h-0.5 bg-ai-blue/30"></div>
                <div className="absolute top-10 left-10 h-20 w-0.5 bg-ai-blue/30"></div>
                <div className="absolute bottom-10 right-10 w-20 h-0.5 bg-tech-purple/30"></div>
                <div className="absolute bottom-10 right-10 h-20 w-0.5 bg-tech-purple/30"></div>

                <div className="relative mb-10">
                  <div className="absolute inset-0 bg-ai-blue/30 blur-[60px] rounded-full animate-pulse"></div>
                  <div className="relative w-32 h-32 bg-dark-bg/90 rounded-2xl border border-white/20 flex items-center justify-center animate-float shadow-[0_30px_60px_rgba(0,0,0,0.5)] group-hover:border-ai-blue/50 transition-colors">
                    <Rocket className="w-16 h-16 text-ai-blue" />
                  </div>
                </div>
                
                <h3 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-none uppercase">
                  Core_ <br />
                  <span className="bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent italic">Infra_Engine</span>
                </h3>
                
                <div className="font-mono text-[9px] font-bold text-ai-blue mb-10 bg-ai-blue/5 px-4 py-2 rounded border border-ai-blue/20 tracking-[0.3em] uppercase">
                  SYSTEM_CORE_V2.0_STABLE
                </div>

                <Link href="/contact" className="group/btn relative px-10 py-5 bg-ai-blue text-white font-mono font-black rounded-xl overflow-hidden transition-all duration-500 hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(0,102,255,0.4)] cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] skew-x-[-20deg]"></div>
                  <span className="relative z-10 uppercase tracking-widest text-[10px]">Get Started</span>
                </Link>
              </div>
              
              {/* Floating Technical Tags */}
              <div className="absolute top-16 right-16 px-4 py-2 bg-dark-bg/90 backdrop-blur-md border border-white/10 rounded-lg font-mono text-[9px] font-bold text-ai-blue -rotate-6 group-hover:rotate-0 transition-all duration-700 shadow-2xl tracking-widest">
                ENGINE_ACTIVE
              </div>
              <div className="absolute bottom-20 left-16 px-4 py-2 bg-dark-bg/90 backdrop-blur-md border border-white/10 rounded-lg font-mono text-[9px] font-bold text-expert-green rotate-6 group-hover:rotate-0 transition-all duration-700 shadow-2xl tracking-widest uppercase">
                Uptime: 99.9%
              </div>
            </div>
            
            {/* Orbiting Ring (SVG for more precision) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] pointer-events-none opacity-20">
              <svg className="w-full h-full animate-[spin_30s_linear_infinite]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="0.1" strokeDasharray="1,5" />
                <circle cx="50" cy="2" r="1.5" fill="#0066FF" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
