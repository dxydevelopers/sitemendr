'use client';

import React from 'react';

interface SectionDividerProps {
  label?: string;
  id?: string;
  align?: 'left' | 'center' | 'right';
}

const SectionDivider: React.FC<SectionDividerProps> = ({ label, id, align = 'left' }) => {
  return (
    <div id={id} className="relative w-full max-w-7xl mx-auto px-6 overflow-hidden">
      <div className={`flex items-center gap-6 py-10 ${
        align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'
      }`}>
        {/* Horizontal Line */}
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        
        {/* Label */}
        {label && (
          <h2 className="text-xl font-semibold text-white whitespace-nowrap">
            {label}
          </h2>
        )}

        {/* Horizontal Line */}
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
      </div>
    </div>
  );
};

export default SectionDivider;
