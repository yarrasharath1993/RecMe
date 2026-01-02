'use client';

/**
 * SectionHeader Component
 * 
 * Reusable section title with optional "View All" link.
 * Follows existing design token patterns.
 */

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  titleEn?: string;
  emoji?: string;
  icon?: React.ReactNode;
  href?: string;
  viewAllLabel?: string;
  count?: number;
  color?: string;
  className?: string;
}

export function SectionHeader({
  title,
  titleEn,
  emoji,
  icon,
  href,
  viewAllLabel = 'అన్నీ చూడండి',
  count,
  color,
  className = '',
}: SectionHeaderProps) {
  const gradientColor = color || 'var(--brand-primary)';
  
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-2">
        {/* Animated gradient bar indicator */}
        <span 
          className="w-1.5 h-7 rounded-full shimmer"
          style={{ 
            background: `linear-gradient(180deg, ${gradientColor}, ${gradientColor}88)`,
            boxShadow: `0 0 10px ${gradientColor}40`
          }}
        />
        
        {/* Icon or emoji with bounce */}
        {icon && <span className="sparkle" style={{ color: gradientColor }}>{icon}</span>}
        {emoji && !icon && <span className="text-xl emoji-bounce">{emoji}</span>}
        
        {/* Title with subtle gradient on hover */}
        <h2 
          className="text-lg font-bold transition-colors hover:opacity-80"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h2>
        
        {/* Count badge with glow */}
        {typeof count === 'number' && (
          <span 
            className="px-2.5 py-0.5 text-xs font-bold rounded-full"
            style={{ 
              background: `${gradientColor}20`, 
              color: gradientColor,
              boxShadow: `0 0 10px ${gradientColor}30`
            }}
          >
            {count}
          </span>
        )}
      </div>

      {/* View All link with arrow animation */}
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium transition-all group hover:gap-2"
          style={{ color: gradientColor }}
        >
          <span className="group-hover:underline">{viewAllLabel}</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

// Compact variant for dense layouts
export function SectionHeaderCompact({
  title,
  href,
  className = '',
}: {
  title: string;
  href?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <h3 
        className="text-sm font-bold uppercase tracking-wide"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {title}
      </h3>
      {href && (
        <Link
          href={href}
          className="text-xs hover:underline"
          style={{ color: 'var(--brand-primary)' }}
        >
          మరిన్ని →
        </Link>
      )}
    </div>
  );
}

export default SectionHeader;

