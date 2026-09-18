'use client';

import React from 'react';
import {
  Zap, Shield, Search, Smartphone, TriangleAlert, Info,
  RefreshCw, LifeBuoy, Check, ScanLine,
} from 'lucide-react';

interface Metric {
  name: string;
  value: number;
  status: 'good' | 'warning';
  icon: React.ElementType;
  color: string;
  isPercentage?: boolean;
  unit?: string;
}

interface Recommendation {
  message: string;
  priority: 'HIGH' | 'MEDIUM';
}

interface PerformanceAuditProps {
  data: {
    metrics?: {
      score?: number;
      vitals?: {
        fcp?: string;
        tti?: string;
        cls?: string;
        lcp?: string;
      };
    };
    aiInsights?: {
      actionPlan?: Array<{ task: string; impact: string }>;
    };
    timestamp?: string;
  } | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  // Omit this prop entirely to hide the action (e.g. in the admin view) —
  // pass it to route to a support ticket pre-scoped to this project.
  onRequestOptimization?: () => void;
}

const PerformanceAudit: React.FC<PerformanceAuditProps> = ({ data, onRefresh, isRefreshing, onRequestOptimization }) => {
  const auditData = React.useMemo(() => {
    if (!data) return null;

    return {
      overall: data.metrics?.score ?? 0,
      metrics: [
        {
          name: 'Page load speed',
          value: parseFloat(data.metrics?.vitals?.fcp || '0') || 0,
          status: (parseFloat(data.metrics?.vitals?.fcp || '0') < 2 ? 'good' : 'warning') as 'good' | 'warning',
          icon: Zap, color: 'text-expert-green', unit: 's',
        },
        {
          name: 'Time to interactive',
          value: parseFloat(data.metrics?.vitals?.tti || '0') || 0,
          status: (parseFloat(data.metrics?.vitals?.tti || '0') < 3.8 ? 'good' : 'warning') as 'good' | 'warning',
          icon: Shield, color: 'text-ai-blue', unit: 's',
        },
        {
          name: 'Layout stability',
          value: Math.round((1 - (parseFloat(data.metrics?.vitals?.cls || '0') || 0)) * 100),
          status: (parseFloat(data.metrics?.vitals?.cls || '0') < 0.1 ? 'good' : 'warning') as 'good' | 'warning',
          icon: Search, color: 'text-tech-purple', isPercentage: true,
        },
        {
          name: 'Visual completion',
          value: parseFloat(data.metrics?.vitals?.lcp || '0') || 0,
          status: (parseFloat(data.metrics?.vitals?.lcp || '0') < 2.5 ? 'good' : 'warning') as 'good' | 'warning',
          icon: Smartphone, color: 'text-expert-green', unit: 's',
        },
      ] as Metric[],
      recommendations: (data.aiInsights?.actionPlan?.map((item) => ({
        message: item.task,
        priority: item.impact?.toUpperCase() === 'HIGH' ? 'HIGH' : 'MEDIUM',
      })) || []) as Recommendation[],
    };
  }, [data]);

  const lastScanned = data?.timestamp
    ? new Date(data.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-6 border border-white/[0.08] bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
        <div className="space-y-2">
          {auditData ? (
            <>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-black leading-none tracking-tight text-white">{auditData.overall}</span>
                <span className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/40">/ 100</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
                {lastScanned ? `Last scanned ${lastScanned}` : 'Results not yet saved'}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-white/40">
                <ScanLine className="h-5 w-5" />
                <span className="text-sm font-black uppercase tracking-widest">Not yet scanned</span>
              </div>
              <p className="max-w-sm text-xs font-medium text-white/40">
                Run a scan to see this site&apos;s real load speed, interactivity, and stability, plus specific recommendations.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 border border-white/10 bg-white/[0.02] px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/80 transition hover:border-ai-blue/30 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Scanning...' : auditData ? 'Rescan' : 'Run scan'}
          </button>

          {onRequestOptimization && (
            <button
              onClick={onRequestOptimization}
              className="flex items-center justify-center gap-2 bg-ai-blue px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-black"
            >
              <LifeBuoy className="h-4 w-4" /> Request optimization
            </button>
          )}
        </div>
      </div>

      {auditData && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {auditData.metrics.map((metric) => (
              <div key={metric.name} className="flex flex-col justify-between gap-4 border border-white/[0.08] bg-white/[0.02] p-5">
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">{metric.name}</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xl font-black text-white">
                      {metric.value}{metric.isPercentage ? '%' : metric.unit}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${metric.status === 'good' ? 'text-expert-green' : 'text-amber-300'}`}>
                      {metric.status === 'good' ? 'Good' : 'Needs work'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border border-white/[0.08] bg-white/[0.02] p-6 lg:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.14em] text-white">Recommendations</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                {auditData.recommendations.length} {auditData.recommendations.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {auditData.recommendations.length > 0 ? (
              <div className="space-y-3">
                {auditData.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-4 border border-white/[0.06] p-4">
                    {rec.priority === 'HIGH'
                      ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      : <Info className="mt-0.5 h-4 w-4 shrink-0 text-ai-blue" />}
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white/88">{rec.message}</p>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${rec.priority === 'HIGH' ? 'text-red-400' : 'text-ai-blue'}`}>
                        {rec.priority === 'HIGH' ? 'High impact' : 'Medium impact'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 border border-dashed border-white/10 py-12 text-center">
                <Check className="h-8 w-8 text-expert-green/50" />
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Nothing outstanding right now</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceAudit;