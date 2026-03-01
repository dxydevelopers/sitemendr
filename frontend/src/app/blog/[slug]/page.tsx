'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Calendar, Clock, User, Share2, ArrowRight, Sparkles, BookOpen, Bookmark } from 'lucide-react';
import { apiClient } from '@/lib/api';
import BlogComments from '@/components/BlogComments';
import BlogLike from '@/components/BlogLike';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const BACKEND_BASE_URL = API_BASE_URL.replace('/api', '');

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
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
  likes: number;
}

interface PostResponse {
  post: BlogPost;
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const [postData, relatedData] = await Promise.all([
          apiClient.getBlogPostBySlug(slug) as Promise<PostResponse>,
          apiClient.getRelatedPosts(slug) as Promise<{ success: boolean; posts: BlogPost[] }>
        ]);
        
        setPost(postData.post);
        if (relatedData.success) {
          setRelatedPosts(relatedData.posts);
        }
      } catch (error) {
        console.error('Failed to fetch post data:', error);
      }
      setLoading(false);
    };

    fetchPostData();
  }, [slug]);

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${BACKEND_BASE_URL}${imagePath}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex justify-center items-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-center items-center px-6">
        <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-8">
          <BookOpen className="w-12 h-12 text-slate-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Post not found</h1>
        <p className="text-slate-400 mb-8 text-center max-w-md">The article you are looking for does not exist or has been moved.</p>
        <Link 
          href="/blog" 
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Insights
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        {/* Back Button */}
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors mb-8 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold">Back to Insights</span>
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-300 tracking-wide uppercase">{post.category}</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8 tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              {post.title}
            </span>
          </h1>
          
          {/* Author & Meta Info */}
          <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="text-white">{post.author.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>{post.readingTime} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>{post.views} views</span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="aspect-video w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl mb-16 overflow-hidden relative group/image shadow-2xl">
          {post.featuredImage ? (
            <Image 
              src={getImageUrl(post.featuredImage)!} 
              alt={post.title}
              fill
              className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white/10 text-9xl font-black uppercase tracking-tighter">Sitemendr</span>
              </div>
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-50"></div>
        </div>

        {/* Content */}
        <article className="prose prose-invert prose-lg max-w-none prose-p:text-slate-300 prose-p:leading-relaxed prose-headings:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300 transition-colors prose-strong:text-white prose-code:text-blue-300 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800">
          {post.content.split('\n').filter(line => line.trim() !== '').map((line, i) => {
            if (line.startsWith('## ')) {
              return (
                <h2 key={i} className="text-3xl font-bold mt-12 mb-6 text-white flex items-center gap-3">
                  <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                  {line.replace('## ', '')}
                </h2>
              );
            }
            if (line.startsWith('### ')) {
              return (
                <h3 key={i} className="text-2xl font-bold mt-10 mb-5 text-white">
                  {line.replace('### ', '')}
                </h3>
              );
            }
            return <p key={i} className="mb-6 text-slate-300 leading-relaxed">{line}</p>;
          })}
        </article>

        {/* Tags & Actions */}
        <div className="mt-20 pt-12 border-t border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span 
                  key={tag} 
                  className="px-4 py-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:border-blue-500/30 transition-all cursor-default"
                >
                  #{tag}
                </span>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <BlogLike slug={post.slug} initialLikes={post.likes || 0} />
              <button 
                onClick={handleShare}
                className="p-4 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-blue-500/30 transition-all group"
                title="Share this article"
              >
                <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button 
                className="p-4 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-purple-500/30 transition-all group"
                title="Bookmark this article"
              >
                <Bookmark className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Blog Comments */}
        <div className="mt-16">
          <BlogComments slug={post.slug} />
        </div>

        {/* Newsletter CTA */}
        <div className="mt-24 p-8 sm:p-12 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 backdrop-blur-xl border border-slate-800 rounded-3xl text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-slate-900/50 backdrop-blur-sm border border-slate-700">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-300 tracking-wide uppercase">Stay Updated</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Want more insights?</h3>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto leading-relaxed">
              Subscribe to our newsletter to receive the latest technical deep-dives and industry strategies directly in your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 px-6 py-4 bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white placeholder:text-slate-500"
              />
              <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group whitespace-nowrap">
                Join the Pulse
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-24">
            <h3 className="text-2xl font-bold mb-8 text-white flex items-center gap-3">
              <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
              Related Articles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link 
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.slug}`}
                  className="p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl hover:border-blue-500/30 transition-all group cursor-pointer block"
                >
                  <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl mb-4 overflow-hidden relative">
                    {relatedPost.featuredImage ? (
                      <Image 
                        src={getImageUrl(relatedPost.featuredImage)!} 
                        alt={relatedPost.title}
                        fill
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-white/10" />
                      </div>
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                    {relatedPost.title}
                  </h4>
                  <p className="text-slate-400 text-sm line-clamp-2">
                    {relatedPost.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
