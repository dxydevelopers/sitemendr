'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type LegalSection = {
  title: string;
  body: string;
  points?: string[];
};

type LegalPolicyPageProps = {
  title: string;
  lead: string;
  effectiveLabel: string;
  contactLabel: string;
  contactHref: string;
  sections: LegalSection[];
  children?: ReactNode;
};

export default function LegalPolicyPage({
  title,
  lead,
  effectiveLabel,
  contactLabel,
  contactHref,
  sections,
  children,
}: LegalPolicyPageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070a] pb-20 pt-24 text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 md:px-10">
        <section className={`min-h-[520px] pb-14 pt-16 transition duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <Link
            href="/legal"
            className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.14em] text-white/46 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Legal
          </Link>

          <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_0.82fr] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-ai-blue">{effectiveLabel}</p>
              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
                {title}
              </h1>
            </div>
            <p className="border-l border-white/10 pl-6 text-base leading-8 text-white/64 md:text-lg">
              {lead}
            </p>
          </div>
        </section>

        <section className="mb-20 divide-y divide-white/10 border-y border-white/10">
          {sections.map((section, index) => (
            <article key={section.title} className="grid gap-8 py-10 lg:grid-cols-[0.34fr_0.66fr]">
              <div className="flex items-start gap-5">
                <span className="text-sm font-black text-ai-blue">{String(index + 1).padStart(2, '0')}</span>
                <h2 className="text-2xl font-black leading-tight tracking-tight md:text-3xl">{section.title}</h2>
              </div>
              <div>
                <p className="text-base leading-8 text-white/64">{section.body}</p>
                {section.points?.length ? (
                  <div className="mt-7 grid gap-3">
                    {section.points.map((point) => (
                      <p key={point} className="border-l border-white/10 pl-5 text-sm leading-7 text-white/56">
                        {point}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        {children}

        <section className="mt-20 border-y border-white/10 py-10">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Questions about this policy</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/56">
                Include the account email, workspace reference, payment reference, or project context when the question relates to active work.
              </p>
            </div>
            <a
              href={contactHref}
              className="inline-flex min-h-[52px] items-center justify-center gap-3 bg-white px-6 py-4 text-center text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-ai-blue hover:text-white"
            >
              {contactLabel}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
