'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Play, Server, Shield, Globe, Zap, Target, TrendingUp } from 'lucide-react';

interface VideoHeroProps {
  onStartAssessment: () => void;
}

export default function VideoHero({ onStartAssessment }: VideoHeroProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeStat, setActiveStat] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
    
    // Rotate through stats
    const interval = setInterval(() => {
      setActiveStat((prev) => (prev + 1) % 6);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const stats = [
    { icon: Server, label: 'Active_Servers', value: '2,847', color: 'text-ai-blue' },
    { icon: Globe, label: 'Global_Nodes', value: '156', color: 'text-tech-purple' },
    { icon: TrendingUp, label: 'Uptime', value: '99.99%', color: 'text-expert-green' },
    { icon: Zap, label: 'Response', value: '12ms', color: 'text-pink-500' },
    { icon: Target, label: 'Accuracy', value: '99.7%', color: 'text-amber-500' },
    { icon: Shield, label: 'Security', value: 'A++', color: 'text-cyan-500' },
  ];

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      {/* CSS Animated Background - Tech Network Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 animated-network-bg" />
        
        {/* Animated grid lines */}
        <div className="absolute inset-0 grid-animation opacity-20" />
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
        </div>
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-ai-blue/20 rounded-full blur-[150px] animate-orb-1"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-tech-purple/20 rounded-full blur-[150px] animate-orb-2"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-expert-green/10 rounded-full blur-[200px] animate-orb-3"></div>
      </div>

      {/* Sophisticated Gradient Overlays for readability - No bottom gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none"></div>
      {/* Scanline effect */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px] pointer-events-none opacity-20"></div>

      {/* Floating HUD Elements - Left Side */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 z-20">
        {stats.slice(0, 3).map((stat, index) => (
          <div 
            key={stat.label}
            className={`flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-500 ${
              activeStat === index ? 'bg-white/10 border-ai-blue/30 scale-105' : 'opacity-60 hover:opacity-80'
            }`}
          >
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
            <div>
              <div className="font-mono text-xs text-white/40 uppercase tracking-widest">{stat.label}</div>
              <div className="font-mono text-lg font-bold text-white">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating HUD Elements - Right Side */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 z-20">
        {stats.slice(3, 6).map((stat, index) => (
          <div 
            key={stat.label}
            className={`flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-500 ${
              activeStat === index + 3 ? 'bg-white/10 border-ai-blue/30 scale-105' : 'opacity-60 hover:opacity-80'
            }`}
          >
            <div className="text-right">
              <div className="font-mono text-xs text-white/40 uppercase tracking-widest">{stat.label}</div>
              <div className="font-mono text-lg font-bold text-white">{stat.value}</div>
            </div>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className={`relative z-10 max-w-5xl mx-auto px-6 text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        {/* Status Badge */}
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/20 backdrop-blur-md mb-10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-expert-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-expert-green"></span>
          </span>
          <span className="font-mono text-[10px] font-bold text-white uppercase tracking-[0.25em]">System Operational</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white mb-8 tracking-tighter leading-[0.9] uppercase">
          Digital
          <span className="block bg-gradient-to-r from-ai-blue via-tech-purple to-pink-500 bg-clip-text text-transparent italic">
            Superstructure
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-white/60 mb-14 max-w-3xl mx-auto font-light leading-relaxed">
          Engineering next-generation software solutions that redefine industry standards. 
          Immersive, scalable, and built for the future of your business.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
          <button 
            onClick={() => onStartAssessment()}
            className="group relative px-10 py-5 bg-white text-black font-black rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.25)]"
          >
            <span className="flex items-center gap-3 uppercase tracking-widest text-sm">
              Start Project
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-[-20deg]"></div>
            </div>
          </button>
          
          <Link 
            href="/portfolio" 
            className="group px-10 py-5 rounded-full bg-white/5 border border-white/20 text-white font-bold transition-all hover:bg-white/10 hover:scale-105 backdrop-blur-md"
          >
            <span className="flex items-center gap-3 uppercase tracking-widest text-sm">
              <Play className="w-4 h-4 fill-white" />
              View Work
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 animate-bounce">
        <div className="w-[1px] h-16 bg-gradient-to-b from-white/30 to-transparent"></div>
        <span className="font-mono text-[8px] text-white/40 uppercase tracking-[0.4em] rotate-180 [writing-mode:vertical-lr]">Scroll</span>
      </div>

      {/* Bottom Line Separator */}
      <div className="absolute bottom-[86px] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-ai-blue/50 to-transparent z-20"></div>

      {/* Bottom Stats Bar */}
      <div className="absolute bottom-0 left-0 w-full p-6 bg-black/50 backdrop-blur-xl z-20">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-expert-green animate-pulse"></div>
              <span className="font-mono text-[10px] text-white/60 uppercase tracking-widest">All Systems Active</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-white/40">
            <span className="font-mono text-[10px]">LATENCY: 12ms</span>
            <span className="font-mono text-[10px]">|</span>
            <span className="font-mono text-[10px]">SECURE: AES-256</span>
            <span className="font-mono text-[10px]">|</span>
            <span className="font-mono text-[10px]">EDGE: 156 NODES</span>
          </div>
        </div>
      </div>
    </section>
  );
}
