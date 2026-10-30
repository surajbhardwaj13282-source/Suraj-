/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Send, CheckCircle2, Heart } from 'lucide-react';
import { UserStoryGroup } from '../types.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface StoryViewerModalProps {
  storyGroups: UserStoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onStoryUpdated: () => void;
}

const STORY_DURATION_MS = 5000;

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  storyGroups,
  initialGroupIndex,
  onClose,
  onStoryUpdated,
}) => {
  const { currentUser } = useAuth();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sentToast, setSentToast] = useState(false);

  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  // Mark story as viewed
  useEffect(() => {
    if (currentStory) {
      api.markStoryViewed(currentStory.id).then(() => {
        onStoryUpdated();
      });
    }
    setProgress(0);
  }, [groupIndex, storyIndex]);

  // Progress timer
  useEffect(() => {
    if (!currentStory || isPaused) return;

    const intervalTime = 50;
    const step = (intervalTime / STORY_DURATION_MS) * 100;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [groupIndex, storyIndex, isPaused, currentStory]);

  const handleNext = () => {
    if (!currentGroup) return;
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(prev => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      setGroupIndex(prev => prev - 1);
      const prevGroup = storyGroups[groupIndex - 1];
      setStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
    }
  };

  const handleSendReply = async (textToSend?: string) => {
    const text = textToSend || replyText.trim();
    if (!text || !currentGroup || !currentUser) return;

    try {
      // Find or create conversation with author
      const convRes = await api.createConversation({
        participantIds: [currentGroup.author.id],
      });
      await api.sendMessage(convRes.conversation.id, {
        text: `Replied to your story: "${text}"`,
        mediaUrl: currentStory.mediaUrl,
        type: 'story_reply',
      });
      setReplyText('');
      setSentToast(true);
      setTimeout(() => setSentToast(false), 2000);
    } catch (err) {
      console.error('Failed to send reply:', err);
    }
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md select-none">
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close story"
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Arrows for Desktop */}
      <button
        onClick={handlePrevious}
        aria-label="Previous story"
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-110"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next story"
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-110"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Main Story Container */}
      <div
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="relative w-full max-w-sm h-[88vh] max-h-[820px] rounded-3xl overflow-hidden bg-neutral-900 shadow-2xl flex flex-col justify-between"
      >
        {/* Story Background Media */}
        <div className="absolute inset-0">
          {currentStory.mediaType === 'video' ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
            />
          )}
          {/* Subtle gradient overlay top and bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
        </div>

        {/* Tap areas for mobile/fast navigation */}
        <div
          onClick={handlePrevious}
          className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
        />
        <div
          onClick={handleNext}
          className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
        />

        {/* Top Header & Progress Bars */}
        <div className="relative z-30 p-4 flex flex-col gap-3">
          {/* Progress Bars */}
          <div className="flex items-center gap-1.5 w-full">
            {currentGroup.stories.map((st, i) => (
              <div
                key={st.id}
                className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden"
              >
                <div
                  className="h-full bg-white rounded-full transition-all duration-75"
                  style={{
                    width:
                      i < storyIndex
                        ? '100%'
                        : i === storyIndex
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Author info */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <img
                src={currentGroup.author.avatarUrl}
                alt={currentGroup.author.username}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight">
                  {currentGroup.author.username}
                </span>
                {currentGroup.author.isVerified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                )}
                <span className="text-xs text-white/70">· 2h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Story Caption */}
        {currentStory.caption && (
          <div className="relative z-30 px-5 text-center">
            <p className="inline-block px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md text-white font-medium text-sm border border-white/10 shadow-lg">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Bottom Reply Bar */}
        <div className="relative z-30 p-4 flex flex-col gap-2">
          {/* Quick emoji reactions */}
          <div className="flex items-center justify-around py-1">
            {['🔥', '❤️', '👏', '😂', '😮', '💜'].map(emoji => (
              <button
                key={emoji}
                onClick={e => {
                  e.stopPropagation();
                  handleSendReply(emoji);
                }}
                className="text-xl hover:scale-125 transition-transform active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply input */}
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSendReply();
              }}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              placeholder={`Reply to ${currentGroup.author.username}...`}
              className="flex-1 px-4 py-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              onClick={e => {
                e.stopPropagation();
                handleSendReply();
              }}
              disabled={!replyText.trim()}
              className="p-2.5 rounded-full bg-purple-600 text-white disabled:opacity-40 hover:bg-purple-700 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {sentToast && (
            <div className="text-center text-xs text-emerald-400 font-medium py-1 animate-pulse">
              Sent directly to {currentGroup.author.username}!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
