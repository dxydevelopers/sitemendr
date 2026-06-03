import Image from 'next/image';
import Link from 'next/link';
import { Space_Grotesk } from 'next/font/google';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Code2,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  MonitorCheck,
  PackageCheck,
  ShoppingBag,
  Wrench,
} from 'lucide-react';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const paths = [
  {
    key: 'Build',
    title: 'Custom Website Development',
    intro: 'High-end websites, portals, and digital platforms planned around your business, brand, and operating model.',
    accent: 'text-ai-blue',
    line: 'from-ai-blue to-white/20',
    image: 'https://images.unsplash.com/photo-1559028006-448665bd7c7f?w=1200&h=900&fit=crop&crop=center',
    icon: Code2,
    signals: ['Website roadmap', 'Design preview', 'Staging review'],
  },
  {
    key: 'Repair',
    title: 'Technical Repairs & Maintenance',
    intro: 'Diagnostics, fixes, security care, uptime monitoring, and support for websites that need to stay healthy.',
    accent: 'text-expert-green',
    line: 'from-expert-green to-white/20',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop&crop=center',
    icon: Wrench,
    signals: ['Site health', 'Issue queue', 'Security checks'],
  },
  {
    key: 'Grow',
    title: 'Dropshipping & Affiliate Commerce',
    intro: 'Shopify-like commerce programs for product direction, storefront setup, affiliate paths, and launch support.',
    accent: 'text-amber-300',
    line: 'from-amber-300 to-white/20',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=900&fit=crop&crop=center',
    icon: ShoppingBag,
    signals: ['Product board', 'Storefront plan', 'Campaign setup'],
  },
];

const flow = [
  'Account entry',
  'Choose a path',
  'Guided assessment',
  'Expert review',
  'Approval',
  'Delivery room',
];

const proof = [
  { label: 'Website build', value: 'Roadmap approved', icon: MonitorCheck },
  { label: 'Repair case', value: 'Health score restored', icon: Gauge },
  { label: 'Commerce setup', value: 'Store path prepared', icon: PackageCheck },
];

export default function Home() {
  return (
    <main className={`${spaceGrotesk.variable} min-h-screen bg-[#05070a] text-white overflow-hidden`}>
      <section className="relative min-h-[600px] w-full max-w-full overflow-hidden border-b border-white/10 pt-20 md:min-h-[640px] lg:min-h-[680px]">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        >
          <source src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#05070a_0%,rgba(5,7,10,0.78)_43%,rgba(5,7,10,0.28)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_64%_24%,rgba(0,102,255,0.24),transparent_34%),radial-gradient(circle_at_84%_70%,rgba(245,158,11,0.2),transparent_32%),radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.13),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:80px_80px] opacity-40" />

        <div className="relative z-10 flex min-h-[calc(600px-5rem)] flex-col md:min-h-[calc(640px-5rem)] lg:min-h-[calc(680px-5rem)]">
          <div className="grid min-w-0 flex-1 lg:grid-cols-[46fr_54fr]">
            <div className="w-screen max-w-full min-w-0 overflow-hidden border-r border-white/10 px-6 py-8 md:px-10 lg:flex lg:w-auto lg:flex-col lg:justify-center lg:px-14 xl:px-20">
              <h1 className="w-full max-w-[342px] break-words font-[var(--font-space-grotesk)] text-3xl font-semibold leading-[1.03] tracking-[-0.03em] md:max-w-[700px] md:text-5xl lg:text-[3.9rem]">
                Sitemendr builds the digital systems businesses rely on.
              </h1>

              <p className="mt-6 w-full max-w-[342px] break-words font-[var(--font-space-grotesk)] text-[15px] leading-8 text-white/68 md:max-w-[640px] md:text-lg">
                Custom websites, technical recovery, managed care, dropshipping programs, and affiliate commerce are organized through a private client workspace before execution begins.
              </p>

              <div className="mt-8 flex w-full max-w-[342px] flex-col items-stretch gap-px border border-white/12 bg-white/[0.06] sm:w-fit sm:max-w-none sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-3 bg-white/[0.10] px-6 py-4 text-[12px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.16]"
                >
                  Enter Workspace
                  <ArrowRight className="h-4 w-4 text-ai-blue" />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center bg-black/24 px-6 py-4 text-[12px] font-black uppercase tracking-[0.16em] text-white/72 transition hover:bg-white/[0.08] hover:text-white"
                >
                  View Services
                </Link>
              </div>
            </div>

            <div className="relative min-h-[360px] min-w-0 overflow-hidden border-t border-white/10 bg-[#0b1720]/18 md:min-h-[450px] lg:min-h-0 lg:border-t-0">
              <div className="absolute inset-0">
                <Image
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1400&h=1200&fit=crop&crop=center"
                  alt=""
                  fill
                  priority
                  unoptimized
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover opacity-44 saturate-125 brightness-110"
                />
                <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(7,18,26,0.54),rgba(7,18,26,0.14)_48%,rgba(0,102,255,0.12))]" />
              </div>

              <div className="absolute left-[12%] top-[8%] h-[47%] w-[51%] overflow-hidden border border-white/14 shadow-2xl [clip-path:polygon(0_0,100%_0,96%_100%,0_100%)] sm:left-[18%] sm:w-[43%] md:left-[21%] md:h-[48%] md:w-[39%] lg:left-[19%] lg:top-[9%] lg:h-[46%] lg:w-[38%]">
                <div className="relative h-full w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1559028006-448665bd7c7f?w=900&h=700&fit=crop&crop=center"
                    alt=""
                    fill
                    unoptimized
                    sizes="420px"
                    className="object-cover object-center opacity-90 saturate-125"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(0,102,255,0.24),rgba(7,18,26,0.12)_44%,rgba(7,18,26,0.48))]" />
                </div>
              </div>

              <div className="absolute left-[24%] top-[30%] w-[56%] overflow-hidden border border-white/14 bg-[#071019]/42 shadow-2xl backdrop-blur-md [clip-path:polygon(0_0,100%_4%,100%_100%,0_96%)] sm:left-[27%] sm:w-[47%] md:left-[32%] md:w-[40%] lg:left-[34%] lg:top-[29%] lg:w-[38%]">
                <div className="grid grid-cols-[74px_1fr] sm:grid-cols-[86px_1fr]">
                  <div className="border-r border-white/10 bg-white/[0.024] p-3">
                    {paths.map((path) => {
                      const Icon = path.icon;
                      return (
                        <div key={path.key} className="flex items-center justify-center border-b border-white/8 py-3 last:border-b-0">
                          <Icon className={`h-4 w-4 ${path.accent}`} />
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="h-4 w-4 text-ai-blue" />
                      <div className="h-px flex-1 bg-ai-blue/35" />
                    </div>
                    <div className="mt-4 space-y-3.5">
                      {[0.82, 0.62, 0.44].map((width, index) => (
                        <div key={index} className="grid grid-cols-[10px_1fr] items-center gap-3">
                          <span className="h-2 w-2 bg-ai-blue" />
                          <span className="h-px bg-white/28" style={{ width: `${width * 100}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-[8%] right-[3%] h-[38%] w-[58%] overflow-hidden border border-white/14 shadow-2xl [clip-path:polygon(0_0,100%_6%,94%_100%,0_94%)] sm:right-[5%] sm:w-[48%] md:right-[5%] md:h-[39%] md:w-[46%] lg:bottom-[11%] lg:right-[6%] lg:h-[38%] lg:w-[41%]">
                <div className="relative h-full w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&h=600&fit=crop&crop=center"
                    alt=""
                    fill
                    unoptimized
                    sizes="420px"
                    className="object-cover object-[44%_38%] opacity-88 saturate-125"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(25deg,rgba(245,158,11,0.22),rgba(7,18,26,0.08)_42%,rgba(7,18,26,0.5))]" />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 grid grid-cols-3 border-t border-white/10 bg-[#07121a]/30 backdrop-blur-sm">
                <div className="h-3 border-r border-white/10 bg-white/[0.02]" />
                <div className="h-3 border-r border-white/10 bg-ai-blue/10" />
                <div className="h-3 bg-expert-green/10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="relative overflow-hidden border-y border-white/10 bg-[#070a0f]">
        <div className="px-6 py-10 md:px-10 md:py-12 lg:px-14 xl:px-20">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <h2 className="mt-5 max-w-2xl break-words font-[var(--font-space-grotesk)] text-[1.85rem] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[2.75rem] lg:text-5xl">
                Build the site. Repair the system. Grow the channel.
              </h2>
            </div>

            <p className="max-w-3xl text-base leading-7 text-white/58 md:text-lg md:leading-8 lg:ml-auto">
              Sitemendr starts with the business need, then opens the right private workspace. Each path has its own assessment, expert review, approval flow, and delivery room inside the dashboard.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3">
            {paths.map((path) => {
              const Icon = path.icon;
              return (
                <article key={path.key} className="group relative min-h-[340px] overflow-hidden bg-[#080c12] md:min-h-[370px]">
                  <Image
                    src={path.image}
                    alt=""
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover opacity-52 saturate-125 transition duration-700 group-hover:scale-105 group-hover:opacity-64"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,12,18,0.94)_0%,rgba(8,12,18,0.74)_42%,rgba(8,12,18,0.2)_100%)]" />
                  <div className={`absolute left-6 top-0 h-1 w-24 bg-gradient-to-r ${path.line} opacity-85 md:left-8 lg:left-10`} />

                  <div className="relative z-10 flex min-h-[340px] flex-col justify-end p-6 md:min-h-[370px] md:p-8 lg:p-10">
                    <div className="mb-auto flex items-start justify-between">
                      <div className="grid h-12 w-12 place-items-center bg-black/18 backdrop-blur-sm">
                        <Icon className={`h-6 w-6 ${path.accent}`} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-[0.24em] text-white/40">{path.key}</span>
                    </div>

                    <div>
                      <h3 className="max-w-sm break-words font-[var(--font-space-grotesk)] text-[1.65rem] font-semibold leading-tight tracking-[-0.02em] md:text-3xl">{path.title}</h3>
                      <p className="mt-4 max-w-sm text-sm leading-6 text-white/64">{path.intro}</p>
                      <div className="mt-7 space-y-3">
                        {path.signals.map((signal) => (
                          <div key={signal} className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                            <span className={`h-1.5 w-1.5 ${path.key === 'Build' ? 'bg-ai-blue' : path.key === 'Repair' ? 'bg-expert-green' : 'bg-amber-300'}`} />
                            {signal}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </section>

      <section id="workspace" className="relative overflow-hidden bg-[#091017] py-12 md:py-14">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,102,255,0.12),transparent_34%),linear-gradient(300deg,rgba(16,185,129,0.1),transparent_38%)]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <h2 className="max-w-xl break-words font-[var(--font-space-grotesk)] text-[1.9rem] font-semibold leading-[1.06] tracking-[-0.035em] md:text-5xl">
                The public site opens the door. The workspace runs the work.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/62 md:text-lg md:leading-8">
                Clients do not expose the full brief on the homepage. They create an account, choose Build, Repair, or Grow, then Sitemendr turns that path into assessments, approvals, files, billing, and expert updates.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-black">
                  Create Workspace <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-white/8 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/78">
                  Client Login
                </Link>
              </div>
            </div>

            <div className="relative min-h-[420px] overflow-hidden bg-[#071019] shadow-2xl shadow-black/30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(0,102,255,0.28),transparent_30%),radial-gradient(circle_at_18%_86%,rgba(16,185,129,0.18),transparent_30%)]" />
              <div className="relative flex h-full min-h-[420px] flex-col">
                <div className="flex items-center justify-between px-5 py-5 md:px-7">
                  <div className="flex items-center gap-3">
                    <LockKeyhole className="h-5 w-5 text-expert-green" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Private workspace</span>
                  </div>
                  <span className="hidden text-xs text-white/40 sm:inline">Assessment, delivery, support</span>
                </div>

                <div className="grid flex-1 md:grid-cols-[88px_1fr]">
                  <div className="hidden flex-col items-center gap-7 bg-black/18 py-8 md:flex">
                    {[Code2, Wrench, ShoppingBag, Gauge].map((Icon, index) => (
                      <div key={index} className={`grid h-11 w-11 place-items-center ${index === 0 ? 'bg-ai-blue/18 text-ai-blue' : 'text-white/34'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    ))}
                  </div>

                  <div className="px-5 pb-6 md:px-7 md:pb-8">
                    <div className="flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.15em] text-white/42">
                      <span className="text-ai-blue">Build</span>
                      <span>Repair</span>
                      <span>Grow</span>
                    </div>

                    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_220px]">
                      <div>
                        <div className="flex items-start justify-between gap-5">
                          <div>
                            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-ai-blue">Website roadmap</div>
                            <h3 className="mt-3 font-[var(--font-space-grotesk)] text-3xl font-semibold tracking-[-0.03em] md:text-4xl">A guided build room</h3>
                          </div>
                          <BadgeCheck className="h-7 w-7 shrink-0 text-expert-green" />
                        </div>

                        <div className="mt-10 space-y-6">
                          {[
                            ['Brief intake', 'Complete'],
                            ['Direction review', 'Active'],
                            ['Design approval', 'Next'],
                            ['Build delivery', 'Queued'],
                          ].map(([name, status], index) => (
                            <div key={name} className="grid grid-cols-[24px_1fr_auto] items-center gap-4">
                              <span className={`h-2.5 w-2.5 ${index < 2 ? 'bg-ai-blue' : 'bg-white/18'}`} />
                              <span className="text-sm font-semibold text-white/82">{name}</span>
                              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">{status}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-5 bg-white/[0.035] p-5">
                        <MonitorCheck className="h-7 w-7 text-expert-green" />
                        <p className="text-sm leading-6 text-white/62">
                          Every service path gets its own questions, checkpoints, messages, uploads, and payments in one controlled client space.
                        </p>
                        <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/42">
                          <span>Files</span>
                          <span>Approvals</span>
                          <span>Billing</span>
                          <span>Updates</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="relative overflow-hidden border-y border-white/10 bg-[#070a0f] py-12 md:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(245,158,11,0.13),transparent_28%),radial-gradient(circle_at_86%_74%,rgba(0,102,255,0.12),transparent_32%)]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <h2 className="max-w-3xl break-words font-[var(--font-space-grotesk)] text-[1.9rem] font-semibold leading-[1.06] tracking-[-0.035em] md:text-5xl">
              A controlled route from account entry to delivery.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-white/60 md:text-lg md:leading-8 lg:ml-auto">
              The homepage introduces the company. The dashboard collects the right information, lets experts review it, then keeps approvals, payment, updates, and delivery in one place.
            </p>
          </div>

          <div className="relative mt-14">
            <div className="absolute left-3 right-3 top-5 hidden h-px bg-white/12 lg:block" />
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
              {flow.map((step, index) => (
                <div key={step} className="relative min-h-[140px]">
                  <div className="flex items-center gap-4 lg:block">
                    <div className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center ${index === flow.length - 1 ? 'bg-expert-green text-black' : 'bg-white/8 text-white'}`}>
                      {index === flow.length - 1 ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-xs font-black">0{index + 1}</span>}
                    </div>
                    <div className="lg:mt-8">
                      <div className="font-[var(--font-space-grotesk)] text-xl font-semibold tracking-[-0.02em] text-white">{step}</div>
                      <p className="mt-3 max-w-[220px] text-sm leading-6 text-white/50">
                        {index === 0 && 'The client enters through a private workspace.'}
                        {index === 1 && 'Build, Repair, or Grow sets the correct route.'}
                        {index === 2 && 'The questions match the service needed.'}
                        {index === 3 && 'Human specialists review the request before action.'}
                        {index === 4 && 'The client confirms scope, cost, and direction.'}
                        {index === 5 && 'Progress, files, support, and handoff stay inside.'}
                      </p>
                    </div>
                  </div>
                  {index < flow.length - 1 && <ArrowRight className="absolute right-5 top-3 hidden h-4 w-4 text-white/18 lg:block" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="proof" className="relative overflow-hidden bg-[#05070a] py-12 md:py-14">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(0,102,255,0.1),transparent_36%),linear-gradient(300deg,rgba(245,158,11,0.1),transparent_34%)]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="max-w-2xl break-words font-[var(--font-space-grotesk)] text-[1.9rem] font-semibold leading-[1.06] tracking-[-0.035em] md:text-5xl">
                Built for businesses that need their digital work handled properly.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/60 md:text-lg md:leading-8">
                Sitemendr gives clients one place to request work, review direction, approve decisions, and keep their online operation moving with expert support behind the dashboard.
              </p>
            </div>

            <div className="relative min-h-[360px] overflow-hidden bg-[#081018]">
              <Image
                src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1400&h=900&fit=crop&crop=center"
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="object-cover opacity-58 saturate-125"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,16,24,0.82)_0%,rgba(8,16,24,0.5)_42%,rgba(8,16,24,0.16)_100%)]" />
              <div className="relative z-10 grid min-h-[360px] content-end gap-5 p-6 md:grid-cols-3 md:p-8">
              {proof.map((item) => {
                const Icon = item.icon;
                return (
                    <div key={item.label} className="space-y-8">
                    <Icon className="h-7 w-7 text-white/58" />
                    <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/42">{item.label}</div>
                        <div className="mt-3 font-[var(--font-space-grotesk)] text-2xl font-semibold leading-tight tracking-[-0.02em]">{item.value}</div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="entry" className="relative min-h-[560px] overflow-hidden border-t border-white/10 bg-[#071019] text-white md:min-h-[620px]">
        <Image
          src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1800&h=1200&fit=crop&crop=center"
          alt=""
          fill
          unoptimized
          sizes="100vw"
          className="object-cover object-[76%_82%] opacity-100 saturate-125 md:object-[56%_70%] lg:object-[52%_72%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,16,25,0.82)_0%,rgba(7,16,25,0.55)_34%,rgba(7,16,25,0.12)_58%,rgba(7,16,25,0)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#071019] to-transparent" />
        <div className="pointer-events-none absolute right-[30%] top-12 hidden text-[10px] font-black uppercase tracking-[0.24em] text-ai-blue lg:block">Build</div>
        <div className="pointer-events-none absolute right-[13%] top-24 hidden text-[10px] font-black uppercase tracking-[0.24em] text-expert-green lg:block">Repair</div>
        <div className="pointer-events-none absolute bottom-16 right-[18%] hidden text-[10px] font-black uppercase tracking-[0.24em] text-amber-200 md:block">Grow</div>
        <div className="pointer-events-none absolute bottom-12 right-[38%] hidden text-[10px] font-black uppercase tracking-[0.24em] text-white/70 xl:block">Client workspace</div>

        <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-end px-6 py-14 md:min-h-[620px] md:py-20 lg:items-center">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="max-w-4xl break-words font-[var(--font-space-grotesk)] text-[2rem] font-semibold leading-[1.04] tracking-[-0.035em] md:text-5xl">
                Start with the right workspace, then let the system guide the work.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/62 md:text-lg md:leading-8">
                Create an account to open the route for your website build, repair request, maintenance support, or commerce program.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center gap-3 bg-white px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-black">
                Create Workspace <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
