'use client';

/**
 * Premium Movie Placeholder Component
 * Modern glassmorphism design with real actor/actress images
 * Features: Frosted glass effect, gradient borders, actor portraits, brand elements
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Film } from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

export interface MoviePlaceholderProps {
  movie: {
    id?: string;
    title_en: string;
    title_te?: string | null;
    release_year: number;
    hero?: string | null;
    heroine?: string | null;
    director?: string | null;
  };
  castImages?: {
    hero?: string | null;
    heroine?: string | null;
    director?: string | null;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  /** If true, fetches cast images from API */
  fetchCastImages?: boolean;
}

interface CastMember {
  name: string;
  role: 'hero' | 'heroine' | 'director';
  image?: string | null;
  initials: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const SIZE_CONFIG = {
  xs: {
    portraitSize: 32,
    titleSize: 'text-[11px]',
    yearSize: 'text-[9px]',
    directorSize: 'text-[8px]',
    padding: 'p-2',
    gap: 'gap-1.5',
  },
  sm: {
    portraitSize: 40,
    titleSize: 'text-xs',
    yearSize: 'text-[10px]',
    directorSize: 'text-[9px]',
    padding: 'p-3',
    gap: 'gap-2',
  },
  md: {
    portraitSize: 52,
    titleSize: 'text-sm',
    yearSize: 'text-xs',
    directorSize: 'text-[10px]',
    padding: 'p-4',
    gap: 'gap-3',
  },
  lg: {
    portraitSize: 64,
    titleSize: 'text-base',
    yearSize: 'text-sm',
    directorSize: 'text-xs',
    padding: 'p-5',
    gap: 'gap-4',
  },
};

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================
// SHIMMER LOADING SKELETON
// ============================================================

function ShimmerCircle({ size }: { size: number }) {
  return (
    <div 
      className="rounded-full animate-pulse"
      style={{ 
        width: size, 
        height: size,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

// ============================================================
// ACTOR PORTRAIT WITH GLOW
// ============================================================

function ActorPortrait({ 
  member, 
  size,
  isPrimary = false,
  isLoading = false,
}: { 
  member: CastMember; 
  size: number;
  isPrimary?: boolean;
  isLoading?: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  
  if (isLoading) {
    return <ShimmerCircle size={size} />;
  }
  
  const hasImage = member.image && !imageError;
  
  // Gradient colors for border glow
  const glowColor = isPrimary ? '#f97316' : '#fbbf24';
  
  return (
    <div 
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
      title={member.name}
    >
      {/* Outer glow ring */}
      <div 
        className="absolute inset-[-3px] rounded-full opacity-70 blur-[4px]"
        style={{
          background: `linear-gradient(135deg, ${glowColor}, #ea580c)`,
        }}
      />
      
      {/* Main portrait container */}
      <div 
        className="relative w-full h-full rounded-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${glowColor}, #ea580c)`,
          padding: '2px',
        }}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-[#0f0f23]">
          {hasImage ? (
            <Image
              src={member.image!}
              alt={member.name}
              fill
              className="object-cover"
              sizes={`${size}px`}
              onError={() => setImageError(true)}
            />
          ) : (
            // Initials fallback with premium gradient
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(145deg, rgba(249, 115, 22, 0.3), rgba(234, 88, 12, 0.15))`,
              }}
            >
              <span 
                className="font-bold"
                style={{ 
                  fontSize: size * 0.38,
                  color: glowColor,
                  textShadow: `0 0 10px ${glowColor}40`,
                }}
              >
                {member.initials}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PLACEHOLDER COMPONENT
// ============================================================

export function MoviePlaceholder({
  movie,
  castImages: propCastImages,
  size = 'sm',
  className = '',
  fetchCastImages = false,
}: MoviePlaceholderProps) {
  const [castImages, setCastImages] = useState(propCastImages || {});
  const [isLoading, setIsLoading] = useState(fetchCastImages && !propCastImages);

  const config = SIZE_CONFIG[size];

  // Fetch cast images if enabled
  useEffect(() => {
    if (!fetchCastImages || propCastImages) return;
    
    const fetchImages = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        // Handle comma-separated names - use first name only for API lookup
        if (movie.hero) {
          const primaryHero = movie.hero.split(',')[0]?.trim();
          if (primaryHero) params.append('hero', primaryHero);
        }
        if (movie.heroine) {
          const primaryHeroine = movie.heroine.split(',')[0]?.trim();
          if (primaryHeroine) params.append('heroine', primaryHeroine);
        }
        if (movie.director) {
          const primaryDirector = movie.director.split(',')[0]?.trim();
          if (primaryDirector) params.append('director', primaryDirector);
        }
        
        if (params.toString()) {
          const res = await fetch(`/api/cast-images?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            setCastImages(data);
          }
        }
      } catch {
        // Silently fail - initials will show
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [fetchCastImages, movie.hero, movie.heroine, movie.director, propCastImages]);

  // Build cast members array (hero and heroine for portraits)
  // Handle comma-separated heroes/heroines
  const castMembers: CastMember[] = [];
  
  if (movie.hero && movie.hero !== 'Unknown' && movie.hero !== 'Various') {
    // Split on comma and take first hero for portrait
    const heroes = movie.hero.split(',').map(h => h.trim()).filter(Boolean);
    const primaryHero = heroes[0];
    if (primaryHero) {
      castMembers.push({
        name: primaryHero,
        role: 'hero',
        image: castImages?.hero,
        initials: getInitials(primaryHero),
      });
    }
  }
  
  if (movie.heroine && movie.heroine !== 'Unknown' && movie.heroine !== 'Various' && movie.heroine !== 'No Female Lead') {
    // Split on comma and take first heroine for portrait
    const heroines = movie.heroine.split(',').map(h => h.trim()).filter(Boolean);
    const primaryHeroine = heroines[0];
    if (primaryHeroine) {
      castMembers.push({
        name: primaryHeroine,
        role: 'heroine',
        image: castImages?.heroine,
        initials: getInitials(primaryHeroine),
      });
    }
  }

  // Display title
  const displayTitle = movie.title_te || movie.title_en;
  const hasTelugu = !!movie.title_te && movie.title_te !== movie.title_en;

  return (
    <div 
      className={`relative w-full h-full overflow-hidden ${className}`}
    >
      {/* Rich gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at top left, rgba(249, 115, 22, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at bottom right, rgba(251, 191, 36, 0.1) 0%, transparent 50%),
            linear-gradient(145deg, #0c0c1d 0%, #1a1a3e 40%, #0f0f23 100%)
          `,
        }}
      />
      
      {/* Animated subtle pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, #f97316 1px, transparent 1px),
            radial-gradient(circle at 80% 70%, #fbbf24 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.5) 0.5px, transparent 0.5px)
          `,
          backgroundSize: '32px 32px, 32px 32px, 16px 16px',
        }}
      />
      
      {/* Main glass container */}
      <div 
        className={`
          relative h-full flex flex-col items-center justify-center
          ${config.padding}
        `}
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Top glow accent */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 rounded-b-full"
          style={{
            background: 'linear-gradient(90deg, transparent, #f97316, #fbbf24, #f97316, transparent)',
            boxShadow: '0 0 15px rgba(249, 115, 22, 0.5)',
          }}
        />
        
        {/* Corner accents */}
        <div 
          className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 rounded-tl-lg"
          style={{ borderColor: 'rgba(249, 115, 22, 0.4)' }}
        />
        <div 
          className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 rounded-br-lg"
          style={{ borderColor: 'rgba(251, 191, 36, 0.4)' }}
        />

        {/* Cast portraits or film icon */}
        {castMembers.length > 0 ? (
          <div className={`flex items-center justify-center ${config.gap} mb-3`}>
            {castMembers.slice(0, 2).map((member, idx) => (
              <ActorPortrait 
                key={member.role} 
                member={member} 
                size={config.portraitSize}
                isPrimary={idx === 0}
                isLoading={isLoading}
              />
            ))}
          </div>
        ) : (
          // Film icon with glow
          <div 
            className="mb-3 p-3 rounded-full relative"
            style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(234, 88, 12, 0.15))',
              boxShadow: '0 0 20px rgba(249, 115, 22, 0.3), inset 0 0 15px rgba(249, 115, 22, 0.1)',
            }}
          >
            <Film 
              className="text-orange-400"
              style={{ 
                width: config.portraitSize * 0.6, 
                height: config.portraitSize * 0.6,
                filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))',
              }}
            />
          </div>
        )}

        {/* Movie title */}
        <div className="text-center px-2 max-w-full">
          <h3 
            className={`
              ${config.titleSize} font-bold line-clamp-2 leading-tight mb-1
              ${hasTelugu ? 'font-telugu' : 'font-display'}
            `}
            style={{
              color: 'rgba(255, 255, 255, 0.95)',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(249, 115, 22, 0.2)',
            }}
          >
            {displayTitle}
          </h3>
          
          {/* Year badge */}
          <div 
            className={`inline-block px-2 py-0.5 rounded-full ${config.yearSize} font-semibold`}
            style={{ 
              background: 'linear-gradient(90deg, rgba(249, 115, 22, 0.3), rgba(251, 191, 36, 0.3))',
              color: '#fbbf24',
              boxShadow: '0 0 10px rgba(251, 191, 36, 0.2)',
            }}
          >
            {movie.release_year}
          </div>
          
          {/* Director */}
          {movie.director && movie.director !== 'Unknown' && (
            <p 
              className={`${config.directorSize} mt-1.5 truncate max-w-full`}
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              Dir: {movie.director}
            </p>
          )}
        </div>

        {/* Brand footer */}
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div 
              className="h-px w-6"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.6))' }}
            />
            <span 
              className="text-[9px] font-medium tracking-wider"
              style={{ 
                color: 'rgba(249, 115, 22, 0.7)',
                textShadow: '0 0 10px rgba(249, 115, 22, 0.3)',
              }}
            >
              తెలుగు
            </span>
            <div 
              className="h-px w-6"
              style={{ background: 'linear-gradient(90deg, rgba(249, 115, 22, 0.6), transparent)' }}
            />
          </div>
        </div>
      </div>
      
      {/* CSS for shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// STATIC PLACEHOLDER (For grids - no API calls, simpler design)
// ============================================================

export function MoviePlaceholderStatic({
  title,
  titleTe,
  year,
  hero,
  heroine,
  director,
  heroImage,
  heroineImage,
  size = 'sm',
  className = '',
}: {
  title: string;
  titleTe?: string | null;
  year: number;
  hero?: string | null;
  heroine?: string | null;
  director?: string | null;
  heroImage?: string | null;
  heroineImage?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const config = SIZE_CONFIG[size];
  const displayTitle = titleTe || title;
  const hasTelugu = !!titleTe && titleTe !== title;

  // Build cast for portraits (handle comma-separated names)
  const castMembers: CastMember[] = [];
  
  if (hero && hero !== 'Unknown' && hero !== 'Various') {
    const primaryHero = hero.split(',')[0]?.trim();
    if (primaryHero) {
      castMembers.push({
        name: primaryHero,
        role: 'hero',
        image: heroImage,
        initials: getInitials(primaryHero),
      });
    }
  }
  
  if (heroine && heroine !== 'Unknown' && heroine !== 'Various' && heroine !== 'No Female Lead') {
    const primaryHeroine = heroine.split(',')[0]?.trim();
    if (primaryHeroine) {
      castMembers.push({
        name: primaryHeroine,
        role: 'heroine',
        image: heroineImage,
        initials: getInitials(primaryHeroine),
      });
    }
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at top left, rgba(249, 115, 22, 0.12) 0%, transparent 50%),
            linear-gradient(145deg, #0c0c1d 0%, #1a1a3e 50%, #0f0f23 100%)
          `,
        }}
      />
      
      {/* Pattern */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 30%, #f97316 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
      
      {/* Content */}
      <div 
        className={`relative h-full flex flex-col items-center justify-center ${config.padding}`}
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
        }}
      >
        {/* Top accent */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-b-full"
          style={{ background: 'linear-gradient(90deg, transparent, #f97316, transparent)' }}
        />

        {/* Cast portraits or film icon */}
        {castMembers.length > 0 ? (
          <div className={`flex items-center justify-center ${config.gap} mb-2`}>
            {castMembers.slice(0, 2).map((member, idx) => (
              <ActorPortrait 
                key={member.role} 
                member={member} 
                size={config.portraitSize * 0.85}
                isPrimary={idx === 0}
              />
            ))}
          </div>
        ) : (
          <div 
            className="mb-2 p-2 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.1))',
            }}
          >
            <Film 
              className="text-orange-400/70"
              style={{ 
                width: config.portraitSize * 0.5, 
                height: config.portraitSize * 0.5 
              }}
            />
          </div>
        )}

        {/* Title */}
        <div className="text-center px-1 max-w-full">
          <h3 
            className={`${config.titleSize} font-bold line-clamp-2 leading-tight ${hasTelugu ? 'font-telugu' : ''}`}
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
            }}
          >
            {displayTitle}
          </h3>
          
          <p 
            className={`${config.yearSize} font-medium mt-0.5`}
            style={{ color: '#fbbf24' }}
          >
            {year || 'TBA'}
          </p>
        </div>

        {/* Bottom accent */}
        <div 
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.5), transparent)' }}
        />
      </div>
    </div>
  );
}

export default MoviePlaceholder;
