'use client';

import { useState } from 'react';
import { ArrowRight, Shield } from 'lucide-react';
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

      if (data.success && data.user?.role === 'admin') {
        onLogin();
      } else if (data.success) {
        setError('This account does not have admin access.');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Network error. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1fr] lg:px-10">
        <div className="max-w-xl">
          <div className="flex h-12 w-12 items-center justify-center text-ai-blue">
            <Shield className="h-8 w-8" />
          </div>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-ai-blue">Admin access</p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Sign in to manage Sitemendr operations.
          </h1>
        </div>

        <form className="w-full border-y border-white/10 py-7 lg:ml-auto lg:max-w-md" onSubmit={handleSubmit}>
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/34">Secure workspace</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Admin sign in</h2>
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-6 border border-red-400/35 px-4 py-3 text-sm font-semibold text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="admin-email" className="text-[10px] font-black uppercase tracking-[0.18em] text-white/36">
                Email address
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                className="mt-2 w-full border-0 border-b border-white/16 bg-transparent px-0 py-4 text-base text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue"
                placeholder="admin@sitemendr.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="text-[10px] font-black uppercase tracking-[0.18em] text-white/36">
                Password
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                required
                className="mt-2 w-full border-0 border-b border-white/16 bg-transparent px-0 py-4 text-base text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 flex min-h-12 w-full items-center justify-between gap-4 bg-white px-5 text-left text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-ai-blue hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </section>
    </main>
  );
}
