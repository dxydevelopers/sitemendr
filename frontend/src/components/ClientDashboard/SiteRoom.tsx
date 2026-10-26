// components/client-dashboard/SiteRoom.tsx
//
// The scoped "room" for a single live site: everything about that one
// project (domain, billing, performance, support) filtered down instead
// of the account-wide versions. Opens on Overview by default.
//
// Domain and Billing are both fully dedicated components (SiteDomain.tsx,
// SiteBilling.tsx) rather than reuses of ClientDomains.tsx/ClientBilling.tsx.
// Billing needed this because both used to share the same `?view=`/`?id=`
// URL keys as the room's own tab-switching, which meant clicking into a
// transaction inside the room silently broke the room's own navigation —
// SiteBilling uses local component state for its drill-down instead, so
// this class of collision can't happen again. Domain didn't have that
// specific bug (ClientDomains.tsx never touched the URL), but was split
// out anyway for consistency, and it's simpler as a result — no "target
// project" selector needed when there's only ever one possible target.
//
// NOTE on scoping:
// - Billing carries `metadata.projectRequestId` per BillingItem's type,
// so filtering on that is a straight match against existing data.
// - Domain scoping assumes CustomDomain rows carry `siteId` (confirmed in
// prisma/schema.prisma as the FK to Subscription/project) even though
// the frontend CustomDomain type doesn't expose it yet — worth a quick
// sanity check against a real API response before trusting this in prod.

'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { LifeBuoy, Globe as GlobeIcon, ExternalLink, LockKeyhole } from 'lucide-react';
import type { ClientProject, CustomDomain, BillingItem, BillingInvoiceItem, BillingReceiptItem, BillingRefundItem, AnalysisResult } from './ClientDashboard_types';
import type { UseClientDashboardReturn } from './useClientDashboard';
import { apiClient } from '@/lib/api';
import SiteDomain from './SiteDomain';
import SiteBilling from './SiteBilling';
import AddonMarketplace from '../dashboard/AddonMarketplace';
import { normalizeBuildStatus } from './utils';

const PerformanceAudit = dynamic(() => import('../dashboard/PerformanceAudit'), { ssr: false });
const SupportTickets = dynamic(() => import('../dashboard/SupportTickets'), { ssr: false });

export type RoomView = 'overview' | 'domain' | 'addons' | 'billing' | 'performance' | 'support';

const ROOM_TABS: { id: RoomView; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'domain', label: 'Domain' },
  { id: 'addons', label: 'Add-ons' },
  { id: 'billing', label: 'Billing' },
  { id: 'performance', label: 'Performance' },
  { id: 'support', label: 'Support' },
];
const DEVELOPMENT_TABS: { id: RoomView; label: string }[] = ROOM_TABS.filter(tab => ['overview', 'domain'].includes(tab.id));

function UnderlineTabs({ active, onChange, tabs = ROOM_TABS }: { active: RoomView; onChange: (v: RoomView) => void; tabs?: { id: RoomView; label: string }[] }) {
  return (
  <div className="flex min-w-0 gap-5 overflow-x-auto border-b border-white/[0.08] px-1 sm:gap-6">
  {tabs.map((tab) => (
  <button
  key={tab.id}
  type="button"
  onClick={() => onChange(tab.id)}
  className={`relative whitespace-nowrap pb-3 text-[11px] font-semibold transition-colors ${
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
  const statusLabels: Record<string, string> = {
    active: 'Active',
    completed: 'Live',
    launched: 'Live',
    handoff: 'Handoff pending',
    suspended: 'Suspended',
  };
  const planLabels: Record<string, string> = {
    self_hosted: 'Self-hosted',
    monthly: 'Monthly',
    annual: 'Annual',
  };
  const rows: { label: string; value: string }[] = [
  { label: 'Status', value: statusLabels[site.status] || site.status.replace(/_/g, ' ') },
  { label: 'Hosting', value: site.planType ? (planLabels[site.planType] || site.planType.replace(/_/g, ' ')) : '—' },
  { label: 'Live URL', value: site.siteUrl || '—' },
  { label: 'Launch approved', value: site.launchApprovedAt ? new Date(site.launchApprovedAt).toLocaleDateString() : '—' },
  { label: 'Handed off', value: site.completionAcknowledgedAt ? new Date(site.completionAcknowledgedAt).toLocaleDateString() : '—' },
  ];

  return (
  <div className="space-y-6">
  {site.siteUrl && (
  <a
  href={site.siteUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.02] px-4 py-2 text-[11px] font-semibold text-white/80 transition hover:border-ai-blue/30 hover:text-white"
  >
  Visit live site <ExternalLink className="h-3.5 w-3.5" />
  </a>
  )}
  <div className="border border-white/[0.08] bg-white/[0.02] divide-y divide-white/[0.06]">
  {rows.map((row) => (
  <div key={row.label} className="flex items-center justify-between px-5 py-4">
  <span className="text-[10px] font-semibold text-white/40">{row.label}</span>
  <span className="max-w-full break-all text-right text-sm font-semibold text-white/88 sm:max-w-[60%] sm:break-normal">{row.value}</span>
  </div>
  ))}
  </div>
  </div>
  );
}

export default function SiteRoom({
  site,
  dashboard,
  invoices,
  receipts,
  refunds,
  onOpenBuildJourney,
  view,
  onChangeView,
}: {
  site: ClientProject;
  dashboard: UseClientDashboardReturn;
  invoices: BillingInvoiceItem[];
  receipts: BillingReceiptItem[];
  refunds: BillingRefundItem[];
  onOpenBuildJourney: (projectRequestId: string) => void;
  view: RoomView;
  onChangeView: (v: RoomView) => void;
}) {
  const { domains, billing, billingUnavailable, projects, analysisResult, analysisProjectId, isAnalyzing, handleAnalyzeSite } = dashboard;
  const [savedAnalysis, setSavedAnalysis] = useState<AnalysisResult | null>(null);
  const linkedBuildRequest = projects.find(project => project.recordType === 'request' && (project.id === site.id || project.subscriptionId === site.id));
  const siteIsInHandoff = ['launched', 'handoff'].includes(normalizeBuildStatus(site.status))
    || ['launched', 'handoff'].includes(normalizeBuildStatus(linkedBuildRequest?.status || ''));
  const siteIsReadOnly = site.recordType === 'request' || site.canManageSite === false || siteIsInHandoff;
  const siteStatus = normalizeBuildStatus(site.status);
  const readOnlyTitle = siteIsInHandoff
    ? 'Complete your site handoff'
    : siteStatus === 'completed'
      ? 'Finish payment closeout to manage your site'
      : 'Your site is in development';
  const readOnlyMessage = siteIsInHandoff
    ? 'Review and accept the handoff in Build Journey, then settle any remaining agreed balance. Domain setup and site tools unlock when both are complete.'
    : siteStatus === 'completed'
      ? 'The build is complete. Domain setup and site tools unlock after you accept the handoff and complete the agreed payment.'
      : 'Your build is linked here so you can follow its progress. Domain setup and the other site tools unlock after handoff acceptance and payment closeout.';
  const visibleTabs = siteIsReadOnly ? DEVELOPMENT_TABS : ROOM_TABS;
  const visibleView = visibleTabs.some(tab => tab.id === view) ? view : 'overview';

  const openBuildJourney = () => {
    if (!linkedBuildRequest) return;
    dashboard.setSelectedProjectId(linkedBuildRequest.id);
    dashboard.setActiveBuildChapter(null);
    dashboard.router.push('/dashboard?tab=projects');
  };

  useEffect(() => {
    if (view !== 'performance' || siteIsReadOnly) return;
    let active = true;
    setSavedAnalysis(null);
    apiClient.getSiteVitals(site.id).then((response) => {
      if (!active || !response.success) return;
      const metrics = response.vitals && typeof response.vitals === 'object'
        ? response.vitals as AnalysisResult['metrics']
        : undefined;
      if (typeof metrics?.score !== 'number' && !response.availability?.status) return;
      setSavedAnalysis({
        metrics,
        strategy: response.strategy || 'mobile',
        aiInsights: response.aiInsights as AnalysisResult['aiInsights'],
        availability: response.availability,
        timestamp: typeof response.timestamp === 'string' ? response.timestamp : undefined,
        insights: ''
      });
    }).catch(() => {
      if (active) setSavedAnalysis(null);
    });
    return () => { active = false; };
  }, [site.id, view, siteIsReadOnly]);

  const siteDomains = domains.filter((domain: CustomDomain) => domain.siteId === site.id);
  const relatedBuildRequests = projects.filter(project => project.recordType === 'request' && project.subscriptionId === site.id);
  const relatedRequestIds = relatedBuildRequests.map(project => project.id);
  const siteBilling = billing.filter((item: BillingItem) => item.metadata?.subscriptionId === site.id
    || relatedRequestIds.includes(String(item.metadata?.projectRequestId || '')));
  const siteInvoices = invoices.filter(invoice => invoice.snapshot?.subscriptionId === site.id
    || Boolean(invoice.projectRequestId && relatedRequestIds.includes(invoice.projectRequestId)));
  const siteInvoiceIds = new Set(siteInvoices.map(invoice => invoice.id));
  const siteReceipts = receipts.filter(receipt => siteInvoiceIds.has(String(receipt.invoiceId || ''))
    || siteBilling.some(payment => payment.id === receipt.paymentId));
  const siteRefunds = refunds.filter(refund => Boolean(refund.projectRequestId && relatedRequestIds.includes(refund.projectRequestId)));

  return (
  <div className="animate-fade-in space-y-6">
  <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-center sm:justify-between">
  <div className="flex items-center gap-3">
  <div className="min-w-0">
  <div className="flex items-center gap-2 text-[10px] font-semibold text-white/40">
  <GlobeIcon className="h-3 w-3" /> My Sites
  </div>
  </div>
  </div>

  {!siteIsReadOnly && <button
  type="button"
  onClick={() => onChangeView('support')}
  className="inline-flex items-center gap-2 self-start bg-ai-blue px-5 py-2.5 text-[10px] font-semibold text-white transition hover:bg-white hover:text-black sm:self-auto"
  >
  <LifeBuoy className="h-4 w-4" /> Request a fix
  </button>}
  </div>

  <>
  {siteIsReadOnly && (
  <section className="flex flex-col gap-4 border border-sky-300/15 bg-sky-300/[0.035] p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
  <div className="flex min-w-0 items-start gap-3">
  <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-sky-200" />
  <div className="min-w-0">
  <p className="text-sm font-semibold text-white">{readOnlyTitle}</p>
  <p className="mt-1 max-w-2xl text-xs leading-5 text-white/55">{readOnlyMessage}</p>
  </div>
  </div>
  {linkedBuildRequest && <button type="button" onClick={openBuildJourney} className="inline-flex min-h-10 shrink-0 items-center justify-center border border-sky-300/25 px-4 text-xs font-semibold text-sky-100 transition hover:bg-sky-300/10">Continue in Build Journey</button>}
  </section>
  )}

  <UnderlineTabs active={visibleView} onChange={onChangeView} tabs={visibleTabs} />

  <div className="pt-2">
  {visibleView === 'overview' && <OverviewTab site={site} />}

  {visibleView === 'domain' && (
  <SiteDomain site={site} domains={siteDomains} dashboard={dashboard} />
  )}

  {!siteIsReadOnly && visibleView === 'addons' && (
  <AddonMarketplace subscription={site} onRequestCustom={() => onChangeView('support')} />
  )}

  {!siteIsReadOnly && visibleView === 'billing' && <SiteBilling site={site} billing={siteBilling} invoices={siteInvoices} receipts={siteReceipts} refunds={siteRefunds} unavailable={billingUnavailable} onRefreshBilling={dashboard.fetchData} onOpenBuildJourney={onOpenBuildJourney} onOpenAddons={() => onChangeView('addons')} />}

  {!siteIsReadOnly && visibleView === 'performance' && (
  <PerformanceAudit
  key={site.id}
  subscriptionId={site.id}
  data={analysisProjectId === site.id ? analysisResult : savedAnalysis}
  isRefreshing={isAnalyzing}
  errorMessage={dashboard.analysisError?.projectId === site.id ? dashboard.analysisError.message : null}
  disabledReason={!site.siteUrl ? 'A live deployment is required before this site can be scanned.' : null}
  onRefresh={(strategy) => {
  if (site.siteUrl) handleAnalyzeSite(site.id, site.siteUrl, strategy);
  }}
  onRequestOptimization={() => onChangeView('support')}
  />
  )}

  {!siteIsReadOnly && visibleView === 'support' && <SupportTickets subscriptionId={site.id} />}
  </div>
  </>
  </div>
  );
}
