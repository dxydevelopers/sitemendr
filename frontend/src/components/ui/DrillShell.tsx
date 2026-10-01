// components/ui/DrillShell.tsx
//
// Shared "detail view" header for the list -> detail -> back pattern used
// across both dashboards: a small local header with a back arrow, an icon,
// and a title, sitting above whatever content the drilled-in view renders.
// This is the same shape as AdminDashboard/AdminSystem.tsx's local
// SystemPageShell, pulled out so every tab in both dashboards can share it
// instead of re-implementing its own back-arrow header.

'use client';

import type { ComponentType, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DrillShellProps {
  title: string;
  icon?: ComponentType<{ className?: string }>;
  onBack: () => void;
  backLabel?: string;
  children: ReactNode;
}

export default function DrillShell({ title, icon: Icon, onBack, backLabel, children }: DrillShellProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/60 transition hover:text-white"
          aria-label={backLabel || 'Back'}
        >
          <ChevronLeft className="h-4 w-4" />
          {backLabel && <span>{backLabel}</span>}
        </button>
        <div className="flex items-center gap-2 border-l border-white/10 pl-3">
          {Icon && <span className="text-ai-blue"><Icon className="h-4 w-4" /></span>}
          <h3 className="truncate text-[15px] font-semibold text-white">{title}</h3>
        </div>
      </div>
      {children}
    </div>
  );
}

// components/ui/DrillList.tsx pattern, exported from the same file since
// it's the other half of the same shape: a flat row list that leads into
// a DrillShell. Used for tabs that currently render everything flat with
// no way to step into a single item's detail.
interface DrillListItem {
  id: string;
  icon?: ReactNode;
  label: string;
  meta?: string;
  trailing?: ReactNode;
}

export function DrillList({ items, onSelect, emptyLabel }: {
  items: DrillListItem[];
  onSelect: (id: string) => void;
  emptyLabel?: string;
}) {
  if (!items.length) {
    return <div className="w-full min-w-0 py-10 text-center text-sm text-white/34">{emptyLabel || 'Nothing here yet.'}</div>;
  }
  return (
    <div className="w-full min-w-0 divide-y divide-white/8">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className="group flex min-h-16 w-full min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue/70 sm:gap-4 sm:px-4"
        >
          {item.icon && <span className="shrink-0 text-white/50 group-hover:text-white/80">{item.icon}</span>}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium text-white/85 group-hover:text-white">{item.label}</span>
            {item.meta && <span className="block truncate text-[12px] text-white/38">{item.meta}</span>}
          </span>
          <span className="flex min-w-0 max-w-[44%] shrink-0 items-center justify-end gap-2 text-right sm:max-w-none sm:gap-3">
            {item.trailing || <ChevronRight className="h-4 w-4 shrink-0 text-white/22 transition group-hover:text-white/60" />}
          </span>
        </button>
      ))}
    </div>
  );
}
