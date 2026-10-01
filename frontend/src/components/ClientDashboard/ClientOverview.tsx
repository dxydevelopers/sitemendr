// A focused client workspace summary built from the account's real activity.
'use client';

import { Activity, ArrowRight, Globe, MessageSquare, Rocket } from 'lucide-react';
import type { ClientProject, ClientActivity, CustomDomain, BillingItem, SupportTicket } from './ClientDashboard_types';

interface ClientOverviewProps {
  selectedProject?: ClientProject | null;
  projectsCount: number;
  domains: CustomDomain[];
  billing: BillingItem[];
  tickets: SupportTicket[];
  unreadMessages: number;
  activities: ClientActivity[];
  liveSites: ClientProject[];
  onOpenTab: (tab: string) => void;
}

export default function ClientOverview({
  selectedProject, projectsCount, domains, billing, tickets,
  unreadMessages, activities, liveSites, onOpenTab,
}: ClientOverviewProps) {
  const openTickets = tickets.filter(ticket => ticket.status !== 'resolved' && ticket.status !== 'closed').length;
  const liveSitesCount = liveSites.length;
  const selectedProjectIsLive = Boolean(selectedProject && liveSites.some(site => site.id === selectedProject.id));
  const buildProject = selectedProject && !selectedProjectIsLive
    ? selectedProject
    : null;
  const currentSite = selectedProjectIsLive
    ? selectedProject
    : liveSites[0];
  const hasProjects = projectsCount > 0;

  const summary = [
    { label: 'Live sites', value: liveSitesCount, tab: 'mysites' },
    { label: 'Domains', value: domains.length, tab: 'domains' },
    { label: 'Open support', value: openTickets, tab: 'tickets' },
    { label: 'Unread messages', value: unreadMessages, tab: 'messages' },
    { label: 'Billing items', value: billing.length, tab: 'billing' },
  ];

  return (
    <div className="animate-fade-in mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
      <section className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#10141B]">
        <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:p-9">
          <div className="min-w-0 flex-1">
            <div className="mb-5 flex items-center gap-2 text-xs font-medium text-white/48">
              {currentSite ? <Globe className="h-4 w-4 text-emerald-400" /> : <Rocket className="h-4 w-4 text-ai-blue" />}
              <span>{currentSite ? 'Live site' : buildProject ? 'Project in progress' : 'Client workspace'}</span>
            </div>
            <h2 className="truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {currentSite?.name || buildProject?.name || (hasProjects ? 'Your projects' : 'Start a project')}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/48">
              {currentSite
                ? currentSite.siteUrl?.replace(/^https?:\/\//, '') || 'Your website is live.'
                : buildProject
                  ? 'Continue following your project build and updates.'
                  : hasProjects
                    ? 'View your projects and their latest progress.'
                    : 'Tell us what you need and start a new website project.'}
            </p>

            {buildProject && (
              <div className="mt-6 max-w-lg">
                <div className="mb-2 flex items-center justify-between text-xs text-white/52">
                  <span>Build progress</span><span>{buildProject.progress || 0}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Build progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, buildProject.progress || 0))}>
                  <div className="h-full rounded-full bg-ai-blue transition-[width]" style={{ width: `${Math.max(0, Math.min(100, buildProject.progress || 0))}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenTab(currentSite ? 'mysites' : 'projects')}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ai-blue px-4 text-sm font-semibold text-white transition hover:bg-ai-blue/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue focus-visible:ring-offset-2 focus-visible:ring-offset-[#10141B]"
            >
              {currentSite ? 'Manage site' : hasProjects ? 'View projects' : 'Start a project'}
              <ArrowRight className="h-4 w-4" />
            </button>
            {currentSite?.siteUrl && (
              <a href={currentSite.siteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-medium text-white/70 transition hover:bg-white/[0.05] hover:text-white">
                Visit site
              </a>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Workspace summary" className="grid grid-cols-2 divide-x divide-y divide-white/[0.08] overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-5">
        {summary.map(item => (
          <button key={item.label} type="button" onClick={() => onOpenTab(item.tab)} className="min-w-0 p-4 text-left transition hover:bg-white/[0.04] sm:p-5">
            <span className="block truncate text-xs font-medium text-white/45">{item.label}</span>
            <span className="mt-2 block text-2xl font-semibold tabular-nums text-white">{item.value}</span>
          </button>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-white/45" />
            <h3 className="text-sm font-semibold text-white">Recent activity</h3>
          </div>
          {unreadMessages > 0 && (
            <button type="button" onClick={() => onOpenTab('messages')} className="inline-flex items-center gap-1.5 text-xs font-medium text-ai-blue hover:text-white">
              <MessageSquare className="h-3.5 w-3.5" /> {unreadMessages} unread
            </button>
          )}
        </div>
        {activities.length ? (
          <ul className="divide-y divide-white/[0.06]">
            {activities.slice(0, 5).map((activity, index) => (
              <li key={`${activity.title}-${index}`} className="flex min-w-0 flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/82">{activity.title}</p>
                  <p className="mt-1 truncate text-xs text-white/42">{activity.desc}</p>
                </div>
                <time className="shrink-0 text-xs text-white/35">{activity.time}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-sm text-white/42 sm:px-6">No recent activity.</p>
        )}
      </section>
    </div>
  );
}
