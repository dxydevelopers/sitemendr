'use client';

import { 
  Code2, 
  Database, 
  Cloud, 
  Cpu,
  Terminal
} from 'lucide-react';

const technologies = [
  {
    category: 'Frontend',
    icon: <Code2 className="w-5 h-5" />,
    items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion']
  },
  {
    category: 'Backend',
    icon: <Terminal className="w-5 h-5" />,
    items: ['Node.js', 'Python', 'Go', 'GraphQL', 'REST APIs']
  },
  {
    category: 'Database',
    icon: <Database className="w-5 h-5" />,
    items: ['PostgreSQL', 'MongoDB', 'Redis', 'Prisma', 'Supabase']
  },
  {
    category: 'Infrastructure',
    icon: <Cloud className="w-5 h-5" />,
    items: ['AWS', 'Vercel', 'Docker', 'CI/CD', 'Terraform']
  }
];

export default function TechStack() {
  return (
    <section className="py-32 bg-[#050505] relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.05]"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-ai-blue/10 border border-ai-blue/20 mb-8">
            <Cpu className="w-3 h-3 text-ai-blue" />
            <span className="font-mono text-[9px] font-bold text-ai-blue uppercase tracking-widest">Technologies We Use</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none italic">
            Engineering <span className="text-ai-blue">Arsenal</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {technologies.map((tech, index) => (
            <div 
              key={index}
              className="group relative p-8 bg-white/[0.02] border border-white/10 rounded-3xl hover:border-ai-blue/30 transition-all duration-500 hover:-translate-y-2"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-ai-blue/10 rounded-xl text-ai-blue group-hover:scale-110 transition-transform">
                  {tech.icon}
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">{tech.category}</h3>
              </div>

              <div className="space-y-4">
                {tech.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-ai-blue transition-colors"></div>
                    <span className="font-mono text-xs text-medium-gray group-hover:text-white transition-colors uppercase tracking-widest">{item}</span>
                  </div>
                ))}
              </div>

              {/* HUD Brackets */}
              <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-white/10 group-hover:border-ai-blue/40"></div>
              <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-white/10 group-hover:border-ai-blue/40"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
