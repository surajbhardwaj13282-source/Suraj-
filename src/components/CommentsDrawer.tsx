/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Heart, Send, CheckCircle2 } from 'lucide-react';
import { Post, Comment } from '../types.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface CommentsDrawerProps {
  post: Post | null;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  post,
  onClose,
  onSelectUser,
}) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!post) return;
    setLoading(true);
    api.getPostComments(post.id)
      .then(res => {
        setComments(res.comments);
      })
      .catch(err => {
        console.error('Failed to load comments:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await api.addComment(post.id, newComment.trim());
      setComments(prev => [...prev, res.comment]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLikeComment = (commentId: string) => {
    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          const isLiked = !c.isLiked;
          return {
            ...c,
            isLiked,
            likesCount: isLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
          };
        }
        return c;
      })
    );
  };

  if (!post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg md:max-w-xl h-[85vh] max-h-[700px] bg-white dark:bg-[#0e0c16] rounded-t-3xl md:rounded-3xl border border-neutral-200 dark:border-neutral-800 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Comments
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
              {comments.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Post Caption as first comment */}
          {post.caption && (
            <div className="flex items-start gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800/60">
              <img
                src={post.author.avatarUrl}
                alt={post.author.username}
                onClick={() => {
                  onClose();
                  onSelectUser(post.authorId);
                }}
                className="w-9 h-9 rounded-full object-cover cursor-pointer ring-1 ring-purple-500/30"
              />
              <div className="flex-1 text-sm">
                <span
                  onClick={() => {
                    onClose();
                    onSelectUser(post.authorId);
                  }}
                  className="font-bold text-neutral-900 dark:text-white cursor-pointer hover:underline mr-1.5"
                >
                  {post.author.username}
                </span>
                <span className="text-neutral-700 dark:text-neutral-300">
                  {post.caption}
                </span>
                <div className="text-[11px] text-neutral-400 mt-1">Author</div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-sm text-neutral-400 animate-pulse">
              Loading thoughts...
            </div>
          ) : comments.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 text-sm">
              No comments yet. Start the conversation!
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex items-start justify-between gap-3 group">
                <div className="flex items-start gap-3 flex-1">
                  <img
                    src={c.author.avatarUrl}
                    alt={c.author.username}
                    onClick={() => {
                      onClose();
                      onSelectUser(c.authorId);
                    }}
                    className="w-8 h-8 rounded-full object-cover cursor-pointer"
                  />
                  <div className="flex-1 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => {
                          onClose();
                          onSelectUser(c.authorId);
                        }}
                        className="font-bold text-neutral-900 dark:text-white cursor-pointer hover:underline"
                      >
                        {c.author.username}
                      </span>
                      {c.author.isVerified && (
                        <CheckCircle2 className="w-3 h-3 text-purple-500 fill-purple-500" />
                      )}
                      <span className="text-[11px] text-neutral-400">· 1h</span>
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-300 mt-0.5 leading-relaxed">
                      {c.text}
                    </p>
                    {c.likesCount > 0 && (
                      <span className="text-[11px] font-semibold text-neutral-400 mt-1 block">
                        {c.likesCount} {c.likesCount === 1 ? 'like' : 'likes'}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleLikeComment(c.id)}
                  aria-label="Like comment"
                  className="p-1 text-neutral-400 hover:text-rose-500 transition-colors"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      c.isLiked ? 'text-rose-500 fill-rose-500' : ''
                    }`}
                  />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-3 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-3"
        >
          <img
            src={
              currentUser?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
            }
            alt="Current user"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-500/30"
          />
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700/80 px-4 py-2 rounded-full text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="p-2 rounded-full bg-purple-600 text-white disabled:opacity-40 hover:bg-purple-700 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
