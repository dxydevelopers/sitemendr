'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Terminal, Cpu, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function PortfolioHero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const stats = [
    { label: 'Projects Delivered', value: '16+', icon: <Cpu className="w-5 h-5" /> },
    { label: 'Client Satisfaction', value: '98%', icon: <Sparkles className="w-5 h-5" /> },
    { label: 'Uptime Guarantee', value: '99.9%', icon: <ShieldCheck className="w-5 h-5" /> },
    { label: 'Industries Served', value: '8+', icon: <Terminal className="w-5 h-5" /> }
  ];

  return (
    <section className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover opacity-30 scale-105 animate-slow-zoom"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-server-room-22700-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,102,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-32">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
              <Sparkles className="w-4 h-4 text-ai-blue" />
              <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Portfolio Showcase</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter uppercase leading-none">
              Project <span className="bg-gradient-to-r from-ai-blue via-tech-purple to-pink-500 bg-clip-text text-transparent italic">Archive</span>
            </h1>
            <p className="text-xl text-white/50 max-w-3xl mx-auto font-light leading-relaxed">
              Explore our portfolio of high-performance digital solutions that have transformed businesses worldwide.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="group relative p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl hover:border-ai-blue/40 transition-all duration-500 cursor-pointer overflow-hidden"
              >
                <div className="relative z-10 flex items-center gap-4">
                  <div className="p-3 bg-ai-blue/10 rounded-xl border border-ai-blue/20 text-ai-blue group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className="text-3xl font-black text-white uppercase tracking-tight">{stat.value}</div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-ai-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ))}
          </div>

          {/* Featured Project Preview */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-ai-blue to-tech-purple rounded-[3rem] blur opacity-20 group-hover:opacity-60 transition-opacity duration-1000"></div>
            <div className="relative bg-white/[0.02] border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl overflow-hidden">
              {/* Background Image */}
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                <Image
                  src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=800&fit=crop&crop=center"
                  alt="Featured Project"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-tech-purple/10 border border-tech-purple/20 mb-6">
                    <span className="font-mono text-[10px] font-bold text-tech-purple uppercase tracking-widest">Featured Case Study</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter uppercase leading-none">
                    E-Commerce <span className="text-ai-blue">Revolution</span>
                  </h2>
                  <p className="text-lg text-white/60 leading-relaxed mb-8 font-light">
                    Transformed a traditional retail business into a high-converting e-commerce platform, 
                    increasing online sales by 340% within 6 months.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-bold text-white/60 uppercase tracking-widest">React</span>
                    <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-bold text-white/60 uppercase tracking-widest">Node.js</span>
                    <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-bold text-white/60 uppercase tracking-widest">AWS</span>
                    <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-bold text-white/60 uppercase tracking-widest">Stripe</span>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-ai-blue/20 to-tech-purple/20 rounded-2xl border border-white/10 overflow-hidden group-hover:scale-105 transition-transform duration-700">
                    <Image
                      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&crop=center"
                      alt="E-commerce Dashboard"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-6 left-6">
                      <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Project Preview</div>
                      <div className="text-sm font-bold text-white uppercase tracking-tight">Live Demo</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}