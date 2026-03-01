'use client';

import React from 'react';

interface SectionDividerProps {
  label?: string;
  id?: string;
  align?: 'left' | 'center' | 'right';
}

const SectionDivider: React.FC<SectionDividerProps> = ({ label, id, align = 'left' }) => {
  return (
    <div id={id} className="relative w-full max-w-7xl mx-auto px-6 overflow-hidden pointer-events-none">
      <div className={`flex items-center gap-8 py-12 ${
        align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'
      }`}>
        {/* Horizontal Line */}
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        
        {/* HUD Content */}
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-1.5 rounded-full bg-ai-blue animate-pulse shadow-[0_0_8px_#0066FF]"></div>
          {label && (
            <span className="font-mono text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">
              {label}
            </span>
          )}
          {id && (
            <span className="font-mono text-[9px] font-black text-ai-blue/30 uppercase tracking-[0.3em]">
              [{id}]
            </span>
          )}
        </div>

        {/* Horizontal Line */}
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </div>
    </div>
  );
};

export default SectionDivider;
