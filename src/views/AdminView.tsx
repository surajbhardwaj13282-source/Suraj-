/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Film,
  Image as ImageIcon,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Ban,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AdminStats, Report, User } from '../types.js';
import { api } from '../services/api.js';

export const AdminView: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'moderation' | 'users'>('moderation');
  const [userQuery, setUserQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminReports(),
        api.getAdminUsers(),
      ]);
      setStats(statsRes.stats);
      setReports(reportsRes.reports);
      setUsers(usersRes.users);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 3000);
  };

  // Handle report action
  const handleResolveReport = async (reportId: string, action: 'dismiss' | 'delete_post' | 'ban_user') => {
    try {
      await api.updateAdminReport(reportId, {
        status: action === 'dismiss' ? 'dismissed' : 'resolved',
        actionTaken: action,
      });
      showToast(`Action executed: ${action}`);
      fetchAdminData();
    } catch (err) {
      console.error('Failed to update report:', err);
    }
  };

  // Update user privilege
  const handleToggleVerified = async (targetUser: User) => {
    try {
      const res = await api.updateUserRole(targetUser.id, {
        isVerified: !targetUser.isVerified,
      });
      setUsers(prev => prev.map(u => (u.id === targetUser.id ? res.user : u)));
      showToast(`Verification status updated for @${targetUser.username}`);
    } catch (err) {
      console.error('Failed to update user verified badge:', err);
    }
  };

  const handleToggleBan = async (targetUser: User) => {
    try {
      const res = await api.updateUserRole(targetUser.id, {
        isBanned: !targetUser.isBanned,
      });
      setUsers(prev => prev.map(u => (u.id === targetUser.id ? res.user : u)));
      showToast(`Account status updated for @${targetUser.username}`);
    } catch (err) {
      console.error('Failed to toggle ban:', err);
    }
  };

  const handleToggleAdmin = async (targetUser: User) => {
    try {
      const res = await api.updateUserRole(targetUser.id, {
        isAdmin: !targetUser.isAdmin,
      });
      setUsers(prev => prev.map(u => (u.id === targetUser.id ? res.user : u)));
      showToast(`Admin privileges updated for @${targetUser.username}`);
    } catch (err) {
      console.error('Failed to update admin role:', err);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('Are you sure you want to restore the initial demo state?')) return;
    try {
      await api.resetDemoDatabase();
      showToast('Database reset successfully.');
      fetchAdminData();
    } catch (err) {
      console.error('Failed to reset database:', err);
    }
  };

  const filteredUsers = users.filter(
    u =>
      u.username.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.fullName.toLowerCase().includes(userQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ShieldAlert className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white">
              Trust & Safety Dashboard
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            System moderation, community safety, user verification, and platform telemetry
          </p>
        </div>

        <button
          onClick={handleResetDatabase}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-purple-500" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {actionMessage && (
        <div className="mb-4 p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-xs font-semibold animate-in fade-in duration-200">
          {actionMessage}
        </div>
      )}

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c0a13] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase">Users</span>
            <span className="text-xl font-extrabold text-neutral-900 dark:text-white">
              {stats.totalUsers}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c0a13] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase">Posts</span>
            <span className="text-xl font-extrabold text-neutral-900 dark:text-white">
              {stats.totalPosts}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c0a13] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase">Reels</span>
            <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400">
              {stats.totalReels}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c0a13] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase">Stories</span>
            <span className="text-xl font-extrabold text-fuchsia-600 dark:text-fuchsia-400">
              {stats.totalStories}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c0a13] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase">Total Likes</span>
            <span className="text-xl font-extrabold text-rose-500">
              {stats.totalLikes.toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c0a13] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase">Reports</span>
            <span className="text-xl font-extrabold text-amber-500">
              {stats.pendingReports}
            </span>
          </div>
        </div>
      )}

      {/* Segmented Tab Controls */}
      <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-2xl mb-6 border border-neutral-200 dark:border-neutral-800 w-fit">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'moderation'
              ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Moderation Queue ({reports.filter(r => r.status === 'pending').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-purple-500" />
          <span>User Directory ({users.length})</span>
        </button>
      </div>

      {/* Moderation Queue Tab */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 text-xs">
              No reports filed. Community is healthy and active!
            </div>
          ) : (
            reports.map(rep => (
              <div
                key={rep.id}
                className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                  rep.status === 'pending'
                    ? 'bg-white dark:bg-[#0c0a13] border-amber-500/30'
                    : 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                }`}
              >
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      {rep.reason}
                    </span>
                    <span className="text-xs font-semibold text-neutral-500">
                      Reported by @{rep.reporterUsername}
                    </span>
                    <span className="text-neutral-400 text-xs">·</span>
                    <span className="text-[11px] text-neutral-400">
                      Target: {rep.targetType} {rep.targetAuthorUsername ? `@${rep.targetAuthorUsername}` : ''}
                    </span>
                  </div>

                  {rep.targetPreview && (
                    <p className="text-xs text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 font-mono">
                      "{rep.targetPreview}"
                    </p>
                  )}

                  {rep.details && (
                    <span className="text-[11px] text-neutral-500">
                      Details: {rep.details}
                    </span>
                  )}
                </div>

                {/* Actions */}
                {rep.status === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolveReport(rep.id, 'dismiss')}
                      className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      Dismiss
                    </button>
                    {rep.targetType === 'post' && (
                      <button
                        onClick={() => handleResolveReport(rep.id, 'delete_post')}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                      >
                        Remove Post
                      </button>
                    )}
                    <button
                      onClick={() => handleResolveReport(rep.id, 'ban_user')}
                      className="px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-neutral-800 text-white text-xs font-bold hover:bg-black"
                    >
                      Suspend User
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> {rep.status} ({rep.actionTaken || 'resolved'})
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Users Directory Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <input
            type="text"
            value={userQuery}
            onChange={e => setUserQuery(e.target.value)}
            placeholder="Search accounts by username or name..."
            className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0a13]">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Verification</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Moderation Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/80">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatarUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-900 dark:text-white">
                            {u.fullName}
                          </span>
                          <span className="text-[10px] text-neutral-400">@{u.username}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.isAdmin
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}>
                        {u.isAdmin ? 'Admin' : 'Creator'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-purple-500 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-neutral-400">Standard</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      {u.isBanned ? (
                        <span className="text-rose-500 font-bold">Suspended</span>
                      ) : (
                        <span className="text-emerald-500 font-semibold">Active</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleVerified(u)}
                          className="px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 text-[11px] font-semibold hover:border-purple-500"
                        >
                          {u.isVerified ? 'Revoke Badge' : 'Grant Badge'}
                        </button>

                        <button
                          onClick={() => handleToggleAdmin(u)}
                          className="px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 text-[11px] font-semibold hover:border-amber-500"
                        >
                          {u.isAdmin ? 'Demote' : 'Make Admin'}
                        </button>

                        <button
                          onClick={() => handleToggleBan(u)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                            u.isBanned
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white'
                          }`}
                        >
                          {u.isBanned ? 'Unban' : 'Suspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
