'use client';

/**
 * FilmographyTab Component
 * 
 * Complete filmography with filters and infinite scroll.
 * Features: Decade filter, Genre filter, Role filter, Search, Infinite scroll
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, Filter, X, Star, Calendar, Film, 
  ChevronDown, Grid, List, Loader2, SlidersHorizontal
} from 'lucide-react';
import { CompactMovieCard } from '../CompactMovieCard';
import { MoviePlaceholderStatic } from '@/components/movies/MoviePlaceholder';
import { getSafePosterUrl } from '@/lib/utils/safe-image';

// Types
interface MovieData {
  id: string;
  title: string;
  year: number;
  slug: string;
  rating?: number;
  poster_url?: string;
  is_blockbuster?: boolean;
  is_classic?: boolean;
  role_type?: string;
  character?: string;
  genres?: string[];
}

interface GenreDistribution {
  genre: string;
  count: number;
  percentage: number;
}

interface FilmographyTabProps {
  movies: MovieData[];
  genres?: GenreDistribution[];
  personName: string;
  className?: string;
}

// Constants
const ITEMS_PER_PAGE = 20;

// Filter Chip Component
function FilterChip({ 
  label, 
  active, 
  count,
  onClick 
}: { 
  label: string; 
  active: boolean; 
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
        transition-all duration-200
        ${active 
          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white/90'
        }
      `}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-white/50'}`}>
          ({count})
        </span>
      )}
    </button>
  );
}

// Movie Grid Item
function MovieGridItem({ movie, showRole }: { movie: MovieData & { role?: string; roles?: string[]; language?: string }; showRole?: boolean }) {
  const posterUrl = getSafePosterUrl(movie.poster_url);

  // Language display helper
  const getLanguageLabel = (lang?: string) => {
    // Return full language name
    return lang || '';
  };

  // Role display helper
  const getRoleLabel = (role?: string) => {
    const labels: Record<string, string> = {
      'actor': 'Acted',
      'actress': 'Acted',
      'director': 'Directed',
      'producer': 'Produced',
      'music_director': 'Music',
      'writer': 'Written',
      'supporting': 'Supporting',
      'cameo': 'Cameo',
    };
    return role ? labels[role] : '';
  };
  
  return (
    <Link 
      href={`/movies/${movie.slug}`}
      className="group relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      }}
    >
      {/* Poster */}
      <div className="aspect-[2/3] relative">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={movie.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
          />
        ) : (
          <MoviePlaceholderStatic
            title={movie.title}
            year={movie.year}
            className="w-full h-full"
          />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Language and role labels */}
          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
            {movie.language && (
              <span className="px-2 py-0.5 bg-blue-500/90 rounded text-[10px] font-medium text-white">
                {getLanguageLabel(movie.language)}
              </span>
            )}
            {(showRole || movie.roles || movie.role) && (
              movie.roles && movie.roles.length > 0 ? (
                movie.roles.map(role => (
                  <span key={role} className="px-2 py-0.5 bg-orange-500/90 rounded text-[10px] font-medium text-white">
                    {getRoleLabel(role)}
                  </span>
                ))
              ) : movie.role ? (
                <span className="px-2 py-0.5 bg-orange-500/90 rounded text-[10px] font-medium text-white">
                  {getRoleLabel(movie.role)}
                </span>
              ) : null
            )}
          </div>
        </div>

        {/* Rating Badge */}
        {movie.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-white">{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Blockbuster/Classic Badge */}
        {(movie.is_blockbuster || movie.is_classic) && (
          <div 
            className="absolute top-2 left-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide"
            style={{
              background: movie.is_blockbuster 
                ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.8) 100%)'
                : 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(109, 40, 217, 0.8) 100%)',
              color: 'white',
            }}
          >
            {movie.is_blockbuster ? '🔥 Hit' : '⭐ Classic'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-orange-400 transition-colors">
          {movie.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-white/50">{movie.year}</span>
          {showRole && movie.role_type && (
            <>
              <span className="text-white/30">•</span>
              <span className="text-xs text-orange-400/80 capitalize">{movie.role_type}</span>
            </>
          )}
        </div>
        {movie.character && (
          <p className="text-xs text-white/40 mt-1 line-clamp-1">as {movie.character}</p>
        )}
      </div>
    </Link>
  );
}

export function FilmographyTab({
  movies,
  genres = [],
  personName,
  className = '',
}: FilmographyTabProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDecade, setSelectedDecade] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'year' | 'rating' | 'title'>('year');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [showFilters, setShowFilters] = useState(false);
  
  // Refs
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Derive decades from movies
  const decades = useMemo(() => {
    const decadeSet = new Set<string>();
    movies.forEach(movie => {
      const decade = Math.floor(movie.year / 10) * 10;
      decadeSet.add(`${decade}s`);
    });
    return Array.from(decadeSet).sort((a, b) => parseInt(b) - parseInt(a));
  }, [movies]);

  // Derive roles from movies
  const roles = useMemo(() => {
    const roleMap = new Map<string, number>();
    movies.forEach(movie => {
      if (movie.role_type) {
        roleMap.set(movie.role_type, (roleMap.get(movie.role_type) || 0) + 1);
      }
    });
    return Array.from(roleMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([role, count]) => ({ role, count }));
  }, [movies]);

  // Filter and sort movies
  const filteredMovies = useMemo(() => {
    let result = [...movies];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(movie => 
        movie.title.toLowerCase().includes(query) ||
        movie.character?.toLowerCase().includes(query)
      );
    }

    // Decade filter
    if (selectedDecade) {
      const decadeStart = parseInt(selectedDecade);
      result = result.filter(movie => 
        movie.year >= decadeStart && movie.year < decadeStart + 10
      );
    }

    // Genre filter
    if (selectedGenre) {
      result = result.filter(movie => 
        movie.genres?.includes(selectedGenre)
      );
    }

    // Role filter
    if (selectedRole) {
      result = result.filter(movie => movie.role_type === selectedRole);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'year':
          comparison = a.year - b.year;
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [movies, searchQuery, selectedDecade, selectedGenre, selectedRole, sortBy, sortOrder]);

  // Displayed movies (infinite scroll)
  const displayedMovies = filteredMovies.slice(0, displayCount);
  const hasMore = displayCount < filteredMovies.length;

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setDisplayCount(prev => prev + ITEMS_PER_PAGE);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [searchQuery, selectedDecade, selectedGenre, selectedRole, sortBy, sortOrder]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDecade(null);
    setSelectedGenre(null);
    setSelectedRole(null);
  };

  const hasActiveFilters = searchQuery || selectedDecade || selectedGenre || selectedRole;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder={`Search ${personName}'s movies...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-3 h-3 text-white/40" />
            </button>
          )}
        </div>

        {/* Filter Toggle & View Mode */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              showFilters || hasActiveFilters
                ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-orange-500" />
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-orange-500/20 text-orange-400' : 'text-white/50 hover:text-white/70'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-orange-500/20 text-orange-400' : 'text-white/50 hover:text-white/70'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div 
          className="p-4 rounded-xl space-y-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Decades */}
          <div>
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">Decade</h4>
            <div className="flex flex-wrap gap-2">
              <FilterChip 
                label="All" 
                active={!selectedDecade} 
                onClick={() => setSelectedDecade(null)} 
              />
              {decades.map(decade => (
                <FilterChip
                  key={decade}
                  label={decade}
                  active={selectedDecade === decade.replace('s', '')}
                  onClick={() => setSelectedDecade(
                    selectedDecade === decade.replace('s', '') ? null : decade.replace('s', '')
                  )}
                />
              ))}
            </div>
          </div>

          {/* Genres */}
          {genres.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">Genre</h4>
              <div className="flex flex-wrap gap-2">
                <FilterChip 
                  label="All" 
                  active={!selectedGenre} 
                  onClick={() => setSelectedGenre(null)} 
                />
                {genres.slice(0, 10).map(g => (
                  <FilterChip
                    key={g.genre}
                    label={g.genre}
                    count={g.count}
                    active={selectedGenre === g.genre}
                    onClick={() => setSelectedGenre(
                      selectedGenre === g.genre ? null : g.genre
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Roles */}
          {roles.length > 1 && (
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">Role</h4>
              <div className="flex flex-wrap gap-2">
                <FilterChip 
                  label="All" 
                  active={!selectedRole} 
                  onClick={() => setSelectedRole(null)} 
                />
                {roles.map(r => (
                  <FilterChip
                    key={r.role}
                    label={r.role}
                    count={r.count}
                    active={selectedRole === r.role}
                    onClick={() => setSelectedRole(
                      selectedRole === r.role ? null : r.role
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sort */}
          <div className="flex items-center gap-4 pt-2 border-t border-white/10">
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wide">Sort by</h4>
            <div className="flex gap-2">
              {[
                { value: 'year', label: 'Year' },
                { value: 'rating', label: 'Rating' },
                { value: 'title', label: 'Title' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    if (sortBy === option.value) {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy(option.value as typeof sortBy);
                      setSortOrder('desc');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === option.value
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  {option.label}
                  {sortBy === option.value && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300"
            >
              <X className="w-3 h-3" />
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/50">
          Showing {displayedMovies.length} of {filteredMovies.length} movies
          {filteredMovies.length !== movies.length && (
            <span className="text-orange-400/70"> (filtered from {movies.length})</span>
          )}
        </span>
      </div>

      {/* Movies Grid */}
      {displayedMovies.length > 0 ? (
        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
            : 'space-y-3'
          }
        `}>
          {displayedMovies.map(movie => (
            viewMode === 'grid' ? (
              <MovieGridItem key={movie.id} movie={movie} showRole={roles.length > 1} />
            ) : (
              <CompactMovieCard 
                key={movie.id} 
                movie={movie}
                showRating
                showBadge
                layout="horizontal"
              />
            )
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Film className="w-12 h-12 mx-auto mb-4 text-white/20" />
          <p className="text-white/50 mb-2">No movies found</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-orange-400 hover:text-orange-300 text-sm"
            >
              Clear filters to see all movies
            </button>
          )}
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      )}
    </div>
  );
}

export default FilmographyTab;
