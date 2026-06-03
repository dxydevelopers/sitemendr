import Image from 'next/image';
import Link from 'next/link';
import { Space_Grotesk } from 'next/font/google';
import {
  ArrowUpRight,
  Code2,
  CreditCard,
  PackageCheck,
  PanelsTopLeft,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Wrench,
} from 'lucide-react';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const corePaths = [
  {
    title: 'The business is still deciding what it needs.',
    copy: 'The whole service landscape stays visible until the right direction becomes obvious.',
    href: '/services',
  },
  {
    title: 'Something important needs to be built properly.',
    copy: 'A website, portal, dashboard, platform, or internal system has to be planned with enough care to last beyond launch.',
    href: '/services/development',
  },
  {
    title: 'An existing system is no longer dependable.',
    copy: 'The work begins with diagnosis, because a broken site or fragile setup should not be changed blindly.',
    href: '/services/development#repair',
  },
  {
    title: 'The business is preparing to sell with more confidence.',
    copy: 'Products, checkout, dropshipping, and delivery expectations need to feel coherent before customers are invited in.',
    href: '/services/ecommerce',
  },
];

const serviceTypes = [
  {
    icon: Code2,
    title: 'Custom Development',
    copy: 'Some work cannot be solved with a template. It needs a system shaped around the business itself: how information is collected, how users move, how records are handled, and how separate tools need to work together.',
    href: '/services/development#custom-development',
  },
  {
    icon: PanelsTopLeft,
    title: 'Business Websites',
    copy: 'A public website should not feel like a brochure pasted online. It should explain the business clearly, give visitors confidence, organize services with care, and make the next step easy to understand.',
    href: '/services/development#business-websites',
  },
  {
    icon: ShieldCheck,
    title: 'Maintenance',
    copy: 'A website does not remain healthy simply because it launched. Content changes, software ages, quiet errors appear, and small issues become expensive when nobody is watching.',
    href: '/services/development#maintenance',
  },
  {
    icon: ShoppingBag,
    title: 'eCommerce Solutions',
    copy: 'Selling online is not only about placing products on a page. The store has to make trust visible, guide the buyer clearly, support payment, and make delivery feel dependable.',
    href: '/services/ecommerce#storefront-setup',
  },
];

const pricingPaths = [
  {
    icon: CreditCard,
    title: 'Build Pricing',
    copy: 'New builds are priced around scope, complexity, integrations, content depth, and the level of ownership expected at handoff.',
  },
  {
    icon: Wrench,
    title: 'Repair Pricing',
    copy: 'Repair work begins with diagnosis. The cost depends on the risk, the depth of the issue, and how carefully the existing system must be handled.',
  },
  {
    icon: RefreshCw,
    title: 'Maintenance Plans',
    copy: 'Care plans are built around continuity: updates, monitoring, content support, backups, and the responsibility carried after launch.',
  },
];

export default function Services() {
  return (
    <main className={`${spaceGrotesk.variable} min-h-screen overflow-hidden bg-[#05070a] text-white`}>
      <section className="relative overflow-hidden border-b border-white/10 pt-20">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=2200&h=1400&fit=crop&crop=center"
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover opacity-38 saturate-125"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#05070a_0%,rgba(5,7,10,0.88)_42%,rgba(5,7,10,0.28)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(0,102,255,0.18),transparent_30%),radial-gradient(circle_at_88%_78%,rgba(16,185,129,0.16),transparent_28%)]" />
        </div>

        <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center gap-10 px-5 py-12 sm:px-6 md:px-10 md:py-16 lg:min-h-[720px] lg:grid-cols-[0.96fr_1.04fr] lg:gap-14">
          <div>
            <h1 className="max-w-5xl break-words font-[var(--font-space-grotesk)] text-[2.35rem] font-semibold leading-[1.03] tracking-[-0.025em] sm:text-[2.75rem] md:text-6xl lg:text-7xl lg:tracking-[-0.035em]">
              Digital services for businesses that need the work to hold together.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-white/68 md:text-lg">
              Sitemendr helps businesses establish, repair, maintain, and prepare the digital systems they rely on. The work may begin as a website, a platform, a store, a recovery request, or a maintenance concern; the goal is always the same: make the digital side of the business clearer, stronger, and easier to own.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap md:mt-10 md:gap-4">
              <ServiceAction href="/register" tone="light">
                Create Workspace
              </ServiceAction>
              <ServiceAction href="#service-types">
                Explore Services
              </ServiceAction>
            </div>
          </div>

          <div className="relative min-h-[390px] sm:min-h-[460px] lg:min-h-[610px]">
            <div className="absolute left-0 top-4 h-[58%] w-[70%] overflow-hidden rounded-tl-[2.5rem] bg-white/10 ring-1 ring-white/12 md:rounded-tl-[4.5rem]">
              <Image
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1300&h=950&fit=crop&crop=center"
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 44vw, 90vw"
                className="object-cover"
              />
            </div>
            <div className="absolute right-0 top-24 h-[48%] w-[56%] overflow-hidden rounded-br-[2.5rem] bg-white/10 ring-1 ring-white/12 sm:top-28 md:top-32 md:rounded-br-[4.5rem]">
              <Image
                src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&h=900&fit=crop&crop=center"
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 34vw, 70vw"
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-2 left-10 h-[34%] w-[52%] overflow-hidden rounded-tr-[2rem] bg-white/10 ring-1 ring-white/12 sm:left-16 sm:w-[48%] md:left-20 md:w-[46%] md:rounded-tr-[3rem]">
              <Image
                src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1000&h=800&fit=crop&crop=center"
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 28vw, 65vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 md:px-10 md:py-16 lg:grid-cols-[0.82fr_1.18fr] lg:py-20">
          <div>
            <h2 className="max-w-2xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              The request is never treated as a small isolated task.
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <p className="text-base leading-8 text-white/66">
              A business rarely comes with a perfectly named problem. Sometimes the issue is a broken layout, but the deeper concern is trust. Sometimes the request is a new website, but the real need is a better explanation of the business. Sometimes commerce looks like a store, when what is missing is structure around products, checkout, and delivery.
            </p>
            <p className="text-base leading-8 text-white/66">
              The service page exists to make that landscape readable. It shows the paths Sitemendr can take, the type of work each path contains, and the way delivery is organized once the client is ready to move from public information into a private workspace.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:px-10 md:py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div className="relative min-h-[320px] overflow-hidden rounded-tr-[2.5rem] bg-white/10 ring-1 ring-white/12 sm:min-h-[400px] md:rounded-tr-[4rem] lg:min-h-[560px]">
              <Image
                src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1500&h=1100&fit=crop&crop=center"
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover object-[52%_44%]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.46),rgba(5,7,10,0.04))]" />
            </div>

            <div>
              <h2 className="max-w-2xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                Start with what is actually happening in the business.
              </h2>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/64 md:text-lg">
                A service page should not force every client to name the work perfectly on the first visit. A business may only know that something feels unfinished, fragile, slow, unclear, or not ready for customers. Sitemendr begins there, with the condition of the business, then lets the correct service path become easier to recognize.
              </p>

              <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
                {corePaths.map((path) => (
                  <Link key={path.title} href={path.href} className="group grid gap-3 py-5 sm:gap-4 sm:py-6 md:grid-cols-[1fr_1.25fr_auto] md:items-start">
                    <h3 className="text-lg font-semibold leading-6 text-white">{path.title}</h3>
                    <p className="text-sm leading-7 text-white/58">{path.copy}</p>
                    <ArrowUpRight className="h-4 w-4 text-white/28 transition group-hover:text-ai-blue" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="service-types" className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:px-10 md:py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                What Sitemendr is usually asked to make clear.
              </h2>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/64">
                The work may look technical from the outside, but the business reason behind it is usually human: a customer needs to understand, a team needs to operate, a founder needs ownership, or a store needs to feel dependable enough for people to buy.
              </p>
            </div>

            <div className="relative h-[320px] overflow-hidden rounded-bl-[2.5rem] bg-white/10 ring-1 ring-white/12 sm:h-[420px] md:rounded-bl-[5rem] lg:h-[520px]">
              <Image
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1500&h=1100&fit=crop&crop=center"
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.62),rgba(5,7,10,0.04))]" />
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {serviceTypes.map((service) => {
              const Icon = service.icon;

              return (
                <Link key={service.title} href={service.href} className="group bg-white/[0.025] p-6 ring-1 ring-white/10 transition hover:bg-white/[0.055] md:p-7">
                  <div className="flex items-start justify-between gap-6">
                    <div className="grid h-10 w-10 place-items-center bg-white/[0.06] text-ai-blue ring-1 ring-white/10">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-white/28 transition group-hover:text-expert-green" />
                  </div>
                  <h3 className="mt-7 text-xl font-semibold tracking-[-0.02em] text-white md:mt-8 md:text-2xl">{service.title}</h3>
                  <p className="mt-5 text-sm leading-7 text-white/58">{service.copy}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="grid lg:grid-cols-2">
          <ImageStory
            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1500&h=1100&fit=crop&crop=center"
            className="min-h-[340px] sm:min-h-[440px] lg:min-h-[740px]"
          />
          <div className="flex items-center px-5 py-14 sm:px-6 md:px-10 md:py-16 lg:px-16">
            <div className="max-w-2xl">
              <h2 className="break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                When the business needs something built, recovered, or kept alive with care.
              </h2>
              <p className="mt-7 text-base leading-8 text-white/64">
                The development path is for businesses that need a technical asset to become dependable. It may be a new public website, a custom internal tool, a portal, a broken installation, a performance issue, or a site that needs ongoing maintenance after launch.
              </p>
              <p className="mt-5 text-base leading-8 text-white/64">
                This page does not reduce that work to code. It looks at the business situation around the code: what has to be explained, who has to use it, what must be handed over, and what cannot be allowed to fail quietly later.
              </p>
              <div className="mt-9">
                <ServiceAction href="/services/development">View Development Path</ServiceAction>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="grid lg:grid-cols-2">
          <div className="flex items-center px-5 py-14 sm:px-6 md:px-10 md:py-16 lg:px-16">
            <div className="max-w-2xl">
              <h2 className="break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                Online selling needs more than a store that happens to load.
              </h2>
              <p className="mt-7 text-base leading-8 text-white/64">
                Commerce work is about the complete buying condition: product presentation, category structure, checkout confidence, payment readiness, order expectations, and the practical route from interest to delivery.
              </p>
              <p className="mt-5 text-base leading-8 text-white/64">
                For dropshipping, the same care matters even more. The offer, supplier flow, customer promise, and delivery expectation must be organized before the business begins inviting buyers into the store.
              </p>
              <div className="mt-9">
                <ServiceAction href="/services/ecommerce">View Commerce Path</ServiceAction>
              </div>
            </div>
          </div>
          <ImageStory
            src="https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=1500&h=1100&fit=crop&crop=center"
            className="min-h-[340px] sm:min-h-[440px] lg:min-h-[740px]"
          />
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-6 md:px-10 md:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <div>
            <h2 className="max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              Completion is not enough. The client must understand what they now own.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/64">
              Sitemendr treats delivery as a business responsibility. The handoff should preserve access, source ownership, documentation, launch notes, care routes, and the difference between what is finished now and what may need attention later.
            </p>
          </div>
          <div className="grid gap-5">
            <div className="relative min-h-[260px] overflow-hidden rounded-tr-[2.5rem] bg-white/10 ring-1 ring-white/12 sm:min-h-[320px] md:rounded-tr-[4rem]">
              <Image
                src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1300&h=850&fit=crop&crop=center"
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="grid gap-px overflow-hidden bg-white/10 md:grid-cols-2">
              <div className="bg-white/[0.035] p-6">
                <PackageCheck className="h-5 w-5 text-expert-green" />
                <h3 className="mt-6 text-xl font-semibold text-white">Self-Hosted Delivery</h3>
                <p className="mt-4 text-sm leading-7 text-white/58">
                  Code handoff and ownership for clients who need to control where the work lives and how it can be maintained.
                </p>
              </div>
              <div className="bg-white/[0.035] p-6">
                <ShieldCheck className="h-5 w-5 text-ai-blue" />
                <h3 className="mt-6 text-xl font-semibold text-white">Workspace Delivery</h3>
                <p className="mt-4 text-sm leading-7 text-white/58">
                  Files, approvals, messages, invoices, and delivery notes remain organized around the actual service request.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:px-10 md:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <h2 className="max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                Pricing follows the nature of the responsibility.
              </h2>
            </div>
            <p className="max-w-3xl text-base leading-8 text-white/64 md:text-lg">
              A new build, an urgent repair, and an ongoing care plan do not carry the same type of risk. Sitemendr separates these pricing paths so the client can understand what is being judged before a proposal is formed.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {pricingPaths.map((path) => {
              const Icon = path.icon;

              return (
                <div key={path.title} className="bg-white/[0.025] p-6 ring-1 ring-white/10 md:p-7">
                  <Icon className="h-5 w-5 text-ai-blue" />
                  <h3 className="mt-7 text-xl font-semibold tracking-[-0.02em] text-white md:text-2xl">{path.title}</h3>
                  <p className="mt-5 text-sm leading-7 text-white/58">{path.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#05070a]">
        <Image
          src="https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=2200&h=1200&fit=crop&crop=center"
          alt=""
          fill
          unoptimized
          sizes="100vw"
          className="object-cover opacity-42 saturate-125"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,10,0.94)_0%,rgba(5,7,10,0.72)_45%,rgba(5,7,10,0.24)_100%)]" />
        <div className="relative mx-auto flex min-h-[480px] max-w-7xl items-center px-5 py-14 sm:px-6 md:min-h-[560px] md:px-10 md:py-16">
          <div className="max-w-3xl">
            <h2 className="break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              Start privately, then let the right service path become clear.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/66 md:text-lg">
              The workspace is where the request stops being a loose idea and becomes something that can be reviewed in context. Goals, references, access notes, files, questions, scope, and delivery decisions can sit in one place before the work begins.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap md:mt-10 md:gap-4">
              <ServiceAction href="/register" tone="light">
                Start a Workspace
              </ServiceAction>
              <ServiceAction href="/services/development">
                Review Development
              </ServiceAction>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ServiceAction({
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

function ImageStory({ src, className }: { src: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-white/10 ${className ?? ''}`}>
      <Image
        src={src}
        alt=""
        fill
        unoptimized
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.42),rgba(5,7,10,0.02))]" />
    </div>
  );
}
