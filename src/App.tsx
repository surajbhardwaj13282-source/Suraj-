/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { api } from './services/api.js';
import { Post, Reel, User, UserStoryGroup } from './types.js';

// Layout & Components
import { Sidebar } from './components/Sidebar.js';
import { Header, BottomNav } from './components/HeaderAndNav.js';
import { StoryViewerModal } from './components/StoryViewerModal.js';
import { CommentsDrawer } from './components/CommentsDrawer.js';
import { ShareModal } from './components/ShareModal.js';
import { ReportModal } from './components/ReportModal.js';
import { FollowersModal } from './components/FollowersModal.js';
import { EditProfileModal } from './components/EditProfileModal.js';
import { CreateMediaModal } from './components/CreateMediaModal.js';
import { PostDetailModal } from './components/PostDetailModal.js';
import { DemoSwitcher } from './components/DemoSwitcher.js';

// Views
import { FeedView } from './views/FeedView.js';
import { ExploreView } from './views/ExploreView.js';
import { ReelsView } from './views/ReelsView.js';
import { MessagesView } from './views/MessagesView.js';
import { NotificationsView } from './views/NotificationsView.js';
import { ProfileView } from './views/ProfileView.js';
import { AdminView } from './views/AdminView.js';
import { SettingsView } from './views/SettingsView.js';
import { AuthModal } from './views/AuthModal.js';

function PixoraMain() {
  const { currentUser } = useAuth();

  // Navigation
  const [currentTab, setCurrentTab] = useState<string>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [exploreTag, setExploreTag] = useState<string | undefined>(undefined);

  // Stories
  const [storyGroups, setStoryGroups] = useState<UserStoryGroup[]>([]);
  const [activeStoryGroupIndex, setActiveStoryGroupIndex] = useState<number | null>(null);

  // Badge counts
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<'post' | 'story' | 'reel'>('post');
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [reportTarget, setReportTarget] = useState<{ post?: Post; user?: User } | null>(null);
  const [followersModal, setFollowersModal] = useState<{
    title: 'Followers' | 'Following';
    userId: string;
  } | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [detailPost, setDetailPost] = useState<Post | null>(null);

  const fetchStories = async () => {
    try {
      const res = await api.getStories();
      setStoryGroups(res.storyGroups);
    } catch (err) {
      console.error('Failed to load stories:', err);
    }
  };

  const fetchBadges = async () => {
    if (!currentUser) return;
    try {
      const [notifsRes, convsRes] = await Promise.all([
        api.getNotifications(),
        api.getConversations(),
      ]);
      setUnreadNotifications(notifsRes.unreadCount);
      const totalUnreadMsgs = convsRes.conversations.reduce(
        (sum, c) => sum + (c.unreadCount || 0),
        0
      );
      setUnreadMessages(totalUnreadMsgs);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStories();
    fetchBadges();
  }, [currentUser]);

  // Navigate to user profile
  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to explore tag
  const handleSelectTag = (tag: string) => {
    setExploreTag(tag);
    setCurrentTab('explore');
  };

  // Open direct chat with user
  const handleStartChatWithUser = async (userId: string) => {
    try {
      await api.createConversation({
        participantIds: [userId],
      });
      setCurrentTab('messages');
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#07050d] text-neutral-900 dark:text-neutral-100 flex flex-col md:flex-row transition-colors">
      {/* Mobile Top Header */}
      <Header
        onSelectTab={tab => {
          setCurrentTab(tab);
          if (tab === 'profile' && currentUser) setSelectedUserId(currentUser.id);
        }}
        onOpenCreate={() => {
          setCreateModalTab('post');
          setCreateModalOpen(true);
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
        unreadMessagesCount={unreadMessages}
        unreadNotificationsCount={unreadNotifications}
      />

      {/* Desktop Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          if (tab === 'profile' && currentUser) setSelectedUserId(currentUser.id);
        }}
        onOpenCreate={() => {
          setCreateModalTab('post');
          setCreateModalOpen(true);
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
        unreadMessagesCount={unreadMessages}
        unreadNotificationsCount={unreadNotifications}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pb-16 md:pb-6 overflow-x-hidden">
        {currentTab === 'feed' && (
          <FeedView
            storyGroups={storyGroups}
            onSelectStoryGroup={idx => setActiveStoryGroupIndex(idx)}
            onOpenCreateStory={() => {
              setCreateModalTab('story');
              setCreateModalOpen(true);
            }}
            onOpenComments={p => setCommentsPost(p)}
            onOpenShare={p => setSharePost(p)}
            onOpenReport={p => setReportTarget({ post: p })}
            onSelectUser={handleSelectUser}
            onSelectTag={handleSelectTag}
          />
        )}

        {currentTab === 'explore' && (
          <ExploreView
            onSelectPost={p => setDetailPost(p)}
            onSelectUser={handleSelectUser}
            initialTag={exploreTag}
          />
        )}

        {currentTab === 'reels' && (
          <ReelsView
            onOpenComments={reel => {
              // Map reel to post object for comments drawer
              setCommentsPost({
                id: reel.id,
                authorId: reel.authorId,
                author: reel.author,
                caption: reel.caption,
                mediaUrl: reel.videoUrl,
                mediaType: 'video',
                tags: reel.tags,
                likesCount: reel.likesCount,
                commentsCount: reel.commentsCount,
                sharesCount: reel.sharesCount,
                likedUserIds: reel.likedUserIds,
                createdAt: reel.createdAt,
              });
            }}
            onOpenShare={reel => {
              setSharePost({
                id: reel.id,
                authorId: reel.authorId,
                author: reel.author,
                caption: reel.caption,
                mediaUrl: reel.videoUrl,
                mediaType: 'video',
                tags: reel.tags,
                likesCount: reel.likesCount,
                commentsCount: reel.commentsCount,
                sharesCount: reel.sharesCount,
                likedUserIds: reel.likedUserIds,
                createdAt: reel.createdAt,
              });
            }}
            onSelectUser={handleSelectUser}
          />
        )}

        {currentTab === 'messages' && (
          <MessagesView onSelectUser={handleSelectUser} />
        )}

        {currentTab === 'notifications' && (
          <NotificationsView
            onSelectUser={handleSelectUser}
            onSelectPostById={() => setCurrentTab('feed')}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            userId={selectedUserId || currentUser?.id || 'user_elena'}
            onOpenEditProfile={() => setEditProfileOpen(true)}
            onOpenFollowers={(title, uId) => setFollowersModal({ title, userId: uId })}
            onSelectPost={p => setDetailPost(p)}
            onStartChat={handleStartChatWithUser}
            onOpenStory={() => {
              const grpIdx = storyGroups.findIndex(
                g => g.author.id === (selectedUserId || currentUser?.id)
              );
              if (grpIdx !== -1) setActiveStoryGroupIndex(grpIdx);
            }}
            hasActiveStory={storyGroups.some(
              g => g.author.id === (selectedUserId || currentUser?.id)
            )}
          />
        )}

        {currentTab === 'admin' && <AdminView />}

        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          if (tab === 'profile' && currentUser) setSelectedUserId(currentUser.id);
        }}
        onOpenCreate={() => {
          setCreateModalTab('post');
          setCreateModalOpen(true);
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Floating Demo Persona Switcher */}
      <DemoSwitcher />

      {/* Modals */}
      {/* 1. Fullscreen Story Viewer */}
      {activeStoryGroupIndex !== null && (
        <StoryViewerModal
          storyGroups={storyGroups}
          initialGroupIndex={activeStoryGroupIndex}
          onClose={() => setActiveStoryGroupIndex(null)}
          onStoryUpdated={fetchStories}
        />
      )}

      {/* 2. Create Media Modal (Post, 24h Story, Reel) */}
      {createModalOpen && (
        <CreateMediaModal
          initialTab={createModalTab}
          onClose={() => setCreateModalOpen(false)}
          onPostCreated={() => {
            setCurrentTab('feed');
          }}
          onStoryCreated={() => {
            fetchStories();
          }}
          onReelCreated={() => {
            setCurrentTab('reels');
          }}
        />
      )}

      {/* 3. Comments Drawer */}
      {commentsPost && (
        <CommentsDrawer
          post={commentsPost}
          onClose={() => setCommentsPost(null)}
          onSelectUser={handleSelectUser}
        />
      )}

      {/* 4. Share Modal */}
      {sharePost && (
        <ShareModal post={sharePost} onClose={() => setSharePost(null)} />
      )}

      {/* 5. Report Modal */}
      {reportTarget && (
        <ReportModal
          targetPost={reportTarget.post}
          targetUser={reportTarget.user}
          onClose={() => setReportTarget(null)}
        />
      )}

      {/* 6. Followers / Following Modal */}
      {followersModal && (
        <FollowersModal
          title={followersModal.title}
          userId={followersModal.userId}
          onClose={() => setFollowersModal(null)}
          onSelectUser={handleSelectUser}
        />
      )}

      {/* 7. Edit Profile Modal */}
      {editProfileOpen && (
        <EditProfileModal onClose={() => setEditProfileOpen(false)} />
      )}

      {/* 8. High-Res Post Detail Modal */}
      {detailPost && (
        <PostDetailModal
          post={detailPost}
          onClose={() => setDetailPost(null)}
          onSelectUser={handleSelectUser}
          onOpenShare={p => setSharePost(p)}
          onOpenReport={p => setReportTarget({ post: p })}
        />
      )}

      {/* 9. Sign In / Sign Up Modal */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PixoraMain />
      </AuthProvider>
    </ThemeProvider>
  );
}
