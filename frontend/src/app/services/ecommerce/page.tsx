import Image from 'next/image';
import Link from 'next/link';
import { Space_Grotesk } from 'next/font/google';
import {
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  ChartNoAxesCombined,
  ClipboardCheck,
  CreditCard,
  LifeBuoy,
  Megaphone,
  PackageCheck,
  PackageSearch,
  ReceiptText,
  SearchCheck,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const heroImages = [
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1300&h=950&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=1300&h=950&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1100&h=850&fit=crop&crop=center',
];

const commerceFoundations = [
  {
    title: 'The storefront must help the buyer understand the offer before asking them to trust it.',
    body: 'A store is not only a grid of products. It needs hierarchy, collections, product pages, proof, navigation, policies, and a visual rhythm that makes the business feel credible before the customer reaches checkout.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1500&h=1100&fit=crop&crop=center',
    icon: Store,
  },
  {
    title: 'Dropshipping needs an operating route, not only attractive products.',
    body: 'The work has to clarify product direction, supplier expectations, price logic, delivery promise, order handling, and customer support. A dropshipping launch becomes stronger when the business understands the movement behind the storefront.',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1500&h=1100&fit=crop&crop=center',
    icon: Boxes,
  },
];

const checkoutSignals = [
  'Cart and checkout flow that does not make the buyer hesitate',
  'Payment readiness, confirmation messages, and recovery paths',
  'Trust signals placed where decisions are actually made',
  'Clear policies for delivery, returns, support, and expectations',
];

const operations = [
  {
    title: 'Product board',
    copy: 'Products, collections, supplier notes, pricing ideas, and readiness decisions stay visible.',
    icon: PackageSearch,
  },
  {
    title: 'Order movement',
    copy: 'The path from purchase to fulfillment is explained before the store is treated as ready.',
    icon: Truck,
  },
  {
    title: 'Customer care',
    copy: 'Support language, delivery concerns, and post-purchase questions are prepared early.',
    icon: LifeBuoy,
  },
  {
    title: 'Launch record',
    copy: 'Campaign notes, assets, approvals, checkout details, and handoff material remain organized.',
    icon: ClipboardCheck,
  },
];

const growthItems = [
  'Landing pages for product tests or campaign traffic',
  'Analytics signals that show where shoppers hesitate',
  'Offer structure for bundles, variants, and promotions',
  'Review rhythm for product performance after launch',
];

const deliverables = [
  'Storefront and navigation structure',
  'Product page and collection direction',
  'Dropshipping workflow where required',
  'Checkout, payment, and trust recommendations',
  'Operations and support readiness notes',
  'Launch and growth preparation inside the workspace',
];

const process = [
  'Clarify the product direction',
  'Shape the storefront and buyer journey',
  'Prepare checkout and trust details',
  'Organize fulfillment and support expectations',
  'Launch with a review path for improvement',
];

export default function EcommerceServices() {
  return (
    <main className={`${spaceGrotesk.variable} min-h-screen overflow-hidden bg-[#05070a] text-white`}>
      <section className="relative min-h-[720px] overflow-hidden border-b border-white/10 pt-20 md:min-h-[820px]">
        <Image
          src="https://images.unsplash.com/photo-1556742031-c6961e8560b0?w=2200&h=1400&fit=crop&crop=center"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover opacity-38 saturate-125"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#05070a_0%,rgba(5,7,10,0.9)_44%,rgba(5,7,10,0.24)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(245,158,11,0.2),transparent_32%),radial-gradient(circle_at_18%_84%,rgba(0,102,255,0.14),transparent_30%)]" />

        <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center gap-12 px-5 py-12 sm:px-6 md:min-h-[720px] md:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:py-16">
          <div>
            <div className="mb-7 flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.14em] text-white/52">
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Storefront</span>
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Dropshipping</span>
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Checkout</span>
              <span className="border border-white/12 bg-white/[0.04] px-3 py-2">Launch</span>
            </div>
            <h1 className="max-w-5xl break-words font-[var(--font-space-grotesk)] text-[2.45rem] font-semibold leading-[1.02] tracking-[-0.025em] sm:text-[3rem] md:text-6xl lg:text-7xl lg:tracking-[-0.035em]">
              Commerce pages for businesses that need selling online to feel organized.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-white/68 md:text-lg">
              This path covers storefronts, product presentation, dropshipping setup, checkout confidence, order movement, and the operating details that turn a store from a display into a business system.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CommerceAction href="/register" tone="light">
                Create Workspace
              </CommerceAction>
              <CommerceAction href="#storefront">
                See Commerce Work
              </CommerceAction>
            </div>
          </div>

          <div className="relative min-h-[440px] sm:min-h-[540px] lg:min-h-[650px]">
            <div className="absolute left-0 top-0 h-[58%] w-[76%] overflow-hidden rounded-tl-[2.75rem] bg-white/10 ring-1 ring-white/12 md:rounded-tl-[5rem]">
              <ImageFrame src={heroImages[0]} sizes="(min-width: 1024px) 46vw, 90vw" objectPosition="50% 44%" />
            </div>
            <div className="absolute right-0 top-[19%] h-[48%] w-[58%] overflow-hidden rounded-br-[2.75rem] bg-white/10 ring-1 ring-white/12 md:rounded-br-[5rem]">
              <ImageFrame src={heroImages[1]} sizes="(min-width: 1024px) 34vw, 72vw" objectPosition="50% 45%" />
            </div>
            <div className="absolute bottom-0 left-[12%] h-[34%] w-[54%] overflow-hidden rounded-tr-[2.25rem] bg-white/10 ring-1 ring-white/12 md:rounded-tr-[4rem]">
              <ImageFrame src={heroImages[2]} sizes="(min-width: 1024px) 30vw, 70vw" objectPosition="50% 42%" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <h2 className="max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
            A store is only convincing when the whole buying condition feels complete.
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <p className="text-base leading-8 text-white/66">
              Customers do not judge commerce in separate pieces. They feel the product page, the brand, the price, the delivery promise, the payment route, and the support expectation as one experience. If one part feels careless, trust starts to leak.
            </p>
            <p className="text-base leading-8 text-white/66">
              Sitemendr treats commerce as a practical system. The storefront should look polished, but the deeper work is to organize the path from interest to purchase, from purchase to fulfillment, and from launch to improvement.
            </p>
          </div>
        </div>
      </section>

      <section id="storefront-setup" className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:px-10 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <h2 className="max-w-4xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              The storefront and the operation have to be designed together.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-white/64 lg:ml-auto">
              A beautiful store can still fail if the buyer journey is unclear or the business behind it is unprepared. This page keeps the visual experience and the commercial operation in the same conversation.
            </p>
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-2">
            {commerceFoundations.map((service, index) => {
              const Icon = service.icon;

              return (
                <article key={service.title} className={index === 1 ? 'lg:pt-24' : ''}>
                  <div className="relative min-h-[340px] overflow-hidden bg-white/10 ring-1 ring-white/12 sm:min-h-[460px] lg:min-h-[560px]">
                    <ImageFrame src={service.image} sizes="(min-width: 1024px) 42vw, 100vw" objectPosition={index === 0 ? '50% 45%' : '50% 50%'} />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.58),rgba(5,7,10,0.04))]" />
                  </div>
                  <div className="mt-8 max-w-2xl">
                    <Icon className="h-6 w-6 text-amber-300" />
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

      <section id="checkout" className="border-b border-white/10 bg-[#05070a]">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative min-h-[420px] overflow-hidden sm:min-h-[560px] lg:min-h-[760px]">
            <ImageFrame
              src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1800&h=1300&fit=crop&crop=center"
              sizes="(min-width: 1024px) 56vw, 100vw"
              objectPosition="50% 45%"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.72),rgba(5,7,10,0.06))]" />
          </div>
          <div className="flex items-center px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:px-16">
            <div className="max-w-2xl">
              <CreditCard className="h-6 w-6 text-amber-300" />
              <h2 className="mt-7 break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                Checkout is where confidence is either confirmed or lost.
              </h2>
              <p className="mt-7 text-base leading-8 text-white/64 md:text-lg">
                The checkout path should feel short, clear, and trustworthy. Payment, cart behavior, policies, delivery expectations, confirmation messages, and recovery routes all need to support the decision the buyer is about to make.
              </p>
              <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
                {checkoutSignals.map((signal) => (
                  <div key={signal} className="flex items-start gap-4 py-5">
                    <SearchCheck className="mt-1 h-5 w-5 shrink-0 text-amber-300" />
                    <p className="text-sm font-semibold leading-7 text-white/72">{signal}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="operations" className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:px-10 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
            <div>
              <Truck className="h-6 w-6 text-amber-300" />
              <h2 className="mt-7 max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                After the purchase, the store still has to behave like a business.
              </h2>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/64 md:text-lg">
                Commerce work does not end when a button accepts payment. The business needs product records, order expectations, supplier notes, support context, and launch decisions to stay organized enough for customers to trust the experience after buying.
              </p>
            </div>

            <div className="grid gap-px overflow-hidden bg-white/10 md:grid-cols-2">
              {operations.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="min-h-[220px] bg-[#05070a] p-6 ring-1 ring-white/10 md:p-7">
                    <Icon className="h-5 w-5 text-amber-300" />
                    <h3 className="mt-8 text-xl font-semibold tracking-[-0.02em] text-white">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-white/58">{item.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="growth" className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Megaphone className="h-6 w-6 text-ai-blue" />
            <h2 className="mt-7 max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              Growth needs a launch surface that can be tested, measured, and improved.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/64 md:text-lg">
              Campaigns, product tests, bundles, affiliate movement, and paid traffic all need pages that explain the offer quickly. Sitemendr prepares the commerce path so the store can grow without rebuilding the foundation every time the business learns something.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {growthItems.map((item) => (
                <div key={item} className="border-t border-white/12 pt-5">
                  <ChartNoAxesCombined className="h-5 w-5 text-ai-blue" />
                  <p className="mt-5 text-sm font-semibold leading-7 text-white/70">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden rounded-bl-[2.75rem] bg-white/10 ring-1 ring-white/12 sm:min-h-[520px] md:rounded-bl-[5rem] lg:min-h-[680px]">
            <ImageFrame
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&h=1200&fit=crop&crop=center"
              sizes="(min-width: 1024px) 48vw, 100vw"
              objectPosition="50% 43%"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.62),rgba(5,7,10,0.04))]" />
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="grid lg:grid-cols-[0.96fr_1.04fr]">
          <div className="relative min-h-[420px] overflow-hidden sm:min-h-[560px] lg:min-h-[720px]">
            <ImageFrame
              src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1800&h=1300&fit=crop&crop=center"
              sizes="(min-width: 1024px) 50vw, 100vw"
              objectPosition="50% 44%"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.66),rgba(5,7,10,0.05))]" />
          </div>
          <div className="flex items-center px-5 py-14 sm:px-6 md:px-10 md:py-20 lg:px-16">
            <div className="max-w-2xl">
              <ReceiptText className="h-6 w-6 text-amber-300" />
              <h2 className="mt-7 break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
                The workspace becomes the commercial record.
              </h2>
              <p className="mt-7 text-base leading-8 text-white/64 md:text-lg">
                Products, suppliers, checkout notes, delivery expectations, payment requirements, support details, campaign assets, approvals, and launch decisions belong in one place. That record keeps the store from becoming a collection of scattered guesses.
              </p>
              <div className="mt-10 grid gap-px overflow-hidden bg-white/10 sm:grid-cols-2">
                {deliverables.map((item, index) => (
                  <div key={item} className="min-h-[130px] bg-[#05070a] p-5 ring-1 ring-white/10">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/32">C0{index + 1}</span>
                      <PackageCheck className="h-4 w-4 text-amber-300" />
                    </div>
                    <p className="mt-7 text-sm font-semibold leading-6 text-white/76">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070a]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:px-10 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
            <h2 className="max-w-3xl break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              The path is direct, but it respects the weight of selling online.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-white/64 lg:ml-auto">
              Commerce work becomes easier when the business can see the movement from product idea to customer promise. The process keeps that movement readable before launch.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {process.map((step, index) => (
              <div key={step} className="border-t border-white/12 pt-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/32">0{index + 1}</span>
                  {index === process.length - 1 ? <BadgeCheck className="h-4 w-4 text-amber-300" /> : <ShieldCheck className="h-4 w-4 text-ai-blue" />}
                </div>
                <p className="mt-8 text-lg font-semibold leading-7 text-white/82">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#05070a]">
        <Image
          src="https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?w=2200&h=1400&fit=crop&crop=center"
          alt=""
          fill
          unoptimized
          sizes="100vw"
          className="object-cover opacity-34 saturate-125"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,10,0.94)_0%,rgba(5,7,10,0.74)_48%,rgba(5,7,10,0.25)_100%)]" />
        <div className="relative mx-auto flex min-h-[500px] max-w-7xl items-center px-5 py-14 sm:px-6 md:min-h-[600px] md:px-10 md:py-20">
          <div className="max-w-3xl">
            <ShoppingBag className="h-6 w-6 text-amber-300" />
            <h2 className="mt-7 break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-4xl md:text-6xl md:tracking-[-0.03em]">
              Start with the store idea. Let the commercial system become clear.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/66 md:text-lg">
              The private workspace gives Sitemendr the room to review the products, customer promise, checkout needs, dropshipping route, operational risks, and launch direction before the store is treated as ready.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CommerceAction href="/register" tone="light">
                Create Workspace
              </CommerceAction>
              <CommerceAction href="/services/development">
                View Development Path
              </CommerceAction>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CommerceAction({
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
