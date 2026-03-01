'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiClient.login({ email, password });

      if (data.success) {
        onLogin();
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Network error. Please try again.';
      setError(errorMessage);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-darker-bg py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-mono">
      {/* Infrastructure Grid Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-darker-bg via-transparent to-darker-bg"></div>
      </div>

      {/* Scanning Line Effect */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-20">
        <div className="w-full h-[2px] bg-ai-blue/50 blur-sm animate-scan"></div>
      </div>

      {/* Dynamic Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-ai-blue/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-tech-purple/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-20">
        {/* Terminal Header */}
        <div className="text-center relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-50">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-ai-blue"></div>
            <span className="text-[10px] tracking-[0.4em] text-ai-blue uppercase">Admin Portal</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-ai-blue"></div>
          </div>
          
          <div className="inline-block px-4 py-1.5 rounded-full bg-ai-blue/10 border border-ai-blue/20 mb-6">
            <span className="text-[10px] font-black text-ai-blue uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-ai-blue animate-ping"></span>
              Authorized Access Only
            </span>
          </div>
          
          <h2 className="text-xl font-black text-white mb-2 tracking-widest uppercase">
            ADMIN <span className="italic bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent">ACCESS</span>
          </h2>
          <div className="flex justify-center items-center gap-2 text-medium-gray text-[10px] uppercase tracking-widest font-bold">
            <span>SVR-ID: SM-7741</span>
            <span className="w-1 h-1 rounded-full bg-medium-gray/30"></span>
            <span>OS: V4.2.0-CORE</span>
          </div>
        </div>

        <div className="relative group">
          {/* HUD Corners */}
          <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-ai-blue/40 rounded-tl-lg transition-all group-hover:border-ai-blue group-hover:scale-110"></div>
          <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-ai-blue/40 rounded-tr-lg transition-all group-hover:border-ai-blue group-hover:scale-110"></div>
          <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-ai-blue/40 rounded-bl-lg transition-all group-hover:border-ai-blue group-hover:scale-110"></div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-ai-blue/40 rounded-br-lg transition-all group-hover:border-ai-blue group-hover:scale-110"></div>

          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-3xl p-10 shadow-2xl shadow-black/40 relative overflow-hidden">
            {/* Terminal Matrix Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden text-[8px] font-mono leading-none break-all p-4 select-none">
              {Array(20).fill('SITEMENDR-OS-INFRASTRUCTURE-ENCRYPTED-STREAM-DATA-NODE-ACCESS-GRANTED-').join('')}
            </div>

            <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  AUTH_FAILURE: {error}
                </div>
              )}

              <div className="space-y-5">
                <div className="space-y-2 group/input">
                  <div className="flex justify-between items-center px-4">
                    <label htmlFor="email" className="text-[10px] font-black text-medium-gray uppercase tracking-[0.2em]">
                      Systems Identifier
                    </label>
                    <span className="text-[8px] text-ai-blue/40 font-bold">UID_REQ</span>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-6 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-ai-blue focus:bg-white/[0.05] transition-all font-mono text-sm"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2 group/input">
                  <div className="flex justify-between items-center px-4">
                    <label htmlFor="password" className="text-[10px] font-black text-medium-gray uppercase tracking-[0.2em]">
                      Password
                    </label>
                    <span className="text-[8px] text-ai-blue/40 font-bold">KEY_REQ</span>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full px-6 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-ai-blue focus:bg-white/[0.05] transition-all font-mono text-sm"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full bg-ai-blue text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.3em] overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-ai-blue/20"
              >
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative z-10 group-hover:text-dark-bg transition-colors duration-300 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-white animate-bounce"></span>
                      AUTHENTICATING...
                    </>
                  ) : (
                    'INITIATE ACCESS'
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-6">
          <button className="text-[9px] font-black text-medium-gray uppercase tracking-[0.2em] hover:text-ai-blue transition-colors flex items-center gap-2">
            <span className="w-1 h-1 bg-medium-gray rounded-full"></span>
            Lost Credentials? Request Resync
          </button>

          {/* System Status Bar */}
          <div className="w-full flex justify-between items-center px-6 py-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[7px] text-medium-gray uppercase font-bold">Latency</span>
                <span className="text-[10px] text-expert-green font-mono">14MS</span>
              </div>
              <div className="w-px h-6 bg-white/10"></div>
              <div className="flex flex-col">
                <span className="text-[7px] text-medium-gray uppercase font-bold">Uptime</span>
                <span className="text-[10px] text-white font-mono">99.99%</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[7px] text-medium-gray uppercase font-bold">Region</span>
              <span className="text-[10px] text-white font-mono">GLOBAL-01</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}