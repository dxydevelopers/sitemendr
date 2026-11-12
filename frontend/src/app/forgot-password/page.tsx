'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { apiClient } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.forgotPassword(email.trim().toLowerCase());
      if (!response.success) {
        throw new Error(response.message || 'We could not process your request. Please try again.');
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'We could not process your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05070a] pt-16 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col px-5 sm:px-8 lg:px-10">
        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[0.9fr_1fr] lg:gap-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-ai-blue">Account access</p>
            <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl">
              Reset your Sitemendr password.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/52 sm:text-base">
              Enter the email address you use for Sitemendr.
            </p>
          </div>

          <div className="w-full max-w-md lg:ml-auto">
            <div className="border-y border-white/10 py-7">
              {submitted ? (
                <div aria-live="polite">
                  <div className="flex h-12 w-12 items-center justify-center border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
                    <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-6 text-2xl font-bold tracking-tight">Check your inbox</h2>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    If an account exists for <span className="font-semibold text-white">{email.trim()}</span>, reset instructions will be sent to that address. Check your spam folder too. The link expires after one hour.
                  </p>
                  <p className="mt-4 text-xs leading-5 text-white/38">No email yet? Check the address and try again.</p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-7 text-sm font-semibold text-white transition hover:text-ai-blue"
                  >
                    Try again or use another email
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center border border-white/12 text-white/70">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-6 text-2xl font-bold tracking-tight">Reset your password</h2>
                  <p className="mt-2 text-sm leading-6 text-white/48">We will email reset instructions if the address matches an account.</p>

                  <form className="mt-7 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                      <div role="alert" className="border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-medium text-red-100">
                        {error}
                      </div>
                    )}

                    <div>
                      <label htmlFor="reset-email" className="text-xs font-bold uppercase tracking-[0.1em] text-white/40">Email address</label>
                      <input
                        id="reset-email"
                        type="email"
                        autoComplete="email"
                        required
                        className="mt-2 w-full border-0 border-b border-white/16 bg-transparent px-0 py-4 text-base text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (error) setError('');
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="min-h-13 w-full bg-white px-5 text-sm font-bold uppercase tracking-[0.1em] text-black transition hover:bg-ai-blue hover:text-white disabled:cursor-wait disabled:opacity-50"
                    >
                      {loading ? 'Sending link...' : 'Send reset link'}
                    </button>
                  </form>
                </>
              )}

              <Link href="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white/48 transition hover:text-white">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
