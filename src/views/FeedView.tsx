/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Post, UserStoryGroup, User } from '../types.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { StoriesBar } from '../components/StoriesBar.js';
import { PostCard } from '../components/PostCard.js';

interface FeedViewProps {
  onOpenComments: (post: Post) => void;
  onOpenShare: (post: Post) => void;
  onOpenReport: (post: Post) => void;
  onSelectUser: (userId: string) => void;
  onSelectTag: (tag: string) => void;
  onOpenCreateStory: () => void;
  onSelectStoryGroup: (groupIndex: number) => void;
  storyGroups: UserStoryGroup[];
}

export const FeedView: React.FC<FeedViewProps> = ({
  onOpenComments,
  onOpenShare,
  onOpenReport,
  onSelectUser,
  onSelectTag,
  onOpenCreateStory,
  onSelectStoryGroup,
  storyGroups,
}) => {
  const { currentUser, refreshUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = async () => {
    try {
      const [postsRes, usersRes] = await Promise.all([
        api.getPosts(),
        api.getUsers(),
      ]);
      setPosts(postsRes.posts);
      // Filter suggestions
      const suggestions = usersRes.users
        .filter(u => u.id !== currentUser?.id && !currentUser?.followingIds?.includes(u.id))
        .slice(0, 5);
      setSuggestedUsers(suggestions);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [currentUser]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleToggleFollow = async (userId: string) => {
    try {
      await api.toggleFollow(userId);
      await refreshUser();
      setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Failed to follow suggestion:', err);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 md:py-6 flex justify-center gap-10">
      {/* Center Feed Column */}
      <div className="w-full max-w-xl flex flex-col items-center">
        {/* Stories Bar */}
        <StoriesBar
          storyGroups={storyGroups}
          onSelectStoryGroup={onSelectStoryGroup}
          onOpenCreateStory={onOpenCreateStory}
        />

        {/* Refresh Feed Trigger */}
        <div className="w-full flex items-center justify-between px-2 mb-3">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Your Creative Feed
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <p className="text-xs text-neutral-400">Curating the finest moments...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="w-full py-24 text-center bg-white dark:bg-[#0c0a13] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8">
            <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">
              Your Feed is Waiting
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
              Follow talented creators or post your own photos and reels to bring your Pixora experience to life.
            </p>
          </div>
        ) : (
          posts.map(post => {
            const hasStory = storyGroups.some(g => g.author.id === post.authorId);
            const groupIdx = storyGroups.findIndex(g => g.author.id === post.authorId);

            return (
              <PostCard
                key={post.id}
                post={post}
                onOpenComments={onOpenComments}
                onOpenShare={onOpenShare}
                onOpenReport={onOpenReport}
                onSelectUser={onSelectUser}
                onSelectTag={onSelectTag}
                onPostDeleted={handlePostDeleted}
                hasActiveStory={hasStory}
                onOpenStory={() => groupIdx !== -1 && onSelectStoryGroup(groupIdx)}
              />
            );
          })
        )}
      </div>

      {/* Right Desktop Suggestions Column */}
      <aside className="hidden xl:flex flex-col w-72 sticky top-6 h-fit pt-2 select-none">
        {/* Current User Quick Header */}
        {currentUser && (
          <div
            onClick={() => onSelectUser(currentUser.id)}
            className="flex items-center justify-between p-2 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-900/60 cursor-pointer transition-colors mb-6"
          >
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/40"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-neutral-900 dark:text-white">
                  {currentUser.username}
                </span>
                <span className="text-xs text-neutral-500">{currentUser.fullName}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
              Switch
            </span>
          </div>
        )}

        {/* Suggested Creators Header */}
        <div className="flex items-center justify-between px-2 mb-3">
          <span className="text-xs font-bold text-neutral-500">Suggested for you</span>
          <button
            onClick={() => {}}
            className="text-xs font-semibold text-neutral-900 dark:text-neutral-200 hover:text-purple-500"
          >
            See All
          </button>
        </div>

        {/* Suggested Creators List */}
        <div className="space-y-3 mb-6">
          {suggestedUsers.length === 0 ? (
            <p className="text-xs text-neutral-400 px-2">You are following all creators!</p>
          ) : (
            suggestedUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between px-2">
                <div
                  onClick={() => onSelectUser(user.id)}
                  className="flex items-center gap-3 cursor-pointer overflow-hidden"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-purple-500/20"
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {user.username}
                      </span>
                      {user.isVerified && (
                        <CheckCircle2 className="w-3 h-3 text-purple-500 fill-purple-500" />
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400 truncate">
                      Popular creator
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleFollow(user.id)}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700"
                >
                  Follow
                </button>
              </div>
            ))
          )}
        </div>

        {/* Editorial Footer Links */}
        <div className="px-2 text-[11px] text-neutral-400 dark:text-neutral-600 leading-relaxed space-y-2 border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <span>About</span> · <span>Help</span> · <span>Press</span> · <span>API</span> · <span>Jobs</span> · <span>Privacy</span> · <span>Terms</span>
          </div>
          <p>© 2026 PIXORA FROM GOOGLE AI STUDIO</p>
        </div>
      </aside>
    </div>
  );
};
