import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowRight, Check, Code2, Gauge, RefreshCw, ShoppingBag, Wrench } from 'lucide-react';
import PublishedWork from '@/components/home/PublishedWork';

const services = [
  {
    number: '01',
    title: 'Websites & custom platforms',
    description: 'We plan, design, and build business websites, portals, and custom web tools around what your organization needs people to do.',
    includes: 'New digital products, from first brief through review and launch.',
    href: '/contact?service=Website%20or%20platform%20build',
    action: 'Discuss a website or platform',
    image: '/home/website-build.svg',
    imageAlt: 'Illustration of a custom business website shown in a browser window',
    icon: Code2,
    tone: 'text-ai-blue',
  },
  {
    number: '02',
    title: 'Website repair & recovery',
    description: 'We investigate faults in an existing website, identify what is affected, and agree on a repair plan before making changes.',
    includes: 'Broken pages, errors, compromised or inaccessible sites, and other technical faults.',
    href: '/contact?service=Repair%20or%20recovery',
    action: 'Discuss a repair',
    image: '/home/site-repair.svg',
    imageAlt: 'Illustration of a website code fault being inspected and verified',
    icon: Wrench,
    tone: 'text-expert-green',
  },
  {
    number: '03',
    title: 'Performance improvement',
    description: 'We review loading speed, availability, and technical performance to identify practical improvements for an existing site.',
    includes: 'Performance assessment, prioritized recommendations, and agreed implementation work.',
    href: '/contact?service=Performance%20improvement',
    action: 'Request a performance review',
    image: '/home/performance.svg',
    imageAlt: 'Illustration of a website response-time chart and performance review',
    icon: Gauge,
    tone: 'text-ai-blue',
  },
  {
    number: '04',
    title: 'Ongoing website care',
    description: 'We help keep an existing website maintained after launch through a separately scoped support or maintenance arrangement.',
    includes: 'Planned updates, technical upkeep, and follow-up support within the agreed scope.',
    href: '/contact?service=Ongoing%20maintenance',
    action: 'Discuss ongoing care',
    image: '/home/website-care.svg',
    imageAlt: 'Illustration of planned website updates, routine checks, and follow-up support',
    icon: RefreshCw,
    tone: 'text-expert-green',
  },
  {
    number: '05',
    title: 'Online stores',
    description: 'We build or improve online storefronts so customers can understand products, place orders, and complete checkout.',
    includes: 'Store structure, product presentation, checkout, and the operating requirements discussed for your business.',
    href: '/contact?service=Online%20store',
    action: 'Discuss an online store',
    image: '/home/online-store.svg',
    imageAlt: 'Illustration of an online storefront with product presentation and a shopping flow',
    icon: ShoppingBag,
    tone: 'text-ai-blue',
  },
  {
    number: '06',
    title: 'Dropshipping',
    description: 'We help plan a store where a supplier fulfills orders, including the product offer, supplier expectations, delivery promise, and order flow.',
    includes: 'The work is about the business and fulfillment model as well as the storefront.',
    href: '/contact?service=Dropshipping%20setup',
    action: 'Discuss dropshipping',
    image: '/home/dropshipping.svg',
    imageAlt: 'Diagram showing a customer order passing through a store to a supplier for fulfillment',
    icon: ShoppingBag,
    tone: 'text-amber-300',
  },
  {
    number: '07',
    title: 'Affiliate commerce',
    description: 'We help create a commerce experience that refers customers to third-party sellers and earns commission when qualifying purchases are made.',
    includes: 'Offer selection, product pages, referral links, and a clear customer journey.',
    href: '/contact?service=Affiliate%20commerce',
    action: 'Discuss affiliate commerce',
    image: '/home/affiliate-commerce.svg',
    imageAlt: 'Diagram showing content referring a buyer through a tracked link to a seller site',
    icon: ArrowRight,
    tone: 'text-amber-300',
  },
];

const steps = [
  {
    title: 'Tell us what you need',
    copy: 'Use the contact form to describe the goal, the website or business involved, and any important constraints. You can ask a question before deciding to proceed.',
  },
  {
    title: 'We review and clarify',
    copy: 'Sitemendr reviews the request and follows up for the details needed to understand the work. For existing sites, that may include the current setup and the issue you are seeing.',
  },
  {
    title: 'Review the proposed work',
    copy: 'Before work begins, you receive the proposed scope, price, and applicable payment terms to review. Ask questions or request changes before agreeing.',
  },
  {
    title: 'Approve and begin',
    copy: 'Work starts after you accept the agreed plan and complete any required initial payment. The specific milestones depend on the service and proposal.',
  },
  {
    title: 'Review progress and handoff',
    copy: 'Sitemendr shares progress and agreed review points. At completion, the work is handed over under the terms set for your project.',
  },
];

const standards = [
  ['Scope before action', 'The work and its boundaries are written down before the project starts.'],
  ['Price before commitment', 'You can review the proposed cost and payment terms before accepting.'],
  ['Service-specific planning', 'A new build, a repair, a performance review, and a store each need a different plan.'],
  ['Clear communication', 'Questions, decisions, and progress updates stay tied to the work being done.'],
];

const faqs = [
  {
    question: 'Can Sitemendr work on a website I already have?',
    answer: 'Yes. You can request repair, recovery, performance improvement, or ongoing care for an existing site. The team reviews the site and request before confirming what can be done and at what cost.',
  },
  {
    question: 'When does paid work begin?',
    answer: 'After you have reviewed and accepted the proposed scope, price, and payment terms, and completed any required initial payment.',
  },
  {
    question: 'How are dropshipping and affiliate commerce different?',
    answer: 'With dropshipping, your store sells products and a supplier fulfills orders. With affiliate commerce, your site refers customers to another seller and may earn commission on qualifying purchases.',
  },
  {
    question: 'Do I have to choose a service before contacting you?',
    answer: 'No. Describe what you are trying to achieve. Sitemendr can clarify which service fits before you agree to any work.',
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#05070a] text-white">
      <section className="relative border-b border-white/10 pt-24 md:pt-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_76%_34%,rgba(0,102,255,0.2),transparent_42%),linear-gradient(115deg,transparent_48%,rgba(16,185,129,0.06))]" />
        <div className="relative mx-auto grid max-w-7xl gap-7 px-5 pb-4 pt-2 sm:px-8 sm:pb-5 md:gap-9 md:pb-6 lg:grid-cols-[0.94fr_1.06fr] lg:items-center lg:gap-7 lg:px-12 lg:pb-6 lg:pt-0">
          <div className="relative z-10 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ai-blue sm:text-xs">Digital work, done with a clear plan</p>
            <h1 className="mt-4 max-w-2xl font-[var(--font-space-grotesk)] text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.035em] sm:mt-5 sm:text-4xl md:text-[2.65rem] md:leading-[1.06] lg:text-[2.625rem]">
              Websites and online commerce, built and supported by Sitemendr.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-white/68 sm:mt-6 sm:text-base md:leading-7">
              We build custom websites and platforms, repair existing sites, improve site performance, provide ongoing care, and help businesses set up online stores, dropshipping, and affiliate commerce. Tell us what you need; we will clarify the work and its cost before you decide.
            </p>
            <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row sm:mt-7">
              <Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-3 bg-white px-5 py-3.5 text-sm font-semibold text-[#05070a] transition hover:bg-ai-blue hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ai-blue sm:px-6">
                Discuss your project <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#services" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/16 px-5 py-3.5 text-sm font-medium text-white/80 transition hover:border-white/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ai-blue sm:px-6">
                See what we do <ArrowDown className="h-4 w-4" />
              </a>
            </div>
          </div>

          <figure className="relative mx-auto aspect-[1.25/1] w-full max-w-[620px] lg:aspect-[1.12/1]" aria-label="Illustrated examples of performance improvement, ongoing website care, and affiliate commerce">
            <div aria-hidden="true" className="absolute inset-[5%_2%_7%_8%] bg-[radial-gradient(ellipse_at_48%_48%,rgba(48,133,216,0.28),transparent_68%)]" />
            <div className="absolute left-[7%] top-[4%] aspect-[16/9] w-[86%] overflow-hidden border border-white/25 bg-[#142A3D] shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
              <Image src="/home/performance.svg" alt="A website performance review visualizing response time and improvement areas" fill priority sizes="(min-width: 1024px) 43vw, (min-width: 640px) 80vw, 100vw" className="object-cover" />
            </div>
            <div className="absolute bottom-[15%] left-[0%] aspect-[16/9] w-[53%] overflow-hidden border border-white/30 bg-[#173C43] shadow-[0_18px_44px_rgba(0,0,0,0.46)]">
              <Image src="/home/website-care.svg" alt="A planned maintenance flow with updates, routine checks, and follow-up support" fill sizes="(min-width: 1024px) 28vw, 50vw" className="object-cover" />
            </div>
            <div className="absolute bottom-[3%] right-[0%] aspect-[16/9] w-[50%] overflow-hidden border border-white/30 bg-[#1B3F67] shadow-[0_18px_44px_rgba(0,0,0,0.46)]">
              <Image src="/home/affiliate-commerce.svg" alt="An affiliate commerce path from published content through a tracked referral to a seller" fill sizes="(min-width: 1024px) 26vw, 48vw" className="object-cover" />
            </div>
            <figcaption className="absolute bottom-0 left-[4%] hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45 xl:block">Build / Repair / Commerce</figcaption>
          </figure>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 border-b border-white/10 bg-[#080b10]">
        <div className="mx-auto max-w-7xl px-5 pb-10 pt-6 sm:px-8 md:pb-14 md:pt-8 lg:px-12">
          <div className="grid gap-5 border-b border-white/12 pb-6 md:grid-cols-[0.75fr_1.25fr] md:items-end md:pb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-ai-blue">Services</p>
              <h2 className="mt-4 font-[var(--font-space-grotesk)] text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Choose the work you need.</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-white/58 md:ml-auto md:text-base">
              Each service solves a different problem. If you are unsure which one fits, describe your situation and Sitemendr will help clarify it before you commit.
            </p>
          </div>

          <div className="divide-y divide-white/10">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article key={service.number} className="grid gap-x-6 gap-y-5 py-6 sm:py-7 md:grid-cols-[52px_minmax(0,1fr)] md:gap-x-8 xl:grid-cols-[56px_minmax(0,1.05fr)_minmax(280px,0.95fr)] xl:items-center xl:gap-x-10 xl:py-8">
                  <div className="flex items-center gap-3 md:col-span-2 xl:col-span-1 xl:block xl:self-start">
                    <span className="font-mono text-xs tracking-[0.12em] text-white/36">{service.number}</span>
                    <Icon aria-hidden="true" className={`h-5 w-5 ${service.tone} xl:mt-5`} />
                  </div>
                  <div className="md:col-start-2 xl:col-start-2">
                    <h3 className="font-[var(--font-space-grotesk)] text-xl font-semibold leading-tight tracking-[-0.025em] sm:text-2xl">{service.title}</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/66">{service.description}</p>
                    <div className="mt-4 border-l border-white/14 pl-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">What this covers</p>
                      <p className="mt-1.5 max-w-xl text-sm leading-6 text-white/54">{service.includes}</p>
                    </div>
                    <Link href={service.href} className="group mt-5 inline-flex min-h-10 items-center gap-2 border-b border-white/18 pb-1 text-sm font-semibold text-white transition hover:border-ai-blue hover:text-ai-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ai-blue">
                      {service.action}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                  <figure className="relative aspect-[16/9] overflow-hidden border border-white/10 bg-[#0a1118] md:col-start-2 xl:col-start-3">
                    <Image src={service.image} alt={service.imageAlt} fill sizes="(min-width: 1024px) 34vw, (min-width: 768px) 80vw, 100vw" unoptimized className="object-cover transition duration-500 hover:scale-[1.015]" />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(4,8,12,0.04),transparent_50%,rgba(4,8,12,0.16))]" />
                  </figure>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="process" className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 md:py-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 lg:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-expert-green">What happens next</p>
            <h2 className="mt-4 max-w-xl font-[var(--font-space-grotesk)] text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">A clear decision before the work begins.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/58 md:text-base">
              The exact steps depend on the service. This is the usual route from your first message to agreed work and handoff.
            </p>
          </div>
          <ol className="divide-y divide-white/10 border-t border-white/10">
            {steps.map((step, index) => (
              <li key={step.title} className="grid gap-3 py-4 sm:grid-cols-[56px_1fr] sm:gap-5 md:py-5">
                <span className="font-mono text-xs tracking-[0.12em] text-ai-blue">0{index + 1}</span>
                <div>
                  <h3 className="font-[var(--font-space-grotesk)] text-lg font-semibold sm:text-xl">{step.title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-white/58">{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <PublishedWork />

      <section className="border-y border-white/10 bg-[#080b10]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 md:py-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 lg:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-ai-blue">How we work</p>
            <h2 className="mt-4 max-w-md font-[var(--font-space-grotesk)] text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">Know what you are agreeing to.</h2>
          </div>
          <ul className="divide-y divide-white/10 border-t border-white/10">
            {standards.map(([title, copy]) => (
              <li key={title} className="grid gap-3 py-4 sm:grid-cols-[28px_1fr] sm:gap-5">
                <Check aria-hidden="true" className="mt-1 h-4 w-4 text-expert-green" />
                <div>
                  <h3 className="text-base font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/56">{copy}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="questions" className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 md:py-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 lg:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-white/42">Questions</p>
            <h2 className="mt-4 font-[var(--font-space-grotesk)] text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Before you get in touch.</h2>
          </div>
          <div className="divide-y divide-white/10 border-t border-white/10">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-5 text-base font-semibold marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ai-blue">
                  {faq.question}
                  <span aria-hidden="true" className="text-xl font-normal leading-5 text-ai-blue transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 max-w-3xl pr-8 text-sm leading-7 text-white/58">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_78%_50%,rgba(0,102,255,0.16),transparent_42%)]" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-7 px-5 py-10 sm:px-8 md:flex-row md:items-end md:justify-between md:py-14 lg:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-ai-blue">Start with a conversation</p>
            <h2 className="mt-4 max-w-3xl font-[var(--font-space-grotesk)] text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl">Tell us what you want to build or improve.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58 md:text-base">Share the situation. We will help clarify the right service, scope, and next step.</p>
          </div>
          <Link href="/contact" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 bg-white px-6 py-3.5 text-sm font-semibold text-[#05070a] transition hover:bg-ai-blue hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ai-blue">
            Contact Sitemendr <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
