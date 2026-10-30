/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  CheckCircle2,
  MapPin,
  Share2,
  Flag,
  Trash2,
  Smile,
} from 'lucide-react';
import { Post, Comment } from '../types.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface PostCardProps {
  post: Post;
  onOpenComments: (post: Post) => void;
  onOpenShare: (post: Post) => void;
  onOpenReport: (post: Post) => void;
  onSelectUser: (userId: string) => void;
  onSelectTag?: (tag: string) => void;
  onPostDeleted?: (postId: string) => void;
  hasActiveStory?: boolean;
  onOpenStory?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onOpenComments,
  onOpenShare,
  onOpenReport,
  onSelectUser,
  onSelectTag,
  onPostDeleted,
  hasActiveStory,
  onOpenStory,
}) => {
  const { currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [latestComments, setLatestComments] = useState<Comment[]>([]);
  const [showLatestComments, setShowLatestComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);

  // Toggle Like
  const handleLike = async () => {
    try {
      const res = await api.toggleLikePost(post.id);
      setIsLiked(res.isLiked);
      setLikesCount(res.likesCount);
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  // Double tap to like
  const handleDoubleTap = () => {
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
    if (!isLiked) {
      handleLike();
    }
  };

  // Toggle Save
  const handleSave = async () => {
    try {
      const res = await api.toggleSavePost(post.id);
      setIsSaved(res.isSaved);
    } catch (err) {
      console.error('Failed to save post:', err);
    }
  };

  // Inline comment submission
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await api.addComment(post.id, commentText.trim());
      setLatestComments(prev => [...prev, res.comment]);
      setCommentsCount(prev => prev + 1);
      setCommentText('');
      setShowLatestComments(true);
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete post
  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.deletePost(post.id);
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  // Filter styles
  const getFilterClass = (preset?: string) => {
    switch (preset) {
      case 'violet-contrast':
        return 'contrast-115 hue-rotate-15 saturate-125';
      case 'clarity':
        return 'contrast-120 brightness-105 saturate-110';
      case 'editorial':
        return 'contrast-110 sepia-[0.1] saturate-90';
      case 'holographic':
        return 'hue-rotate-45 contrast-110';
      case 'analog':
        return 'contrast-95 sepia-[0.2] saturate-115';
      case 'monochrome':
        return 'grayscale contrast-125';
      default:
        return '';
    }
  };

  return (
    <article className="w-full max-w-xl mx-auto bg-white dark:bg-[#0c0a13] border border-neutral-200 dark:border-neutral-800/80 rounded-2xl mb-6 overflow-hidden shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3">
          {/* Avatar with optional story ring */}
          <div
            onClick={() => {
              if (hasActiveStory && onOpenStory) {
                onOpenStory();
              } else {
                onSelectUser(post.authorId);
              }
            }}
            className={`cursor-pointer rounded-full p-[2px] transition-transform hover:scale-105 ${
              hasActiveStory
                ? 'bg-gradient-to-tr from-amber-500 via-fuchsia-500 to-purple-600'
                : 'border border-transparent'
            }`}
          >
            <img
              src={post.author.avatarUrl}
              alt={post.author.username}
              className="w-10 h-10 rounded-full object-cover border border-white dark:border-[#0c0a13]"
            />
          </div>

          <div className="flex flex-col">
            <div
              onClick={() => onSelectUser(post.authorId)}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <span className="text-sm font-bold text-neutral-900 dark:text-white hover:underline">
                {post.author.username}
              </span>
              {post.author.isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />
              )}
            </div>
            {post.location && (
              <span className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                <MapPin className="w-3 h-3 text-purple-400" />
                {post.location}
              </span>
            )}
          </div>
        </div>

        {/* Options Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(prev => !prev)}
            aria-label="Post options"
            className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-48 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-20 text-xs font-semibold">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenShare(post);
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
              >
                <Share2 className="w-4 h-4 text-purple-500" /> Share Post
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleSave();
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
              >
                <Bookmark className="w-4 h-4 text-amber-500" /> {isSaved ? 'Remove from Saved' : 'Save Post'}
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenReport(post);
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-rose-500"
              >
                <Flag className="w-4 h-4" /> Report Post
              </button>
              {(currentUser?.id === post.authorId || currentUser?.isAdmin) && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDeletePost();
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-rose-500/10 text-rose-500 border-t border-neutral-200 dark:border-neutral-800 mt-1"
                >
                  <Trash2 className="w-4 h-4" /> Delete Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media container with double-tap heart */}
      <div
        onDoubleClick={handleDoubleTap}
        className="relative w-full bg-black flex items-center justify-center overflow-hidden select-none cursor-pointer"
        style={{
          aspectRatio:
            post.aspectRatio === '1:1'
              ? '1/1'
              : post.aspectRatio === '16:9'
              ? '16/9'
              : '4/5',
        }}
      >
        {post.mediaType === 'video' ? (
          <video
            src={post.mediaUrl}
            controls
            playsInline
            className={`w-full h-full object-cover ${getFilterClass(post.filterPreset)}`}
          />
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.caption || 'Pixora Post'}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-300 ${getFilterClass(
              post.filterPreset
            )}`}
          />
        )}

        {/* Big Double-tap Heart Animation */}
        {showHeartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-28 h-28 text-fuchsia-500 fill-fuchsia-500 animate-ping opacity-90 drop-shadow-2xl" />
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="p-3.5 pb-2">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-4">
            {/* Heart */}
            <button
              onClick={handleLike}
              aria-label={isLiked ? 'Unlike' : 'Like'}
              className="transition-transform active:scale-125"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  isLiked
                    ? 'text-rose-500 fill-rose-500 scale-105'
                    : 'text-neutral-700 dark:text-neutral-300 hover:text-rose-500'
                }`}
              />
            </button>

            {/* Comment */}
            <button
              onClick={() => onOpenComments(post)}
              aria-label="Comment"
              className="text-neutral-700 dark:text-neutral-300 hover:text-purple-500 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
            </button>

            {/* Share */}
            <button
              onClick={() => onOpenShare(post)}
              aria-label="Share"
              className="text-neutral-700 dark:text-neutral-300 hover:text-indigo-500 transition-colors"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>

          {/* Bookmark */}
          <button
            onClick={handleSave}
            aria-label={isSaved ? 'Remove bookmark' : 'Bookmark post'}
            className="text-neutral-700 dark:text-neutral-300 hover:text-purple-500 transition-colors"
          >
            <Bookmark
              className={`w-6 h-6 ${isSaved ? 'text-purple-500 fill-purple-500' : ''}`}
            />
          </button>
        </div>

        {/* Likes Count */}
        <div className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5">
          {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="text-sm text-neutral-800 dark:text-neutral-200 mb-2 leading-relaxed">
            <span
              onClick={() => onSelectUser(post.authorId)}
              className="font-bold text-neutral-900 dark:text-white cursor-pointer hover:underline mr-1.5"
            >
              {post.author.username}
            </span>
            <span>{post.caption}</span>
          </div>
        )}

        {/* Hashtags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {post.tags.map(tag => (
              <span
                key={tag}
                onClick={() => onSelectTag && onSelectTag(tag)}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Comments count / drawer trigger */}
        {commentsCount > 0 && (
          <button
            onClick={() => onOpenComments(post)}
            className="text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 mb-2 block"
          >
            View all {commentsCount} comments
          </button>
        )}

        {/* Preview of latest comment added inline */}
        {showLatestComments && latestComments.length > 0 && (
          <div className="space-y-1 mb-2 pl-1 border-l-2 border-purple-500/50">
            {latestComments.map(c => (
              <div key={c.id} className="text-xs text-neutral-700 dark:text-neutral-300">
                <span className="font-bold text-neutral-900 dark:text-white mr-1.5">
                  {c.author.username}
                </span>
                <span>{c.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider">
          {new Date(post.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Quick Inline Comment Input */}
      <form
        onSubmit={handleAddComment}
        className="flex items-center gap-2 px-3.5 py-2.5 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/30"
      >
        <button
          type="button"
          onClick={() => setCommentText(prev => prev + ' 💜')}
          className="text-neutral-400 hover:text-purple-500 transition-colors"
          title="Add emoji"
        >
          <Smile className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
        />
        {commentText.trim() && (
          <button
            type="submit"
            disabled={isSubmittingComment}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 disabled:opacity-40"
          >
            Post
          </button>
        )}
      </form>
    </article>
  );
};
