import Image from 'next/image';
import Link from 'next/link';
import { Space_Grotesk } from 'next/font/google';
import {
  ArrowUpRight,
  BadgeCheck,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  FolderKanban,
  LifeBuoy,
  MessageSquare,
  MonitorCheck,
  PackageCheck,
  Rocket,
  SearchCheck,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const processSteps = [
  {
    title: 'Create the private workspace',
    copy: 'The client opens an account so the request has a secure place to begin. This creates the room where files, messages, billing, approvals, and delivery notes can stay connected.',
    icon: UserPlus,
  },
  {
    title: 'Describe the request in context',
    copy: 'Sitemendr needs the business situation, not only the task name. The client can explain the goal, upload references, add files, and share the details that make the work understandable.',
    icon: ClipboardCheck,
  },
  {
    title: 'Review the correct service path',
    copy: 'The request is studied and connected to the right route: development, repair, maintenance, commerce, delivery ownership, or support. The point is to protect the work from being shaped too quickly.',
    icon: SearchCheck,
  },
  {
    title: 'Approve scope and payment',
    copy: 'Before serious work begins, the client should understand what will be done, how responsibility is measured, what the cost means, and what is expected from both sides.',
    icon: CreditCard,
  },
  {
    title: 'Track progress in one place',
    copy: 'Messages, status, questions, documents, blockers, and approvals remain visible. The project should not depend on memory or scattered conversations to move forward.',
    icon: MonitorCheck,
  },
  {
    title: 'Receive delivery and support',
    copy: 'The final handoff includes the finished work, ownership context, notes, files, next steps, and a support route if the business needs care after launch.',
    icon: PackageCheck,
  },
];

const serviceRoutes = [
  'New website, platform, portal, or dashboard',
  'Repair, recovery, audit, or technical cleanup',
  'Maintenance, monitoring, updates, and ongoing care',
  'Commerce, dropshipping, checkout, and launch readiness',
];

const insideWorkspace = [
  {
    title: 'Projects',
    copy: 'Each request has a visible place with progress, scope, notes, and delivery state.',
    icon: FolderKanban,
  },
  {
    title: 'Messages',
    copy: 'Questions and approvals stay near the work instead of disappearing into old threads.',
    icon: MessageSquare,
  },
  {
    title: 'Files',
    copy: 'Assets, screenshots, access notes, references, and handoff material remain organized.',
    icon: FileCheck2,
  },
  {
    title: 'Support',
    copy: 'After delivery, the client still has a structured way to ask for help or future care.',
    icon: LifeBuoy,
  },
];

const principles = [
  'The client should always know where the work lives',
  'The request should be understood before it is priced',
  'Payments and approvals should be attached to context',
  'Delivery should leave behind records, not confusion',
];

export default function ProcessPage() {
  return (
    <main className={`${spaceGrotesk.variable} min-h-screen overflow-hidden bg-[#05070a] text-white`}>
      <section className="relative min-h-[720px] overflow-hidden border-b border-white/10 pt-20 md:min-h-[820px]">
        <Image
          src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=2200&h=1400&fit=crop&crop=center"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover opacity-36 saturate-125"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#05070a_0%,rgba(5,7,10,0.9)_44%,rgba(5,7,10,0.24)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(245,158,11,0.18),transparent_32%),radial-gradient(circle_at_18%_84%,rgba(0,102,255,0.14),transparent_30%)]" />

        <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center gap-12 px-5 py-12 sm:px-6 md:min-h-[720px] md:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:py-16">
          <div>
            <div className="mb-7 flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.14em] text-white/52">
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Account</span>
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Review</span>
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Approval</span>
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Delivery</span>
            </div>
            <h1 className="max-w-5xl break-words font-[var(--font-space-grotesk)] text-[2.45rem] font-semibold leading-[1.02] tracking-[-0.025em] sm:text-[3rem] md:text-6xl lg:text-7xl lg:tracking-[-0.035em]">
              How Sitemendr turns a request into organized delivery.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-white/68 md:text-lg">
              The process is built to keep work private, readable, and accountable. A client creates a workspace, explains the request, receives review, approves the path, tracks the work, and leaves with delivery records that still make sense later.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ProcessAction href="/register" tone="light">
                Create Workspace
              </ProcessAction>
              <ProcessAction href="/workspace">
                View Workspace
              </ProcessAction>
            </div>
          </div>

          <div className="relative min-h-[440px] overflow-hidden rounded-tl-[2.75rem] bg-white/10 ring-1 ring-white/12 sm:min-h-[540px] md:rounded-tl-[5rem] lg:min-h-[650px]">
            <ImageFrame
              src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1600&h=1200&fit=crop&crop=center"
              sizes="(min-width: 1024px) 50vw, 100vw"
              objectPosition="50% 43%"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.58),rgba(5,7,10,0.04))]" />
            <div className="absolute bottom-0 left-0 right-0 grid grid-cols-3 gap-px bg-white/10">
              {['Private', 'Reviewed', 'Delivered'].map((item) => (
                <div key={item} className="bg-[#05070a]/78 p-5 backdrop-blur-md">
                  <BadgeCheck className="h-4 w-4 text-amber-300" />
                  <p className="mt-5 text-sm font-semibold text-white/82">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <h2 className="max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
            The point is not to make the project feel complicated. It is to make it trustworthy.
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <p className="text-base leading-8 text-white/66">
              Many digital projects become difficult because the beginning is too informal. The request is unclear, the files are scattered, the price is separated from the scope, and the final handoff has no record.
            </p>
            <p className="text-base leading-8 text-white/66">
              Sitemendr uses the workspace and process together so the client relationship has a shape. The request is reviewed, the route is explained, the work is tracked, and delivery is handed over with context.
            </p>
          </div>
        </div>
      </section>

      <section id="full-process" className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:px-10 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
            <h2 className="max-w-4xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              From first account to final support route.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-white/64 lg:ml-auto">
              Every stage has a reason. The process protects privacy, gives the request enough context, keeps payment attached to scope, and makes delivery easier to understand after launch.
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden bg-white/10 lg:grid-cols-3">
            {processSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className="min-h-[320px] bg-[#05070a] p-6 ring-1 ring-white/10 md:p-8">
                  <div className="flex items-center justify-between gap-5">
                    <Icon className="h-6 w-6 text-amber-300" />
                    <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/30">0{index + 1}</span>
                  </div>
                  <h3 className="mt-10 text-2xl font-semibold tracking-[-0.02em] text-white">{step.title}</h3>
                  <p className="mt-5 text-sm leading-7 text-white/58">{step.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative min-h-[420px] overflow-hidden sm:min-h-[560px] lg:min-h-[760px]">
            <ImageFrame
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1800&h=1300&fit=crop&crop=center"
              sizes="(min-width: 1024px) 56vw, 100vw"
              objectPosition="50% 45%"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.72),rgba(5,7,10,0.06))]" />
          </div>
          <div className="flex items-center px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:px-16">
            <div className="max-w-2xl">
              <Rocket className="h-6 w-6 text-amber-300" />
              <h2 className="mt-7 break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                The process adapts to the service path without losing order.
              </h2>
              <p className="mt-7 text-base leading-8 text-white/64 md:text-lg">
                A new build, an urgent repair, a maintenance request, and a commerce launch do not need the same technical work. They do need the same professional structure: context, review, approval, progress, delivery, and support.
              </p>
              <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
                {serviceRoutes.map((route) => (
                  <div key={route} className="flex items-start gap-4 py-5">
                    <SearchCheck className="mt-1 h-5 w-5 shrink-0 text-amber-300" />
                    <p className="text-sm font-semibold leading-7 text-white/72">{route}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:px-10 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
            <div>
              <ShieldCheck className="h-6 w-6 text-ai-blue" />
              <h2 className="mt-7 max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                What stays inside the workspace while the process moves.
              </h2>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/64 md:text-lg">
                The workspace is the operating room for the process. It gives each stage a place to store what matters, so the work remains connected from first message to future support.
              </p>
            </div>

            <div className="grid gap-px overflow-hidden bg-white/10 md:grid-cols-2">
              {insideWorkspace.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="min-h-[220px] bg-[#05070a] p-6 ring-1 ring-white/10 md:p-7">
                    <Icon className="h-5 w-5 text-ai-blue" />
                    <h3 className="mt-8 text-xl font-semibold tracking-[-0.02em] text-white">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-white/58">{item.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <MessageSquare className="h-6 w-6 text-amber-300" />
            <h2 className="mt-7 max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              The client should never have to guess what happened.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/64 md:text-lg">
              The process is successful when the client can return later and still understand the request, the payment, the decision, the files, the delivery, and the next support route.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {principles.map((point) => (
                <div key={point} className="border-t border-white/12 pt-5">
                  <BadgeCheck className="h-5 w-5 text-amber-300" />
                  <p className="mt-5 text-sm font-semibold leading-7 text-white/70">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden rounded-bl-[2.75rem] bg-white/10 ring-1 ring-white/12 sm:min-h-[520px] md:rounded-bl-[5rem] lg:min-h-[680px]">
            <ImageFrame
              src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1600&h=1200&fit=crop&crop=center"
              sizes="(min-width: 1024px) 48vw, 100vw"
              objectPosition="50% 43%"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.62),rgba(5,7,10,0.04))]" />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#05070a]">
        <Image
          src="https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=2200&h=1400&fit=crop&crop=center"
          alt=""
          fill
          unoptimized
          sizes="100vw"
          className="object-cover opacity-34 saturate-125"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,10,0.94)_0%,rgba(5,7,10,0.74)_48%,rgba(5,7,10,0.25)_100%)]" />
        <div className="relative mx-auto flex min-h-[500px] max-w-7xl items-center px-5 py-14 sm:px-6 md:min-h-[600px] md:px-10 md:py-20">
          <div className="max-w-3xl">
            <LifeBuoy className="h-6 w-6 text-amber-300" />
            <h2 className="mt-7 break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              Start privately. Move clearly. Leave with a record.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/66 md:text-lg">
              That is the purpose of the Sitemendr process: make the client relationship easier to trust before, during, and after the work.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ProcessAction href="/register" tone="light">
                Create Workspace
              </ProcessAction>
              <ProcessAction href="/services">
                Review Services
              </ProcessAction>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProcessAction({
  href,
  children,
  tone = 'dark',
}: {
  href: string;
  children: React.ReactNode;
  tone?: 'dark' | 'light';
}) {
  const classes =
    tone === 'light'
      ? 'bg-white text-black hover:bg-amber-300 hover:text-black'
      : 'bg-white/[0.06] text-white ring-1 ring-white/12 hover:bg-white/[0.1]';

  return (
    <Link
      href={href}
      className={`inline-flex min-h-[48px] items-center justify-center gap-3 px-5 py-3.5 text-center text-[11px] font-black uppercase tracking-[0.12em] transition sm:px-6 sm:py-4 sm:text-xs sm:tracking-[0.14em] ${classes}`}
    >
      {children}
      <ArrowUpRight className="h-4 w-4" />
    </Link>
  );
}

function ImageFrame({
  src,
  sizes,
  objectPosition = 'center',
}: {
  src: string;
  sizes: string;
  objectPosition?: string;
}) {
  return (
    <Image
      src={src}
      alt=""
      fill
      unoptimized
      sizes={sizes}
      className="object-cover"
      style={{ objectPosition }}
    />
  );
}
