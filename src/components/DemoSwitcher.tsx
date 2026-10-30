/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { User } from '../types.js';

export const DemoSwitcher: React.FC = () => {
  const { currentUser, switchUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    api.getUsers().then(res => setAllUsers(res.users)).catch(console.error);
  }, []);

  return (
    <div className="fixed bottom-16 md:bottom-6 right-4 z-40">
      <div className="relative">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-neutral-900/90 dark:bg-neutral-800/95 backdrop-blur-md border border-purple-500/30 text-white shadow-xl hover:border-purple-500/60 transition-all text-xs font-semibold"
          title="Switch Demo User for testing interactions"
        >
          <img
            src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775?w=100'}
            alt=""
            className="w-5 h-5 rounded-full object-cover ring-1 ring-purple-400"
          />
          <span className="hidden sm:inline">
            Active: <span className="text-purple-400">{currentUser?.username || 'Guest'}</span>
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 bottom-12 w-64 p-2 bg-white dark:bg-[#12101e] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50 text-xs">
            <div className="px-2.5 py-1.5 border-b border-neutral-100 dark:border-neutral-800 mb-1 flex items-center justify-between">
              <span className="font-bold text-neutral-900 dark:text-white">
                Switch Demo User
              </span>
              <span className="text-[10px] text-purple-500 font-mono">Instant Test</span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {allUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchUser(u);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left ${
                    currentUser?.id === u.id
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={u.avatarUrl}
                      alt={u.username}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-purple-400/40"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{u.fullName}</span>
                      <span className="text-[10px] text-neutral-400">@{u.username}</span>
                    </div>
                  </div>

                  {u.isAdmin && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
