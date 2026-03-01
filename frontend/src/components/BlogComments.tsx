'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Send, Clock, User } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

interface BlogCommentsProps {
  slug: string;
}

export default function BlogComments({ slug }: BlogCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, slug]);

  const fetchComments = async () => {
    try {
      const response = await apiClient.getBlogComments(slug);
      const data = response as { success: boolean; data?: Comment[] };
      if (data.success) {
        setComments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments. Please try again later.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setError('Please enter a comment.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiResponse = await apiClient.addBlogComment(slug, newComment);
      const response = apiResponse as { success: boolean; message?: string };
      
      if (response.success) {
        setNewComment('');
        // Refresh comments
        await fetchComments();
      } else {
        setError(response.message || 'Failed to submit comment.');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      setError('An error occurred while submitting your comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mt-12 border-t border-white/10 pt-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-3 text-medium-gray hover:text-white transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-black text-sm uppercase tracking-widest">
            Comments {comments.length > 0 && `(${comments.length})`}
          </span>
        </button>
        
        <button
          onClick={() => {
            setShowComments(true);
            // Scroll to comment form
            setTimeout(() => {
              const form = document.getElementById('comment-form');
              form?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-ai-blue/20 border border-ai-blue/30 text-ai-blue font-black text-xs uppercase tracking-widest rounded-lg hover:bg-ai-blue/30 transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>Add Comment</span>
        </button>
      </div>

      {showComments && (
        <div className="space-y-6">
          {/* Comment Form */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
            <h3 className="font-black text-white uppercase tracking-tight mb-4">Add a Comment</h3>
            <form onSubmit={handleSubmit} id="comment-form">
              <div className="space-y-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full min-h-24 p-4 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-medium-gray focus:outline-none focus:border-ai-blue focus:ring-1 focus:ring-ai-blue resize-none"
                  disabled={loading}
                />
                
                {error && (
                  <p className="text-red-500 text-sm font-black">{error}</p>
                )}

                <div className="flex justify-between items-center">
                  <p className="text-xs text-medium-gray">
                    Comments are moderated. Please be respectful and constructive.
                  </p>
                  
                  <button
                    type="submit"
                    disabled={loading || !newComment.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-ai-blue text-white font-black text-sm uppercase tracking-widest rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Comment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-black text-white uppercase tracking-tight mb-4">Recent Comments</h3>
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-ai-blue/20 border border-ai-blue/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-ai-blue" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-black text-sm text-white uppercase tracking-tight">
                          {comment.user?.name || 'Anonymous'}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-medium-gray">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(comment.createdAt)}</span>
                        </div>
                      </div>
                      
                      <p className="text-medium-gray leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            showComments && (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-medium-gray mx-auto mb-4" />
                <p className="text-medium-gray">No comments yet. Be the first to share your thoughts!</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}