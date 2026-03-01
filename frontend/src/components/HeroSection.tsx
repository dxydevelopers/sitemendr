'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  Cpu
} from 'lucide-react';
import DataStream from '@/components/DataStream';

interface ModernHeroSectionProps {
  onStartAssessment: () => void;
}

export default function ModernHeroSection({ onStartAssessment }: ModernHeroSectionProps) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isSystemReady, setIsSystemReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Initial loading sequence
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSystemReady(true);
          }, 500);
          return 100;
        }
        return prev + Math.floor(Math.random() * 5) + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#020202]">
      {/* High-Tech Background Video */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-20 grayscale contrast-12"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-circuit-board-1549-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#020202] via-transparent to-[#020202] opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#020202] via-transparent to-[#020202] opacity-40"></div>
      </div>

      {/* Loading Overlay */}
      {!isSystemReady && (
        <div className="fixed inset-0 z-[100] bg-[#020202] flex flex-col items-center justify-center p-6 transition-opacity duration-1000">
          <div className="relative w-64 h-64 mb-12">
            {/* Spinning HUD Rings */}
            <div className="absolute inset-0 border border-ai-blue/20 rounded-full animate-[spin_3s_linear_infinite]"></div>
            <div className="absolute inset-4 border border-dashed border-tech-purple/30 rounded-full animate-[spin_6s_linear_infinite_reverse]"></div>
            <div className="absolute inset-8 border-2 border-expert-green/20 rounded-full animate-[pulse_2s_ease-in-out_infinite]"></div>
            
            {/* Percentage Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-4xl font-black text-white mb-2">{loadingProgress}%</span>
              <span className="font-mono text-[8px] text-ai-blue font-bold tracking-[0.4em] uppercase">INITIATING_CORE</span>
            </div>
          </div>

          <div className="max-w-md w-full">
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-8 border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-ai-blue via-tech-purple to-expert-green transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            
            {/* Technical Data Stream during load */}
            <div className="h-24 opacity-40">
              <DataStream activeStep={Math.floor(loadingProgress / 25)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`relative z-10 max-w-7xl mx-auto px-6 w-full pt-20 transition-all duration-1000 ${
        isSystemReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}>
        <div className="grid lg:grid-cols-[1fr_400px] gap-16 items-center">
          {/* Left Column: Headline & Description */}
          <div className="text-left">
            <div className="inline-flex items-center gap-4 px-3 py-1.5 rounded bg-ai-blue/10 border border-ai-blue/20 mb-12 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ai-blue opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-ai-blue"></span>
                </span>
                <span className="font-mono text-[10px] font-bold text-ai-blue tracking-[0.3em] uppercase">Ready to Get Started</span>
              </div>
              <div className="w-px h-3 bg-white/10"></div>
              <span className="font-mono text-[10px] font-bold text-expert-green tracking-[0.2em] uppercase">OPTIMIZED_ACTIVE</span>
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 tracking-tighter leading-[0.85] uppercase">
              <span className="inline-block text-white">Deploy</span>
              <br />
              <span className="inline-block bg-gradient-to-r from-ai-blue via-tech-purple to-pink-500 bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent italic pb-4">
                Excellence
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-medium-gray mb-16 max-w-2xl leading-relaxed font-mono uppercase tracking-tight opacity-70">
              Institution-grade digital infrastructure engineered for high-performance scale and automated growth.
            </p>

            <div className="flex flex-col sm:flex-row gap-8">
              <button
                onClick={() => onStartAssessment()}
                className="group relative px-12 py-7 bg-ai-blue text-white font-black text-xs uppercase tracking-[0.4em] rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.05] hover:shadow-[0_0_60px_rgba(0,102,255,0.4)] active:scale-[0.98] font-mono shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-[-20deg]"></div>
                <span className="relative z-10 flex items-center gap-4">
                  Initiate Deployment
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              <button className="group relative px-12 py-7 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-[0.4em] rounded-2xl transition-all duration-300 active:scale-[0.98] backdrop-blur-xl font-mono">
                <span className="relative z-10">View Features</span>
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </div>

          {/* Right Column: Visual HUD & Technical Stats */}
          <div className="hidden lg:block">
            <div className="relative aspect-square">
              {/* Central HUB Visual */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full p-12 border border-white/5 rounded-[4rem] bg-white/[0.02] backdrop-blur-3xl group">
                  <div className="absolute inset-0 bg-gradient-to-br from-ai-blue/10 via-tech-purple/10 to-transparent transition-transform duration-1000 group-hover:scale-110"></div>
                  
                  {/* HUD Elements */}
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
                        <Cpu className="w-8 h-8 text-ai-blue animate-pulse" />
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[8px] text-white/40 mb-1 uppercase tracking-widest">THROUGHPUT</div>
                        <div className="font-mono text-xl font-black text-expert-green tracking-tighter">1.2GB/S</div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="h-px w-full bg-gradient-to-r from-ai-blue to-transparent"></div>
                      <DataStream className="h-40" activeStep={1} />
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-tech-purple to-transparent"></div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-ai-blue"></div>
                        <div className="w-2 h-2 rounded-full bg-tech-purple"></div>
                        <div className="w-2 h-2 rounded-full bg-expert-green"></div>
                      </div>
                      <div className="font-mono text-[8px] text-ai-blue font-bold uppercase tracking-widest">System Online</div>
                    </div>
                  </div>

                  {/* Corner Brackets */}
                  <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-white/20"></div>
                  <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-white/20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Infrastructure Stats Footer */}
        <div className="mt-32 pt-20 border-t border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-12">
          {[
            { label: 'Uptime', value: '99.99%', sub: 'GLOBAL_AVAILABILITY' },
            { label: 'Latency', value: '18ms', sub: 'NETWORK_SYNC' },
            { label: 'Security', value: 'A++', sub: 'ENCRYPTION_PASS' },
            { label: 'Growth', value: '4.8x', sub: 'SCALE_COEFFICIENT' }
          ].map((stat, i) => (
            <div key={i} className="group cursor-default">
              <div className="font-mono text-[9px] font-bold text-ai-blue uppercase tracking-[0.3em] mb-4 opacity-40 group-hover:opacity-100 transition-opacity">
                {stat.label}
              </div>
              <div className="text-6xl font-black text-white group-hover:text-ai-blue transition-all duration-300 tracking-tighter leading-none mb-2">
                {stat.value}
              </div>
              <div className="font-mono text-[10px] text-white/20 font-bold uppercase tracking-widest">
                {"//"} {stat.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OS Sidebars */}
      <div className="absolute top-0 left-0 w-2 h-full bg-ai-blue/5 hidden xl:block pointer-events-none">
        <div className="w-full h-1/4 bg-ai-blue/20 animate-[bounce_10s_infinite]"></div>
      </div>
      <div className="absolute top-0 right-0 w-2 h-full bg-tech-purple/5 hidden xl:block pointer-events-none">
        <div className="w-full h-1/3 bg-tech-purple/20 animate-[bounce_8s_infinite_reverse]"></div>
      </div>
    </section>
  );
}
