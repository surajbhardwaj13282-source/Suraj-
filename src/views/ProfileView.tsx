/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Bookmark,
  Film,
  CheckCircle2,
  Globe,
  Settings,
  Lock,
  MessageCircle,
  Heart,
  Share2,
  Ban,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import { User, Post, Reel } from '../types.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface ProfileViewProps {
  userId: string;
  onOpenEditProfile: () => void;
  onOpenFollowers: (type: 'Followers' | 'Following', userId: string) => void;
  onSelectPost: (post: Post) => void;
  onStartChat: (userId: string) => void;
  onOpenStory?: () => void;
  hasActiveStory?: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userId,
  onOpenEditProfile,
  onOpenFollowers,
  onSelectPost,
  onStartChat,
  onOpenStory,
  hasActiveStory,
}) => {
  const { currentUser, refreshUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'reels'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const isMe = currentUser?.id === userId;

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [profileRes, postsRes, allPostsRes, reelsRes] = await Promise.all([
        api.getUserProfile(userId),
        api.getPosts({ authorId: userId }),
        api.getPosts(),
        api.getReels(),
      ]);

      setUser(profileRes.user);
      setIsFollowing(profileRes.isFollowing);
      setIsBlocked(profileRes.isBlocked);
      setPosts(postsRes.posts);

      // Filter saved posts
      if (profileRes.user.savedPostIds) {
        setSavedPosts(
          allPostsRes.posts.filter(p => profileRes.user.savedPostIds?.includes(p.id))
        );
      }

      // Filter user reels
      setReels(reelsRes.reels.filter(r => r.authorId === userId));
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [userId, currentUser]);

  const handleToggleFollow = async () => {
    if (!user) return;
    try {
      const res = await api.toggleFollow(user.id);
      setIsFollowing(res.following);
      setUser(prev => prev ? { ...prev, followersCount: res.followersCount } : null);
      await refreshUser();
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  const handleToggleBlock = async () => {
    if (!user) return;
    try {
      const res = await api.toggleBlock(user.id);
      setIsBlocked(res.blocked);
      await refreshUser();
    } catch (err) {
      console.error('Failed to toggle block:', err);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-28 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        <span className="text-xs text-neutral-400">Loading creator profile...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full py-28 text-center text-neutral-400 text-sm">
        Creator not found.
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12 pb-8 border-b border-neutral-200 dark:border-neutral-800">
        {/* Avatar with optional story ring */}
        <div
          onClick={() => {
            if (hasActiveStory && onOpenStory) {
              onOpenStory();
            }
          }}
          className={`rounded-full p-1 transition-transform ${
            hasActiveStory
              ? 'bg-gradient-to-tr from-amber-500 via-fuchsia-500 to-purple-600 cursor-pointer hover:scale-105'
              : ''
          }`}
        >
          <img
            src={user.avatarUrl}
            alt={user.fullName}
            className="w-24 h-24 md:w-36 md:h-36 rounded-full object-cover border-4 border-white dark:border-[#0c0a13] shadow-lg"
          />
        </div>

        {/* User Details & Actions */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl md:text-2xl font-extrabold text-neutral-900 dark:text-white">
              {user.username}
            </h1>
            {user.isVerified && (
              <CheckCircle2 className="w-5 h-5 text-purple-500 fill-purple-500" />
            )}

            {/* Actions for current user vs other */}
            {isMe ? (
              <button
                onClick={onOpenEditProfile}
                className="px-4 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleFollow}
                  className={`flex items-center gap-1.5 px-5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isFollowing
                      ? 'border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-rose-500/10 hover:text-rose-500'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-95'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" /> Follow
                    </>
                  )}
                </button>

                <button
                  onClick={() => onStartChat(user.id)}
                  className="px-4 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Message
                </button>

                <button
                  onClick={handleToggleBlock}
                  title={isBlocked ? 'Unblock user' : 'Block user'}
                  className="p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-rose-500 transition-colors"
                >
                  <Ban className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 md:gap-8 text-sm">
            <div>
              <span className="font-extrabold text-neutral-900 dark:text-white">
                {posts.length}
              </span>{' '}
              <span className="text-neutral-500">posts</span>
            </div>

            <button
              onClick={() => onOpenFollowers('Followers', user.id)}
              className="hover:underline"
            >
              <span className="font-extrabold text-neutral-900 dark:text-white">
                {user.followersCount.toLocaleString()}
              </span>{' '}
              <span className="text-neutral-500">followers</span>
            </button>

            <button
              onClick={() => onOpenFollowers('Following', user.id)}
              className="hover:underline"
            >
              <span className="font-extrabold text-neutral-900 dark:text-white">
                {user.followingCount.toLocaleString()}
              </span>{' '}
              <span className="text-neutral-500">following</span>
            </button>
          </div>

          {/* Bio & Links */}
          <div className="flex flex-col gap-1 max-w-md">
            <span className="font-bold text-sm text-neutral-900 dark:text-white">
              {user.fullName}
            </span>
            <p className="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
              {user.bio}
            </p>
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline mt-1"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{user.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-8 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'posts'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Posts</span>
        </button>

        <button
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-2 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'reels'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Reels</span>
        </button>

        {isMe && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'saved'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved</span>
          </button>
        )}
      </div>

      {/* Content Grid */}
      <div className="pt-6">
        {activeTab === 'posts' && (
          posts.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-400">
              No posts shared yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-4">
              {posts.map(p => (
                <div
                  key={p.id}
                  onClick={() => onSelectPost(p)}
                  className="relative group aspect-square bg-neutral-900 rounded-2xl overflow-hidden cursor-pointer"
                >
                  <img
                    src={p.mediaUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm">
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 fill-white" /> {p.likesCount}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 fill-white" /> {p.commentsCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'reels' && (
          reels.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-400">
              No reels uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-4">
              {reels.map(r => (
                <div
                  key={r.id}
                  className="relative aspect-[9/16] bg-neutral-900 rounded-2xl overflow-hidden shadow-sm"
                >
                  <video
                    src={r.videoUrl}
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-bold drop-shadow">
                    <Film className="w-3.5 h-3.5" />
                    <span>{r.likesCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'saved' && (
          savedPosts.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-400">
              No saved posts. Bookmark posts to view them privately here.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-4">
              {savedPosts.map(p => (
                <div
                  key={p.id}
                  onClick={() => onSelectPost(p)}
                  className="relative group aspect-square bg-neutral-900 rounded-2xl overflow-hidden cursor-pointer"
                >
                  <img
                    src={p.mediaUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
