'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, ChevronLeft, ChevronRight, ArrowRight, FileQuestion, Calendar, Clock, User, TrendingUp, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { editorialImages, editorialPosts } from '@/lib/editorial-posts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const BACKEND_BASE_URL = API_BASE_URL.replace('/api', '');

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  author: {
    name: string;
    email: string;
  };
  category: string;
  tags: string[];
  publishedAt: string;
  readingTime: number;
  views: number;
  likes?: number;
}

interface BlogMeta {
  categories: string[];
  tags: string[];
  categoryCounts: { id: string; count: number }[];
  tagCounts: { id: string; count: number }[];
}

interface BlogPostsResponse {
  posts: BlogPost[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [meta, setMeta] = useState<BlogMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchBlogMeta = async () => {
      try {
        const data = await apiClient.getBlogMeta() as BlogMeta;
        setMeta(data);
      } catch (error) {
        console.error('Failed to fetch blog meta:', error);
      }
    };

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {
          page: currentPage.toString(),
          limit: '9',
        };

        if (selectedCategory) params.category = selectedCategory;
        if (selectedTag) params.tag = selectedTag;
        if (searchQuery) params.search = searchQuery;

        const data = await apiClient.getBlogPosts(params) as BlogPostsResponse;
        setPosts(data.posts);
        setTotalPages(data.pagination.pages);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
      setLoading(false);
    };

    fetchBlogMeta();
    fetchPosts();
  }, [selectedCategory, selectedTag, searchQuery, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedTag('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${BACKEND_BASE_URL}${imagePath}`;
  };

  const handleImageError = (postId: string) => {
    setImageErrors(prev => new Set(prev).add(postId));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const hasFilters = selectedCategory || selectedTag || searchQuery;
  const apiSlugs = new Set(posts.map(post => post.slug));
  const curatedPosts = editorialPosts.filter(post => !apiSlugs.has(post.slug));
  const categoryList = Array.from(new Set([
    ...editorialPosts.map(post => post.category),
    ...(meta?.categories || []),
  ])).sort();
  const visibleCuratedPosts = curatedPosts.filter(post => {
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [post.title, post.excerpt, post.category, ...post.tags].join(' ').toLowerCase().includes(query);
    return matchesCategory && matchesTag && matchesSearch;
  });
  const displayPosts = currentPage === 1 ? [...visibleCuratedPosts, ...posts] : posts;

  const getFallbackImage = (index: number) => editorialImages[index % editorialImages.length];

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-[#08111f] to-slate-950 text-white">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute right-[-12rem] top-[-16rem] h-[42rem] w-[42rem] rounded-full bg-blue-500/10 blur-[150px]" />
        <div className="absolute bottom-[-18rem] left-[-14rem] h-[38rem] w-[38rem] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/5 blur-[120px]" />
      </div>

      <section className="relative z-10 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-blue-300" />
              <span className="text-sm font-semibold uppercase tracking-wide text-blue-200">Insights & Perspectives</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                Sitemendr Insights
              </span>
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-400 sm:text-xl md:text-2xl">
              Practical writing on websites, repairs, maintenance, commerce, workspaces, and the decisions that keep digital work useful after launch.
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-4 lg:hidden">
          <div className="border-y border-white/10 py-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full border-0 bg-transparent pl-7 pr-10 text-sm text-white outline-none placeholder:text-white/30"
              />
              <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-white/44 transition-colors hover:text-blue-300" aria-label="Search articles">
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="border-b border-white/10 pb-2">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/42">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
              Browse
            </h3>
            <div className="flex flex-wrap gap-2 pb-3">
              <button
                onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
                className={`border px-3 py-2 text-xs font-semibold transition-all ${
                  selectedCategory === ''
                    ? 'border-white bg-white text-slate-950'
                    : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
              >
                All writing
              </button>
              {categoryList.map((category) => (
                <button
                  key={category}
                  onClick={() => { setSelectedCategory(category); setCurrentPage(1); }}
                  className={`border px-3 py-2 text-xs font-semibold transition-all ${
                    selectedCategory === category
                      ? 'border-white bg-white text-slate-950'
                      : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex w-full items-center justify-center gap-2 border border-white/10 px-4 py-3 text-sm font-semibold text-white/70 transition-all hover:border-white/30 hover:text-white"
            >
              <span>Clear All Filters</span>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-12">
          <aside className="hidden space-y-5 lg:col-span-1 lg:block">
            <div className="border-y border-white/10 py-6">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-white/38">Find a note</p>
              <form onSubmit={handleSearch} className="relative">
                <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full border-0 border-b border-white/10 bg-transparent pl-7 pr-10 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-400"
                />
                <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-white/44 transition-colors hover:text-blue-300" aria-label="Search articles">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div className="border-b border-white/10 pb-2">
              <h3 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-white/38">
                <TrendingUp className="h-4 w-4 text-emerald-300" />
                Browse by subject
              </h3>
              <div className="space-y-2 pb-3">
                <button
                  onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
                  className={`w-full border px-4 py-3 text-left text-sm font-semibold transition-all ${
                    selectedCategory === ''
                      ? 'border-white bg-white text-slate-950'
                      : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                  }`}
                >
                  All writing
                </button>
                {categoryList.map((category) => (
                  <button
                    key={category}
                    onClick={() => { setSelectedCategory(category); setCurrentPage(1); }}
                    className={`w-full border px-4 py-3 text-left text-sm font-semibold transition-all ${
                      selectedCategory === category
                        ? 'border-white bg-white text-slate-950'
                        : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex w-full items-center justify-center gap-2 border border-white/10 px-4 py-3 text-sm font-semibold text-white/70 transition-all hover:border-white/30 hover:text-white"
              >
                <span>Clear All Filters</span>
                <X className="h-4 w-4" />
              </button>
            )}
          </aside>

          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex h-96 items-center justify-center">
                <div className="relative">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-800 border-t-blue-500" />
                  <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-r-emerald-400" style={{ animationDirection: 'reverse' }} />
                </div>
              </div>
            ) : displayPosts.length > 0 ? (
              <div className="space-y-8">
                <div className="space-y-10">
                  {displayPosts.map((post, index) => {
                    const imageUrl = !imageErrors.has(post.id) ? getImageUrl(post.featuredImage) : null;

                    return (
                    <article
                      key={post.id}
                      className="group grid gap-5 border-b border-white/10 pb-10 transition-all duration-500 md:grid-cols-[0.92fr_1.08fr] md:items-stretch"
                    >
                      <div className="relative min-h-[260px] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950 md:min-h-[320px]">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            onError={() => handleImageError(post.id)}
                            unoptimized={true}
                          />
                        ) : (
                          <Image
                            src={getFallbackImage(index)}
                            alt=""
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-70" />
                      </div>

                      <div className="flex flex-grow flex-col py-1 md:py-4">
                        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          <span className="border-b border-blue-300 pb-1 text-blue-200">{post.category}</span>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-blue-300" />
                            <span>{formatDate(post.publishedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-emerald-300" />
                            <span>{post.readingTime} min read</span>
                          </div>
                        </div>

                        <h2 className="mb-4 text-2xl font-bold leading-tight text-white transition-colors group-hover:text-blue-300 lg:text-3xl">
                          <Link href={`/blog/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h2>

                        <p className="mb-8 text-sm leading-7 text-slate-400 lg:text-base lg:leading-8">
                          {post.excerpt}
                        </p>

                        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-400">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-slate-300">{post.author.name}</span>
                          </div>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="group/link inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition-colors hover:text-white"
                          >
                            Read More
                            <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                          </Link>
                        </div>
                      </div>
                    </article>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-8">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="border border-white/10 bg-slate-900/55 p-3 text-white backdrop-blur-xl transition-all hover:border-blue-400/35 hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2 border border-white/10 bg-slate-900/55 px-6 py-3 backdrop-blur-xl">
                      <span className="text-sm font-semibold text-slate-400">Page</span>
                      <span className="text-sm font-bold text-white">{currentPage}</span>
                      <span className="text-sm font-semibold text-slate-400">of</span>
                      <span className="text-sm font-bold text-white">{totalPages}</span>
                    </div>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="border border-white/10 bg-slate-900/55 p-3 text-white backdrop-blur-xl transition-all hover:border-blue-400/35 hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center border border-white/10 bg-slate-900/55 py-24 text-center backdrop-blur-xl">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/60">
                  <FileQuestion className="h-10 w-10 text-slate-600" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">No articles found</h3>
                <p className="mb-6 text-slate-400">Try adjusting your filters or search terms.</p>
                <button
                  onClick={clearFilters}
                  className="bg-white px-6 py-3 font-semibold text-slate-950 transition-all hover:bg-blue-300"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
