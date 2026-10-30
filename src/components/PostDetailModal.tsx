/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  CheckCircle2,
  MapPin,
  MoreHorizontal,
} from 'lucide-react';
import { Post, Comment } from '../types.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface PostDetailModalProps {
  post: Post | null;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  onOpenShare: (post: Post) => void;
  onOpenReport: (post: Post) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  onClose,
  onSelectUser,
  onOpenShare,
  onOpenReport,
}) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (!post) return;
    setIsLiked(post.isLiked || false);
    setLikesCount(post.likesCount);
    setIsSaved(post.isSaved || false);

    setLoadingComments(true);
    api.getPostComments(post.id)
      .then(res => setComments(res.comments))
      .catch(console.error)
      .finally(() => setLoadingComments(false));
  }, [post]);

  const handleToggleLike = async () => {
    if (!post) return;
    try {
      const res = await api.toggleLikePost(post.id);
      setIsLiked(res.isLiked);
      setLikesCount(res.likesCount);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSave = async () => {
    if (!post) return;
    try {
      const res = await api.toggleSavePost(post.id);
      setIsSaved(res.isSaved);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentText.trim()) return;
    try {
      const res = await api.addComment(post.id, commentText.trim());
      setComments(prev => [...prev, res.comment]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  if (!post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative w-full max-w-4xl h-[85vh] max-h-[750px] bg-white dark:bg-[#0c0a13] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left: Media Area */}
        <div className="md:w-3/5 bg-black flex items-center justify-center overflow-hidden">
          {post.mediaType === 'video' ? (
            <video
              src={post.mediaUrl}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt=""
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Right: Author & Comments Column */}
        <div className="md:w-2/5 flex flex-col justify-between border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0a13]">
          {/* Header */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div
              onClick={() => {
                onClose();
                onSelectUser(post.authorId);
              }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <img
                src={post.author.avatarUrl}
                alt=""
                className="w-9 h-9 rounded-full object-cover ring-1 ring-purple-500/30"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    {post.author.username}
                  </span>
                  {post.author.isVerified && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />
                  )}
                </div>
                {post.location && (
                  <span className="text-[10px] text-neutral-400">{post.location}</span>
                )}
              </div>
            </div>
          </div>

          {/* Comments Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {post.caption && (
              <div className="flex items-start gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800/80">
                <img
                  src={post.author.avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="text-xs flex-1">
                  <span className="font-bold text-neutral-900 dark:text-white mr-1.5">
                    {post.author.username}
                  </span>
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {post.caption}
                  </span>
                </div>
              </div>
            )}

            {loadingComments ? (
              <div className="py-8 text-center text-xs text-neutral-400">Loading...</div>
            ) : comments.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">No comments yet.</div>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex items-start gap-3 text-xs">
                  <img
                    src={c.author.avatarUrl}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-neutral-900 dark:text-white mr-1.5">
                      {c.author.username}
                    </span>
                    <span className="text-neutral-700 dark:text-neutral-300">{c.text}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Action Bar & Input */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <button onClick={handleToggleLike}>
                  <Heart
                    className={`w-6 h-6 ${
                      isLiked ? 'text-rose-500 fill-rose-500' : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  />
                </button>
                <button onClick={() => onOpenShare(post)}>
                  <Send className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                </button>
              </div>

              <button onClick={handleToggleSave}>
                <Bookmark
                  className={`w-5 h-5 ${
                    isSaved ? 'text-purple-500 fill-purple-500' : 'text-neutral-700 dark:text-neutral-300'
                  }`}
                />
              </button>
            </div>

            <div className="text-xs font-bold text-neutral-900 dark:text-white mb-2">
              {likesCount.toLocaleString()} likes
            </div>

            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 disabled:opacity-40"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
