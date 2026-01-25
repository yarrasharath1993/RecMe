'use client';

/**
 * Promotion Slot Component - Phase 14
 * 
 * CLS-safe, editorial promotion slots for:
 * - OTT "Where to Watch" links
 * - Featured content promotions
 * - Partner integrations
 * 
 * Rules:
 * - NO ads on kids content
 * - CLS-safe (reserved space, no layout shift)
 * - Editorial control (capped promotions)
 * - Privacy-first (no tracking pixels)
 * 
 * Usage:
 *   <PromotionSlot
 *     type="ott"
 *     movie={movie}
 *     maxHeight={120}
 *   />
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Play, Star } from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface OTTPlatform {
  name: string;
  logo: string;
  link: string;
  type: 'subscription' | 'rent' | 'buy';
  price?: string;
}

interface Promotion {
  id: string;
  type: 'ott' | 'featured' | 'partner';
  title: string;
  description?: string;
  image?: string;
  link: string;
  cta: string;
  priority: number;
  validUntil?: Date;
}

interface PromotionSlotProps {
  type: 'ott' | 'featured' | 'inline';
  movie?: any;
  maxHeight?: number;
  className?: string;
  editorial?: boolean; // Editor-approved promotions only
}

// ============================================================
// OTT PLATFORMS DATA
// ============================================================

const OTT_PLATFORMS: Record<string, { name: string; color: string; logo: string }> = {
  netflix: { name: 'Netflix', color: '#E50914', logo: '/logos/netflix.svg' },
  prime: { name: 'Prime Video', color: '#00A8E1', logo: '/logos/prime.svg' },
  hotstar: { name: 'Disney+ Hotstar', color: '#0F1014', logo: '/logos/hotstar.svg' },
  aha: { name: 'aha', color: '#FF3366', logo: '/logos/aha.svg' },
  zee5: { name: 'Zee5', color: '#6E2B9E', logo: '/logos/zee5.svg' },
  sonyliv: { name: 'SonyLIV', color: '#0B0B0B', logo: '/logos/sonyliv.svg' },
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export function PromotionSlot({
  type,
  movie,
  maxHeight = 120,
  className = '',
  editorial = true,
}: PromotionSlotProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Check if content is kids-related (NO ADS on kids content)
  const isKidsContent = movie?.genres?.includes('Family') || movie?.genres?.includes('Animation');
  if (isKidsContent && !editorial) {
    return null; // No promotions on kids content
  }

  // Render based on type
  if (type === 'ott' && movie) {
    return <OTTPromotionSlot movie={movie} maxHeight={maxHeight} className={className} />;
  }

  if (type === 'featured') {
    return <FeaturedPromotionSlot maxHeight={maxHeight} className={className} />;
  }

  if (type === 'inline') {
    return <InlinePromotionSlot maxHeight={maxHeight} className={className} />;
  }

  return null;
}

// ============================================================
// OTT PROMOTION SLOT
// ============================================================

function OTTPromotionSlot({ 
  movie, 
  maxHeight, 
  className 
}: { 
  movie: any; 
  maxHeight: number; 
  className: string;
}) {
  if (!movie.ott_platforms || movie.ott_platforms.length === 0) {
    return null;
  }

  const platforms: OTTPlatform[] = movie.ott_platforms.map((platform: string) => {
    const platformData = OTT_PLATFORMS[platform.toLowerCase()] || {
      name: platform,
      color: '#666',
      logo: '/logos/default.svg',
    };

    return {
      name: platformData.name,
      logo: platformData.logo,
      link: `#`, // Replace with actual deep link
      type: 'subscription' as const,
    };
  });

  return (
    <div
      className={`bg-[#141414] border border-[#262626] rounded-lg p-4 ${className}`}
      style={{
        minHeight: maxHeight,
        maxHeight: maxHeight,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Play className="w-4 h-4 text-[#eab308]" />
        <h3 className="text-sm font-semibold text-white">Watch Now</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {platforms.map((platform, idx) => (
          <Link
            key={idx}
            href={platform.link}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg hover:border-[#eab308] transition-colors"
          >
            <div className="w-6 h-6 relative">
              {/* Platform logo would go here */}
              <div className="w-full h-full bg-[#262626] rounded flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {platform.name.charAt(0)}
                </span>
              </div>
            </div>
            <span className="text-xs font-medium text-white">{platform.name}</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </Link>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Availability may vary by region
      </p>
    </div>
  );
}

// ============================================================
// FEATURED PROMOTION SLOT
// ============================================================

function FeaturedPromotionSlot({
  maxHeight,
  className,
}: {
  maxHeight: number;
  className: string;
}) {
  // This would fetch editorial promotions from backend
  // For now, showing a placeholder

  return (
    <div
      className={`bg-gradient-to-r from-[#eab308]/10 to-[#eab308]/5 border border-[#eab308]/30 rounded-lg p-4 ${className}`}
      style={{
        minHeight: maxHeight,
        maxHeight: maxHeight,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-4 h-4 text-[#eab308]" />
        <h3 className="text-sm font-semibold text-white">Editor's Pick</h3>
      </div>

      <p className="text-sm text-gray-300 mb-3">
        Discover hidden gems handpicked by our editorial team
      </p>

      <Link
        href="/movies/hidden-gems"
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#eab308] text-black text-sm font-medium rounded-lg hover:bg-[#eab308]/90 transition-colors"
      >
        Explore Now
        <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ============================================================
// INLINE PROMOTION SLOT
// ============================================================

function InlinePromotionSlot({
  maxHeight,
  className,
}: {
  maxHeight: number;
  className: string;
}) {
  return (
    <div
      className={`bg-[#141414] border border-[#262626] rounded-lg p-4 ${className}`}
      style={{
        minHeight: maxHeight,
        maxHeight: maxHeight,
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">
            Stay Updated
          </h3>
          <p className="text-xs text-gray-400">
            Get notifications for new releases and reviews
          </p>
        </div>
        <button className="px-4 py-2 bg-[#eab308] text-black text-sm font-medium rounded-lg hover:bg-[#eab308]/90 transition-colors whitespace-nowrap">
          Subscribe
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PROMOTION MANAGER (Server-side)
// ============================================================

export class PromotionManager {
  private readonly MAX_PROMOTIONS_PER_PAGE = 2;
  private readonly EDITORIAL_CAP = 3; // Max 3 promotions per editorial session

  /**
   * Check if promotion is allowed
   */
  isAllowed(context: {
    isKidsContent: boolean;
    currentPromotions: number;
    isEditorial: boolean;
  }): boolean {
    // Rule 1: NO promotions on kids content
    if (context.isKidsContent && !context.isEditorial) {
      return false;
    }

    // Rule 2: Respect cap
    if (context.currentPromotions >= this.MAX_PROMOTIONS_PER_PAGE) {
      return false;
    }

    return true;
  }

  /**
   * Get OTT platforms for movie
   */
  getOTTPlatforms(movie: any): OTTPlatform[] {
    if (!movie.ott_platforms) return [];

    return movie.ott_platforms.map((platform: string) => {
      const platformData = OTT_PLATFORMS[platform.toLowerCase()];
      return {
        name: platformData?.name || platform,
        logo: platformData?.logo || '/logos/default.svg',
        link: this.generateDeepLink(movie, platform),
        type: 'subscription' as const,
      };
    });
  }

  /**
   * Generate deep link to OTT platform
   */
  private generateDeepLink(movie: any, platform: string): string {
    // This would generate actual deep links to OTT platforms
    // For now, returning placeholder
    return `#watch-${platform}-${movie.slug}`;
  }

  /**
   * Track promotion view (privacy-first, no external tracking)
   */
  trackView(promotionId: string): void {
    // Local analytics only, no external tracking pixels
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const key = 'promotion_views';
        const views = JSON.parse(localStorage.getItem(key) || '{}');
        views[promotionId] = (views[promotionId] || 0) + 1;
        localStorage.setItem(key, JSON.stringify(views));
      } catch (error) {
        // Fail silently
      }
    }
  }
}

export const promotionManager = new PromotionManager();


