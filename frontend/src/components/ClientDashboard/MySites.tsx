// components/client-dashboard/MySites.tsx
//
// The "My Sites" list: everything the client actually owns and operates,
// as opposed to Projects (which is the build lifecycle, still in motion).
// A project counts as a "site" once it's launched — matches the same
// ['launched', 'handoff', 'completed'] set ClientBuildJourney already
// uses to decide a build is live.

'use client';

import { Globe, ArrowUpRight, CircleCheck, CircleAlert } from 'lucide-react';
import type { ClientProject } from './ClientDashboard_types';
import { normalizeBuildStatus } from './utils';

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
  const sites = projects.filter((p) => LIVE_STATUSES.includes(normalizeBuildStatus(p.status)));

  if (!sites.length) {
    return (
      <div className="animate-fade-in grid min-h-[50vh] place-items-center border-y border-white/10 px-5 py-14 text-center">
        <div className="max-w-sm space-y-3">
          <div className="mx-auto grid h-14 w-14 place-items-center border border-white/10 bg-white/[0.03] text-ai-blue">
            <Globe className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">No live sites yet</h1>
          <p className="text-sm font-medium text-white/44">Once a build launches, it shows up here as something you own and operate — not just a finished project.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sites.map((site) => {
          const status = normalizeBuildStatus(site.status);
          const needsAttention = status === 'handoff' && !site.completionAcknowledgedAt;
          return (
            <button
              key={site.id}
              type="button"
              onClick={() => onOpenSite(site.id)}
              className="group flex flex-col gap-4 border border-white/[0.08] bg-white/[0.02] p-5 text-left transition hover:border-ai-blue/30 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black tracking-tight text-white">{site.name}</h3>
                  {site.siteUrl && (
                    <p className="mt-1 truncate text-[11px] font-semibold text-white/44">{site.siteUrl.replace(/^https?:\/\//, '')}</p>
                  )}
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-white/24 transition group-hover:text-ai-blue" />
              </div>

              <div className="flex items-center gap-2">
                {needsAttention ? (
                  <CircleAlert className="h-3.5 w-3.5 text-amber-300" />
                ) : (
                  <CircleCheck className="h-3.5 w-3.5 text-expert-green" />
                )}
                <span className={`text-[10px] font-black uppercase tracking-[0.14em] ${statusTone[status] || 'text-white/50'}`}>
                  {needsAttention ? 'Needs your review' : statusLabel[status] || status}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}