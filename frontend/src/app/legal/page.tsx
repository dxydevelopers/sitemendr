'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Cookie,
  FileText,
  RefreshCw,
  Scale,
  ShieldCheck,
} from 'lucide-react';

const policyPages = [
  {
    title: 'Privacy Policy',
    href: '/privacy',
    summary: 'How personal data, account details, project information, analytics, and communication records are handled.',
    icon: ShieldCheck,
    tone: 'text-ai-blue',
  },
  {
    title: 'Terms Of Service',
    href: '/terms',
    summary: 'The rules for using Sitemendr, opening an account, ordering services, making payments, and working through the platform.',
    icon: Scale,
    tone: 'text-white/78',
  },
  {
    title: 'Refund Policy',
    href: '/refund',
    summary: 'How refunds, cancellations, subscriptions, project payments, and work already started are reviewed.',
    icon: RefreshCw,
    tone: 'text-amber-300',
  },
  {
    title: 'Cookie Policy',
    href: '/cookie-policy',
    summary: 'How cookies, browser storage, tracking tools, preferences, and basic analytics may be used.',
    icon: Cookie,
    tone: 'text-tech-purple',
  },
];

const legalNotes = [
  'The Legal page is an index. Each policy page contains the specific terms that apply to that subject.',
  'Project work, payments, subscriptions, workspace use, and community membership may each carry their own operational conditions.',
  'If a policy question affects an active account or project, the safest place to continue the conversation is inside the workspace.',
];

export default function LegalPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070a] pb-20 pt-24 text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 md:px-10">
        <section className={`grid min-h-[620px] items-end gap-12 pb-16 transition duration-700 lg:grid-cols-[1fr_0.9fr] ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div>
            <Scale className="h-10 w-10 text-ai-blue" />
            <h1 className="mt-8 max-w-5xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
              Sitemendr legal register.
            </h1>
          </div>
          <div className="border-l border-white/10 pl-6 md:pl-9">
            <p className="max-w-xl text-base leading-8 text-white/64 md:text-xl">
              Data handling, service use, payments, cancellations, and browser tracking are governed through the policy documents below.
            </p>
          </div>
        </section>

        <section className="mb-24 grid gap-10 lg:grid-cols-[0.74fr_1.26fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <h2 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
              Policy documents.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/58">
              These documents apply across public pages, workspaces, services, payments, accounts, and community membership.
            </p>
          </div>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {policyPages.map((policy) => {
              const Icon = policy.icon;
              return (
                <Link
                  key={policy.title}
                  href={policy.href}
                  className="group grid gap-5 py-8 transition md:grid-cols-[auto_1fr_auto] md:items-center"
                >
                  <Icon className={`h-7 w-7 ${policy.tone}`} />
                  <span>
                    <span className="block text-2xl font-black tracking-tight text-white">{policy.title}</span>
                    <span className="mt-3 block max-w-2xl text-sm leading-7 text-white/56">{policy.summary}</span>
                  </span>
                  <ArrowRight className="h-5 w-5 text-white/34 transition group-hover:translate-x-1 group-hover:text-white" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mb-24 border-y border-white/10 py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <FileText className="h-9 w-9 text-expert-green" />
              <h2 className="mt-8 text-4xl font-black leading-tight tracking-tight md:text-5xl">
                Operating notes.
              </h2>
            </div>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {legalNotes.map((note, index) => (
                <div key={note} className="grid grid-cols-[auto_1fr] gap-5 py-6">
                  <span className="text-sm font-black text-ai-blue">{String(index + 1).padStart(2, '0')}</span>
                  <p className="text-base leading-8 text-white/64">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Policy questions need context.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/58">
            For account or project-specific questions, contact the team with the relevant workspace, payment, or service context.
          </p>
          <Link
            href="/contact"
            className="mt-9 inline-flex min-h-[52px] items-center justify-center gap-3 bg-white px-6 py-4 text-center text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-ai-blue hover:text-white"
          >
            Contact Sitemendr
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
