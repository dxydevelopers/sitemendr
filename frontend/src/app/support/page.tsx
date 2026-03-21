'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient, SupporterTier } from '@/lib/api';
import SectionDivider from '@/components/SectionDivider';
import AirdropGifts from '@/components/AirdropGifts';
import { Check, Star, Zap, Shield, Crown, Heart, ArrowLeft, CreditCard } from 'lucide-react';

const mockTiers: SupporterTier[] = [
  {
    id: 'starter-id',
    name: 'Starter Supporter',
    slug: 'starter',
    monthlyPrice: 5,
    discountPercent: 5,
    displayOrder: 1,
    isActive: true,
    perks: ['exclusive-badge', 'supporter-wall', 'community-access'],
  },
  {
    id: 'standard-id',
    name: 'Standard Supporter',
    slug: 'standard',
    monthlyPrice: 15,
    discountPercent: 10,
    displayOrder: 2,
    isActive: true,
    perks: ['early-access', 'voting-rights', 'starter-perks'],
  },
  {
    id: 'plus-id',
    name: 'Plus Supporter',
    slug: 'plus',
    monthlyPrice: 30,
    discountPercent: 15,
    displayOrder: 3,
    isActive: true,
    perks: ['roundtable-invites', 'product-council', 'standard-perks'],
  },
  {
    id: 'premium-id',
    name: 'Premium Supporter',
    slug: 'premium',
    monthlyPrice: 60,
    discountPercent: 20,
    displayOrder: 4,
    isActive: true,
    perks: ['ama-access', 'spotlight-status', 'plus-perks'],
  },
  {
    id: 'founders-id',
    name: 'Founders Circle',
    slug: 'founders-circle',
    monthlyPrice: 100,
    discountPercent: 25,
    displayOrder: 5,
    isActive: true,
    perks: ['private-sessions', 'vip-support', 'premium-perks'],
  },
];

const SupportContent = () => {
  const [tiers, setTiers] = useState<SupporterTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const tierIdParam = searchParams.get('tier');
  
  const selectedTier = tiers.find(t => t.id === tierIdParam);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await apiClient.fetchAllSupporterTiers();
        if (res.success && res.tiers.length > 0) {
          setTiers(res.tiers);
        } else {
          setTiers(mockTiers);
        }
      } catch (err) {
        console.error('Failed to fetch tiers', err);
        setTiers(mockTiers);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTiers();
  }, []);

  const handleSubscribe = async (tierId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sitemendr_auth_token') : null;
    if (!token) {
      alert('Please log in to become a supporter. We need your account to track your rewards and discounts.');
      window.location.href = `/login?redirect=/support?tier=${tierId}`;
      return;
    }

    try {
      const res = await apiClient.initializeSupporterSubscription(tierId);
      if (res.success && res.data?.paystack?.authorization_url) {
        window.location.href = res.data.paystack.authorization_url;
      } else {
        alert(res.message || 'Failed to initialize subscription. Please try again.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred. Please ensure you are logged in.');
      if (err.status === 401) {
        window.location.href = `/login?redirect=/support?tier=${tierId}`;
      }
    }
  };

  const getTierIcon = (slug: string) => {
    switch (slug) {
      case 'starter': return <Heart className="w-6 h-6 text-pink-500" />;
      case 'standard': return <Zap className="w-6 h-6 text-ai-blue" />;
      case 'plus': return <Star className="w-6 h-6 text-tech-purple" />;
      case 'premium': return <Shield className="w-6 h-6 text-expert-green" />;
      case 'founders-circle': return <Crown className="w-6 h-6 text-yellow-500" />;
      default: return <Check className="w-6 h-6 text-ai-blue" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-ai-blue/20 border-t-ai-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  if (selectedTier) {
    return (
      <main className="min-h-screen bg-black text-white selection:bg-ai-blue/30 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => window.location.href = '/support'}
            className="flex items-center gap-2 text-medium-gray hover:text-white uppercase text-[10px] font-black mb-12 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Airdrops
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-[#050505] border border-white/5 p-8 md:p-12 rounded-[40px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-ai-blue/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            
            <div>
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
                {getTierIcon(selectedTier.slug)}
              </div>
              <span className="text-[10px] font-mono font-black text-ai-blue uppercase tracking-[0.4em] mb-4 block">Selected_Reward</span>
              <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tighter">{selectedTier.name}</h1>
              <p className="text-medium-gray text-sm opacity-60 mb-8 leading-relaxed italic font-medium">
                You are about to claim this mystery package. This will activate your {selectedTier.discountPercent}% lifetime discount and unlock all associated community perks.
              </p>
              
              <div className="space-y-4">
                {selectedTier.perks.map((perk, i) => (
                  <div key={i} className="flex items-center gap-4 text-[11px] font-mono text-white/80 uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-ai-blue"></div>
                    {perk.replace(/-/g, ' ')}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center gap-8 border-t md:border-t-0 md:border-l border-white/5 pt-8 md:pt-0 md:pl-12">
              <div className="space-y-1">
                <p className="text-[10px] font-mono text-medium-gray uppercase tracking-widest">Subscription Cost</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-white tracking-tighter">${selectedTier.monthlyPrice}</span>
                  <span className="text-xs font-mono text-medium-gray uppercase">/mo</span>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => handleSubscribe(selectedTier.id)}
                  className="w-full py-6 bg-ai-blue text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-white hover:text-ai-blue transition-all shadow-[0_0_30px_rgba(0,102,255,0.2)]"
                >
                  Confirm Subscription
                </button>
                <div className="flex items-center justify-center gap-3 text-medium-gray/40">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-[9px] font-mono font-black uppercase tracking-widest">Secure Checkout via Paystack</span>
                </div>
              </div>

              <div className="p-4 bg-ai-blue/5 border border-ai-blue/10 rounded-2xl">
                <p className="text-[9px] text-ai-blue/80 font-mono leading-relaxed uppercase italic">
                  * Lifetime discount is applied automatically to your account upon successful activation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white selection:bg-ai-blue/30">
      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* ... */}
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-ai-blue/5 border border-ai-blue/20 mb-8">
            <div className="w-2 h-2 rounded-full bg-ai-blue animate-pulse"></div>
            <span className="text-[10px] font-mono font-black text-ai-blue uppercase tracking-[0.4em]">COMMUNITY_SUPPORT: ACTIVE</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-8 text-white tracking-tighter">
            Exclusive <span className="italic text-ai-blue">Airdrops</span>
          </h1>
          <p className="text-xl text-medium-gray max-w-2xl mx-auto font-medium opacity-60 italic mb-12">
            Support the evolution of Sitemendr and unlock mystery reward packages with lifetime benefits.
          </p>
        </div>
      </section>

      <SectionDivider label="Unveil Your Package" id="tiers" align="center" />

      <section className="py-20 px-6">
        <AirdropGifts />
      </section>

      {/* ... (Why Support section) */}
      <section className="py-20 bg-[#050505] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter">Why Support Sitemendr?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            <div>
              <h4 className="font-mono text-ai-blue text-xs font-black mb-4 uppercase tracking-widest">01. Independence</h4>
              <p className="text-xs text-medium-gray leading-relaxed opacity-60">Your support keeps us independent, allowing us to prioritize user needs over investor demands.</p>
            </div>
            <div>
              <h4 className="font-mono text-tech-purple text-xs font-black mb-4 uppercase tracking-widest">02. Innovation</h4>
              <p className="text-xs text-medium-gray leading-relaxed opacity-60">Funding goes directly into R&D for new AI features and better digital infrastructure tools.</p>
            </div>
            <div>
              <h4 className="font-mono text-expert-green text-xs font-black mb-4 uppercase tracking-widest">03. Community</h4>
              <p className="text-xs text-medium-gray leading-relaxed opacity-60">Supporters get a seat at the table, helping shape our product roadmap through the Product Council.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-ai-blue/20 border-t-ai-blue rounded-full animate-spin"></div></div>}>
      <SupportContent />
    </Suspense>
  );
}
