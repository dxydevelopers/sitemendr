'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.login({ email, password });

      if (response.success) {
        // apiClient.login already saves the token
        if (response.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-darker-bg py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-mono">
      {/* Infrastructure Grid Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-darker-bg via-transparent to-darker-bg"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-20">
        <div className="text-center">
          <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">
            CLIENT <span className="italic bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent">PORTAL</span>
          </h2>
          <p className="text-medium-gray text-xs uppercase tracking-widest font-bold">
            Access your AI-powered workspace
          </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center">
                AUTH_FAILURE: {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-medium-gray uppercase tracking-widest px-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full px-6 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-ai-blue transition-all text-sm"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-medium-gray uppercase tracking-widest">Password</label>
                  <Link href="/forgot-password" title="Forgot Password" className="text-[8px] text-ai-blue hover:underline uppercase font-bold tracking-widest">
                    Recovery Req?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  className="w-full px-6 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-ai-blue transition-all text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-ai-blue text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.3em] overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? 'AUTHENTICATING...' : 'INITIATE SESSION'}
              </span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-medium-gray text-[10px] uppercase tracking-widest">
              New to Sitemendr?{' '}
              <Link href="/register" className="text-ai-blue font-black hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
