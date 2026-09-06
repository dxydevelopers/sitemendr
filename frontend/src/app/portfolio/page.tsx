'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArrowRight, ImageOff } from 'lucide-react';

// Adjust to wherever your API base URL lives (env var, api client, etc.)
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

type ProjectCategory = 'BUSINESS' | 'WORKSPACE' | 'COMMERCE' | 'REPAIR';

type ProjectCard = {
  id: string;
  title: string;
  slug: string;
  category: ProjectCategory;
  summary: string;
  featured: boolean;
  images: { url: string }[];
};

const CATEGORIES: { value: ProjectCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All work' },
  { value: 'BUSINESS', label: 'Business Website' },
  { value: 'WORKSPACE', label: 'Custom Workspace' },
  { value: 'COMMERCE', label: 'Commerce Setup' },
  { value: 'REPAIR', label: 'Repair & Recovery' },
];

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | 'ALL'>('ALL');
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = activeCategory !== 'ALL' ? `?category=${activeCategory}` : '';

    fetch(`${API_URL}/api/portfolio/projects${query}`)
      .then((res) => res.json())
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <main className="min-h-screen bg-[#05070a] pb-24 pt-24 text-white">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 md:px-10">
        {/* Hero — one statement, one action */}
        <section className="mb-16 max-w-2xl">
          <p className="text-sm font-medium text-white/50">Portfolio</p>
          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
            Real work, browsable by the kind of problem it solved.
          </h1>
          <p className="mt-6 text-base leading-8 text-white/62">
            Each project below is a live piece of client work — the situation it started from, the
            decisions made, and what changed.
          </p>
          <div className="mt-8">
            <Link
              href="/contact?intent=sales"
              className="inline-flex min-h-[48px] items-center justify-center gap-3 bg-white px-6 py-4 text-sm font-semibold text-black transition hover:bg-ai-blue hover:text-white"
            >
              Discuss a project
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Category filter — given real visual weight, not a thin utility bar */}
        <section className="mb-14 border-y border-white/10 py-6">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`relative pb-2 text-base transition-colors ${
                    isActive ? 'font-semibold text-white' : 'font-medium text-white/45 hover:text-white/70'
                  }`}
                >
                  {cat.label}
                  {isActive && (
                    <span className="absolute -bottom-[1px] left-0 h-[2px] w-full bg-ai-blue" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Project grid */}
        <section>
          {loading ? (
            <p className="text-sm text-white/40">Loading work…</p>
          ) : projects.length === 0 ? (
            <div className="border border-dashed border-white/15 p-14 text-center">
              <p className="mx-auto max-w-md text-sm leading-7 text-white/50">
                {activeCategory === 'ALL'
                  ? 'Projects will appear here as they ship.'
                  : 'No work in this category yet — check back soon, or browse all work.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2">
              {projects.map((project, i) => (
                <Link
                  key={project.id}
                  href={`/portfolio/${project.slug}`}
                  className={`group block ${i % 3 === 0 ? 'sm:col-span-2' : ''}`}
                >
                  <div
                    className={`relative overflow-hidden bg-white/[0.03] ${
                      i % 3 === 0 ? 'aspect-[16/8]' : 'aspect-[4/3]'
                    }`}
                  >
                    {project.images[0]?.url ? (
                      <Image
                        src={project.images[0].url}
                        alt=""
                        fill
                        unoptimized={process.env.NODE_ENV === 'development'}
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-white/20">
                        <ImageOff className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="mt-5">
                    <p className="text-xs font-medium text-white/40">
                      {CATEGORIES.find((c) => c.value === project.category)?.label}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight transition group-hover:text-ai-blue">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-white/56">{project.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}