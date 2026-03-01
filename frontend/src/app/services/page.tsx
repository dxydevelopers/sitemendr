'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DataStream from '@/components/DataStream';
import { 
  Rocket, 
  Code, 
  Building2, 
  Wrench, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Cpu, 
  Globe, 
  ChevronRight,
  Sparkles,
  Users,
  Terminal
} from 'lucide-react';

export default function Services() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeProcess, setActiveProcess] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const services = [
    {
      id: 'ai',
      icon: Rocket,
      title: 'Starter Website',
      subtitle: 'Quick Launch',
      price: 'USD 299',
      description: 'Get online fast with a professionally designed website. Our streamlined process delivers a beautiful, SEO-optimized site in days.',
      features: [
        'Launch your website quickly with AI-assisted design',
        'Built-in SEO to help you rank on Google',
        'Fast performance with modern technology',
        'Your site deployed to the cloud',
        'We monitor your site 24/7'
      ],
      ctaText: 'Start Assessment',
      ctaLink: '/?plan=PROTOCOL_A',
      gradient: 'from-ai-blue to-tech-purple',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop&crop=center'
    },
    {
      id: 'custom',
      icon: Code,
      title: 'Custom Development',
      subtitle: 'Custom Solutions',
      price: 'USD 1,299',
      description: 'Built for businesses that need custom features and integrations. We develop scalable web applications that solve real problems.',
      features: [
        'Work directly with a dedicated developer',
        'Connect to your existing tools and APIs',
        'Full-stack scalability',
        'Priority feature roadmap',
        'Technical staff handover'
      ],
      ctaText: 'Custom Project',
      ctaLink: '/?plan=PROTOCOL_B',
      gradient: 'from-tech-purple to-pink-500',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop&crop=center'
    },
    {
      id: 'ecommerce',
      icon: Building2,
      title: 'Enterprise',
      subtitle: 'Global Operations',
      price: 'USD 4,999+',
      description: 'Full-scale infrastructure development for high-traffic networks and mission-critical systems.',
      features: [
        'Distributed cloud systems',
        'Enterprise-grade security',
        'Dedicated project lead',
        'SLA-backed maintenance',
        'Legacy system migration'
      ],
      ctaText: 'Get Quote',
      ctaLink: '/?plan=PROTOCOL_C',
      gradient: 'from-expert-green to-ai-blue',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop&crop=center'
    },
    {
      id: 'maintenance',
      icon: Wrench,
      title: 'Maintenance Plans',
      subtitle: 'Ongoing Support',
      price: 'USD 99/mo',
      description: 'Keep your website running smoothly with our maintenance plans. Regular updates, security patches, and instant support.',
      features: [
        'Bi-weekly security audits',
        'Performance optimization',
        'Instant bug resolution',
        'Database health checks',
        'Unlimited content updates'
      ],
      ctaText: 'View Plans',
      ctaLink: '/?plan=PROTOCOL_D',
      gradient: 'from-pink-500 to-ai-blue',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop&crop=center'
    },
    {
      id: 'self-hosted',
      icon: Cpu,
      title: 'Self-Hosted Solutions',
      subtitle: 'Full Control',
      price: 'USD 1,299',
      description: 'Get full ownership of your website with self-hosted solutions. We deliver the source code and help you set up on your own servers.',
      features: [
        'Full access to your website files',
        'Deployment in modern containers',
        'Complete setup documentation',
        'Technical staff training',
        'Lifetime license keys'
      ],
      ctaText: 'Go Private',
      ctaLink: '/?plan=PROTOCOL_E',
      gradient: 'from-orange-500 to-pink-500',
      image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=250&fit=crop&crop=center'
    }
  ];

  const processFlow = [
    {
      title: 'Analysis Phase',
      description: 'Our AI agents scan your business requirements to map the optimal technical architecture.',
      icon: Cpu,
      videoLabel: 'SCANNING_LOGIC.exe'
    },
    {
      title: 'Rapid Prototyping',
      description: 'Instant visual rendering of core systems for early validation and user flow mapping.',
      icon: Sparkles,
      videoLabel: 'GEN_INTERFACE.obj'
    },
    {
      title: 'Expert Refinement',
      description: 'Lead engineers harden the code and integrate advanced custom functionality.',
      icon: Code,
      videoLabel: 'HARDENING_CODE.bin'
    },
    {
      title: 'Global Deployment',
      description: 'Global distribution for fast loading worldwide.',
      icon: Globe,
      videoLabel: 'DEPLOY_SYNC.sys'
    }
  ];

  const benefits = [
    {
      title: 'Security First',
      description: 'Every line of code undergoes automated security scanning.',
      icon: ShieldCheck
    },
    {
      title: 'Unmatched Speed',
      description: 'Optimized for Core Web Vitals and sub-second load times.',
      icon: Zap
    },
    {
      title: '24/7 Monitoring',
      description: 'Real-time infrastructure watching with instant alerts.',
      icon: Activity
    }
  ];

  return (
    <main className="min-h-screen bg-black text-white selection:bg-ai-blue/30 relative overflow-hidden">
      {/* Immersive Background Layer */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover opacity-40 scale-105 animate-slow-zoom"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-server-room-12629-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
        
        {/* Technical Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-48 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                <Terminal className="w-4 h-4 text-ai-blue" />
                <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Our Services</span>
              </div>
              
              <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tighter uppercase leading-[0.85]">
                Engineering <br />
                <span className="bg-gradient-to-r from-ai-blue via-tech-purple to-pink-500 bg-clip-text text-transparent italic drop-shadow-[0_0_30px_rgba(0,102,255,0.3)]">
                  Digital Solutions
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto font-light leading-relaxed mb-12">
                We build websites and web applications that help your business grow. Professional development tailored to your needs.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link href="/contact" className="group relative px-10 py-5 bg-white text-black font-black rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                  <span className="flex items-center gap-3 uppercase tracking-widest text-sm">
                    Get Started
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                
                <div className="flex items-center gap-4 px-8 py-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gradient-to-br from-ai-blue to-tech-purple"></div>
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Global Operations</div>
                    <div className="text-xs font-bold text-white uppercase tracking-tighter">Active Network</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are - Mission Section */}
      <section className="relative z-10 py-40 border-y border-white/5 bg-white/[0.01] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="relative">
              {/* Decorative HUD Element */}
              <div className="absolute -top-12 -left-12 w-32 h-32 border-t-2 border-l-2 border-ai-blue/20 opacity-40"></div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="relative aspect-square bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-end group overflow-hidden hover:border-ai-blue/40 transition-all duration-500">
                    {/* Background Image */}
                    <Image
                      src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=400&fit=crop&crop=center"
                      alt="Server deployments"
                      fill
                      className="object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <Users className="w-12 h-12 text-ai-blue mb-4 group-hover:scale-110 transition-transform relative z-10" />
                    <div className="text-4xl font-black mb-1 relative z-10">500+</div>
                    <div className="text-[10px] font-mono uppercase text-white/40 tracking-[0.2em] relative z-10">Projects Completed</div>
                  </div>
                  <div className="relative h-48 bg-gradient-to-br from-ai-blue/10 to-transparent rounded-[2rem] border border-white/10 p-8 flex flex-col justify-between overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop&crop=center"
                      alt="Network infrastructure"
                      fill
                      className="object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-ai-blue/20 to-transparent rounded-[2rem]"></div>
                    <div className="text-[8px] font-mono text-ai-blue uppercase tracking-[0.4em] relative z-10">Server Status</div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
                      <div className="h-full bg-ai-blue w-full animate-pulse"></div>
                    </div>
                    <div className="text-lg font-bold uppercase tracking-tighter relative z-10">Systems Operational</div>
                  </div>
                </div>
                <div className="space-y-6 pt-12">
                  <div className="relative h-48 bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden hover:border-tech-purple/40 transition-all duration-500">
                    <Image
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=200&fit=crop&crop=center"
                      alt="Support team"
                      fill
                      className="object-cover opacity-20 group-hover:opacity-40 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-tech-purple/10 to-transparent rounded-[2rem]"></div>
                    <div className="text-4xl font-black mb-1 relative z-10">24/7</div>
                    <div className="text-[10px] font-mono uppercase text-white/40 tracking-[0.2em] relative z-10">Active Support</div>
                    <div className="flex gap-1 relative z-10">
                      {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-1 bg-tech-purple/40 rounded-full"></div>)}
                    </div>
                  </div>
                  <div className="relative aspect-square bg-gradient-to-bl from-tech-purple/10 to-transparent rounded-[2.5rem] border border-white/10 p-8 flex flex-col justify-end group overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop&crop=center"
                      alt="Uptime statistics"
                      fill
                      className="object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <Cpu className="w-12 h-12 text-tech-purple mb-4 group-hover:rotate-90 transition-transform duration-700 relative z-10" />
                    <div className="text-4xl font-black mb-1">99.9%</div>
                    <div className="text-[10px] font-mono uppercase text-white/40 tracking-[0.2em]">Uptime SLA</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-tech-purple/10 border border-tech-purple/20 mb-8">
                <span className="font-mono text-[10px] font-bold text-tech-purple uppercase tracking-widest">Enterprise Solutions</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter uppercase italic leading-none">
                Beyond Standard <br />
                <span className="text-ai-blue">Engineering.</span>
              </h2>
              <p className="text-xl text-white/50 leading-relaxed mb-10 font-light">
                We don&apos;t just build websites; we engineer digital fortresses. Our mission is to provide businesses with the technical leverage required to dominate their respective markets through superior performance and unwavering reliability.
              </p>
              <div className="grid gap-6">
                {[
                  { title: 'Full-Stack Resilience', desc: 'Every system is built with multiple redundancy layers to ensure 100% operational continuity.', icon: ShieldCheck },
                  { title: 'Cognitive Architecture', desc: 'Our software adapts to user behavior in real-time, optimizing conversion flows automatically.', icon: Sparkles }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 p-8 bg-white/[0.02] border border-white/10 rounded-3xl hover:bg-white/[0.04] transition-colors group">
                    <div className="p-4 rounded-2xl bg-white/5 text-ai-blue group-hover:scale-110 transition-transform">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-lg mb-2 uppercase tracking-tight">{item.title}</div>
                      <div className="text-sm text-white/40 leading-relaxed font-light">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Services Grid Section */}
      <section className="relative z-10 py-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-32">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-ai-blue/10 border border-ai-blue/20 mb-8">
              <span className="font-mono text-[10px] font-bold text-ai-blue uppercase tracking-widest">Pricing Plans</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter uppercase leading-none">
              Service <span className="bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent italic">Matrix</span>
            </h2>
            <p className="text-xl text-white/40 max-w-2xl mx-auto font-light">
              Choose the perfect plan for your project. All plans include dedicated support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  id={service.id}
                  className="group relative bg-white/[0.02] border border-white/10 rounded-[3rem] p-6 transition-all duration-700 hover:-translate-y-4 hover:border-ai-blue/40 flex flex-col shadow-2xl overflow-hidden backdrop-blur-xl"
                >
                  {/* Card Image */}
                  <div className="relative h-40 -mx-6 -mt-6 mb-6 overflow-hidden rounded-t-[3rem]">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-black/80"></div>
                    {/* HUD Brackets for Image */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-white/20 group-hover:border-ai-blue/60 transition-colors"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-white/20 group-hover:border-ai-blue/60 transition-colors"></div>
                  </div>
                  
                  {/* Card Glow Effect */}
                  <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-20 blur-[80px] transition-opacity duration-700`}></div>
                  
                  {/* HUD Brackets */}
                  <div className="absolute bottom-8 right-8 w-6 h-6 border-b border-r border-white/10 group-hover:border-ai-blue/40 transition-colors"></div>
                  
                  <div className="relative w-16 h-16 mb-6 flex items-center justify-center -mt-2">
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`}></div>
                    <div className="relative z-10 p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                
                  <div className="mb-6">
                    <div className="text-[10px] font-mono text-ai-blue uppercase tracking-[0.3em] mb-2 opacity-60">Tier_0{index + 1}</div>
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase leading-none">{service.title}</h3>
                    <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest font-mono">{service.subtitle}</div>
                  </div>

                  <div className="mb-6 flex items-baseline gap-2">
                    <div className={`text-4xl font-black bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent tracking-tighter`}>{service.price}</div>
                    {service.id === 'maintenance' && <span className="text-[10px] font-mono opacity-30 uppercase">/cycle</span>}
                  </div>

                  <p className="text-white/50 text-sm leading-relaxed mb-8 flex-grow font-light">
                    {service.description}
                  </p>

                  <div className="space-y-3 mb-8">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-4 group/item">
                        <div className="w-1 h-1 rounded-full bg-ai-blue group-hover/item:scale-150 transition-transform"></div>
                        <span className="text-[10px] font-mono text-white/40 uppercase tracking-tighter group-hover/item:text-white transition-colors">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={service.id === 'maintenance' ? '/contact' : service.ctaLink}
                    className={`w-full py-5 rounded-2xl font-black text-[11px] font-mono uppercase tracking-[0.3em] text-center transition-all duration-500 transform active:scale-95 border ${
                      service.id === 'custom'
                        ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.15)]'
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {service.id === 'maintenance' ? 'Get Started' : service.ctaText}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Flow with Data Stream Integration */}
      <section className="relative z-10 py-40 bg-white/[0.01] border-y border-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-32 gap-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-expert-green/10 border border-expert-green/20 mb-8">
                <span className="font-mono text-[10px] font-bold text-expert-green uppercase tracking-widest">Ongoing Optimization</span>
              </div>
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none">
                Deployment <br />
                <span className="text-ai-blue">Deployment Process</span>
              </h2>
            </div>
            <div className="max-w-md text-right">
              <p className="text-lg text-white/40 font-light leading-relaxed">
                Our proprietary deployment pipeline ensures zero-latency transitions from conceptual architecture to global production.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-6">
              {processFlow.map((step, index) => (
                <div
                  key={index}
                  onMouseEnter={() => setActiveProcess(index)}
                  className={`group cursor-pointer transition-all duration-500 p-8 rounded-[2rem] border ${
                    activeProcess === index 
                      ? 'bg-white/[0.04] border-ai-blue/40 translate-x-4' 
                      : 'bg-transparent border-white/5 opacity-40 hover:opacity-100'
                  }`}
                >
                  <div className="flex gap-8 items-start">
                    <div className={`p-5 rounded-2xl transition-colors duration-500 ${activeProcess === index ? 'bg-ai-blue text-white' : 'bg-white/5 text-white/40'}`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-[10px] text-ai-blue font-bold tracking-[0.3em]">PHASE_0{index + 1}</span>
                        <div className="h-[1px] w-8 bg-white/10"></div>
                        <span className="font-mono text-[8px] text-white/20 uppercase tracking-widest">{step.videoLabel}</span>
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">{step.title}</h3>
                      <p className="text-sm text-white/40 leading-relaxed font-light">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative aspect-square sticky top-40">
              <div className="absolute inset-0 bg-gradient-to-br from-ai-blue/20 to-tech-purple/20 rounded-[3rem] blur-3xl opacity-30 animate-pulse"></div>
              <div className="relative h-full w-full bg-black/50 border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-3xl group">
                <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity">
                  <DataStream activeStep={activeProcess} />
                </div>
                
                {/* HUD Overlay for Data Stream */}
                <div className="absolute inset-8 border border-white/5 pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-[1px] bg-ai-blue"></div>
                  <div className="absolute top-0 left-0 w-[1px] h-8 bg-ai-blue"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-ai-blue"></div>
                  <div className="absolute bottom-0 right-0 w-[1px] h-8 bg-ai-blue"></div>
                </div>

                <div className="absolute bottom-12 left-12 right-12">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[8px] font-mono text-ai-blue uppercase tracking-[0.5em] mb-2 animate-pulse">Loading...</div>
                      <div className="text-xl font-black uppercase tracking-widest">Ready</div>
                    </div>
                    <div className="text-[10px] font-mono text-white/20">LOG_v4.2.0</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Benefits */}
      <section className="relative z-10 py-40 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {benefits.map((benefit, i) => (
              <div key={i} className="relative p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/10 hover:border-ai-blue/20 transition-all group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-ai-blue/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <benefit.icon className="w-12 h-12 text-ai-blue mb-8 group-hover:scale-110 transition-transform duration-500" />
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">{benefit.title}</h3>
                <p className="text-white/40 leading-relaxed font-light">{benefit.description}</p>
                <div className="mt-8 flex items-center gap-2">
                  <div className="h-[1px] flex-grow bg-white/5"></div>
                  <div className="w-2 h-2 rounded-full bg-ai-blue/40"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-40 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative p-20 rounded-[4rem] bg-gradient-to-br from-ai-blue/20 via-tech-purple/20 to-pink-500/20 border border-white/10 text-center backdrop-blur-3xl overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
            
            <h2 className="relative z-10 text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter uppercase italic leading-none">
              Ready for <br />
              <span className="text-ai-blue">Ascension?</span>
            </h2>
            <p className="relative z-10 text-xl text-white/60 mb-12 max-w-2xl mx-auto font-light">
              Connect with our engineering team to begin the implementation of your high-performance digital ecosystem.
            </p>
            
            <div className="relative z-10 flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/contact" className="px-12 py-6 bg-white text-black font-black rounded-2xl uppercase tracking-[0.3em] text-xs hover:scale-105 transition-transform">
                Initiate Project
              </Link>
              <button className="px-12 py-6 bg-white/5 border border-white/10 text-white font-black rounded-2xl uppercase tracking-[0.3em] text-xs hover:bg-white/10 transition-all backdrop-blur-md">
                View Documentation
              </button>
            </div>

            {/* Background HUD Graphics */}
            <div className="absolute top-12 left-12 w-24 h-24 border-t border-l border-white/10"></div>
            <div className="absolute bottom-12 right-12 w-24 h-24 border-b border-r border-white/10"></div>
          </div>
        </div>
      </section>

      {/* Footer Bottom Technical Text */}
      <div className="relative z-10 pb-12 text-center">
        <div className="flex justify-center gap-12 font-mono text-[8px] font-bold text-white/20 uppercase tracking-[0.5em]">
          <span>Network: Active</span>
          <span>Auth: Verified</span>
          <span>Latency: 12ms</span>
        </div>
      </div>
    </main>
  );
}
