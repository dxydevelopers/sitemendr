'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
        const response = await fetch(`/api/auth/verify-email/${token}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          // Redirect to login after a delay
          setTimeout(() => {
            router.push('/login');
          }, 5000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed. The link may be expired.');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setMessage('Network error. Please try again later.');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-darker-bg py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-mono">
      {/* Infrastructure Grid Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-darker-bg via-transparent to-darker-bg"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-20">
        <div className="text-center">
          <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">
            Email <span className="italic bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent">Verification</span>
          </h2>
          <p className="text-medium-gray text-[10px] uppercase tracking-[0.3em] font-bold">
            Verify Your Email
          </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-3xl p-10 shadow-2xl text-center">
          {status === 'loading' && (
            <div className="space-y-6">
              <div className="w-16 h-16 border-4 border-ai-blue/20 border-t-ai-blue rounded-full animate-spin mx-auto"></div>
              <p className="text-white font-bold uppercase tracking-widest text-xs animate-pulse">Processing Verification...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-expert-green/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-expert-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="bg-expert-green/10 border border-expert-green/20 text-expert-green px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                AUTH_SUCCESS: Verified
              </div>
              <p className="text-white text-sm">{message}</p>
              <p className="text-medium-gray text-[10px] uppercase tracking-widest">Redirecting to login portal...</p>
              <Link href="/login" className="block text-ai-blue font-black hover:underline uppercase tracking-widest text-[10px] mt-4">
                Manual Jump to Login →
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                AUTH_ERROR: Failed
              </div>
              <p className="text-white text-sm">{message}</p>
              <div className="flex flex-col gap-4">
                <Link href="/login" className="text-ai-blue font-black hover:underline uppercase tracking-widest text-[10px]">
                  Return to Login
                </Link>
                <Link href="/contact" className="text-medium-gray hover:text-white transition-colors uppercase tracking-widest text-[10px]">
                  Contact Support
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-darker-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-ai-blue/20 border-t-ai-blue rounded-full animate-spin"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
