/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Lock,
  Eye,
  Shield,
  Ban,
  Download,
  Key,
  LogOut,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { api } from '../services/api.js';
import { User } from '../types.js';

export const SettingsView: React.FC = () => {
  const { currentUser, logout, updateCurrentUser, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isPrivate, setIsPrivate] = useState(currentUser?.isPrivate || false);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordToast, setPasswordToast] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);

  useEffect(() => {
    if (currentUser?.blockedUserIds && currentUser.blockedUserIds.length > 0) {
      api.getUsers().then(res => {
        setBlockedUsers(res.users.filter(u => currentUser.blockedUserIds.includes(u.id)));
      }).catch(console.error);
    } else {
      setBlockedUsers([]);
    }
  }, [currentUser]);

  const handleTogglePrivate = async (val: boolean) => {
    setIsPrivate(val);
    try {
      await updateCurrentUser({ isPrivate: val });
    } catch (err) {
      console.error('Failed to update privacy setting:', err);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await api.toggleBlock(userId);
      await refreshUser();
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Failed to unblock user:', err);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setPasswordToast(true);
    setOldPassword('');
    setNewPassword('');
    setTimeout(() => setPasswordToast(false), 3000);
  };

  const handleDownloadData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentUser, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pixora_account_${currentUser?.username || 'user'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
          Settings & Privacy
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Manage your account preferences, visual appearance, privacy, and security.
        </p>
      </div>

      {/* Visual Appearance & Theme */}
      <section className="p-5 rounded-2xl bg-white dark:bg-[#0c0a13] border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 font-bold text-sm text-neutral-900 dark:text-white">
          {theme === 'dark' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          <span>Display & Theme</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div>
            <span className="text-xs font-bold text-neutral-900 dark:text-white block">
              Dark Mode (Black & Purple Theme)
            </span>
            <span className="text-[11px] text-neutral-500">
              High contrast obsidian dark theme with luminous purple accents.
            </span>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-sm hover:bg-purple-700 transition-colors"
          >
            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>
      </section>

      {/* Account Privacy */}
      <section className="p-5 rounded-2xl bg-white dark:bg-[#0c0a13] border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 font-bold text-sm text-neutral-900 dark:text-white">
          <Lock className="w-4 h-4 text-purple-500" />
          <span>Account Privacy</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div>
            <span className="text-xs font-bold text-neutral-900 dark:text-white block">
              Private Profile
            </span>
            <span className="text-[11px] text-neutral-500">
              When enabled, only accounts you approve can see your photos, stories, and reels.
            </span>
          </div>
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={e => handleTogglePrivate(e.target.checked)}
            className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div>
            <span className="text-xs font-bold text-neutral-900 dark:text-white block">
              Show Activity Status
            </span>
            <span className="text-[11px] text-neutral-500">
              Allow people you message to see when you are active on Pixora.
            </span>
          </div>
          <input
            type="checkbox"
            checked={activityStatus}
            onChange={e => setActivityStatus(e.target.checked)}
            className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
          />
        </div>
      </section>

      {/* Blocked Accounts */}
      <section className="p-5 rounded-2xl bg-white dark:bg-[#0c0a13] border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 font-bold text-sm text-neutral-900 dark:text-white">
          <Ban className="w-4 h-4 text-rose-500" />
          <span>Blocked Accounts ({blockedUsers.length})</span>
        </div>

        {blockedUsers.length === 0 ? (
          <p className="text-xs text-neutral-400 py-2">
            You haven't blocked any accounts. Blocked users cannot message you or see your content.
          </p>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={b.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                      @{b.username}
                    </span>
                    <span className="text-[10px] text-neutral-400">{b.fullName}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleUnblock(b.id)}
                  className="px-3 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Password & Security */}
      <section className="p-5 rounded-2xl bg-white dark:bg-[#0c0a13] border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 font-bold text-sm text-neutral-900 dark:text-white">
          <Key className="w-4 h-4 text-amber-500" />
          <span>Password & Security</span>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              placeholder="Current password"
              className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white"
            />
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password"
              className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between">
            {passwordToast ? (
              <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Password updated!
              </span>
            ) : (
              <span className="text-[11px] text-neutral-400">
                Use 8+ characters with mixed symbols for high security.
              </span>
            )}

            <button
              type="submit"
              disabled={!newPassword}
              className="px-4 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-40"
            >
              Update Password
            </button>
          </div>
        </form>
      </section>

      {/* Data Export & Account Actions */}
      <section className="p-5 rounded-2xl bg-white dark:bg-[#0c0a13] border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 text-purple-500" />
          <div>
            <span className="text-xs font-bold text-neutral-900 dark:text-white block">
              Download Account Data
            </span>
            <span className="text-[11px] text-neutral-500">
              Export an archive of your profile, posts, and saved collections.
            </span>
          </div>
        </div>

        <button
          onClick={handleDownloadData}
          className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          Export JSON
        </button>
      </section>

      {/* Log Out */}
      <div className="pt-2 flex justify-center">
        <button
          onClick={logout}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of Pixora</span>
        </button>
      </div>
    </div>
  );
};
