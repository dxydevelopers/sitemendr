'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await apiClient.forgotPassword(email);
      setMessage(response.message || 'If an account exists with this email, a reset link has been sent.');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process request. Please try again.';
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
            PASSWORD <span className="italic bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent">RECOVERY</span>
          </h2>
          <p className="text-medium-gray text-xs uppercase tracking-widest font-bold">
            Initiate credential resynchronization
          </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          {message ? (
            <div className="text-center space-y-6">
              <div className="bg-expert-green/10 border border-expert-green/20 text-expert-green px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                SYSTEM_MSG: REQUEST_PROCESSED
              </div>
              <p className="text-white text-sm">{message}</p>
              <Link href="/login" className="inline-block text-ai-blue font-black hover:underline uppercase tracking-[0.2em] text-xs">
                Return to Login
              </Link>
            </div>
          ) : (
            <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center">
                  ERR_CODE: {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-medium-gray uppercase tracking-widest px-1">Registered Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-6 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-ai-blue transition-all text-sm"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full bg-ai-blue text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.3em] overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? 'PROCESSING...' : 'SEND RECOVERY LINK'}
                </span>
              </button>
              
              <div className="text-center">
                <Link href="/login" className="text-medium-gray text-[10px] uppercase tracking-widest hover:text-white transition-colors">
                  Remember your security key?
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
