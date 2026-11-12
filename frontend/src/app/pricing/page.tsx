import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  FileSearch,
  Gauge,
  HandCoins,
  Layers,
  PackageCheck,
  Palette,
  Plug,
  RefreshCw,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Wrench,
  X,
} from 'lucide-react';

const images = {
  desk: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1800&q=85',
  build: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1800&q=85',
  repair: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1800&q=85',
  maintenance: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1800&q=85',
  addons: 'https://images.unsplash.com/photo-1587440871875-191322ee64b0?auto=format&fit=crop&w=1800&q=85',
  commerce: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1800&q=85',
  payout: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1800&q=85',
  workspace: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=85',
};

const pricingPaths = [
  ['Build', 'From a fixed floor, or quoted after scope review', 'Websites, portals, dashboards, integrations, custom systems.'],
  ['Repair', 'Priced after diagnosis', 'Audits, recovery, bugs, broken flows, performance and security issues.'],
  ['Care', 'A plan you choose, billed on your rhythm', 'Monitoring, updates, backups, small fixes, support and reporting.'],
  ['Commerce', 'Discuss scope and availability', 'Store and dropshipping ideas; managed supplier, order, and seller payout systems are not available yet.'],
];

const buildFixedTiers = [
  {
    name: 'Starter',
    price: '$299',
    tagline: 'A basic site, done right, nothing extra to decide.',
    includes: ['Up to 5 pages', 'Contact and lead forms', 'Mobile-first build', 'Launch on a Sitemendr subdomain'],
  },
  {
    name: 'Core',
    price: '$699',
    tagline: 'More structure, more room to grow into.',
    includes: ['Up to 12 pages', 'Custom domain setup', 'Blog or resource section', 'Priority build queue'],
  },
];

const buildFactors = [
  'Business purpose and user journey',
  'Public pages, private areas, roles and dashboards',
  'Forms, payments, data, integrations and automations',
  'Content readiness, migration and launch support',
  'Ownership, self-hosted delivery and technical handoff',
];

const repairFlow = [
  ['Diagnosis', 'The site or system is reviewed before repair work is priced.'],
  ['Findings', 'Issues are explained clearly: what is broken, risky, slow, missing or recoverable.'],
  ['Agreement', 'The client approves the repair direction, urgency and work boundary.'],
  ['Payment', 'Repair begins after the agreed repair level is approved.'],
  ['Testing', 'The repaired work is checked, confirmed and optionally moved into care.'],
];

const careTiers = [
  { id: 'essential', name: 'Essential care', price: 'From $49', reason: 'You want the lights to stay on and nothing more.' },
  { id: 'operational', name: 'Operational care', price: 'From $149', reason: 'Your site is active and you want a hand keeping up with it.' },
  { id: 'managed', name: 'Managed care', price: 'From $299', reason: 'Your business runs through this site and it needs real supervision.' },
];

const careFeatures = [
  { label: 'Uptime and security monitoring', essential: true, operational: true, managed: true },
  { label: 'Core updates and backups', essential: true, operational: true, managed: true },
  { label: 'Small content corrections', essential: true, operational: true, managed: true },
  { label: 'Monthly reporting', essential: false, operational: true, managed: true },
  { label: 'Priority response time', essential: false, operational: true, managed: true },
  { label: 'Included support hours', essential: false, operational: true, managed: true },
  { label: 'Proactive performance reviews', essential: false, operational: false, managed: true },
  { label: 'Direct technical supervision', essential: false, operational: false, managed: true },
];

const careBillingRhythms = ['Monthly', 'Quarterly', 'Twice a year', 'Annually'];

const addonCategories = [
  { icon: <ShoppingBag className="h-5 w-5" />, name: 'Online store', text: 'Turn a site into a place people can actually buy from.' },
  { icon: <CalendarDays className="h-5 w-5" />, name: 'Booking and scheduling', text: 'Let clients reserve time with you directly from the site.' },
  { icon: <Palette className="h-5 w-5" />, name: 'New page or section', text: "A page you didn't need at launch, added cleanly." },
  { icon: <Plug className="h-5 w-5" />, name: 'Integrations', text: 'Connect tools you already use into the site.' },
  { icon: <Sparkles className="h-5 w-5" />, name: 'SEO toolkit', text: 'Structured for search, tracked, and reported on.' },
  { icon: <Layers className="h-5 w-5" />, name: 'Custom domain and email', text: 'Move off the subdomain onto your own name.' },
];

const dropshippingModes = [
  ['Store setup', 'A possible scope is planning and building a storefront. The required features, payment provider, and delivery setup must be agreed first.'],
  ['Selling your own products', 'A possible scope is presenting your products online. Product management, checkout, and order handling depend on the agreed project.'],
  ['Dropshipping', 'The Sitemendr dropshipping program is still being defined. Supplier access, fulfillment, and seller payouts are not available yet.'],
  ['Connecting an existing store', 'Connections to an existing site or store require a technical review. Availability and risks are confirmed before any changes are approved.'],
];

function BackgroundImage({ src, alt = '' }: { src: string; alt?: string }) {
  return (
    <>
      <Image src={src} alt={alt} fill className="object-cover brightness-[0.72] contrast-[1.08] saturate-[1.08]" sizes="100vw" priority={src === images.desk} />
      <div className="absolute inset-0 bg-[#05070a]/42" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,10,0.9),rgba(5,7,10,0.38)_48%,rgba(5,7,10,0.74))]" />
    </>
  );
}

function FeatureMark({ included }: { included: boolean }) {
  return included ? <Check className="h-4 w-4 text-expert-green" /> : <X className="h-4 w-4 text-white/24" />;
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <section className="relative min-h-[640px] overflow-hidden pt-24">
        <BackgroundImage src={images.desk} />
        <div className="relative z-10 mx-auto flex min-h-[560px] max-w-7xl flex-col justify-end px-4 pb-10 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <h1 className="mt-5 max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                    Transparent structures for routine builds and tailored engineering.
                </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/64">
                      Not every technical challenge fits cleanly into a standard pricing matrix. We deliver upfront, predictable costing for straightforward project scopes, and collaborative planning for custom-engineered systems that require deep business logic.
                </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/contact?intent=sales" className="inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-ai-blue hover:text-white">
                  Request a quote
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact?intent=sales" className="inline-flex items-center gap-2 border border-white/18 px-5 py-3 text-sm font-bold text-white/80 transition hover:border-white/40 hover:text-white">
                  <CalendarDays className="h-4 w-4" />
                  Talk with the team
                </Link>
              </div>
            </div>

            <div className="border-y border-white/14 py-5">
              <div className="grid gap-0 sm:grid-cols-2">
                {pricingPaths.map(([name, mode, detail]) => (
                  <div key={name} className="border-b border-white/10 py-5 sm:odd:border-r sm:odd:pr-5 sm:even:pl-5 [&:nth-last-child(-n+2)]:sm:border-b-0">
                    <p className="text-lg font-bold text-white">{name}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-ai-blue">{mode}</p>
                    <p className="mt-3 text-sm leading-6 text-white/48">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative min-h-[640px] overflow-hidden border-t border-white/10">
        <BackgroundImage src={images.build} />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-white/48">Build pricing</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl">Two ways to start a build.</h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/64">
            A straightforward site doesn&apos;t need a scoping call. A custom system does. Pick the path that matches what you&apos;re building.
          </p>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="border-y border-white/14 py-2">
              <div className="flex items-center gap-3 py-4">
                <Rocket className="h-5 w-5 text-expert-green" />
                <p className="text-sm font-bold uppercase tracking-[0.1em] text-expert-green">Starts at a fixed floor</p>
              </div>
              <div className="grid gap-0 sm:grid-cols-2 sm:divide-x sm:divide-white/10">
                {buildFixedTiers.map((tier) => (
                  <div key={tier.name} className="border-t border-white/10 py-6 sm:odd:pr-6 sm:even:pl-6">
                    <p className="text-lg font-bold text-white">{tier.name}</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-expert-green">{tier.price}<span className="ml-1 text-xs font-bold uppercase tracking-widest text-white/36">starting</span></p>
                    <p className="mt-3 text-sm leading-6 text-white/48">{tier.tagline}</p>
                    <ul className="mt-4 space-y-2">
                      {tier.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-white/64">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-expert-green" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-5">
                <Link href="/contact?intent=sales" className="inline-flex items-center gap-2 text-sm font-bold text-expert-green transition hover:text-white">
                  Request a quote <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="border-y border-white/14 py-2">
              <div className="flex items-center gap-3 py-4">
                <FileSearch className="h-5 w-5 text-ai-blue" />
                <p className="text-sm font-bold uppercase tracking-[0.1em] text-ai-blue">Pro &amp; custom — quoted after scope review</p>
              </div>
              <p className="border-t border-white/10 py-5 text-sm leading-7 text-white/64">
                Portals, dashboards, integrations, and anything with real business logic behind it get scoped properly first. A build is quoted by what the business needs the system to do:
              </p>
              <div className="border-t border-white/10">
                {buildFactors.map((factor, index) => (
                  <div key={factor} className="flex gap-4 border-b border-white/10 py-4 last:border-b-0">
                    <span className="text-sm font-bold text-ai-blue">{String(index + 1).padStart(2, '0')}</span>
                    <p className="text-sm leading-7 text-white/64">{factor}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-5">
                <Link href="/contact?intent=sales" className="inline-flex items-center gap-2 text-sm font-bold text-ai-blue transition hover:text-white">
                  Discuss your project <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative min-h-[640px] overflow-hidden border-t border-white/10">
        <BackgroundImage src={images.repair} />
        <div className="relative z-10 mx-auto grid min-h-[640px] max-w-7xl content-center gap-10 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <Wrench className="h-8 w-8 text-amber-300" />
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.1em] text-white/48">Repair pricing</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">Repair starts with diagnosis, not guessing.</h2>
            <p className="mt-6 text-base leading-8 text-white/64">
              Broken pages, slow stores, failed installs, security problems and unfinished systems are reviewed first. Pricing becomes clearer after the issue is understood.
            </p>
          </div>
          <div className="grid gap-0 border-y border-white/14 py-2">
            {repairFlow.map(([title, text], index) => (
              <div key={title} className="grid gap-4 border-b border-white/10 py-5 last:border-b-0 sm:grid-cols-[90px_1fr]">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-amber-300">{String(index + 1).padStart(2, '0')} {title}</p>
                <p className="text-sm leading-7 text-white/64">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative min-h-[640px] overflow-hidden border-t border-white/10">
        <BackgroundImage src={images.maintenance} />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <RefreshCw className="h-8 w-8 text-expert-green" />
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.1em] text-white/48">Ongoing care</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl">Choose the level of care your site actually needs.</h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/64">
            Care is recurring, but it doesn&apos;t have to be monthly. Pick a plan below, then choose the billing rhythm that fits how you budget.
          </p>

          <div className="mt-10 overflow-x-auto border-y border-white/14">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="w-64 border-b border-white/10 py-5 pr-4 text-xs font-bold uppercase tracking-[0.1em] text-white/36">What&apos;s included</th>
                  {careTiers.map((tier) => (
                    <th key={tier.id} className="border-b border-white/10 px-4 py-5 align-bottom">
                      <p className="text-base font-bold text-white">{tier.name}</p>
                      <p className="mt-2 text-xl font-bold tracking-tight text-expert-green">{tier.price}</p>
                      <p className="mt-3 max-w-[16rem] text-xs font-semibold leading-5 text-white/48">{tier.reason}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {careFeatures.map((row) => (
                  <tr key={row.label} className="border-b border-white/8">
                    <td className="py-4 pr-4 text-sm text-white/64">{row.label}</td>
                    <td className="px-4 py-4"><FeatureMark included={row.essential} /></td>
                    <td className="px-4 py-4"><FeatureMark included={row.operational} /></td>
                    <td className="px-4 py-4"><FeatureMark included={row.managed} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 border-y border-white/14 py-5">
            <Gauge className="h-5 w-5 shrink-0 text-expert-green" />
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-white/36">Billing rhythm, your choice:</p>
            <div className="flex flex-wrap gap-2">
              {careBillingRhythms.map((rhythm) => (
                <span key={rhythm} className="border border-white/14 px-3 py-1.5 text-xs font-bold text-white/64">{rhythm}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative min-h-[640px] overflow-hidden border-t border-white/10">
        <BackgroundImage src={images.addons} />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <Plug className="h-8 w-8 text-ai-blue" />
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.1em] text-white/48">Add-ons</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl">Already have a site with us? Add to it, without starting over.</h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/64">
            Add-ons are optional improvements for a site after its initial delivery. The catalog and safe installation flow are still being defined, so these examples are not available for self-service purchase yet. We can discuss a specific change and confirm its scope before any work is agreed.
          </p>

          <div className="mt-10 grid gap-px overflow-hidden bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {addonCategories.map((addon) => (
              <div key={addon.name} className="bg-[#05070a]/72 p-6">
                <span className="text-ai-blue">{addon.icon}</span>
                <p className="mt-5 text-base font-bold text-white">{addon.name}</p>
                <p className="mt-2 text-sm leading-6 text-white/48">{addon.text}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm font-semibold text-white/52">Examples only. Availability, compatibility, price, and any recurring costs must be confirmed with Sitemendr before work begins.</p>
        </div>
      </section>

      <section className="relative min-h-[640px] overflow-hidden border-t border-white/10">
        <BackgroundImage src={images.commerce} />
        <div className="relative z-10 mx-auto grid min-h-[640px] max-w-7xl content-center gap-10 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <Store className="h-8 w-8 text-ai-blue" />
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.1em] text-white/48">Commerce and dropshipping</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">Commerce pricing depends on access, setup and who owns the selling environment.</h2>
            <p className="mt-6 text-base leading-8 text-white/64">
              Sitemendr is planning commerce and dropshipping services. The supplier, order, payment, delivery, and support systems are not yet available as a managed Sitemendr program. Contact us to discuss a store project; we will confirm what can be delivered before quoting it.
            </p>
          </div>
          <div className="grid gap-8">
            <div className="border-y border-white/14 py-4">
              {dropshippingModes.map(([title, text]) => (
                <div key={title} className="grid gap-3 border-b border-white/10 py-4 last:border-b-0 sm:grid-cols-[170px_1fr]">
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="text-sm leading-7 text-white/64">{text}</p>
                </div>
              ))}
            </div>
            <div className="border-y border-white/14 py-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-white/36">What to expect</p>
              <p className="text-sm leading-7 text-white/64">A store or dropshipping request needs a confirmed scope covering products, suppliers, checkout, fulfillment, customer support, and ownership. We will explain which parts are available for your project before asking you to approve or pay.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative min-h-[640px] overflow-hidden border-t border-white/10">
        <BackgroundImage src={images.payout} />
        <div className="relative z-10 mx-auto grid min-h-[640px] max-w-7xl content-end gap-10 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <HandCoins className="h-8 w-8 text-amber-300" />
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.1em] text-white/48">Seller payouts</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">Seller payouts are not available yet.</h2>
            <p className="mt-6 text-base leading-8 text-white/64">
              Sitemendr has not launched the seller account, earnings, or payout service. No payout dates, fees, or seller earnings are currently promised.
            </p>
          </div>
          <div className="border-y border-white/14 py-4">
            <p className="py-4 text-sm leading-7 text-white/64">If you are exploring a store or dropshipping idea, contact the team to discuss the project. We will be clear about what can be built now and what is still being developed.</p>
          </div>
        </div>
      </section>

      <section className="relative min-h-[640px] overflow-hidden border-t border-white/10">
        <BackgroundImage src={images.workspace} />
        <div className="relative z-10 mx-auto grid min-h-[640px] max-w-7xl content-center gap-10 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <FileSearch className="h-8 w-8 text-ai-blue" />
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.1em] text-white/48">Before payment</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">Agree on the work before a project record begins.</h2>
            <p className="mt-6 text-base leading-8 text-white/64">
              Start by contacting Sitemendr. We clarify the service, scope, and price with you. After you approve the proposal, the project record keeps its messages, payment details, files, and delivery updates together.
            </p>
          </div>
          <div className="grid gap-0 border-y border-white/14 py-3 sm:grid-cols-2">
            {[
              ['Request', 'Contact Sitemendr and tell us what you need.'],
              ['Scope', 'Sitemendr places the request into the right pricing path.'],
              ['Approval', 'The quote, responsibilities and payment terms are made visible.'],
              ['Delivery', 'Work, updates, files, decisions and support remain attached to the workspace.'],
            ].map(([title, text]) => (
              <div key={title} className="border-b border-white/10 py-5 sm:odd:border-r sm:odd:pr-5 sm:even:pl-5 [&:nth-last-child(-n+2)]:sm:border-b-0">
                <p className="font-bold text-white">{title}</p>
                <p className="mt-2 text-sm leading-7 text-white/48">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <div className="grid gap-6 border-y border-white/14 py-10 lg:grid-cols-2">
            <Link href="/contact?intent=sales" className="group flex flex-col justify-between border border-white/14 bg-white/[0.02] p-8 transition hover:border-expert-green/40 hover:bg-expert-green/[0.04]">
              <div>
                <Rocket className="h-6 w-6 text-expert-green" />
                <p className="mt-5 text-xl font-bold text-white">Discuss a project</p>
                <p className="mt-3 text-sm leading-6 text-white/48">Tell us what you need. We will clarify the scope, availability, and price before you decide.</p>
              </div>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-expert-green transition group-hover:gap-3">
                Contact Sitemendr <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link href="/contact?intent=sales" className="group flex flex-col justify-between border border-white/14 bg-white/[0.02] p-8 transition hover:border-ai-blue/40 hover:bg-ai-blue/[0.04]">
              <div>
                <CalendarDays className="h-6 w-6 text-ai-blue" />
                <p className="mt-5 text-xl font-bold text-white">Ask the team</p>
                <p className="mt-3 text-sm leading-6 text-white/48">Use the contact form for custom builds, repairs, or a question about any service.</p>
              </div>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-ai-blue transition group-hover:gap-3">
                Send a message <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-6 pt-8">
            <Link href="/legal" className="inline-flex items-center gap-2 text-sm font-semibold text-white/48 transition hover:text-white">
              <ShieldCheck className="h-4 w-4" />
              View policy center
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-white/48 transition hover:text-white">
              <PackageCheck className="h-4 w-4" />
              Review services
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-white/48 transition hover:text-white">
              <CreditCard className="h-4 w-4" />
              Contact sales
            </Link>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/36">
              Custom work is confirmed after scope, diagnosis or program approval.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
