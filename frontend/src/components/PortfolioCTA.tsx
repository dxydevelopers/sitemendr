'use client';

import { ArrowRight, Sparkles, Terminal, Cpu, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';

export default function PortfolioCTA() {
  return (
    <section className="relative py-40 bg-gradient-to-br from-ai-blue/10 via-tech-purple/10 to-pink-500/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative bg-white/[0.02] border border-white/10 rounded-[4rem] p-12 backdrop-blur-3xl overflow-hidden group">
          {/* Animated Background Grid */}
          <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: `
                linear-gradient(rgba(0,102,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,102,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              animation: 'gridMove 20s linear infinite'
            }}></div>
          </div>

          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-ai-blue to-tech-purple mb-8">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Ready to Transform?</span>
              </div>
              
              <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter uppercase leading-none">
                Your <span className="bg-gradient-to-r from-ai-blue via-tech-purple to-pink-500 bg-clip-text text-transparent italic">Success</span> Story
              </h2>
              
              <p className="text-lg text-white/60 leading-relaxed mb-12 font-light">
                Join hundreds of businesses that have transformed their digital presence with our cutting-edge solutions. 
                Let&apos;s create your next success story together.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <div className="text-center">
                  <div className="text-2xl font-black text-ai-blue mb-2">16+</div>
                  <div className="text-xs text-white/40 uppercase tracking-widest">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-tech-purple mb-2">98%</div>
                  <div className="text-xs text-white/40 uppercase tracking-widest">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-pink-500 mb-2">8+</div>
                  <div className="text-xs text-white/40 uppercase tracking-widest">Industries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-expert-green mb-2">50+</div>
                  <div className="text-xs text-white/40 uppercase tracking-widest">Technologies</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <Link
                  href="/contact"
                  className="group relative px-10 py-5 bg-gradient-to-r from-ai-blue to-tech-purple text-white font-black rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(0,102,255,0.3)] flex items-center justify-center gap-3"
                >
                  <span className="flex items-center gap-3 uppercase tracking-widest text-sm">
                    Start Your Project
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>

                <button
                  onClick={() => window.location.href = '/services'}
                  className="group relative px-10 py-5 bg-white/5 border border-white/10 text-white font-black rounded-xl transition-all hover:bg-white/10 hover:border-white/20 flex items-center justify-center gap-3"
                >
                  <span className="flex items-center gap-3 uppercase tracking-widest text-sm">
                    View Services
                  </span>
                </button>
              </div>
            </div>

            <div className="relative">
              {/* Technical HUD Display */}
              <div className="relative bg-black/50 border border-white/20 rounded-2xl p-8 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ai-blue via-tech-purple to-pink-500"></div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Cpu className="w-5 h-5 text-ai-blue" />
                      <div>
                        <div className="text-xs text-white/40 uppercase tracking-widest">System Status</div>
                        <div className="text-sm font-bold text-white">Operational</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-expert-green" />
                      <div>
                        <div className="text-xs text-white/40 uppercase tracking-widest">Security Level</div>
                        <div className="text-sm font-bold text-white">Maximum</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-tech-purple" />
                      <div>
                        <div className="text-xs text-white/40 uppercase tracking-widest">Active Clients</div>
                        <div className="text-sm font-bold text-white">16+</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Terminal className="w-5 h-5 text-pink-500" />
                      <div>
                        <div className="text-xs text-white/40 uppercase tracking-widest">Response Time</div>
                        <div className="text-sm font-bold text-white">24ms</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Animated Circuit Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/4 left-0 w-full h-[1px] bg-ai-blue/20 animate-pulse"></div>
                  <div className="absolute top-0 left-1/4 w-[1px] h-full bg-tech-purple/20 animate-pulse"></div>
                  <div className="absolute bottom-1/4 right-0 w-full h-[1px] bg-pink-500/20 animate-pulse"></div>
                  <div className="absolute top-0 right-1/4 w-[1px] h-full bg-expert-green/20 animate-pulse"></div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-ai-blue/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-tech-purple/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            </div>
          </div>

          {/* Corner Brackets */}
          <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-white/20 group-hover:border-ai-blue/60 transition-colors"></div>
          <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-white/20 group-hover:border-tech-purple/60 transition-colors"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </section>
  );
}