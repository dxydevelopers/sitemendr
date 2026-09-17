// components/client-dashboard/SiteRoom.tsx
//
// The scoped "room" for a single live site: everything about that one
// project (domain, billing, performance, support) filtered down instead
// of the account-wide versions. Opens on Overview by default.
//
// NOTE on scoping:
// - Billing already carries `metadata.projectRequestId` per BillingItem's
//   type, so filtering on that is a straight match against existing data.
// - Domain scoping assumes CustomDomain rows carry `siteId` (confirmed in
//   prisma/schema.prisma as the FK to Subscription/project) even though
//   the frontend CustomDomain type doesn't expose it yet — worth a quick
//   sanity check against a real API response before trusting this in prod.

'use client';

import dynamic from 'next/dynamic';
import { ArrowLeft, LifeBuoy, Globe as GlobeIcon, ExternalLink } from 'lucide-react';
import type { ClientProject, CustomDomain, BillingItem } from './ClientDashboard_types';
import type { UseClientDashboardReturn } from './useClientDashboard';
import ClientDomains from './ClientDomains';
import ClientBilling from './ClientBilling';

const PerformanceAudit = dynamic(() => import('../dashboard/PerformanceAudit'), { ssr: false });
const SupportTickets = dynamic(() => import('../dashboard/SupportTickets'), { ssr: false });

export type RoomView = 'overview' | 'domain' | 'billing' | 'performance' | 'support';

const ROOM_TABS: { id: RoomView; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'domain', label: 'Domain' },
  { id: 'billing', label: 'Billing' },
  { id: 'performance', label: 'Performance' },
  { id: 'support', label: 'Support' },
];

function UnderlineTabs({ active, onChange }: { active: RoomView; onChange: (v: RoomView) => void }) {
  return (
    <div className="flex gap-6 border-b border-white/[0.08] px-1 overflow-x-auto">
      {ROOM_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`relative whitespace-nowrap pb-3 text-[11px] font-black uppercase tracking-[0.14em] transition-colors ${
            active === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'
          }`}
        >
          {tab.label}
          {active === tab.id && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-ai-blue" />}
        </button>
      ))}
    </div>
  );
}

function OverviewTab({ site }: { site: ClientProject }) {
  const rows: { label: string; value: string }[] = [
    { label: 'Status', value: site.status },
    { label: 'Plan', value: site.planType || '—' },
    { label: 'Live URL', value: site.siteUrl || '—' },
    { label: 'Launched', value: site.launchApprovedAt ? new Date(site.launchApprovedAt).toLocaleDateString() : '—' },
    { label: 'Handed off', value: site.completionAcknowledgedAt ? new Date(site.completionAcknowledgedAt).toLocaleDateString() : '—' },
  ];

  return (
    <div className="space-y-6">
      {site.siteUrl && (
        <a
          href={site.siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.02] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white/80 transition hover:border-ai-blue/30 hover:text-white"
        >
          Visit live site <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      <div className="border border-white/[0.08] bg-white/[0.02] divide-y divide-white/[0.06]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-5 py-4">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">{row.label}</span>
            <span className="text-sm font-semibold text-white/88 truncate max-w-[60%] text-right">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SiteRoom({
  site,
  dashboard,
  view,
  onChangeView,
  onBack,
}: {
  site: ClientProject;
  dashboard: UseClientDashboardReturn;
  view: RoomView;
  onChangeView: (v: RoomView) => void;
  onBack: () => void;
}) {
  const { domains, billing, projects, analysisResult, isAnalyzing, handleAnalyzeSite } = dashboard;

  const siteDomains = domains.filter(
    (d: CustomDomain) => (d as unknown as { siteId?: string }).siteId === site.id
  );
  const siteBilling = billing.filter((b: BillingItem) => b.metadata?.projectRequestId === site.id);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/60 transition hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
              <GlobeIcon className="h-3 w-3" /> My Sites
            </div>
            <h1 className="truncate text-lg font-black tracking-tight text-white">{site.name}</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onChangeView('support')}
          className="inline-flex items-center gap-2 self-start bg-ai-blue px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black sm:self-auto"
        >
          <LifeBuoy className="h-4 w-4" /> Request a fix
        </button>
      </div>

      <UnderlineTabs active={view} onChange={onChangeView} />

      <div className="pt-2">
        {view === 'overview' && <OverviewTab site={site} />}

        {view === 'domain' && (
          <ClientDomains dashboard={dashboard} projects={[site]} domains={siteDomains} />
        )}

        {view === 'billing' && <ClientBilling billing={siteBilling} projects={projects} />}

        {view === 'performance' && (
          <PerformanceAudit
            data={analysisResult}
            isRefreshing={isAnalyzing}
            onRefresh={() => {
              if (site.siteUrl) handleAnalyzeSite(site.id, site.siteUrl);
            }}
          />
        )}

        {view === 'support' && <SupportTickets subscriptionId={site.id} />}
      </div>
    </div>
  );
}