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
      'The business had services, credibility, and active conversations, but the website made visitors work too hard before they understood the offer.',
    decision:
      'The structure was rebuilt around the first question a serious visitor asks: what do you do, why should I trust you, and how do I begin?',
    result:
      'The page became clearer, faster to scan, and easier to act on. Service explanation, proof, and contact flow stopped competing with each other.',
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
      'Project notes, approvals, billing context, support requests, and delivery expectations were living in too many places.',
    decision:
      'The work needed a private operating space where the client could return, see progress, understand decisions, and keep the record intact.',
    result:
      'The workspace model turned delivery into something visible. Projects, messages, files, support, and payment context could be understood together.',
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
      'The store idea had products, but the buyer journey was thin: product meaning, delivery expectations, support, and checkout confidence were not connected.',
    decision:
      'The store had to be shaped around trust before transaction. Product pages, policies, checkout, and support needed to read as one path.',
    result:
      'The commerce structure became easier to understand and easier to launch. Customers could move from interest to purchase with fewer unanswered questions.',
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
      'The site looked like a design issue at first, but the real risk was deeper: broken structure, slow behavior, unfinished sections, and weak maintenance habits.',
    decision:
      'Repair came before decoration. The work was treated as a recovery job: inspect the foundation, remove what was failing, and stabilize what had to remain.',
    result:
      'The business received a more dependable technical base, clearer pages, and a better path for future maintenance instead of another fragile redesign.',
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
    <main className="relative min-h-screen overflow-hidden bg-[#05070a] pb-20 pt-24 text-white">
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
            <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
              Outcome stories, told inside the work.
            </h1>
          </div>
          <div className="border-l border-white/10 pl-6 md:pl-9">
            <p className="max-w-xl text-base leading-8 text-white/64 md:text-xl">
              Case studies are not here to decorate the page. Each story shows the business pressure, the decision that shaped the work, the delivery path, and what became easier for the client after the work was handled.
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

        <section className="mb-24 space-y-8 md:space-y-12">
          {caseStudies.map((study, index) => (
            <article key={study.title} className="group relative min-h-[780px] overflow-hidden border border-white/10 md:min-h-[860px]">
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
                  <h2 className="mt-7 text-3xl font-black leading-tight tracking-tight md:text-5xl">{study.title}</h2>

                  <div className="mt-8 grid gap-6">
                    <CaseText label="Problem" text={study.problem} />
                    <CaseText label="Decision" text={study.decision} />
                    <CaseText label="Result" text={study.result} />
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {study.details.map((detail) => (
                      <div key={detail} className="flex items-start gap-2 border-t border-white/10 pt-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-expert-green" />
                        <span className="text-xs font-semibold leading-5 text-white/72">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mb-24 grid gap-10 border-y border-white/10 py-14 md:py-20 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
              The story is judged by what changed.
            </h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/58">
              A strong case study does not stop at the image. It explains why the work mattered, how the decision was made, and what the business can now do with less confusion.
            </p>
          </div>
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {readingModel.map((item) => (
              <div key={item.title} className="border-l border-white/10 pl-6">
                <div className={item.tone}>{item.icon}</div>
                <h3 className="mt-7 text-2xl font-black tracking-tight">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/56">{item.copy}</p>
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
              <h2 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Bring the next story into a private workspace.
              </h2>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/64 md:text-lg">
                If the problem is unclear, damaged, unfinished, or ready to grow, Sitemendr can shape it into a practical path before the work begins.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CaseButton href="/register" tone="light">
                  Create workspace
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
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/38">{label}</p>
      <p className="mt-2 text-sm leading-7 text-white/68 md:text-base md:leading-8">{text}</p>
    </div>
  );
}

function CaseButton({ href, children, tone = 'dark' }: { href: string; children: React.ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[48px] items-center justify-center gap-3 px-5 py-3.5 text-center text-[11px] font-black uppercase tracking-[0.12em] transition sm:px-6 sm:py-4 sm:text-xs ${
        tone === 'light' ? 'bg-white text-black hover:bg-expert-green hover:text-white' : 'bg-white/[0.06] text-white ring-1 ring-white/12 hover:bg-white/[0.1]'
      }`}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
