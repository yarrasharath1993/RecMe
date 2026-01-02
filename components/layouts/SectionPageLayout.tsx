'use client';

/**
 * SectionPageLayout - Unified Section Display
 * 
 * Shows ALL sections from the same menu group as scrollable content blocks.
 * When on /stories, you see:
 * - Games section (above)
 * - Memes section
 * - Quizzes section
 * - Stories section (CURRENT - highlighted)
 * - Web Series section (below)
 * - Jobs section
 * 
 * Features:
 * - Auto-scroll to current section on load
 * - Prev/Next section navigation
 * - Each section has title + content
 * - No sidebar, no horizontal scrolling nav bar
 */

import React, { useRef, useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { 
  MORE_MENU_SECTIONS, 
  getLocalizedLabel, 
  getLocalizedSectionTitle,
  getCategoryMeta,
  type NavItem,
  type MenuSection 
} from '@/lib/config/navigation';
import { SampleContentGrid, generateSampleItems } from '@/components/SampleContentGrid';
import { BottomInfoBar } from '@/components/BottomInfoBar';

interface SectionPageLayoutProps {
  /** Current section ID (e.g., 'stories', 'games', 'quizzes') */
  currentSectionId: string;
  /** Custom content for the current section (overrides sample content) */
  currentSectionContent?: ReactNode;
}

// Find which menu group a section belongs to
function findSectionGroup(sectionId: string): { group: MenuSection | null; items: NavItem[] } {
  for (const section of MORE_MENU_SECTIONS) {
    const found = section.items.find(item => item.id === sectionId);
    if (found) {
      return { group: section, items: section.items };
    }
  }
  return { group: null, items: [] };
}

export function SectionPageLayout({
  currentSectionId,
  currentSectionContent,
}: SectionPageLayoutProps) {
  const { lang, isEnglish, t } = useLanguage();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [currentVisibleSection, setCurrentVisibleSection] = useState(currentSectionId);
  const [showNav, setShowNav] = useState(false);

  // Find the menu group this section belongs to
  const { group, items } = findSectionGroup(currentSectionId);
  const currentIndex = items.findIndex(item => item.id === currentSectionId);

  // Auto-scroll to current section on mount
  useEffect(() => {
    const element = sectionRefs.current[currentSectionId];
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [currentSectionId]);

  // Track which section is currently visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section-id');
            if (sectionId) {
              setCurrentVisibleSection(sectionId);
            }
          }
        });
      },
      { threshold: 0.3, rootMargin: '-100px 0px -50% 0px' }
    );

    items.forEach(item => {
      const element = sectionRefs.current[item.id];
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  // Show/hide navigation based on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowNav(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigate to prev/next section
  const navigateToSection = (direction: 'prev' | 'next') => {
    const currentIdx = items.findIndex(item => item.id === currentVisibleSection);
    const newIdx = direction === 'prev' ? currentIdx - 1 : currentIdx + 1;
    if (newIdx >= 0 && newIdx < items.length) {
      const element = sectionRefs.current[items[newIdx].id];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const visibleIndex = items.findIndex(item => item.id === currentVisibleSection);
  const hasPrev = visibleIndex > 0;
  const hasNext = visibleIndex < items.length - 1;

  return (
    <main className="aurora-bg" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Group Header */}
      {group && (
        <header 
          className="py-4 sm:py-6"
          style={{ 
            background: `linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))`,
            borderBottom: '1px solid var(--border-primary)',
          }}
        >
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{group.emoji}</span>
              <div>
                <h1 
                  className={`text-xl sm:text-2xl font-bold ${isEnglish ? 'font-heading' : ''}`}
                  style={{ color: 'var(--text-primary)' }}
                >
                  {getLocalizedSectionTitle(group, lang)}
                </h1>
                <p 
                  className="text-sm" 
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {isEnglish ? `${items.length} sections` : `${items.length} సెక్షన్లు`}
                </p>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* All Sections from the Group */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="space-y-8 sm:space-y-12">
          {items.map((item, idx) => {
            const meta = getCategoryMeta(item.id);
            const isCurrentSection = item.id === currentSectionId;
            const sampleItems = generateSampleItems(item.id, 6);

            return (
              <section
                key={item.id}
                id={`section-${item.id}`}
                data-section-id={item.id}
                ref={el => { sectionRefs.current[item.id] = el; }}
                className={`scroll-mt-20 rounded-2xl overflow-hidden transition-all ${
                  isCurrentSection ? 'ring-2 ring-offset-4 ring-offset-[var(--bg-primary)]' : ''
                }`}
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-primary)',
                  ['--tw-ring-color' as string]: meta.color,
                }}
              >
                {/* Section Header */}
                <div 
                  className={`px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r ${meta.gradient}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl">{item.emoji}</span>
                      <div>
                        <h2 
                          className={`text-lg sm:text-xl font-bold text-white ${isEnglish ? 'font-heading' : ''}`}
                        >
                          {getLocalizedLabel(item, lang)}
                        </h2>
                        {isCurrentSection && (
                          <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                            {isEnglish ? '📍 Current' : '📍 ప్రస్తుతం'}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={item.href}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/20 text-white hover:bg-white/30 transition-colors"
                    >
                      {isEnglish ? 'View All →' : 'అన్నీ చూడండి →'}
                    </Link>
                  </div>
                </div>

                {/* Section Content */}
                <div className="p-4 sm:p-6">
                  {isCurrentSection && currentSectionContent ? (
                    currentSectionContent
                  ) : (
                    <SampleContentGrid
                      sectionId={item.id}
                      items={sampleItems}
                      showAsFeatured={false}
                    />
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Floating Section Navigator */}
      {showNav && items.length > 1 && (
        <div 
          className="fixed right-4 bottom-20 z-40 flex flex-col gap-2"
        >
          {/* Current Section Indicator */}
          <div 
            className="px-3 py-2 rounded-lg text-xs font-medium text-center mb-1"
            style={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)',
            }}
          >
            <span className="text-base">{items[visibleIndex]?.emoji}</span>
            <br />
            {visibleIndex + 1}/{items.length}
          </div>

          {/* Prev Button */}
          <button
            onClick={() => navigateToSection('prev')}
            disabled={!hasPrev}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              hasPrev ? 'hover:scale-110' : 'opacity-30 cursor-not-allowed'
            }`}
            style={{ 
              background: hasPrev ? getCategoryMeta(items[visibleIndex - 1]?.id)?.color : 'var(--bg-tertiary)',
              color: 'white',
            }}
            title={hasPrev ? getLocalizedLabel(items[visibleIndex - 1], lang) : ''}
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          {/* Next Button */}
          <button
            onClick={() => navigateToSection('next')}
            disabled={!hasNext}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              hasNext ? 'hover:scale-110' : 'opacity-30 cursor-not-allowed'
            }`}
            style={{ 
              background: hasNext ? getCategoryMeta(items[visibleIndex + 1]?.id)?.color : 'var(--bg-tertiary)',
              color: 'white',
            }}
            title={hasNext ? getLocalizedLabel(items[visibleIndex + 1], lang) : ''}
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Bottom Info Bar */}
      <BottomInfoBar />
    </main>
  );
}

export default SectionPageLayout;
