'use client';

import { useMemo } from 'react';
import { Activity } from 'lucide-react';

const cities = [
  { name: 'San Francisco', top: '35%', left: '15%', status: 'Active' },
  { name: 'New York', top: '38%', left: '28%', status: 'Active' },
  { name: 'London', top: '30%', left: '48%', status: 'Active' },
  { name: 'Tokyo', top: '42%', left: '85%', status: 'Active' },
  { name: 'Nairobi', top: '65%', left: '55%', status: 'Optimal' },
  { name: 'Sydney', top: '80%', left: '90%', status: 'Active' },
];

// Stable random heights for traffic bars (deterministic based on index)
function getStableRandom(index: number): number {
  const pseudoRandom = Math.sin(index * 9999) * 10000;
  return Math.abs(pseudoRandom - Math.floor(pseudoRandom));
}

export default function GlobalNetwork() {
  const trafficBarHeights = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => {
      const value = 20 + getStableRandom(i) * 80;
      return `${Math.round(value)}%`;
    });
  }, []);
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Background World Map Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,102,255,0.1)_0%,transparent_70%)]"></div>
        {/* Simplified Map Visualization using CSS grid dots */}
        <div className="w-full h-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-blue/10 border border-ai-blue/20 mb-8">
              <Activity className="w-3 h-3 text-ai-blue" />
              <span className="text-[10px] font-bold text-ai-blue uppercase tracking-widest">Global Status: Online</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter uppercase leading-none italic">
              Edge <span className="text-ai-blue">Infrastructure</span>
            </h2>
            
            <p className="text-xl text-white/50 mb-12 max-w-xl font-light leading-relaxed">
              Our network spans across 6 continents and 50+ data centers, ensuring your applications remain responsive no matter where your users are.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl border border-white/10 group hover:border-ai-blue/40 transition-all">
                <div className="text-4xl font-black text-white mb-2">18ms</div>
                <div className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Avg Latency</div>
              </div>
              <div className="p-6 rounded-3xl border border-white/10 group hover:border-expert-green/40 transition-all">
                <div className="text-4xl font-black text-white mb-2">99.99%</div>
                <div className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Uptime Record</div>
              </div>
            </div>
          </div>

          <div className="relative aspect-video lg:aspect-square rounded-[3rem] overflow-hidden bg-white/[0.02] border border-white/10 p-4">
             {/* Map Visualization Container */}
             <div className="relative w-full h-full rounded-[2.5rem] bg-black border border-white/5 overflow-hidden">
               {/* Pulsing City Markers */}
               {cities.map((city, i) => (
                 <div 
                   key={i}
                   className="absolute group cursor-help"
                   style={{ top: city.top, left: city.left }}
                 >
                   <div className="relative">
                     <div className="absolute -inset-4 bg-ai-blue/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="relative w-2 h-2 rounded-full bg-ai-blue animate-pulse"></div>
                     {/* Tooltip */}
                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-lg bg-white text-black text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                       {city.name} - {city.status}
                     </div>
                   </div>
                 </div>
               ))}

               {/* Network Lines (Simplified with CSS) */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                 <path 
                   d="M 15 35 Q 30 30 48 30 M 48 30 Q 60 45 85 42 M 15 35 Q 35 50 55 65" 
                   fill="none" 
                   stroke="white" 
                   strokeWidth="0.5" 
                   strokeDasharray="5,5"
                 />
               </svg>

               {/* Live Status Overlay */}
               <div className="absolute top-8 left-8 p-4 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-expert-green animate-pulse"></div>
                    <span className="font-mono text-[8px] text-white tracking-widest uppercase">Traffic_Flow: Normal</span>
                 </div>
                 <div className="flex gap-1">
                   {trafficBarHeights.map((height, i) => (
                     <div key={i} className="w-1 h-3 bg-ai-blue/30 rounded-full" style={{ height }}></div>
                   ))}
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
