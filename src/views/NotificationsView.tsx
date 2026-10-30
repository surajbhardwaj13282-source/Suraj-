/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  UserPlus,
  Sparkles,
  CheckCheck,
  CheckCircle2,
} from 'lucide-react';
import { NotificationItem } from '../types.js';
import { api } from '../services/api.js';

interface NotificationsViewProps {
  onSelectUser: (userId: string) => void;
  onSelectPostById?: (postId: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onSelectUser,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'like' | 'comment' | 'follow'>('all');
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-purple-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-indigo-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">
            Activity
          </h2>
          <span className="text-xs text-neutral-400">
            Likes, comments & new followers
          </span>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Segmented Filter Controls */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-[#0e0c16] rounded-xl mb-4 border border-neutral-200 dark:border-neutral-800">
        {(['all', 'like', 'comment', 'follow'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === tab
                ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-neutral-400">
          Loading activity...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-neutral-400 text-xs">
          No notifications in this category.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${
                !item.isRead
                  ? 'bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20'
                  : 'bg-white dark:bg-[#0c0a13] border border-neutral-200 dark:border-neutral-800/80 hover:bg-neutral-50 dark:hover:bg-neutral-900/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={item.sender.avatarUrl}
                    alt={item.sender.username}
                    onClick={() => onSelectUser(item.senderId)}
                    className="w-10 h-10 rounded-full object-cover cursor-pointer ring-1 ring-purple-500/20"
                  />
                  <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white dark:bg-neutral-900 shadow">
                    {getIcon(item.type)}
                  </div>
                </div>

                <div className="flex flex-col text-xs">
                  <div>
                    <span
                      onClick={() => onSelectUser(item.senderId)}
                      className="font-bold text-neutral-900 dark:text-white cursor-pointer hover:underline mr-1"
                    >
                      {item.sender.username}
                    </span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {item.text}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-0.5">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {item.postMediaUrl && (
                <img
                  src={item.postMediaUrl}
                  alt="Post preview"
                  className="w-10 h-10 rounded-lg object-cover ml-2 border border-neutral-200 dark:border-neutral-800"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
