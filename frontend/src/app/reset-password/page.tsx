'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get('token');
  const isSetup = searchParams.get('setup') === 'true';

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
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
        <div className="text-center relative">
          <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">
            {isSetup ? 'ACCOUNT' : 'PASSWORD'} <span className="italic bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent">{isSetup ? 'SETUP' : 'RESET'}</span>
          </h2>
          <p className="text-medium-gray text-xs uppercase tracking-widest">
            {isSetup ? 'Complete your registration' : 'Secure your account with a new password'}
          </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-3xl p-10 shadow-2xl relative">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-expert-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-expert-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-bold">Success! Your password has been {isSetup ? 'set' : 'reset'}.</p>
              <p className="text-medium-gray text-sm">Redirecting to dashboard...</p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center">
                  ERROR: {error}
                </div>
              )}

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-medium-gray uppercase tracking-[0.2em]">New Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-6 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-ai-blue transition-all"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-medium-gray uppercase tracking-[0.2em]">Confirm Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-6 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-ai-blue transition-all"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full bg-ai-blue text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {loading ? 'PROCESSING...' : (isSetup ? 'FINALIZE SETUP' : 'RESET PASSWORD')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-darker-bg flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ai-blue"></div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
