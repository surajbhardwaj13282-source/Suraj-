/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Home,
  Compass,
  Film,
  Send,
  Heart,
  PlusSquare,
  ShieldAlert,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreate: () => void;
  onOpenAuth: () => void;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
  onOpenAuth,
  unreadMessagesCount,
  unreadNotificationsCount,
}) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'feed', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'reels', label: 'Reels', icon: Film },
    {
      id: 'messages',
      label: 'Messages',
      icon: Send,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Heart,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 border-r border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-[#0c0a13] px-4 py-6 select-none z-30 transition-colors">
      <div className="flex flex-col gap-6">
        {/* Brand Logo */}
        <div
          onClick={() => onSelectTab('feed')}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-500 via-fuchsia-400 to-purple-300 bg-clip-text text-transparent">
              Pixora
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
              Social Canvas
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 mt-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex items-center gap-4 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-purple-600/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900/80 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-6 h-6 transition-transform ${
                      isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                    }`}
                  />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-fuchsia-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-base">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-5 rounded-full bg-purple-500" />
                )}
              </button>
            );
          })}

          {/* Create Button */}
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-4 px-3.5 py-3 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900/80 hover:text-neutral-950 dark:hover:text-white transition-all text-left"
          >
            <PlusSquare className="w-6 h-6 stroke-[1.8] text-purple-500" />
            <span className="text-base font-semibold">Create</span>
          </button>

          {/* Profile Tab */}
          {currentUser && (
            <button
              onClick={() => onSelectTab('profile')}
              className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                currentTab === 'profile'
                  ? 'bg-purple-600/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900/80 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-purple-500/40"
              />
              <span className="text-base truncate">Profile</span>
            </button>
          )}

          {/* Admin Dashboard */}
          {currentUser?.isAdmin && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`flex items-center gap-4 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                currentTab === 'admin'
                  ? 'bg-purple-600/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900/80'
              }`}
            >
              <ShieldAlert className="w-6 h-6 stroke-[1.8] text-amber-500" />
              <span className="text-base">Admin Panel</span>
            </button>
          )}

          {/* Settings Tab */}
          <button
            onClick={() => onSelectTab('settings')}
            className={`flex items-center gap-4 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
              currentTab === 'settings'
                ? 'bg-purple-600/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900/80 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <Settings className="w-6 h-6 stroke-[1.8]" />
            <span className="text-base">Settings</span>
          </button>
        </nav>
      </div>

      {/* Bottom Footer Controls */}
      <div className="flex flex-col gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800/80">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
        >
          <span className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-500" />
            )}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
            {theme}
          </span>
        </button>

        {/* Current User Card or Login Button */}
        {currentUser ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-100/80 dark:bg-neutral-900/80">
            <div
              onClick={() => onSelectTab('profile')}
              className="flex items-center gap-2.5 overflow-hidden cursor-pointer"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-purple-500/30"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {currentUser.fullName}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  @{currentUser.username}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Log Out"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-md shadow-purple-600/30 hover:opacity-95 transition-opacity"
          >
            Log In / Sign Up
          </button>
        )}
      </div>
    </aside>
  );
};
