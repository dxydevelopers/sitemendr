'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { apiClient } from '@/lib/api';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();

  const token = searchParams.get('token');
  const isSetup = searchParams.get('setup') === 'true';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('This password link is missing or invalid. Request a new one to continue.');
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords don’t match yet. Check both fields and try again.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.resetPassword({ token, password });
      if (!response.success) {
        throw new Error(response.message || 'We couldn’t update your password. Request a new link and try again.');
      }
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'We couldn’t update your password. Please try again.');
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
              {isSetup ? 'Finish setting up your account.' : 'Choose a new password.'}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/52 sm:text-base">
              {isSetup
                ? 'Create a password to finish setting up your Sitemendr account.'
                : 'Set a new password to secure your Sitemendr account. You’ll sign in with it once it’s saved.'}
            </p>
          </div>

          <div className="w-full max-w-md lg:ml-auto">
            <div className="border-y border-white/10 py-7">
              {success ? (
                <div aria-live="polite">
                  <div className="flex h-12 w-12 items-center justify-center border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
                    <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-6 text-2xl font-bold tracking-tight">Password {isSetup ? 'created' : 'updated'}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Your password is ready. Sign in with your new password to continue to your workspace.
                  </p>
                  <Link href="/login" className="mt-7 inline-flex min-h-12 w-full items-center justify-center bg-white px-5 text-sm font-bold uppercase tracking-[0.1em] text-black transition hover:bg-ai-blue hover:text-white">
                    Continue to sign in
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center border border-white/12 text-white/70">
                    <KeyRound className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-6 text-2xl font-bold tracking-tight">{isSetup ? 'Create a password' : 'Set a new password'}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/48">Choose at least 8 characters. You can use a password manager to create and save one.</p>

                  {!token && (
                    <div role="alert" className="mt-6 border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
                      This password link is missing. Request a new reset link to continue.
                    </div>
                  )}

                  <form className="mt-7 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                      <div role="alert" className="border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-medium text-red-100">
                        {error}
                      </div>
                    )}

                    <div>
                      <label htmlFor="new-password" className="text-xs font-bold uppercase tracking-[0.1em] text-white/40">New password</label>
                      <div className="mt-2 flex border-b border-white/16 transition focus-within:border-ai-blue">
                        <input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          minLength={8}
                          required
                          className="min-w-0 flex-1 bg-transparent py-4 text-base text-white outline-none placeholder:text-white/24"
                          placeholder="At least 8 characters"
                          value={password}
                          onChange={(event) => {
                            setPassword(event.target.value);
                            if (error) setError('');
                          }}
                        />
                        <button type="button" onClick={() => setShowPassword(value => !value)} className="grid w-10 place-items-center text-white/36 transition hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-[0.1em] text-white/40">Confirm password</label>
                      <div className="mt-2 flex border-b border-white/16 transition focus-within:border-ai-blue">
                        <input
                          id="confirm-password"
                          type={showConfirmation ? 'text' : 'password'}
                          autoComplete="new-password"
                          minLength={8}
                          required
                          className="min-w-0 flex-1 bg-transparent py-4 text-base text-white outline-none placeholder:text-white/24"
                          placeholder="Enter the password again"
                          value={confirmPassword}
                          onChange={(event) => {
                            setConfirmPassword(event.target.value);
                            if (error) setError('');
                          }}
                        />
                        <button type="button" onClick={() => setShowConfirmation(value => !value)} className="grid w-10 place-items-center text-white/36 transition hover:text-white" aria-label={showConfirmation ? 'Hide confirmation password' : 'Show confirmation password'}>
                          {showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {confirmPassword && (
                        <p className={`mt-2 text-xs ${password === confirmPassword ? 'text-emerald-200/80' : 'text-white/38'}`} aria-live="polite">
                          {password === confirmPassword ? 'Passwords match' : 'Re-enter the same password'}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !token}
                      className="min-h-13 w-full bg-white px-5 text-sm font-bold uppercase tracking-[0.1em] text-black transition hover:bg-ai-blue hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? 'Saving password...' : isSetup ? 'Create password' : 'Save new password'}
                    </button>
                  </form>
                </>
              )}

              <Link href={success ? '/login' : '/forgot-password'} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white/48 transition hover:text-white">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {success ? 'Back to sign in' : 'Request another reset link'}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#05070a]" aria-label="Loading password reset" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
