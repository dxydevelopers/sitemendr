'use client';

import { Search, BrainCircuit, PenTool, Globe } from 'lucide-react';

const steps = [
  {
    id: 'PROTO-01',
    title: 'Discovery',
    description: 'We learn about your business and goals to plan the perfect website.',
    icon: <Search className="w-10 h-10 text-ai-blue" />,
    accent: 'from-ai-blue to-tech-purple'
  },
  {
    id: 'PROTO-02',
    title: 'Design',
    description: 'We create beautiful designs and plans tailored to your brand.',
    icon: <BrainCircuit className="w-10 h-10 text-tech-purple" />,
    accent: 'from-tech-purple to-pink-500'
  },
  {
    id: 'PROTO-03',
    title: 'Development',
    description: 'Our expert developers build your site with clean, reliable code.',
    icon: <PenTool className="w-10 h-10 text-pink-500" />,
    accent: 'from-pink-500 to-expert-green'
  },
  {
    id: 'PROTO-04',
    title: 'Launch',
    description: 'We deploy your website and monitor it to ensure it runs smoothly.',
    icon: <Globe className="w-10 h-10 text-expert-green" />,
    accent: 'from-expert-green to-ai-blue'
  }
];

export default function ProcessSection() {
  return (
    <section id="process" className="py-24 relative overflow-hidden">
      {/* Infrastructure Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.15]"></div>

      {/* Background technical elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-ai-blue/50 to-transparent"></div>
        <div className="absolute top-[40%] left-0 w-full h-px bg-gradient-to-r from-transparent via-tech-purple/30 to-transparent"></div>
      </div>

      {/* Scanning Line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="w-full h-[1px] bg-ai-blue animate-scan shadow-[0_0_8px_rgba(0,102,255,0.8)]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-4 px-3 py-1 rounded bg-tech-purple/5 border border-tech-purple/20 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-tech-purple shadow-[0_0_8px_#9333EA] animate-pulse"></div>
                <span className="font-mono text-[9px] font-bold text-tech-purple uppercase tracking-[0.3em]">Our Process</span>
              </div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none uppercase">
              Operational <br />
              <span className="bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent italic">How We Work</span>
            </h2>
          </div>
          <div className="max-w-sm">
            <p className="text-lg text-medium-gray leading-relaxed font-mono uppercase tracking-tight opacity-70 mb-4">
              Removing system problems using fast engineering processes.
            </p>
            <div className="flex gap-4">
              <div className="h-1 w-12 bg-ai-blue rounded-full shadow-[0_0_10px_#0066FF]"></div>
              <div className="h-1 w-8 bg-tech-purple/50 rounded-full"></div>
              <div className="h-1 w-4 bg-pink-500/30 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 relative">
          {/* Data Stream Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[5.5rem] left-0 w-full h-[1px] bg-white/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-ai-blue via-tech-purple to-expert-green animate-[shimmer_3s_infinite] opacity-50"></div>
          </div>

          {steps.map((step, index) => (
            <div key={index} className="group relative">
              <div className="relative z-10 p-6 rounded-2xl border border-white/5 hover:border-ai-blue/30 transition-all duration-700 hover:-translate-y-4">
                
                {/* HUD Corner Brackets */}
                <div className="absolute top-4 left-4 w-3 h-3 border-t border-l border-white/10 group-hover:border-ai-blue/40 transition-colors"></div>
                <div className="absolute bottom-4 right-4 w-3 h-3 border-b border-r border-white/10 group-hover:border-ai-blue/40 transition-colors"></div>

                {/* Step ID Label */}
                <div className="absolute top-6 right-8 font-mono text-[9px] font-bold text-white/10 group-hover:text-ai-blue/40 transition-colors tracking-widest">
                  {step.id}
                </div>

                {/* Number & Icon Circle */}
                <div className="relative w-24 h-24 mb-10 mx-auto md:mx-0">
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.accent} rounded-xl rotate-3 group-hover:rotate-6 transition-transform duration-700 opacity-10`}></div>
                  <div className="absolute inset-0 bg-dark-bg/80 backdrop-blur-2xl border border-white/10 rounded-xl flex items-center justify-center text-4xl shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:border-ai-blue/30 group-hover:shadow-[0_0_30px_rgba(0,102,255,0.2)]">
                    <div className={`absolute inset-0 bg-gradient-to-tr ${step.accent} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                    {step.icon}
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-dark-bg border border-white/10 rounded-lg flex items-center justify-center overflow-hidden shadow-2xl">
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.accent} opacity-20`}></div>
                    <span className="relative z-10 text-white font-mono font-black text-sm">0{index + 1}</span>
                  </div>
                </div>

                <h3 className="text-xl font-black text-white mb-4 text-center md:text-left tracking-tight group-hover:text-ai-blue transition-colors duration-500 leading-tight uppercase">
                  {step.title}
                </h3>
                <p className="font-mono text-[11px] text-medium-gray text-center md:text-left leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity duration-500 uppercase tracking-tighter">
                  {step.description}
                </p>
                
                {/* Progress Indicator Accent */}
                <div className="mt-10 flex items-center gap-3">
                  <div className={`h-[2px] w-full bg-white/5 rounded-full overflow-hidden`}>
                    <div className={`h-full w-0 group-hover:w-full bg-gradient-to-r ${step.accent} transition-all duration-1000 ease-out`}></div>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${step.accent} shrink-0 shadow-[0_0_8px_rgba(0,102,255,0.5)]`}></div>
                </div>
              </div>

              {/* Step Sequence Connector (Mobile) */}
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center py-4">
                  <div className="w-px h-12 bg-gradient-to-b from-ai-blue/20 to-transparent"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
