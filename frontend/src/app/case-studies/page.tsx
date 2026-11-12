'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Code2,
  Gauge,
  LayoutDashboard,
  MonitorCheck,
  SearchCheck,
  ShieldCheck,
  ShoppingBag,
  Wrench,
} from 'lucide-react';

const caseStudies = [
  {
    title: 'A service website that stopped explaining the business too late.',
    image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1900&h=1300&fit=crop&crop=center',
    tone: 'text-ai-blue',
    icon: <SearchCheck className="h-6 w-6" />,
    placement: 'items-end justify-start',
    width: 'max-w-xl',
    problem:
      'A business has several services, but visitors struggle to understand the offer and how to make contact.',
    decision:
      'Clarify the service hierarchy, explain the offer in plain language, and make the contact step easy to find.',
    result:
      'Before work begins, Sitemendr and the client would agree on the pages, content, and changes included in the project.',
    details: ['Service hierarchy', 'Trust language', 'Cleaner contact path'],
  },
  {
    title: 'A private workspace for work that could not stay scattered.',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1900&h=1300&fit=crop&crop=center',
    tone: 'text-expert-green',
    icon: <LayoutDashboard className="h-6 w-6" />,
    placement: 'items-start justify-end',
    width: 'max-w-2xl',
    problem:
      'A client and service provider need a reliable way to keep project updates, approvals, and files together.',
    decision:
      'Use the Sitemendr client dashboard to keep the agreed project record and its updates in one place.',
    result:
      'The dashboard features and records available for a project would be confirmed with the client before the work starts.',
    details: ['Project status', 'Approval record', 'Support continuity'],
  },
  {
    title: 'A commerce path that needed buyer confidence before checkout.',
    image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1900&h=1300&fit=crop&crop=center',
    tone: 'text-tech-purple',
    icon: <ShoppingBag className="h-6 w-6" />,
    placement: 'items-center justify-start',
    width: 'max-w-xl',
    problem:
      'A business wants to sell online but has not settled the product pages, delivery terms, checkout, or customer support plan.',
    decision:
      'Define the buyer journey and agree which store features can be delivered for the project.',
    result:
      'Sitemendr commerce and dropshipping services are still being defined. Availability and scope must be confirmed before a project is quoted.',
    details: ['Product flow', 'Checkout clarity', 'Delivery expectations'],
  },
  {
    title: 'A damaged site that needed diagnosis before redesign.',
    image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1900&h=1300&fit=crop&crop=center',
    tone: 'text-amber-300',
    icon: <Wrench className="h-6 w-6" />,
    placement: 'items-end justify-end',
    width: 'max-w-xl',
    problem:
      'A website has errors or slow pages, and the owner is unsure whether to repair it or rebuild it.',
    decision:
      'Inspect the reported issue, explain the findings, and agree on repair scope before making changes.',
    result:
      'The diagnosis, price, repair work, and any follow-up care would be agreed with the client before work begins.',
    details: ['Technical audit', 'Stability repair', 'Maintenance readiness'],
  },
];

const readingModel = [
  {
    title: 'The pressure',
    copy: 'What was making the business slower, less clear, less trusted, or harder to operate.',
    icon: <Gauge className="h-5 w-5" />,
    tone: 'text-ai-blue',
  },
  {
    title: 'The decision',
    copy: 'The point where the work stopped being generic and started following the real business situation.',
    icon: <ShieldCheck className="h-5 w-5" />,
    tone: 'text-expert-green',
  },
  {
    title: 'The delivery',
    copy: 'The website, workspace, store, repair, or support structure that made the decision usable.',
    icon: <Code2 className="h-5 w-5" />,
    tone: 'text-tech-purple',
  },
  {
    title: 'The continuity',
    copy: 'What remains visible after launch: ownership, support, maintenance, files, and next decisions.',
    icon: <MonitorCheck className="h-5 w-5" />,
    tone: 'text-amber-300',
  },
];

export default function CaseStudiesPage() {
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
    <main className="relative min-h-screen overflow-hidden bg-[#05070a] pb-14 pt-24 text-white">
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-white/8">
        <div className="h-full bg-expert-green transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
      </div>

      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)',
            backgroundSize: '54px 54px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 md:px-10">
        <section className={`grid min-h-[620px] items-end gap-12 pb-16 transition duration-700 lg:grid-cols-[1.02fr_0.98fr] ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div>
            <h1 className="max-w-5xl text-2xl font-bold leading-[0.95] tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
              Examples of the work Sitemendr can take on.
            </h1>
          </div>
          <div className="border-l border-white/10 pl-6 md:pl-9">
            <p className="max-w-xl text-base leading-8 text-white/64 md:text-xl">
              These are illustrative project scenarios, not completed client case studies. They show the kinds of problems Sitemendr can discuss and how we would agree on an approach before work begins.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CaseButton href="/contact?intent=sales" tone="light">
                Discuss a project
              </CaseButton>
              <CaseButton href="/portfolio">
                Back to portfolio
              </CaseButton>
            </div>
          </div>
        </section>

        <section className="mb-14 space-y-8 md:mb-20 md:space-y-10" aria-label="Illustrative project scenarios">
          {caseStudies.map((study, index) => (
            <article key={study.title} className="group relative min-h-[600px] overflow-hidden border border-white/10 md:min-h-[680px]">
              <Image
                src={study.image}
                alt=""
                fill
                priority={index === 0}
                unoptimized
                sizes="(min-width: 1024px) 1180px, 100vw"
                className="object-cover transition duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,10,0.84),rgba(5,7,10,0.36)_46%,rgba(5,7,10,0.78))]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.82),rgba(5,7,10,0.04)_48%,rgba(5,7,10,0.62))]" />

              <div className={`absolute inset-0 flex p-5 sm:p-8 lg:p-12 ${study.placement}`}>
                <div className={`${study.width} p-1 sm:p-2`}>
                  <div className={`flex items-center gap-3 ${study.tone}`}>
                    {study.icon}
                  </div>
                  <h2 className="mt-7 text-xl font-bold leading-tight tracking-tight md:text-2xl">{study.title}</h2>

                  <div className="mt-8 grid gap-6">
                    <CaseText label="Example situation" text={study.problem} />
                    <CaseText label="Possible approach" text={study.decision} />
                    <CaseText label="What we would agree" text={study.result} />
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {study.details.map((detail) => (
                      <div key={detail} className="flex items-start gap-2 border-t border-white/10 pt-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-expert-green" />
                        <span className="text-xs font-semibold leading-5 text-white/64">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mb-14 grid gap-10 border-y border-white/10 py-10 md:mb-20 md:py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-xl font-bold leading-tight tracking-tight md:text-3xl">
              The story is judged by what changed.
            </h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/64">
              When approved client work is available to publish, each case study will explain the original need, the agreed approach, and the delivered result. The examples above are hypothetical and make no claims about completed projects.
            </p>
          </div>
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {readingModel.map((item) => (
              <div key={item.title} className="border-l border-white/10 pl-6">
                <div className={item.tone}>{item.icon}</div>
                <h3 className="mt-7 text-2xl font-bold tracking-tight">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/48">{item.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative min-h-[560px] overflow-hidden border border-white/10">
          <Image
            src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1800&h=1200&fit=crop&crop=center"
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 1180px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,10,0.9),rgba(5,7,10,0.48),rgba(5,7,10,0.78))]" />
          <div className="absolute inset-0 flex items-end p-6 sm:p-10 md:p-14">
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold leading-tight tracking-tight md:text-3xl">
              Have a project to discuss?
              </h2>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/64 md:text-lg">
                Tell us what you need. We will discuss the scope and confirm what we can deliver before any work is approved.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CaseButton href="/contact?intent=sales" tone="light">
                  Contact Sitemendr
                </CaseButton>
                <CaseButton href="/contact?intent=sales">
                  Speak with the team
                </CaseButton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function CaseText({ label, text }: { label: string; text: string }) {
  return (
    <div className="border-t border-white/10 pt-4">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-white/36">{label}</p>
      <p className="mt-2 text-sm leading-7 text-white/64 md:text-base md:leading-8">{text}</p>
    </div>
  );
}

function CaseButton({ href, children, tone = 'dark' }: { href: string; children: React.ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[48px] items-center justify-center gap-3 px-5 py-3.5 text-center text-xs font-bold uppercase tracking-[0.1em] transition sm:px-6 sm:py-4 sm:text-xs ${
        tone === 'light' ? 'bg-white text-black hover:bg-expert-green hover:text-white' : 'bg-white/[0.06] text-white ring-1 ring-white/12 hover:bg-white/[0.1]'
      }`}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
