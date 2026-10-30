/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Volume2,
  VolumeX,
  Music,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Reel } from '../types.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { reelAudio } from '../utils/audio.js';

interface ReelsViewProps {
  onOpenComments: (reel: Reel) => void;
  onOpenShare: (reel: Reel) => void;
  onSelectUser: (userId: string) => void;
}

export const ReelsView: React.FC<ReelsViewProps> = ({
  onOpenComments,
  onOpenShare,
  onSelectUser,
}) => {
  const { currentUser, refreshUser } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    api.getReels()
      .then(res => setReels(res.reels))
      .catch(console.error)
      .finally(() => setLoading(false));

    return () => {
      reelAudio.stop();
    };
  }, []);

  const currentReel = reels[currentIndex];

  // When changing reel or mute state
  useEffect(() => {
    if (!currentReel) return;
    if (!isMuted) {
      reelAudio.playTrack(currentReel.audioTone || 'synth');
    } else {
      reelAudio.stop();
    }
  }, [currentIndex, isMuted, currentReel]);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && currentReel) {
      reelAudio.playTrack(currentReel.audioTone || 'synth');
    } else {
      reelAudio.stop();
    }
  };

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') handleNext();
      if (e.key === 'ArrowUp') handlePrev();
      if (e.key === 'm' || e.key === 'M') toggleSound();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, reels.length, isMuted]);

  const handleToggleLike = async () => {
    if (!currentReel) return;
    try {
      const res = await api.toggleLikeReel(currentReel.id);
      setReels(prev =>
        prev.map((r, i) =>
          i === currentIndex
            ? { ...r, isLiked: res.isLiked, likesCount: res.likesCount }
            : r
        )
      );
    } catch (err) {
      console.error('Failed to like reel:', err);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentReel) return;
    try {
      await api.toggleFollow(currentReel.authorId);
      await refreshUser();
    } catch (err) {
      console.error('Failed to toggle follow creator:', err);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        <span className="text-xs text-neutral-400">Loading Reels feed...</span>
      </div>
    );
  }

  if (!currentReel) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center text-neutral-400 text-sm">
        No reels available yet. Upload the first viral clip!
      </div>
    );
  }

  const isFollowing = currentUser?.followingIds?.includes(currentReel.authorId);

  return (
    <div className="w-full max-w-lg mx-auto py-4 px-2 flex items-center justify-center relative select-none">
      {/* Up / Down Navigation Controls */}
      <div className="hidden md:flex flex-col gap-3 absolute -right-16 top-1/2 -translate-y-1/2 z-20">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label="Previous Reel"
          className="p-3 rounded-full bg-white/10 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-white disabled:opacity-30 hover:scale-110 transition-all shadow-lg"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === reels.length - 1}
          aria-label="Next Reel"
          className="p-3 rounded-full bg-white/10 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-white disabled:opacity-30 hover:scale-110 transition-all shadow-lg"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Reel Card Container 9:16 */}
      <div className="relative w-full max-w-[390px] h-[82vh] max-h-[760px] bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Background Video */}
        <video
          ref={videoRef}
          src={currentReel.videoUrl}
          autoPlay
          loop
          muted={true}
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none" />

        {/* Top Sound Toggle Button */}
        <div className="relative z-20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-semibold border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Reels</span>
          </div>

          <button
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors border border-white/10"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-neutral-300" />
            ) : (
              <Volume2 className="w-5 h-5 text-purple-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Right Floating Actions (Like, Comment, Share, Audio Disc) */}
        <div className="absolute right-3.5 bottom-16 z-20 flex flex-col items-center gap-5 text-white">
          {/* Like */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleToggleLike}
              className="p-3 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-all active:scale-125"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  currentReel.isLiked
                    ? 'text-rose-500 fill-rose-500 scale-110'
                    : 'text-white'
                }`}
              />
            </button>
            <span className="text-[11px] font-bold">
              {currentReel.likesCount.toLocaleString()}
            </span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onOpenComments(currentReel)}
              className="p-3 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-all"
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </button>
            <span className="text-[11px] font-bold">
              {currentReel.commentsCount.toLocaleString()}
            </span>
          </div>

          {/* Share */}
          <button
            onClick={() => onOpenShare(currentReel)}
            className="p-3 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-all"
          >
            <Send className="w-6 h-6 text-white" />
          </button>

          {/* Bookmark */}
          <button
            onClick={async () => {
              await api.toggleSavePost(currentReel.id);
            }}
            className="p-3 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-all"
          >
            <Bookmark className="w-6 h-6 text-white" />
          </button>

          {/* Spinning Audio Disc */}
          <div
            onClick={toggleSound}
            className={`w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-purple-500 to-fuchsia-500 cursor-pointer shadow-lg ${
              !isMuted ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '4s' }}
          >
            <img
              src={currentReel.author.avatarUrl}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* Bottom Metadata & Creator Card */}
        <div className="relative z-20 p-4 pr-16 flex flex-col gap-2.5 text-white">
          {/* Creator Profile & Follow */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => onSelectUser(currentReel.authorId)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img
                src={currentReel.author.avatarUrl}
                alt={currentReel.author.username}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500"
              />
              <span className="text-sm font-bold tracking-tight">
                {currentReel.author.username}
              </span>
              {currentReel.author.isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
              )}
            </div>

            {currentUser?.id !== currentReel.authorId && (
              <button
                onClick={handleToggleFollow}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  isFollowing
                    ? 'border border-white/40 text-white/90 bg-white/10'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Caption */}
          <p className="text-xs text-white/95 leading-relaxed line-clamp-2">
            {currentReel.caption}
          </p>

          {/* Music Ticker Bar */}
          <div
            onClick={toggleSound}
            className="flex items-center gap-2 text-xs font-medium text-white/80 cursor-pointer hover:text-white"
          >
            <Music className="w-3.5 h-3.5 text-purple-400" />
            <span className="truncate">
              {currentReel.musicTitle} · {currentReel.musicArtist}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
              {isMuted ? 'Tap for audio' : 'Playing'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
