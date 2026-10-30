/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Heart, MessageCircle, Film, CheckCircle2, TrendingUp } from 'lucide-react';
import { Post, User } from '../types.js';
import { api } from '../services/api.js';

interface ExploreViewProps {
  onSelectPost: (post: Post) => void;
  onSelectUser: (userId: string) => void;
  initialTag?: string;
}

const TRENDING_TAGS = [
  'all',
  'tokyonight',
  'wanderlust',
  'spatialcomputing',
  'hautecouture',
  'modularsynth',
  'alpinism',
  'cyberpunk',
];

export const ExploreView: React.FC<ExploreViewProps> = ({
  onSelectPost,
  onSelectUser,
  initialTag,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialTag || '');
  const [activeTag, setActiveTag] = useState(initialTag || 'all');
  const [loading, setLoading] = useState(true);

  const fetchExplore = async (tag?: string) => {
    setLoading(true);
    try {
      const tagParam = tag && tag !== 'all' ? tag : undefined;
      const [postsRes, usersRes] = await Promise.all([
        api.getPosts({ tag: tagParam, explore: true }),
        api.getUsers(searchQuery),
      ]);
      setPosts(postsRes.posts);
      setUsers(usersRes.users);
    } catch (err) {
      console.error('Failed to load explore content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExplore(activeTag);
  }, [activeTag]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.startsWith('#')) {
      setActiveTag(searchQuery.replace(/^#/, ''));
    } else {
      fetchExplore();
    }
  };

  // Filter posts based on search query
  const filteredPosts = posts.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().replace(/^#/, '');
    return (
      p.caption.toLowerCase().includes(q) ||
      p.author.username.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xl mx-auto mb-6">
        <Search className="w-5 h-5 absolute left-4 top-3 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search creators, captions, or #hashtags..."
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-[#0e0c16] border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
        />
      </form>

      {/* Users match banner if typing query */}
      {searchQuery && users.length > 0 && (
        <div className="w-full max-w-xl mx-auto mb-6 p-3 rounded-2xl bg-white dark:bg-[#0e0c16] border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-2 block mb-2">
            Matching Creators
          </span>
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => onSelectUser(u.id)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex-shrink-0"
              >
                <img
                  src={u.avatarUrl}
                  alt={u.username}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-500/30"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {u.username}
                    </span>
                    {u.isVerified && (
                      <CheckCircle2 className="w-3 h-3 text-purple-500 fill-purple-500" />
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400">{u.fullName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Hashtag Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-4">
        <div className="flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 pr-2">
          <TrendingUp className="w-4 h-4" />
          <span>Explore:</span>
        </div>
        {TRENDING_TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => {
              setActiveTag(tag);
              setSearchQuery(tag === 'all' ? '' : `#${tag}`);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTag === tag
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white dark:bg-[#0e0c16] border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-purple-400'
            }`}
          >
            {tag === 'all' ? 'All Trends' : `#${tag}`}
          </button>
        ))}
      </div>

      {/* Mosaic Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs text-neutral-400">Discovering inspiring work...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-24 text-center text-neutral-400 text-sm">
          No posts matching your criteria. Try another search or hashtag!
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-4">
          {filteredPosts.map((post, idx) => {
            const isSpan2 = idx % 5 === 2; // Create attractive Instagram-style staggered mosaic feel

            return (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className={`relative group bg-neutral-900 rounded-2xl overflow-hidden cursor-pointer shadow-sm ${
                  isSpan2 ? 'row-span-2' : ''
                }`}
                style={{ aspectRatio: isSpan2 ? '4/5' : '1/1' }}
              >
                {post.mediaType === 'video' ? (
                  <video
                    src={post.mediaUrl}
                    muted
                    playsInline
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt={post.caption || 'Pixora Post'}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}

                {/* Video reel indicator badge */}
                {post.mediaType === 'video' && (
                  <div className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/60 backdrop-blur-md text-white">
                    <Film className="w-4 h-4" />
                  </div>
                )}

                {/* Dark Hover Overlay with Stats */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-5 h-5 fill-white" />
                    <span>{post.likesCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-5 h-5 fill-white" />
                    <span>{post.commentsCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
