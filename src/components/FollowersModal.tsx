/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { User } from '../types.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface FollowersModalProps {
  title: 'Followers' | 'Following';
  userId: string;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  title,
  userId,
  onClose,
  onSelectUser,
}) => {
  const { currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getUsers()
      .then(res => {
        // Filter out target user
        const otherUsers = res.users.filter(u => u.id !== userId);
        setUsers(otherUsers);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, title]);

  const handleToggleFollow = async (targetId: string) => {
    try {
      await api.toggleFollow(targetId);
      await refreshUser();
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-white dark:bg-[#0e0c16] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-neutral-400">Loading...</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">No users found</div>
          ) : (
            users.map(u => {
              const isFollowing = currentUser?.followingIds?.includes(u.id);
              const isMe = currentUser?.id === u.id;

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors"
                >
                  <div
                    onClick={() => {
                      onClose();
                      onSelectUser(u.id);
                    }}
                    className="flex items-center gap-3 cursor-pointer overflow-hidden"
                  >
                    <img
                      src={u.avatarUrl}
                      alt={u.username}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-purple-500/20"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {u.username}
                        </span>
                        {u.isVerified && (
                          <CheckCircle2 className="w-3 h-3 text-purple-500 fill-purple-500" />
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-500 truncate">
                        {u.fullName}
                      </span>
                    </div>
                  </div>

                  {!isMe && (
                    <button
                      onClick={() => handleToggleFollow(u.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isFollowing
                          ? 'border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-rose-500/10 hover:text-rose-500'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
