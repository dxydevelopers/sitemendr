// components/client-dashboard/ClientOverview.tsx
//
// The "dashboard" tab: current project summary, quick links to the
// other workspaces, and a short recent-activity feed. Pure presentation -
// all data comes in as props from useClientDashboard().

'use client';

import {
  Rocket, Shield, ShoppingBag, ChevronRight, MousePointer2, BookOpen,
  MessageSquare, LifeBuoy, CreditCard, Zap, Globe,
} from 'lucide-react';
import type { ClientProject, ClientActivity, CustomDomain, BillingItem, SupportTicket, MessageItem } from './ClientDashboard_types';

interface ClientOverviewProps {
  selectedProject?: ClientProject | null;
  averageProgress: number;
  projectsCount: number;
  domains: CustomDomain[];
  billing: BillingItem[];
  tickets: SupportTicket[];
  unreadMessages: number;
  activities: ClientActivity[];
  onOpenTab: (tab: string) => void;
}

export default function ClientOverview({
  selectedProject, averageProgress, projectsCount, domains, billing, tickets,
  unreadMessages, activities, onOpenTab,
}: ClientOverviewProps) {
  const openTickets = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;

  return (
    <div className="animate-fade-in">
      <section className="border-y border-white/10">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)] xl:grid-cols-[minmax(300px,0.72fr)_minmax(420px,1fr)_minmax(280px,0.48fr)]">
          <div className="border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10">
            <button type="button" onClick={() => onOpenTab('projects')} className="group flex min-h-[160px] w-full items-end justify-between gap-6 px-5 py-6 text-left transition hover:bg-white/[0.025] sm:px-7 xl:min-h-[210px]">
              <span className="min-w-0">
                <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-ai-blue">
                  <Rocket className="h-4 w-4" /> Build
                </span>
                <span className="mt-4 block truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {selectedProject?.name || 'No active project'}
                </span>
                <span className="mt-3 block truncate text-sm font-semibold text-white/42">
                  {selectedProject?.planType?.replace(/_/g, ' ') || 'Start from a private workspace'}
                </span>
              </span>
              <ChevronRight className="mb-1 h-5 w-5 shrink-0 text-white/22 transition group-hover:translate-x-1 group-hover:text-white/70" />
            </button>

            <div className="border-t border-white/10 px-5 py-5 sm:px-7">
              <div className="mb-3 flex items-center justify-between text-xs font-semibold text-white/48">
                <span>Progress</span><span>{averageProgress}%</span>
              </div>
              <div className="h-1 bg-white/10"><div className="h-1 bg-expert-green" style={{ width: `${averageProgress}%` }} /></div>
            </div>

            <div className="grid grid-cols-3 border-t border-white/10 divide-x divide-white/10">
              {[
                { label: 'Build', icon: <Rocket className="h-5 w-5 text-ai-blue" />, tab: 'projects' },
                { label: 'Repair', icon: <Shield className="h-5 w-5 text-expert-green" />, tab: 'audit' },
                { label: 'Grow', icon: <ShoppingBag className="h-5 w-5 text-amber-300" />, tab: 'business' },
              ].map((path) => (
                <button key={path.label} type="button" onClick={() => onOpenTab(path.tab)} className="group grid min-h-24 place-items-center gap-3 py-5 text-center transition hover:bg-white/[0.025]">
                  {path.icon}
                  <span className="text-xs font-black text-white/54 group-hover:text-white">{path.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-white/10 lg:border-b-0 xl:border-r xl:border-white/10">
            <div className="grid grid-cols-[1fr_4.5rem_5.5rem_1.5rem] items-center gap-3 border-b border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/28 sm:grid-cols-[1fr_5rem_6.5rem_2rem] sm:px-6">
              <span>Queue</span><span className="text-right">Count</span><span className="text-right">State</span><span></span>
            </div>
            {[
              { label: 'Projects', value: projectsCount, status: projectsCount ? 'Active' : 'Ready', tab: 'projects', icon: <Rocket className="h-4 w-4 text-ai-blue" /> },
              { label: 'Domains', value: domains.length, status: domains.length ? 'Connected' : 'Setup', tab: 'domains', icon: <Globe className="h-4 w-4 text-ai-blue" /> },
              { label: 'Messages', value: unreadMessages, status: unreadMessages ? 'Unread' : 'Clear', tab: 'messages', icon: <MessageSquare className="h-4 w-4 text-tech-purple" /> },
              { label: 'Tickets', value: openTickets, status: openTickets ? 'Open' : 'Clear', tab: 'tickets', icon: <LifeBuoy className="h-4 w-4 text-expert-green" /> },
              { label: 'Billing', value: billing.length, status: billing.length ? 'Available' : 'Clear', tab: 'billing', icon: <CreditCard className="h-4 w-4 text-amber-300" /> },
            ].map((row) => (
              <button key={row.label} type="button" onClick={() => onOpenTab(row.tab)} className="group grid min-h-14 grid-cols-[1fr_4.5rem_5.5rem_1.5rem] items-center gap-3 border-b border-white/8 px-4 py-3 text-left transition last:border-b-0 hover:bg-white/[0.025] sm:grid-cols-[1fr_5rem_6.5rem_2rem] sm:px-6">
                <span className="flex min-w-0 items-center gap-3">
                  {row.icon}
                  <span className="truncate text-sm font-semibold text-white/72 group-hover:text-white">{row.label}</span>
                </span>
                <span className="text-right text-sm font-black text-white/58">{row.value}</span>
                <span className="truncate text-right text-xs font-semibold text-white/42">{row.status}</span>
                <ChevronRight className="h-4 w-4 text-white/18 transition group-hover:translate-x-1 group-hover:text-white/62" />
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 xl:block">
            <div className="border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10 xl:border-r-0 xl:border-b">
              <div className="grid grid-cols-3 divide-x divide-white/10">
                {[
                  { label: 'Projects', value: projectsCount },
                  { label: 'Domains', value: domains.length },
                  { label: 'Tickets', value: openTickets },
                ].map((metric) => (
                  <div key={metric.label} className="px-4 py-5">
                    <div className="text-2xl font-black tracking-tight text-white">{metric.value}</div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/28">{metric.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 border-t border-white/10 divide-x divide-white/10">
                {[
                  { label: 'Edit', icon: <MousePointer2 className="h-4 w-4" />, tab: 'editor' },
                  { label: 'Store', icon: <ShoppingBag className="h-4 w-4" />, tab: 'ecommerce' },
                  { label: 'Files', icon: <BookOpen className="h-4 w-4" />, tab: 'resources' },
                ].map((tool) => (
                  <button key={tool.label} type="button" onClick={() => onOpenTab(tool.tab)} className="group flex min-h-20 flex-col items-start justify-between px-4 py-4 text-left text-white/48 transition hover:bg-white/[0.025] hover:text-white">
                    {tool.icon}<span className="text-xs font-black">{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-5 sm:px-6">
              <div className="mb-3 text-sm font-black text-white">Recent</div>
              <div className="divide-y divide-white/8">
                {activities.length > 0 ? activities.slice(0, 4).map((act, i) => (
                  <div key={`${act.title}-${i}`} className="py-3">
                    <div className="truncate text-sm font-semibold text-white/70">{act.title}</div>
                    <div className="mt-1 flex items-center justify-between gap-3 text-xs text-white/34">
                      <span className="truncate">{act.desc}</span><span className="shrink-0">{act.time}</span>
                    </div>
                  </div>
                )) : (
                  <div className="py-3 text-sm text-white/34">No recent activity yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
