'use client';

import { useSubscriptions, useAssessments, useCurrentUser } from '@/hooks/use-api';
import { Loader2, TriangleAlert, CreditCard, FileText, TrendingUp, Zap, Shield, Globe, Terminal, Activity } from 'lucide-react';

/**
 * Dashboard Overview Component
 * 
 * Modernized HUD aesthetic for high-tech control center feel.
 */
export function DashboardOverview() {
  // Using React Query hooks for data fetching
  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser();
  const { data: subscriptions, isLoading: subsLoading, error: subsError } = useSubscriptions();
  const { data: assessments, isLoading: assessLoading, error: assessError } = useAssessments();

  // Show loading state while fetching - but allow showing cached data while refetching
  const isLoading = userLoading || subsLoading || assessLoading;
  const hasError = userError || subsError || assessError;
  
  // If we have cached data but it's refetching, show the cached data instead of loading
  const showData = user || subscriptions || assessments;
  
  if (isLoading && !showData) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-ai-blue/10 rounded-full animate-spin border-t-ai-blue shadow-[0_0_20px_rgba(0,102,255,0.1)]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-ai-blue animate-pulse" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 animate-pulse">Synchronizing Dashboard Telemetry...</p>
      </div>
    );
  }

  // Show error state
  if (userError || subsError || assessError) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-red-400 gap-4 bg-red-500/5 border border-red-500/10 rounded-[2rem]">
        <TriangleAlert className="w-10 h-10 mb-2 opacity-50" />
        <span className="text-xs font-black uppercase tracking-widest text-center">Neural Link Interrupted.<br/>Failed to load dashboard telemetry.</span>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500 hover:text-white transition-all">Retry Link</button>
      </div>
    );
  }

  // Calculate stats
  const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;
  const completedAssessments = assessments?.filter(a => a.status === 'completed').length || 0;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Welcome Section */}
      <div className="relative p-10 lg:p-14 bg-gradient-to-br from-ai-blue/10 to-tech-purple/5 border border-white/5 rounded-[3rem] overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
          <Activity className="w-48 h-48 text-white rotate-12" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-expert-green animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
            <span className="text-[9px] font-black text-ai-blue uppercase tracking-[0.4em]">System_Authorized</span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-black text-white uppercase tracking-tighter mb-4">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-tech-purple italic">{user?.name || 'Authorized_User'}</span>
          </h1>
          <p className="text-medium-gray font-mono text-[10px] lg:text-xs uppercase tracking-[0.2em] max-w-xl leading-relaxed opacity-60">
            Node synchronization successful. Interface protocol active. Monitoring {activeSubscriptions} live edge nodes and {completedAssessments} completed assessments.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {[
          { label: 'Active_Nodes', value: activeSubscriptions, icon: <Globe className="w-5 h-5" />, color: 'text-ai-blue', bg: 'bg-ai-blue/10', border: 'border-ai-blue/20' },
          { label: 'Assessment_Logs', value: completedAssessments, icon: <FileText className="w-5 h-5" />, color: 'text-tech-purple', bg: 'bg-tech-purple/10', border: 'border-tech-purple/20' },
          { label: 'Security_Level', value: (user?.role === 'admin' ? 'ROOT' : 'CLIENT'), icon: <Shield className="w-5 h-5" />, color: 'text-expert-green', bg: 'bg-expert-green/10', border: 'border-expert-green/20' }
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 lg:p-10 flex flex-col justify-between group hover:border-white/10 transition-all relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-start justify-between mb-10">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.border} border flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-mono text-white/10 group-hover:text-white/20 transition-colors">0{i+1}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">{stat.label}</p>
              <p className="text-4xl font-black text-white tracking-tighter uppercase">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-10 lg:p-14 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-ai-blue/10 border border-ai-blue/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-ai-blue" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white">Latest Telemetry</h2>
            </div>
            <button className="text-[9px] font-black uppercase tracking-widest text-ai-blue hover:text-white transition-colors">Export_Logs</button>
          </div>
          
          {assessments && assessments.length > 0 ? (
            <div className="space-y-4">
              {assessments.slice(0, 5).map((assessment) => (
                <div 
                  key={assessment.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-ai-blue/30 transition-all gap-4"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-ai-blue/10 group-hover:border-ai-blue/20 transition-all">
                      <Zap className="w-5 h-5 text-medium-gray group-hover:text-ai-blue" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-tight mb-1 group-hover:text-ai-blue transition-colors">{assessment.businessName}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{assessment.businessType}</span>
                        <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                        <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Node_{assessment.id.slice(-8)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Timestamp</p>
                      <p className="text-[10px] font-mono text-white/40 uppercase">{new Date(assessment.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      assessment.status === 'completed' 
                        ? 'bg-expert-green/10 text-expert-green border-expert-green/20'
                        : assessment.status === 'processing'
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}>
                      {assessment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
              <Activity className="w-12 h-12 text-white/5" />
              <p className="text-white/20 font-black text-[10px] uppercase tracking-[0.4em]">No telemetry feed detected</p>
              <button className="px-8 py-3 bg-ai-blue/10 border border-ai-blue/20 text-ai-blue text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-ai-blue hover:text-white transition-all">Initialize First Assessment</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;
