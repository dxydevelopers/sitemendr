'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  Shield, 
  Search, 
  Smartphone, 
  AlertTriangle, 
  Info,
  ArrowUpRight,
  RefreshCw,
  Rocket,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Metric {
  name: string;
  value: number;
  status: string;
  icon: React.ElementType;
  color: string;
  isPercentage?: boolean;
  unit?: string;
}

interface Recommendation {
  type: string;
  message: string;
  priority: string;
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
  } | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const PerformanceAudit: React.FC<PerformanceAuditProps> = ({ data, onRefresh, isRefreshing }) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationComplete, setOptimizationComplete] = useState(false);

  const handleRunOptimization = async () => {
    setIsOptimizing(true);
    try {
      // Simulate/Trigger content/asset optimization
      await apiClient.optimizeContent('Global Asset Bundle');
      setOptimizationComplete(true);
      setTimeout(() => setOptimizationComplete(false), 5000);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const auditData = React.useMemo(() => {
    if (!data) {
      return {
        overall: 94,
        metrics: [
          { name: 'Page Load Speed', value: 98, status: 'Optimal', icon: Zap, color: 'text-expert-green' },
          { name: 'Security Score', value: 100, status: 'Protected', icon: Shield, color: 'text-ai-blue' },
          { name: 'SEO Score', value: 89, status: 'Good', icon: Search, color: 'text-tech-purple' },
          { name: 'Mobile Friendly', value: 92, status: 'Ready', icon: Smartphone, color: 'text-expert-green' }
        ],
        recommendations: [
          { type: 'optimization', message: 'Enable caching for faster loading', priority: 'Low' },
          { type: 'seo', message: 'Add meta descriptions to dynamic pages', priority: 'Medium' }
        ]
      };
    }

    return {
      overall: data.metrics?.score || 0,
      metrics: [
        { 
          name: 'LOAD_SPEED (FCP)', 
          value: parseFloat(data.metrics?.vitals?.fcp || '0') || 0, 
          status: (parseFloat(data.metrics?.vitals?.fcp || '0') < 2) ? 'OPTIMAL' : 'AVERAGE', 
          icon: Zap, 
          color: 'text-expert-green',
          isPercentage: false,
          unit: 's'
        },
        { 
          name: 'INTERACTIVE (TTI)', 
          value: parseFloat(data.metrics?.vitals?.tti || '0') || 0, 
          status: (parseFloat(data.metrics?.vitals?.tti || '0') < 3.8) ? 'OPTIMAL' : 'WARNING', 
          icon: Shield, 
          color: 'text-ai-blue',
          isPercentage: false,
          unit: 's'
        },
        { 
          name: 'LAYOUT_STABILITY', 
          value: Math.round((1 - (parseFloat(data.metrics?.vitals?.cls || '0') || 0)) * 100), 
          status: (parseFloat(data.metrics?.vitals?.cls || '0') < 0.1) ? 'STABLE' : 'SHIFTING', 
          icon: Search, 
          color: 'text-tech-purple',
          isPercentage: true
        },
        { 
          name: 'VISUAL_COMPLETE', 
          value: parseFloat(data.metrics?.vitals?.lcp || '0') || 0, 
          status: (parseFloat(data.metrics?.vitals?.lcp || '0') < 2.5) ? 'SYNCHRONIZED' : 'SLOW', 
          icon: Smartphone, 
          color: 'text-expert-green',
          isPercentage: false,
          unit: 's'
        }
      ],
      recommendations: data.aiInsights?.actionPlan?.map((item: { task: string; impact: string }) => ({
        type: 'AI_INSIGHT',
        message: item.task,
        priority: item.impact?.toUpperCase() === 'HIGH' ? 'HIGH' : 'MEDIUM'
      })) || []
    };
  }, [data]);

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in pb-12">
      <div className="bg-darker-bg border border-white/5 rounded-[32px] lg:rounded-[48px] p-6 lg:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ai-blue/5 blur-[120px] rounded-full -mr-64 -mt-64"></div>
        
        <div className="relative z-10 space-y-4 lg:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-ai-blue/10 border border-ai-blue/20 rounded-full">
            <div className="w-1 h-1 bg-ai-blue rounded-full animate-ping"></div>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-ai-blue">Performance Optimized</span>
          </div>
          <div className="flex items-end gap-4">
            <span className="text-6xl lg:text-8xl font-black text-white tracking-tighter leading-none">{auditData.overall}</span>
            <div className="flex flex-col mb-2">
              <span className="text-ai-blue font-black text-xs lg:text-sm uppercase tracking-widest">Global Index</span>
              <span className="text-medium-gray text-[9px] lg:text-[10px] uppercase font-bold tracking-widest mt-1 opacity-60">Status: {data ? 'LIVE_TELEMETRY' : 'SIMULATED'}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-stretch gap-4 w-full lg:w-auto">
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'SCANNING...' : 'Trigger Scan'}
          </button>
          
          <button 
            onClick={handleRunOptimization}
            disabled={isOptimizing || optimizationComplete}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg ${
              optimizationComplete 
                ? 'bg-expert-green text-dark-bg cursor-default' 
                : 'bg-ai-blue text-white hover:scale-105 active:scale-95 shadow-ai-blue/20'
            } disabled:opacity-50`}
          >
            {isOptimizing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Optimizing...</>
            ) : optimizationComplete ? (
              <><CheckCircle2 className="w-4 h-4" /> Optimized</>
            ) : (
              <><Rocket className="w-4 h-4" /> Global Boost</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {auditData.metrics.map((metric: Metric, idx: number) => (
          <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 hover:bg-white/[0.04] hover:border-white/20 transition-all group flex flex-col justify-between h-full">
            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:bg-white/10 transition-all`}>
              <metric.icon className={`w-7 h-7 ${metric.color}`} />
            </div>
            <div className="space-y-2">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{metric.name}</p>
              <div className="flex items-center justify-between gap-4">
                <span className="text-2xl font-black text-white">
                  {metric.value}{metric.isPercentage ? '%' : metric.unit}
                </span>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${metric.status === 'OPTIMAL' ? 'bg-expert-green/5 border-expert-green/20' : 'bg-white/5 border-white/10'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${metric.color.replace('text-', 'bg-')} animate-pulse`}></div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${metric.color}`}>{metric.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-[40px] p-8 lg:p-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white mb-2">Recommendations</h3>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">AI insights for your site</p>
            </div>
            <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black text-medium-gray uppercase tracking-widest">
              {auditData.recommendations.length} Suggestions
            </div>
          </div>

          <div className="space-y-4">
            {auditData.recommendations.length > 0 ? (
              auditData.recommendations.map((rec: Recommendation, idx: number) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:bg-white/[0.04] hover:border-ai-blue/30 transition-all cursor-pointer">
                  <div className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center bg-white/5 ${rec.priority === 'HIGH' ? 'text-red-500' : 'text-ai-blue'}`}>
                    {rec.priority === 'HIGH' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs lg:text-[13px] font-bold text-white tracking-tight leading-relaxed">{rec.message}</p>
                    <div className="flex flex-wrap items-center gap-4 text-[8px] font-black uppercase tracking-[0.2em]">
                      <span className="text-medium-gray">{rec.type}</span>
                      <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                      <span className={rec.priority === 'HIGH' ? 'text-red-500' : 'text-ai-blue'}>Impact: {rec.priority}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <button className="p-3 bg-white/5 rounded-xl opacity-0 lg:group-hover:opacity-100 transition-all hover:bg-ai-blue hover:text-black">
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center border border-white/5 border-dashed rounded-[32px]">
                <CheckCircle2 className="w-12 h-12 text-expert-green/20 mx-auto mb-4" />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">System optimized - no pending advisories</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-tech-purple/5 border border-tech-purple/10 rounded-[40px] p-8 lg:p-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-tech-purple/10 rounded-3xl flex items-center justify-center mb-8 border border-tech-purple/20 relative group overflow-hidden">
            <div className="absolute inset-0 bg-tech-purple/20 blur-2xl group-hover:scale-150 transition-transform"></div>
            <Zap className="w-10 h-10 text-tech-purple relative z-10" />
          </div>
          <h4 className="text-base font-black text-white uppercase tracking-widest mb-4 leading-tight">Premium Upgrade</h4>
          <p className="text-[11px] text-white/40 leading-relaxed uppercase font-medium mb-10 px-4">
            Standard nodes operate at <span className="text-white">94%</span> efficiency.
            Unlock <span className="text-tech-purple font-black italic">PRO_DEPLOYMENT</span> for sub-100ms response times and global edge replication.
          </p>
          <button className="w-full py-5 bg-tech-purple text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-tech-purple transition-all shadow-xl shadow-tech-purple/20 active:scale-95">
            Initialize Upgrade
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAudit;
