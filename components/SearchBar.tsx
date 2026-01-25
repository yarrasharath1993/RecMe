'use client';

/**
 * SearchBar Component
 * 
 * Premium expandable search bar with:
 * - Movies and People search
 * - Expandable/collapsible on mobile
 * - Keyboard shortcuts (Cmd/Ctrl + K)
 * - Recent searches
 * - Quick suggestions
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, TrendingUp, ArrowRight, Film, Star, User, Clapperboard, Music } from 'lucide-react';
import Image from 'next/image';
import { slugify } from '@/lib/utils/slugify';

interface SearchBarProps {
  variant?: 'header' | 'page' | 'mobile';
  placeholder?: string;
  className?: string;
  onClose?: () => void;
}

interface MovieSuggestion {
  id: string;
  title_en: string;
  title_te?: string;
  slug: string;
  release_year?: number;
  poster_url?: string;
  our_rating?: number;
  director?: string;
}

interface PersonSuggestion {
  name: string;
  role: 'actor' | 'director' | 'music_director';
  movie_count: number;
  avg_rating: number;
  sample_movie?: string;
  sample_year?: number;
}

interface RecentSearch {
  term: string;
  url: string;
  type: 'person' | 'movie' | 'search';
  timestamp: number;
}

// Popular search terms (can be fetched from API)
const TRENDING_SEARCHES = [
  'పుష్ప 2',
  'Chiranjeevi',
  'RRR',
  'Baahubali',
  'Nagarjuna',
];

const MAX_RECENT_SEARCHES = 5;

// Role icons and labels
const ROLE_CONFIG = {
  actor: { icon: User, label: 'Actor', color: 'text-blue-400' },
  director: { icon: Clapperboard, label: 'Director', color: 'text-amber-400' },
  music_director: { icon: Music, label: 'Music', color: 'text-purple-400' },
};

export function SearchBar({
  variant = 'header',
  placeholder = 'Search movies, actors...',
  className = '',
  onClose,
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(variant === 'page');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [movieSuggestions, setMovieSuggestions] = useState<MovieSuggestion[]>([]);
  const [peopleSuggestions, setPeopleSuggestions] = useState<PersonSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch movie and people suggestions as user types
  useEffect(() => {
    if (query.length < 2) {
      setMovieSuggestions([]);
      setPeopleSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setMovieSuggestions(data.movies || []);
          setPeopleSuggestions(data.people || []);
        }
      } catch (error) {
        console.error('Search error:', error);
        setMovieSuggestions([]);
        setPeopleSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [query]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('teluguvibes-recent-searches');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Handle backward compatibility with old string[] format
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof parsed[0] === 'string') {
            // Convert old format to new format
            const converted: RecentSearch[] = parsed.map((term: string) => ({
              term,
              url: `/search?q=${encodeURIComponent(term)}`,
              type: 'search' as const,
              timestamp: Date.now(),
            }));
            setRecentSearches(converted);
            localStorage.setItem('teluguvibes-recent-searches', JSON.stringify(converted));
          } else {
            setRecentSearches(parsed);
          }
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
        setShowSuggestions(false);
        onClose?.();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, onClose]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        if (variant === 'header' && !query) {
          setIsExpanded(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query, variant]);

  // Save to recent searches
  const saveSearch = useCallback((term: string, url: string, type: 'person' | 'movie' | 'search') => {
    const trimmed = term.trim();
    if (!trimmed) return;
    
    const newSearch: RecentSearch = {
      term: trimmed,
      url,
      type,
      timestamp: Date.now(),
    };
    
    // Remove duplicates based on URL (same destination)
    const updated = [newSearch, ...recentSearches.filter(s => s.url !== url)]
      .slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem('teluguvibes-recent-searches', JSON.stringify(updated));
  }, [recentSearches]);

  // Handle search submission
  const handleSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    
    const url = `/search?q=${encodeURIComponent(trimmed)}`;
    saveSearch(trimmed, url, 'search');
    setShowSuggestions(false);
    setIsExpanded(false);
    router.push(url);
    onClose?.();
  };

  // Handle recent search click
  const handleRecentSearchClick = (search: RecentSearch) => {
    setShowSuggestions(false);
    setIsExpanded(false);
    router.push(search.url);
    onClose?.();
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('teluguvibes-recent-searches');
  };

  // Compact search bar (header variant when collapsed) - looks like a real search input
  if (variant === 'header' && !isExpanded) {
    return (
      <button
        onClick={() => {
          setIsExpanded(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border-secondary)] hover:border-orange-500/30 transition-all group shadow-sm hover:shadow-md min-w-[200px] sm:min-w-[280px]"
        aria-label="Search"
        title="Search (⌘K)"
      >
        <Search className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-orange-400 transition-colors flex-shrink-0" />
        <span className="text-sm text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors flex-1 text-left truncate">
          Search movies, actors...
        </span>
        <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded-md font-medium bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border-secondary)] flex-shrink-0">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Premium Search Input */}
      <div 
        className={`flex items-center gap-3 rounded-2xl transition-all ${
          variant === 'page' 
            ? 'px-5 py-4 text-base' 
            : 'px-4 py-2.5 text-sm'
        } ${showSuggestions ? 'ring-2 ring-orange-500/50 shadow-lg shadow-orange-500/10' : 'shadow-md hover:shadow-lg'}`}
        style={{ 
          background: 'var(--bg-tertiary)', 
          border: showSuggestions ? '1px solid rgb(249, 115, 22, 0.5)' : '1px solid var(--border-secondary)',
        }}
      >
        <Search 
          className={`flex-shrink-0 transition-colors ${variant === 'page' ? 'w-5 h-5' : 'w-4 h-4'} ${showSuggestions ? 'text-orange-400' : 'text-[var(--text-tertiary)]'}`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(query);
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none min-w-[160px] placeholder:text-[var(--text-tertiary)]"
          style={{ color: 'var(--text-primary)' }}
          autoFocus={variant !== 'page'}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
        )}
        {variant === 'header' && (
          <button
            onClick={() => {
              setIsExpanded(false);
              setShowSuggestions(false);
              onClose?.();
            }}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
        )}
        <kbd 
          className="hidden sm:flex items-center gap-0.5 px-2 py-1 text-[10px] rounded-lg font-medium bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border-secondary)]"
        >
          ⌘K
        </kbd>
      </div>

      {/* Premium Suggestions Dropdown */}
      {showSuggestions && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
          style={{ 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border-primary)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Recent Searches */}
          {recentSearches.length > 0 && !query && (
            <div className="p-4 border-b border-[var(--border-secondary)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentSearchClick(search)}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-left transition-all hover:bg-[var(--bg-hover)] group"
                  >
                    <Clock className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]" />
                    <span className="text-[var(--text-primary)]">{search.term}</span>
                    {search.type !== 'search' && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                        {search.type}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          {!query && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Trending
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(term)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all bg-gradient-to-r from-[var(--bg-tertiary)] to-[var(--bg-secondary)] border border-[var(--border-secondary)] hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 text-[var(--text-primary)]"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Suggestions */}
          {query && (
            <div className="max-h-[70vh] overflow-y-auto">
              {/* Loading state */}
              {isSearching && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin border-orange-500" />
                </div>
              )}

              {/* People results */}
              {!isSearching && peopleSuggestions.length > 0 && (
                <div className="p-3 border-b border-[var(--border-secondary)]">
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      People
                    </span>
                  </div>
                  <div className="space-y-1">
                    {peopleSuggestions.map((person, idx) => {
                      const roleConfig = ROLE_CONFIG[person.role];
                      const RoleIcon = roleConfig.icon;
                      const personUrl = `/movies?profile=${slugify(person.name)}`;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            saveSearch(person.name, personUrl, 'person');
                            setShowSuggestions(false);
                            setIsExpanded(false);
                            router.push(personUrl);
                            onClose?.();
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-left transition-all hover:bg-[var(--bg-hover)] group"
                        >
                          {/* Person avatar placeholder */}
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-secondary)] border border-[var(--border-secondary)] flex items-center justify-center">
                            <RoleIcon className={`w-5 h-5 ${roleConfig.color}`} />
                          </div>
                          
                          {/* Person info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[var(--text-primary)] group-hover:text-orange-400 transition-colors">
                              {person.name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                              <span className={`${roleConfig.color} font-medium`}>{roleConfig.label}</span>
                              <span>•</span>
                              <span>{person.movie_count} movies</span>
                              {person.avg_rating > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                                    {person.avg_rating.toFixed(1)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Movie results */}
              {!isSearching && movieSuggestions.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <Film className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Movies
                    </span>
                  </div>
                  <div className="space-y-1">
                    {movieSuggestions.map((movie) => {
                      const movieUrl = `/movies/${movie.slug}`;
                      return (
                      <button
                        key={movie.id}
                        onClick={() => {
                            saveSearch(movie.title_en, movieUrl, 'movie');
                          setShowSuggestions(false);
                          setIsExpanded(false);
                            router.push(movieUrl);
                          onClose?.();
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-left transition-all hover:bg-[var(--bg-hover)] group"
                      >
                        {/* Movie poster */}
                        <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]">
                          {movie.poster_url ? (
                            <Image
                              src={movie.poster_url}
                              alt={movie.title_en}
                              width={40}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-5 h-5 text-[var(--text-tertiary)]" />
                            </div>
                          )}
                        </div>
                        
                        {/* Movie info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[var(--text-primary)] truncate group-hover:text-orange-400 transition-colors">
                            {movie.title_en}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                            {movie.release_year && (
                              <span className="text-emerald-400 font-medium">{movie.release_year}</span>
                            )}
                            {movie.director && (
                              <>
                                <span>•</span>
                                <span className="truncate">{movie.director}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Rating badge */}
                        {movie.our_rating && movie.our_rating > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                            <span className="text-xs font-bold text-orange-400">
                              {movie.our_rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No results */}
              {!isSearching && query.length >= 2 && movieSuggestions.length === 0 && peopleSuggestions.length === 0 && (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                    <Search className="w-6 h-6 text-[var(--text-tertiary)]" />
                  </div>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    No results found for &quot;{query}&quot;
                  </p>
                </div>
              )}

              {/* Search all option */}
              <div className="p-3 border-t border-[var(--border-secondary)] bg-[var(--bg-primary)]/50">
                <button
                  onClick={() => handleSearch(query)}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm transition-all bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/20 group"
                >
                  <span className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                    <Search className="w-4 h-4 text-orange-400" />
                    Search all for &quot;{query}&quot;
                  </span>
                  <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;







