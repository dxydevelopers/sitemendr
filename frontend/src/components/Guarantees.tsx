'use client';

import { Check, Clock, Shield, RefreshCw, Headphones, Zap } from 'lucide-react';

const guarantees = [
  {
    icon: <Clock className="w-8 h-8" />,
    title: 'Timeline Discipline',
    description: 'Milestones are scoped, tracked, and moved through a controlled delivery cadence.'
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'Security Hardening',
    description: 'Infrastructure is reviewed against practical attack surfaces and operational risk.'
  },
  {
    icon: <RefreshCw className="w-8 h-8" />,
    title: 'Refinement Window',
    description: 'Post-build adjustments keep the final system aligned with the approved brief.'
  },
  {
    icon: <Headphones className="w-8 h-8" />,
    title: 'Operational Continuity',
    description: 'Support remains available after launch for stability, clarity, and incident response.'
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: 'High-Velocity Performance',
    description: 'Websites are tuned to feel fast, responsive, and easy for visitors to use.'
  },
  {
    icon: <Check className="w-8 h-8" />,
    title: 'Interface Integrity',
    description: 'Layouts are validated across key device classes for a consistent operational surface.'
  }
];

export default function Guarantees() {
  return (
    <section className="py-24 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-white/50 uppercase tracking-widest mb-4">
            Integrity Commitments
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Operational Assurances
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Every engagement is framed around delivery discipline, resilience, and long-term system confidence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guarantees.map((item, index) => (
            <div 
              key={index}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-ai-blue/10 flex items-center justify-center text-ai-blue mb-4">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-white/60 text-sm">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
