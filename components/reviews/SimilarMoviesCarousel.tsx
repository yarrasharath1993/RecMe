'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, Clock, Film, ExternalLink } from 'lucide-react';

interface SimilarMovie {
  id: string;
  title_en: string;
  title_te?: string;
  slug: string;
  poster_url?: string;
  avg_rating?: number;
  release_year?: number;
  runtime_minutes?: number;
  genres?: string[];
}

interface SimilarMoviesCarouselProps {
  movies: SimilarMovie[];
  title?: string;
}

export function SimilarMoviesCarousel({ movies, title = "Similar Movies" }: SimilarMoviesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Check scroll position to show/hide arrows
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [movies]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const formatRuntime = (minutes?: number) => {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        
        {/* Desktop scroll buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full transition-all ${
              canScrollLeft
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-gray-900 text-gray-600 cursor-not-allowed'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-2 rounded-full transition-all ${
              canScrollRight
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-gray-900 text-gray-600 cursor-not-allowed'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Gradient Fade */}
        {canScrollLeft && (
          <div className="hidden md:block absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        )}
        
        {/* Right Gradient Fade */}
        {canScrollRight && (
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory"
          style={{ scrollPaddingLeft: '1rem' }}
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="flex-shrink-0 snap-start relative"
              onMouseEnter={() => setHoveredId(movie.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Card Container with hover scale */}
              <div
                className={`relative w-36 md:w-44 transition-all duration-300 ease-out ${
                  hoveredId === movie.id ? 'md:scale-110 md:z-20' : 'z-0'
                }`}
              >
                {/* Poster */}
                <Link href={`/reviews/${movie.slug}`} className="block">
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 shadow-lg">
                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title_en}
                        fill
                        className="object-cover transition-transform duration-300"
                        sizes="(max-width: 768px) 144px, 176px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-10 h-10 text-gray-600" />
                      </div>
                    )}

                    {/* Rating Badge */}
                    {movie.avg_rating && movie.avg_rating > 0 && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-xs font-medium">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400">{movie.avg_rating.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Hover Overlay (Desktop only) */}
                    <div
                      className={`hidden md:flex absolute inset-0 flex-col justify-end p-3 bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-300 ${
                        hoveredId === movie.id ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {/* Title */}
                      <h3 className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">
                        {movie.title_en}
                      </h3>
                      
                      {/* Telugu Title */}
                      {movie.title_te && (
                        <p className="text-yellow-400 text-xs mb-2 truncate">{movie.title_te}</p>
                      )}
                      
                      {/* Meta Row */}
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                        {movie.release_year && <span>{movie.release_year}</span>}
                        {movie.runtime_minutes && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRuntime(movie.runtime_minutes)}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Genres */}
                      {movie.genres && movie.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {movie.genres.slice(0, 2).map((genre) => (
                            <span
                              key={genre}
                              className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-gray-300"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* View Review Button */}
                      <div className="flex items-center justify-center gap-1.5 py-1.5 bg-yellow-500 hover:bg-yellow-400 rounded text-black text-xs font-medium transition-colors">
                        View Review
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Title below poster (Mobile & default state on desktop) */}
                <div className={`mt-2 transition-opacity duration-300 ${hoveredId === movie.id ? 'md:opacity-0' : 'opacity-100'}`}>
                  <p className="text-gray-300 text-xs font-medium truncate">{movie.title_en}</p>
                  <p className="text-gray-500 text-xs truncate">
                    {movie.release_year}
                    {movie.genres && movie.genres[0] && ` • ${movie.genres[0]}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

