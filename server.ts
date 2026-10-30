/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  User,
  Post,
  Comment,
  Story,
  Reel,
  Conversation,
  Message,
  NotificationItem,
  Report,
  AdminStats,
} from './src/types.js';
import {
  SEED_USERS,
  SEED_POSTS,
  SEED_STORIES,
  SEED_REELS,
  SEED_CONVERSATIONS,
  SEED_MESSAGES,
  SEED_NOTIFICATIONS,
  SEED_REPORTS,
} from './src/server/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'pixora_db.json');

interface DatabaseSchema {
  users: User[];
  posts: Post[];
  comments: Comment[];
  stories: Story[];
  reels: Reel[];
  conversations: Conversation[];
  messages: Message[];
  notifications: NotificationItem[];
  reports: Report[];
}

const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'comm_1',
    postId: 'post_1',
    authorId: 'user_marcus',
    author: {
      id: 'user_marcus',
      username: 'marcus_wander',
      fullName: 'Marcus Vance',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      isVerified: true,
    },
    text: 'The color grading on the neon puddles is sublime Elena! 🌧️✨',
    likesCount: 14,
    likedUserIds: ['user_elena', 'user_zara'],
    createdAt: '2026-10-29T18:35:00Z',
  },
  {
    id: 'comm_2',
    postId: 'post_1',
    authorId: 'user_zara',
    author: {
      id: 'user_zara',
      username: 'zara_style',
      fullName: 'Zara Al-Mansoor',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      isVerified: true,
    },
    text: 'The purple reflections are pure poetry! Need this framed in the studio.',
    likesCount: 22,
    likedUserIds: ['user_elena'],
    createdAt: '2026-10-29T18:45:00Z',
  },
  {
    id: 'comm_3',
    postId: 'post_2',
    authorId: 'user_elena',
    author: {
      id: 'user_elena',
      username: 'elena_captures',
      fullName: 'Elena Rostova',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      isVerified: true,
    },
    text: 'Unbelievable clarity Marcus! Did you do exposure stacking on the foreground?',
    likesCount: 9,
    likedUserIds: ['user_marcus'],
    createdAt: '2026-10-29T15:25:00Z',
  },
];

// Persistent database helper
let db: DatabaseSchema;

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Failed to load database file, initializing defaults:', err);
  }

  const initialDb: DatabaseSchema = {
    users: SEED_USERS,
    posts: SEED_POSTS,
    comments: INITIAL_COMMENTS,
    stories: SEED_STORIES,
    reels: SEED_REELS,
    conversations: SEED_CONVERSATIONS,
    messages: SEED_MESSAGES,
    notifications: SEED_NOTIFICATIONS,
    reports: SEED_REPORTS,
  };
  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(dataToSave: DatabaseSchema = db) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database file:', err);
  }
}

db = loadDatabase();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to authenticate request
function getAuthUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const user = db.users.find(u => u.id === token || u.email === token || u.username === token);
  return user || null;
}

// ================= API ROUTES =================

// Auth: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Username, email or phone is required' });
  }

  const cleanId = String(identifier).toLowerCase().trim();
  const user = db.users.find(
    u =>
      u.email.toLowerCase() === cleanId ||
      u.username.toLowerCase() === cleanId ||
      (u.phone && u.phone.includes(cleanId))
  );

  if (!user) {
    return res.status(401).json({ error: 'No account found with those credentials' });
  }

  if (user.isBanned) {
    return res.status(403).json({ error: 'This account has been suspended by administration.' });
  }

  return res.json({
    user,
    token: user.id,
  });
});

// Auth: Register (Email, Phone, Google)
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, fullName, email, phone, avatarUrl, bio } = req.body;
  if (!username || !fullName || (!email && !phone)) {
    return res.status(400).json({ error: 'Username, full name and email or phone are required.' });
  }

  const cleanUsername = String(username).toLowerCase().replace(/[^a-z0-9_.]/g, '');
  if (db.users.some(u => u.username.toLowerCase() === cleanUsername)) {
    return res.status(409).json({ error: 'Username is already taken. Try another.' });
  }

  const newUser: User = {
    id: `user_${Date.now()}`,
    username: cleanUsername,
    fullName,
    email: email || `${cleanUsername}@pixora.social`,
    phone: phone || undefined,
    avatarUrl:
      avatarUrl ||
      `https://images.unsplash.com/photo-${1534528741775 + (db.users.length % 50)}?auto=format&fit=crop&w=400&q=80`,
    bio: bio || 'Hello Pixora! ✨ Just joined the creative community.',
    website: '',
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    isVerified: false,
    isAdmin: false,
    isPrivate: false,
    blockedUserIds: [],
    savedPostIds: [],
    followingIds: [],
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase();

  return res.status(201).json({
    user: newUser,
    token: newUser.id,
  });
});

// Auth: Instant Google Login Demo
app.post('/api/auth/google', (req: Request, res: Response) => {
  const { email, name, picture } = req.body;
  const userEmail = email || 'google.creator@pixora.social';
  let user = db.users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());

  if (!user) {
    const baseUser = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
    user = {
      id: `user_g_${Date.now()}`,
      username: baseUser,
      fullName: name || 'Google Explorer',
      email: userEmail,
      avatarUrl: picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      bio: 'Exploring creative horizons via Google Sign-In 🚀',
      website: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isVerified: false,
      isAdmin: userEmail.includes('roshanraj60851@gmail.com') || userEmail.includes('admin'),
      isPrivate: false,
      blockedUserIds: [],
      savedPostIds: [],
      followingIds: ['user_elena', 'user_marcus'],
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDatabase();
  }

  return res.json({
    user,
    token: user.id,
  });
});

// Auth: Me
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ user });
});

// Users: List / Search
app.get('/api/users', (req: Request, res: Response) => {
  const q = req.query.q ? String(req.query.q).toLowerCase().trim() : '';
  const currentUser = getAuthUser(req);

  let results = db.users.filter(u => !u.isBanned);
  if (currentUser) {
    // Filter out users who blocked current user or whom current user blocked
    results = results.filter(u => !currentUser.blockedUserIds?.includes(u.id));
  }

  if (q) {
    results = results.filter(
      u =>
        u.username.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.bio.toLowerCase().includes(q)
    );
  }

  return res.json({ users: results });
});

// Users: Get Profile
app.get('/api/users/:id', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  const targetId = req.params.id;
  const user = db.users.find(u => u.id === targetId || u.username.toLowerCase() === targetId.toLowerCase());

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isFollowing = currentUser ? currentUser.followingIds.includes(user.id) : false;
  const isBlocked = currentUser ? currentUser.blockedUserIds.includes(user.id) : false;

  return res.json({
    user,
    isFollowing,
    isBlocked,
    isMe: currentUser ? currentUser.id === user.id : false,
  });
});

// Users: Update Profile
app.put('/api/users/:id', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  if (currentUser.id !== req.params.id && !currentUser.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { fullName, bio, website, avatarUrl, isPrivate } = req.body;
  if (fullName !== undefined) user.fullName = fullName;
  if (bio !== undefined) user.bio = bio;
  if (website !== undefined) user.website = website;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (isPrivate !== undefined) user.isPrivate = Boolean(isPrivate);

  // Sync author details across their posts and stories
  db.posts.forEach(p => {
    if (p.authorId === user.id) {
      p.author.fullName = user.fullName;
      p.author.avatarUrl = user.avatarUrl;
    }
  });

  saveDatabase();
  return res.json({ user });
});

// Users: Follow / Unfollow Toggle
app.post('/api/users/:id/follow', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const targetUser = db.users.find(u => u.id === req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });
  if (currentUser.id === targetUser.id) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  if (!currentUser.followingIds) currentUser.followingIds = [];
  const isCurrentlyFollowing = currentUser.followingIds.includes(targetUser.id);

  if (isCurrentlyFollowing) {
    currentUser.followingIds = currentUser.followingIds.filter(id => id !== targetUser.id);
    currentUser.followingCount = Math.max(0, currentUser.followingCount - 1);
    targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);
  } else {
    currentUser.followingIds.push(targetUser.id);
    currentUser.followingCount += 1;
    targetUser.followersCount += 1;

    // Send follow notification
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      recipientId: targetUser.id,
      senderId: currentUser.id,
      sender: {
        id: currentUser.id,
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl,
        isVerified: currentUser.isVerified,
      },
      type: 'follow',
      text: 'started following you.',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  saveDatabase();
  return res.json({
    following: !isCurrentlyFollowing,
    followersCount: targetUser.followersCount,
    followingCount: currentUser.followingCount,
  });
});

// Users: Block / Unblock Toggle
app.post('/api/users/:id/block', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const targetId = req.params.id;
  if (!currentUser.blockedUserIds) currentUser.blockedUserIds = [];

  const isBlocked = currentUser.blockedUserIds.includes(targetId);
  if (isBlocked) {
    currentUser.blockedUserIds = currentUser.blockedUserIds.filter(id => id !== targetId);
  } else {
    currentUser.blockedUserIds.push(targetId);
    // Remove from following if blocked
    currentUser.followingIds = (currentUser.followingIds || []).filter(id => id !== targetId);
  }

  saveDatabase();
  return res.json({ blocked: !isBlocked, blockedUserIds: currentUser.blockedUserIds });
});

// Posts: Feed & Search
app.get('/api/posts', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  const { authorId, tag, explore } = req.query;

  let posts = [...db.posts];

  // Filter blocked users
  if (currentUser && currentUser.blockedUserIds) {
    posts = posts.filter(p => !currentUser.blockedUserIds.includes(p.authorId));
  }

  if (authorId) {
    posts = posts.filter(p => p.authorId === String(authorId));
  }

  if (tag) {
    const cleanTag = String(tag).toLowerCase().replace(/^#/, '');
    posts = posts.filter(p => p.tags.some(t => t.toLowerCase() === cleanTag));
  }

  // Map user-specific state (isLiked, isSaved)
  const mapped = posts.map(p => ({
    ...p,
    isLiked: currentUser ? p.likedUserIds?.includes(currentUser.id) : false,
    isSaved: currentUser ? currentUser.savedPostIds?.includes(p.id) : false,
  }));

  return res.json({ posts: mapped });
});

// Posts: Create Post
app.post('/api/posts', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const { caption, mediaUrl, mediaType, location, tags, filterPreset, aspectRatio } = req.body;
  if (!mediaUrl) return res.status(400).json({ error: 'Media URL is required' });

  const extractedTags: string[] = Array.isArray(tags)
    ? tags
    : (caption || '').match(/#([a-zA-Z0-9_]+)/g)?.map((t: string) => t.slice(1).toLowerCase()) || [];

  const newPost: Post = {
    id: `post_${Date.now()}`,
    authorId: currentUser.id,
    author: {
      id: currentUser.id,
      username: currentUser.username,
      fullName: currentUser.fullName,
      avatarUrl: currentUser.avatarUrl,
      isVerified: currentUser.isVerified,
    },
    caption: caption || '',
    mediaUrl,
    mediaType: mediaType === 'video' ? 'video' : 'image',
    filterPreset: filterPreset || 'none',
    aspectRatio: aspectRatio || '4:5',
    location: location || '',
    tags: extractedTags,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    likedUserIds: [],
    createdAt: new Date().toISOString(),
  };

  db.posts.unshift(newPost);
  currentUser.postsCount = (currentUser.postsCount || 0) + 1;
  saveDatabase();

  return res.status(201).json({ post: newPost });
});

// Posts: Toggle Like
app.post('/api/posts/:id/like', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  if (!post.likedUserIds) post.likedUserIds = [];
  const isLiked = post.likedUserIds.includes(currentUser.id);

  if (isLiked) {
    post.likedUserIds = post.likedUserIds.filter(id => id !== currentUser.id);
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    post.likedUserIds.push(currentUser.id);
    post.likesCount += 1;

    // Send notification if not liking own post
    if (post.authorId !== currentUser.id) {
      db.notifications.unshift({
        id: `notif_${Date.now()}`,
        recipientId: post.authorId,
        senderId: currentUser.id,
        sender: {
          id: currentUser.id,
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl,
          isVerified: currentUser.isVerified,
        },
        type: 'like',
        postId: post.id,
        postMediaUrl: post.mediaUrl,
        text: 'liked your post.',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  saveDatabase();
  return res.json({ isLiked: !isLiked, likesCount: post.likesCount });
});

// Posts: Toggle Save / Bookmark
app.post('/api/posts/:id/save', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  if (!currentUser.savedPostIds) currentUser.savedPostIds = [];
  const postId = req.params.id;
  const isSaved = currentUser.savedPostIds.includes(postId);

  if (isSaved) {
    currentUser.savedPostIds = currentUser.savedPostIds.filter(id => id !== postId);
  } else {
    currentUser.savedPostIds.push(postId);
  }

  saveDatabase();
  return res.json({ isSaved: !isSaved, savedPostIds: currentUser.savedPostIds });
});

// Posts: Comments List
app.get('/api/posts/:id/comments', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  const postId = req.params.id;
  const comments = db.comments
    .filter(c => c.postId === postId)
    .map(c => ({
      ...c,
      isLiked: currentUser ? c.likedUserIds?.includes(currentUser.id) : false,
    }));

  return res.json({ comments });
});

// Posts: Add Comment
app.post('/api/posts/:id/comments', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text is required' });

  const newComment: Comment = {
    id: `comm_${Date.now()}`,
    postId: post.id,
    authorId: currentUser.id,
    author: {
      id: currentUser.id,
      username: currentUser.username,
      fullName: currentUser.fullName,
      avatarUrl: currentUser.avatarUrl,
      isVerified: currentUser.isVerified,
    },
    text: text.trim(),
    likesCount: 0,
    likedUserIds: [],
    createdAt: new Date().toISOString(),
  };

  db.comments.push(newComment);
  post.commentsCount = (post.commentsCount || 0) + 1;

  // Send notification to post author
  if (post.authorId !== currentUser.id) {
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      recipientId: post.authorId,
      senderId: currentUser.id,
      sender: {
        id: currentUser.id,
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl,
        isVerified: currentUser.isVerified,
      },
      type: 'comment',
      postId: post.id,
      postMediaUrl: post.mediaUrl,
      text: `commented: "${text.trim().slice(0, 50)}${text.trim().length > 50 ? '...' : ''}"`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  saveDatabase();
  return res.status(201).json({ comment: newComment });
});

// Posts: Delete Post
app.delete('/api/posts/:id', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const postIndex = db.posts.findIndex(p => p.id === req.params.id);
  if (postIndex === -1) return res.status(404).json({ error: 'Post not found' });

  const post = db.posts[postIndex];
  if (post.authorId !== currentUser.id && !currentUser.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.posts.splice(postIndex, 1);
  db.comments = db.comments.filter(c => c.postId !== post.id);
  currentUser.postsCount = Math.max(0, (currentUser.postsCount || 1) - 1);

  saveDatabase();
  return res.json({ success: true, message: 'Post deleted' });
});

// Stories: Get Active Stories
app.get('/api/stories', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  const now = new Date();

  // Filter out expired stories (>24h)
  const activeStories = db.stories.filter(s => new Date(s.expiresAt) > now);

  // Group by author
  const authorMap = new Map<string, Story[]>();
  activeStories.forEach(s => {
    if (!authorMap.has(s.authorId)) {
      authorMap.set(s.authorId, []);
    }
    authorMap.get(s.authorId)!.push({
      ...s,
      viewedByMe: currentUser ? s.viewedUserIds?.includes(currentUser.id) : false,
    });
  });

  const storyGroups = Array.from(authorMap.entries()).map(([authorId, stories]) => {
    const author = stories[0].author;
    const allViewed = currentUser ? stories.every(s => s.viewedUserIds?.includes(currentUser.id)) : false;
    return {
      author,
      stories,
      allViewed,
    };
  });

  return res.json({ storyGroups });
});

// Stories: Create Story
app.post('/api/stories', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const { mediaUrl, mediaType, caption } = req.body;
  if (!mediaUrl) return res.status(400).json({ error: 'Story media is required' });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const newStory: Story = {
    id: `story_${Date.now()}`,
    authorId: currentUser.id,
    author: {
      id: currentUser.id,
      username: currentUser.username,
      fullName: currentUser.fullName,
      avatarUrl: currentUser.avatarUrl,
      isVerified: currentUser.isVerified,
    },
    mediaUrl,
    mediaType: mediaType === 'video' ? 'video' : 'image',
    caption: caption || '',
    createdAt: now.toISOString(),
    expiresAt,
    viewersCount: 0,
    viewedUserIds: [],
  };

  db.stories.unshift(newStory);
  saveDatabase();

  return res.status(201).json({ story: newStory });
});

// Stories: Mark Viewed
app.post('/api/stories/:id/view', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  const story = db.stories.find(s => s.id === req.params.id);
  if (!story) return res.status(404).json({ error: 'Story not found' });

  if (currentUser) {
    if (!story.viewedUserIds) story.viewedUserIds = [];
    if (!story.viewedUserIds.includes(currentUser.id)) {
      story.viewedUserIds.push(currentUser.id);
      story.viewersCount += 1;
      saveDatabase();
    }
  }

  return res.json({ success: true, viewersCount: story.viewersCount });
});

// Reels: Get Reels Feed
app.get('/api/reels', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  const reels = db.reels.map(r => ({
    ...r,
    isLiked: currentUser ? r.likedUserIds?.includes(currentUser.id) : false,
    isSaved: currentUser ? currentUser.savedPostIds?.includes(r.id) : false,
  }));

  return res.json({ reels });
});

// Reels: Create Reel
app.post('/api/reels', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const { videoUrl, caption, musicTitle, musicArtist, audioTone, tags } = req.body;
  if (!videoUrl) return res.status(400).json({ error: 'Video URL is required' });

  const newReel: Reel = {
    id: `reel_${Date.now()}`,
    authorId: currentUser.id,
    author: {
      id: currentUser.id,
      username: currentUser.username,
      fullName: currentUser.fullName,
      avatarUrl: currentUser.avatarUrl,
      isVerified: currentUser.isVerified,
    },
    videoUrl,
    caption: caption || '',
    musicTitle: musicTitle || 'Original Audio',
    musicArtist: musicArtist || currentUser.fullName,
    audioTone: audioTone || 'synth',
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    likedUserIds: [],
    tags: tags || ['reels', 'pixora'],
    createdAt: new Date().toISOString(),
  };

  db.reels.unshift(newReel);
  saveDatabase();

  return res.status(201).json({ reel: newReel });
});

// Reels: Like Toggle
app.post('/api/reels/:id/like', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const reel = db.reels.find(r => r.id === req.params.id);
  if (!reel) return res.status(404).json({ error: 'Reel not found' });

  if (!reel.likedUserIds) reel.likedUserIds = [];
  const isLiked = reel.likedUserIds.includes(currentUser.id);

  if (isLiked) {
    reel.likedUserIds = reel.likedUserIds.filter(id => id !== currentUser.id);
    reel.likesCount = Math.max(0, reel.likesCount - 1);
  } else {
    reel.likedUserIds.push(currentUser.id);
    reel.likesCount += 1;
  }

  saveDatabase();
  return res.json({ isLiked: !isLiked, likesCount: reel.likesCount });
});

// Conversations: List for user
app.get('/api/conversations', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const userConversations = db.conversations.filter(c => c.participantIds.includes(currentUser.id));

  // Attach last message
  userConversations.forEach(c => {
    const msgs = db.messages.filter(m => m.conversationId === c.id);
    if (msgs.length > 0) {
      c.lastMessage = msgs[msgs.length - 1];
    }
  });

  return res.json({ conversations: userConversations });
});

// Conversations: Create Direct or Group
app.post('/api/conversations', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const { participantIds, isGroup, name, avatarUrl } = req.body;
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    return res.status(400).json({ error: 'Participants are required' });
  }

  const allParticipantIds = Array.from(new Set([currentUser.id, ...participantIds]));

  // If 1-on-1, check if conversation already exists
  if (!isGroup && allParticipantIds.length === 2) {
    const existing = db.conversations.find(
      c =>
        !c.isGroup &&
        c.participantIds.length === 2 &&
        c.participantIds.includes(allParticipantIds[0]) &&
        c.participantIds.includes(allParticipantIds[1])
    );
    if (existing) {
      return res.json({ conversation: existing });
    }
  }

  const participants = db.users
    .filter(u => allParticipantIds.includes(u.id))
    .map(u => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl,
      isVerified: u.isVerified,
    }));

  const newConv: Conversation = {
    id: `conv_${Date.now()}`,
    isGroup: Boolean(isGroup),
    name: isGroup ? name || 'New Creative Group' : undefined,
    avatarUrl: avatarUrl || undefined,
    participantIds: allParticipantIds,
    participants,
    unreadCount: 0,
    updatedAt: new Date().toISOString(),
  };

  db.conversations.unshift(newConv);
  saveDatabase();

  return res.status(201).json({ conversation: newConv });
});

// Messages: Get messages for conversation
app.get('/api/conversations/:id/messages', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const conv = db.conversations.find(c => c.id === req.params.id);
  if (!conv || !conv.participantIds.includes(currentUser.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const messages = db.messages.filter(m => m.conversationId === conv.id);
  // Mark as read
  messages.forEach(m => {
    if (m.senderId !== currentUser.id) m.isRead = true;
  });
  conv.unreadCount = 0;
  saveDatabase();

  return res.json({ messages });
});

// Messages: Send Message
app.post('/api/conversations/:id/messages', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const conv = db.conversations.find(c => c.id === req.params.id);
  if (!conv || !conv.participantIds.includes(currentUser.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { text, mediaUrl, type, sharedPostId } = req.body;
  if (!text && !mediaUrl) {
    return res.status(400).json({ error: 'Message content cannot be empty' });
  }

  const newMessage: Message = {
    id: `msg_${Date.now()}`,
    conversationId: conv.id,
    senderId: currentUser.id,
    sender: {
      id: currentUser.id,
      username: currentUser.username,
      fullName: currentUser.fullName,
      avatarUrl: currentUser.avatarUrl,
    },
    text: text || '',
    mediaUrl: mediaUrl || undefined,
    type: type || (mediaUrl ? 'image' : 'text'),
    sharedPostId: sharedPostId || undefined,
    liked: false,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  db.messages.push(newMessage);
  conv.lastMessage = newMessage;
  conv.updatedAt = newMessage.createdAt;

  saveDatabase();
  return res.status(201).json({ message: newMessage });
});

// Messages: Toggle Like
app.post('/api/messages/:id/like', (req: Request, res: Response) => {
  const message = db.messages.find(m => m.id === req.params.id);
  if (!message) return res.status(404).json({ error: 'Message not found' });

  message.liked = !message.liked;
  saveDatabase();
  return res.json({ liked: message.liked });
});

// Messages: Delete (Unsend)
app.delete('/api/messages/:id', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const index = db.messages.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Message not found' });

  const msg = db.messages[index];
  if (msg.senderId !== currentUser.id && !currentUser.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.messages.splice(index, 1);
  saveDatabase();
  return res.json({ success: true });
});

// Notifications: Get list
app.get('/api/notifications', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const list = db.notifications.filter(n => n.recipientId === currentUser.id);
  const unreadCount = list.filter(n => !n.isRead).length;

  return res.json({ notifications: list, unreadCount });
});

// Notifications: Mark All as Read
app.put('/api/notifications/read-all', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  db.notifications.forEach(n => {
    if (n.recipientId === currentUser.id) {
      n.isRead = true;
    }
  });

  saveDatabase();
  return res.json({ success: true });
});

// Reports: Submit Report
app.post('/api/reports', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  const { targetType, targetId, reason, details, targetAuthorUsername, targetPreview } = req.body;
  if (!targetType || !targetId || !reason) {
    return res.status(400).json({ error: 'Target type, target ID and reason are required' });
  }

  const newReport: Report = {
    id: `rep_${Date.now()}`,
    reporterId: currentUser.id,
    reporterUsername: currentUser.username,
    targetType,
    targetId,
    targetAuthorUsername: targetAuthorUsername || undefined,
    targetPreview: targetPreview || undefined,
    reason,
    details: details || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.reports.unshift(newReport);
  saveDatabase();

  return res.status(201).json({ report: newReport, message: 'Report submitted successfully. Our Trust & Safety team will review it.' });
});

// Admin: Statistics
app.get('/api/admin/stats', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser || !currentUser.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const totalLikes = db.posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
  const pendingReports = db.reports.filter(r => r.status === 'pending').length;

  const stats: AdminStats = {
    totalUsers: db.users.length,
    totalPosts: db.posts.length,
    totalStories: db.stories.length,
    totalReels: db.reels.length,
    totalMessages: db.messages.length,
    pendingReports,
    totalLikes,
    activeToday: Math.round(db.users.length * 0.8),
  };

  return res.json({ stats });
});

// Admin: Reports List
app.get('/api/admin/reports', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser || !currentUser.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  return res.json({ reports: db.reports });
});

// Admin: Resolve / Take Action on Report
app.put('/api/admin/reports/:id', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser || !currentUser.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const report = db.reports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  const { status, actionTaken } = req.body;
  if (status) report.status = status;
  if (actionTaken) report.actionTaken = actionTaken;

  if (actionTaken === 'delete_post') {
    db.posts = db.posts.filter(p => p.id !== report.targetId);
  } else if (actionTaken === 'ban_user') {
    const userToBan = db.users.find(u => u.id === report.targetId || u.username === report.targetAuthorUsername);
    if (userToBan) userToBan.isBanned = true;
  }

  saveDatabase();
  return res.json({ report });
});

// Admin: User Management List
app.get('/api/admin/users', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser || !currentUser.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  return res.json({ users: db.users });
});

// Admin: Update User Privileges
app.put('/api/admin/users/:id/role', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser || !currentUser.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const target = db.users.find(u => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const { isVerified, isAdmin, isBanned } = req.body;
  if (isVerified !== undefined) target.isVerified = Boolean(isVerified);
  if (isAdmin !== undefined) target.isAdmin = Boolean(isAdmin);
  if (isBanned !== undefined) target.isBanned = Boolean(isBanned);

  saveDatabase();
  return res.json({ user: target });
});

// Admin: Reset database to seed
app.post('/api/admin/reset-demo', (req: Request, res: Response) => {
  const currentUser = getAuthUser(req);
  if (!currentUser || !currentUser.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db = {
    users: [...SEED_USERS],
    posts: [...SEED_POSTS],
    comments: [...INITIAL_COMMENTS],
    stories: [...SEED_STORIES],
    reels: [...SEED_REELS],
    conversations: [...SEED_CONVERSATIONS],
    messages: [...SEED_MESSAGES],
    notifications: [...SEED_NOTIFICATIONS],
    reports: [...SEED_REPORTS],
  };

  saveDatabase();
  return res.json({ success: true, message: 'Database reset to initial demo seeds.' });
});

// Start Express Server with Vite middlewares in Dev
const PORT = 3000;

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pixora full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start Pixora server:', err);
});
