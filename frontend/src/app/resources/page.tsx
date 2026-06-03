import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  CheckCircle2,
  ClipboardList,
  FileText,
  LifeBuoy,
  LockKeyhole,
  MonitorCheck,
  PenTool,
  Search,
  Store,
  Wrench,
} from 'lucide-react';

const images = {
  library: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1800&q=85',
  planning: 'https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?auto=format&fit=crop&w=1600&q=85',
  repair: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=85',
  commerce: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1600&q=85',
  workspace: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=85',
};

const shelves = [
  {
    name: 'Planning',
    icon: ClipboardList,
    purpose: 'Before a quote or workspace begins',
    items: ['Project brief checklist', 'Content readiness guide', 'Website goal map', 'Scope questions'],
  },
  {
    name: 'Build',
    icon: PenTool,
    purpose: 'For websites, systems, portals and dashboards',
    items: ['Page structure notes', 'Feature planning guide', 'Handoff expectations', 'Launch preparation'],
  },
  {
    name: 'Repair',
    icon: Wrench,
    purpose: 'For broken, slow, unsafe or unfinished work',
    items: ['Diagnosis checklist', 'Access preparation', 'Recovery notes', 'Post-repair care guide'],
  },
  {
    name: 'Commerce',
    icon: Store,
    purpose: 'For stores, checkout and dropshipping',
    items: ['Product readiness', 'Store connection guide', 'Order flow notes', 'Seller payout explanation'],
  },
  {
    name: 'Workspace',
    icon: LockKeyhole,
    purpose: 'For clients and sellers using dashboards',
    items: ['Account setup', 'Billing record guide', 'Project tracking', 'Support request guide'],
  },
];

const learningPath = [
  ['01', 'Understand the work', 'Use the resources to describe the project, issue, store, or care need clearly.'],
  ['02', 'Prepare the right details', 'Collect access, content, product information, screenshots, files, and decisions before opening a workspace.'],
  ['03', 'Choose the correct path', 'Build, repair, maintenance, commerce and dropshipping each need different information.'],
  ['04', 'Keep the record connected', 'Once a workspace begins, resources, support, billing, messages and project decisions stay attached.'],
];

const featured = [
  {
    title: 'Before You Request A Build',
    text: 'A short preparation path for businesses planning a website, platform, portal, dashboard, or custom system.',
    image: images.planning,
    href: '/services/development',
  },
  {
    title: 'Before You Ask For Repair',
    text: 'What to gather before Sitemendr diagnoses a broken website, failed setup, performance issue, or unfinished system.',
    image: images.repair,
    href: '/services/development',
  },
  {
    title: 'Before You Start Dropshipping',
    text: 'How sellers should think about product access, store setup, payments, fulfillment, delivery updates, and payout timing.',
    image: images.commerce,
    href: '/pricing',
  },
];

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <section className="relative min-h-[700px] overflow-hidden pt-24">
        <Image
          src={images.library}
          alt=""
          fill
          priority
          className="object-cover brightness-[0.68] contrast-[1.08] saturate-[1.08]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,10,0.94),rgba(5,7,10,0.54)_55%,rgba(5,7,10,0.84))]" />
        <div className="relative z-10 mx-auto grid min-h-[620px] max-w-7xl content-end gap-10 px-4 pb-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/46">Resources</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              A working library for clearer digital decisions.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/62">
              Sitemendr resources help clients, sellers, founders, and builders prepare better before opening a workspace, requesting a quote, asking for repair, launching a store, or joining a commerce flow.
            </p>
          </div>

          <div className="border-y border-white/14 py-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-white/34" />
              <p className="border-b border-white/12 pb-4 pl-8 text-sm text-white/44">
                Search and downloadable files will live inside the dashboard library. Public resources below explain what to prepare first.
              </p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {['Prepare', 'Understand', 'Track'].map((item) => (
                <div key={item} className="border-t border-white/10 pt-4">
                  <p className="text-lg font-black">{item}</p>
                  <p className="mt-2 text-sm leading-6 text-white/48">Use the right context before the work begins.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
          <div>
            <BookOpen className="h-8 w-8 text-ai-blue" />
            <h2 className="mt-6 text-3xl font-black leading-tight sm:text-4xl">Resource shelves</h2>
            <p className="mt-5 text-base leading-8 text-white/58">
              The public page shows the structure. The private workspace holds client-specific files, support documents, billing notes, project updates, and downloadable resources.
            </p>
          </div>

          <div className="border-y border-white/12">
            {shelves.map((shelf) => {
              const Icon = shelf.icon;
              return (
                <div key={shelf.name} className="grid gap-5 border-b border-white/10 py-7 last:border-b-0 md:grid-cols-[180px_1fr]">
                  <div>
                    <Icon className="h-6 w-6 text-ai-blue" />
                    <p className="mt-4 text-xl font-black">{shelf.name}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-white/36">{shelf.purpose}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {shelf.items.map((item) => (
                      <div key={item} className="flex gap-3 border-t border-white/10 pt-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-expert-green" />
                        <p className="text-sm leading-6 text-white/58">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-0 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
          {featured.map((item) => (
            <Link key={item.title} href={item.href} className="group relative min-h-[420px] overflow-hidden border-b border-white/10 lg:border-b-0 lg:border-r lg:last:border-r-0">
              <Image src={item.image} alt="" fill className="object-cover transition duration-700 group-hover:scale-[1.04]" sizes="(max-width: 1024px) 100vw, 33vw" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,10,0.18),rgba(5,7,10,0.88))]" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-xl font-black leading-tight">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-white/62">{item.text}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white">
                  Open path
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative min-h-[680px] overflow-hidden">
        <Image src={images.workspace} alt="" fill className="object-cover brightness-[0.62] contrast-[1.08]" sizes="100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,10,0.94),rgba(5,7,10,0.58),rgba(5,7,10,0.9))]" />
        <div className="relative z-10 mx-auto grid min-h-[680px] max-w-7xl content-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <MonitorCheck className="h-8 w-8 text-expert-green" />
            <h2 className="mt-6 text-3xl font-black leading-tight sm:text-4xl">How resources move into the workspace</h2>
            <p className="mt-5 text-base leading-8 text-white/60">
              Public resources help someone prepare. Private resources are attached to the account, project, store, support ticket, or billing record so the work remains traceable.
            </p>
          </div>
          <div className="border-y border-white/14 py-3">
            {learningPath.map(([step, title, text]) => (
              <div key={step} className="grid gap-4 border-b border-white/10 py-5 last:border-b-0 sm:grid-cols-[72px_1fr]">
                <p className="text-sm font-black text-ai-blue">{step}</p>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-white/56">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <Boxes className="h-8 w-8 text-amber-300" />
            <h2 className="mt-6 text-3xl font-black leading-tight sm:text-4xl">What belongs in the private library</h2>
          </div>
          <div className="border-y border-white/12 py-4">
            {[
              ['Client resources', 'Project-specific guides, access notes, files, handoff material and approved documents.'],
              ['Seller resources', 'Store setup notes, product rules, order status, payout explanations and support records.'],
              ['Support resources', 'Ticket history, troubleshooting notes, maintenance reports and recurring care references.'],
              ['Community resources', 'Learning material, member updates, events, opportunities and tier-based access.'],
            ].map(([title, text]) => (
              <div key={title} className="flex gap-4 border-b border-white/10 py-5 last:border-b-0">
                <FileText className="mt-1 h-5 w-5 shrink-0 text-white/48" />
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-white/56">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-3 border-t border-white/10 pt-8">
          <Link href="/workspace" className="inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-ai-blue hover:text-white">
            View workspace model
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/help" className="inline-flex items-center gap-2 border border-white/14 px-5 py-3 text-sm font-bold text-white/76 transition hover:border-white/34 hover:text-white">
            <LifeBuoy className="h-4 w-4" />
            Support center
          </Link>
          <Link href="/register" className="inline-flex items-center gap-2 border border-white/14 px-5 py-3 text-sm font-bold text-white/76 transition hover:border-white/34 hover:text-white">
            Create workspace
          </Link>
        </div>
      </section>
    </main>
  );
}
