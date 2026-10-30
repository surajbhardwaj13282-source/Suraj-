/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Image as ImageIcon,
  Film,
  Sparkles,
  MapPin,
  Music,
  Check,
  Upload,
} from 'lucide-react';
import { api } from '../services/api.js';

interface CreateMediaModalProps {
  onClose: () => void;
  onPostCreated: () => void;
  onStoryCreated: () => void;
  onReelCreated: () => void;
  initialTab?: 'post' | 'story' | 'reel';
}

const SAMPLE_MEDIA = [
  {
    type: 'image',
    title: 'Neon Tokyo',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=85',
  },
  {
    type: 'image',
    title: 'Milky Way Peaks',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=85',
  },
  {
    type: 'image',
    title: 'Haute Silk',
    url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85',
  },
  {
    type: 'image',
    title: 'Spatial Chrome',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85',
  },
  {
    type: 'image',
    title: 'Modular Synth',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=85',
  },
  {
    type: 'video',
    title: 'Night Traffic Loop',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-tokyo-night-traffic-flow-4148-large.mp4',
  },
  {
    type: 'video',
    title: 'Forest Waterfall',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4',
  },
];

const FILTER_PRESETS = [
  { id: 'none', label: 'Normal' },
  { id: 'violet-contrast', label: 'Violet Glow' },
  { id: 'clarity', label: 'Clarity' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'monochrome', label: 'B & W' },
  { id: 'holographic', label: 'Holo' },
  { id: 'analog', label: 'Vintage' },
];

export const CreateMediaModal: React.FC<CreateMediaModalProps> = ({
  onClose,
  onPostCreated,
  onStoryCreated,
  onReelCreated,
  initialTab = 'post',
}) => {
  const [activeTab, setActiveTab] = useState<'post' | 'story' | 'reel'>(initialTab);
  const [mediaUrl, setMediaUrl] = useState(SAMPLE_MEDIA[0].url);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [filterPreset, setFilterPreset] = useState('none');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '16:9'>('4:5');
  const [musicTitle, setMusicTitle] = useState('Velvet Night (Pixora Mix)');
  const [musicArtist, setMusicArtist] = useState('Violet Soundworks');
  const [audioTone, setAudioTone] = useState<'synth' | 'ambient' | 'techno' | 'lofi'>('synth');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVid = file.type.startsWith('video');
      setMediaType(isVid ? 'video' : 'image');
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setMediaUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (activeTab === 'post') {
        await api.createPost({
          caption,
          mediaUrl,
          mediaType,
          location,
          filterPreset,
          aspectRatio,
        });
        onPostCreated();
      } else if (activeTab === 'story') {
        await api.createStory({
          mediaUrl,
          mediaType,
          caption,
        });
        onStoryCreated();
      } else {
        await api.createReel({
          videoUrl: mediaUrl,
          caption,
          musicTitle,
          musicArtist,
          audioTone,
        });
        onReelCreated();
      }
      onClose();
    } catch (err) {
      console.error('Failed to create content:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0e0c16] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('post')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'post'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Post
            </button>
            <button
              onClick={() => setActiveTab('story')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'story'
                  ? 'bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white shadow-md'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Sparkles className="w-4 h-4" /> 24h Story
            </button>
            <button
              onClick={() => {
                setActiveTab('reel');
                setMediaType('video');
                setMediaUrl(SAMPLE_MEDIA[5].url);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'reel'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Film className="w-4 h-4" /> Reel
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Media Preview & File Upload */}
            <div className="flex flex-col gap-3">
              <div
                className="relative w-full bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 flex items-center justify-center select-none shadow-inner"
                style={{ aspectRatio: activeTab === 'reel' ? '9/16' : aspectRatio === '1:1' ? '1/1' : aspectRatio === '16:9' ? '16/9' : '4/5' }}
              >
                {mediaType === 'video' ? (
                  <video
                    src={mediaUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Upload from Computer */}
              <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 cursor-pointer text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors">
                <Upload className="w-4 h-4 text-purple-500" />
                <span>Upload from Device</span>
                <input
                  type="file"
                  accept={activeTab === 'reel' ? 'video/*' : 'image/*,video/*'}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Quick Preset Selector */}
              <div>
                <span className="text-[11px] font-semibold text-neutral-400 block mb-1.5">
                  Or pick sample media:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {SAMPLE_MEDIA.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setMediaUrl(s.url);
                        setMediaType(s.type as 'image' | 'video');
                      }}
                      className={`relative rounded-lg overflow-hidden h-12 border ${
                        mediaUrl === s.url
                          ? 'border-purple-500 ring-2 ring-purple-500/40'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      {s.type === 'video' ? (
                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-white">
                          <Film className="w-4 h-4" />
                        </div>
                      ) : (
                        <img src={s.url} alt="" className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Caption, Filters, Music & Settings */}
            <div className="flex flex-col gap-4">
              {/* Aspect Ratio (Posts only) */}
              {activeTab === 'post' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Aspect Ratio
                  </label>
                  <div className="flex items-center gap-2">
                    {(['4:5', '1:1', '16:9'] as const).map(ratio => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setAspectRatio(ratio)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          aspectRatio === ratio
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {ratio === '4:5' ? 'Portrait (4:5)' : ratio === '1:1' ? 'Square (1:1)' : 'Landscape (16:9)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters (Posts only) */}
              {activeTab === 'post' && mediaType === 'image' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Color Filter
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {FILTER_PRESETS.map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilterPreset(f.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                          filterPreset === f.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reel Music Configuration */}
              {activeTab === 'reel' && (
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                    <Music className="w-4 h-4" />
                    <span>Reel Soundtrack & Tone</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={musicTitle}
                      onChange={e => setMusicTitle(e.target.value)}
                      placeholder="Track title"
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(['synth', 'techno', 'ambient', 'lofi'] as const).map(tone => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setAudioTone(tone)}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-semibold capitalize border ${
                          audioTone === tone
                            ? 'border-purple-500 bg-purple-600 text-white'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Caption & Hashtags
                </label>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  rows={activeTab === 'story' ? 2 : 3}
                  placeholder="Write a caption... Use #hashtags to help people discover your work"
                  className="w-full p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Location Tag */}
              {activeTab === 'post' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Location Tag
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Add location (e.g., Tokyo, Paris, San Francisco)"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !mediaUrl}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-purple-600/30 hover:opacity-95 disabled:opacity-40 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Publishing...'
                  : activeTab === 'post'
                  ? 'Share Post'
                  : activeTab === 'story'
                  ? 'Share to Story'
                  : 'Post Reel'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
