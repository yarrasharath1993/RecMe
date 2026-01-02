'use client';

/**
 * CollapsibleSection Component
 * 
 * A reusable section wrapper that can be collapsed/expanded.
 * Used for all content sections on the homepage.
 */

import React, { useState, ReactNode, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface CollapsibleSectionProps {
  /** Section title (should already be localized) */
  title: string;
  /** Emoji icon for the section */
  emoji?: string;
  /** Section content */
  children: ReactNode;
  /** Whether section starts expanded */
  initialOpen?: boolean;
  /** Optional link for "View All" */
  href?: string;
  /** Custom header background gradient */
  gradient?: string;
  /** Additional class names */
  className?: string;
  /** Whether to show collapse/expand button */
  collapsible?: boolean;
  /** Optional badge (e.g., "NEW", "HOT") */
  badge?: string;
  /** Badge background color */
  badgeColor?: string;
}

export function CollapsibleSection({
  title,
  emoji,
  children,
  initialOpen = true,
  href,
  gradient,
  className = '',
  collapsible = true,
  badge,
  badgeColor,
}: CollapsibleSectionProps) {
  const { t, isEnglish } = useLanguage();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  const toggleSection = () => {
    if (collapsible) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <section className={`collapsible-section rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className={`section-header flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer transition-all ${
          collapsible ? 'hover:opacity-90' : ''
        }`}
        onClick={toggleSection}
        style={{
          background: gradient || 'var(--bg-tertiary)',
        }}
      >
        <div className="flex items-center gap-2">
          {emoji && <span className="text-lg sm:text-xl icon-animate">{emoji}</span>}
          <h2 
            className={`font-bold text-sm sm:text-base ${isEnglish ? 'font-heading' : ''}`}
            style={{ color: gradient ? 'white' : 'var(--text-primary)' }}
          >
            {title}
          </h2>
          {badge && (
            <span
              className="px-1.5 py-0.5 text-[9px] font-bold rounded animate-pulse"
              style={{ background: badgeColor || '#f97316', color: 'white' }}
            >
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {href && (
            <a
              href={href}
              onClick={(e) => e.stopPropagation()}
              className={`text-xs font-medium hover:underline hidden sm:block ${isEnglish ? 'font-body' : ''}`}
              style={{ color: gradient ? 'rgba(255,255,255,0.9)' : 'var(--brand-primary)' }}
            >
              {t('ui', 'viewAll')}
            </a>
          )}
          
          {collapsible && (
            <button
              className="p-1 rounded-full transition-transform"
              style={{ 
                background: gradient ? 'rgba(255,255,255,0.2)' : 'var(--bg-hover)',
              }}
              aria-label={isOpen ? 'Collapse section' : 'Expand section'}
            >
              {isOpen ? (
                <ChevronUp className="w-4 h-4" style={{ color: gradient ? 'white' : 'var(--text-primary)' }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: gradient ? 'white' : 'var(--text-primary)' }} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="section-content overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? (contentHeight ? `${contentHeight}px` : 'auto') : '0px',
          opacity: isOpen ? 1 : 0,
          background: 'var(--bg-secondary)',
        }}
      >
        <div className="p-3 sm:p-4">
          {children}
        </div>
        
        {/* Mobile View All Link */}
        {href && (
          <a
            href={href}
            className={`block sm:hidden text-center py-3 font-medium text-sm border-t ${isEnglish ? 'font-body' : ''}`}
            style={{ 
              color: 'var(--brand-primary)', 
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-tertiary)',
            }}
          >
            {t('ui', 'viewAll')}
          </a>
        )}
      </div>
    </section>
  );
}

export default CollapsibleSection;
