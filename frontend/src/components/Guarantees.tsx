'use client';

import { Check, Clock, Shield, RefreshCw, Headphones, Zap } from 'lucide-react';

const guarantees = [
  {
    icon: <Clock className="w-8 h-8" />,
    title: 'On-Time Delivery',
    description: 'We deliver your website when promised. No delays, no excuses.'
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'Secure & Safe',
    description: 'Your website is protected with enterprise-grade security.'
  },
  {
    icon: <RefreshCw className="w-8 h-8" />,
    title: '30-Day Revisions',
    description: 'Request changes until you\'re completely satisfied.'
  },
  {
    icon: <Headphones className="w-8 h-8" />,
    title: 'Dedicated Support',
    description: 'Reach us anytime. We\'re here to help.'
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: 'Fast Loading',
    description: 'Websites optimized for speed and performance.'
  },
  {
    icon: <Check className="w-8 h-8" />,
    title: 'Mobile Responsive',
    description: 'Looks great on phones, tablets, and desktops.'
  }
];

export default function Guarantees() {
  return (
    <section className="py-24 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-white/50 uppercase tracking-widest mb-4">
            Our Promise
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What You Get
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            We&apos;re committed to delivering exceptional results. Here&apos;s what sets us apart.
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
