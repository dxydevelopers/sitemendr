'use client';

import { Scale, Gavel, ScrollText, AlertCircle, ChevronRight, Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TermsOfService() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const sections = [
    {
      title: 'Service Agreement',
      content: 'By accessing Sitemendr infrastructure, you agree to be bound by these protocols. Our services are provided for professional use, and users must maintain technical integrity when interacting with our systems.'
    },
    {
      title: 'Platform Usage',
      content: 'Users are granted a limited license to access and use the platform. Any attempt to reverse engineer, disrupt service, or bypass security protocols will result in immediate termination of access.'
    },
    {
      title: 'Project & Intellectual Property',
      content: 'All custom code and digital assets developed during project execution become the property of the client upon final payment, unless otherwise specified in the Deployment Contract.'
    },
    {
      title: 'Service Stability & Uptime',
      content: 'While we strive for 99.99% uptime, Sitemendr is not liable for indirect losses resulting from system maintenance, network failures, or third-party infrastructure instability.'
    },
    {
      title: 'Termination',
      content: 'We reserve the right to terminate service for any user who violates these terms or engages in activities that threaten the stability of the Sitemendr ecosystem.'
    }
  ];

  return (
    <main className="min-h-screen bg-black text-white pt-40 pb-32 relative overflow-hidden">
      {/* HUD Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-24 right-12 flex items-center gap-3">
          <Terminal className="w-4 h-4 text-ai-blue" />
          <span className="font-mono text-[8px] uppercase tracking-[0.4em]">Terms of Service</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ai-blue/5 border border-ai-blue/20 mb-8">
            <Scale className="w-4 h-4 text-ai-blue" />
            <span className="text-[10px] font-bold text-ai-blue uppercase tracking-[0.3em]">Usage Framework</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter uppercase leading-none">
            Service_ <br />
            <span className="bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent italic">Terms</span>
          </h1>

          <div className="space-y-16">
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
              <p className="text-white/60 font-mono text-xs uppercase tracking-widest leading-relaxed">
                Revision Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) /* Protocol: Standard */}
              </p>
            </div>

            {sections.map((section, i) => (
              <div key={i} className="group relative">
                <div className="flex items-start gap-8">
                  <div className="hidden md:flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-ai-blue group-hover:scale-110 transition-transform duration-500">
                      {i === 0 ? <Gavel size={20} /> : i === 1 ? <ScrollText size={20} /> : <AlertCircle size={20} />}
                    </div>
                    {i !== sections.length - 1 && <div className="w-px h-full bg-gradient-to-b from-white/10 to-transparent my-4"></div>}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                      <ChevronRight className="w-4 h-4 text-ai-blue md:hidden" />
                      {section.title}
                    </h3>
                    <p className="text-white/40 leading-relaxed font-light text-lg">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-24 p-12 rounded-[3rem] bg-white/[0.02] border border-white/10">
              <h3 className="text-2xl font-black text-white uppercase mb-8 text-center">Compliance</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Legal Jurisdiction</p>
                  <p className="text-white font-bold uppercase">Republic of Kenya</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Contact Email</p>
                  <p className="text-white font-bold uppercase">legal@sitemendr.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
