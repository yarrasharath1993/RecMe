'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, Clock, Film, Clapperboard, User, Tag, Calendar, Trophy, Sparkles, Heart, Music, Flame, Award } from 'lucide-react';
import { isValidImageUrl } from "@/lib/utils/safe-image";

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
  relevanceScore?: number;
}

export interface SimilarSection {
  id: string;
  title: string;
  subtitle?: string;
  movies: SimilarMovie[];
  matchType:
    | "best"
    | "director"
    | "hero"
    | "heroine"
    | "genre"
    | "era"
    | "tags"
    | "rating"
    | "classics"
    | "blockbusters"
    | "recent"
    | "music"
    | "cinematographer"
    | "production"
    | "support_cast"
    | "producer";
  priority: number;
  totalCount?: number; // Total movies available for this section (for "View All" link)
}

interface SimilarMoviesCarouselProps {
  movies?: SimilarMovie[];
  sections?: SimilarSection[];
  title?: string;
}

// ============================================================
// MOVIE POSTER WITH ERROR HANDLING
// ============================================================

function MoviePoster({ movie, posterSize }: { movie: SimilarMovie; posterSize: string }) {
  const [imageError, setImageError] = useState(false);

  return (
    <>
      {movie.poster_url && isValidImageUrl(movie.poster_url) && !imageError ? (
        <Image
          src={movie.poster_url}
          alt={movie.title_en}
          fill
          className="object-cover"
          sizes={posterSize}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Film className="w-6 h-6 text-[var(--text-disabled)]" />
        </div>
      )}
    </>
  );
}

// Section styling configuration - expanded with more types
// Uses CSS variables for theme-aware backgrounds
const sectionStyles: Record<
  string,
  {
    icon: React.ReactNode;
    accentFrom: string;
    border: string;
    iconBg: string;
    accent: string;
  }
> = {
  best: {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    accentFrom: "from-amber-500/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-amber-500/20",
    accent: "text-[var(--accent-warning)]",
  },
  director: {
    icon: <Clapperboard className="w-3.5 h-3.5" />,
    accentFrom: "from-violet-500/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-violet-500/20",
    accent: "text-[var(--accent-purple)]",
  },
  hero: {
    icon: <User className="w-3.5 h-3.5" />,
    accentFrom: "from-blue-500/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-blue-500/20",
    accent: "text-[var(--accent-info)]",
  },
  heroine: {
    icon: <Heart className="w-3.5 h-3.5" />,
    accentFrom: "from-rose-500/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-rose-500/20",
    accent: "text-rose-500",
  },
  genre: {
    icon: <Tag className="w-3.5 h-3.5" />,
    accentFrom: "from-emerald-500/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-emerald-500/20",
    accent: "text-[var(--accent-success)]",
  },
  era: {
    icon: <Calendar className="w-3.5 h-3.5" />,
    accentFrom: "from-orange-500/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-orange-500/20",
    accent: "text-[var(--accent-orange)]",
  },
  tags: {
    icon: <Trophy className="w-3.5 h-3.5" />,
    accentFrom: "from-pink-500/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-pink-500/20",
    accent: "text-pink-500",
  },
  rating: {
    icon: <Star className="w-3.5 h-3.5" />,
    accentFrom: "from-yellow-500/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-yellow-500/20",
    accent: "text-[var(--accent-warning)]",
  },
  classics: {
    icon: <Award className="w-3.5 h-3.5" />,
    accentFrom: "from-indigo-500/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-indigo-500/20",
    accent: "text-indigo-500",
  },
  blockbusters: {
    icon: <Flame className="w-3.5 h-3.5" />,
    accentFrom: "from-red-500/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-red-500/20",
    accent: "text-red-500",
  },
  recent: {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    accentFrom: "from-cyan-500/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-cyan-500/20",
    accent: "text-cyan-500",
  },
  music: {
    icon: <Music className="w-3.5 h-3.5" />,
    accentFrom: "from-fuchsia-500/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-fuchsia-500/20",
    accent: "text-fuchsia-500",
  },
  cinematographer: {
    icon: <Film className="w-3.5 h-3.5" />,
    accentFrom: "from-teal-500/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-teal-500/20",
    accent: "text-teal-500",
  },
  production: {
    icon: <Clapperboard className="w-3.5 h-3.5" />,
    accentFrom: "from-slate-500/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-slate-500/20",
    accent: "text-slate-500",
  },
  support_cast: {
    icon: <User className="w-3.5 h-3.5" />,
    accentFrom: "from-sky-500/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-sky-500/20",
    accent: "text-sky-500",
  },
  producer: {
    icon: <Clapperboard className="w-3.5 h-3.5" />,
    accentFrom: "from-amber-600/10",
    border: "border-[var(--border-primary)]",
    iconBg: "bg-amber-600/20",
    accent: "text-amber-600",
  },
};

// Helper to build filter URL for "View All" link
function buildFilterUrl(matchType: string, title: string): string | null {
  // Extract filter value from title (e.g., "More from Sukumar" -> "Sukumar")
  const patterns: Record<string, { param: string; extract: RegExp | null }> = {
    director: { param: 'director', extract: /More from (.+)/ },
    hero: { param: 'hero', extract: /More (.+) Movies/ },
    heroine: { param: 'heroine', extract: /More (.+) Movies/ },
    music: { param: 'music_director', extract: /More from (.+)/ },
    producer: { param: 'producer', extract: /More from (.+)/ },
    cinematographer: { param: 'cinematographer', extract: /Shot by (.+)/ },
    production: { param: 'production_company', extract: /More from (.+)/ },
    support_cast: { param: 'hero', extract: /More with (.+)/ },
    genre: { param: 'genre', extract: /More (.+) Movies/ },
    era: { param: 'decade', extract: /Best of (\d+)s/ },
    blockbusters: { param: 'blockbuster', extract: null },
    classics: { param: 'classic', extract: null },
    rating: { param: 'top_rated', extract: null },
  };

  const config = patterns[matchType];
  if (!config) return null;

  if (config.extract) {
    const match = title.match(config.extract);
    if (match && match[1]) {
      return `/movies?${config.param}=${encodeURIComponent(match[1])}`;
    }
  } else {
    // For blockbusters, classics, rating - use boolean filter
    return `/movies?${config.param}=true`;
  }
  return null;
}

// Single section carousel component - compact design for 50% width grid
function SectionCarousel({
  movies,
  title,
  subtitle,
  matchType = "best",
  totalCount,
}: {
  movies: SimilarMovie[];
  title: string;
  subtitle?: string;
  matchType?: string;
  totalCount?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [movies]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.6;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
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

  const style = sectionStyles[matchType] || sectionStyles.best;

  // Compact card sizes for 50% width layout
  const cardWidth = "w-24 md:w-28";
  const posterSize = "(max-width: 768px) 96px, 112px";

  return (
    <div
      className={`rounded-lg border ${style.border} overflow-hidden h-full bg-gradient-to-br ${style.accentFrom} to-transparent`}
      style={{ backgroundColor: "var(--bg-section)" }}
    >
      {/* Header - Fixed layout to prevent overflow */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border-primary)]/30 min-w-0">
        {/* Title section with flex-shrink */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`p-1.5 rounded-md ${style.iconBg} flex-shrink-0`}>
            <span className={style.accent}>{style.icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                {title}
              </h3>
              {/* Movie count badge */}
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] flex-shrink-0">
                {totalCount || movies.length}
              </span>
            </div>
            {subtitle && (
              <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* View All link + Scroll buttons - fixed width, no shrink */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* View All link */}
          {(() => {
            const filterUrl = buildFilterUrl(matchType, title);
            return filterUrl ? (
              <Link
                href={filterUrl}
                className="text-[9px] px-2 py-1 rounded-md bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                View All
              </Link>
            ) : null;
          })()}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`p-1 rounded-full transition-all ${
              canScrollLeft
                ? "bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text-primary)]"
                : "bg-[var(--bg-secondary)] text-[var(--text-disabled)] cursor-not-allowed"
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`p-1 rounded-full transition-all ${
              canScrollRight
                ? "bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text-primary)]"
                : "bg-[var(--bg-secondary)] text-[var(--text-disabled)] cursor-not-allowed"
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto p-3 scrollbar-hide scroll-smooth snap-x snap-mandatory"
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="flex-shrink-0 snap-start"
              onMouseEnter={() => setHoveredId(movie.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Card - compact for 50% width sections */}
              <div
                className={`relative ${cardWidth} transition-transform duration-200 ease-out ${
                  hoveredId === movie.id ? "md:scale-105 md:z-20" : "z-0"
                }`}
              >
                <Link href={`/movies/${movie.slug}`} className="block group">
                  <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-[var(--bg-secondary)] ring-1 ring-[var(--border-primary)] group-hover:ring-[var(--border-accent)] transition-all shadow-md">
                    <MoviePoster movie={movie} posterSize={posterSize} />

                    {/* Rating Badge */}
                    {movie.avg_rating && movie.avg_rating > 0 && (
                      <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1 py-0.5 bg-black/75 backdrop-blur-sm rounded text-[9px] font-semibold">
                        <Star className="w-2 h-2 text-[var(--accent-warning)] fill-current" />
                        <span className="text-white">
                          {movie.avg_rating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div
                      className={`absolute inset-0 flex flex-col justify-end p-1.5 bg-gradient-to-t from-black via-black/60 to-transparent transition-opacity duration-150 ${
                        hoveredId === movie.id ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <h4 className="text-white font-medium text-[10px] leading-tight line-clamp-2">
                        {movie.title_en}
                      </h4>

                      <div className="flex items-center gap-1 text-gray-300 text-[8px] mt-0.5">
                        {movie.release_year && (
                          <span>{movie.release_year}</span>
                        )}
                        {movie.genres && movie.genres[0] && (
                          <>
                            <span className="text-gray-500">•</span>
                            <span className="truncate">{movie.genres[0]}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Title below poster */}
                <div
                  className={`mt-1.5 transition-opacity duration-150 ${
                    hoveredId === movie.id ? "md:opacity-0" : "opacity-100"
                  }`}
                >
                  <p className="text-[var(--text-primary)] text-[10px] font-medium truncate">
                    {movie.title_en}
                  </p>
                  <p className="text-[var(--text-tertiary)] text-[9px] truncate">
                    {movie.release_year}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Initial number of sections to show
const INITIAL_SECTIONS = 4;
// Number of sections to load when expanding
const SECTIONS_PER_LOAD = 4;

// Main component - all sections at 50% width in 2-column grid with lazy loading
export function SimilarMoviesCarousel({ movies, sections, title = "Similar Movies" }: SimilarMoviesCarouselProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_SECTIONS);
  const [isExpanded, setIsExpanded] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Filter sections with at least 3 movies
  const validSections = sections?.filter((s) => s.movies.length >= 3) || [];

  // Intersection Observer for auto-loading more sections
  useEffect(() => {
    if (!loadMoreRef.current || isExpanded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < validSections.length) {
          setVisibleCount((prev) =>
            Math.min(prev + SECTIONS_PER_LOAD, validSections.length)
          );
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [visibleCount, validSections.length, isExpanded]);

  // Auto-expand when all sections can fit
  useEffect(() => {
    if (validSections.length <= INITIAL_SECTIONS) {
      setIsExpanded(true);
    }
  }, [validSections.length]);

  if (sections && sections.length > 0) {
    if (validSections.length === 0) return null;

    const sectionsToShow = isExpanded
      ? validSections
      : validSections.slice(0, visibleCount);
    const hasMore = !isExpanded && visibleCount < validSections.length;
    const totalMovies = validSections.reduce(
      (sum, s) => sum + s.movies.length,
      0
    );

    return (
      <div className="space-y-3">
        {/* Section count indicator */}
        <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
          <span>
            Showing {sectionsToShow.length} of {validSections.length} sections (
            {totalMovies} movies)
          </span>
          {hasMore && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-[var(--accent-primary)] hover:underline"
            >
              Show all sections
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sectionsToShow.map((section) => (
            <SectionCarousel
              key={section.id}
              movies={section.movies}
              title={section.title}
              subtitle={section.subtitle}
              matchType={section.matchType}
              totalCount={section.totalCount || section.movies.length}
            />
          ))}
        </div>

        {/* Load more trigger for intersection observer */}
        {hasMore && (
          <div ref={loadMoreRef} className="py-4 flex justify-center">
            <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
              <div className="w-4 h-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
              <span>Loading more sections...</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback: single section wrapped in grid
  if (movies && movies.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SectionCarousel
          movies={movies}
          title={title}
          matchType="best"
        />
      </div>
    );
  }

  return null;
}
