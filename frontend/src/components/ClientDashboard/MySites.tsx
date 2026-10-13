// components/client-dashboard/MySites.tsx
//
// The "My Sites" list: everything the client actually owns and operates,
// as opposed to Projects (which is the build lifecycle, still in motion).
// Completed Build requests are linked to their managed-site record after
// handoff acceptance and payment closeout.

'use client';

import { Globe, CircleCheck, CircleAlert, ChevronRight } from 'lucide-react';
import type { ClientProject } from './ClientDashboard_types';
import { normalizeBuildStatus } from './utils';
import { DrillList } from '@/components/ui/DrillShell';

const LIVE_STATUSES = ['launched', 'handoff', 'completed'];

const statusLabel: Record<string, string> = {
  launched: 'Live',
  handoff: 'Handoff pending',
  completed: 'Live',
};

const statusTone: Record<string, string> = {
  launched: 'text-expert-green',
  handoff: 'text-amber-300',
  completed: 'text-expert-green',
};

export default function MySites({
  projects,
  onOpenSite,
}: {
  projects: ClientProject[];
  onOpenSite: (siteId: string) => void;
}) {
  const sites = projects.filter((p) => p.recordType === 'project' && LIVE_STATUSES.includes(normalizeBuildStatus(p.status)));

  if (!sites.length) {
  return (
  <div className="animate-fade-in grid min-h-[50vh] place-items-center border-y border-white/10 px-5 py-14 text-center">
  <div className="max-w-sm space-y-3">
  <div className="mx-auto grid h-14 w-14 place-items-center border border-white/10 bg-white/[0.03] text-ai-blue">
  <Globe className="h-5 w-5" />
  </div>
  <h1 className="text-xl font-semibold text-white">No live sites yet</h1>
  <p className="text-sm font-medium text-white/44">Completed builds appear here after handoff acceptance and payment closeout, ready for site management.</p>
  </div>
  </div>
  );
  }

  return (
  <div className="animate-fade-in w-full min-w-0">
  <DrillList
  items={sites.map((site) => {
  const status = normalizeBuildStatus(site.status);
  const needsAttention = status === 'handoff' && !site.completionAcknowledgedAt;
  return {
  id: site.id,
  icon: <Globe className="h-4 w-4" />,
  label: site.name,
  meta: site.siteUrl ? site.siteUrl.replace(/^https?:\/\//, '') : undefined,
  trailing: (
  <span className="flex min-w-0 items-center gap-2 sm:gap-3">
  <span className={`flex min-w-0 items-center gap-1.5 text-[10px] font-medium leading-tight sm:text-[11px] ${statusTone[status] || 'text-white/50'}`}>
  {needsAttention ? <CircleAlert className="h-3.5 w-3.5" /> : <CircleCheck className="h-3.5 w-3.5" />}
  <span className="max-w-[9ch] whitespace-normal text-left sm:max-w-none sm:whitespace-nowrap">{needsAttention ? 'Needs your review' : statusLabel[status] || status}</span>
  </span>
  <ChevronRight className="hidden h-4 w-4 shrink-0 text-white/22 sm:block" />
  </span>
  ),
  };
  })}
  onSelect={onOpenSite}
  />
  </div>
  );
}
