'use client';

/**
 * EntityNavTabs Component
 * 
 * Sticky tab navigation for entity profile pages.
 * Allows switching between different sections of the profile.
 */

import { useState, useRef, useEffect } from 'react';
import { 
  Film, Users, Clock, Award, Heart, Sparkles, 
  ChevronLeft, ChevronRight
} from 'lucide-react';

export type EntityTab = 
  | 'filmography' 
  | 'collaborators' 
  | 'eras' 
  | 'awards' 
  | 'family' 
  | 'fan_culture';

interface Tab {
  id: EntityTab;
  label: string;
  icon: React.ReactNode;
  count?: number;
  available?: boolean;
}

interface EntityNavTabsProps {
  activeTab: EntityTab;
  onTabChange: (tab: EntityTab) => void;
  counts?: Partial<Record<EntityTab, number>>;
  availableTabs?: EntityTab[];
  className?: string;
}

const ALL_TABS: Tab[] = [
  { id: 'filmography', label: 'Filmography', icon: <Film className="w-4 h-4" /> },
  { id: 'collaborators', label: 'Collaborators', icon: <Users className="w-4 h-4" /> },
  { id: 'eras', label: 'Career Eras', icon: <Clock className="w-4 h-4" /> },
  { id: 'awards', label: 'Awards', icon: <Award className="w-4 h-4" /> },
  { id: 'family', label: 'Family', icon: <Heart className="w-4 h-4" /> },
  { id: 'fan_culture', label: 'Fan Culture', icon: <Sparkles className="w-4 h-4" /> },
];

export function EntityNavTabs({
  activeTab,
  onTabChange,
  counts = {},
  availableTabs,
  className = '',
}: EntityNavTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Filter tabs based on availability
  const tabs = ALL_TABS.map(tab => ({
    ...tab,
    count: counts[tab.id],
    available: availableTabs ? availableTabs.includes(tab.id) : true,
  })).filter(tab => tab.available);

  // Check scroll position for arrows
  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div 
      className={`sticky top-0 z-20 backdrop-blur-xl ${className}`}
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-primary)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-lg md:hidden"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
            }}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        )}

        {/* Tabs Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-1 overflow-x-auto scrollbar-hide py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                whitespace-nowrap transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-orange-500 ring-1 ring-orange-500/30'
                  : 'hover:bg-[var(--bg-secondary)]'
                }
              `}
              style={{
                color: activeTab === tab.id ? undefined : 'var(--text-secondary)',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span 
                  className={`
                    px-1.5 py-0.5 rounded-full text-[10px] font-bold
                    ${activeTab === tab.id 
                      ? 'bg-orange-500/20 text-orange-500' 
                      : 'bg-[var(--bg-tertiary)]'
                    }
                  `}
                  style={{
                    color: activeTab === tab.id ? undefined : 'var(--text-tertiary)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-lg md:hidden"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
            }}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        )}
      </div>
    </div>
  );
}

export default EntityNavTabs;
