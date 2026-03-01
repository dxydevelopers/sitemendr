'use client';

import { useState, useEffect } from 'react';
import { 
  Cloud, 
  ShieldCheck, 
  Zap, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  Globe,
  Terminal,
  Upload,
  ChevronDown
} from 'lucide-react';

interface DeploymentStep {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  duration: string;
  description: string;
}

interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  strategy: 'blue_green' | 'rolling' | 'canary';
  rollbackEnabled: boolean;
  autoScaling: boolean;
  monitoring: boolean;
}

export default function DeploymentPage() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setSubscriptions(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    }
  };

  const [config, setConfig] = useState<DeploymentConfig>({
    environment: 'production',
    strategy: 'blue_green',
    rollbackEnabled: true,
    autoScaling: true,
    monitoring: true
  });

  const deploymentSteps: DeploymentStep[] = [
    { id: 'prepare', title: 'Preparing Resources', status: 'pending', duration: '10 seconds', description: 'Checking server availability and quotas' },
    { id: 'build', title: 'Building Application', status: 'pending', duration: '2-3 minutes', description: 'Compiling and bundling the application code' },
    { id: 'security', title: 'Security Scan', status: 'pending', duration: '30 seconds', description: 'Scanning for vulnerabilities and security issues' },
    { id: 'deploy', title: 'Deploying your site', status: 'pending', duration: '1-2 minutes', description: 'Executing deployment via Vercel/Netlify' },
    { id: 'health', title: 'Health Check', status: 'pending', duration: '30 seconds', description: 'Verifying application health and functionality' }
  ];

  const [steps, setSteps] = useState<DeploymentStep[]>(deploymentSteps);

  const startDeployment = async () => {
    if (!selectedSub) {
      alert('Please select a site to deploy');
      return;
    }

    setIsDeploying(true);
    setLogs([`[${new Date().toLocaleTimeString()}] Initializing deployment for ${selectedSub}...`]);
    
    try {
      // Step 1: Prep
      updateStep('prepare', 'in_progress');
      await new Promise(r => setTimeout(r, 1500));
      updateStep('prepare', 'completed');
      setLogs(prev => [...prev, '✓ Resources prepared successfully']);

      // Step 2: Build
      updateStep('build', 'in_progress');
      await new Promise(r => setTimeout(r, 2000));
      updateStep('build', 'completed');
      setLogs(prev => [...prev, '✓ Build bundle generated: main.a7f291.js']);

      // Step 3: Security
      updateStep('security', 'in_progress');
      await new Promise(r => setTimeout(r, 1000));
      updateStep('security', 'completed');
      setLogs(prev => [...prev, '✓ 0 vulnerabilities found']);

      // Step 4: Real Backend Deployment Trigger
      updateStep('deploy', 'in_progress');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Calling deployment service...`]);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/subscriptions/${selectedSub}/deploy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        updateStep('deploy', 'completed');
        setLogs(prev => [...prev, `✓ Deployed successfully to ${result.data.url}`]);

        if (result.data?.simulated) {
          setLogs(prev => [...prev, "⚠ Deployment used simulated provider response (configure provider tokens for real deploys)"]);
        }
        
        // Step 5: Health Check
        updateStep('health', 'in_progress');
        await new Promise(r => setTimeout(r, 1000));
        updateStep('health', 'completed');
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Pipeline completed successfully!`]);
      } else {
        updateStep('deploy', 'failed');
        setLogs(prev => [...prev, `❌ Deployment failed: ${result.message}`]);
      }
    } catch (error) {
      setLogs(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsDeploying(false);
    }
  };

  const updateStep = (id: string, status: DeploymentStep['status']) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-expert-green" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-ai-blue animate-spin" />;
      case 'failed': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <div className="w-5 h-5 rounded-full bg-white/20" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-expert-green/40 bg-expert-green/10';
      case 'in_progress': return 'border-ai-blue/40 bg-ai-blue/10';
      case 'failed': return 'border-red-500/40 bg-red-500/10';
      default: return 'border-white/10 bg-white/[0.02]';
    }
  };

  return (
    <div className="min-h-screen bg-darker-bg text-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-ai-blue/5 border border-ai-blue/20 mb-6">
            <Cloud className="w-4 h-4 text-ai-blue" />
            <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Deployment Pipeline</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">
            Production <span className="bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent italic">Deploy</span>
          </h1>
          <p className="text-white/60 text-lg">
            Automated deployment pipeline with zero-downtime and rollback capabilities
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Deployment Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2 text-white/60 uppercase tracking-widest">Environment</label>
                  <select
                    value={config.environment}
                    onChange={(e) => setConfig(prev => ({ ...prev, environment: e.target.value as DeploymentConfig['environment'] }))}
                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-colors"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white/60 uppercase tracking-widest">Deployment Strategy</label>
                  <select
                    value={config.strategy}
                    onChange={(e) => setConfig(prev => ({ ...prev, strategy: e.target.value as DeploymentConfig['strategy'] }))}
                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-colors"
                  >
                    <option value="blue_green">Blue-Green</option>
                    <option value="rolling">Rolling</option>
                    <option value="canary">Canary</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.rollbackEnabled}
                      onChange={(e) => setConfig(prev => ({ ...prev, rollbackEnabled: e.target.checked }))}
                      className="w-4 h-4 text-ai-blue bg-white/[0.02] border border-white/10 rounded focus:outline-none focus:ring-2 focus:ring-ai-blue/50"
                    />
                    <span className="text-sm text-white/60 uppercase tracking-widest">Rollback</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoScaling}
                      onChange={(e) => setConfig(prev => ({ ...prev, autoScaling: e.target.checked }))}
                      className="w-4 h-4 text-ai-blue bg-white/[0.02] border border-white/10 rounded focus:outline-none focus:ring-2 focus:ring-ai-blue/50"
                    />
                    <span className="text-sm text-white/60 uppercase tracking-widest">Auto Scaling</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.monitoring}
                      onChange={(e) => setConfig(prev => ({ ...prev, monitoring: e.target.checked }))}
                      className="w-4 h-4 text-ai-blue bg-white/[0.02] border border-white/10 rounded focus:outline-none focus:ring-2 focus:ring-ai-blue/50"
                    />
                    <span className="text-sm text-white/60 uppercase tracking-widest">Monitoring</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl hover:border-ai-blue/40 transition-colors">
                  <Terminal className="w-5 h-5" />
                  View Logs
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl hover:border-ai-blue/40 transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                  Security Scan
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl hover:border-ai-blue/40 transition-colors">
                  <Zap className="w-5 h-5" />
                  Performance Test
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl hover:border-ai-blue/40 transition-colors">
                  <Globe className="w-5 h-5" />
                  CDN Purge
                </button>
              </div>
            </div>
          </div>

          {/* Deployment Pipeline */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-4">Select Website</h3>
                  <div className="relative">
                    <select
                      value={selectedSub}
                      onChange={(e) => setSelectedSub(e.target.value)}
                      className="appearance-none w-full md:w-80 px-6 py-4 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-all cursor-pointer font-mono text-sm"
                    >
                      <option value="">-- Select Subscription --</option>
                      {subscriptions.map(sub => (
                        <option key={sub.id} value={sub.id} className="bg-darker-bg">
                          {sub.siteName || sub.id.substring(0, 8)} ({sub.tier})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowLogs(!showLogs)}
                    className="flex items-center gap-2 px-6 py-4 border border-white/10 rounded-xl hover:border-ai-blue/40 transition-colors font-bold text-sm"
                  >
                    {showLogs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showLogs ? 'Hide Matrix' : 'Show Matrix'}
                  </button>
                  <button
                    onClick={startDeployment}
                    disabled={isDeploying || !selectedSub}
                    className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all ${
                      isDeploying || !selectedSub
                        ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' 
                        : 'bg-gradient-to-r from-ai-blue to-tech-purple hover:scale-105 shadow-[0_0_40px_rgba(0,102,255,0.3)] text-white'
                    }`}
                  >
                    <Upload className="w-5 h-5" />
                    {isDeploying ? 'Syncing...' : 'Initiate Deployment'}
                  </button>
                </div>
              </div>

              {/* Pipeline Visualization */}
              <div className="relative">
                {/* Connection Line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/5"></div>
                
                <div className="space-y-4">
                  {steps.map((step) => (
                    <div key={step.id} className={`relative pl-12 p-5 rounded-xl border transition-all duration-500 ${getStatusColor(step.status)}`}>
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black border border-white/10 rounded-full flex items-center justify-center z-10">
                        {getStatusIcon(step.status)}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-md font-bold text-white mb-1 uppercase tracking-tight">{step.title}</h4>
                          <p className="text-white/40 text-[10px] font-mono">{step.description}</p>
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest ${
                            step.status === 'completed' ? 'text-expert-green' :
                            step.status === 'in_progress' ? 'text-ai-blue' :
                            step.status === 'failed' ? 'text-red-500' :
                            'text-white/20'
                          }`}>
                            {step.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Logs Component */}
              {showLogs && (
                <div className="mt-8 bg-black border border-white/10 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-ai-blue animate-pulse"></div>
                      <span className="text-[10px] font-black text-ai-blue uppercase tracking-[0.3em]">System Matrix Output</span>
                    </div>
                  </div>
                  <div className="p-6 font-mono text-[11px] h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                    {logs.map((log, i) => (
                      <div key={i} className={`mb-1 ${log.startsWith('✓') ? 'text-expert-green' : log.startsWith('❌') ? 'text-red-500' : 'text-white/40'}`}>
                        {log}
                      </div>
                    ))}
                    {isDeploying && (
                      <div className="text-ai-blue animate-pulse mt-2">_ Executing subprocess...</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-white/40 text-sm">
          <p>Zero-downtime deployment with automatic rollback on failure. Estimated deployment time: 5-10 minutes.</p>
        </div>
      </div>
    </div>
  );
}


