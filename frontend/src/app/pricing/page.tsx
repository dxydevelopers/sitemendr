import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileSearch,
  Gauge,
  HandCoins,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Store,
  Wrench,
} from 'lucide-react';

const images = {
  desk: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1800&q=85',
  build: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1800&q=85',
  repair: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1800&q=85',
  maintenance: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1800&q=85',
  commerce: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1800&q=85',
  payout: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1800&q=85',
  workspace: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=85',
};

const pricingPaths = [
  ['Build', 'Quoted after scope', 'Websites, portals, dashboards, integrations, custom systems.'],
  ['Repair', 'Priced after diagnosis', 'Audits, recovery, bugs, broken flows, performance and security issues.'],
  ['Maintenance', 'Care level selected', 'Monthly monitoring, updates, backups, small fixes, support and reporting.'],
  ['Commerce', 'Access or setup path', 'Stores, product structure, checkout, dropshipping access and connections.'],
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
  ['Testing', 'The repaired work is checked, confirmed and optionally moved into maintenance.'],
];

const maintenanceLevels = [
  ['Essential care', 'Updates, backup checks, basic monitoring and small corrections.'],
  ['Operational care', 'More regular support time, content assistance, reporting and priority response.'],
  ['Managed care', 'Closer technical supervision for active websites, stores and business systems.'],
];

const dropshippingModes = [
  ['Free product access', 'A seller uses approved Sitemendr product catalogs and follows the Sitemendr-managed order, payment and fulfillment flow.'],
  ['Paid store creation', 'Sitemendr creates, brands, structures or prepares the seller store for product presentation, checkout and launch.'],
  ['Paid store connection', 'An existing store or website is connected into Sitemendr product, order, payment and tracking operations.'],
  ['Own product selling', 'If the seller wants to use a Sitemendr-built store for their own products, setup and store work are priced separately.'],
];

const commerceFlow = [
  'Seller chooses eligible products from Sitemendr-connected catalogs.',
  'Seller sets the final selling price above the Sitemendr base product cost.',
  'Sitemendr handles buyer payment and order coordination.',
  'Supply partners confirm stock, shipping and fulfillment updates through Sitemendr.',
  'Buyer support, delivery issues and disputes are routed through Sitemendr with partner coordination.',
];

const payoutRules = [
  'Seller profit is the difference between the final selling price and the Sitemendr base product cost, after applicable fees.',
  'Payouts are sent on the first Friday of every month.',
  'Sales made within the final seven days before payout day move to the next payout cycle.',
  'A sale becomes payout-eligible after delivery and after its refund, return or complaint window has cleared.',
  'Transaction fees and minimum payout rules apply.',
];

function BackgroundImage({ src, alt = '' }: { src: string; alt?: string }) {
  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover brightness-[0.72] contrast-[1.08] saturate-[1.08]"
        sizes="100vw"
        priority={src === images.desk}
      />
      <div className="absolute inset-0 bg-[#05070a]/42" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,10,0.9),rgba(5,7,10,0.38)_48%,rgba(5,7,10,0.74))]" />
    </>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <section className="relative min-h-[760px] overflow-hidden pt-24">
        <BackgroundImage src={images.desk} />
        <div className="relative z-10 mx-auto flex min-h-[680px] max-w-7xl flex-col justify-end px-4 pb-10 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/48">Pricing desk</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                Pricing begins with the work, not with a public package.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/62">
                Sitemendr does not force every request into the same price table. A new build, a damaged site, a monthly care plan, and a dropshipping store all carry different responsibilities, risks and operating paths.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-ai-blue hover:text-white">
                  Create workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact?intent=sales" className="inline-flex items-center gap-2 border border-white/18 px-5 py-3 text-sm font-bold text-white/80 transition hover:border-white/40 hover:text-white">
                  Discuss pricing path
                </Link>
              </div>
            </div>

            <div className="border-y border-white/14 py-5">
              <div className="grid gap-0 sm:grid-cols-2">
                {pricingPaths.map(([name, mode, detail]) => (
                  <div key={name} className="border-b border-white/10 py-5 sm:odd:border-r sm:odd:pr-5 sm:even:pl-5 [&:nth-last-child(-n+2)]:sm:border-b-0">
                    <p className="text-lg font-black text-white">{name}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-ai-blue">{mode}</p>
                    <p className="mt-3 text-sm leading-6 text-white/54">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative min-h-[720px] overflow-hidden border-t border-white/10">
        <BackgroundImage src={images.build} />
        <div className="relative z-10 mx-auto grid min-h-[720px] max-w-7xl content-end gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/44">Build pricing</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-white sm:text-4xl">A build is quoted by what the business needs the system to do.</h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">
              A business website is not priced the same way as a client portal, a dashboard, a booking flow, an integration or a self-hosted handoff. The quote follows the responsibility carried by the work.
            </p>
          </div>
          <div className="border-y border-white/14 py-5">
            {buildFactors.map((factor, index) => (
              <div key={factor} className="flex gap-4 border-b border-white/10 py-4 last:border-b-0">
                <span className="text-sm font-black text-ai-blue">{String(index + 1).padStart(2, '0')}</span>
                <p className="text-sm leading-7 text-white/66">{factor}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative min-h-[760px] overflow-hidden border-t border-white/10">
        <BackgroundImage src={images.repair} />
        <div className="relative z-10 mx-auto grid min-h-[760px] max-w-7xl content-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <Wrench className="h-8 w-8 text-amber-300" />
            <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-white/44">Repair pricing</p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">Repair starts with diagnosis, not guessing.</h2>
            <p className="mt-6 text-base leading-8 text-white/60">
              Broken pages, slow stores, failed installs, security problems and unfinished systems are reviewed first. Pricing becomes clearer after the issue is understood.
            </p>
          </div>
          <div className="grid gap-0 border-y border-white/14 py-2">
            {repairFlow.map(([title, text], index) => (
              <div key={title} className="grid gap-4 border-b border-white/10 py-5 last:border-b-0 sm:grid-cols-[90px_1fr]">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">{String(index + 1).padStart(2, '0')} {title}</p>
                <p className="text-sm leading-7 text-white/62">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative min-h-[720px] overflow-hidden border-t border-white/10">
        <BackgroundImage src={images.maintenance} />
        <div className="relative z-10 mx-auto grid min-h-[720px] max-w-7xl content-end gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <RefreshCw className="h-8 w-8 text-expert-green" />
            <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-white/44">Maintenance plans</p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">Monthly care is selected by responsibility level.</h2>
            <p className="mt-6 text-base leading-8 text-white/60">
              Maintenance is recurring, so it can be planned more clearly. The care level depends on how active the website, store or system is, and how much support it needs after launch.
            </p>
          </div>
          <div className="border-y border-white/14 py-4">
            {maintenanceLevels.map(([title, text]) => (
              <div key={title} className="flex gap-4 border-b border-white/10 py-5 last:border-b-0">
                <Gauge className="mt-1 h-5 w-5 shrink-0 text-expert-green" />
                <div>
                  <p className="font-bold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-white/58">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative min-h-[860px] overflow-hidden border-t border-white/10">
        <BackgroundImage src={images.commerce} />
        <div className="relative z-10 mx-auto grid min-h-[860px] max-w-7xl content-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <Store className="h-8 w-8 text-ai-blue" />
            <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-white/44">Commerce and dropshipping</p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">Commerce pricing depends on access, setup and who owns the selling environment.</h2>
            <p className="mt-6 text-base leading-8 text-white/60">
              Sitemendr dropshipping gives sellers access to approved product catalogs through Sitemendr-managed shops and connected commerce partners. The seller does not manage supplier relationships directly.
            </p>
          </div>
          <div className="grid gap-8">
            <div className="border-y border-white/14 py-4">
              {dropshippingModes.map(([title, text]) => (
                <div key={title} className="grid gap-3 border-b border-white/10 py-4 last:border-b-0 sm:grid-cols-[170px_1fr]">
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="text-sm leading-7 text-white/58">{text}</p>
                </div>
              ))}
            </div>
            <div className="border-y border-white/14 py-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-white/42">Managed order flow</p>
              {commerceFlow.map((item, index) => (
                <div key={item} className="flex gap-4 border-b border-white/10 py-3 last:border-b-0">
                  <span className="text-xs font-black text-ai-blue">{index + 1}</span>
                  <p className="text-sm leading-6 text-white/58">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative min-h-[760px] overflow-hidden border-t border-white/10">
        <BackgroundImage src={images.payout} />
        <div className="relative z-10 mx-auto grid min-h-[760px] max-w-7xl content-end gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <HandCoins className="h-8 w-8 text-amber-300" />
            <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-white/44">Seller payouts</p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">Dropshipping profit is tracked, cleared and paid on schedule.</h2>
            <p className="mt-6 text-base leading-8 text-white/60">
              Sellers see store activity, orders, pending earnings, approved earnings, analytics, store connections and support status inside their dashboard.
            </p>
          </div>
          <div className="border-y border-white/14 py-4">
            {payoutRules.map((rule) => (
              <div key={rule} className="flex gap-4 border-b border-white/10 py-4 last:border-b-0">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-amber-300" />
                <p className="text-sm leading-7 text-white/60">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative min-h-[720px] overflow-hidden border-t border-white/10">
        <BackgroundImage src={images.workspace} />
        <div className="relative z-10 mx-auto grid min-h-[720px] max-w-7xl content-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <FileSearch className="h-8 w-8 text-ai-blue" />
            <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-white/44">Before payment</p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">The quote lives inside a workspace record.</h2>
            <p className="mt-6 text-base leading-8 text-white/60">
              A workspace keeps the request, scope, quote, payment context, delivery updates, files, messages and support trail connected. Pricing becomes part of the delivery record instead of a loose conversation.
            </p>
          </div>
          <div className="grid gap-0 border-y border-white/14 py-3 sm:grid-cols-2">
            {[
              ['Request', 'The client explains what needs to be built, fixed, maintained or connected.'],
              ['Scope', 'Sitemendr places the request into the right pricing path.'],
              ['Approval', 'The quote, responsibilities and payment terms are made visible.'],
              ['Delivery', 'Work, updates, files, decisions and support remain attached to the workspace.'],
            ].map(([title, text]) => (
              <div key={title} className="border-b border-white/10 py-5 sm:odd:border-r sm:odd:pr-5 sm:even:pl-5 [&:nth-last-child(-n+2)]:sm:border-b-0">
                <p className="font-bold text-white">{title}</p>
                <p className="mt-2 text-sm leading-7 text-white/56">{text}</p>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 flex flex-wrap gap-3 border-t border-white/10 pt-8">
            <Link href="/register" className="inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-ai-blue hover:text-white">
              Start pricing path
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/legal" className="inline-flex items-center gap-2 border border-white/18 px-5 py-3 text-sm font-bold text-white/76 transition hover:border-white/40 hover:text-white">
              <ShieldCheck className="h-4 w-4" />
              View policy center
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 border border-white/18 px-5 py-3 text-sm font-bold text-white/76 transition hover:border-white/40 hover:text-white">
              <PackageCheck className="h-4 w-4" />
              Review services
            </Link>
            <Link href="/contact?intent=sales" className="inline-flex items-center gap-2 border border-white/18 px-5 py-3 text-sm font-bold text-white/76 transition hover:border-white/40 hover:text-white">
              <CreditCard className="h-4 w-4" />
              Contact sales
            </Link>
            <span className="inline-flex items-center gap-2 px-1 py-3 text-sm font-semibold text-white/42">
              <CalendarDays className="h-4 w-4" />
              Exact numbers are confirmed after scope, diagnosis or program approval.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
