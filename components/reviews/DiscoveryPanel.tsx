'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  Shuffle, ChevronLeft, ChevronRight, Sparkles, Wand2
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface DiscoveryPanelProps {
  activeMood?: string;
  onMoodSelect: (moodId: string | undefined) => void;
  onCollectionSelect: (collection: string) => void;
  onGenreSelect: (genre: string) => void;
  onEraSelect: (era: { from: number; to: number } | undefined) => void;
  activeGenre?: string;
  activeEra?: { from: number; to: number };
  className?: string;
}

// ============================================================
// DATA
// ============================================================

const QUICK_PICKS = [
  { id: 'top-10', label: 'Top 10', icon: '🏆', description: 'Highest rated', link: '/reviews?sort=rating&limit=10', gradient: 'from-yellow-500/20 to-amber-500/10' },
  { id: 'best-2024', label: 'Best of 2024', icon: '⭐', description: 'Year\'s finest', link: '/reviews?year=2024&sort=rating', gradient: 'from-orange-500/20 to-red-500/10' },
  { id: 'hidden-gems', label: 'Hidden Gems', icon: '💎', description: 'Underrated picks', link: '/reviews/hidden-gems', gradient: 'from-purple-500/20 to-pink-500/10' },
  { id: 'blockbusters', label: 'Blockbusters', icon: '🎬', description: 'Box office hits', link: '/reviews/blockbusters', gradient: 'from-blue-500/20 to-cyan-500/10' },
  { id: 'classics', label: 'Classics', icon: '🎭', description: 'Timeless films', link: '/reviews/classics', gradient: 'from-amber-500/20 to-yellow-500/10' },
  { id: 'underrated', label: 'Underrated', icon: '📺', description: 'Overlooked gems', link: '/reviews?underrated=true', gradient: 'from-teal-500/20 to-emerald-500/10' },
];

// Random genres for Surprise Me
const SURPRISE_GENRES = ['Action', 'Drama', 'Romance', 'Comedy', 'Thriller', 'Horror', 'Family', 'Fantasy', 'Crime', 'Mystery'];
const SURPRISE_MOODS = ['action', 'emotional', 'romantic', 'comedy', 'thriller', 'intense', 'family', 'adventure'];

// ============================================================
// MAIN COMPONENT
// ============================================================

export function DiscoveryPanel({
  onMoodSelect,
  onCollectionSelect,
  onGenreSelect,
  className = '',
}: DiscoveryPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll handlers
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Surprise Me - pick a random genre
  const handleSurpriseMe = () => {
    const randomIndex = Math.floor(Math.random() * SURPRISE_GENRES.length);
    const randomGenre = SURPRISE_GENRES[randomIndex];
    const randomMood = SURPRISE_MOODS[randomIndex] || 'action';
    onMoodSelect(randomMood);
    onGenreSelect(randomGenre);
  };

  return (
    <div className={`${className}`}>
      {/* Main horizontal layout: Quick Picks + Surprise Me */}
      <div className="flex items-center gap-3">
        
        {/* Quick Picks - Horizontal scroll */}
        <div className="flex-1 relative group">
          {/* Left scroll button */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg -ml-2"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>

          {/* Scrollable container */}
          <div
            ref={scrollRef}
            className="flex gap-2.5 overflow-x-auto py-1 scroll-smooth scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {QUICK_PICKS.map((pick) => (
              <Link
                key={pick.id}
                href={pick.link}
                onClick={() => onCollectionSelect(pick.id)}
                className={`flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-md bg-gradient-to-r ${pick.gradient}`}
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <span className="text-xl">{pick.icon}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {pick.label}
                  </span>
                  <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
                    {pick.description}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Right scroll button */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg -mr-2"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
        </div>

        {/* Surprise Me Button - Featured */}
        <button
          onClick={handleSurpriseMe}
          className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all hover:scale-105 hover:shadow-lg group/btn"
          style={{
            background: 'linear-gradient(135deg, #f97316, #eab308)',
            color: '#000',
          }}
        >
          <div className="relative">
            <Wand2 className="w-5 h-5 transition-transform group-hover/btn:rotate-12" />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-200 animate-pulse" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold">Surprise Me</span>
            <span className="text-[10px] opacity-80">Random pick</span>
          </div>
        </button>
      </div>
    </div>
  );
}

export default DiscoveryPanel;
