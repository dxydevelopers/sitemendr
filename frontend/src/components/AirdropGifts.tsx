'use client';

import React, { useState, useEffect } from 'react';
import { Gift, Lock, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient, SupporterTier } from '@/lib/api';

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

const AirdropGifts: React.FC = () => {
  const [tiers, setTiers] = useState<SupporterTier[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTiers = async () => {
      console.log('AirdropGifts: Fetching tiers...');
      try {
        const res = await apiClient.fetchAllSupporterTiers();
        console.log('AirdropGifts: API response:', res);
        if (res.success && res.tiers?.length > 0) {
          console.log('AirdropGifts: Setting tiers from API:', res.tiers.length);
          setTiers(res.tiers.sort((a, b) => a.displayOrder - b.displayOrder));
        } else {
          console.warn('AirdropGifts: API returned empty or unsuccessful, using mock tiers');
          setTiers(mockTiers);
        }
      } catch (err) {
        console.error('AirdropGifts: Failed to fetch tiers', err);
        setTiers(mockTiers);
      } finally {
        setLoading(false);
      }
    };
    fetchTiers();
  }, []);

  const handleBoxClick = (tierId: string) => {
    const token = localStorage.getItem('sitemendr_auth_token');
    if (!token) {
      // Not logged in, redirect to login with reveal parameter
      router.push(`/login?redirect=${encodeURIComponent(`/dashboard?reveal=${tierId}`)}`);
    } else {
      // Logged in, go to dashboard to unveil
      router.push(`/dashboard?reveal=${tierId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-ai-blue animate-spin" />
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Gift className="w-8 h-8 text-medium-gray opacity-20" />
        </div>
        <p className="text-[10px] font-mono font-black text-medium-gray uppercase tracking-[0.4em]">No Airdrops Available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 max-w-7xl mx-auto px-6">
      {tiers.map((tier, index) => (
        <div 
          key={tier.id}
          onClick={() => handleBoxClick(tier.id)}
          className="group relative cursor-pointer"
        >
          {/* Box Container */}
          <div className="relative aspect-square bg-[#0a0a0a] border border-white/10 group-hover:border-ai-blue/40 transition-all duration-700 overflow-hidden flex flex-col items-center justify-center gap-6 p-8">
            {/* Animated Background Lines */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,102,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]"></div>
            </div>

            {/* Floating Gift Icon */}
            <div className="relative z-10 transform group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-500">
              <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl group-hover:shadow-ai-blue/20">
                <Gift className="w-10 h-10 text-ai-blue group-hover:animate-bounce" />
              </div>
              
              {/* Lock Indicator */}
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-xl">
                <Lock className="w-3 h-3 text-medium-gray" />
              </div>
            </div>

            {/* Info */}
            <div className="relative z-10 text-center">
              <span className="text-[8px] font-mono font-black text-ai-blue/40 uppercase tracking-[0.4em] mb-2 block">Airdrop_Package_{index + 1}</span>
              <h3 className="text-sm font-black text-white uppercase tracking-widest group-hover:text-ai-blue transition-colors">??? CONTENT ???</h3>
            </div>

            {/* Action Text */}
            <div className="absolute bottom-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                Unveil Now <ChevronRight className="w-3 h-3" />
              </span>
            </div>

            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-white/10 group-hover:border-ai-blue/50 transition-colors"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/10 group-hover:border-ai-blue/50 transition-colors"></div>
          </div>

          {/* Sparkles Effect */}
          <div className="absolute -inset-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <Sparkles className="absolute top-0 right-0 w-4 h-4 text-tech-purple animate-pulse" />
            <Sparkles className="absolute bottom-4 left-0 w-3 h-3 text-ai-blue animate-pulse" />
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default AirdropGifts;
