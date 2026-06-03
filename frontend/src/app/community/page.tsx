'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CircleDollarSign,
  Crown,
  Heart,
  LockKeyhole,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { apiClient, SupporterTier } from '@/lib/api';

const fallbackTiers: SupporterTier[] = [
  {
    id: 'starter-id',
    name: 'Community Member',
    slug: 'starter',
    monthlyPrice: 5,
    discountPercent: 5,
    displayOrder: 1,
    isActive: true,
    perks: ['member status', 'member dashboard', 'community updates'],
  },
  {
    id: 'standard-id',
    name: 'Builder Member',
    slug: 'standard',
    monthlyPrice: 15,
    discountPercent: 10,
    displayOrder: 2,
    isActive: true,
    perks: ['learning resources', 'builder updates', 'member perks'],
  },
  {
    id: 'plus-id',
    name: 'Professional Member',
    slug: 'plus',
    monthlyPrice: 30,
    discountPercent: 15,
    displayOrder: 3,
    isActive: true,
    perks: ['opportunity notices', 'product feedback invites', 'builder perks'],
  },
  {
    id: 'premium-id',
    name: 'Partner Circle',
    slug: 'premium',
    monthlyPrice: 60,
    discountPercent: 20,
    displayOrder: 4,
    isActive: true,
    perks: ['private company notes', 'partner access', 'professional perks'],
  },
  {
    id: 'founders-id',
    name: 'Founders Circle',
    slug: 'founders-circle',
    monthlyPrice: 100,
    discountPercent: 25,
    displayOrder: 5,
    isActive: true,
    perks: ['founder-level status', 'deep roadmap access', 'premium perks'],
  },
];

const programPoints = [
  {
    title: 'A learning path for builders.',
    copy: 'Developers and learners can follow Sitemendr thinking, resources, product notes, practical sessions, and future work opportunities.',
    icon: Heart,
    tone: 'text-ai-blue',
  },
  {
    title: 'A closer circle for founders and operators.',
    copy: 'Founders, business owners, and operators get a clearer view of digital systems, delivery decisions, commerce, workspace thinking, and company direction.',
    icon: BadgeCheck,
    tone: 'text-expert-green',
  },
  {
    title: 'A professional layer for partners.',
    copy: 'Investors, partners, and serious members can follow growth signals, opportunities, ecosystem updates, and membership benefits without entering client delivery.',
    icon: LockKeyhole,
    tone: 'text-tech-purple',
  },
];

const rewardFlow = [
  'Choose a community tier',
  'Activate through secure checkout',
  'Return to your Sitemendr account',
  'Track access, resources, perks, and opportunities',
];

function tierIcon(slug: string) {
  switch (slug) {
    case 'starter':
      return <Heart className="h-5 w-5 text-ai-blue" />;
    case 'standard':
      return <Zap className="h-5 w-5 text-expert-green" />;
    case 'plus':
      return <Star className="h-5 w-5 text-tech-purple" />;
    case 'premium':
      return <ShieldCheck className="h-5 w-5 text-amber-300" />;
    case 'founders-circle':
      return <Crown className="h-5 w-5 text-yellow-300" />;
    default:
      return <Sparkles className="h-5 w-5 text-ai-blue" />;
  }
}

function tierDisplayName(tier: SupporterTier) {
  switch (tier.slug) {
    case 'starter':
      return 'Community Member';
    case 'standard':
      return 'Builder Member';
    case 'plus':
      return 'Professional Member';
    case 'premium':
      return 'Partner Circle';
    case 'founders-circle':
      return 'Founders Circle';
    default:
      return tier.name.replace(/supporter/gi, 'member');
  }
}

function perkDisplayName(perk: string) {
  return perk
    .replace(/-/g, ' ')
    .replace(/supporter/gi, 'member')
    .replace(/starter perks/gi, 'member perks')
    .replace(/standard perks/gi, 'builder perks')
    .replace(/plus perks/gi, 'professional perks')
    .replace(/premium perks/gi, 'partner perks');
}

function CommunityContent() {
  const [tiers, setTiers] = useState<SupporterTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const tierIdParam = searchParams.get('tier');

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await apiClient.fetchAllSupporterTiers();
        if (response.success && response.tiers.length > 0) {
          setTiers([...response.tiers].sort((a, b) => a.displayOrder - b.displayOrder));
        } else {
          setTiers(fallbackTiers);
        }
      } catch (error) {
        console.error('Failed to fetch supporter tiers', error);
        setTiers(fallbackTiers);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTiers();
  }, []);

  const selectedTier = useMemo(() => tiers.find((tier) => tier.id === tierIdParam), [tierIdParam, tiers]);

  const handleSubscribe = async (tierId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sitemendr_auth_token') : null;
    if (!token) {
      window.location.href = `/login?redirect=/community?tier=${tierId}`;
      return;
    }

    setIsActivating(tierId);
    try {
      const response = await apiClient.initializeSupporterSubscription(tierId);
      if (response.success && response.data?.paystack?.authorization_url) {
        window.location.href = response.data.paystack.authorization_url;
        return;
      }
      alert(response.message || 'Subscription could not be started. Please try again.');
    } catch (error) {
      const status = typeof error === 'object' && error && 'status' in error ? (error as { status?: number }).status : undefined;
      if (status === 401) {
        window.location.href = `/login?redirect=/community?tier=${tierId}`;
        return;
      }
      const message = error instanceof Error ? error.message : 'Subscription could not be started. Please try again.';
      alert(message);
    } finally {
      setIsActivating(null);
    }
  };

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#05070a] text-white">
        <div className="h-10 w-10 animate-spin border-2 border-white/10 border-t-ai-blue" />
      </main>
    );
  }

  if (selectedTier) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#05070a] px-5 pb-20 pt-28 text-white sm:px-6 md:px-10">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => {
              window.location.href = '/community';
            }}
            className="mb-12 inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.14em] text-white/58 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to community tiers
          </button>

          <section className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="mb-8 flex items-center gap-4">
                {tierIcon(selectedTier.slug)}
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/44">Selected community tier</span>
              </div>
              <h1 className="max-w-4xl text-5xl font-black leading-[0.96] tracking-tight md:text-7xl">
                {tierDisplayName(selectedTier)}
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/62 md:text-lg">
                This activates a community membership record on your Sitemendr account. Your dashboard keeps your tier, access level, learning paths, opportunities, and account benefits in one place.
              </p>
            </div>

            <div className="border-y border-white/10 py-8">
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/38">Monthly membership</p>
                  <p className="mt-3 text-6xl font-black tracking-tight">${selectedTier.monthlyPrice}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/38">Account discount</p>
                  <p className="mt-3 text-6xl font-black tracking-tight">{selectedTier.discountPercent}%</p>
                </div>
              </div>

              <div className="mt-9 grid gap-3">
                {selectedTier.perks.map((perk) => (
                  <div key={perk} className="flex items-start gap-3 border-t border-white/10 pt-4">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-expert-green" />
                    <span className="text-sm leading-7 text-white/68">{perkDisplayName(perk)}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleSubscribe(selectedTier.id)}
                disabled={isActivating === selectedTier.id}
                className="mt-10 inline-flex min-h-[52px] w-full items-center justify-center gap-3 bg-white px-6 py-4 text-center text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isActivating === selectedTier.id ? 'Starting checkout' : 'Activate community tier'}
                <CircleDollarSign className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070a] pb-20 pt-24 text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)',
            backgroundSize: '58px 58px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 md:px-10">
        <section className="grid min-h-[700px] items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
              Join the Sitemendr Community.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-white/62 md:text-xl">
              A paid professional ecosystem for developers, learners, founders, operators, investors, and partners who want structured access to Sitemendr knowledge, opportunities, updates, and growth paths.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CommunityButton href="#tiers" tone="light">
                View tiers
              </CommunityButton>
              <CommunityButton href="/dashboard/supporter">
                Member dashboard
              </CommunityButton>
            </div>
          </div>

          <div className="relative min-h-[560px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1700&h=1300&fit=crop&crop=center"
              alt=""
              fill
              priority
              unoptimized
              sizes="(min-width: 1024px) 620px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.82),rgba(5,7,10,0.1)_48%,rgba(5,7,10,0.42))]" />
            <div className="absolute bottom-8 left-6 max-w-lg pr-6 sm:left-10">
              <Users className="h-8 w-8 text-amber-300" />
              <p className="mt-6 text-2xl font-black leading-tight tracking-tight md:text-4xl">
                Community is where learning, opportunity, company access, and professional growth meet inside the Sitemendr ecosystem.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-24 grid gap-10 border-y border-white/10 py-14 md:py-20 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <h2 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
              What the community is built for.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/58">
              The community is a professional membership structure. It gives different people different forms of access: learning, opportunity, account benefits, product insight, and company proximity.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {programPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.title} className="border-t border-white/10 pt-7">
                  <Icon className={`h-7 w-7 ${point.tone}`} />
                  <h3 className="mt-7 text-2xl font-black tracking-tight">{point.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/58">{point.copy}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="tiers" className="mb-24 grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <h2 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Membership tiers, shown plainly.
            </h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/58">
              Each tier gives a clear membership level, account access, learning value, community benefits, and a path into the wider Sitemendr ecosystem.
            </p>
          </div>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {tiers.map((tier) => (
              <div key={tier.id} className="grid gap-6 py-7 md:grid-cols-[auto_1fr_auto] md:items-center">
                <div className="flex items-center gap-4">
                  {tierIcon(tier.slug)}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/34">
                    {String(tier.displayOrder).padStart(2, '0')}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{tierDisplayName(tier)}</h3>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/56">
                    <span>${tier.monthlyPrice}/month</span>
                    <span>{tier.discountPercent}% account discount</span>
                    <span>{tier.perks.length} visible perks</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `/community?tier=${tier.id}`;
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-3 border border-white/12 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:border-white/30 hover:bg-white hover:text-black"
                >
                  Review tier
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-24 grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="relative min-h-[560px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1700&h=1300&fit=crop&crop=center"
              alt=""
              fill
              unoptimized
              sizes="(min-width: 1024px) 620px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.82),rgba(5,7,10,0.04)_50%,rgba(5,7,10,0.5))]" />
            <div className="absolute bottom-8 left-6 max-w-xl pr-6 sm:left-10">
              <p className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
                The access path stays attached to the account.
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
              How membership becomes useful.
            </h2>
            <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {rewardFlow.map((item, index) => (
                <div key={item} className="grid grid-cols-[auto_1fr] gap-5 py-6">
                  <span className="text-sm font-black text-amber-300">{String(index + 1).padStart(2, '0')}</span>
                  <p className="text-xl font-semibold leading-7 tracking-tight text-white/82">{item}</p>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/supporter"
              className="mt-9 inline-flex min-h-[52px] items-center justify-center gap-3 bg-white px-6 py-4 text-center text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-amber-300"
            >
              Open member dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="border-y border-white/10 py-14 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <MessageSquare className="mx-auto h-9 w-9 text-ai-blue" />
            <h2 className="mt-8 text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Community is for growth. Workspace is for delivery.
            </h2>
            <p className="mt-7 text-base leading-8 text-white/60 md:text-lg">
              Community membership gives people access to learning, opportunities, updates, and circles around Sitemendr. Client work remains private, scoped, approved, and delivered through the workspace.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function CommunityButton({ href, children, tone = 'dark' }: { href: string; children: React.ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[48px] items-center justify-center gap-3 px-5 py-3.5 text-center text-[11px] font-black uppercase tracking-[0.12em] transition sm:px-6 sm:py-4 sm:text-xs ${
        tone === 'light' ? 'bg-white text-black hover:bg-amber-300' : 'bg-white/[0.06] text-white ring-1 ring-white/12 hover:bg-white/[0.1]'
      }`}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export default function CommunityPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#05070a] text-white">
          <div className="h-10 w-10 animate-spin border-2 border-white/10 border-t-ai-blue" />
        </main>
      }
    >
      <CommunityContent />
    </Suspense>
  );
}
