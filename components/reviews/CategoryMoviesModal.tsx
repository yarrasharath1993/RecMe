'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Star, Award, Gem, Clock, Loader2 } from 'lucide-react';

export type CategoryType = 'blockbusters' | 'classics' | 'hidden-gems' | null;

interface MovieCard {
  id: string;
  title_en: string;
  title_te?: string;
  slug: string;
  poster_url?: string;
  release_year: number;
  our_rating?: number;
  avg_rating?: number;
  is_classic?: boolean;
  is_blockbuster?: boolean;
  is_underrated?: boolean;
}

interface CategoryMoviesModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryType;
  language?: string;
}

const CATEGORY_CONFIG: Record<Exclude<CategoryType, null>, {
  title: string;
  titleTe: string;
  icon: React.ReactNode;
  emoji: string;
  gradient: string;
  description: string;
}> = {
  blockbusters: {
    title: 'Blockbusters',
    titleTe: 'బ్లాక్‌బస్టర్లు',
    icon: <Award className="w-6 h-6" />,
    emoji: '🎬',
    gradient: 'from-orange-500 to-amber-500',
    description: 'Big-budget hits that dominated the box office',
  },
  classics: {
    title: 'Telugu Classics',
    titleTe: 'క్లాసిక్స్',
    icon: <Clock className="w-6 h-6" />,
    emoji: '⭐',
    gradient: 'from-yellow-500 to-orange-500',
    description: 'Timeless masterpieces of Telugu cinema',
  },
  'hidden-gems': {
    title: 'Hidden Gems',
    titleTe: 'దాగిన రత్నాలు',
    icon: <Gem className="w-6 h-6" />,
    emoji: '💎',
    gradient: 'from-purple-500 to-pink-500',
    description: 'Underrated movies worth discovering',
  },
};

export function CategoryMoviesModal({ 
  isOpen, 
  onClose, 
  category, 
  language = 'Telugu' 
}: CategoryMoviesModalProps) {
  const [movies, setMovies] = useState<MovieCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoryMovies = useCallback(async () => {
    if (!category) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.set('mode', 'category');
      params.set('category', category);
      if (language) params.set('language', language);
      
      const res = await fetch(`/api/reviews/sections?${params}`);
      const data = await res.json();
      
      if (data.success && data.movies) {
        setMovies(data.movies);
      } else {
        setError('Failed to load movies');
      }
    } catch (err) {
      console.error('Error fetching category movies:', err);
      setError('Failed to load movies. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [category, language]);

  useEffect(() => {
    if (isOpen && category) {
      fetchCategoryMovies();
    }
  }, [isOpen, category, fetchCategoryMovies]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !category) return null;

  const config = CATEGORY_CONFIG[category];

  const getDisplayRating = (movie: MovieCard): string => {
    if (movie.our_rating && movie.our_rating > 0) return movie.our_rating.toFixed(1);
    if (movie.avg_rating && movie.avg_rating > 0) return movie.avg_rating.toFixed(1);
    return '—';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-4xl bg-[var(--bg-primary)] rounded-t-2xl sm:rounded-2xl border border-[var(--border-primary)]/50 overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div 
          className={`p-4 sm:p-6 bg-gradient-to-r ${config.gradient} flex-shrink-0`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{config.emoji}</span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {config.title}
                </h2>
                <p className="text-sm text-white/80 hidden sm:block">
                  {config.description}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--text-secondary)]" />
              <span className="ml-3 text-[var(--text-secondary)]">Loading {config.title.toLowerCase()}...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchCategoryMovies}
                className="px-4 py-2 bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : movies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-secondary)]">No movies found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {movies.map((movie) => (
                <Link
                  key={movie.id}
                  href={`/reviews/${movie.slug}`}
                  onClick={onClose}
                  className="group relative rounded-lg overflow-hidden bg-[var(--bg-secondary)] hover:ring-2 hover:ring-orange-500 transition-all"
                >
                  {/* Poster */}
                  <div className="aspect-[2/3] relative">
                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title_en}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                        <span className="text-4xl opacity-30">🎬</span>
                      </div>
                    )}
                    
                    {/* Rating Badge */}
                    {(movie.our_rating || movie.avg_rating) && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 rounded text-xs font-bold text-white">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        {getDisplayRating(movie)}
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    <div className="absolute top-2 left-2">
                      {category === 'blockbusters' && (
                        <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded">
                          🎬
                        </span>
                      )}
                      {category === 'classics' && (
                        <span className="px-1.5 py-0.5 bg-yellow-500 text-black text-[10px] font-bold rounded">
                          ⭐
                        </span>
                      )}
                      {category === 'hidden-gems' && (
                        <span className="px-1.5 py-0.5 bg-purple-500 text-white text-[10px] font-bold rounded">
                          💎
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-2">
                    <h3 className="font-medium text-sm text-[var(--text-primary)] line-clamp-1 group-hover:text-orange-400 transition-colors">
                      {movie.title_en}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {movie.release_year}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && movies.length > 0 && (
          <div className="flex-shrink-0 p-4 border-t border-[var(--border-primary)]/30 bg-[var(--bg-secondary)]">
            <p className="text-center text-sm text-[var(--text-secondary)]">
              Showing {movies.length} {config.title.toLowerCase()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

