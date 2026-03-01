'use client';

import { RefreshCcw, DollarSign, Ban, CheckCircle2, ChevronRight, Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function RefundPolicy() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const sections = [
    {
      title: 'Cancellations',
      content: 'Monthly and annual subscriptions can be cancelled at any time via the Client Dashboard. Access to premium infrastructure will continue until the end of the current billing cycle.'
    },
    {
      title: 'Refund Eligibility',
      content: 'Refunds for subscription services are processed if requested within 48 hours of initial deployment, provided that significant system resources have not been consumed.'
    },
    {
      title: 'Custom Project Milestones',
      content: 'Payments for custom development projects are tied to technical milestones. Completed and approved milestones are non-refundable as they represent delivered engineering hours.'
    },
    {
      title: 'Service Credits',
      content: 'In the event of significant infrastructure downtime exceeding our SLA (99.9%), clients may be eligible for service credits applied to their next billing cycle.'
    },
    {
      title: 'Processing Time',
      content: 'Approved refund requests are processed through our payment gateways (Visa, Mastercard, Paystack) and typically reflect in the original funding source within 5-10 business days.'
    }
  ];

  return (
    <main className="min-h-screen bg-black text-white pt-40 pb-32 relative overflow-hidden">
      {/* HUD Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-24 right-12 flex items-center gap-3">
          <Terminal className="w-4 h-4 text-ai-blue" />
          <span className="font-mono text-[8px] uppercase tracking-[0.4em]">Refund Policy</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ai-blue/5 border border-ai-blue/20 mb-8">
            <RefreshCcw className="w-4 h-4 text-ai-blue" />
            <span className="text-[10px] font-bold text-ai-blue uppercase tracking-[0.3em]">Billing Policy</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter uppercase leading-none">
            Refund Policy <br />
            <span className="bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent italic">Protocol</span>
          </h1>

          <div className="space-y-16">
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
              <p className="text-white/60 font-mono text-xs uppercase tracking-widest leading-relaxed">
                Refund Policy Effective: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} {'//'} Currency: USD/KES
              </p>
            </div>

            {sections.map((section, i) => (
              <div key={i} className="group relative">
                <div className="flex items-start gap-8">
                  <div className="hidden md:flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-ai-blue group-hover:scale-110 transition-transform duration-500">
                      {i === 0 ? <Ban size={20} /> : i === 1 ? <DollarSign size={20} /> : <CheckCircle2 size={20} />}
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
              <h3 className="text-2xl font-black text-white uppercase mb-4">Request a Refund</h3>
              <p className="text-white/40 font-mono text-xs uppercase tracking-widest mb-8">
                Contact our billing team to request a refund.
              </p>
              <a 
                href="mailto:billing@sitemendr.com" 
                className="inline-block px-12 py-5 bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-ai-blue hover:text-white transition-all duration-300"
              >
                Request Refund
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
