// components/admin-dashboard/CustomSelect.tsx
//
// Styled dropdown to replace native <select>, which ignores dark-theme
// CSS for its option list on most browsers/OSes. Used for transport
// picker, category picker, recipient type, etc.

'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function CustomSelect({ value, options, onChange, disabled, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(v => !v)}
        className="flex items-center justify-between gap-3 bg-black/40 border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-ai-blue disabled:opacity-50 min-w-[160px]"
      >
        <span>{selected?.label || placeholder || 'Select...'}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[160px] bg-[#0a0d12] border border-white/10 shadow-xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <span>{option.label}</span>
              {option.value === value && <Check className="h-3 w-3 text-ai-blue" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}