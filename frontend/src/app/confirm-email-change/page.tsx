'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2, Mail, TriangleAlert } from 'lucide-react';
import { apiClient } from '@/lib/api';

function ConfirmEmailChangeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const [state, setState] = useState<'ready' | 'saving' | 'success' | 'error'>('ready');
  const [canRetry, setCanRetry] = useState(false);
  const [message, setMessage] = useState('Confirm the new email to make it your Sitemendr sign-in address.');

  const confirm = async () => {
    if (!token) { setCanRetry(false); setState('error'); setMessage('This confirmation link is incomplete. Request a new email change from My Account.'); return; }
    setCanRetry(false);
    setState('saving');
    let result: { success: boolean; message: string; email?: string };
    try { result = await apiClient.confirmEmailChange(token); }
    catch { setCanRetry(true); setState('error'); setMessage('Could not reach Sitemendr. Check your connection and try again.'); return; }
    if (!result.success || !result.email) {
      setState('error'); setMessage(result.message || 'This link is invalid or expired. Request a new one from My Account.'); return;
    }

    for (const key of ['sitemendr_client_user', 'user']) {
      const current = localStorage.getItem(key);
      if (current) {
        try {
          const parsed = JSON.parse(current);
          localStorage.setItem(key, JSON.stringify({ ...parsed, email: result.email, pendingEmail: '', isEmailVerified: true }));
        } catch { localStorage.removeItem(key); }
      }
    }
    setState('success'); setMessage(result.message || 'Your sign-in email is updated.');
    if (localStorage.getItem('sitemendr_auth_token')) window.setTimeout(() => router.push('/dashboard'), 1600);
  };

  return (
    <main className="min-h-screen bg-[#05070a] pt-16 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center px-5 py-14 sm:px-8 lg:px-10">
        <section className="border-y border-white/10 py-10">
          <div className={`mb-8 grid h-12 w-12 place-items-center ${state === 'success' ? 'text-expert-green' : state === 'error' ? 'text-red-300' : 'text-ai-blue'}`}>
            {state === 'saving' && <Loader2 className="h-7 w-7 animate-spin" />}
            {state === 'success' && <Check className="h-7 w-7" />}
            {state === 'error' && <TriangleAlert className="h-7 w-7" />}
            {state === 'ready' && <Mail className="h-7 w-7" />}
          </div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{state === 'success' ? 'Email updated.' : state === 'error' ? 'Could not confirm.' : 'Confirm your new email.'}</h1>
          <p className="mt-5 text-base font-semibold text-white/64">{message}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            {state === 'ready' && <button type="button" onClick={confirm} className="min-h-11 bg-white px-5 text-sm font-bold text-black transition hover:bg-ai-blue hover:text-white">Confirm email change</button>}
            {state === 'success' && <button type="button" onClick={() => router.push(localStorage.getItem('sitemendr_auth_token') ? '/dashboard' : '/login')} className="min-h-11 bg-white px-5 text-sm font-bold text-black transition hover:bg-ai-blue hover:text-white">Continue</button>}
            {state === 'error' && canRetry && <button type="button" onClick={confirm} className="min-h-11 bg-white px-5 text-sm font-bold text-black transition hover:bg-ai-blue hover:text-white">Try again</button>}
            {state === 'error' && <Link href="/login" className="inline-flex min-h-11 items-center border border-white/20 px-5 text-sm font-bold text-white transition hover:border-white/50">Sign in</Link>}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ConfirmEmailChangePage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#05070a]" />}><ConfirmEmailChangeContent /></Suspense>;
}
