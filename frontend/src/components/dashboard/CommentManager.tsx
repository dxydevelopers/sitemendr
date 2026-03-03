'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { MessageSquare, Check, X, Trash2, User, FileText } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
  blogPost?: {
    title: string;
    slug: string;
  };
}

export default function CommentManager() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getAdminComments(filter) as unknown as { success: boolean; data: Comment[] };
      if (res.success) {
        setComments(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiClient.updateCommentStatus(id, status);
      fetchComments();
    } catch (error) {
      console.error('Failed to update comment status:', error);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await apiClient.deleteComment(id);
      fetchComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold uppercase tracking-widest text-ai-blue">Comment Moderation</h2>
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
          {['pending', 'approved', 'spam'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === status ? 'bg-ai-blue text-white' : 'text-medium-gray hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-ai-blue/20 border-t-ai-blue rounded-full animate-spin"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-20 text-center">
          <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-medium-gray text-xs uppercase tracking-widest">No comments found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.04] transition-all group">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-ai-blue/10 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-ai-blue" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{comment.user?.name || 'Anonymous'}</h4>
                      <p className="text-[10px] text-medium-gray">{comment.user?.email || 'No email'}</p>
                    </div>
                    <span className="text-[8px] text-medium-gray/50 ml-auto">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="bg-black/20 p-4 rounded-xl mb-4 border border-white/5">
                    <p className="text-sm text-light-text leading-relaxed italic">&quot;{comment.content}&quot;</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] text-medium-gray uppercase tracking-widest">
                      <FileText className="w-3 h-3" />
                      Post: <span className="text-ai-blue">{comment.blogPost?.title || 'Unknown'}</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                      comment.status === 'approved' ? 'bg-expert-green/20 text-expert-green' : 
                      comment.status === 'spam' ? 'bg-red-500/20 text-red-500' : 
                      'bg-orange-500/20 text-orange-500'
                    }`}>
                      {comment.status}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {comment.status !== 'approved' && (
                    <button 
                      onClick={() => handleUpdateStatus(comment.id, 'approved')}
                      className="p-2 bg-expert-green/10 text-expert-green border border-expert-green/20 rounded-lg hover:bg-expert-green hover:text-white transition-all"
                      title="Approve"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {comment.status !== 'spam' && (
                    <button 
                      onClick={() => handleUpdateStatus(comment.id, 'spam')}
                      className="p-2 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-lg hover:bg-orange-500 hover:text-white transition-all"
                      title="Mark as Spam"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
