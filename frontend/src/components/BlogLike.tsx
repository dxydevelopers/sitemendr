'use client';

import { useState, useEffect } from 'react';
import { Heart, Heart as HeartFilled } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface BlogLikeProps {
  slug: string;
  initialLikes: number;
}

export default function BlogLike({ slug, initialLikes }: BlogLikeProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user has already liked this post (simple localStorage check)
    const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '{}');
    setIsLiked(!!likedPosts[slug]);
  }, [slug]);

  const handleLike = async () => {
    if (loading) return;

    setLoading(true);
    
    try {
      const apiResponse = await apiClient.toggleBlogLike(slug);
      const response = apiResponse as { success: boolean; message?: string };
      
      if (response.success) {
        // Update local state
        if (isLiked) {
          setLikes(likes - 1);
        } else {
          setLikes(likes + 1);
        }
        
        // Update localStorage
        const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '{}');
        likedPosts[slug] = !isLiked;
        localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
        
        setIsLiked(!isLiked);
      } else {
        console.error('Failed to toggle like:', response.message);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
        isLiked
          ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
          : 'bg-white/5 border-white/10 text-medium-gray hover:text-red-500 hover:border-red-500/30 hover:bg-white/10'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLiked ? (
        <HeartFilled className="w-4 h-4 animate-pulse" />
      ) : (
        <Heart className="w-4 h-4" />
      )}
      <span className="font-black text-xs uppercase tracking-widest">
        {loading ? 'Liking...' : isLiked ? 'Liked' : 'Like'}
      </span>
      <span className="text-xs text-medium-gray">({likes})</span>
    </button>
  );
}