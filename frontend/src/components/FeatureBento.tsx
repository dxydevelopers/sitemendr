'use client';

import { useState, useRef } from 'react';
import { 
  BarChart3, 
  Cpu, 
  Globe, 
  Lock, 
  Zap,
  Smartphone
} from 'lucide-react';

export default function FeatureBento() {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Different reliable video sources
  const videoSources = [
    'https://cdn.pixabay.com/video/2020/05/25/40130-424930032_large.mp4', // Tech/abstract video
    'https://cdn.pixabay.com/video/2019/09/27/27583-365302559_large.mp4', // Digital network
  ];

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const handleVideoError = () => {
    if (currentVideoIndex < videoSources.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
    } else {
      setVideoError(true);
    }
  };

  return (
    <section className="py-24 relative z-10 overflow-hidden">
      {/* Video Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {!videoError ? (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            onError={handleVideoError}
            className="h-full w-full object-cover opacity-30"
          >
            <source src="https://cdn.pixabay.com/video/2020/05/25/40130-424930032_large.mp4" type="video/mp4" />
          </video>
        ) : (
          // Fallback animated background
          <div className="absolute inset-0 animated-bg-fallback" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
      </div>

      {/* Animated elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-ai-blue/10 rounded-full blur-[120px] animate-float-slow"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-tech-purple/10 rounded-full blur-[100px] animate-float-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-12">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter uppercase leading-none">
            The <span className="bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent italic">Core</span> Stack
          </h2>
          <p className="text-xl text-white/50 max-w-2xl font-light">
            Every layer of our software is engineered for maximum performance, security, and scalability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {/* Large Main Feature - Transparent Card */}
          <div className="md:col-span-2 lg:col-span-3 row-span-2 group relative overflow-hidden rounded-[3rem] border border-white/10 hover:border-ai-blue/40 transition-all duration-700">
            <div className="relative z-10 flex flex-col h-full p-8">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                <Cpu className="w-8 h-8 text-ai-blue" />
              </div>
              <h3 className="text-4xl font-black text-white mb-6 leading-none uppercase">Distributed <br /> Intelligence</h3>
              <p className="text-lg text-white/60 mb-8 max-w-sm">
                Our AI-driven backend automatically optimizes resource allocation across global clusters in real-time.
              </p>
              <div className="mt-auto flex items-center gap-4">
                <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-ai-blue w-3/4 animate-[shimmer_2s_infinite]"></div>
                </div>
                <span className="font-mono text-xs text-ai-blue">75% Load</span>
              </div>
            </div>
            {/* Subtle glow on hover */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-ai-blue/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </div>

          {/* Medium Feature - Transparent Card */}
          <div className="md:col-span-2 lg:col-span-3 group relative overflow-hidden rounded-[3rem] border border-white/10 hover:border-expert-green/40 transition-all duration-700">
            <div className="flex gap-8 items-start p-8">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-expert-green" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-3 uppercase">Zero-Trust Security</h3>
                <p className="text-white/50 font-light">
                  Military-grade encryption for every data packet. Compliance and security aren&apos;t features&mdash;they&apos;re our foundation.
                </p>
              </div>
            </div>
          </div>

          {/* Small Bento Items - Transparent Cards */}
          <div className="md:col-span-2 lg:col-span-3 group relative overflow-hidden rounded-[3rem] border border-white/10 hover:border-tech-purple/40 transition-all duration-700">
             <div className="flex items-center justify-between mb-8 p-8">
                <Globe className="w-8 h-8 text-tech-purple" />
                <div className="font-mono text-[10px] text-tech-purple bg-tech-purple/10 px-3 py-1 rounded-full uppercase tracking-widest">Global Edge</div>
             </div>
             <div className="px-8 pb-8">
               <h3 className="text-xl font-bold text-white uppercase mb-2">Ultra-Low Latency</h3>
               <p className="text-white/50 text-sm">Deploying content from 50+ edge nodes worldwide for sub-20ms response times.</p>
             </div>
          </div>

          <div className="md:col-span-2 lg:col-span-2 group relative overflow-hidden rounded-[3rem] border border-white/10 hover:border-ai-blue/40 transition-all duration-700">
            <div className="p-8">
              <BarChart3 className="w-10 h-10 text-ai-blue mb-6" />
              <h3 className="text-xl font-bold text-white uppercase mb-2">Real-time Analytics</h3>
              <div className="flex gap-1 h-8 items-end">
                {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8].map((h, i) => (
                  <div key={i} className="flex-1 bg-ai-blue/40 rounded-t" style={{ height: `${h * 100}%` }}></div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-2 group relative overflow-hidden rounded-[3rem] border border-white/10 hover:border-pink-500/40 transition-all duration-700">
            <div className="p-8">
              <Smartphone className="w-10 h-10 text-pink-500 mb-6" />
              <h3 className="text-xl font-bold text-white uppercase mb-2">Cross-Platform</h3>
              <p className="text-white/50 text-sm">One codebase, infinite possibilities. Native performance on Web, iOS, and Android.</p>
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-2 group relative overflow-hidden rounded-[3rem] border border-white/10 hover:border-expert-green/40 transition-all duration-700">
            <div className="p-8">
              <Zap className="w-10 h-10 text-expert-green mb-6 animate-pulse" />
              <h3 className="text-xl font-bold text-white uppercase mb-2">Instant Scale</h3>
              <p className="text-white/50 text-sm">Our infrastructure scales automatically to meet any traffic spike in milliseconds.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

