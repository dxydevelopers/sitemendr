'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Eye, 
  EyeOff, 
  Calendar, 
  User, 
  Tag, 
  FileText, 
  Sparkles,
  ArrowLeft,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  readingTime: number;
  views: number;
  likes: number;
  author: {
    name: string;
    email: string;
  };
}

interface Category {
  name: string;
  count: number;
}

interface Tag {
  name: string;
  count: number;
}

export default function BlogEditor() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  // Form state
  const [currentPost, setCurrentPost] = useState<BlogPost>({
    id: '',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    status: 'draft',
    readingTime: 0,
    views: 0,
    likes: 0,
    author: { name: '', email: '' }
  });

  const [newTag, setNewTag] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchBlogData();
  }, []);

  const fetchBlogData = async () => {
    try {
      setLoading(true);
      const [postsRes, metaRes] = await Promise.all([
        apiClient.getBlogPosts({ limit: '100' }),
        apiClient.getBlogMeta()
      ]);
      
      setPosts((postsRes as { posts: BlogPost[] }).posts || []);
      setCategories((metaRes as { categories: Category[] }).categories || []);
      setTags((metaRes as { tags: Tag[] }).tags || []);
    } catch (error) {
      console.error('Failed to fetch blog data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setCurrentPost(post);
    setImageUrl(post.featuredImage || '');
    setIsEditing(true);
    setIsPreview(false);
  };

  const handleNewPost = () => {
    setCurrentPost({
      id: '',
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: '',
      tags: [],
      status: 'draft',
      readingTime: 0,
      views: 0,
      likes: 0,
      author: { name: '', email: '' }
    });
    setImageUrl('');
    setIsEditing(true);
    setIsPreview(false);
  };

  const handleSave = async () => {
    try {
      const postToSave = {
        ...currentPost,
        featuredImage: imageUrl || undefined
      };
      if (currentPost.id) {
        // Update existing post
        await apiClient.updateBlogPost(currentPost.id, postToSave);
      } else {
        // Create new post
        await apiClient.createBlogPost(postToSave);
      }
      await fetchBlogData();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  const handleDelete = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await apiClient.deleteBlogPost(postId);
        await fetchBlogData();
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  };

  const handlePublish = async (postId: string) => {
    try {
      await apiClient.publishBlogPost(postId);
      await fetchBlogData();
    } catch (error) {
      console.error('Failed to publish post:', error);
    }
  };

  const handleUnpublish = async (postId: string) => {
    try {
      await apiClient.unpublishBlogPost(postId);
      await fetchBlogData();
    } catch (error) {
      console.error('Failed to unpublish post:', error);
    }
  };

  const updateSlug = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setCurrentPost(prev => ({ ...prev, slug }));
  };

  const calculateReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const readingTime = Math.ceil(words / 200); // Average reading speed
    setCurrentPost(prev => ({ ...prev, readingTime }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darker-bg text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ai-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darker-bg text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black mb-2">Blog Management</h1>
            <p className="text-white/40">Create, edit, and manage your blog content</p>
          </div>
          <button
            onClick={handleNewPost}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-ai-blue to-tech-purple text-white font-bold rounded-xl hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5" />
            New Post
          </button>
        </div>

        {!isEditing ? (
          // Blog Posts List
          <div className="grid gap-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-ai-blue/40 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                    <p className="text-white/60 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Not published'}
                      </span>
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {post.author.name}
                      </span>
                      <span className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        {post.category}
                      </span>
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {post.readingTime} min read
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(post)}
                      className="p-2 text-white/40 hover:text-white transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-white/40 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {post.status === 'draft' ? (
                      <button
                        onClick={() => handlePublish(post.id)}
                        className="px-4 py-2 bg-expert-green text-white rounded-lg hover:bg-expert-green/80 transition-colors"
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnpublish(post.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-500/80 transition-colors"
                      >
                        Unpublish
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/30">
                  <span>Views: {post.views}</span>
                  <span>Likes: {post.likes}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    post.status === 'published' ? 'bg-green-500/20 text-green-400' :
                    post.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {post.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Blog Editor
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to List
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPreview(!isPreview)}
                    className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:border-ai-blue/40 transition-colors"
                  >
                    {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {isPreview ? 'Edit' : 'Preview'}
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-ai-blue to-tech-purple text-white rounded-lg hover:scale-105 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>

              {isPreview ? (
                // Preview Mode
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
                  <h1 className="text-4xl font-black mb-4">{currentPost.title}</h1>
                  <p className="text-white/60 mb-6">{currentPost.excerpt}</p>
                  <div className="prose prose-invert prose-lg max-w-none">
                    {currentPost.content.split('\n').map((line, i) => (
                      <p key={i} className="mb-4 text-white/80">{line}</p>
                    ))}
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">Title</label>
                    <input
                      type="text"
                      value={currentPost.title}
                      onChange={(e) => {
                        setCurrentPost(prev => ({ ...prev, title: e.target.value }));
                        updateSlug(e.target.value);
                      }}
                      className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-colors"
                      placeholder="Enter post title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Slug</label>
                    <input
                      type="text"
                      value={currentPost.slug}
                      onChange={(e) => setCurrentPost(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-colors"
                      placeholder="auto-generated-slug"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Excerpt</label>
                    <textarea
                      value={currentPost.excerpt}
                      onChange={(e) => setCurrentPost(prev => ({ ...prev, excerpt: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-colors"
                      placeholder="Enter post excerpt..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Content</label>
                    <textarea
                      value={currentPost.content}
                      onChange={(e) => {
                        setCurrentPost(prev => ({ ...prev, content: e.target.value }));
                        calculateReadingTime(e.target.value);
                      }}
                      rows={15}
                      className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-colors font-mono text-sm"
                      placeholder="Write your blog post content..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Post Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Category</label>
                    <select
                      value={currentPost.category}
                      onChange={(e) => setCurrentPost(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-colors"
                    >
                      <option value="">Select category...</option>
                      {categories.map((cat) => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Tags</label>
                    <div className="space-y-2 mb-4">
                      {currentPost.tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.02] border border-white/10 rounded-full text-sm">
                          {tag}
                          <button
                            onClick={() => setCurrentPost(prev => ({
                              ...prev,
                              tags: prev.tags.filter(t => t !== tag)
                            }))}
                            className="text-white/40 hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add new tag..."
                        className="flex-1 px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-colors"
                      />
                      <button
                        onClick={() => {
                          if (newTag && !currentPost.tags.includes(newTag)) {
                            setCurrentPost(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
                            setNewTag('');
                          }
                        }}
                        className="px-4 py-3 bg-ai-blue text-white rounded-xl hover:bg-ai-blue/80 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Status</label>
                    <select
                      value={currentPost.status}
                      onChange={(e) => setCurrentPost(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'archived' }))}
                      className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-colors"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">Reading Time</label>
                      <input
                        type="number"
                        value={currentPost.readingTime}
                        onChange={(e) => setCurrentPost(prev => ({ ...prev, readingTime: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Views</label>
                      <input
                        type="number"
                        value={currentPost.views}
                        onChange={(e) => setCurrentPost(prev => ({ ...prev, views: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Author</label>
                    <input
                      type="text"
                      value={currentPost.author.name}
                      onChange={(e) => setCurrentPost(prev => ({ ...prev, author: { ...prev.author, name: e.target.value } }))}
                      className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-colors"
                      placeholder="Author name..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Featured Image</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Image URL</label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-ai-blue transition-colors"
                    />
                  </div>
                  {imageUrl && (
                    <div className="relative h-40 rounded-xl overflow-hidden border border-white/10">
                      <img
                        src={imageUrl}
                        alt="Featured image preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <button
                    onClick={() => setImageUrl('')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/10 rounded-xl hover:border-red-400/40 hover:text-red-400 transition-colors text-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    Clear Image
                  </button>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl hover:border-ai-blue/40 transition-colors">
                    <Sparkles className="w-5 h-5" />
                    Generate with AI
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl hover:border-ai-blue/40 transition-colors">
                    <CheckCircle className="w-5 h-5" />
                    Validate Content
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl hover:border-ai-blue/40 transition-colors">
                    <XCircle className="w-5 h-5" />
                    Discard Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}