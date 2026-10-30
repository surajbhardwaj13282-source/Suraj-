/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserStoryGroup } from '../types.js';
import { useAuth } from '../context/AuthContext.js';

interface StoriesBarProps {
  storyGroups: UserStoryGroup[];
  onSelectStoryGroup: (groupIndex: number) => void;
  onOpenCreateStory: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  storyGroups,
  onSelectStoryGroup,
  onOpenCreateStory,
}) => {
  const { currentUser } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Check if current user has an active story
  const myStoryIndex = storyGroups.findIndex(g => g.author.id === currentUser?.id);
  const myStoryGroup = myStoryIndex !== -1 ? storyGroups[myStoryIndex] : null;

  return (
    <div className="relative w-full max-w-xl mx-auto py-3 px-2 bg-white dark:bg-[#0c0a13] border border-neutral-200 dark:border-neutral-800/60 rounded-2xl mb-4 select-none shadow-sm">
      {/* Scroll Controls */}
      <button
        onClick={() => scroll('left')}
        aria-label="Scroll stories left"
        className="hidden md:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 shadow-md items-center justify-center hover:scale-105 transition-transform"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={() => scroll('right')}
        aria-label="Scroll stories right"
        className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 shadow-md items-center justify-center hover:scale-105 transition-transform"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Stories track */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth px-2"
      >
        {/* Current User Story Item */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
          <div className="relative">
            {myStoryGroup ? (
              <div
                onClick={() => onSelectStoryGroup(myStoryIndex)}
                className={`p-0.5 rounded-full ${
                  myStoryGroup.allViewed
                    ? 'ring-2 ring-neutral-400 dark:ring-neutral-600'
                    : 'bg-gradient-to-tr from-amber-500 via-fuchsia-500 to-purple-600 p-[2.5px]'
                }`}
              >
                <img
                  src={currentUser?.avatarUrl}
                  alt="Your story"
                  className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-[#0c0a13] group-hover:scale-95 transition-transform"
                />
              </div>
            ) : (
              <div
                onClick={onOpenCreateStory}
                className="p-[2px] rounded-full border-2 border-dashed border-purple-400 dark:border-purple-500/60"
              >
                <img
                  src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt="Add story"
                  className="w-16 h-16 rounded-full object-cover"
                />
              </div>
            )}

            {/* Plus badge */}
            <button
              onClick={e => {
                e.stopPropagation();
                onOpenCreateStory();
              }}
              title="Add to story"
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-purple-600 text-white border-2 border-white dark:border-[#0c0a13] flex items-center justify-center shadow-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
          <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium truncate w-18 text-center">
            Your Story
          </span>
        </div>

        {/* Other Users' Stories */}
        {storyGroups.map((group, idx) => {
          if (group.author.id === currentUser?.id) return null;

          return (
            <div
              key={group.author.id}
              onClick={() => onSelectStoryGroup(idx)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
            >
              <div
                className={`rounded-full transition-transform group-hover:scale-105 ${
                  group.allViewed
                    ? 'p-[2px] ring-1 ring-neutral-300 dark:ring-neutral-700'
                    : 'bg-gradient-to-tr from-amber-500 via-fuchsia-500 to-purple-600 p-[2.5px] shadow-sm'
                }`}
              >
                <img
                  src={group.author.avatarUrl}
                  alt={group.author.username}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-[#0c0a13]"
                />
              </div>
              <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium truncate w-18 text-center">
                {group.author.username}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
