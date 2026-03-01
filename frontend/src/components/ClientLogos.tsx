'use client';

import { useState, useEffect } from 'react';

const clients = [
  { name: 'BrightStar Media', logo: 'https://via.placeholder.com/150x50?text=BrightStar' },
  { name: 'Summit Consulting', logo: 'https://via.placeholder.com/150x50?text=Summit' },
  { name: 'Apex Dynamics', logo: 'https://via.placeholder.com/150x50?text=Apex' },
  { name: 'Nova Health', logo: 'https://via.placeholder.com/150x50?text=Nova' },
  { name: 'Urban Kitchen', logo: 'https://via.placeholder.com/150x50?text=Urban' },
  { name: 'Pinnacle Law', logo: 'https://via.placeholder.com/150x50?text=Pinnacle' },
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
            Trusted by businesses worldwide
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Companies That Trust Us
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {clients.map((client, index) => (
            <div 
              key={index}
              className={`flex items-center justify-center p-4 grayscale opacity-50 hover:opacity-100 hover:grayscale-0 transition-all duration-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-white/60 font-semibold text-lg">
                {client.name}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/40 text-sm">
            Join 500+ businesses that have grown with us
          </p>
        </div>
      </div>
    </section>
  );
}
