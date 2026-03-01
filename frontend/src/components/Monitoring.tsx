'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Eye, 
  EyeOff,
  Sparkles,
  Globe,
  Cpu,
  ShieldCheck
} from 'lucide-react';

interface Metric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface SystemStatus {
  uptime: number;
  lastCheck: string;
  overall: 'operational' | 'degraded' | 'outage';
  services: {
    api: boolean;
    database: boolean;
    payment: boolean;
    email: boolean;
  };
}

export default function Monitoring() {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    uptime: 99.9,
    lastCheck: new Date().toLocaleString(),
    overall: 'operational',
    services: {
      api: true,
      database: true,
      payment: true,
      email: true
    }
  });

  const [metrics, setMetrics] = useState<Metric[]>([
    { name: 'Response Time', value: 24, unit: 'ms', status: 'good', trend: 'stable' },
    { name: 'CPU Usage', value: 15, unit: '%', status: 'good', trend: 'down' },
    { name: 'Memory Usage', value: 45, unit: '%', status: 'good', trend: 'stable' },
    { name: 'Disk Usage', value: 65, unit: '%', status: 'warning', trend: 'up' },
    { name: 'Active Users', value: 1247, unit: 'users', status: 'good', trend: 'up' },
    { name: 'Error Rate', value: 0.1, unit: '%', status: 'good', trend: 'down' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time monitoring updates
      setSystemStatus(prev => ({
        ...prev,
        lastCheck: new Date().toLocaleString(),
        uptime: Math.min(99.99, prev.uptime + Math.random() * 0.01)
      }));

      setMetrics(prev => prev.map(metric => {
        const change = (Math.random() - 0.5) * 5;
        const newValue = Math.max(0, Math.min(100, metric.value + change));
        
        let status: 'good' | 'warning' | 'critical' = 'good';
        if (newValue > 80) status = 'critical';
        else if (newValue > 60) status = 'warning';

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (change > 1) trend = 'up';
        else if (change < -1) trend = 'down';

        return { ...metric, value: newValue, status, trend };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getServiceStatus = (service: boolean) => {
    return service ? 'operational' : 'degraded';
  };

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-expert-green';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-white/40';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingUp className="w-4 h-4 rotate-180" />;
      case 'stable': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-darker-bg text-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-ai-blue/5 border border-ai-blue/20 mb-6">
            <Eye className="w-4 h-4 text-ai-blue" />
            <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Real-time Monitoring</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">
            System <span className="bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent italic">Health</span>
          </h1>
          <p className="text-white/60 text-lg">
            Live monitoring dashboard with comprehensive system metrics and status
          </p>
        </div>

        {/* System Status Overview */}
        <div className="grid lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-expert-green" />
                <span className="text-sm font-bold text-white/60 uppercase tracking-widest">Overall Status</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                systemStatus.overall === 'operational' ? 'bg-green-500/20 text-green-400' :
                systemStatus.overall === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {systemStatus.overall.toUpperCase()}
              </div>
            </div>
            <div className="text-3xl font-black text-white">{systemStatus.uptime}%</div>
            <div className="text-xs text-white/40 uppercase tracking-widest">Uptime</div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-ai-blue" />
              <span className="text-sm font-bold text-white/60 uppercase tracking-widest">Last Check</span>
            </div>
            <div className="text-lg font-bold text-white">{systemStatus.lastCheck}</div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="w-6 h-6 text-tech-purple" />
              <span className="text-sm font-bold text-white/60 uppercase tracking-widest">Active Services</span>
            </div>
            <div className="text-3xl font-black text-white">
              {Object.values(systemStatus.services).filter(Boolean).length}/4
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-pink-500" />
              <span className="text-sm font-bold text-white/60 uppercase tracking-widest">Global Reach</span>
            </div>
            <div className="text-3xl font-black text-white">24/7</div>
            <div className="text-xs text-white/40 uppercase tracking-widest">Monitoring</div>
          </div>
        </div>

        {/* Service Status Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
            <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Service Status</h3>
            <div className="space-y-4">
              {Object.entries(systemStatus.services).map(([service, status]) => (
                <div key={service} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${status ? 'bg-expert-green' : 'bg-red-500'}`}></div>
                    <span className="font-bold text-white capitalize">{service}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    status ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {getServiceStatus(status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
            <h3 className="text-xl font-black mb-6 uppercase tracking-tight">System Metrics</h3>
            <div className="space-y-4">
              {metrics.map((metric, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getMetricColor(metric.status).replace('text-', 'bg-')}`}></div>
                    <div>
                      <div className="font-bold text-white">{metric.name}</div>
                      <div className="text-xs text-white/40">{metric.value}{metric.unit}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-xs font-bold ${getMetricColor(metric.status)}`}>
                      {metric.status.toUpperCase()}
                    </div>
                    <div className={`text-white/40 ${metric.trend === 'up' ? 'text-green-400' : metric.trend === 'down' ? 'text-red-400' : 'text-white/40'}`}>
                      {getTrendIcon(metric.trend)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monitoring Controls */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h3 className="text-xl font-black uppercase tracking-tight">Monitoring Controls</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMonitoring(!isMonitoring)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold ${
                  isMonitoring 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
              >
                {isMonitoring ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
              </button>
              <button className="flex items-center gap-3 px-6 py-3 bg-ai-blue text-white rounded-xl hover:bg-ai-blue/80 transition-colors">
                <Sparkles className="w-5 h-5" />
                Run Diagnostics
              </button>
            </div>
          </div>

          {/* Alert System */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <span className="font-bold text-red-400 uppercase tracking-widest">Critical Alerts</span>
              </div>
              <div className="text-2xl font-black text-white">0</div>
              <div className="text-xs text-white/40 uppercase tracking-widest">Active</div>
            </div>

            <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                <span className="font-bold text-yellow-400 uppercase tracking-widest">Warnings</span>
              </div>
              <div className="text-2xl font-black text-white">1</div>
              <div className="text-xs text-white/40 uppercase tracking-widest">Active</div>
            </div>

            <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="font-bold text-green-400 uppercase tracking-widest">Healthy</span>
              </div>
              <div className="text-2xl font-black text-white">98%</div>
              <div className="text-xs text-white/40 uppercase tracking-widest">Systems</div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-white/40 text-sm">
          <p>Real-time monitoring powered by advanced telemetry systems. Data updates every 3 seconds.</p>
        </div>
      </div>
    </div>
  );
}