'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2, TriangleAlert } from 'lucide-react';
import { apiClient } from '@/lib/api';

type SignupProfile = {
  name?: string;
  accountType: string;
  entityName?: string;
  entityContactEmail?: string;
  entityPhone?: string;
  country: string;
  defaultCurrency: string;
};

export default function OAuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Finishing secure sign-in.');
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const finishOAuth = async () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const callbackToken = params.get('token');
      const returnedNonce = params.get('browser_nonce');
      const expectedNonce = sessionStorage.getItem('sitemendr_oauth_browser_nonce');
      const token = callbackToken || sessionStorage.getItem('sitemendr_oauth_pending_token');
      const isNewUser = params.get('new_user') === '1' || sessionStorage.getItem('sitemendr_oauth_pending_new_user') === '1';
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);

      if (callbackToken && (!returnedNonce || !expectedNonce || returnedNonce !== expectedNonce)) {
        if (active) {
          setStatus('error');
          setMessage('This sign-in session could not be verified. Restart sign-in from Sitemendr.');
        }
        return;
      }

      if (!token) {
        if (active) {
          setStatus('error');
          setMessage('Sitemendr could not complete social sign-in. You can try again or use email and password.');
        }
        return;
      }

      localStorage.setItem('sitemendr_auth_token', token);
      if (callbackToken) {
        sessionStorage.setItem('sitemendr_oauth_pending_token', token);
        sessionStorage.setItem('sitemendr_oauth_pending_new_user', isNewUser ? '1' : '0');
      }
      try {
        const profileResponse = await apiClient.getProfile();
        if (!profileResponse.success || !profileResponse.user) throw new Error('Could not load your Sitemendr account.');
        let user = profileResponse.user;

        if (isNewUser) {
          const draftText = sessionStorage.getItem('sitemendr_oauth_signup_profile');
          if (!draftText) throw new Error('Your account was created, but the signup details are missing. Please contact support to finish setup.');
          const draft = JSON.parse(draftText) as SignupProfile;
          if (!['individual', 'business', 'organization', 'agency'].includes(draft.accountType)) throw new Error('Select a valid account type to finish signup.');
          if (draft.accountType !== 'individual' && (!draft.entityName || draft.entityName.trim().length < 2)) throw new Error('Add the business, organisation, or agency name to finish signup.');

          const updateResponse = await apiClient.updateProfile({
            ...(draft.name?.trim() ? { name: draft.name.trim() } : {}),
            accountType: draft.accountType,
            entityName: draft.accountType === 'individual' ? '' : draft.entityName?.trim() || '',
            entityContactEmail: draft.accountType === 'individual' ? '' : draft.entityContactEmail || '',
            entityPhone: draft.accountType === 'individual' ? '' : draft.entityPhone || '',
            country: draft.country,
            defaultCurrency: draft.defaultCurrency,
            billingRegion: draft.country,
          });
          if (!updateResponse.success || !updateResponse.user) throw new Error(updateResponse.message || 'Could not save your signup details. Please try again.');
          user = updateResponse.user;
          sessionStorage.removeItem('sitemendr_oauth_signup_profile');
        }

        localStorage.setItem('sitemendr_client_user', JSON.stringify(user));
        localStorage.setItem('user', JSON.stringify(user));
        sessionStorage.removeItem('sitemendr_oauth_browser_nonce');
        sessionStorage.removeItem('sitemendr_oauth_pending_token');
        sessionStorage.removeItem('sitemendr_oauth_pending_new_user');
        if (!active) return;
        setStatus('success');
        setMessage('You are signed in. Opening your Sitemendr workspace.');
        window.setTimeout(() => router.replace('/dashboard'), 700);
      } catch (error) {
        if (!active) return;
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Sitemendr could not complete social sign-in.');
      }
    };

    finishOAuth();
    return () => { active = false; };
  }, [router]);

  return (
    <main className="min-h-screen bg-[#05070a] px-5 pt-16 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center py-14">
        <section className="border-y border-white/10 py-10">
          <div className={`mb-6 grid h-12 w-12 place-items-center ${status === 'success' ? 'text-expert-green' : status === 'error' ? 'text-red-300' : 'text-ai-blue'}`}>
            {status === 'loading' && <Loader2 className="h-7 w-7 animate-spin" />}
            {status === 'success' && <Check className="h-7 w-7" />}
            {status === 'error' && <TriangleAlert className="h-7 w-7" />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{status === 'loading' ? 'Signing you in.' : status === 'success' ? 'You’re all set.' : 'Sign-in needs attention.'}</h1>
          <p role={status === 'error' ? 'alert' : 'status'} className="mt-4 text-sm leading-6 text-white/60">{message}</p>
          {status === 'error' && <div className="mt-7 flex flex-wrap gap-3"><Link href="/login" className="inline-flex min-h-11 items-center bg-white px-5 text-sm font-bold text-black">Back to sign in</Link><button type="button" onClick={() => window.location.reload()} className="min-h-11 border border-white/20 px-5 text-sm font-semibold text-white">Retry</button></div>}
        </section>
      </div>
    </main>
  );
}
