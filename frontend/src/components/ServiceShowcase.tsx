'use client';

import Link from 'next/link';
import { BrainCircuit, Code2, Settings, ArrowRight } from 'lucide-react';

export default function ServiceShowcase() {
  const services = [
    {
      title: 'AI Website Builder',
      description: 'Create beautiful, professional websites in minutes with our AI-powered builder. Perfect for small businesses and startups looking to establish their online presence quickly.',
      features: ['AI Template Creation', 'Automatic Speed Improvements', 'Smart Layout Design', 'Built-in SEO Tools'],
      icon: <BrainCircuit className="w-10 h-10" />,
      link: '/services',
      gradient: 'from-ai-blue to-tech-purple',
      status: 'Available'
    },
    {
      title: 'Custom Development',
      description: 'Need something unique? Our expert developers build custom websites and web applications tailored to your specific business requirements.',
      features: ['Custom System Builds', 'API Integration', 'Database Design', 'Custom Functionality'],
      icon: <Code2 className="w-10 h-10" />,
      link: '/services',
      gradient: 'from-tech-purple to-pink-500',
      status: 'Available'
    },
    {
      title: 'Website Maintenance',
      description: 'Keep your website running smoothly with our ongoing maintenance and support services. We handle updates, security, and performance optimization.',
      features: ['Regular Updates', 'Security Monitoring', 'Performance Optimization', 'Technical Support'],
      icon: <Settings className="w-10 h-10" />,
      link: '/services',
      gradient: 'from-expert-green to-ai-blue',
      status: 'Available'
    }
  ];

  return (
    <section id="services" className="py-24 relative overflow-hidden">
      {/* Infrastructure Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
      
      {/* Scanning Line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="w-full h-[1px] bg-ai-blue animate-scan shadow-[0_0_8px_rgba(0,102,255,0.8)]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-4 px-3 py-1 rounded bg-ai-blue/5 border border-ai-blue/20 mb-6">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ai-blue opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-ai-blue"></span>
                </span>
                <span className="font-mono text-[9px] font-bold text-ai-blue uppercase tracking-[0.3em]">Our Capabilities</span>
              </div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-none uppercase">
              Operational <br />
              <span className="bg-gradient-to-r from-ai-blue via-tech-purple to-pink-500 bg-clip-text text-transparent italic">System Parts</span>
            </h2>
            <p className="text-xl text-medium-gray leading-relaxed max-w-2xl font-mono uppercase tracking-tight opacity-70">
              Building growing digital networks that combine AI efficiency with accurate creative work.
            </p>
          </div>
          <div className="hidden md:block text-right">
            <div className="font-mono text-[9px] text-medium-gray mb-1 uppercase tracking-widest">SYSTEM_STATUS</div>
            <div className="font-mono text-sm font-black text-expert-green tracking-[0.2em] uppercase flex items-center gap-2 justify-end">
               <div className="w-2 h-2 rounded-full bg-expert-green animate-pulse"></div>
                All Systems Working
             </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              className="group relative flex flex-col h-full border border-white/5 hover:border-ai-blue/30 rounded-2xl p-8 transition-all duration-700 hover:-translate-y-4 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden will-change-transform"
            >
              {/* HUD Corner Brackets */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-white/10 group-hover:border-ai-blue/40 transition-colors"></div>
              <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/10 group-hover:border-ai-blue/40 transition-colors"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/10 group-hover:border-ai-blue/40 transition-colors"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-white/10 group-hover:border-ai-blue/40 transition-colors"></div>

              {/* Internal Technical Elements */}
              <div className="absolute top-8 right-10 font-mono text-[9px] font-bold text-white/10 group-hover:text-ai-blue/40 transition-colors tracking-widest">
                
              </div>

              {/* Card Hover Glow */}
              <div className={`absolute -inset-px bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 blur-3xl transition-opacity duration-700`}></div>
              
              <div className="relative z-10 flex flex-col h-full">
                {/* Icon & Status */}
                <div className="flex items-start justify-between mb-12">
                  <div className="relative">
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                    <div className={`relative w-20 h-20 rounded-xl bg-dark-bg border border-white/10 flex items-center justify-center text-4xl shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 group-hover:border-ai-blue/30`}>
                      {service.icon}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-[8px] text-medium-gray tracking-widest uppercase opacity-40">STATUS_LOG</span>
                    <span className={`font-mono text-[10px] font-black uppercase tracking-widest ${service.status.includes('ACTIVE') ? 'text-expert-green' : service.status.includes('HIGH') ? 'text-ai-blue' : 'text-tech-purple'}`}>
                      {service.status}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-3xl font-black text-white mb-6 leading-none tracking-tighter group-hover:translate-x-2 transition-transform duration-500 uppercase">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="font-semibold text-gray-300">
                  {service.description}
                </p>

                {/* Technical Specs List */}
                <div className="mb-12 space-y-4">
                  <div className="font-mono text-[9px] font-bold text-ai-blue mb-2 tracking-widest uppercase opacity-40">Service Features</div>
                  {service.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-center text-[10px] font-bold text-medium-gray font-mono uppercase tracking-widest group-hover:text-white transition-all duration-300">
                      <div className={`w-1 h-1 rounded-full bg-ai-blue mr-4 shadow-[0_0_8px_#0066FF]`}></div>
                      {feature}
                    </div>
                  ))}
                </div>

                {/* CTA Link */}
                <Link
                  href={service.link}
                  className="group/link relative w-full inline-flex items-center justify-between px-8 py-5 bg-ai-blue/5 border border-ai-blue/20 rounded-xl font-mono text-[9px] font-black uppercase tracking-[0.3em] text-white transition-all duration-500 hover:bg-ai-blue/10 hover:border-ai-blue/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="relative z-10">View Details</span>
                  <ArrowRight className="w-4 h-4 transform group-hover/link:translate-x-2 transition-transform duration-500 text-ai-blue" />
                  
                  {/* Button Glow Effect */}
                  <div className={`absolute inset-0 bg-ai-blue opacity-0 group-hover/link:opacity-5 blur-xl transition-opacity`}></div>
                </Link>
              </div>

              {/* Bottom Decorative Bar */}
              <div className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r ${service.gradient} w-0 group-hover:w-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,102,255,0.5)]`}></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
