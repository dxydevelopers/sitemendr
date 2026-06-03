'use client';

import React from 'react';

interface PricingPreviewProps {
  onStartAssessment?: (planId?: string) => void;
}

const PricingPreview: React.FC<PricingPreviewProps> = ({ onStartAssessment }) => {
  const pricingTiers = [
    {
      title: 'Foundational',
      id: 'ai_foundation',
      price: '$299',
      period: 'one_time',
      popular: false,
      features: [
        'Professional Website Setup',
        'Clear Page Structure',
        '30-Day Launch Support',
        'Responsive Interface',
        'Search Visibility Layer',
        '1-Year Managed Hosting',
      ],
      ctaText: 'Start',
      gradient: 'from-ai-blue to-tech-purple',
      action: () => onStartAssessment?.('ai_foundation'),
    },
    {
      title: 'Growth',
      id: 'pro_enhancement',
      price: '$1,299',
      period: 'one_time',
      popular: true,
      features: [
        'Senior Developer Access',
        'Custom Development',
        'Tool Integrations',
        '90-Day Launch Support',
        'Speed Improvements',
        'CMS Access',
      ],
      ctaText: 'Start',
      gradient: 'from-tech-purple to-expert-green',
      action: () => onStartAssessment?.('pro_enhancement'),
    },
    {
      title: 'Enterprise',
      id: 'enterprise',
      price: '$4,999',
      period: 'one_time',
      popular: false,
      features: [
        'Advanced Reliability Setup',
        'Business Tool Setup',
        'Dedicated Manager',
        '180-Day Launch Support',
        'Global Growth Operations',
        'Priority Fixes',
      ],
      ctaText: 'Brief Team',
      gradient: 'from-expert-green to-ai-blue',
      action: () => onStartAssessment?.('enterprise'),
    },
    {
      title: 'Integrity',
      id: 'maintenance',
      price: '$99',
      period: 'monthly',
      popular: false,
      features: [
        'Live Website Monitoring',
        'Security Improvements',
        'Availability Checks',
        '2hr Manual Fixes',
        '24/7 Incident Response',
        'Priority Support Queue',
      ],
      ctaText: 'Protect Site',
      gradient: 'from-pink-500 to-ai-blue',
      action: () => onStartAssessment?.('maintenance'),
    },
    {
      title: 'Self-Hosted',
      id: 'self_hosted',
      price: '$1,299',
      period: 'one_time',
      popular: false,
      features: [
        'Full Source Code',
        'Server Setup Files',
        'Deployment Guide',
        'Lifetime Update Path',
        'Clear Handover',
        'Self-Managed Hosting',
      ],
      ctaText: 'Self Host',
      gradient: 'from-orange-500 to-pink-500',
      action: () => onStartAssessment?.('self_hosted'),
    },
  ];

  return (
    <section id="pricing" className="py-24 relative overflow-hidden border-t border-white/5">
      {/* Background Technical Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,102,255,0.03)_0%,transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Animated Horizontal Scan */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-ai-blue/10 to-transparent animate-[scan_10s_linear_infinite]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-ai-blue/5 border border-ai-blue/20 mb-8">
            <div className="w-2 h-2 rounded-full bg-ai-blue animate-pulse"></div>
            <span className="text-[10px] font-mono font-black text-ai-blue uppercase tracking-[0.4em]">Plans Ready</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-8 text-white tracking-tighter">
            Select Your <span className="italic text-ai-blue">Investment</span>
          </h2>
          <p className="text-lg md:text-xl text-medium-gray max-w-2xl mx-auto font-medium opacity-60 italic">
            Choose the level of website, store, or support your business needs right now.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className={`group relative bg-[#0a0a0a] border transition-all duration-700 hover:-translate-y-4 flex flex-col p-6 overflow-hidden will-change-transform ${
                tier.popular ? 'border-ai-blue/50 shadow-[0_0_50px_rgba(0,102,255,0.1)]' : 'border-white/5 hover:border-white/20'
              }`}
            >
              {/* Corner Brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/10 group-hover:border-ai-blue/50 transition-colors"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10 group-hover:border-ai-blue/50 transition-colors"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/10 group-hover:border-ai-blue/50 transition-colors"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/10 group-hover:border-ai-blue/50 transition-colors"></div>

              {tier.popular && (
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-ai-blue/10 blur-2xl rounded-full animate-pulse"></div>
              )}

              <div className="mb-8 relative">
                <div className="text-[8px] font-mono font-black text-white/20 mb-2 tracking-[0.5em]">{tier.id}</div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6 font-mono">{tier.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white tracking-tighter">{tier.price}</span>
                  <span className="text-[9px] font-mono font-black text-medium-gray uppercase tracking-widest opacity-40">/{tier.period}</span>
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>

              <ul className="space-y-4 mb-8 flex-grow">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-4 text-[10px] font-mono text-medium-gray group/item">
                    <div className="w-1.5 h-1.5 rounded-full bg-ai-blue/20 mt-1 group-hover/item:bg-ai-blue transition-colors"></div>
                    <span className="group-hover/item:text-white transition-colors duration-200 opacity-60 group-hover/item:opacity-100 uppercase tracking-tighter">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={tier.action}
                className={`w-full py-6 px-8 font-mono font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-500 relative overflow-hidden border ${
                  tier.popular 
                    ? 'bg-ai-blue text-white border-ai-blue hover:bg-white hover:text-ai-blue hover:border-white' 
                    : 'bg-transparent text-white border-white/10 hover:border-white/40'
                }`}
              >
                <span className="relative z-10">{tier.ctaText}</span>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-32 pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-12 text-[9px] font-mono font-black text-medium-gray uppercase tracking-[0.4em] opacity-30">
            <span><span>Trusted by 500+ operators</span></span>
            <span><span>Secure payments</span></span>
            <span>{/* Auth_Method: E2EE */}</span>
          </div>
          <div className="flex gap-4">
            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-ai-blue animate-[loading_2s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          from { transform: translateY(0); }
          to { transform: translateY(100vh); }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
};

export default PricingPreview;
