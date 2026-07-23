// components/admin-dashboard/AdminSystem.tsx
//
// Covers "analytics", "system", and "health". Grouped together since
// they're all operational/monitoring screens rather than client-facing
// workflow, and all three are comparatively short once separated out.

'use client';

import dynamic from 'next/dynamic';
import type { AnalyticsData, EnforcementSettings, SiteVitals, Recommendation, Subscription } from './AdminDashboard_types';

const AdminSystemHealth = dynamic(() => import('../dashboard/AdminSystemHealth'), { ssr: false });
const PerformanceAudit = dynamic(() => import('../dashboard/PerformanceAudit'), { ssr: false });

interface AdminSystemProps {
  view: 'analytics' | 'system' | 'health';
  analytics: AnalyticsData;
  enforcementSettings: EnforcementSettings | null;
  setEnforcementSettings: (updater: (prev: EnforcementSettings | null) => EnforcementSettings | null) => void;
  submitting: boolean;
  onUpdateEnforcementSettings: (e: React.FormEvent) => void;
  isSystemWorking: boolean;
  onRunSuspensionCheck: () => void;
  onRunDNSVerification: () => void;
  subscriptions: Subscription[];
  selectedSiteForVitals: string | null;
  setSelectedSiteForVitals: (id: string | null) => void;
  siteVitals: SiteVitals | null;
  setSiteVitals: (v: SiteVitals | null) => void;
  loadingVitals: boolean;
  setLoadingVitals: (v: boolean) => void;
  fetchSiteVitals: (id: string) => Promise<SiteVitals | null>;
}

export default function AdminSystem({
  view, analytics, enforcementSettings, setEnforcementSettings, submitting, onUpdateEnforcementSettings,
  isSystemWorking, onRunSuspensionCheck, onRunDNSVerification,
  subscriptions, selectedSiteForVitals, setSelectedSiteForVitals, siteVitals, setSiteVitals, loadingVitals, setLoadingVitals, fetchSiteVitals,
}: AdminSystemProps) {
  if (view === 'health') {
    return (
      <div className="space-y-12 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-ai-blue uppercase tracking-[0.3em] mb-1">System Audit</span>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-3 uppercase"><span className="w-1.5 h-8 bg-ai-blue rounded-full"></span>System & Site Vitals</h2>
          </div>
          <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-2 rounded-2xl">
            <span className="text-[8px] font-black text-medium-gray uppercase tracking-widest ml-4">Monitor Site:</span>
            <select className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue min-w-[200px]" value={selectedSiteForVitals || ''} onChange={async (e) => {
              const id = e.target.value;
              setSelectedSiteForVitals(id);
              if (id) { setLoadingVitals(true); const vitals = await fetchSiteVitals(id); setSiteVitals(vitals); setLoadingVitals(false); }
              else setSiteVitals(null);
            }}>
              <option value="">-- SYSTEM GLOBAL --</option>
              {subscriptions.map(sub => <option key={sub.id} value={sub.id}>{sub.siteName || sub.customName || sub.id.slice(0, 8)} ({sub.tier})</option>)}
            </select>
          </div>
        </div>

        {selectedSiteForVitals && siteVitals ? (
          <PerformanceAudit
            data={{ metrics: { score: siteVitals.performance, vitals: { fcp: siteVitals.coreWebVitals?.fcp || siteVitals.coreWebVitals?.lcp, tti: siteVitals.coreWebVitals?.tti || '1.2s', cls: siteVitals.coreWebVitals?.cls, lcp: siteVitals.coreWebVitals?.lcp } } }}
            isRefreshing={loadingVitals}
            onRefresh={async () => { if (selectedSiteForVitals) { setLoadingVitals(true); const vitals = await fetchSiteVitals(selectedSiteForVitals); setSiteVitals(vitals); setLoadingVitals(false); } }}
          />
        ) : <AdminSystemHealth />}
      </div>
    );
  }

  if (view === 'system') {
    return (
      <div className="space-y-10 animate-fade-in">
        <div className="flex flex-col">
          <span className="text-[8px] font-bold text-ai-blue uppercase tracking-[0.3em] mb-1">System_Orchestrator</span>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-3 uppercase"><span className="w-1.5 h-8 bg-ai-blue rounded-full"></span>System Settings</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl">
            <h3 className="font-black text-xs tracking-widest uppercase text-ai-blue mb-8">Payment Enforcement</h3>
            {enforcementSettings ? (
              <form onSubmit={onUpdateEnforcementSettings} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Grace Period (Days)</label>
                  <input type="number" value={enforcementSettings.gracePeriodDays || 0} onChange={(e) => setEnforcementSettings(prev => prev ? { ...prev, gracePeriodDays: parseInt(e.target.value) } : prev)} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Overlay Threshold (%)</label>
                  <input type="number" value={enforcementSettings.overlayThreshold || 0} onChange={(e) => setEnforcementSettings(prev => prev ? { ...prev, overlayThreshold: parseInt(e.target.value) } : prev)} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors" />
                </div>
                <div className="flex items-center gap-4 py-2">
                  <input type="checkbox" id="enforceOverlays" checked={enforcementSettings.enforceOverlays || false} onChange={(e) => setEnforcementSettings(prev => prev ? { ...prev, enforceOverlays: e.target.checked } : prev)} className="w-4 h-4 rounded border-white/10 bg-white/[0.02] text-ai-blue focus:ring-ai-blue" />
                  <label htmlFor="enforceOverlays" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Enable Global Enforcement</label>
                </div>
                <button type="submit" disabled={submitting} className="w-full py-4 bg-ai-blue text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">{submitting ? 'Saving...' : 'Save configuration'}</button>
              </form>
            ) : <div className="py-12 text-center"><p className="text-[9px] font-black text-medium-gray uppercase tracking-[0.3em]">Loading settings...</p></div>}
          </div>

          <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl">
            <h3 className="font-black text-xs tracking-widest uppercase text-ai-blue mb-8">System Maintenance</h3>
            <div className="space-y-4">
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all">
                <div><p className="font-black text-[11px] uppercase tracking-tight mb-1">Suspension Watchdog</p><p className="text-[8px] text-medium-gray font-bold uppercase tracking-tight opacity-70">Check for overdue subscriptions and apply suspensions.</p></div>
                <button onClick={onRunSuspensionCheck} disabled={isSystemWorking} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-500 transition-all disabled:opacity-50">EXECUTE</button>
              </div>
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all">
                <div><p className="font-black text-[11px] uppercase tracking-tight mb-1">DNS Verify Worker</p><p className="text-[8px] text-medium-gray font-bold uppercase tracking-tight opacity-70">Validate custom domain records across global DNS.</p></div>
                <button onClick={onRunDNSVerification} disabled={isSystemWorking} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-expert-green/20 hover:border-expert-green/30 hover:text-expert-green transition-all disabled:opacity-50">EXECUTE</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // view === 'analytics'
  const userGrowthTrend = analytics?.predictions?.growthRate?.users;
  const revenueGrowthTrend = analytics?.predictions?.growthRate?.revenue;
  const cards = [
    { title: 'Traffic_Flow', metrics: [
      { label: 'Ingress Views', value: analytics?.assessments?.total || '0', trend: `${analytics?.assessments?.conversionRate || 0}% CONV` },
      { label: 'Nodes', value: analytics?.users?.total || '0', trend: `+${analytics?.users?.new || 0} NEW` },
      { label: 'Active Users', value: analytics?.users?.active || '0', trend: (userGrowthTrend != null ? `${userGrowthTrend}%` : 'N/A') },
    ], icon: '🌐' },
    { title: 'Resource_Revenue', metrics: [
      { label: 'Gross Credits', value: `${analytics?.revenue?.total || 0}`, trend: (revenueGrowthTrend != null ? `${revenueGrowthTrend}%` : 'N/A') },
      { label: 'Avg Unit Val', value: `${analytics?.revenue?.averageOrderValue || 0}`, trend: 'N/A' },
      { label: 'Conv Index', value: `${analytics?.leads?.conversionRate || 0}%`, trend: 'N/A' },
    ], icon: '💰' },
    { title: 'Predictions', metrics: [
      { label: 'Forecast Users', value: analytics?.predictions?.nextWeekUsers ?? 'N/A', trend: 'N/A' },
      { label: 'Forecast Revenue', value: analytics?.predictions?.nextWeekRevenue != null ? `${analytics.predictions.nextWeekRevenue}` : 'N/A', trend: 'N/A' },
      { label: 'Conv Rate', value: analytics?.predictions?.nextWeekConversionRate != null ? `${analytics.predictions.nextWeekConversionRate}%` : 'N/A', trend: 'N/A' },
    ], icon: '🔮' },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col">
        <span className="text-[8px] font-black text-ai-blue uppercase tracking-[0.3em] mb-1">Intelligence_Feed</span>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-3 uppercase"><span className="w-1.5 h-8 bg-ai-blue rounded-full"></span>System Analytics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl flex flex-col">
            <div className="flex items-center gap-4 mb-8"><h3 className="font-black text-xs tracking-widest uppercase text-ai-blue">{card.title}</h3></div>
            <div className="space-y-6 flex-1">
              {card.metrics.map((m, mi) => (
                <div key={mi} className="flex justify-between items-end border-b border-white/[0.03] pb-4 last:border-0 last:pb-0">
                  <div><p className="text-[8px] font-black text-medium-gray uppercase tracking-widest mb-1">{m.label}</p><p className="text-sm font-black tracking-widest">{m.value}</p></div>
                  <span className={`text-[8px] font-black px-2 py-1 rounded border ${m.trend.startsWith('+') ? 'text-expert-green border-expert-green/20 bg-expert-green/5' : 'text-medium-gray border-white/10 bg-white/5'}`}>{m.trend}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl">
        <h3 className="text-sm font-black mb-8 flex items-center gap-3 uppercase tracking-widest">AI Strategic Recommendations</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {analytics?.predictions?.recommendations?.length > 0 ? analytics.predictions.recommendations.map((rec: Recommendation, i: number) => (
            <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className={`mt-1 w-2 h-2 rounded-full ${rec.type === 'warning' ? 'bg-red-500' : rec.type === 'success' ? 'bg-expert-green' : 'bg-ai-blue'}`}></div>
                <div><p className="font-black text-[11px] uppercase tracking-tight mb-2">{rec.category.replace('_', ' ')}</p><p className="text-[9px] text-medium-gray font-bold uppercase tracking-tight leading-relaxed opacity-70">{rec.message}</p></div>
              </div>
            </div>
          )) : <div className="col-span-2 p-6 bg-white/[0.02] border border-white/5 rounded-2xl"><p className="text-[9px] text-medium-gray font-black uppercase tracking-widest text-center">Analyzing...</p></div>}
        </div>
      </div>
    </div>
  );
}
