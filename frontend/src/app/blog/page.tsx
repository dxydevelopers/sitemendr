'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, ChevronLeft, ChevronRight, ArrowRight, FileQuestion, Calendar, Clock, User, TrendingUp, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api';

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
      try {
        const params: Record<string, string> = {
          page: currentPage.toString(),
          limit: '9'
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
    // If it's already a full URL, return it as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // If it's a relative path, prepend the backend URL
    return `${BACKEND_BASE_URL}${imagePath}`;
  };

  const handleImageError = (postId: string) => {
    setImageErrors(prev => new Set(prev).add(postId));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-300 tracking-wide uppercase">Insights & Perspectives</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                The Digital Pulse
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Expert insights, technical deep-dives, and industry strategies to help you navigate the AI-first world.
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mobile Search & Categories */}
        <div className="lg:hidden space-y-4 mb-8">
          {/* Mobile Search */}
          <div className="p-4 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Mobile Categories */}
          <div className="p-4 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === '' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                All
              </button>
              {meta?.categories.map((category) => (
                <button
                  key={category}
                  onClick={() => { setSelectedCategory(category); setCurrentPage(1); }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === category 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25' 
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Clear Filters */}
          {(selectedCategory || selectedTag || searchQuery) && (
            <button
              onClick={clearFilters}
              className="w-full py-3 px-4 bg-slate-900/50 backdrop-blur-xl border border-slate-800 text-white rounded-xl font-semibold hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span>Clear All Filters</span>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 space-y-8">
            {/* Search Box */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-400" />
                Search Articles
              </h3>
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Categories
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    selectedCategory === '' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25' 
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  All Posts
                </button>
                {meta?.categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => { setSelectedCategory(category); setCurrentPage(1); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      selectedCategory === category 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25' 
                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedCategory || selectedTag || searchQuery) && (
              <button
                onClick={clearFilters}
                className="w-full py-3 px-4 bg-slate-900/50 backdrop-blur-xl border border-slate-800 text-white rounded-xl font-semibold hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span>Clear All Filters</span>
                <X className="w-4 h-4" />
              </button>
            )}
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
                </div>
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                  {posts.map((post, index) => (
                    <article
                      key={post.id}
                      className="group bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Image Container */}
                      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                        {post.featuredImage && !imageErrors.has(post.id) ? (
                          <Image 
                            src={getImageUrl(post.featuredImage)!} 
                            alt={post.title}
                            fill
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            onError={() => handleImageError(post.id)}
                            unoptimized={true}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-slate-700/50 flex items-center justify-center">
                                <FileQuestion className="w-8 h-8 text-slate-500" />
                              </div>
                              <p className="text-xs text-slate-500">No image available</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
                        
                        {/* Category Badge */}
                        <div className="absolute top-4 left-4">
                          <span className="inline-block px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700 text-xs font-bold text-blue-300 uppercase tracking-wider">
                            {post.category}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 flex-grow flex flex-col">
                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            <span>{formatDate(post.publishedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-400" />
                            <span>{post.readingTime} min read</span>
                          </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                          <Link href={`/blog/${post.slug}`} className="hover:underline">
                            {post.title}
                          </Link>
                        </h2>

                        {/* Excerpt */}
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3">
                          {post.excerpt}
                        </p>

                        {/* Footer */}
                        <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-slate-300">{post.author.name}</span>
                          </div>
                          <Link 
                            href={`/blog/${post.slug}`} 
                            className="inline-flex items-center gap-2 text-blue-400 text-sm font-semibold group/link hover:text-blue-300 transition-colors"
                          >
                            Read More
                            <ArrowRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 pt-8">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-3 rounded-xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800/50 hover:border-blue-500/30 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 px-6 py-3 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl">
                      <span className="text-sm font-semibold text-slate-400">Page</span>
                      <span className="text-sm font-bold text-white">{currentPage}</span>
                      <span className="text-sm font-semibold text-slate-400">of</span>
                      <span className="text-sm font-bold text-white">{totalPages}</span>
                    </div>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-3 rounded-xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800/50 hover:border-blue-500/30 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-24 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                  <FileQuestion className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No articles found</h3>
                <p className="text-slate-400 mb-6">Try adjusting your filters or search terms.</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
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
