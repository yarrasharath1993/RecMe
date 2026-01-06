'use client';

/**
 * ARCHIVE CARD COMPONENT
 * 
 * Archive Reference Card for movies without valid posters (Tier 3 visuals).
 * 
 * Features:
 * - Film reel border pattern aesthetic
 * - Movie title and year prominently displayed
 * - Lead actor and studio information
 * - Verified archival limitation label
 * - Transparent reason for poster unavailability
 * 
 * Design Principles:
 * - Honest representation (not a fake poster)
 * - Cultural respect for classic films
 * - Accessible and informative
 */

import { Film, Archive, Info, CheckCircle, AlertCircle } from 'lucide-react';
import type { ArchiveCardData } from '@/lib/visual-intelligence/types';
import {
  getArchiveReasonDisplay,
  getArchiveCardSubtitle,
  getVerificationStatus,
} from '@/lib/visual-intelligence/archive-card-generator';

// ============================================================
// TYPES
// ============================================================

interface ArchiveCardProps {
  /** Archive card data */
  data: ArchiveCardData;
  /** Card size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Aspect ratio (default 2/3 like movie posters) */
  aspectRatio?: 'poster' | 'square' | 'landscape';
  /** Show detailed information */
  showDetails?: boolean;
  /** Custom class name */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

// ============================================================
// SIZE CLASSES
// ============================================================

const sizeClasses = {
  sm: {
    container: 'w-24 h-36',
    title: 'text-xs',
    year: 'text-[10px]',
    subtitle: 'text-[8px]',
    icon: 'w-6 h-6',
    badge: 'text-[6px] px-1 py-0.5',
  },
  md: {
    container: 'w-32 h-48',
    title: 'text-sm',
    year: 'text-xs',
    subtitle: 'text-[10px]',
    icon: 'w-8 h-8',
    badge: 'text-[8px] px-1.5 py-0.5',
  },
  lg: {
    container: 'w-48 h-72',
    title: 'text-base',
    year: 'text-sm',
    subtitle: 'text-xs',
    icon: 'w-10 h-10',
    badge: 'text-xs px-2 py-1',
  },
};

const aspectRatioClasses = {
  poster: 'aspect-[2/3]',
  square: 'aspect-square',
  landscape: 'aspect-video',
};

// ============================================================
// FILM REEL BORDER PATTERN
// ============================================================

function FilmReelBorder({ className }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Left perforations */}
      <div className="absolute left-0 top-0 bottom-0 w-2 flex flex-col justify-around py-2">
        {[...Array(8)].map((_, i) => (
          <div
            key={`left-${i}`}
            className="w-1.5 h-2 bg-gray-700 rounded-sm mx-auto"
          />
        ))}
      </div>
      {/* Right perforations */}
      <div className="absolute right-0 top-0 bottom-0 w-2 flex flex-col justify-around py-2">
        {[...Array(8)].map((_, i) => (
          <div
            key={`right-${i}`}
            className="w-1.5 h-2 bg-gray-700 rounded-sm mx-auto"
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function ArchiveCard({
  data,
  size = 'md',
  aspectRatio = 'poster',
  showDetails = true,
  className = '',
  onClick,
}: ArchiveCardProps) {
  const classes = sizeClasses[size];
  const subtitle = getArchiveCardSubtitle(data);
  const verificationStatus = getVerificationStatus(data);
  const reasonText = getArchiveReasonDisplay(data.archive_reason);

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg
        bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900
        border border-gray-700
        ${aspectRatioClasses[aspectRatio]}
        ${onClick ? 'cursor-pointer hover:border-gray-600 transition-colors' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Film reel border effect */}
      <FilmReelBorder />

      {/* Content container */}
      <div className="absolute inset-3 flex flex-col items-center justify-center text-center px-2">
        {/* Archive icon */}
        <div className="mb-2 p-2 rounded-full bg-gray-800/50 border border-gray-700">
          <Archive className={`${classes.icon} text-gray-500`} />
        </div>

        {/* Title */}
        <h3 className={`${classes.title} font-bold text-gray-200 line-clamp-2 mb-1`}>
          {data.title}
        </h3>

        {/* Year */}
        {data.year > 0 && (
          <span className={`${classes.year} text-gray-400 font-medium mb-1`}>
            {data.year}
          </span>
        )}

        {/* Subtitle (actor, studio) */}
        {subtitle && (
          <p className={`${classes.subtitle} text-gray-500 line-clamp-1 mb-2`}>
            {subtitle}
          </p>
        )}

        {/* Verification badge */}
        {showDetails && (
          <div
            className={`
              ${classes.badge} rounded-full
              flex items-center gap-0.5
              ${data.verified_limitation
                ? 'bg-green-900/30 text-green-400 border border-green-800'
                : 'bg-amber-900/30 text-amber-400 border border-amber-800'
              }
            `}
          >
            {data.verified_limitation ? (
              <CheckCircle className="w-2 h-2" />
            ) : (
              <AlertCircle className="w-2 h-2" />
            )}
            <span className="truncate">
              {data.verified_limitation ? 'Verified' : 'Archival'}
            </span>
          </div>
        )}
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className={`${classes.subtitle} text-gray-400 text-center line-clamp-2`}>
          {reasonText}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// COMPACT VARIANT
// ============================================================

interface ArchiveCardCompactProps {
  data: ArchiveCardData;
  className?: string;
  onClick?: () => void;
}

export function ArchiveCardCompact({
  data,
  className = '',
  onClick,
}: ArchiveCardCompactProps) {
  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg
        bg-gray-900 border border-gray-800
        ${onClick ? 'cursor-pointer hover:border-gray-700 transition-colors' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Icon */}
      <div className="p-2 rounded-lg bg-gray-800">
        <Film className="w-5 h-5 text-gray-500" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-200 truncate">
          {data.title}
        </h4>
        <p className="text-xs text-gray-500">
          {data.year} • {data.lead_actor || 'Classic Film'}
        </p>
      </div>

      {/* Status indicator */}
      <div className="flex-shrink-0">
        {data.verified_limitation ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <Info className="w-4 h-4 text-amber-500" />
        )}
      </div>
    </div>
  );
}

// ============================================================
// TOOLTIP VARIANT
// ============================================================

interface ArchiveCardTooltipProps {
  data: ArchiveCardData;
}

export function ArchiveCardTooltip({ data }: ArchiveCardTooltipProps) {
  const reasonText = getArchiveReasonDisplay(data.archive_reason);

  return (
    <div className="p-3 max-w-xs bg-gray-900 rounded-lg border border-gray-700 shadow-xl">
      <div className="flex items-start gap-2 mb-2">
        <Archive className="w-4 h-4 text-gray-500 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-gray-200">{data.title}</h4>
          <p className="text-xs text-gray-500">
            {data.year} • {data.lead_actor || 'Classic Film'}
          </p>
        </div>
      </div>
      
      <div className="text-xs text-gray-400 mb-2">
        {reasonText}
      </div>

      <div className="flex items-center gap-1 text-[10px]">
        {data.verified_limitation ? (
          <>
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-green-400">Verified archival limitation</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3 h-3 text-amber-500" />
            <span className="text-amber-400">Pending verification</span>
          </>
        )}
      </div>

      {data.metadata_source && (
        <p className="text-[10px] text-gray-600 mt-1">
          Source: {data.metadata_source}
        </p>
      )}
    </div>
  );
}

export default ArchiveCard;

