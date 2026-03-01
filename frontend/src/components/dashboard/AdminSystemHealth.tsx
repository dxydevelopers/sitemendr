'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { Activity, Database, Cpu, ShieldCheck, Mail, Zap } from 'lucide-react';

interface SystemHealth {
  timestamp: string;
  services: {
    database: { status: string };
    openai: { status: string };
    groq: { status: string };
    paystack: { status: string };
    email: { status: string };
  };
  system: {
    memory: Record<string, number>;
    uptime: number;
    nodeVersion: string;
  };
}

export default function AdminSystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await apiClient.getSystemHealth() as { success: boolean; data: SystemHealth };
      if (res.success) {
        setHealth(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
      case 'configured':
        return 'text-expert-green';
      case 'unhealthy':
      case 'missing_key':
        return 'text-red-500';
      default:
        return 'text-orange-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
      case 'configured':
        return 'bg-expert-green/10 border-expert-green/20';
      case 'unhealthy':
      case 'missing_key':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-orange-500/10 border-orange-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <Activity className="w-10 h-10 text-ai-blue animate-pulse" />
        <p className="text-[10px] font-black text-ai-blue uppercase tracking-[0.4em]">Probing System Vitals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-ai-blue">System Vitals</h2>
          <p className="text-[10px] text-medium-gray mt-1">REAL-TIME INFRASTRUCTURE MONITORING</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-expert-green animate-ping"></span>
          <span className="text-[10px] font-black uppercase tracking-widest">Live Updates</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Service Cards */}
        {[
          { name: 'Primary Database', id: 'database', icon: Database, status: health?.services.database.status || 'unknown' },
          { name: 'OpenAI Interface', id: 'openai', icon: Zap, status: health?.services.openai.status || 'unknown' },
          { name: 'Groq Inference', id: 'groq', icon: Cpu, status: health?.services.groq.status || 'unknown' },
          { name: 'Paystack Gateway', id: 'paystack', icon: ShieldCheck, status: health?.services.paystack.status || 'unknown' },
          { name: 'Email SMTP', id: 'email', icon: Mail, status: health?.services.email.status || 'unknown' },
        ].map((service) => (
          <div key={service.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.04] transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/5 rounded-xl">
                <service.icon className="w-5 h-5 text-ai-blue" />
              </div>
              <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter border ${getStatusBg(service.status)} ${getStatusColor(service.status)}`}>
                {service.status.replace('_', ' ')}
              </div>
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">{service.name}</h3>
            <p className="text-[9px] text-medium-gray mt-1 font-mono">ID: {service.id.toUpperCase()}_NODE_01</p>
          </div>
        ))}
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl relative overflow-hidden">
          <div className="flex items-center gap-4 mb-6">
            <Cpu className="w-6 h-6 text-ai-blue" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Memory Distribution</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(health?.system.memory || {}).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-[10px] uppercase tracking-widest mb-2">
                  <span className="text-medium-gray">{key}</span>
                  <span className="text-white">{(value / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-ai-blue to-tech-purple"
                    style={{ width: `${Math.min((value / 1024 / 1024 / 2), 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
          <div className="flex items-center gap-4 mb-6">
            <Activity className="w-6 h-6 text-ai-blue" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Operational Metadata</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
              <span className="text-[8px] text-medium-gray uppercase block mb-1">Uptime</span>
              <span className="text-xs font-mono text-ai-blue">{health ? (health.system.uptime / 3600).toFixed(2) : '0'} Hours</span>
            </div>
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
              <span className="text-[8px] text-medium-gray uppercase block mb-1">Node Version</span>
              <span className="text-xs font-mono text-ai-blue">{health?.system.nodeVersion || 'N/A'}</span>
            </div>
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
              <span className="text-[8px] text-medium-gray uppercase block mb-1">Server Time</span>
              <span className="text-xs font-mono text-ai-blue">{health ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}</span>
            </div>
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
              <span className="text-[8px] text-medium-gray uppercase block mb-1">OS Platform</span>
              <span className="text-xs font-mono text-ai-blue">Linux/x64</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
