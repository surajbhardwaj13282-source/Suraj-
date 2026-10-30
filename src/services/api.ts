/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Post,
  Comment,
  UserStoryGroup,
  Story,
  Reel,
  Conversation,
  Message,
  NotificationItem,
  Report,
  AdminStats,
} from '../types.js';

const TOKEN_KEY = 'pixora_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) errorMsg = errorJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (identifier: string, password?: string) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),

  register: (payload: { username: string; fullName: string; email?: string; phone?: string; avatarUrl?: string; bio?: string }) =>
    request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  loginGoogle: (payload: { email?: string; name?: string; picture?: string }) =>
    request<{ user: User; token: string }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  // Users
  getUsers: (query?: string) =>
    request<{ users: User[] }>(`/api/users${query ? `?q=${encodeURIComponent(query)}` : ''}`),

  getUserProfile: (id: string) =>
    request<{ user: User; isFollowing: boolean; isBlocked: boolean; isMe: boolean }>(`/api/users/${id}`),

  updateProfile: (id: string, data: Partial<User>) =>
    request<{ user: User }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleFollow: (id: string) =>
    request<{ following: boolean; followersCount: number; followingCount: number }>(`/api/users/${id}/follow`, {
      method: 'POST',
    }),

  toggleBlock: (id: string) =>
    request<{ blocked: boolean; blockedUserIds: string[] }>(`/api/users/${id}/block`, {
      method: 'POST',
    }),

  // Posts
  getPosts: (params?: { authorId?: string; tag?: string; explore?: boolean }) => {
    const sp = new URLSearchParams();
    if (params?.authorId) sp.set('authorId', params.authorId);
    if (params?.tag) sp.set('tag', params.tag);
    if (params?.explore) sp.set('explore', 'true');
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return request<{ posts: Post[] }>(`/api/posts${qs}`);
  },

  createPost: (data: {
    caption: string;
    mediaUrl: string;
    mediaType?: 'image' | 'video';
    location?: string;
    tags?: string[];
    filterPreset?: string;
    aspectRatio?: '1:1' | '4:5' | '16:9';
  }) =>
    request<{ post: Post }>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleLikePost: (id: string) =>
    request<{ isLiked: boolean; likesCount: number }>(`/api/posts/${id}/like`, {
      method: 'POST',
    }),

  toggleSavePost: (id: string) =>
    request<{ isSaved: boolean; savedPostIds: string[] }>(`/api/posts/${id}/save`, {
      method: 'POST',
    }),

  getPostComments: (id: string) =>
    request<{ comments: Comment[] }>(`/api/posts/${id}/comments`),

  addComment: (id: string, text: string) =>
    request<{ comment: Comment }>(`/api/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  deletePost: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/posts/${id}`, {
      method: 'DELETE',
    }),

  // Stories
  getStories: () => request<{ storyGroups: UserStoryGroup[] }>('/api/stories'),

  createStory: (data: { mediaUrl: string; mediaType?: 'image' | 'video'; caption?: string }) =>
    request<{ story: Story }>('/api/stories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markStoryViewed: (id: string) =>
    request<{ success: boolean; viewersCount: number }>(`/api/stories/${id}/view`, {
      method: 'POST',
    }),

  // Reels
  getReels: () => request<{ reels: Reel[] }>('/api/reels'),

  createReel: (data: {
    videoUrl: string;
    caption?: string;
    musicTitle?: string;
    musicArtist?: string;
    audioTone?: string;
    tags?: string[];
  }) =>
    request<{ reel: Reel }>('/api/reels', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleLikeReel: (id: string) =>
    request<{ isLiked: boolean; likesCount: number }>(`/api/reels/${id}/like`, {
      method: 'POST',
    }),

  // Messaging & Conversations
  getConversations: () => request<{ conversations: Conversation[] }>('/api/conversations'),

  createConversation: (data: { participantIds: string[]; isGroup?: boolean; name?: string; avatarUrl?: string }) =>
    request<{ conversation: Conversation }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMessages: (conversationId: string) =>
    request<{ messages: Message[] }>(`/api/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, data: { text?: string; mediaUrl?: string; type?: string; sharedPostId?: string }) =>
    request<{ message: Message }>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleLikeMessage: (id: string) =>
    request<{ liked: boolean }>(`/api/messages/${id}/like`, {
      method: 'POST',
    }),

  deleteMessage: (id: string) =>
    request<{ success: boolean }>(`/api/messages/${id}`, {
      method: 'DELETE',
    }),

  // Notifications
  getNotifications: () =>
    request<{ notifications: NotificationItem[]; unreadCount: number }>('/api/notifications'),

  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/api/notifications/read-all', {
      method: 'PUT',
    }),

  // Reports
  submitReport: (data: {
    targetType: 'post' | 'user' | 'reel';
    targetId: string;
    reason: string;
    details?: string;
    targetAuthorUsername?: string;
    targetPreview?: string;
  }) =>
    request<{ report: Report; message: string }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin
  getAdminStats: () => request<{ stats: AdminStats }>('/api/admin/stats'),

  getAdminReports: () => request<{ reports: Report[] }>('/api/admin/reports'),

  updateAdminReport: (id: string, data: { status?: string; actionTaken?: string }) =>
    request<{ report: Report }>(`/api/admin/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getAdminUsers: () => request<{ users: User[] }>('/api/admin/users'),

  updateUserRole: (id: string, data: { isVerified?: boolean; isAdmin?: boolean; isBanned?: boolean }) =>
    request<{ user: User }>(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  resetDemoDatabase: () => request<{ success: boolean; message: string }>('/api/admin/reset-demo', { method: 'POST' }),
};
