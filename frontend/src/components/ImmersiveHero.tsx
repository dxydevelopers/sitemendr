'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, Play, Server, Shield, Cpu, Globe } from 'lucide-react';

export default function ImmersiveHero({ onStartAssessment }: { onStartAssessment: () => void }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Base Animated Background Layer */}
      <div className="absolute inset-0 z-0 animated-hero-bg pointer-events-none"></div>
      
      {/* Video Layer (optional - on top of animated background) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {!videoError && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={() => setVideoError(true)}
            className="h-full w-full object-cover opacity-20"
          >
            <source src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4" type="video/mp4" />
          </video>
        )}
      </div>


      {/* Floating Particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="hero-particle hero-particle-1"></div>
        <div className="hero-particle hero-particle-2"></div>
        <div className="hero-particle hero-particle-3"></div>
        <div className="hero-particle hero-particle-4"></div>
        <div className="hero-particle hero-particle-5"></div>
      </div>

      {/* Floating HUD Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <div className="absolute top-[20%] left-[10%] p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 animate-float opacity-80">
          <Server className="w-8 h-8 text-ai-blue mb-2" />
          <div className="h-1 w-20 bg-ai-blue/30 rounded-full overflow-hidden">
            <div className="h-full bg-ai-blue w-2/3 animate-[pulse_2s_infinite]"></div>
          </div>
        </div>
        
        <div className="absolute bottom-[20%] right-[10%] p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 animate-float-delayed opacity-80">
          <Shield className="w-8 h-8 text-expert-green mb-2" />
          <div className="font-mono text-[8px] text-expert-green">Secure Connection</div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`relative z-20 max-w-7xl mx-auto px-6 text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ai-blue opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-ai-blue"></span>
          </span>
          <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Web & Mobile Development</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-none uppercase relative">
          <span className="absolute -inset-10 bg-ai-blue/10 blur-[120px] rounded-full z-[-1] animate-pulse"></span>
          Digital <br />
          <span className="bg-gradient-to-r from-ai-blue via-tech-purple to-pink-500 bg-clip-text text-transparent italic drop-shadow-[0_0_30px_rgba(0,102,255,0.3)]">
            Solutions
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
          We engineer We build websites that help your business grow. Professional, scalable, and built for results.. <span className="text-white font-medium">Immersive, scalable, and built for the future.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
          <button 
            onClick={() => onStartAssessment()}
            className="group relative px-12 py-6 bg-white text-black font-black rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.2)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-ai-blue to-tech-purple opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <span className="flex items-center gap-3 uppercase tracking-[0.2em] text-sm relative z-10">
              Start Your Project
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          
          <Link href="/portfolio" className="group px-12 py-6 rounded-full bg-black/40 border border-white/20 text-white font-black transition-all hover:bg-white/10 hover:border-white/40 backdrop-blur-md">
            <span className="flex items-center gap-3 uppercase tracking-[0.2em] text-sm">
              <Play className="w-4 h-4 fill-white animate-pulse" />
              Watch Reel
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom Scroll HUD */}
      <div className="absolute bottom-12 left-0 w-full px-12 flex justify-between items-end z-30 pointer-events-none">
        <div className="flex flex-col gap-4 opacity-60 pointer-events-auto">
          <div className="flex items-center gap-4">
            <Globe className="w-5 h-5 text-ai-blue" />
            <span className="font-mono text-[10px] text-white tracking-widest uppercase">Systems Online</span>
          </div>
          <div className="flex items-center gap-4">
            <Cpu className="w-5 h-5 text-tech-purple" />
            <span className="font-mono text-[10px] text-white tracking-widest uppercase">Server Status: Optimal</span>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-4 animate-bounce pointer-events-auto">
          <div className="w-[1px] h-20 bg-gradient-to-t from-ai-blue to-transparent"></div>
          <span className="font-mono text-[8px] text-white uppercase tracking-[0.5em] rotate-180 [writing-mode:vertical-lr]">Scroll</span>
        </div>

        <div className="flex gap-8 opacity-60 pointer-events-auto">
           <div className="flex flex-col items-end">
             <div className="text-2xl font-black text-white leading-none mb-1">99.9%</div>
             <div className="font-mono text-[8px] text-white tracking-widest uppercase text-right">Reliability_Index</div>
           </div>
        </div>
      </div>

      {/* Bottom Line Separator */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-ai-blue/40 to-transparent z-30 pointer-events-none"></div>
    </section>
  );
}
