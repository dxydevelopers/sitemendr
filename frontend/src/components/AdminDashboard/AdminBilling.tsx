'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { ChevronRight, Eye, Search } from 'lucide-react';
import type { Subscription } from './AdminDashboard_types';

const TemplateEditor = dynamic(() => import('../dashboard/TemplateEditor'), { ssr: false });

interface AdminBillingProps {
  view: 'subscriptions' | 'review';
  subscriptions: Subscription[];
  reviewProjects: Subscription[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  selectedSubscriptionForEditor: string | null;
  setSelectedSubscriptionForEditor: (id: string | null) => void;
  isSystemWorking: boolean;
  onTriggerAIGeneration: (id: string) => void;
  onSuspendSubscription: (id: string, currentStatus: string) => void;
  onDeleteSubscription: (id: string) => void;
  onUpdateReview: (id: string, notes: string, increment?: boolean) => void;
  onCompleteReview: (id: string) => void;
  onDeploySite: (id: string) => void;
}

const label = 'text-[9px] font-black uppercase tracking-[0.24em] text-white/34';
const value = 'text-[14px] font-semibold tracking-tight text-white';
const tierRank: Record<string, number> = {
  ai_foundation: 1,
  pro_enhancement: 2,
  enterprise: 3,
};

function SectionHeader({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="border-b border-white/12 pb-4">
      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/42">{title}</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/42">{detail}</p>
    </div>
  );
}

function TierPill({ valueText }: { valueText: string }) {
  return (
    <span className="inline-flex items-center border border-white/12 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.22em] text-white/68">
      {valueText}
    </span>
  );
}

function MetaBlock({ title, valueText }: { title: string; valueText: string }) {
  return (
    <div>
      <p className={label}>{title}</p>
      <p className={value}>{valueText}</p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  tone = 'default',
  disabled,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: 'default' | 'green' | 'blue' | 'danger';
  disabled?: boolean;
  title?: string;
}) {
  const toneClass =
    tone === 'green'
      ? 'text-expert-green hover:border-expert-green/35'
      : tone === 'blue'
        ? 'text-ai-blue hover:border-ai-blue/35'
        : tone === 'danger'
          ? 'text-red-300 hover:border-red-500/35'
          : 'text-white/76 hover:border-white/30 hover:text-white';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex min-h-9 items-center gap-2 border border-white/12 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] transition disabled:opacity-50 ${toneClass}`}
    >
      {children}
    </button>
  );
}

export default function AdminBilling({
  view,
  subscriptions,
  reviewProjects,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  selectedSubscriptionForEditor,
  setSelectedSubscriptionForEditor,
  isSystemWorking,
  onTriggerAIGeneration,
  onSuspendSubscription,
  onDeleteSubscription,
  onUpdateReview,
  onCompleteReview,
  onDeploySite,
}: AdminBillingProps) {
  const router = useRouter();

  if (selectedSubscriptionForEditor) {
    return (
      <div className="animate-fade-in">
        <button
          type="button"
          onClick={() => setSelectedSubscriptionForEditor(null)}
          className="mb-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/42 transition hover:text-white"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          Back to list
        </button>
        <TemplateEditor subscriptionId={selectedSubscriptionForEditor} onClose={() => setSelectedSubscriptionForEditor(null)} />
      </div>
    );
  }

  if (view === 'subscriptions') {
    const filtered = subscriptions
      .filter((sub) =>
        (filterStatus === 'ALL' || sub.tier === filterStatus)
        && (
          (sub.customName || sub.siteName || '').toLowerCase().includes(searchTerm.toLowerCase())
          || (sub.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
          || (sub.id || '').toLowerCase().includes(searchTerm.toLowerCase())
        ),
      )
      .sort((a, b) => (tierRank[a.tier] || 99) - (tierRank[b.tier] || 99) || (a.customName || a.siteName || '').localeCompare(b.customName || b.siteName || ''));

    return (
      <div className="animate-fade-in space-y-7">
        <SectionHeader
          title="Site Management"
          detail={`${subscriptions.filter((s) => s.status === 'active').length} active of ${subscriptions.length} deployments`}
        />

        <div className="border-b border-white/10 pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
            <label className="relative min-w-0 flex-1">
              <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.22em] text-white/28">Search</span>
              <Search className="pointer-events-none absolute left-0 top-[2.15rem] h-3.5 w-3.5 text-white/28" />
              <input
                type="text"
                placeholder="Search deployments"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-h-11 w-full border border-white/12 bg-[#05070a] py-2.5 pl-6 pr-4 text-[11px] font-semibold tracking-[0.12em] text-white outline-none transition placeholder:text-white/24 focus:border-white/22 focus:ring-0"
              />
            </label>

            <label className="relative min-w-[12rem] lg:w-48">
              <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.22em] text-white/28">Tier</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="min-h-11 w-full appearance-none border border-white/12 bg-[#05070a] px-3 py-2.5 text-[11px] font-semibold tracking-[0.12em] text-white outline-none transition focus:border-white/22 focus:ring-0"
              >
                <option value="ALL">All tiers</option>
                <option value="ai_foundation">AI foundation</option>
                <option value="pro_enhancement">Pro enhancement</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </label>
          </div>
        </div>

        <div className="border-y border-white/20">
          <div className="hidden grid-cols-12 gap-4 border-b border-white/20 px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.24em] text-white/28 xl:grid">
            <div className="col-span-7">Deployment</div>
            <div className="col-span-2">Billing</div>
            <div className="col-span-3 text-right">View details</div>
          </div>
          {filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-white/34">No deployments match these filters.</p>
          ) : (
            <div className="divide-y divide-white/20">
              {filtered.map((sub, i) => {
                const currentPaymentLabel = sub.paymentStatus || 'UNKNOWN';
                const tierLabel = sub.tier?.replace(/_/g, ' ');
                const tierNumber = tierRank[sub.tier] || i + 1;

                return (
                  <div key={sub.id || i} className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/subscriptions/${sub.id}`)}
                      className="grid w-full grid-cols-1 gap-4 text-left transition hover:bg-white/[0.01] xl:grid-cols-[minmax(0,1fr)_170px_170px] xl:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={label}>ID {(sub.id || '').slice(0, 8)}</span>
                          <span className={`text-[10px] font-black uppercase tracking-[0.18em] ${sub.status === 'active' ? 'text-expert-green' : 'text-amber-300'}`}>{sub.status}</span>
                          {!sub.isCurrent && <span className="text-[8px] font-black uppercase tracking-[0.18em] text-white/34">Previous</span>}
                        </div>

                        <h3 className="mt-1.5 truncate text-[17px] font-semibold tracking-tight text-white">{sub.customName || sub.siteName}</h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm leading-6 text-white/42">
                          <span>Client {sub.user?.name || 'Guest'}</span>
                          <span className="text-white/24">&middot;</span>
                          <span>{tierLabel}</span>
                          <span className="text-white/24">&middot;</span>
                          <span>Tier {tierNumber}</span>
                        </div>
                      </div>

                      <div className="min-h-full xl:border-l xl:border-white/20 xl:pl-4">
                        <p className={label}>Billing</p>
                        <p className={`mt-2 text-[15px] font-black tracking-tight ${currentPaymentLabel === 'PAID' ? 'text-expert-green' : 'text-amber-300'}`}>{currentPaymentLabel}</p>
                        <p className="mt-2 text-sm leading-6 text-white/40">Latest commercial state for this deployment.</p>
                      </div>

                      <div className="flex items-center justify-end gap-2 self-stretch xl:border-l xl:border-white/20 xl:pl-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300/80">Open</span>
                        <ChevronRight className="h-4 w-4 text-amber-300/80 transition group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const filteredReview = reviewProjects.filter(
    (p) =>
      (p.customName || p.siteName || '').toLowerCase().includes(searchTerm.toLowerCase())
      || (p.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      || (p.domain || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="animate-fade-in space-y-6">
        <SectionHeader
          title="Review Queue"
          detail={`${reviewProjects.length} pending review${reviewProjects.length === 1 ? '' : 's'}`}
        />

      <div className="border-b border-white/10 pb-4">
        <label className="relative block lg:w-[28rem]">
          <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.22em] text-white/28">Search</span>
          <Search className="pointer-events-none absolute left-0 top-[2.15rem] h-3.5 w-3.5 text-white/28" />
          <input
            type="text"
            placeholder="Search projects"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-h-11 w-full border border-white/12 bg-[#05070a] py-2.5 pl-6 pr-4 text-[11px] font-semibold tracking-[0.12em] text-white outline-none transition placeholder:text-white/24 focus:border-white/22 focus:ring-0"
          />
        </label>
      </div>

      {filteredReview.length === 0 ? (
        <div className="border-y border-white/10 py-20 text-center">
          <Eye className="mx-auto mb-4 h-8 w-8 text-white/15" />
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/34">No projects currently awaiting review</p>
        </div>
      ) : (
        <div className="border-y border-white/30">
          <div className="hidden grid-cols-12 gap-4 border-b border-white/30 px-5 py-3 text-[8px] font-black uppercase tracking-[0.24em] text-white/28 xl:grid">
            <div className="col-span-7">Project</div>
            <div className="col-span-2">Review</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
          <div className="divide-y divide-white/30">
            {filteredReview.map((project, i) => (
              <div key={project.id || i} className="px-5 py-6">
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_240px_220px] xl:items-stretch">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[16px] font-semibold tracking-tight text-white">{project.domain || 'no-domain.sitemendr.com'}</h3>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/34">{project.tier?.replace(/_/g, ' ')}</p>
                      </div>
                      <span className={`shrink-0 text-[9px] font-black uppercase tracking-[0.18em] ${project.status === 'active' ? 'text-expert-green' : 'text-amber-300'}`}>{project.status}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2.5 border-t border-white/30 pt-3.5 sm:grid-cols-3">
                      <MetaBlock title="Owner" valueText={project.user?.email || 'Unknown'} />
                      <MetaBlock title="Requested" valueText={new Date(project.createdAt || Date.now()).toLocaleDateString()} />
                      <MetaBlock title="Revisions" valueText={`${project.revisionCount ?? 0}`} />
                    </div>
                  </div>

                  <div className="min-h-full xl:border-l xl:border-white/30 xl:pl-5">
                    <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.22em] text-white/28">Review notes</label>
                    <textarea
                      defaultValue={project.reviewNotes || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (project.reviewNotes || '')) onUpdateReview(project.id, e.target.value);
                      }}
                      className="h-20 w-full resize-none border border-white/12 bg-[#05070a] px-3 py-3 text-[10px] leading-5 text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/40 focus:ring-0"
                      placeholder="Leave concise feedback..."
                    />
                  </div>

                  <div className="flex min-h-full flex-wrap gap-2 xl:justify-end xl:pt-1 xl:border-l xl:border-white/30 xl:pl-5">
                    <ActionButton
                      onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/preview/${project.id}`, '_blank')}
                    >
                      <Eye size={12} />
                      Preview
                    </ActionButton>
                    <ActionButton onClick={() => onCompleteReview(project.id)} tone="green">
                      Complete review
                    </ActionButton>
                    <ActionButton onClick={() => setSelectedSubscriptionForEditor(project.id)}>
                      Edit template
                    </ActionButton>
                    <ActionButton onClick={() => onDeploySite(project.id)} tone="blue">
                      Deploy live
                    </ActionButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


