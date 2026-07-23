// components/admin-dashboard/AdminOverview.tsx
'use client';

import { FileText, Users, CreditCard, MessageSquare, ChevronRight } from 'lucide-react';
import type { DashboardStats } from './types';

interface AdminOverviewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onOpenTab: (tab: string) => void;
}

export default function AdminOverview({ stats, loading, onOpenTab }: AdminOverviewProps) {
  if (loading) {
    return <div className="flex h-80 items-center justify-center border-y border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/34">Loading admin overview...</div>;
  }
  if (!stats) {
    return <div className="flex h-80 items-center justify-center border-y border-white/10 text-sm text-white/34">No overview data available.</div>;
  }

  return (
    <div className="animate-fade-in space-y-5">
      <section className="grid gap-px overflow-hidden bg-white/10 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Build', value: stats.totalAssessments, detail: 'intake records', tab: 'project-requests', icon: <FileText className="h-5 w-5" />, accent: 'text-ai-blue' },
          { label: 'Clients', value: stats.totalUsers, detail: `${stats.totalLeads} leads`, tab: 'users', icon: <Users className="h-5 w-5" />, accent: 'text-expert-green' },
          { label: 'Billing', value: stats.revenue?.total ? `$${stats.revenue.total.toLocaleString()}` : '$0', detail: `${stats.subscriptions?.active || 0} active sites`, tab: 'subscriptions', icon: <CreditCard className="h-5 w-5" />, accent: 'text-amber-300' },
          { label: 'Support', value: stats.support?.openTickets ?? 0, detail: 'open tickets', tab: 'tickets', icon: <MessageSquare className="h-5 w-5" />, accent: 'text-tech-purple' },
        ].map(item => (
          <button key={item.label} type="button" onClick={() => onOpenTab(item.tab)} className="group min-h-[168px] bg-[#05070a] p-5 text-left transition hover:bg-white/[0.035]">
            <div className="flex items-start justify-between gap-5">
              <span className={item.accent}>{item.icon}</span>
              <ChevronRight className="h-4 w-4 text-white/24 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
            </div>
            <p className="mt-8 text-[11px] font-black uppercase tracking-[0.16em] text-white/34">{item.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-white">{item.value}</p>
            <p className="mt-2 text-sm font-semibold text-white/42">{item.detail}</p>
          </button>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="grid gap-px overflow-hidden bg-white/10 sm:grid-cols-2">
          {[
            { label: 'Conversion', value: stats.conversionRate },
            { label: 'Assessments', value: stats.totalAssessments },
            { label: 'Leads', value: stats.totalLeads },
            { label: 'Clients', value: stats.totalUsers },
          ].map(stat => (
            <div key={stat.label} className="bg-[#05070a] px-5 py-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/28">{stat.label}</p>
              <p className="mt-3 text-2xl font-black tracking-tight text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="border-y border-white/10 py-5">
          <div className="mb-5 flex items-center justify-between gap-4 px-1">
            <h3 className="text-sm font-black text-white">30 day activity</h3>
            <div className="flex gap-4 text-[10px] font-semibold text-white/42">
              <span className="flex items-center gap-2"><span className="h-2 w-2 bg-ai-blue"></span>Clients</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 bg-expert-green"></span>Leads</span>
            </div>
          </div>
          {(stats.userGrowth?.length > 0 || stats.leadGrowth?.length > 0) ? (
            <div className="flex h-40 items-end gap-1">
              {(stats.userGrowth || []).slice(-30).map((day, i) => {
                const leadDay = stats.leadGrowth?.[i] || { count: 0 };
                const maxCount = Math.max(...stats.userGrowth.map(d => d.count), ...stats.leadGrowth.map(d => d.count), 1);
                return (
                  <div key={`${day.date}-${i}`} className="flex h-full flex-1 flex-col justify-end gap-[2px]">
                    <div className="w-full bg-expert-green/55" style={{ height: `${(leadDay.count / maxCount) * 100}%` }} />
                    <div className="w-full bg-ai-blue/60" style={{ height: `${(day.count / maxCount) * 100}%` }} />
                  </div>
                );
              })}
            </div>
          ) : <div className="flex h-40 items-center justify-center text-sm text-white/34">No growth data yet.</div>}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {[
          { title: 'Leads', tab: 'leads', empty: 'No recent leads.', rows: stats.recentLeads?.slice(0, 5).map((lead, i) => ({ key: lead.id || String(i), title: lead.name, meta: lead.email, side: lead.status })) || [] },
          { title: 'Assessments', tab: 'assessments', empty: 'No recent assessments.', rows: stats.recentAssessments?.slice(0, 5).map((a, i) => ({ key: a.id || String(i), title: 'Assessment', meta: (a.id || '').slice(-8).toUpperCase(), side: new Date(a.createdAt).toLocaleDateString() })) || [] },
        ].map(table => (
          <div key={table.title} className="border-y border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="text-sm font-black text-white">{table.title}</h3>
              <button type="button" onClick={() => onOpenTab(table.tab)} className="text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue">Open</button>
            </div>
            <div className="divide-y divide-white/10">
              {table.rows.length ? table.rows.map(row => (
                <div key={row.key} className="grid min-h-14 grid-cols-[1fr_7rem] items-center gap-4 px-4 py-3">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{row.title}</p><p className="mt-1 truncate text-xs text-white/36">{row.meta}</p></div>
                  <span className="text-right text-[10px] font-black uppercase tracking-[0.12em] text-white/42">{row.side}</span>
                </div>
              )) : <div className="px-4 py-8 text-sm text-white/34">{table.empty}</div>}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}