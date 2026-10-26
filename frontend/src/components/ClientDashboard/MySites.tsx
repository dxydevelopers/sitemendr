// components/client-dashboard/MySites.tsx
//
// My Sites includes paid builds while they are in development, then keeps the
// site available after handoff so the client can manage it.

'use client';

import { Globe, CircleCheck, CircleAlert, ChevronRight, Clock3 } from 'lucide-react';
import type { ClientProject } from './ClientDashboard_types';
import { normalizeBuildStatus } from './utils';
import { DrillList } from '@/components/ui/DrillShell';

const SITE_STATUSES = ['active', 'completed', 'suspended'];

const statusLabel: Record<string, string> = {
  launched: 'Live',
  active: 'Active',
  completed: 'Live',
  suspended: 'Suspended',
};

const statusTone: Record<string, string> = {
  launched: 'text-expert-green',
  active: 'text-expert-green',
  completed: 'text-expert-green',
  suspended: 'text-amber-300',
};

export default function MySites({
  projects,
  onOpenSite,
}: {
  projects: ClientProject[];
  onOpenSite: (siteId: string) => void;
}) {
  const sites = projects.filter((project) => {
    if (project.recordType === 'request') {
      return project.serviceType === 'build'
        && Boolean(project.paymentConfirmedAt)
        && !project.subscriptionId
        && !['cancelled', 'archived'].includes(normalizeBuildStatus(project.status));
    }
    if (project.recordType !== 'project') return false;
    if (project.canManageSite === false) return Boolean(project.paymentConfirmedAt);
    return SITE_STATUSES.includes(normalizeBuildStatus(project.status));
  });

  if (!sites.length) {
  return (
  <div className="animate-fade-in grid min-h-[50vh] place-items-center border-y border-white/10 px-5 py-14 text-center">
  <div className="max-w-sm space-y-3">
  <div className="mx-auto grid h-14 w-14 place-items-center border border-white/10 bg-white/[0.03] text-ai-blue">
  <Globe className="h-5 w-5" />
  </div>
  <h1 className="text-xl font-semibold text-white">No live sites yet</h1>
  <p className="text-sm font-medium text-white/44">A site appears here after its first build payment. You can follow its progress here and manage it after handoff and payment closeout.</p>
  </div>
  </div>
  );
  }

  return (
  <div className="animate-fade-in w-full min-w-0">
  <DrillList
  items={sites.map((site) => {
  const status = normalizeBuildStatus(site.status);
  const isInDevelopment = site.recordType === 'request' || site.canManageSite === false;
  const needsAttention = status === 'suspended';
  return {
  id: site.id,
  icon: <Globe className="h-4 w-4" />,
  label: site.name,
  meta: site.siteUrl ? site.siteUrl.replace(/^https?:\/\//, '') : isInDevelopment ? `${site.progress}% build progress` : undefined,
  trailing: (
  <span className="flex min-w-0 items-center gap-2 sm:gap-3">
  <span className={`flex min-w-0 items-center gap-1.5 text-[10px] font-medium leading-tight sm:text-[11px] ${isInDevelopment ? 'text-sky-200' : statusTone[status] || 'text-white/50'}`}>
  {isInDevelopment ? <Clock3 className="h-3.5 w-3.5" /> : needsAttention ? <CircleAlert className="h-3.5 w-3.5" /> : <CircleCheck className="h-3.5 w-3.5" />}
  <span className="max-w-[12ch] whitespace-normal text-left sm:max-w-none sm:whitespace-nowrap">{isInDevelopment ? 'In development' : needsAttention ? 'Needs your review' : statusLabel[status] || status}</span>
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
