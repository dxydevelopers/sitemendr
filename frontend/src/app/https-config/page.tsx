'use client';

import { useState } from 'react';
import { 
  ShieldCheck, 
  Globe, 
  Lock, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  Database,
  Code,
  Terminal
} from 'lucide-react';

interface SecurityConfig {
  sslEnabled: boolean;
  hstsEnabled: boolean;
  forceHttps: boolean;
  certificateType: 'lets_encrypt' | 'custom' | 'cloudflare';
  certificateExpiry: string;
  securityHeaders: {
    csp: boolean;
    xss: boolean;
    frameOptions: boolean;
    contentType: boolean;
  };
}

interface ScanResult {
  id: number;
  check: string;
  status: 'good' | 'warning' | 'error';
  message: string;
}

export default function HTTPSConfig() {
  const [config, setConfig] = useState<SecurityConfig>({
    sslEnabled: true,
    hstsEnabled: true,
    forceHttps: true,
    certificateType: 'lets_encrypt',
    certificateExpiry: '',
    securityHeaders: {
      csp: true,
      xss: true,
      frameOptions: true,
      contentType: true
    }
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);

  const runSecurityScan = async () => {
    setIsScanning(true);
    setScanResults([]);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/security/scan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Security scan failed');
      }

      const checks: ScanResult[] = (result.data?.checks || []).map((check: any, index: number) => ({
        id: index + 1,
        check: check.check || `Check ${index + 1}`,
        status: check.status || 'warning',
        message: check.message || ''
      }));

      if (result.data?.config?.sslEnabled !== undefined) {
        setConfig(prev => ({ ...prev, sslEnabled: result.data.config.sslEnabled }));
      }

      setScanResults(checks);
    } catch (error) {
      console.error('Security scan trigger failed:', error);
      setScanResults([
        { id: 0, check: 'System Error', status: 'error', message: 'Failed to communicate with security infrastructure' }
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  const getSecurityStatus = () => {
    const goodCount = scanResults.filter(r => r.status === 'good').length;
    const totalCount = scanResults.length;
    return { goodCount, totalCount };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-5 h-5 text-expert-green" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <div className="w-5 h-5 rounded-full bg-white/20" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'border-expert-green/40 bg-expert-green/10';
      case 'warning': return 'border-yellow-500/40 bg-yellow-500/10';
      case 'error': return 'border-red-500/40 bg-red-500/10';
      default: return 'border-white/10 bg-white/[0.02]';
    }
  };

  return (
    <div className="min-h-screen bg-darker-bg text-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-ai-blue/5 border border-ai-blue/20 mb-6">
            <ShieldCheck className="w-4 h-4 text-ai-blue" />
            <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Security Configuration</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">
            HTTPS & <span className="bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent italic">Security</span>
          </h1>
          <p className="text-white/60 text-lg">
            Complete SSL/TLS configuration and security hardening for your application
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Security Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight">SSL/TLS Configuration</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-white/60 uppercase tracking-widest">SSL Enabled</label>
                  <input
                    type="checkbox"
                    checked={config.sslEnabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, sslEnabled: e.target.checked }))}
                    className="w-5 h-5 text-ai-blue bg-white/[0.02] border border-white/10 rounded focus:outline-none focus:ring-2 focus:ring-ai-blue/50"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-white/60 uppercase tracking-widest">HSTS Enabled</label>
                  <input
                    type="checkbox"
                    checked={config.hstsEnabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, hstsEnabled: e.target.checked }))}
                    className="w-5 h-5 text-ai-blue bg-white/[0.02] border border-white/10 rounded focus:outline-none focus:ring-2 focus:ring-ai-blue/50"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-white/60 uppercase tracking-widest">Force HTTPS</label>
                  <input
                    type="checkbox"
                    checked={config.forceHttps}
                    onChange={(e) => setConfig(prev => ({ ...prev, forceHttps: e.target.checked }))}
                    className="w-5 h-5 text-ai-blue bg-white/[0.02] border border-white/10 rounded focus:outline-none focus:ring-2 focus:ring-ai-blue/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white/60 uppercase tracking-widest">Certificate Type</label>
                  <select
                    value={config.certificateType}
                    onChange={(e) => setConfig(prev => ({ ...prev, certificateType: e.target.value as SecurityConfig['certificateType'] }))}
                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-colors"
                  >
                    <option value="lets_encrypt">Let&apos;s Encrypt (Free)</option>
                    <option value="custom">Custom Certificate</option>
                    <option value="cloudflare">Cloudflare SSL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white/60 uppercase tracking-widest">Certificate Expiry</label>
                  <input
                    type="date"
                    value={config.certificateExpiry}
                    onChange={(e) => setConfig(prev => ({ ...prev, certificateExpiry: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Security Headers */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Security Headers</h3>
              
              <div className="space-y-4">
                {Object.entries(config.securityHeaders).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-white/60 uppercase tracking-widest capitalize">
                      {key === 'csp' ? 'Content Security Policy' :
                       key === 'xss' ? 'XSS Protection' :
                       key === 'frameOptions' ? 'Frame Options' :
                       key === 'contentType' ? 'Content Type' : key}
                    </label>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        securityHeaders: { ...prev.securityHeaders, [key]: e.target.checked }
                      }))}
                      className="w-5 h-5 text-ai-blue bg-white/[0.02] border border-white/10 rounded focus:outline-none focus:ring-2 focus:ring-ai-blue/50"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl hover:border-ai-blue/40 transition-colors">
                  <Terminal className="w-5 h-5" />
                  Generate SSL Certificate
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl hover:border-ai-blue/40 transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                  Run Security Audit
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl hover:border-ai-blue/40 transition-colors">
                  <Code className="w-5 h-5" />
                  View Security Headers
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl hover:border-ai-blue/40 transition-colors">
                  <Globe className="w-5 h-5" />
                  Test HTTPS Configuration
                </button>
              </div>
            </div>
          </div>

          {/* Security Scan Results */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black uppercase tracking-tight">Security Scan Results</h3>
                <button
                  onClick={runSecurityScan}
                  disabled={isScanning}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold ${
                    isScanning 
                      ? 'bg-white/10 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-ai-blue to-tech-purple hover:scale-105 shadow-[0_0_40px_rgba(0,102,255,0.3)]'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  {isScanning ? 'Scanning...' : 'Run Security Scan'}
                </button>
              </div>

              {/* Security Overview */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="p-6 bg-white/[0.03] border border-white/10 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck className="w-6 h-6 text-expert-green" />
                    <span className="font-bold text-white/60 uppercase tracking-widest">SSL Status</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {config.sslEnabled ? 'SECURE' : 'INSECURE'}
                  </div>
                </div>

                <div className="p-6 bg-white/[0.03] border border-white/10 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Lock className="w-6 h-6 text-ai-blue" />
                    <span className="font-bold text-white/60 uppercase tracking-widest">TLS Version</span>
                  </div>
                  <div className="text-2xl font-black text-white">{scanResults.length > 0 ? 'Unknown' : 'N/A'}</div>
                </div>

                <div className="p-6 bg-white/[0.03] border border-white/10 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Wifi className="w-6 h-6 text-tech-purple" />
                    <span className="font-bold text-white/60 uppercase tracking-widest">Certificate</span>
                  </div>
                  <div className="text-2xl font-black text-white">{scanResults.length > 0 ? (config.sslEnabled ? 'Enabled' : 'Disabled') : 'N/A'}</div>
                </div>

                <div className="p-6 bg-white/[0.03] border border-white/10 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-6 h-6 text-pink-500" />
                    <span className="font-bold text-white/60 uppercase tracking-widest">Headers</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {scanResults.length > 0 ? `${getSecurityStatus().goodCount}/${getSecurityStatus().totalCount}` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Scan Results */}
              <div className="space-y-4">
                {scanResults.map((result) => (
                  <div key={result.id} className={`p-6 rounded-xl border ${getStatusColor(result.status)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(result.status)}
                        <div>
                          <h4 className="text-lg font-bold text-white">{result.check}</h4>
                          <p className="text-white/60 text-sm">{result.message}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        result.status === 'good' ? 'bg-green-500/20 text-green-400' :
                        result.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {result.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}

                {isScanning && (
                  <div className="p-6 bg-white/[0.03] border border-white/10 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ai-blue"></div>
                      <span className="text-white/60">Scanning security configuration...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Score */}
              {scanResults.length > 0 && (
                <div className="mt-8 p-6 bg-white/[0.03] border border-white/10 rounded-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-black text-white">Security Score</h4>
                    <div className="text-3xl font-black text-white">
                      {Math.round((getSecurityStatus().goodCount / getSecurityStatus().totalCount) * 100)}%
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-ai-blue to-tech-purple h-4 rounded-full transition-all duration-500"
                      style={{ width: `${(getSecurityStatus().goodCount / getSecurityStatus().totalCount) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-white/40 mt-2">
                    {getSecurityStatus().goodCount} out of {getSecurityStatus().totalCount} security checks passed
                  </div>
                </div>
              )}
            </div>

            {/* HTTPS Configuration Guide */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight">HTTPS Configuration Guide</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-bold mb-4 text-ai-blue">SSL Certificate Setup</h4>
                  <ul className="space-y-2 text-white/60">
                    <li>• Obtain SSL certificate from trusted CA</li>
                    <li>• Configure certificate on your web server</li>
                    <li>• Set up automatic certificate renewal</li>
                    <li>• Test SSL configuration with online tools</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-4 text-tech-purple">Security Headers</h4>
                  <ul className="space-y-2 text-white/60">
                    <li>• Enable HSTS for HTTP Strict Transport Security</li>
                    <li>• Configure Content Security Policy</li>
                    <li>• Set up XSS protection headers</li>
                    <li>• Add frame options for clickjacking protection</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-4 text-expert-green">Performance Optimization</h4>
                  <ul className="space-y-2 text-white/60">
                    <li>• Enable HTTP/2 for faster connections</li>
                    <li>• Configure OCSP stapling</li>
                    <li>• Set up certificate pinning</li>
                    <li>• Optimize TLS handshake performance</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-4 text-pink-500">Monitoring & Maintenance</h4>
                  <ul className="space-y-2 text-white/60">
                    <li>• Monitor certificate expiration dates</li>
                    <li>• Set up security alerts</li>
                    <li>• Regular security audits</li>
                    <li>• Update TLS configurations as needed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-white/40 text-sm">
          <p>Ensure your application is secure with proper HTTPS configuration and security headers. Regular security scans help maintain optimal protection.</p>
        </div>
      </div>
    </div>
  );
}


