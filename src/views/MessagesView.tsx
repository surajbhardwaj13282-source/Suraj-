/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Image as ImageIcon,
  Heart,
  MoreVertical,
  Plus,
  Users,
  Search,
  Check,
  Trash2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Conversation, Message, User } from '../types.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface MessagesViewProps {
  onSelectUser: (userId: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ onSelectUser }) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  const fetchConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.conversations);
      if (!activeConvId && res.conversations.length > 0) {
        setActiveConvId(res.conversations[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load active messages
  const fetchMessages = async (convId: string) => {
    try {
      const res = await api.getMessages(convId);
      setMessages(res.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
    api.getUsers().then(res => setAllUsers(res.users)).catch(console.error);
  }, [currentUser]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      // Polling for live chat updates
      const interval = setInterval(() => {
        fetchMessages(activeConvId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConvId || isSending) return;

    setIsSending(true);
    const text = inputText.trim();
    setInputText('');

    try {
      const res = await api.sendMessage(activeConvId, { text });
      setMessages(prev => [...prev, res.message]);
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Toggle Like Message
  const handleToggleLike = async (msgId: string) => {
    try {
      await api.toggleLikeMessage(msgId);
      setMessages(prev =>
        prev.map(m => (m.id === msgId ? { ...m, liked: !m.liked } : m))
      );
    } catch (err) {
      console.error('Failed to like message:', err);
    }
  };

  // Delete / Unsend message
  const handleDeleteMessage = async (msgId: string) => {
    try {
      await api.deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) {
      console.error('Failed to unsend message:', err);
    }
  };

  // Create new direct or group chat
  const handleCreateChat = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      const isGroup = selectedUserIds.length > 1;
      const res = await api.createConversation({
        participantIds: selectedUserIds,
        isGroup,
        name: isGroup ? groupName || 'Creative Squad 🎨' : undefined,
      });

      await fetchConversations();
      setActiveConvId(res.conversation.id);
      setShowNewChatModal(false);
      setSelectedUserIds([]);
      setGroupName('');
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto h-[86vh] my-2 md:my-4 px-2 md:px-4">
      <div className="w-full h-full bg-white dark:bg-[#0c0a13] border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-xl flex">
        {/* Left: Conversations List */}
        <aside
          className={`w-full md:w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col ${
            activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Top Bar */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-neutral-900 dark:text-white">
                Messages
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
                {conversations.length}
              </span>
            </div>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm"
              title="New Message or Group"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Conversations track */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-neutral-400">Loading chats...</div>
            ) : conversations.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                No chats yet. Tap + to start one!
              </div>
            ) : (
              conversations.map(c => {
                const isSelected = c.id === activeConvId;
                const otherParticipant = c.participants.find(p => p.id !== currentUser?.id) || c.participants[0];
                const title = c.isGroup ? c.name : otherParticipant?.fullName || otherParticipant?.username;
                const avatar = c.isGroup ? c.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100' : otherParticipant?.avatarUrl;

                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-600/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400 font-semibold'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-900/60 text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={avatar}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover ring-1 ring-purple-500/20"
                      />
                      {c.isGroup && (
                        <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-purple-600 text-white">
                          <Users className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate">{title}</span>
                        <span className="text-[10px] text-neutral-400">
                          {c.lastMessage
                            ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {c.lastMessage ? c.lastMessage.text : 'Start chatting...'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Active Chat Area */}
        {activeConv ? (
          <main className="flex-1 flex flex-col h-full bg-white dark:bg-[#0c0a13]">
            {/* Chat Header */}
            <div className="p-3.5 px-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConvId(null)}
                  className="md:hidden text-xs text-purple-600 font-bold"
                >
                  ← Back
                </button>
                <img
                  src={
                    activeConv.isGroup
                      ? activeConv.avatarUrl || 'https://images.unsplash.com/photo-1618005182384?w=100'
                      : activeConv.participants.find(p => p.id !== currentUser?.id)?.avatarUrl
                  }
                  alt=""
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      {activeConv.isGroup
                        ? activeConv.name
                        : activeConv.participants.find(p => p.id !== currentUser?.id)?.fullName}
                    </span>
                    {activeConv.participants[0]?.isVerified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    {activeConv.isGroup
                      ? `${activeConv.participants.length} members`
                      : 'Active now'}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5">
              {messages.map(m => {
                const isMe = m.senderId === currentUser?.id;

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                  >
                    <div className="flex items-end gap-2 max-w-[75%] md:max-w-[65%]">
                      {!isMe && (
                        <img
                          src={m.sender.avatarUrl}
                          alt=""
                          onClick={() => onSelectUser(m.senderId)}
                          className="w-7 h-7 rounded-full object-cover cursor-pointer mb-1"
                        />
                      )}

                      <div className="relative">
                        {/* Shared Media Snippet */}
                        {m.mediaUrl && (
                          <img
                            src={m.mediaUrl}
                            alt=""
                            className="rounded-2xl max-h-60 object-cover mb-1.5 shadow-md border border-white/10"
                          />
                        )}

                        {/* Speech Bubble */}
                        <div
                          onDoubleClick={() => handleToggleLike(m.id)}
                          className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed select-text ${
                            isMe
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs shadow-md shadow-purple-600/20'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-xs'
                          }`}
                        >
                          {m.text}
                        </div>

                        {/* Heart reaction badge */}
                        {m.liked && (
                          <div className="absolute -bottom-2 -right-2 p-1 rounded-full bg-white dark:bg-neutral-900 shadow-md border border-neutral-200 dark:border-neutral-700">
                            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                          </div>
                        )}
                      </div>

                      {/* Unsend button for author */}
                      {isMe && (
                        <button
                          onClick={() => handleDeleteMessage(m.id)}
                          title="Unsend"
                          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-500 transition-opacity p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] text-neutral-400 mt-1 px-1">
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 md:p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-3 bg-neutral-50/50 dark:bg-neutral-900/30"
            >
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Message..."
                className="flex-1 px-4 py-2.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700/80 text-xs md:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-2.5 rounded-full bg-purple-600 text-white disabled:opacity-40 hover:bg-purple-700 shadow-sm transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </main>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center text-neutral-400">
            <Sparkles className="w-12 h-12 text-purple-500 mb-3" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">
              Your Messages
            </h3>
            <p className="text-xs max-w-sm mb-4">
              Send private photos, videos, and thoughts to friends or collaborate in groups.
            </p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700"
            >
              Send Message
            </button>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0e0c16] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                New Message or Group
              </h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {selectedUserIds.length > 1 && (
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="e.g. Design Enthusiasts ✨"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            )}

            <div className="max-h-60 overflow-y-auto space-y-1">
              <span className="text-[11px] font-bold uppercase text-neutral-400 px-1">
                Select Recipients
              </span>
              {allUsers
                .filter(u => u.id !== currentUser?.id)
                .map(u => {
                  const isChecked = selectedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSelectedUserIds(prev =>
                          isChecked ? prev.filter(id => id !== u.id) : [...prev, u.id]
                        );
                      }}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatarUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-500/30"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">
                            {u.fullName}
                          </span>
                          <span className="text-[10px] text-neutral-400">@{u.username}</span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          isChecked
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-neutral-300 dark:border-neutral-700'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChat}
                disabled={selectedUserIds.length === 0}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-40"
              >
                {selectedUserIds.length > 1 ? 'Create Group Chat' : 'Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
