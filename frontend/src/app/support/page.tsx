'use client';

import React, { useState, useEffect } from 'react';
import { apiClient, SupporterTier } from '@/lib/api';
import SectionDivider from '@/components/SectionDivider';
import { Check, Star, Zap, Shield, Crown, Heart } from 'lucide-react';

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

const SupportPage = () => {
  const [tiers, setTiers] = useState<SupporterTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await apiClient.getSupporterTiers();
        if (res.success && res.tiers.length > 0) {
          setTiers(res.tiers);
        } else {
          // Fallback mock tiers if none in DB yet
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
        window.location.href = `/login?redirect=/support`;
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

  return (
    <main className="min-h-screen bg-black text-white selection:bg-ai-blue/30">
      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* Background Technical Decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,102,255,0.05)_0%,transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-ai-blue/5 border border-ai-blue/20 mb-8">
            <div className="w-2 h-2 rounded-full bg-ai-blue animate-pulse"></div>
            <span className="text-[10px] font-mono font-black text-ai-blue uppercase tracking-[0.4em]">COMMUNITY_SUPPORT: ACTIVE</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-8 text-white tracking-tighter">
            Become a <span className="italic text-ai-blue">Supporter</span>
          </h1>
          <p className="text-xl text-medium-gray max-w-2xl mx-auto font-medium opacity-60 italic mb-12">
            Support the evolution of Sitemendr and unlock exclusive rewards, discounts, and community perks.
          </p>
        </div>
      </section>

      <SectionDivider label="Select Your Tier" id="tiers" align="center" />

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="group relative bg-[#0a0a0a] border border-white/5 hover:border-ai-blue/40 transition-all duration-500 p-6 flex flex-col h-full hover:-translate-y-2"
              >
                {/* HUD elements */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/10 group-hover:border-ai-blue/50 transition-colors"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/10 group-hover:border-ai-blue/50 transition-colors"></div>

                <div className="mb-6">
                  <div className="mb-4">{getTierIcon(tier.slug)}</div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 font-mono group-hover:text-ai-blue transition-colors">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">${tier.monthlyPrice}</span>
                    <span className="text-[8px] font-mono text-medium-gray uppercase tracking-widest opacity-40">/month</span>
                  </div>
                </div>

                <div className="h-px w-full bg-white/5 mb-6"></div>

                <div className="mb-6 space-y-4 flex-grow">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-expert-green uppercase font-black">
                    <Zap className="w-3 h-3" />
                    <span>{tier.discountPercent}% OFF EVERYTHING</span>
                  </div>
                  <ul className="space-y-3">
                    {tier.perks.map((perk, i) => (
                      <li key={i} className="flex items-start gap-3 text-[10px] font-mono text-medium-gray">
                        <Check className="w-3 h-3 text-ai-blue mt-0.5 flex-shrink-0" />
                        <span className="opacity-70 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">{perk.replace(/-/g, ' ')}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribe(tier.id)}
                  className="w-full py-4 bg-transparent border border-white/10 text-white font-mono font-black text-[10px] uppercase tracking-[0.2em] hover:bg-ai-blue hover:border-ai-blue transition-all duration-300"
                >
                  Support Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

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

export default SupportPage;
