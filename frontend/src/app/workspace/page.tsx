import Image from 'next/image';
import Link from 'next/link';
import { Space_Grotesk } from 'next/font/google';
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  FileStack,
  FolderKanban,
  LayoutDashboard,
  LockKeyhole,
  MessageSquare,
  MonitorCheck,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const heroImages = [
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1300&h=950&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1300&h=950&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1100&h=850&fit=crop&crop=center',
];

const workspacePillars = [
  {
    title: 'Private by default',
    copy: 'A client request belongs in a controlled place. The workspace gives sensitive details, access notes, files, invoices, and delivery records a private home instead of scattering them through casual channels.',
    icon: LockKeyhole,
  },
  {
    title: 'Connected to the right work',
    copy: 'The workspace connects the client request to the correct service path: development, repair, maintenance, commerce, delivery, or support. The client does not have to force the work into the wrong category.',
    icon: FolderKanban,
  },
  {
    title: 'Readable after the work is done',
    copy: 'Good delivery leaves a record. Messages, approvals, files, scope, payment history, support notes, and handoff decisions remain understandable when the client returns later.',
    icon: FileStack,
  },
];

const dashboardAreas = [
  {
    title: 'Projects',
    copy: 'Active requests, delivery status, scope notes, milestones, and progress context.',
    icon: FolderKanban,
    href: '/dashboard?tab=projects',
  },
  {
    title: 'Messages',
    copy: 'Questions, decisions, approvals, and project conversations attached to the work.',
    icon: MessageSquare,
    href: '/dashboard',
  },
  {
    title: 'Billing',
    copy: 'Invoices, payment history, subscriptions, and service payment context.',
    icon: ReceiptText,
    href: '/dashboard?tab=billing',
  },
  {
    title: 'Resources',
    copy: 'Files, references, documents, handoff notes, and useful client material.',
    icon: BookOpen,
    href: '/dashboard?tab=resources',
  },
];

const connectedFlow = [
  'A client opens a private account',
  'The request is described with files, context, and goals',
  'Sitemendr reviews the situation and chooses the correct service route',
  'Scope, pricing, approvals, messages, and delivery notes stay connected',
  'Support and future work continue from the same record',
];

const proofPoints = [
  'Less confusion between service, payment, and delivery',
  'A cleaner history of what was requested and approved',
  'A private place for files, access notes, and support',
  'A professional relationship that can continue after launch',
];

export default function WorkspacePage() {
  return (
    <main className={`${spaceGrotesk.variable} min-h-screen overflow-hidden bg-[#05070a] text-white`}>
      <section className="relative min-h-[720px] overflow-hidden border-b border-white/10 pt-20 md:min-h-[820px]">
        <Image
          src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=2200&h=1400&fit=crop&crop=center"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover opacity-36 saturate-125"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#05070a_0%,rgba(5,7,10,0.9)_45%,rgba(5,7,10,0.25)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(0,102,255,0.18),transparent_32%),radial-gradient(circle_at_18%_84%,rgba(16,185,129,0.13),transparent_30%)]" />

        <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center gap-12 px-5 py-12 sm:px-6 md:min-h-[720px] md:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:py-16">
          <div>
            <div className="mb-7 flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.14em] text-white/52">
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Private requests</span>
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Messages</span>
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Billing</span>
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Delivery</span>
            </div>
            <h1 className="max-w-5xl break-words font-[var(--font-space-grotesk)] text-[2.45rem] font-semibold leading-[1.02] tracking-[-0.025em] sm:text-[3rem] md:text-6xl lg:text-7xl lg:tracking-[-0.035em]">
              A private workspace for work that should not live in scattered messages.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-white/68 md:text-lg">
              The Sitemendr workspace is where a client request becomes organized: service path, files, messages, approvals, payments, delivery notes, and support all stay connected to the same relationship.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <WorkspaceAction href="/register" tone="light">
                Create Workspace
              </WorkspaceAction>
              <WorkspaceAction href="/process">
                See Process
              </WorkspaceAction>
            </div>
          </div>

          <div className="relative min-h-[440px] sm:min-h-[540px] lg:min-h-[650px]">
            <div className="absolute left-0 top-0 h-[58%] w-[76%] overflow-hidden rounded-tl-[2.75rem] bg-white/10 ring-1 ring-white/12 md:rounded-tl-[5rem]">
              <ImageFrame src={heroImages[0]} sizes="(min-width: 1024px) 46vw, 90vw" objectPosition="50% 42%" />
            </div>
            <div className="absolute right-0 top-[19%] h-[48%] w-[58%] overflow-hidden rounded-br-[2.75rem] bg-white/10 ring-1 ring-white/12 md:rounded-br-[5rem]">
              <ImageFrame src={heroImages[1]} sizes="(min-width: 1024px) 34vw, 72vw" objectPosition="50% 44%" />
            </div>
            <div className="absolute bottom-0 left-[12%] h-[34%] w-[54%] overflow-hidden rounded-tr-[2.25rem] bg-white/10 ring-1 ring-white/12 md:rounded-tr-[4rem]">
              <ImageFrame src={heroImages[2]} sizes="(min-width: 1024px) 30vw, 70vw" objectPosition="50% 40%" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <h2 className="max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
            The workspace is not decoration. It is how Sitemendr protects the shape of the work.
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <p className="text-base leading-8 text-white/66">
              Serious digital work carries private details: business goals, files, invoices, login notes, decisions, technical findings, support requests, and payment records. When those details are scattered, the client relationship becomes harder to trust.
            </p>
            <p className="text-base leading-8 text-white/66">
              The workspace gives that relationship a controlled place to live. It lets Sitemendr understand the request, connect it to the correct service path, and keep the delivery history readable after the first task is complete.
            </p>
          </div>
        </div>
      </section>

      <section id="workspace-preview" className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:px-10 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
            <h2 className="max-w-4xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              Before the dashboard is a feature, it is a promise of order.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-white/64 lg:ml-auto">
              A client should feel that the work has a home. Projects, messages, billing, resources, and support are separate enough to stay clear, but connected enough to tell one complete story.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {dashboardAreas.map((area) => {
              const Icon = area.icon;

              return (
                <Link key={area.title} href={area.href} className="group min-h-[250px] bg-white/[0.025] p-6 ring-1 ring-white/10 transition hover:bg-white/[0.055]">
                  <div className="flex items-start justify-between gap-5">
                    <Icon className="h-6 w-6 text-ai-blue" />
                    <ArrowUpRight className="h-4 w-4 text-white/24 transition group-hover:text-expert-green" />
                  </div>
                  <h3 className="mt-10 text-2xl font-semibold tracking-[-0.02em] text-white">{area.title}</h3>
                  <p className="mt-5 text-sm leading-7 text-white/56">{area.copy}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative min-h-[420px] overflow-hidden sm:min-h-[560px] lg:min-h-[760px]">
            <ImageFrame
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1800&h=1300&fit=crop&crop=center"
              sizes="(min-width: 1024px) 56vw, 100vw"
              objectPosition="50% 44%"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.72),rgba(5,7,10,0.06))]" />
          </div>
          <div className="flex items-center px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:px-16">
            <div className="max-w-2xl">
              <ShieldCheck className="h-6 w-6 text-expert-green" />
              <h2 className="mt-7 break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                Privacy matters because the request often contains the business itself.
              </h2>
              <p className="mt-7 text-base leading-8 text-white/64 md:text-lg">
                A client may share product ideas, system problems, payment concerns, credentials, business plans, screenshots, or customer-facing issues. The workspace treats those details as part of a private working relationship, not loose public conversation.
              </p>
              <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
                {workspacePillars.map((pillar) => {
                  const Icon = pillar.icon;

                  return (
                    <div key={pillar.title} className="grid gap-4 py-6 sm:grid-cols-[auto_1fr]">
                      <Icon className="h-5 w-5 text-expert-green" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-white/58">{pillar.copy}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="operating-flow" className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:px-10 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
            <h2 className="max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              The request enters once, then everything important stays connected.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-white/64 lg:ml-auto">
              The workspace gives Sitemendr a clean way to understand the request, guide the client, manage approvals, collect payment context, and continue support without losing the history of what happened.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {connectedFlow.map((step, index) => (
              <div key={step} className="border-t border-white/12 pt-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/32">0{index + 1}</span>
                  {index === connectedFlow.length - 1 ? <BadgeCheck className="h-4 w-4 text-expert-green" /> : <MonitorCheck className="h-4 w-4 text-ai-blue" />}
                </div>
                <p className="mt-8 text-lg font-semibold leading-7 text-white/82">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <LayoutDashboard className="h-6 w-6 text-ai-blue" />
            <h2 className="mt-7 max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              The client sees organization. Sitemendr sees the full context.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/64 md:text-lg">
              The workspace helps both sides. The client can return to projects, payments, resources, and support. Sitemendr can see what was requested, what was approved, what was delivered, and what needs care next.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {proofPoints.map((point) => (
                <div key={point} className="border-t border-white/12 pt-5">
                  <ClipboardCheck className="h-5 w-5 text-expert-green" />
                  <p className="mt-5 text-sm font-semibold leading-7 text-white/70">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden rounded-bl-[2.75rem] bg-white/10 ring-1 ring-white/12 sm:min-h-[520px] md:rounded-bl-[5rem] lg:min-h-[680px]">
            <ImageFrame
              src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1600&h=1200&fit=crop&crop=center"
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
            <CreditCard className="h-6 w-6 text-ai-blue" />
            <h2 className="mt-7 break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              Create the workspace first, then let the right service path become clear.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/66 md:text-lg">
              A workspace gives the request a private beginning. From there, Sitemendr can understand the work, organize the next step, and keep the relationship connected from review to support.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <WorkspaceAction href="/register" tone="light">
                Create Workspace
              </WorkspaceAction>
              <WorkspaceAction href="/process">
                Review Full Process
              </WorkspaceAction>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function WorkspaceAction({
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
      ? 'bg-white text-black hover:bg-ai-blue hover:text-white'
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
