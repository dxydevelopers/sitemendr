import Image from 'next/image';
import Link from 'next/link';
import { Space_Grotesk } from 'next/font/google';
import {
  ArrowUpRight,
  BadgeCheck,
  ClipboardCheck,
  Code2,
  FileCode2,
  Gauge,
  Globe2,
  LifeBuoy,
  LockKeyhole,
  MessageSquare,
  MonitorCog,
  PanelsTopLeft,
  RefreshCw,
  SearchCheck,
  ServerCog,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const heroImages = [
  'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&h=900&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=900&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&h=900&fit=crop&crop=center',
];

const serviceDepths = [
  {
    id: 'custom-development',
    title: 'Custom development gives the business a system shaped around how work actually moves.',
    body: 'This is the path for portals, dashboards, booking flows, internal tools, client areas, integrations, and operational software that cannot be solved with a template. The work begins by understanding the business movement: what people enter, what the system must remember, who needs access, what should be automated, and where mistakes currently cost time.',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1500&h=1100&fit=crop&crop=center',
    icon: Code2,
  },
  {
    id: 'business-websites',
    title: 'Business websites need more than a clean surface. They need a convincing public structure.',
    body: 'A website has to explain the company with discipline. It should make the offer easy to understand, give visitors enough confidence to move forward, and present services without making the business feel smaller than it is. The result should feel composed, fast, responsive, and ready for real customers.',
    image: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=1500&h=1100&fit=crop&crop=center',
    icon: PanelsTopLeft,
  },
];

const repairSignals = [
  'Broken layouts and unstable pages',
  'Slow performance and poor mobile behavior',
  'Deployment, hosting, domain, or SSL trouble',
  'Forms, checkout, dashboards, or integrations failing quietly',
];

const careSignals = [
  'Updates, backups, and health checks',
  'Security review and uptime awareness',
  'Content support after launch',
  'A clear support route when something changes',
];

const ownershipRows = [
  {
    title: 'Source handoff',
    copy: 'The client receives the code and a clear explanation of what has been delivered.',
    icon: FileCode2,
  },
  {
    title: 'Deployment notes',
    copy: 'Hosting, environment, build, and release details are written down so the work can be managed later.',
    icon: ServerCog,
  },
  {
    title: 'Access discipline',
    copy: 'Credentials, ownership, billing, domains, and administrative access are treated as part of delivery.',
    icon: LockKeyhole,
  },
  {
    title: 'Maintenance route',
    copy: 'The business leaves knowing how care, updates, repairs, and future improvements can continue.',
    icon: LifeBuoy,
  },
];

const workspaceItems = [
  {
    title: 'The brief',
    copy: 'Goals, references, audience, pages, features, access notes, priorities, and business constraints.',
    icon: ClipboardCheck,
  },
  {
    title: 'The conversation',
    copy: 'Questions, decisions, approvals, scope changes, and delivery notes stay attached to the request.',
    icon: MessageSquare,
  },
  {
    title: 'The technical record',
    copy: 'Findings, fixes, assets, links, screenshots, build notes, and handoff material remain organized.',
    icon: MonitorCog,
  },
];

const process = [
  'Understand the business situation',
  'Study the existing material or technical condition',
  'Decide what must be built, repaired, or maintained',
  'Produce the work with visible checkpoints',
  'Deliver with ownership, notes, and a care route',
];

export default function DevelopmentServices() {
  return (
    <main className={`${spaceGrotesk.variable} min-h-screen overflow-hidden bg-[#05070a] text-white`}>
      <section className="relative min-h-[720px] overflow-hidden border-b border-white/10 pt-20 md:min-h-[820px]">
        <Image
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=2200&h=1400&fit=crop&crop=center"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover opacity-34 saturate-125"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#05070a_0%,rgba(5,7,10,0.92)_44%,rgba(5,7,10,0.32)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(0,102,255,0.18),transparent_32%),radial-gradient(circle_at_16%_84%,rgba(16,185,129,0.12),transparent_28%)]" />

        <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center gap-12 px-5 py-12 sm:px-6 md:min-h-[720px] md:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:py-16">
          <div>
            <div className="mb-7 flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.14em] text-white/52">
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Custom development</span>
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Websites</span>
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Repair</span>
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Care</span>
            </div>
            <h1 className="max-w-5xl break-words font-[var(--font-space-grotesk)] text-[2.45rem] font-semibold leading-[1.02] tracking-[-0.025em] sm:text-[3rem] md:text-6xl lg:text-7xl lg:tracking-[-0.035em]">
              Development work for businesses that need the digital side to become dependable.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-white/68 md:text-lg">
              This page is for the work behind serious business presence: new websites, custom systems, broken platforms, maintenance requests, and the kind of handoff that lets a client understand what they now own.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <DevelopmentAction href="/register" tone="light">
                Create Workspace
              </DevelopmentAction>
              <DevelopmentAction href="#build">
                See The Work
              </DevelopmentAction>
            </div>
          </div>

          <div className="relative min-h-[440px] sm:min-h-[540px] lg:min-h-[650px]">
            <div className="absolute left-0 top-0 h-[58%] w-[76%] overflow-hidden rounded-tl-[2.75rem] bg-white/10 ring-1 ring-white/12 md:rounded-tl-[5rem]">
              <ImageFrame src={heroImages[0]} sizes="(min-width: 1024px) 46vw, 90vw" />
            </div>
            <div className="absolute right-0 top-[19%] h-[48%] w-[58%] overflow-hidden rounded-br-[2.75rem] bg-white/10 ring-1 ring-white/12 md:rounded-br-[5rem]">
              <ImageFrame src={heroImages[1]} sizes="(min-width: 1024px) 34vw, 72vw" objectPosition="50% 42%" />
            </div>
            <div className="absolute bottom-0 left-[12%] h-[34%] w-[54%] overflow-hidden rounded-tr-[2.25rem] bg-white/10 ring-1 ring-white/12 md:rounded-tr-[4rem]">
              <ImageFrame src={heroImages[2]} sizes="(min-width: 1024px) 30vw, 70vw" objectPosition="50% 38%" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <h2 className="max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
            A technical request usually carries a business problem inside it.
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <p className="text-base leading-8 text-white/66">
              A company may ask for a website when the real issue is unclear positioning. A founder may ask for an app when the deeper need is operational control. A team may ask for a repair when the true risk is that nobody can trust the system anymore.
            </p>
            <p className="text-base leading-8 text-white/66">
              Sitemendr treats development as business infrastructure. The design, code, content structure, ownership, and maintenance route all have to serve the same purpose: make the digital asset easier to use, easier to trust, and easier to carry forward.
            </p>
          </div>
        </div>
      </section>

      <section id="build" className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:px-10 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <h2 className="max-w-4xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              When the business needs something new, the build has to begin before the code.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-white/64 lg:ml-auto">
              The first responsibility is not to open an editor. It is to understand what the business is trying to make possible, then shape the website or system around that purpose with enough structure to survive real use.
            </p>
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-2">
            {serviceDepths.map((service, index) => {
              const Icon = service.icon;

              return (
                <article id={service.id} key={service.title} className={index === 1 ? 'lg:pt-24' : ''}>
                  <div className="relative min-h-[340px] overflow-hidden bg-white/10 ring-1 ring-white/12 sm:min-h-[460px] lg:min-h-[560px]">
                    <ImageFrame src={service.image} sizes="(min-width: 1024px) 42vw, 100vw" objectPosition={index === 0 ? '50% 42%' : '50% 45%'} />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.58),rgba(5,7,10,0.04))]" />
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white/12" />
                  </div>
                  <div className="mt-8 max-w-2xl">
                    <Icon className="h-6 w-6 text-ai-blue" />
                    <h3 className="mt-6 font-[var(--font-space-grotesk)] text-2xl font-semibold leading-tight tracking-[-0.02em] text-white md:text-4xl">
                      {service.title}
                    </h3>
                    <p className="mt-6 text-base leading-8 text-white/62">{service.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="repair" className="border-b border-white/10 bg-[#05070a]">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative min-h-[420px] overflow-hidden sm:min-h-[560px] lg:min-h-[760px]">
            <ImageFrame
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1800&h=1300&fit=crop&crop=center"
              sizes="(min-width: 1024px) 56vw, 100vw"
              objectPosition="50% 45%"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.72),rgba(5,7,10,0.06))]" />
          </div>
          <div className="flex items-center px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:px-16">
            <div className="max-w-2xl">
              <Wrench className="h-6 w-6 text-expert-green" />
              <h2 className="mt-7 break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                Repair is diagnosis before action.
              </h2>
              <p className="mt-7 text-base leading-8 text-white/64 md:text-lg">
                A fragile site should not be changed blindly. Repair begins by finding what has failed, what is connected to it, and what risk the business is carrying because of it. Only then should the fix become visible.
              </p>
              <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
                {repairSignals.map((signal) => (
                  <div key={signal} className="flex items-start gap-4 py-5">
                    <SearchCheck className="mt-1 h-5 w-5 shrink-0 text-expert-green" />
                    <p className="text-sm font-semibold leading-7 text-white/72">{signal}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="maintenance" className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <RefreshCw className="h-6 w-6 text-ai-blue" />
            <h2 className="mt-7 max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              Maintenance is the quiet work that keeps the business from returning to emergency mode.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/64 md:text-lg">
              A launched website continues to age. Software changes, content gets updated, forms stop behaving, hosting changes, and small issues become expensive when no one is watching. Care gives the business a regular rhythm instead of a crisis whenever something breaks.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {careSignals.map((signal) => (
                <div key={signal} className="border-t border-white/12 pt-5">
                  <ShieldCheck className="h-5 w-5 text-expert-green" />
                  <p className="mt-5 text-sm font-semibold leading-7 text-white/70">{signal}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden rounded-bl-[2.75rem] bg-white/10 ring-1 ring-white/12 sm:min-h-[520px] md:rounded-bl-[5rem] lg:min-h-[680px]">
            <ImageFrame
              src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1600&h=1200&fit=crop&crop=center"
              sizes="(min-width: 1024px) 48vw, 100vw"
              objectPosition="50% 42%"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.62),rgba(5,7,10,0.04))]" />
          </div>
        </div>
      </section>

      <section id="self-hosted" className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:px-10 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
            <div>
              <ServerCog className="h-6 w-6 text-ai-blue" />
              <h2 className="mt-7 max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                Delivery should leave the client with control, not confusion.
              </h2>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/64 md:text-lg">
                Self-hosted delivery matters when the client needs ownership of the code, the hosting route, the deployment notes, and the future maintenance path. The work is not truly finished if nobody can explain where it lives or how it should be handled later.
              </p>
            </div>

            <div className="grid gap-px overflow-hidden bg-white/10 md:grid-cols-2">
              {ownershipRows.map((row) => {
                const Icon = row.icon;

                return (
                  <div key={row.title} className="min-h-[220px] bg-[#05070a] p-6 ring-1 ring-white/10 md:p-7">
                    <Icon className="h-5 w-5 text-expert-green" />
                    <h3 className="mt-8 text-xl font-semibold tracking-[-0.02em] text-white">{row.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-white/58">{row.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="grid lg:grid-cols-[0.96fr_1.04fr]">
          <div className="relative min-h-[420px] overflow-hidden sm:min-h-[560px] lg:min-h-[720px]">
            <ImageFrame
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1800&h=1300&fit=crop&crop=center"
              sizes="(min-width: 1024px) 50vw, 100vw"
              objectPosition="50% 44%"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.66),rgba(5,7,10,0.05))]" />
          </div>
          <div className="flex items-center px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:px-16">
            <div className="max-w-2xl">
              <Globe2 className="h-6 w-6 text-ai-blue" />
              <h2 className="mt-7 break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                The workspace keeps the whole request from scattering.
              </h2>
              <p className="mt-7 text-base leading-8 text-white/64 md:text-lg">
                Development work gathers many small decisions: pages, assets, access, integrations, approvals, invoices, support questions, and handoff notes. The workspace gives those decisions a place to live before the work starts and after it is delivered.
              </p>
              <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
                {workspaceItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="grid gap-4 py-6 sm:grid-cols-[auto_1fr]">
                      <Icon className="h-5 w-5 text-expert-green" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-white/58">{item.copy}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:px-10 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
            <h2 className="max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              The process is simple because the responsibility is not.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-white/64 lg:ml-auto">
              Sitemendr keeps development work understandable by moving through a clear sequence. The point is not to make the project feel smaller; it is to make a serious project easier to trust.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {process.map((step, index) => (
              <div key={step} className="border-t border-white/12 pt-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/32">0{index + 1}</span>
                  {index === process.length - 1 ? <BadgeCheck className="h-4 w-4 text-expert-green" /> : <Gauge className="h-4 w-4 text-ai-blue" />}
                </div>
                <p className="mt-8 text-lg font-semibold leading-7 text-white/82">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#05070a]">
        <Image
          src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=2200&h=1400&fit=crop&crop=center"
          alt=""
          fill
          unoptimized
          sizes="100vw"
          className="object-cover opacity-34 saturate-125"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,10,0.94)_0%,rgba(5,7,10,0.76)_48%,rgba(5,7,10,0.28)_100%)]" />
        <div className="relative mx-auto flex min-h-[500px] max-w-7xl items-center px-5 py-14 sm:px-6 md:min-h-[600px] md:px-10 md:py-20">
          <div className="max-w-3xl">
            <h2 className="break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              Start with the request. Let the correct technical shape become clear.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/66 md:text-lg">
              The private workspace is where Sitemendr can review the business, the existing material, the technical condition, the desired outcome, and the level of care the project needs after launch.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <DevelopmentAction href="/register" tone="light">
                Create Workspace
              </DevelopmentAction>
              <DevelopmentAction href="/services/ecommerce">
                View Commerce Path
              </DevelopmentAction>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function DevelopmentAction({
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
