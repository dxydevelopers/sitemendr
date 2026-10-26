import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, LifeBuoy } from 'lucide-react';
import { notFound } from 'next/navigation';

const resourceGuides: Record<string, { title: string; summary: string; sections: Array<{ title: string; body: string }> }> = {
  'getting-started': {
    title: 'Getting started with your workspace',
    summary: 'A simple guide to finding project updates, contacting the team, and managing a finished site.',
    sections: [
      { title: 'Follow a project', body: 'Open Projects to see each build request, its current stage, payment steps, and conversations. Replies stay attached to the project they concern.' },
      { title: 'Ask the team', body: 'Use Messages for a general conversation. Open a Ticket when you need help with a specific issue and want to follow its status.' },
      { title: 'Manage a finished site', body: 'After handoff and payment closeout, open My Sites to manage the services that are ready for that site.' },
    ],
  },
  performance: {
    title: 'Understand site performance checks',
    summary: 'Use the Performance area to review available checks and ask Sitemendr for help with a specific improvement.',
    sections: [
      { title: 'Choose the right site', body: 'Performance checks belong to a specific site. Select the site you want to review before requesting a scan.' },
      { title: 'Read the results', body: 'A scan is a point-in-time measurement. Network conditions, page content, and third-party services can affect results, so compare repeated checks before drawing conclusions.' },
      { title: 'Request help', body: 'If an issue needs hands-on work, open a support ticket and include the site, page, and result you want us to review.' },
    ],
  },
  domains: {
    title: 'Connect a domain to your site',
    summary: 'You can buy a domain through a registrar you choose, then connect and verify it in Sitemendr.',
    sections: [
      { title: 'Choose where to register it', body: 'Domain registration and renewal are currently handled by your chosen registrar. Sitemendr does not yet sell or renew domains directly.' },
      { title: 'Add the domain', body: 'Open Domains in your dashboard, choose the site, and add the domain you own. Sitemendr will show the DNS records needed for the connection.' },
      { title: 'Verify and finish setup', body: 'Update DNS at the registrar, then return to Sitemendr to verify the records. DNS changes can take time to appear. Never share your registrar password with support.' },
    ],
  },
  'seo-basics': {
    title: 'Search visibility basics',
    summary: 'A practical checklist for helping search engines understand and show your website.',
    sections: [
      { title: 'Give each page a clear purpose', body: 'Use a distinct page title and a useful heading that describe what a visitor will find on that page.' },
      { title: 'Make content easy to understand', body: 'Write for your customers first. Keep important information in page text, use descriptive links, and add useful alternative text to meaningful images.' },
      { title: 'Check access and indexing', body: 'Make sure important pages load publicly, use the intended domain, and are not accidentally blocked from indexing. Search visibility cannot be guaranteed by a checklist alone.' },
    ],
  },
  editor: {
    title: 'Working with your site editor',
    summary: 'A safe routine for making changes to pages that already serve your business.',
    sections: [
      { title: 'Start with the right site', body: 'Choose the correct site and confirm its current publishing state before editing.' },
      { title: 'Make focused changes', body: 'Update one area at a time, review the result on desktop and mobile, and save or publish only when the content is ready.' },
      { title: 'Ask before changing infrastructure', body: 'Domain, hosting, and integration changes can affect a live site. Open a support ticket if a change needs Sitemendr to review it.' },
    ],
  },
  commerce: {
    title: 'Commerce setup basics',
    summary: 'Keep products, checkout, fulfillment, and customer updates connected in a clear store workflow.',
    sections: [
      { title: 'Prepare product details', body: 'Gather accurate names, prices, descriptions, images, stock levels, and delivery information before adding products.' },
      { title: 'Review the checkout path', body: 'Check payment settings and the customer confirmation flow before accepting orders.' },
      { title: 'Keep operations visible', body: 'Review new orders, fulfillment status, and customer questions regularly. Ask support if an order or payment state looks wrong.' },
    ],
  },
  security: {
    title: 'Security and account safety',
    summary: 'A few practical steps help protect your Sitemendr account and the services connected to it.',
    sections: [
      { title: 'Protect account access', body: 'Use a unique password, sign out on shared devices, and contact Sitemendr if you see activity you do not recognize.' },
      { title: 'Share access carefully', body: 'Do not send passwords, payment card details, or registrar credentials in messages or support tickets.' },
      { title: 'Report a concern', body: 'Open a support ticket and describe the affected site or account. Include relevant times and screenshots, but remove secrets first.' },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(resourceGuides).map(slug => ({ slug }));
}

export default async function ResourceGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = resourceGuides[slug];
  if (!guide) notFound();

  return (
    <main className="min-h-screen bg-[#07090d] px-4 py-12 text-white sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <Link href="/resources" className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Resource library</Link>
        <div className="mt-12 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/15 bg-sky-300/[.06] px-3 py-1.5 text-[11px] font-semibold text-sky-200"><BookOpen className="h-3.5 w-3.5" /> Sitemendr guide</div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{guide.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">{guide.summary}</p>
        </div>
        <div className="divide-y divide-white/10">
          {guide.sections.map((section, index) => (
            <section key={section.title} className="grid gap-3 py-7 sm:grid-cols-[56px_1fr] sm:gap-5">
              <span className="text-xs font-semibold text-sky-200/70">0{index + 1}</span>
              <div><h2 className="text-base font-semibold">{section.title}</h2><p className="mt-2 text-sm leading-7 text-white/55">{section.body}</p></div>
            </section>
          ))}
        </div>
        <div className="mt-7 flex flex-col gap-4 border border-white/10 bg-white/[.025] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-semibold">Need help with this?</p><p className="mt-1 text-xs text-white/45">Send a message or open a support ticket in your workspace.</p></div>
          <Link href="/dashboard/support" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 bg-sky-300 px-4 text-xs font-semibold text-slate-950">Open dashboard <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <p className="mt-6 inline-flex items-center gap-2 text-[11px] text-white/35"><LifeBuoy className="h-3.5 w-3.5" /> Your support conversations stay tied to your Sitemendr account.</p>
      </article>
    </main>
  );
}
