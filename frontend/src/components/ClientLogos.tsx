'use client';

import { useState, useEffect } from 'react';

const clients = [
  { name: 'BrightStar Media', color: 'from-pink-500 to-rose-500' },
  { name: 'Summit Consulting', color: 'from-blue-500 to-cyan-500' },
  { name: 'Apex Dynamics', color: 'from-purple-500 to-violet-500' },
  { name: 'Nova Health', color: 'from-green-500 to-emerald-500' },
  { name: 'Urban Kitchen', color: 'from-orange-500 to-amber-500' },
  { name: 'Pinnacle Law', color: 'from-indigo-500 to-blue-500' },
];

export default function ClientLogos() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    const element = document.getElementById('clients-section');
    if (element) observer.observe(element);
    return () => { if (element) observer.unobserve(element); };
  }, []);

  return (
    <section id="clients-section" className="py-20 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-white/50 uppercase tracking-widest mb-4">
            Trusted by businesses building a stronger online presence
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Client Results
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {clients.map((client, index) => (
            <div 
              key={index}
              className={`flex items-center justify-center p-4 rounded-xl bg-gradient-to-br ${client.color} bg-opacity-10 border border-white/5 hover:scale-105 transition-all duration-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-white font-semibold text-lg">
                {client.name}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/40 text-sm">
            Join 500+ teams moving from a basic website to a clearer, more useful digital presence
          </p>
        </div>
      </div>
    </section>
  );
}
