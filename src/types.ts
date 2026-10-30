/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl: string;
  bio: string;
  website?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  isAdmin: boolean;
  isPrivate: boolean;
  isBanned?: boolean;
  blockedUserIds: string[];
  savedPostIds: string[];
  followingIds: string[];
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string;
    isVerified: boolean;
  };
  caption: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  filterPreset?: string;
  aspectRatio?: '1:1' | '4:5' | '16:9';
  location?: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  likedUserIds: string[];
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string;
    isVerified: boolean;
  };
  text: string;
  likesCount: number;
  isLiked?: boolean;
  likedUserIds: string[];
  createdAt: string;
}

export interface Story {
  id: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string;
    isVerified: boolean;
  };
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  createdAt: string;
  expiresAt: string;
  viewersCount: number;
  viewedByMe?: boolean;
  viewedUserIds: string[];
}

export interface UserStoryGroup {
  author: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string;
    isVerified: boolean;
  };
  stories: Story[];
  allViewed: boolean;
}

export interface Reel {
  id: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string;
    isVerified: boolean;
  };
  videoUrl: string;
  thumbnailUrl?: string;
  caption: string;
  musicTitle: string;
  musicArtist: string;
  audioFrequency?: number;
  audioTone?: 'ambient' | 'synth' | 'lofi' | 'techno' | 'hiphop';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  likedUserIds: string[];
  tags: string[];
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string;
  };
  text: string;
  mediaUrl?: string;
  type: 'text' | 'image' | 'story_reply' | 'post_share';
  sharedPostId?: string;
  liked: boolean;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name?: string;
  avatarUrl?: string;
  participantIds: string[];
  participants: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string;
    isVerified: boolean;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    avatarUrl: string;
    isVerified: boolean;
  };
  type: 'like' | 'comment' | 'follow' | 'mention' | 'story_reply';
  postId?: string;
  postMediaUrl?: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterUsername: string;
  targetType: 'post' | 'user' | 'reel';
  targetId: string;
  targetAuthorUsername?: string;
  targetPreview?: string;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'copyright' | 'hate_speech' | 'other';
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  actionTaken?: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalStories: number;
  totalReels: number;
  totalMessages: number;
  pendingReports: number;
  totalLikes: number;
  activeToday: number;
}
