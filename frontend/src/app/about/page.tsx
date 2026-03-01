'use client';

import { Terminal, Users, Target, ShieldCheck, Sparkles, Cpu, Globe, Zap, Award, Code2, Database, Cloud, Lock, ArrowRight, CheckCircle, Clock, MapPin, Mail, Phone, Linkedin, Twitter, Github, Star, Building2, Rocket, Heart, Eye, ChevronRight, Quote, Shield, Infinity, Layers2, Workflow, Puzzle, Activity, ArrowUpRight, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const values = [
    {
      icon: <Cpu className="w-6 h-6" />,
      title: 'Smart Tools',
      desc: 'Smart tools assist our team to deliver better results, faster. We combine human expertise with intelligent automation.',
      color: 'from-blue-500 to-cyan-500',
      stat: '99.9%',
      statLabel: 'Accuracy'
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: 'Data Protection',
      desc: 'Military-grade encryption and zero-trust architecture protect your digital assets.',
      color: 'from-purple-500 to-pink-500',
      stat: 'SSL',
      statLabel: 'Encryption'
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Mission Critical',
      desc: 'Every project gets our full attention and commitment to results.',
      color: 'from-orange-500 to-red-500',
      stat: '99.99%',
      statLabel: 'Uptime'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast',
      desc: 'Optimized performance with edge computing and intelligent caching strategies.',
      color: 'from-yellow-500 to-orange-500',
      stat: 'Fast Performance',
      statLabel: 'Response'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Global Scale',
      desc: 'Multi-region infrastructure with automatic failover and load balancing.',
      color: 'from-green-500 to-emerald-500',
      stat: '50+',
      statLabel: 'Regions'
    },
    {
      icon: <Code2 className="w-6 h-6" />,
      title: 'Clean Code',
      desc: 'Maintainable, testable code following industry best practices and standards.',
      color: 'from-indigo-500 to-blue-500',
      stat: '100%',
      statLabel: 'Coverage'
    }
  ];

  const timeline = [
    {
      year: '2021',
      title: 'Foundation',
      desc: 'Sitemendr established as a boutique development studio in Nairobi.',
      icon: <Building2 className="w-5 h-5" />,
      color: 'bg-blue-500'
    },
    {
      year: '2022',
      title: 'First Enterprise',
      desc: 'Secured partnership with major regional e-commerce platform.',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-purple-500'
    },
    {
      year: '2023',
      title: 'Cloud Native',
      desc: 'Migrated to cloud-native architecture with Kubernetes.',
      icon: <Cloud className="w-5 h-5" />,
      color: 'bg-cyan-500'
    },
    {
      year: '2024',
      title: 'AI Integration',
      desc: 'Launched ML-powered development and testing pipelines.',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'bg-pink-500'
    },
    {
      year: '2025',
      title: 'Global Expansion',
      desc: 'Opened operations in Europe and North America.',
      icon: <Globe className="w-5 h-5" />,
      color: 'bg-green-500'
    },
    {
      year: '2026',
      title: 'Certified Excellence',
      desc: 'Achieved ISO 27001 and SOC 2 Type II compliance.',
      icon: <Award className="w-5 h-5" />,
      color: 'bg-yellow-500'
    }
  ];

  const team = [
    {
      name: 'Engineering',
      role: 'Core Development',
      desc: 'Full-stack engineers building scalable solutions.',
      icon: <Code2 className="w-8 h-8" />,
      count: '12+',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'DevOps',
      role: 'Infrastructure',
      desc: 'Cloud architects managing production systems.',
      icon: <Database className="w-8 h-8" />,
      count: '8+',
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Security',
      role: 'Cybersecurity',
      desc: 'Security engineers ensuring hardened deployments.',
      icon: <Lock className="w-8 h-8" />,
      count: '6+',
      color: 'from-red-500 to-orange-500'
    },
    {
      name: 'AI Research',
      role: 'Innovation',
      desc: 'ML engineers developing intelligent systems.',
      icon: <Sparkles className="w-8 h-8" />,
      count: '5+',
      color: 'from-yellow-500 to-amber-500'
    }
  ];

  const technologies = [
    { name: 'React / Next.js', category: 'Frontend', icon: '⚛️' },
    { name: 'Node.js / Express', category: 'Backend', icon: '🟢' },
    { name: 'TypeScript', category: 'Languages', icon: '📘' },
    { name: 'PostgreSQL', category: 'Database', icon: '🐘' },
    { name: 'AWS / GCP', category: 'Cloud', icon: '☁️' },
    { name: 'Docker / K8s', category: 'DevOps', icon: '🐳' },
    { name: 'GraphQL', category: 'API', icon: '◈' },
    { name: 'TensorFlow', category: 'AI/ML', icon: '🧠' },
    { name: 'Redis', category: 'Caching', icon: '⚡' },
    { name: 'Nginx', category: 'Server', icon: '🔧' },
    { name: 'Jest / Cypress', category: 'Testing', icon: '✅' },
    { name: 'GitHub Actions', category: 'CI/CD', icon: '🔄' }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'CTO, TechVentures Inc.',
      content: 'Sitemendr transformed our e-commerce platform. Their neural-optimized approach increased our conversion rates by 340%. Absolutely phenomenal work.',
      rating: 5,
      avatar: 'SC'
    },
    {
      name: 'Marcus Johnson',
      role: 'Founder, DataFlow Systems',
      content: 'The mission-critical infrastructure they built has maintained 99.99% uptime for 18 months. Exceptional engineering and support.',
      rating: 5,
      avatar: 'MJ'
    },
    {
      name: 'Elena Rodriguez',
      role: 'VP Engineering, CloudScale',
      content: 'Their security-first approach gave us confidence to handle sensitive financial data. SOC 2 compliant from day one. Highly recommended.',
      rating: 5,
      avatar: 'ER'
    }
  ];

  const stats = [
    { value: '500+', label: 'Projects Delivered', icon: <CheckCircle className="w-5 h-5" />, trend: '+12%' },
    { value: '99.99%', label: 'Uptime SLA', icon: <Activity className="w-5 h-5" />, trend: 'Stable' },
    { value: '50+', label: 'Enterprise Clients', icon: <Building2 className="w-5 h-5" />, trend: '+8%' },
    { value: '24/7', label: 'Support Coverage', icon: <Users className="w-5 h-5" />, trend: 'Always' },
    { value: '3', label: 'Continents', icon: <Globe className="w-5 h-5" />, trend: 'Growing' },
    { value: 'ISO 27001', label: 'Certified', icon: <Award className="w-5 h-5" />, trend: 'Verified' }
  ];

  const tabs = [
    { id: 0, label: 'Mission', icon: <Target className="w-5 h-5" />, color: 'from-blue-500 to-cyan-500' },
    { id: 1, label: 'Vision', icon: <Eye className="w-5 h-5" />, color: 'from-purple-500 to-pink-500' },
    { id: 2, label: 'Values', icon: <Heart className="w-5 h-5" />, color: 'from-red-500 to-orange-500' }
  ];

  const tabContent = [
    {
      title: 'Our Mission',
      content: 'To architect and deploy mission-critical digital infrastructure that empowers businesses to operate with absolute confidence. We bridge the gap between complex engineering and business outcomes.',
      points: [
        'Deliver enterprise-grade infrastructure with zero compromise',
        'Empower businesses with scalable, secure solutions',
        'Maintain transparency and integrity in every engagement',
        'Continuously innovate and adapt to emerging technologies'
      ]
    },
    {
      title: 'Our Vision',
      content: 'To become the global standard for mission-critical digital infrastructure, recognized for engineering excellence, security-first architecture, and unwavering reliability.',
      points: [
        'Global recognition as premier infrastructure provider',
        'Setting industry standards for security and reliability',
        'Democratizing access to enterprise-grade technology',
        'Leading innovation in AI-powered infrastructure'
      ]
    },
    {
      title: 'Our Values',
      content: 'Our values are the foundation of every decision we make and every line of code we write. They guide our interactions and approach to excellence.',
      points: [
        'Excellence: We never settle for good enough',
        'Integrity: We do what we say, every time',
        'Innovation: We embrace change and drive progress',
        'Collaboration: We succeed together with clients'
      ]
    }
  ];

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Rapid Deployment',
      desc: 'Zero-downtime deployments with automated rollback capabilities.',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Enterprise Security',
      desc: 'End-to-end encryption with SOC 2 Type II compliance.',
      color: 'from-blue-400 to-indigo-500'
    },
    {
      icon: <Infinity className="w-8 h-8" />,
      title: 'Infinite Scale',
      desc: 'Auto-scaling infrastructure that grows with your business.',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: <Layers2 className="w-8 h-8" />,
      title: 'Modern Stack',
      desc: 'Latest technologies with long-term support guarantees.',
      color: 'from-cyan-400 to-blue-500'
    },
    {
      icon: <Workflow className="w-8 h-8" />,
      title: 'CI/CD Pipeline',
      desc: 'Automated testing, building, and deployment workflows.',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: <Puzzle className="w-8 h-8" />,
      title: 'Seamless Integration',
      desc: 'Easy integration with your existing tools and systems.',
      color: 'from-orange-400 to-red-500'
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white pt-24 pb-20 relative overflow-hidden">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-900 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        ></div>
      </div>

      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-5" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Hero Section */}
        <div className={`text-center mb-24 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 mb-8 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-[0.3em]">Origin Registry: Verified</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tight leading-none">
            Architecting
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Digital Futures</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed mb-12">
            Sitemendr is a high-performance engineering lab based in Nairobi, Kenya, 
            dedicated to building the world&apos;s most resilient digital infrastructure.
          </p>
          
          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {stats.slice(0, 3).map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="text-blue-400 group-hover:scale-110 transition-transform">{stat.icon}</div>
                  <div className="text-3xl md:text-4xl font-black text-white">{stat.value}</div>
                </div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{stat.label}</div>
                <div className="text-[9px] font-mono text-green-400 uppercase tracking-widest mt-1">{stat.trend}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission/Vision/Values Tabs */}
        <div className={`mb-24 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 md:p-12 backdrop-blur-xl">
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-full font-mono text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-blue-500/25 scale-105`
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight">
                {tabContent[activeTab].title}
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed mb-8">
                {tabContent[activeTab].content}
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {tabContent[activeTab].points.map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300 font-light">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Story Section */}
        <div className={`grid lg:grid-cols-2 gap-12 items-center mb-24 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
            <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
              <Image 
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200"
                alt="Engineering Lab"
                fill
                className="object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              
              {/* Enhanced Card Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/95 via-black/70 to-transparent backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center backdrop-blur-sm">
                    <Building2 className="w-7 h-7 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-blue-400 uppercase tracking-[0.3em] mb-1">Server Location</div>
                    <div className="text-2xl font-black uppercase tracking-tight">Nairobi HQ // Kenya</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Westlands Business District
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    EAT (UTC+3)
                  </span>
                </div>
              </div>
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -right-4 top-8 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
              <div className="text-3xl font-black text-blue-400 mb-1">24/7</div>
              <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Operations</div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
              <span className="font-mono text-[10px] font-bold text-purple-400 uppercase tracking-widest">Our Thesis</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              From Code to
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Infrastructure</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed font-light">
              Founded on the principle that the web should be as stable as physical architecture, 
              Sitemendr has evolved from a boutique development studio into a mission-critical 
              infrastructure provider. We specialize in high-conversion e-commerce engines and 
              neural-optimized SaaS platforms.
            </p>
            
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5">
              {stats.slice(3).map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{stat.label}</div>
                  <div className="text-[8px] font-mono text-green-400 uppercase tracking-widest mt-1">{stat.trend}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-4">
              <a href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
                Start Project
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="/portfolio" className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-full hover:bg-white/10 transition-all duration-300 border border-white/10">
                View Portfolio
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className={`mb-24 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <span className="font-mono text-[10px] font-bold text-blue-400 uppercase tracking-widest">Why Choose Us</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Built for <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Excellence</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-light">
              Every feature designed with your success in mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="group relative p-8 bg-white/[0.02] border border-white/10 rounded-3xl hover:border-white/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-light">
                  {feature.desc}
                </p>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowUpRight className="w-5 h-5 text-white/50" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Section */}
        <div className={`mb-24 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-6">
              <span className="font-mono text-[10px] font-bold text-pink-400 uppercase tracking-widest">Our Journey</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Evolution <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">Path</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-light">
              From humble beginnings to global infrastructure provider
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 hidden md:block"></div>
            
            <div className="space-y-12">
              {timeline.map((item, i) => (
                <div key={i} className={`relative flex items-center ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 group hover:-translate-y-1">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${item.color} mb-4 ${i % 2 === 0 ? 'md:ml-auto' : ''}`}>
                        <span className="text-white">{item.icon}</span>
                        <span className="font-mono text-[10px] font-bold text-white uppercase tracking-widest">{item.year}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-400 font-light">{item.desc}</p>
                    </div>
                  </div>
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-4 border-black hidden md:block shadow-lg shadow-blue-500/50"></div>
                  
                  <div className="flex-1 hidden md:block"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className={`mb-24 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <span className="font-mono text-[10px] font-bold text-blue-400 uppercase tracking-widest">Core Principles</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              What We <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Stand For</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-light">
              The foundation of our engineering philosophy
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, i) => (
              <div 
                key={i} 
                className="group relative p-8 bg-white/[0.02] border border-white/10 rounded-3xl hover:border-white/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-light mb-6">
                  {value.desc}
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="text-2xl font-black text-white">{value.stat}</div>
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{value.statLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className={`mb-24 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <span className="font-mono text-[10px] font-bold text-purple-400 uppercase tracking-widest">Engineering Force</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Team</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-light">
              World-class engineers building world-class infrastructure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <div 
                key={i} 
                className="group relative p-6 bg-white/[0.02] border border-white/10 rounded-3xl hover:border-white/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${member.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {member.icon}
                </div>
                <div className="text-4xl font-black text-white mb-2">{member.count}</div>
                <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">{member.role}</div>
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  {member.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className={`mb-24 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <span className="font-mono text-[10px] font-bold text-green-400 uppercase tracking-widest">Tech Stack</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Technologies <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">We Master</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-light">
              Cutting-edge tools for cutting-edge solutions
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {technologies.map((tech, i) => (
              <div 
                key={i} 
                className="group p-5 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-green-500/30 hover:bg-green-500/5 transition-all duration-300 cursor-default"
              >
                <div className="text-2xl mb-2">{tech.icon}</div>
                <div className="text-sm font-bold text-white mb-1 group-hover:text-green-400 transition-colors">{tech.name}</div>
                <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{tech.category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className={`mb-24 transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-6">
              <span className="font-mono text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Client Voices</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              What Clients <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Say</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-light">
              Trusted by industry leaders worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div 
                key={i} 
                className="group relative p-8 bg-white/[0.02] border border-white/10 rounded-3xl hover:border-white/20 transition-all duration-500 hover:-translate-y-2"
              >
                <div className="absolute top-6 right-6">
                  <Quote className="w-8 h-8 text-white/10 group-hover:text-yellow-400/20 transition-colors" />
                </div>
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 leading-relaxed mb-6 font-light">
                  &quot;{testimonial.content}&quot;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{testimonial.name}</div>
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className={`mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative p-12 md:p-20 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 rounded-[3rem] overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
            
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/25">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                Ready to Build
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Mission Critical</span>
                Infrastructure?
              </h2>
              <p className="text-lg text-gray-400 mb-10 font-light">
                Join the enterprises that trust Sitemendr for their most important digital deployments.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="/contact" className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
                  Start Your Project
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a href="/services" className="inline-flex items-center gap-2 px-10 py-5 bg-white/5 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-full hover:bg-white/10 transition-all duration-300 border border-white/10">
                  Explore Services
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Legal/Compliance Footer Info */}
        <div className="p-12 border border-white/10 bg-white/[0.02] rounded-[3rem] text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
          <h3 className="text-2xl font-black text-white mb-8 tracking-tight">Corporate Registry</h3>
          <div className="grid md:grid-cols-3 gap-8 opacity-40">
            <div className="space-y-2">
              <div className="text-[9px] font-mono uppercase tracking-[0.2em]">Entity Name</div>
              <div className="text-sm font-mono font-bold text-white uppercase tracking-tight">Sitemendr Technologies</div>
            </div>
            <div className="space-y-2">
              <div className="text-[9px] font-mono uppercase tracking-[0.2em]">Operational HQ</div>
              <div className="text-sm font-mono font-bold text-white uppercase tracking-tight">Nairobi, Kenya</div>
            </div>
            <div className="space-y-2">
              <div className="text-[9px] font-mono uppercase tracking-[0.2em]">Data Governance</div>
              <div className="text-sm font-mono font-bold text-white uppercase tracking-tight">GDPR + Kenyan DPA</div>
            </div>
          </div>
          
          {/* Contact Info */}
          <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-8">
            <a href="mailto:hello@sitemendr.com" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <Mail className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-widest">hello@sitemendr.com</span>
            </a>
            <a href="tel:+254700000000" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <Phone className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-widest">+254 700 000 000</span>
            </a>
            <a href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <Linkedin className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-widest">LinkedIn</span>
            </a>
            <a href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <Twitter className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-widest">Twitter</span>
            </a>
            <a href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <Github className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-widest">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
