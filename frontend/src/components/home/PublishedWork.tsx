'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

type PortfolioProject = {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  images?: { url: string }[];
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export default function PublishedWork() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/api/portfolio/projects`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Portfolio request failed');
        return response.json();
      })
      .then((data: { projects?: PortfolioProject[] }) => {
        setProjects(Array.isArray(data.projects) ? data.projects.slice(0, 3) : []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setFailed(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <section id="work" className="border-b border-white/10" aria-labelledby="work-heading">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 md:py-14 lg:px-12">
        <div className="flex flex-col gap-5 border-b border-white/12 pb-6 sm:flex-row sm:items-end sm:justify-between md:pb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-expert-green">Published work</p>
            <h2 id="work-heading" className="mt-4 font-[var(--font-space-grotesk)] text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Examples from Sitemendr.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">Browse project examples that Sitemendr has published.</p>
          </div>
          <Link href="/portfolio" className="group inline-flex min-h-10 items-center gap-2 self-start border-b border-white/18 pb-1 text-sm font-semibold text-white transition hover:border-ai-blue hover:text-ai-blue sm:self-auto">
            Visit portfolio <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading ? (
          <p className="py-6 text-sm text-white/48" role="status">Loading published work…</p>
        ) : projects.length > 0 ? (
          <div className="divide-y divide-white/10">
            {projects.map((project, index) => (
              <Link key={project.id} href={`/portfolio/${project.slug}`} className="group grid gap-5 py-6 transition sm:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] sm:items-center sm:gap-8 md:py-7">
                <div className="relative aspect-[16/9] overflow-hidden bg-white/[0.035]">
                  {project.images?.[0]?.url ? (
                    <Image src={project.images[0].url} alt="" fill unoptimized sizes="(min-width: 640px) 40vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.02]" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-xs text-white/32">Project image unavailable</div>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-[48px_1fr] sm:gap-5">
                  <span className="font-mono text-xs tracking-[0.12em] text-white/36">0{index + 1}</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ai-blue">{project.category.replaceAll('_', ' ')}</p>
                    <h3 className="mt-2 font-[var(--font-space-grotesk)] text-2xl font-semibold tracking-[-0.025em] transition group-hover:text-ai-blue">{project.title}</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">{project.summary}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80">Read project <ArrowRight className="h-4 w-4" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="max-w-2xl text-sm leading-7 text-white/58">
              {failed
                ? 'Published projects are temporarily unavailable. You can still ask Sitemendr about work that fits your needs.'
                : 'There are no published project examples to show yet. We will add real work here when it is approved for publication.'}
            </p>
            <Link href="/contact" className="inline-flex min-h-10 items-center gap-2 self-start border-b border-white/18 pb-1 text-sm font-semibold text-white transition hover:border-ai-blue hover:text-ai-blue sm:self-auto">
              Ask about your project <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
