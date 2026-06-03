import Image from 'next/image';
import Link from 'next/link';
import { Space_Grotesk } from 'next/font/google';
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CircleHelp,
  CreditCard,
  Headphones,
  LifeBuoy,
  LockKeyhole,
  Mail,
  MessageSquare,
  Phone,
  ReceiptText,
  SearchCheck,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const supportPaths = [
  {
    title: 'Ask before opening a workspace',
    copy: 'For visitors who need direction before sharing project details.',
    icon: CircleHelp,
    href: '#public-guidance',
  },
  {
    title: 'Open a private ticket',
    copy: 'For clients whose issue belongs to a project, payment, file, or delivery record.',
    icon: MessageSquare,
    href: '/dashboard?tab=support',
  },
  {
    title: 'Review billing context',
    copy: 'For invoices, receipts, subscriptions, confirmations, and payment questions.',
    icon: CreditCard,
    href: '#billing-support',
  },
  {
    title: 'Request technical care',
    copy: 'For broken pages, unstable features, hosting issues, and maintenance concerns.',
    icon: Wrench,
    href: '#technical-care',
  },
];

const ticketDetails = [
  'What happened and when it started',
  'The page, project, payment, or file involved',
  'Screenshots, links, receipts, or access notes if needed',
  'What you expected to happen instead',
  'How urgent the issue is for the business',
];

const supportSituations = [
  {
    title: 'Public questions',
    copy: 'Use this when you are still trying to understand Sitemendr, the workspace, services, or the best route for your request.',
    icon: BookOpen,
  },
  {
    title: 'Private client issues',
    copy: 'Use the dashboard when the issue contains project context, billing details, files, access notes, screenshots, or delivery history.',
    icon: LockKeyhole,
  },
  {
    title: 'Technical diagnosis',
    copy: 'Use support when something is broken, unstable, unclear, missing, slow, or no longer behaving as expected.',
    icon: SearchCheck,
  },
];

const careTypes = [
  'Website or store behavior changed after delivery',
  'A form, payment route, dashboard, or checkout is not acting correctly',
  'A client needs a file, receipt, access note, or handoff detail',
  'Maintenance, updates, monitoring, or recovery needs attention',
];

const contactMethods = [
  {
    title: 'Email',
    value: 'support@sitemendr.com',
    href: 'mailto:support@sitemendr.com',
    icon: Mail,
  },
  {
    title: 'Phone',
    value: '+254 790 057 596',
    href: 'tel:+254790057596',
    icon: Phone,
  },
  {
    title: 'Ticket',
    value: 'Dashboard support',
    href: '/dashboard?tab=support',
    icon: MessageSquare,
  },
];

export default function HelpCenter() {
  return (
    <main className={`${spaceGrotesk.variable} min-h-screen overflow-hidden bg-[#05070a] text-white`}>
      <section className="relative min-h-[760px] overflow-hidden border-b border-white/10 pt-20">
        <Image
          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=2200&h=1400&fit=crop&crop=center"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-[58%_42%] opacity-42 saturate-125"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#05070a_0%,rgba(5,7,10,0.9)_40%,rgba(5,7,10,0.28)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(to_top,#05070a,transparent)]" />

        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-5 py-14 sm:px-6 md:px-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="mb-8 inline-flex items-center gap-3 border border-white/12 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/58">
              <Headphones className="h-4 w-4 text-tech-purple" />
              Support Center
            </div>
            <h1 className="max-w-5xl break-words font-[var(--font-space-grotesk)] text-[2.55rem] font-semibold leading-[1.02] tracking-[-0.025em] sm:text-[3.15rem] md:text-6xl lg:text-7xl lg:tracking-[-0.035em]">
              Help should point the client to the right place, not create another mess.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
              Sitemendr support separates public guidance from private client issues. Simple questions can begin here. Work-specific problems belong inside the workspace, where project history, billing, files, and delivery notes can stay connected.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <SupportAction href="/dashboard?tab=support" tone="light">
                Open Support Ticket
              </SupportAction>
              <SupportAction href="#public-guidance">
                Choose Route
              </SupportAction>
            </div>
          </div>

          <div className="relative lg:min-h-[620px]">
            <div className="ml-auto max-w-xl border border-white/12 bg-[#05070a]/72 p-4 backdrop-blur-xl sm:p-6">
              <div className="border-b border-white/10 pb-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/36">Support routing</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white">Where should this issue live?</h2>
                  </div>
                  <LifeBuoy className="h-6 w-6 text-tech-purple" />
                </div>
              </div>

              <div className="divide-y divide-white/10">
                {supportPaths.map((path) => {
                  const Icon = path.icon;

                  return (
                    <Link key={path.title} href={path.href} className="group grid gap-4 py-5 sm:grid-cols-[auto_1fr_auto] sm:items-start">
                      <Icon className="h-5 w-5 text-tech-purple" />
                      <span>
                        <span className="block text-base font-semibold text-white">{path.title}</span>
                        <span className="mt-2 block text-sm leading-6 text-white/52">{path.copy}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-white/24 transition group-hover:text-expert-green" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="public-guidance" className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <CircleHelp className="h-6 w-6 text-tech-purple" />
            <h2 className="mt-7 max-w-2xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              Support begins by identifying the kind of help.
            </h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/64 md:text-lg">
              A public question, a private client issue, and a technical fault should not be handled the same way. The route matters because it decides what context can be seen and preserved.
            </p>
          </div>

          <div className="grid gap-8">
            {supportSituations.map((item, index) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="grid gap-6 border-t border-white/12 pt-8 md:grid-cols-[120px_1fr]">
                  <div className="flex items-center gap-4 md:block">
                    <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/30">0{index + 1}</span>
                    <Icon className="h-6 w-6 text-tech-purple md:mt-8" />
                  </div>
                  <div>
                    <h3 className="font-[var(--font-space-grotesk)] text-3xl font-semibold leading-tight tracking-[-0.02em] text-white md:text-5xl">
                      {item.title}
                    </h3>
                    <p className="mt-6 max-w-2xl text-base leading-8 text-white/62">{item.copy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[420px] overflow-hidden sm:min-h-[560px] lg:min-h-[760px]">
            <ImageFrame
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1800&h=1300&fit=crop&crop=center"
              sizes="(min-width: 1024px) 50vw, 100vw"
              objectPosition="50% 42%"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.72),rgba(5,7,10,0.06))]" />
          </div>

          <div className="flex items-center px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:px-16">
            <div className="max-w-2xl">
              <LockKeyhole className="h-6 w-6 text-expert-green" />
              <h2 className="mt-7 break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                Private tickets are for issues that need the record around them.
              </h2>
              <p className="mt-7 text-base leading-8 text-white/64 md:text-lg">
                If the question involves a project, payment, screenshot, file, login note, handoff item, or technical finding, it belongs in the dashboard. That keeps the answer tied to the work instead of floating away from the details.
              </p>
              <div className="mt-10 grid gap-px overflow-hidden bg-white/10">
                {ticketDetails.map((detail, index) => (
                  <div key={detail} className="grid gap-5 bg-[#05070a] p-5 ring-1 ring-white/10 sm:grid-cols-[auto_1fr]">
                    <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/32">T0{index + 1}</span>
                    <p className="text-sm font-semibold leading-7 text-white/72">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="technical-care" className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:px-10 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <Wrench className="h-6 w-6 text-tech-purple" />
              <h2 className="mt-7 max-w-4xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                Technical help needs the condition, not only the complaint.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-white/64 lg:ml-auto">
              “It is not working” is a beginning, but support becomes useful when the condition is visible: where the issue appears, what changed, who is affected, and how serious it is for the business.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {careTypes.map((item) => (
              <div key={item} className="min-h-[180px] border-l border-white/12 bg-white/[0.025] p-6">
                <SearchCheck className="h-5 w-5 text-tech-purple" />
                <p className="mt-8 text-xl font-semibold leading-8 tracking-[-0.02em] text-white/80">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="billing-support" className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:grid-cols-[1.06fr_0.94fr] lg:items-center">
          <div>
            <ReceiptText className="h-6 w-6 text-ai-blue" />
            <h2 className="mt-7 max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              Billing support should stay attached to the work it paid for.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/64 md:text-lg">
              Invoices, receipts, subscriptions, payment confirmations, and refund questions are easier to handle when they sit near project context. The workspace keeps money questions from becoming isolated from the service record.
            </p>
            <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {['Invoice or receipt request', 'Payment confirmation', 'Subscription or care plan question', 'Refund or cancellation context'].map((item) => (
                <div key={item} className="flex items-start gap-4 py-5">
                  <CreditCard className="mt-1 h-5 w-5 shrink-0 text-ai-blue" />
                  <p className="text-sm font-semibold leading-7 text-white/72">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden rounded-tr-[2.75rem] bg-white/10 ring-1 ring-white/12 sm:min-h-[520px] md:rounded-tr-[5rem] lg:min-h-[640px]">
            <ImageFrame
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&h=1200&fit=crop&crop=center"
              sizes="(min-width: 1024px) 42vw, 100vw"
              objectPosition="50% 43%"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.66),rgba(5,7,10,0.06))]" />
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:px-10 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:items-start">
            <div>
              <ShieldCheck className="h-6 w-6 text-expert-green" />
              <h2 className="mt-7 max-w-2xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                A clear support answer leaves a trail.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden bg-white/10 md:grid-cols-3">
              {contactMethods.map((method) => {
                const Icon = method.icon;

                return (
                  <Link key={method.title} href={method.href} className="group min-h-[250px] bg-[#05070a] p-6 ring-1 ring-white/10 transition hover:bg-white/[0.045]">
                    <Icon className="h-5 w-5 text-tech-purple" />
                    <h3 className="mt-10 text-2xl font-semibold tracking-[-0.02em] text-white">{method.title}</h3>
                    <p className="mt-5 text-sm font-black uppercase tracking-[0.12em] text-white/48">{method.value}</p>
                    <ArrowUpRight className="mt-10 h-4 w-4 text-white/28 transition group-hover:text-expert-green" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#05070a]">
        <Image
          src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=2200&h=1400&fit=crop&crop=center"
          alt=""
          fill
          unoptimized
          sizes="100vw"
          className="object-cover object-[50%_42%] opacity-34 saturate-125"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,10,0.95)_0%,rgba(5,7,10,0.76)_48%,rgba(5,7,10,0.28)_100%)]" />
        <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-center px-5 py-14 sm:px-6 md:min-h-[620px] md:px-10 md:py-20">
          <div className="max-w-3xl">
            <BadgeCheck className="h-6 w-6 text-tech-purple" />
            <h2 className="mt-7 break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              If it belongs to your project, keep it inside your workspace.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/66 md:text-lg">
              That is how support stays private, useful, and connected to the work Sitemendr is responsible for.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <SupportAction href="/dashboard?tab=support" tone="light">
                Open Support Ticket
              </SupportAction>
              <SupportAction href="/workspace">
                View Workspace
              </SupportAction>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SupportAction({
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
      ? 'bg-white text-black hover:bg-tech-purple hover:text-white'
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
