'use client';

import { Shield, Lock, Eye, FileText, ChevronRight, Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PrivacyPolicy() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const sections = [
    {
      title: 'Information We Collect',
      content: 'We collect information necessary to provide high-performance digital services. This includes identity data (name, email), technical data (IP address, browser type), and usage data regarding how you interact with our infrastructure.'
    },
    {
      title: 'How We Use Your Data',
      content: 'Information is processed to maintain system stability, optimize user experience, and provide mission-critical support. We use neural optimization patterns to ensure data is handled with maximum efficiency.'
    },
    {
      title: 'Data Security',
      content: 'All data at rest and in transit is protected by 256-bit AES encryption. Our security protocols are regularly audited to ensure compliance with global safety standards.'
    },
    {
      title: 'Third-Party Services',
      content: 'We do not sell your data. External connections are only established with verified infrastructure partners necessary for service delivery (e.g., payment processors, cloud hosting).'
    },
    {
      title: 'Your Rights',
      content: 'You retain full control over your data registry. You may request access, rectification, or deletion of your information at any time via the Support Center.'
    }
  ];

  return (
    <main className="min-h-screen bg-black text-white pt-40 pb-32 relative overflow-hidden">
      {/* HUD Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-24 right-12 flex items-center gap-3">
          <Terminal className="w-4 h-4 text-ai-blue" />
          <span className="font-mono text-[8px] uppercase tracking-[0.4em]">Privacy Policy</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ai-blue/5 border border-ai-blue/20 mb-8">
            <Shield className="w-4 h-4 text-ai-blue" />
            <span className="text-[10px] font-bold text-ai-blue uppercase tracking-[0.3em]">Privacy Policy</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter uppercase leading-none">
            Privacy_ <br />
            <span className="bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent italic">Registry</span>
          </h1>

          <div className="space-y-16">
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
              <p className="text-white/60 font-mono text-xs uppercase tracking-widest leading-relaxed">
                Last Modified: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} {'//'} Status: Active
              </p>
            </div>

            {sections.map((section, i) => (
              <div key={i} className="group relative">
                <div className="flex items-start gap-8">
                  <div className="hidden md:flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-ai-blue group-hover:scale-110 transition-transform duration-500">
                      {i === 0 ? <Eye size={20} /> : i === 1 ? <FileText size={20} /> : <Lock size={20} />}
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

            <div className="mt-24 p-12 rounded-[3rem] bg-gradient-to-br from-ai-blue/10 to-transparent border border-white/10 text-center">
              <h3 className="text-2xl font-black text-white uppercase mb-4">Contact the Privacy Officer</h3>
              <p className="text-white/40 font-mono text-xs uppercase tracking-widest mb-8">
                For data-related inquiries, contact the Data Protection Officer.
              </p>
              <a 
                href="mailto:privacy@sitemendr.com" 
                className="inline-block px-12 py-5 bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-ai-blue hover:text-white transition-all duration-300"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
