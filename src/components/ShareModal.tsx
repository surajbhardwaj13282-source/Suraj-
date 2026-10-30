/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Check, Copy, Send, Search } from 'lucide-react';
import { Post, Conversation } from '../types.js';
import { api } from '../services/api.js';

interface ShareModalProps {
  post: Post | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ post, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [copied, setCopied] = useState(false);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!post) return;
    api.getConversations().then(res => {
      setConversations(res.conversations);
    }).catch(console.error);
  }, [post]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/#post-${post?.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToConv = async (convId: string) => {
    if (!post) return;
    try {
      await api.sendMessage(convId, {
        text: `Shared post by @${post.author.username}: "${post.caption?.slice(0, 40) || ''}"`,
        mediaUrl: post.mediaUrl,
        type: 'post_share',
        sharedPostId: post.id,
      });
      setSentMap(prev => ({ ...prev, [convId]: true }));
    } catch (err) {
      console.error('Failed to send share message:', err);
    }
  };

  if (!post) return null;

  const filtered = conversations.filter(c => {
    const name = c.isGroup ? c.name : c.participants[0]?.fullName || c.participants[0]?.username;
    return (name || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0e0c16] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Share Post
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post Preview Snippet */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <img
            src={post.mediaUrl}
            alt="Preview"
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-neutral-900 dark:text-white truncate block">
              @{post.author.username}
            </span>
            <p className="text-[11px] text-neutral-500 truncate">
              {post.caption || 'Photo'}
            </p>
          </div>
        </div>

        {/* Copy Link Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-purple-500" />
                <span>Copy Post Link</span>
              </>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Send to Direct Chats List */}
        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-6 text-xs text-neutral-400">
              No conversations found.
            </div>
          ) : (
            filtered.map(c => {
              const displayName = c.isGroup
                ? c.name
                : c.participants.find(p => p.username !== post.author.username)?.fullName ||
                  c.participants[0]?.fullName;
              const avatar = c.isGroup ? c.avatarUrl : c.participants[0]?.avatarUrl;
              const isSent = sentMap[c.id];

              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={avatar || 'https://images.unsplash.com/photo-1534528741775?w=100'}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-purple-500/20"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {displayName}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {c.isGroup ? 'Group' : 'Direct Message'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendToConv(c.id)}
                    disabled={isSent}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSent
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                        : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                    }`}
                  >
                    {isSent ? 'Sent' : 'Send'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
