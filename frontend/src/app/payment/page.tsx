'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Zap, ShieldCheck, Users, Globe, CheckCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly' | 'one_time';
  features: string[];
  popular?: boolean;
}

interface SubscriptionData {
  status: string;
  planType: string;
  expiresAt: string;
  lastPaymentDate?: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');

  const plans: Plan[] = [
    {
      id: 'ai_foundation',
      name: 'AI-Launch',
      price: 299,
      currency: 'USD',
      period: 'yearly',
      features: [
        'AI-Powered Website Builder',
        'Basic SEO Optimization',
        '24/7 Technical Support',
        'SSL Certificate Included',
        '1 Custom Domain',
        '5GB Storage Space'
      ]
    },
    {
      id: 'pro_enhancement',
      name: 'Pro Dev',
      price: 1299,
      currency: 'USD',
      period: 'yearly',
      features: [
        'Everything in AI-Launch',
        'Advanced Analytics Dashboard',
        'Priority Support',
        'E-commerce Integration',
        '3 Custom Domains',
        '50GB Storage Space',
        'Performance Optimization'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 4999,
      currency: 'USD',
      period: 'yearly',
      features: [
        'Everything in Pro Dev',
        'Dedicated Account Manager',
        'Custom Development Hours',
        'Advanced Security Features',
        'Unlimited Custom Domains',
        '500GB Storage Space',
        '99.9% Uptime Guarantee',
        '24/7 Premium Support'
      ]
    },
    {
      id: 'maintenance',
      name: 'Systems Care',
      price: 99,
      currency: 'USD',
      period: 'monthly',
      features: [
        'Live System Check',
        'Security Updates',
        'Availability Backup Check',
        '2hr Manual Care',
        '24/7 Problem Response',
        'Priority Task List'
      ]
    },
    {
      id: 'self_hosted',
      name: 'Self-Hosted',
      price: 1299,
      currency: 'USD',
      period: 'one_time',
      features: [
        'Full Source Code',
        'Docker Configuration',
        'Deployment Guide',
        'Lifetime Updates',
        'Technical Handover',
        'Self-Managed Ops'
      ]
    }
  ];

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const data = await apiClient.getMySubscription();
      if (data.success) {
        setSubscription(data.data as SubscriptionData);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    setPaymentLoading(true);
    setError('');

    try {
      const paymentData = {
        amount: plan.price,
        currency: plan.currency,
        serviceType: 'subscription',
        description: `Subscription to ${plan.name} Plan`,
        metadata: {
          tier: plan.id,
          planType: plan.period === 'monthly' ? 'monthly' : 'yearly'
        }
      };

      const response = await apiClient.initializePayment(paymentData) as { 
        success: boolean; 
        data?: { paystack?: { authorization_url: string } }; 
        message?: string 
      };
      
      if (response.success && response.data?.paystack?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = response.data.paystack.authorization_url;
      } else {
        setError(response.message || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      setError('An error occurred while processing your payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleReactivate = () => {
    router.push('/payment/reactivate');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-darker-bg text-white flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full border-4 border-white/20 border-t-ai-blue rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Loading</h1>
          <p className="text-medium-gray mt-2">Please wait...</p>
        </div>
      </main>
    );
  }

  // If user already has an active subscription, show their current plan
  if (subscription && subscription.status === 'active') {
    return (
      <main className="min-h-screen bg-darker-bg text-white py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6">
              <CheckCircle className="w-full h-full text-expert-green" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">
              You&apos;re All <span className="bg-gradient-to-r from-expert-green to-ai-blue bg-clip-text text-transparent">Set</span>
            </h1>
            <p className="text-lg text-medium-gray">Your subscription is active and you have access to all premium features.</p>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Current Plan</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <span className="text-medium-gray uppercase tracking-widest">Plan Type</span>
                <h3 className="text-2xl font-black text-white mt-1">{subscription.planType}</h3>
              </div>
              <div>
                <span className="text-medium-gray uppercase tracking-widest">Status</span>
                <div className="mt-1 px-3 py-1 bg-expert-green/10 border border-expert-green/20 text-expert-green text-xs font-black uppercase tracking-widest rounded inline-block">
                  Active
                </div>
              </div>
              <div>
                <span className="text-medium-gray uppercase tracking-widest">Expires</span>
                <p className="font-mono text-sm mt-1">{new Date(subscription.expiresAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-medium-gray uppercase tracking-widest">Next Payment</span>
                <p className="font-mono text-sm mt-1">
                  {subscription.lastPaymentDate ? new Date(subscription.lastPaymentDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-8 py-4 bg-ai-blue text-white font-black text-sm uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(0,102,255,0.3)]"
            >
              <span>Go to Dashboard</span>
            </Link>
            
            <Link
              href="/"
              className="flex items-center gap-3 px-8 py-4 border border-white/10 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // If user has a suspended subscription, show reactivation option
  if (subscription && subscription.status === 'suspended') {
    return (
      <main className="min-h-screen bg-darker-bg text-white py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6">
              <Zap className="w-full h-full text-orange-500" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">
              Reactivate <span className="bg-gradient-to-r from-orange-500 to-ai-blue bg-clip-text text-transparent">Subscription</span>
            </h1>
            <p className="text-lg text-medium-gray">Your subscription has been suspended. Reactivate to regain access to premium features.</p>
          </div>

          <div className="bg-white/[0.02] border border-orange-500/20 rounded-2xl p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-orange-500/20 border border-orange-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-tight">Subscription Suspended</h3>
                <p className="text-medium-gray text-sm mt-1">Your subscription was suspended due to a payment issue. Reactivating will process the outstanding payment and restore your access immediately.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleReactivate}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-ai-blue text-white font-black text-sm uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,165,0,0.3)]"
            >
              <Zap className="w-5 h-5" />
              <span>Reactivate Subscription</span>
            </button>
            
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-8 py-4 border border-white/10 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-darker-bg text-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-ai-blue/5 border border-ai-blue/20 mb-8">
            <CreditCard className="w-4 h-4 text-ai-blue" />
            <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Secure Payment</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">
            Choose Your <span className="bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent">Plan</span>
          </h1>
          <p className="text-lg text-medium-gray">Select a plan that fits your needs and get started with our premium features.</p>
        </div>

        <div className="grid lg:grid-cols-3 xl:grid-cols-5 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:border-ai-blue/40 transition-all duration-500 flex flex-col ${
                plan.popular ? 'ring-2 ring-ai-blue/40 bg-white/[0.03]' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-ai-blue text-white text-xs font-black uppercase tracking-widest rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">{plan.name}</h3>
                <div className="text-3xl font-black text-ai-blue mb-2">
                  {plan.currency} {plan.price.toLocaleString()}
                </div>
                <p className="text-medium-gray text-sm">
                  {plan.period === 'one_time' ? 'one-time' : plan.period === 'monthly' ? 'per month' : 'per year'}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-expert-green flex-shrink-0" />
                    <span className="text-sm text-medium-gray">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={paymentLoading}
                className={`w-full py-4 font-black text-sm uppercase tracking-widest rounded-xl transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-ai-blue to-tech-purple text-white hover:scale-105 shadow-[0_0_40px_rgba(0,102,255,0.3)]'
                    : 'bg-white text-black hover:bg-white/90'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {paymentLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  plan.period === 'one_time' ? 'Buy Now' : 'Subscribe Now'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Payment Security */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Secure Payment</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-expert-green mt-0.5" />
              <div>
                <h3 className="font-black text-white uppercase tracking-tight">Bank-Level Security</h3>
                <p className="text-medium-gray text-sm mt-1">Your payment information is encrypted and secure.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <Globe className="w-6 h-6 text-ai-blue mt-0.5" />
              <div>
                <h3 className="font-black text-white uppercase tracking-tight">Global Payments</h3>
                <p className="text-medium-gray text-sm mt-1">Accept payments from anywhere in the world.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Users className="w-6 h-6 text-tech-purple mt-0.5" />
              <div>
                <h3 className="font-black text-white uppercase tracking-tight">Trusted Provider</h3>
                <p className="text-medium-gray text-sm mt-1">Powered by Paystack, trusted by thousands of businesses.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-8 py-4 border border-white/10 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          
          <Link
            href="/"
            className="flex items-center gap-3 px-8 py-4 border border-white/10 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
          >
            <span>Continue as Guest</span>
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
          <p>Need help choosing a plan? Contact our support team at <Link href="mailto:support@sitemendr.com" className="text-ai-blue hover:text-white transition-colors">support@sitemendr.com</Link></p>
          <p className="mt-2">All plans include a 14-day money-back guarantee.</p>
        </div>
      </div>
    </main>
  );
}