/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Compass, Film, PlusSquare, Send, Heart, Sparkles, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';

interface HeaderProps {
  onSelectTab: (tab: string) => void;
  onOpenCreate: () => void;
  onOpenAuth: () => void;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectTab,
  onOpenCreate,
  onOpenAuth,
  unreadMessagesCount,
  unreadNotificationsCount,
}) => {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="md:hidden sticky top-0 z-40 w-full h-14 bg-white/95 dark:bg-[#0c0a13]/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800/80 px-4 flex items-center justify-between">
      {/* Brand */}
      <div
        onClick={() => onSelectTab('feed')}
        className="flex items-center gap-2 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-purple-500 via-fuchsia-400 to-purple-300 bg-clip-text text-transparent">
          Pixora
        </span>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-full text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
        </button>

        <button
          onClick={() => onSelectTab('notifications')}
          className="relative p-2 rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <Heart className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-fuchsia-500" />
          )}
        </button>

        <button
          onClick={() => onSelectTab('messages')}
          className="relative p-2 rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <Send className="w-5 h-5" />
          {unreadMessagesCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-500" />
          )}
        </button>
      </div>
    </header>
  );
};

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreate: () => void;
  onOpenAuth: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
  onOpenAuth,
}) => {
  const { currentUser } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 dark:bg-[#0c0a13]/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800/80 px-4 flex items-center justify-around">
      <button
        onClick={() => onSelectTab('feed')}
        className={`p-2 transition-colors ${
          currentTab === 'feed' ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-600 dark:text-neutral-400'
        }`}
      >
        <Home className={`w-6 h-6 ${currentTab === 'feed' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
      </button>

      <button
        onClick={() => onSelectTab('explore')}
        className={`p-2 transition-colors ${
          currentTab === 'explore' ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-600 dark:text-neutral-400'
        }`}
      >
        <Compass className={`w-6 h-6 ${currentTab === 'explore' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
      </button>

      <button
        onClick={onOpenCreate}
        className="p-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30"
      >
        <PlusSquare className="w-6 h-6" />
      </button>

      <button
        onClick={() => onSelectTab('reels')}
        className={`p-2 transition-colors ${
          currentTab === 'reels' ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-600 dark:text-neutral-400'
        }`}
      >
        <Film className={`w-6 h-6 ${currentTab === 'reels' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
      </button>

      {currentUser ? (
        <button
          onClick={() => onSelectTab('profile')}
          className={`p-1 rounded-full ${
            currentTab === 'profile' ? 'ring-2 ring-purple-500' : ''
          }`}
        >
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.fullName}
            className="w-6 h-6 rounded-full object-cover"
          />
        </button>
      ) : (
        <button
          onClick={onOpenAuth}
          className="text-xs font-semibold text-purple-600 dark:text-purple-400"
        >
          Log In
        </button>
      )}
    </nav>
  );
};
