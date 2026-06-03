'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Code2,
  Gauge,
  LayoutDashboard,
  MonitorCheck,
  PanelsTopLeft,
  RefreshCw,
  SearchCheck,
  ShoppingBag,
  Sparkles,
  Target,
  Wrench,
} from 'lucide-react';

const workTypes = [
  {
    title: 'Business Website',
    category: 'Public presence',
    copy: 'A professional public website that explains services, builds trust, and gives visitors a clear next step.',
    icon: <PanelsTopLeft className="h-7 w-7" />,
    tone: 'text-ai-blue',
    image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1500&h=1200&fit=crop&crop=center',
  },
  {
    title: 'Custom Workspace',
    category: 'Portal and dashboard',
    copy: 'A private system where records, messages, files, approvals, and status can be followed without scattered communication.',
    icon: <LayoutDashboard className="h-7 w-7" />,
    tone: 'text-expert-green',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1500&h=1200&fit=crop&crop=center',
  },
  {
    title: 'Commerce Setup',
    category: 'Storefront and checkout',
    copy: 'Product presentation, checkout structure, delivery notes, and confidence signals arranged around the buyer journey.',
    icon: <ShoppingBag className="h-7 w-7" />,
    tone: 'text-tech-purple',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1500&h=1200&fit=crop&crop=center',
  },
  {
    title: 'Repair Recovery',
    category: 'Technical correction',
    copy: 'Diagnosis-led recovery for broken layouts, slow pages, damaged setups, unfinished work, and unstable systems.',
    icon: <Wrench className="h-7 w-7" />,
    tone: 'text-amber-300',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1500&h=1200&fit=crop&crop=center',
  },
];

const selectedWork = [
  {
    title: 'Service Company Website',
    type: 'Business website',
    brief: 'A service business needed a cleaner explanation of what it does, who it serves, and how clients should start.',
    outcome: 'The structure was redesigned around service clarity, stronger visual proof, and a more direct contact path.',
    image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1800&h=1300&fit=crop&crop=center',
    icon: <PanelsTopLeft className="h-6 w-6" />,
    tone: 'text-ai-blue',
    points: ['Service hierarchy', 'Trust sections', 'Contact route', 'Mobile-first layout'],
  },
  {
    title: 'Client Delivery Dashboard',
    type: 'Private workspace',
    brief: 'A client workflow needed one place for project records, support, billing, messages, and delivery status.',
    outcome: 'The dashboard model connected the work record with the private account experience so delivery could be followed.',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1800&h=1300&fit=crop&crop=center',
    icon: <LayoutDashboard className="h-6 w-6" />,
    tone: 'text-expert-green',
    points: ['Project status', 'Support tickets', 'Billing context', 'Private files'],
  },
  {
    title: 'Commerce Launch Structure',
    type: 'eCommerce and dropshipping',
    brief: 'A store concept needed product flow, checkout confidence, delivery expectations, and post-purchase support.',
    outcome: 'The work was shaped around buyer trust: products, payment, fulfillment, and support were made visible before launch.',
    image: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=1800&h=1300&fit=crop&crop=center',
    icon: <ShoppingBag className="h-6 w-6" />,
    tone: 'text-tech-purple',
    points: ['Product layout', 'Checkout path', 'Delivery notes', 'Support flow'],
  },
];

const proofFlow = [
  {
    title: 'Problem',
    copy: 'What was unclear, broken, missing, slow, or difficult for the business to operate.',
    icon: <SearchCheck className="h-5 w-5" />,
    tone: 'text-ai-blue',
  },
  {
    title: 'Structure',
    copy: 'How the work was organized before the build or repair moved forward.',
    icon: <Target className="h-5 w-5" />,
    tone: 'text-expert-green',
  },
  {
    title: 'Delivery',
    copy: 'What was created, corrected, connected, or prepared for launch.',
    icon: <Code2 className="h-5 w-5" />,
    tone: 'text-tech-purple',
  },
  {
    title: 'Aftercare',
    copy: 'How ownership, maintenance, support, and future improvement were kept visible.',
    icon: <RefreshCw className="h-5 w-5" />,
    tone: 'text-amber-300',
  },
];

const capabilities = [
  { label: 'Public websites', detail: 'Brand explanation, service pages, conversion paths, and trust structure.', icon: <PanelsTopLeft className="h-5 w-5" />, tone: 'text-ai-blue' },
  { label: 'Custom apps', detail: 'Dashboards, portals, records, workflows, and integrations.', icon: <Code2 className="h-5 w-5" />, tone: 'text-expert-green' },
  { label: 'Repair work', detail: 'Diagnosis, cleanup, performance fixes, recovery, and stabilization.', icon: <Wrench className="h-5 w-5" />, tone: 'text-tech-purple' },
  { label: 'Maintenance', detail: 'Updates, backups, monitoring, content support, and ongoing care.', icon: <MonitorCheck className="h-5 w-5" />, tone: 'text-amber-300' },
  { label: 'Commerce', detail: 'Storefronts, product flow, checkout confidence, dropshipping preparation.', icon: <ShoppingBag className="h-5 w-5" />, tone: 'text-ai-blue' },
  { label: 'Handoff', detail: 'Ownership, access, notes, workspace records, and support readiness.', icon: <BadgeCheck className="h-5 w-5" />, tone: 'text-expert-green' },
];

export default function PortfolioPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070a] pb-20 pt-24 text-white">
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-white/8">
        <div className="h-full bg-ai-blue transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
      </div>

      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.35) 1px, transparent 0)',
            backgroundSize: '34px 34px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 md:px-10">
        <section className={`mb-24 grid min-h-[720px] items-center gap-12 transition duration-700 lg:grid-cols-[0.96fr_1.04fr] ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div>
            <h1 className="max-w-5xl text-5xl font-black leading-[0.96] tracking-tight md:text-7xl lg:text-8xl">
              Work that shows how Sitemendr thinks.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-white/62 md:text-xl">
              This portfolio is arranged by the kinds of work Sitemendr is built to handle: public websites, custom workspaces, commerce systems, repair, maintenance, and handoff. The proof is not only the screen. It is the structure around the screen.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <PortfolioButton href="/contact?intent=sales" tone="light">
                Discuss a Project
              </PortfolioButton>
              <PortfolioButton href="/case-studies">
                View Case Studies
              </PortfolioButton>
            </div>
          </div>

          <div className="relative min-h-[560px]">
            <div className="absolute left-0 top-0 h-[58%] w-[68%] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1500&h=1200&fit=crop&crop=center"
                alt=""
                fill
                priority
                unoptimized
                sizes="(min-width: 1024px) 560px, 82vw"
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 h-[62%] w-[72%] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1500&h=1200&fit=crop&crop=center"
                alt=""
                fill
                priority
                unoptimized
                sizes="(min-width: 1024px) 620px, 86vw"
                className="object-cover object-[50%_48%]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.76),rgba(5,7,10,0.05))]" />
            </div>
            <div className="absolute bottom-14 left-4 max-w-[340px] bg-[#05070a]/92 p-6 ring-1 ring-white/12 backdrop-blur-xl sm:left-8">
              <Gauge className="h-7 w-7 text-expert-green" />
              <p className="mt-5 text-xl font-semibold leading-tight tracking-[-0.02em] sm:text-2xl">
                Screens matter. The work behind them matters more.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-24 border-y border-white/10 py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <h2 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
                The work is shown through the situation it solves.
              </h2>
              <p className="mt-6 text-base leading-8 text-white/58">
                A portfolio should not feel like a shelf of screenshots. It should show why the work existed, what had to become clearer, and how the final system helped the business move with more confidence.
              </p>
            </div>
            <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
            {workTypes.map((item) => (
              <div key={item.title} className="group">
                <div className="relative min-h-[360px] overflow-hidden md:min-h-[420px]">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    unoptimized
                    sizes="(min-width: 768px) 34vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(5,7,10,0.8),transparent)]" />
                  <div className={`absolute bottom-5 left-5 ${item.tone}`}>{item.icon}</div>
                </div>
                <div className="border-b border-white/10 pb-8 pt-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/38">{item.category}</p>
                  <h3 className="mt-3 text-2xl font-black tracking-tight">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/58">{item.copy}</p>
                </div>
              </div>
            ))}
            </div>
          </div>
        </section>

        <section className="mb-24">
          <SectionIntro
            title="Proof examples with the project thinking visible."
            copy="Each example is shown through the situation, the work structure, and the outcome it should create."
          />
          <div className="mt-14 space-y-20">
            {selectedWork.map((work, index) => (
              <div key={work.title} className={`grid gap-10 lg:grid-cols-2 lg:items-center ${index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
                <div className="relative min-h-[460px] overflow-hidden">
                  <Image
                    src={work.image}
                    alt=""
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover object-[50%_45%]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.7),rgba(5,7,10,0.08))]" />
                </div>
                <div className="border-t border-white/10 pt-8">
                  <div className={work.tone}>{work.icon}</div>
                  <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/38">{work.type}</p>
                  <h3 className="mt-3 text-4xl font-black leading-tight tracking-tight md:text-5xl">{work.title}</h3>
                  <p className="mt-7 text-base leading-8 text-white/64">{work.brief}</p>
                  <p className="mt-5 text-base leading-8 text-white/64">{work.outcome}</p>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {work.points.map((point) => (
                      <div key={point} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-expert-green" />
                        <span className="text-sm leading-7 text-white/72">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-24">
          <SectionIntro
            title="The result is judged through the full delivery record."
            copy="A project is not considered strong because it looks good in isolation. It has to explain the business, hold together technically, and remain supportable."
          />
          <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-4">
            {proofFlow.map((item, index) => (
              <div key={item.title} className="border-t border-white/10 pt-7">
                <div className={`flex items-center gap-3 ${item.tone}`}>
                  {item.icon}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/42">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="mt-8 text-2xl font-black tracking-tight">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/58">{item.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-24 grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div className="relative min-h-[560px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=1700&h=1600&fit=crop&crop=center"
              alt=""
              fill
              unoptimized
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.72),rgba(5,7,10,0.08))]" />
          </div>
          <div>
            <SectionIntro
              title="What this portfolio should prove."
              copy="The goal is not to show many disconnected screenshots. The goal is to show that Sitemendr can carry different types of work through a professional process."
              align="left"
            />
            <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {capabilities.map((item) => (
                <div key={item.label} className="border-l border-white/10 pl-6">
                  <div className={item.tone}>{item.icon}</div>
                  <h3 className="mt-7 text-xl font-black tracking-tight">{item.label}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/56">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-16 overflow-hidden border-y border-white/10">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.82fr]">
            <div className="p-8 md:p-12 lg:p-16">
              <Sparkles className="h-10 w-10 text-ai-blue" />
              <h2 className="mt-8 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                A good portfolio should make the next conversation easier.
              </h2>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/62">
                If your project looks like one of these paths, the next step is to choose the route and open the work inside a private Sitemendr workspace.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <PortfolioButton href="/contact?intent=sales" tone="light">
                  Speak with the team
                </PortfolioButton>
                <PortfolioButton href="/workspace">
                  View workspace
                </PortfolioButton>
              </div>
            </div>
            <div className="relative min-h-[420px]">
              <Image
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1500&h=1400&fit=crop&crop=center"
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionIntro({
  eyebrow,
  title,
  copy,
  align = 'center',
}: {
  eyebrow?: string;
  title: string;
  copy: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow ? <p className="text-[10px] font-black uppercase tracking-[0.24em] text-ai-blue">{eyebrow}</p> : null}
      <h2 className={eyebrow ? 'mt-5 text-4xl font-black leading-tight tracking-tight md:text-5xl' : 'text-4xl font-black leading-tight tracking-tight md:text-5xl'}>{title}</h2>
      <p className="mt-5 text-base leading-8 text-white/58">{copy}</p>
    </div>
  );
}

function PortfolioButton({ href, children, tone = 'dark' }: { href: string; children: React.ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[48px] items-center justify-center gap-3 px-5 py-3.5 text-center text-[11px] font-black uppercase tracking-[0.12em] transition sm:px-6 sm:py-4 sm:text-xs ${
        tone === 'light' ? 'bg-white text-black hover:bg-ai-blue hover:text-white' : 'bg-white/[0.06] text-white ring-1 ring-white/12 hover:bg-white/[0.1]'
      }`}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
