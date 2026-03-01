'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Home, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface PaymentDetail {
  reference: string;
  amount: number;
  currency?: string;
  createdAt: string;
  metadata?: {
    isNewGuest?: boolean;
    setupToken?: string;
  };
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [setupToken, setSetupToken] = useState('');

  useEffect(() => {
    const fetchPaymentDetails = async (reference: string) => {
      try {
        const data = await apiClient.verifyPayment(reference) as { success: boolean, data: { payment: PaymentDetail } };
        
        if (data.success) {
          setPaymentData(data.data.payment);
          if (data.data.payment.metadata?.isNewGuest) {
            setIsGuest(true);
            setSetupToken(data.data.payment.metadata.setupToken || '');
          }
        } else {
          // Redirect to payment page if verification fails
          router.push('/payment');
        }
      } catch (error) {
        console.error('Error fetching payment details:', error);
        router.push('/payment');
      } finally {
        setLoading(false);
      }
    };

    const reference = searchParams.get('reference');
    
    if (reference) {
      fetchPaymentDetails(reference);
    } else {
      // Redirect to payment page if no reference
      router.push('/payment');
    }
  }, [searchParams, router]);

  const handleGoToDashboard = () => {
    if (isGuest && setupToken) {
      router.push(`/reset-password?token=${setupToken}&setup=true`);
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-darker-bg text-white flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full border-4 border-white/20 border-t-ai-blue rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Loading Payment Details</h1>
          <p className="text-medium-gray mt-2">Please wait...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-darker-bg text-white py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6">
            <CheckCircle className="w-full h-full text-expert-green" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">
            Payment <span className="bg-gradient-to-r from-expert-green to-ai-blue bg-clip-text text-transparent">Successful</span>
          </h1>
          <p className="text-lg text-medium-gray">Your payment has been processed successfully!</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Payment Summary */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Payment Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-medium-gray uppercase tracking-widest">Transaction ID</span>
                <span className="font-mono text-sm">{paymentData?.reference || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-medium-gray uppercase tracking-widest">Amount</span>
                <span className="font-mono text-sm">
                  {paymentData?.amount ? `${paymentData.currency || 'USD'} ${(paymentData.amount / 100).toLocaleString()}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-medium-gray uppercase tracking-widest">Status</span>
                <span className="px-3 py-1 bg-expert-green/10 border border-expert-green/20 text-expert-green text-xs font-black uppercase tracking-widest rounded">
                  Completed
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-medium-gray uppercase tracking-widest">Date</span>
                <span className="font-mono text-sm">
                  {paymentData?.createdAt ? new Date(paymentData.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-medium-gray uppercase tracking-widest">Method</span>
                <span className="font-mono text-sm">Paystack</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Next Steps</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-expert-green/20 border border-expert-green/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-expert-green" />
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-tight">Account Activated</h3>
                  <p className="text-medium-gray text-sm">Your subscription is now active and you can access all premium features.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-ai-blue/20 border border-ai-blue/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ExternalLink className="w-4 h-4 text-ai-blue" />
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-tight">Access Dashboard</h3>
                  <p className="text-medium-gray text-sm">Manage your projects, view billing history, and monitor your subscription.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-tech-purple/20 border border-tech-purple/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ExternalLink className="w-4 h-4 text-tech-purple" />
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-tight">Start Building</h3>
                  <p className="text-medium-gray text-sm">Begin creating your digital infrastructure with our premium tools and templates.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoToDashboard}
            className="flex items-center gap-3 px-8 py-4 bg-ai-blue text-white font-black text-sm uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(0,102,255,0.3)]"
          >
            <span>{isGuest ? 'Complete Account Setup' : 'Go to Dashboard'}</span>
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex items-center gap-3 px-8 py-4 border border-white/10 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
          >
            <Home className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Support Info */}
        <div className="mt-12 text-center text-medium-gray text-sm">
          <p>Need help? Contact our support team at <Link href="mailto:support@sitemendr.com" className="text-ai-blue hover:text-white transition-colors">support@sitemendr.com</Link></p>
          <p className="mt-2">For payment inquiries, include your transaction ID: <span className="font-mono">{paymentData?.reference || 'N/A'}</span></p>
        </div>
      </div>
    </main>
  );
}