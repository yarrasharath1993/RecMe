'use client';

/**
 * GenreExpertiseTags Component
 * 
 * Filterable genre chips showing an entity's expertise areas.
 * Visual weight based on film count per genre.
 */

import { useState } from 'react';
import { 
  Swords, Heart, Laugh, Ghost, Sparkles, Users, 
  Crown, Music2, Baby, Search, X, Film
} from 'lucide-react';

interface GenreData {
  genre: string;
  count: number;
  avgRating?: number;
  topFilm?: string;
}

interface GenreExpertiseTagsProps {
  genres: GenreData[];
  selectedGenre?: string | null;
  onGenreSelect?: (genre: string | null) => void;
  showCounts?: boolean;
  maxVisible?: number;
  className?: string;
}

// Genre to icon mapping
const GENRE_ICONS: Record<string, React.ReactNode> = {
  'Action': <Swords className="w-3.5 h-3.5" />,
  'Romance': <Heart className="w-3.5 h-3.5" />,
  'Comedy': <Laugh className="w-3.5 h-3.5" />,
  'Horror': <Ghost className="w-3.5 h-3.5" />,
  'Drama': <Sparkles className="w-3.5 h-3.5" />,
  'Family': <Users className="w-3.5 h-3.5" />,
  'Devotional': <Crown className="w-3.5 h-3.5" />,
  'Musical': <Music2 className="w-3.5 h-3.5" />,
  'Kids': <Baby className="w-3.5 h-3.5" />,
  'Thriller': <Search className="w-3.5 h-3.5" />,
};

// Genre to color mapping
const GENRE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Action': { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
  'Romance': { bg: 'rgba(236, 72, 153, 0.15)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.3)' },
  'Comedy': { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' },
  'Horror': { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' },
  'Drama': { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
  'Family': { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
  'Devotional': { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: 'rgba(249, 115, 22, 0.3)' },
  'Musical': { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' },
  'Kids': { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' },
  'Thriller': { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' },
};

const DEFAULT_COLORS = { bg: 'var(--bg-tertiary)', text: 'var(--text-secondary)', border: 'var(--border-primary)' };

export function GenreExpertiseTags({
  genres,
  selectedGenre,
  onGenreSelect,
  showCounts = true,
  maxVisible = 8,
  className = '',
}: GenreExpertiseTagsProps) {
  const [showAll, setShowAll] = useState(false);

  // Sort by count and limit
  const sortedGenres = [...genres].sort((a, b) => b.count - a.count);
  const visibleGenres = showAll ? sortedGenres : sortedGenres.slice(0, maxVisible);
  const hiddenCount = sortedGenres.length - maxVisible;

  // Find max count for sizing
  const maxCount = sortedGenres[0]?.count || 1;

  const handleGenreClick = (genre: string) => {
    if (!onGenreSelect) return;
    onGenreSelect(selectedGenre === genre ? null : genre);
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 
          className="text-sm font-semibold flex items-center gap-2"
          style={{ color: 'var(--text-primary)' }}
        >
          <Film className="w-4 h-4 text-orange-500" />
          Genre Expertise
        </h3>
        {selectedGenre && onGenreSelect && (
          <button
            onClick={() => onGenreSelect(null)}
            className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Genre Tags */}
      <div className="flex flex-wrap gap-2">
        {visibleGenres.map(genre => {
          const colors = GENRE_COLORS[genre.genre] || DEFAULT_COLORS;
          const icon = GENRE_ICONS[genre.genre] || <Film className="w-3.5 h-3.5" />;
          const isSelected = selectedGenre === genre.genre;
          const sizeMultiplier = 0.7 + (genre.count / maxCount) * 0.3;

          return (
            <button
              key={genre.genre}
              onClick={() => handleGenreClick(genre.genre)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                transition-all duration-200 font-medium
                ${isSelected ? 'ring-2 ring-offset-1 scale-105' : 'hover:scale-102'}
              `}
              style={{
                backgroundColor: isSelected ? colors.text : colors.bg,
                color: isSelected ? 'white' : colors.text,
                border: `1px solid ${colors.border}`,
                fontSize: `${12 * sizeMultiplier}px`,
                // Ring color is set via className
              }}
              title={genre.topFilm ? `Top: ${genre.topFilm}` : undefined}
            >
              <span style={{ opacity: isSelected ? 1 : 0.8 }}>{icon}</span>
              <span>{genre.genre}</span>
              {showCounts && (
                <span 
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  }}
                >
                  {genre.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Show More Button */}
        {hiddenCount > 0 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
            }}
          >
            +{hiddenCount} more
          </button>
        )}

        {showAll && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(false)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
            }}
          >
            Show less
          </button>
        )}
      </div>

      {/* Selected Genre Info */}
      {selectedGenre && (
        <div 
          className="mt-3 p-3 rounded-xl"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          {(() => {
            const selected = genres.find(g => g.genre === selectedGenre);
            if (!selected) return null;
            const colors = GENRE_COLORS[selectedGenre] || DEFAULT_COLORS;
            return (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Showing {selected.count} {selectedGenre} films
                  </p>
                  {selected.avgRating && (
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Average rating: {selected.avgRating.toFixed(1)}/10
                    </p>
                  )}
                </div>
                {selected.topFilm && (
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Top rated
                    </p>
                    <p className="text-xs font-medium" style={{ color: colors.text }}>
                      {selected.topFilm}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default GenreExpertiseTags;
