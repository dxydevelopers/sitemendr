'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2, TriangleAlert } from 'lucide-react';
import { apiClient } from '@/lib/api';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const data = await apiClient.verifyEmail(token);

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified.');
          window.setTimeout(() => router.push('/dashboard'), 2500);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed.');
        }
      } catch {
        setStatus('error');
        setMessage('Verification failed.');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <main className="min-h-screen bg-[#05070a] pt-16 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center px-5 py-14 sm:px-8 lg:px-10">
        <section className="border-y border-white/10 py-10">
          <div className={`mb-8 grid h-12 w-12 place-items-center ${
            status === 'success'
              ? 'text-expert-green'
              : status === 'error'
                ? 'text-red-300'
                : 'text-ai-blue'
          }`}>
            {status === 'loading' && <Loader2 className="h-7 w-7 animate-spin" />}
            {status === 'success' && <Check className="h-7 w-7" />}
            {status === 'error' && <TriangleAlert className="h-7 w-7" />}
          </div>

          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            {status === 'loading' && 'Checking email.'}
            {status === 'success' && 'Email verified.'}
            {status === 'error' && 'Link failed.'}
          </h1>

          {message && <p className="mt-5 text-base font-semibold text-white/62">{message}</p>}

          <div className="mt-9 flex flex-wrap gap-3">
            {status === 'success' ? (
              <button type="button" onClick={() => router.push('/dashboard')} className="min-h-11 bg-white px-5 text-sm font-black text-black transition hover:bg-ai-blue hover:text-white">
                Open dashboard
              </button>
            ) : (
              <Link href="/login" className="inline-flex min-h-11 items-center bg-white px-5 text-sm font-black text-black transition hover:bg-ai-blue hover:text-white">
                Sign in
              </Link>
            )}
            {status === 'error' && (
              <Link href="/contact" className="inline-flex min-h-11 items-center border border-white/16 px-5 text-sm font-black text-white transition hover:border-white/34 hover:bg-white/8">
                Support
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#05070a]" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
