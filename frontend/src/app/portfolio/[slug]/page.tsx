'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const CATEGORY_LABELS: Record<string, string> = {
  BUSINESS: 'Business Website',
  WORKSPACE: 'Custom Workspace',
  COMMERCE: 'Commerce Setup',
  REPAIR: 'Repair & Recovery',
};

type ProjectImage = {
  id: string;
  url: string;
  description: string;
};

type ProjectDetail = {
  id: string;
  title: string;
  category: string;
  summary: string;
  problem: string;
  decision: string;
  result: string;
  liveUrl: string | null;
  images: ProjectImage[];
};

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/portfolio/projects/${params.slug}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => data && setProject(data.project))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#05070a] pb-24 pt-24 text-white">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <p className="text-sm text-white/40">Loading project…</p>
        </div>
      </main>
    );
  }

  if (notFound || !project) {
    return (
      <main className="min-h-screen bg-[#05070a] pb-24 pt-24 text-white">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <p className="text-sm text-white/50">
            This project couldn&apos;t be found.{' '}
            <Link href="/portfolio" className="text-ai-blue hover:underline">
              Back to portfolio
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070a] pb-24 pt-24 text-white">
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        {/* Back button */}
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/50 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to portfolio
        </Link>

        {/* Title + category */}
        <div className="mt-8">
          <p className="text-xs font-medium text-white/40">{CATEGORY_LABELS[project.category]}</p>
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight md:text-5xl">
            {project.title}
          </h1>
          <p className="mt-5 text-base leading-8 text-white/62">{project.summary}</p>
        </div>

        {/* Image-by-image narrative: each image, immediately followed by its own description */}
        <div className="mt-16 space-y-16">
          {project.images.map((img, i) => (
            <figure key={img.id}>
              <div className="relative aspect-[16/10] overflow-hidden bg-white/[0.03]">
                <Image
                  src={img.url}
                  alt=""
                  fill
                  priority={i === 0}
                  unoptimized={process.env.NODE_ENV === 'development'}
                  sizes="(min-width: 768px) 720px, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-5 text-base leading-8 text-white/64">
                {img.description}
              </figcaption>
            </figure>
          ))}
        </div>

        {/* The wider story, once images are done */}
        <div className="mt-16 space-y-10 border-t border-white/10 pt-12">
          <div>
            <p className="text-xs font-medium text-white/38">The problem</p>
            <p className="mt-3 text-base leading-8 text-white/68">{project.problem}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/38">The decision</p>
            <p className="mt-3 text-base leading-8 text-white/68">{project.decision}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/38">The result</p>
            <p className="mt-3 text-base leading-8 text-white/68">{project.result}</p>
          </div>
        </div>

        {/* Live link + closing CTA */}
        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-12 sm:flex-row sm:flex-wrap">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center gap-3 bg-white/[0.06] px-6 py-4 text-sm font-semibold text-white ring-1 ring-white/12 transition hover:bg-white/[0.1]"
            >
              Visit live site
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <Link
            href="/contact?intent=sales"
            className="inline-flex min-h-[48px] items-center justify-center gap-3 bg-white px-6 py-4 text-sm font-semibold text-black transition hover:bg-ai-blue hover:text-white"
          >
            Discuss a project like this
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}