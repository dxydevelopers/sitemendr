'use client';

import { useState, useEffect } from 'react';
import { Database, ShieldCheck, Activity, Terminal } from 'lucide-react';
import Image from 'next/image';

const testimonials = [
  {
    id: 'TR-001',
    quote: "Working with Sitemendr transformed our online presence. Their team delivered a beautiful, fast website that our customers love. The project was completed on time and within budget.",
    author: "Sarah Mitchell",
    company: "BrightStar Media",
    role: "CEO & Founder",
    industry: "Marketing Agency",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
    metrics: ["On-time Delivery", "Budget Met", "5.0x ROI"]
  },
  {
    id: 'TR-002',
    quote: "Our new e-commerce store looks fantastic and works perfectly. Sales have increased significantly since launch, and the checkout process is smooth and reliable.",
    author: "Marcus Rivera",
    company: "Urban Kitchen",
    role: "Founder & CEO",
    industry: "E-commerce",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    metrics: ["Sales Growth", "Fast Checkout", "95% Mobile Score"]
  },
  {
    id: 'TR-003',
    quote: "The new website perfectly captures our professional medical brand. Patients love how easy it is to book appointments online. It's made a real difference to our practice.",
    author: "Dr. Emily Chen",
    company: "Nova Health Clinic",
    role: "Medical Director",
    industry: "Healthcare",
    avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&crop=face",
    metrics: ["Easy Booking", "Patient Satisfaction", "4.9/5 Rating"]
  },
  {
    id: 'TR-004',
    quote: "We needed a professional website that reflects our commitment to quality legal services. Sitemendr delivered exactly what we needed - a modern, trustworthy online presence.",
    author: "James Patterson",
    company: "Pinnacle Law Group",
    role: "Managing Partner",
    industry: "Legal Services",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face",
    metrics: ["Professional Design", "Mobile Optimized", "Client Inquiries Up"]
  },
  {
    id: 'TR-005',
    quote: "Our new website and online ordering system have been great for our restaurant. Customers love the easy reservation system and the beautiful menu showcase.",
    author: "Isabella Romano",
    company: "Bella Vista Trattoria",
    role: "Owner & Chef",
    industry: "Hospitality",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
    metrics: ["Easy Reservations", "Online Ordering", "Customer Praise"]
  }
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Technical Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03]"></div>
      
      {/* Scanning Line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02]">
        <div className="w-full h-[1px] bg-ai-blue animate-scan shadow-[0_0_8px_rgba(0,102,255,0.8)]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header with OS Style */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 px-3 py-1 rounded bg-ai-blue/5 border border-ai-blue/20 mb-6">
              <Database className="w-3 h-3 text-ai-blue" />
              <span className="font-mono text-[9px] font-bold text-ai-blue uppercase tracking-[0.3em]">Verified Customer Reviews</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-none uppercase">
              Operational <br />
              <span className="bg-gradient-to-r from-ai-blue via-tech-purple to-pink-500 bg-clip-text text-transparent italic text-6xl md:text-8xl">Feedback</span>
            </h2>
            <p className="text-lg text-medium-gray leading-relaxed max-w-xl font-mono uppercase tracking-tight opacity-60">
              Verified performance metrics and system impact assessments from our global deployment network.
            </p>
          </div>
          
          {/* Satisfaction Metric Panel */}
          <div className="bg-white/[0.02] border border-white/10 p-6 rounded-3xl backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-ai-blue/40 group-hover:bg-ai-blue transition-colors"></div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <div className="text-4xl font-black text-white tracking-tighter leading-none mb-1">4.98</div>
                <div className="font-mono text-[8px] text-ai-blue font-bold uppercase tracking-widest">Customer Satisfaction</div>
              </div>
              <div className="w-px h-12 bg-white/10"></div>
              <div className="flex gap-1 text-ai-blue/40">
                {[...Array(5)].map((_, i) => (
                  <ShieldCheck key={i} className="w-4 h-4 fill-ai-blue/10" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial Carousel - Technical Frame */}
        <div className="relative max-w-6xl mx-auto">
          {/* HUD Brackets */}
          <div className="absolute -top-6 -left-6 w-12 h-12 border-t-2 border-l-2 border-white/5 pointer-events-none"></div>
          <div className="absolute -top-6 -right-6 w-12 h-12 border-t-2 border-r-2 border-white/5 pointer-events-none"></div>
          <div className="absolute -bottom-6 -left-6 w-12 h-12 border-b-2 border-l-2 border-white/5 pointer-events-none"></div>
          <div className="absolute -bottom-6 -right-6 w-12 h-12 border-b-2 border-r-2 border-white/5 pointer-events-none"></div>

          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0a0a0a] border border-white/5 shadow-2xl">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((t, index) => (
                <div key={index} className="w-full flex-shrink-0 p-8 md:p-12 relative">
                  {/* Decorative ID Watermark */}
                  <div className="absolute top-8 right-12 font-mono text-[100px] font-black text-white/[0.02] leading-none pointer-events-none uppercase">
                    {t.id.split('-')[1]}
                  </div>

                  <div className="grid md:grid-cols-[1fr_300px] gap-12 items-start relative z-10">
                    {/* Quote Content */}
                    <div>
                      <Terminal className="w-8 h-8 text-ai-blue/30 mb-8" />
                      <blockquote className="text-2xl md:text-3xl lg:text-4xl text-white font-bold leading-tight tracking-tight mb-8 italic uppercase">
                        &quot;{t.quote}&quot;
                      </blockquote>

                      {/* Performance Metrics */}
                      <div className="flex flex-wrap gap-4">
                        {t.metrics.map((metric, i) => (
                          <div key={i} className="px-5 py-3 bg-white/[0.03] border border-white/10 rounded-xl flex items-center gap-3 group/metric hover:border-ai-blue/40 transition-colors">
                            <Activity className="w-3 h-3 text-ai-blue opacity-50 group-hover/metric:opacity-100" />
                            <span className="text-[10px] font-mono font-bold text-medium-gray group-hover/metric:text-white uppercase tracking-widest">{metric}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Author Profile Card */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-ai-blue/20 to-transparent"></div>
                      
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-ai-blue blur-2xl opacity-10 rounded-full group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-white/10 rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-2xl">
                          <Image
                            src={t.avatar}
                            alt={t.author}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                          />
                        </div>
                        {/* Frame HUD */}
                        <div className="absolute -top-2 -right-2 w-6 h-6 border-t border-r border-ai-blue/40"></div>
                        <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b border-l border-ai-blue/40"></div>
                      </div>
                      
                      <h4 className="text-xl font-black text-white mb-1 uppercase tracking-tighter">{t.author}</h4>
                      <p className="text-ai-blue font-mono text-[9px] font-bold mb-4 uppercase tracking-[0.2em]">{t.role}</p>
                      
                      <div className="w-full pt-6 border-t border-white/5 flex flex-col items-center gap-2">
                         <span className="font-mono text-[8px] text-white/30 uppercase tracking-widest">ENTITY_NODE</span>
                         <span className="text-xs font-bold text-white/70 uppercase tracking-tight">{t.company}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls - Minimalist HUD Style */}
          <div className="flex items-center justify-between mt-8 px-6">
            <div className="flex gap-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`h-1 transition-all duration-500 ${
                    index === currentIndex 
                      ? 'bg-ai-blue w-12' 
                      : 'bg-white/10 w-6 hover:bg-white/30'
                  }`}
                  aria-label={`Buffer ${index + 1}`}
                />
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={prevTestimonial}
                className="w-14 h-14 bg-white/[0.02] border border-white/5 hover:border-ai-blue/30 rounded-2xl flex items-center justify-center text-white transition-all group"
              >
                <Terminal className="w-5 h-5 text-white/20 group-hover:text-ai-blue transition-colors" />
              </button>
              <button
                onClick={nextTestimonial}
                className="w-14 h-14 bg-white/[0.02] border border-white/5 hover:border-ai-blue/30 rounded-2xl flex items-center justify-center text-white transition-all group"
              >
                <Terminal className="w-5 h-5 text-white/20 group-hover:text-ai-blue rotate-180 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid - High Density Infrastructure Style */}
        <div className="mt-16 pt-12 border-t border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-12">
          {[
            { label: 'Network Throughput', value: '500+', sub: 'DEPLOYED_NODES' },
            { label: 'System Retention', value: '98%', sub: 'UPTIME_STABILITY' },
            { label: 'Average Latency', value: '24ms', sub: 'RESPONSE_SYNC' },
            { label: 'Security Compliance', value: '100%', sub: 'ENCRYPTION_PASS' }
          ].map((stat, i) => (
            <div key={i} className="group cursor-default">
              <div className="font-mono text-[8px] font-bold text-ai-blue uppercase tracking-[0.3em] mb-4 opacity-40 group-hover:opacity-100 transition-opacity">
                {stat.label}
              </div>
              <div className="text-5xl font-black text-white group-hover:text-ai-blue transition-colors tracking-tighter leading-none mb-2">
                {stat.value}
              </div>
              <div className="font-mono text-[9px] text-white/20 font-bold uppercase tracking-widest group-hover:text-white/40 transition-colors">
                {/* // {stat.sub} */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
