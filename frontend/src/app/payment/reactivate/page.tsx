'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface SubscriptionData {
  id: string;
  status: string;
  planType: string;
  expiresAt: string;
  lastPaymentDate?: string;
  price?: number;
  user?: {
    email: string;
  };
}

export default function PaymentReactivatePage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await apiClient.getMySubscription();
        if (data.success) {
          setSubscription(data.data);
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [router]);

  const handleReactivate = async () => {
    if (!subscription) return;

    setPaymentLoading(true);
    setError('');

    try {
      // Calculate reactivation amount (usually the monthly/annual fee)
      const amount = subscription.price || 999;
      const currency = 'USD';

      const paymentData = {
        amount,
        currency,
        email: subscription.user?.email,
        plan: subscription.plan,
        description: `Subscription Reactivation - ${subscription.plan}`,
        serviceType: 'subscription_reactivation'
      };

      const response = await apiClient.initializePayment(paymentData);
      
      if (response.success && response.data?.paystack?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = response.data.paystack.authorization_url;
      } else {
        setError((response as { message?: string }).message || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      setError('An error occurred while processing your payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-darker-bg text-white flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full border-4 border-white/20 border-t-ai-blue rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Loading Subscription</h1>
          <p className="text-medium-gray mt-2">Please wait...</p>
        </div>
      </main>
    );
  }

  if (!subscription) {
    return (
      <main className="min-h-screen bg-darker-bg text-white flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <AlertTriangle className="w-full h-full text-red-500" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight">No Subscription Found</h1>
          <p className="text-medium-gray mt-2">Unable to find your subscription details.</p>
          <Link 
            href="/dashboard"
            className="mt-6 inline-block px-6 py-3 bg-ai-blue text-white font-black text-sm uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const isSuspended = subscription.status === 'suspended';
  const isCancelled = subscription.status === 'cancelled';

  return (
    <main className="min-h-screen bg-darker-bg text-white py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6">
            {isSuspended ? (
              <AlertTriangle className="w-full h-full text-orange-500" />
            ) : (
              <RefreshCw className="w-full h-full text-ai-blue" />
            )}
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">
            Reactivate <span className="bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent">Subscription</span>
          </h1>
          <p className="text-lg text-medium-gray">
            {isSuspended ? 'Your subscription has been suspended due to payment issues.' : 'Reactivate your subscription to regain access to premium features.'}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Subscription Details */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Subscription Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-medium-gray uppercase tracking-widest">Plan Type</span>
                <span className="font-bold text-white uppercase tracking-tight">{subscription.planType}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-medium-gray uppercase tracking-widest">Status</span>
                <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest rounded ${
                  isSuspended ? 'bg-orange-500/10 border border-orange-500/20 text-orange-500' :
                  isCancelled ? 'bg-red-500/10 border border-red-500/20 text-red-500' :
                  'bg-white/10 border border-white/10 text-medium-gray'
                }`}>
                  {subscription.status}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-medium-gray uppercase tracking-widest">Expires</span>
                <span className="font-mono text-sm">
                  {new Date(subscription.expiresAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-medium-gray uppercase tracking-widest">Last Payment</span>
                <span className="font-mono text-sm">
                  {subscription.lastPaymentDate ? new Date(subscription.lastPaymentDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-medium-gray uppercase tracking-widest">Amount</span>
                <span className="font-mono text-sm font-bold">
                  USD {subscription.price ? subscription.price.toLocaleString() : '999'}/month
                </span>
              </div>
            </div>
          </div>

          {/* Reactivation Info */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Reactivation Info</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-ai-blue/20 border border-ai-blue/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-ai-blue" />
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-tight">Immediate Access</h3>
                  <p className="text-medium-gray text-sm">Your subscription will be reactivated immediately after payment.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-expert-green/20 border border-expert-green/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-expert-green" />
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-tight">No Data Loss</h3>
                  <p className="text-medium-gray text-sm">All your projects and data will be preserved.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-tech-purple/20 border border-tech-purple/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-tech-purple" />
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-tight">Secure Payment</h3>
                  <p className="text-medium-gray text-sm">Powered by Paystack with bank-level security.</p>
                </div>
              </div>

              {isSuspended && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-black text-orange-500 uppercase tracking-tight">Payment Required</h4>
                      <p className="text-medium-gray text-sm mt-1">Your subscription was suspended due to a failed payment. Reactivating will process the outstanding payment.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleReactivate}
            disabled={paymentLoading}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-ai-blue to-tech-purple text-white font-black text-sm uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(0,102,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paymentLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Reactivate Subscription</span>
              </>
            )}
          </button>
          
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-8 py-4 border border-white/10 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            <p className="text-red-500 font-bold">{error}</p>
          </div>
        )}

        {/* Support Info */}
        <div className="mt-12 text-center text-medium-gray text-sm">
          <p>Need help? Contact our support team at <Link href="mailto:support@sitemendr.com" className="text-ai-blue hover:text-white transition-colors">support@sitemendr.com</Link></p>
          <p className="mt-2">For payment issues, include your subscription ID: <span className="font-mono">{subscription.id}</span></p>
        </div>
      </div>
    </main>
  );
}