'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Loader } from 'lucide-react';
import Link from 'next/link';

import { apiClient } from '@/lib/api';

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const [paymentData, setPaymentData] = useState<{ reference?: string } | null>(null);

  useEffect(() => {
    const verifyPayment = async (reference: string) => {
      try {
        const data = await apiClient.verifyPayment(reference);
        
        if (data.success) {
          setStatus('success');
          setMessage('Payment verified successfully!');
          setPaymentData(data.data);
          
          // Redirect to success page after 2 seconds
          setTimeout(() => {
            router.push(`/payment/success?reference=${reference}`);
          }, 2000);
        } else {
          setStatus('failed');
          setMessage(data.message || 'Payment verification failed');
        }
      } catch {
        setStatus('failed');
        setMessage('Unable to verify payment. Please contact support.');
      }
    };

    const reference = searchParams.get('reference');
    const statusParam = searchParams.get('status');
    
    if (reference) {
      verifyPayment(reference);
    } else if (statusParam === 'success') {
      // Handle success from frontend redirect
      setStatus('success');
      setMessage('Payment completed successfully!');
      setPaymentData({ reference: 'unknown' });
    } else if (statusParam === 'failed') {
      // Handle failure from frontend redirect
      setStatus('failed');
      setMessage('Payment failed. Please try again.');
    } else {
      // No reference or status, redirect to payment page
      router.push('/payment');
    }
  }, [searchParams, router]);

  const handleRetry = () => {
    router.push('/payment');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-darker-bg text-white flex items-center justify-center p-6">
      <div className="max-w-md mx-auto text-center relative">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,102,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>

        <div className="relative z-10 space-y-8">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 mx-auto">
                <Loader className="w-full h-full animate-spin text-ai-blue" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight">Verifying Payment</h1>
              <p className="text-medium-gray">Please wait while we verify your payment with Paystack...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto">
                <CheckCircle className="w-full h-full text-expert-green" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight">Payment Successful</h1>
              <p className="text-medium-gray">{message}</p>
              {paymentData && (
                <div className="mt-6 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                  <p className="text-sm text-medium-gray mb-2">Transaction ID:</p>
                  <p className="font-mono text-sm">{paymentData.reference || 'N/A'}</p>
                </div>
              )}
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-16 h-16 mx-auto">
                <XCircle className="w-full h-full text-red-500" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight">Payment Failed</h1>
              <p className="text-medium-gray">{message}</p>
            </>
          )}

          <div className="flex flex-col gap-4 mt-8">
            {status === 'success' && (
              <Link 
                href="/dashboard"
                className="w-full py-3 bg-ai-blue text-white font-black text-sm uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
              >
                Go to Dashboard
              </Link>
            )}
            
            {status === 'failed' && (
              <>
                <button
                  onClick={handleRetry}
                  className="w-full py-3 bg-ai-blue text-white font-black text-sm uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={handleGoHome}
                  className="w-full py-3 border border-white/10 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
                >
                  Go Home
                </button>
              </>
            )}

            <Link 
              href="/"
              className="flex items-center justify-center gap-2 text-medium-gray hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}