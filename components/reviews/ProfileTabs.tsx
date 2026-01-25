'use client';

/**
 * ProfileTabs Component
 * 
 * Premium sticky tab navigation for entity profile pages.
 * Features: Overview | Filmography | Career | Personal
 */

import { useState, useRef, useEffect } from 'react';
import { 
  User, Film, Briefcase, Heart, 
  ChevronLeft, ChevronRight
} from 'lucide-react';

export type ProfileTab = 'overview' | 'filmography' | 'career' | 'personal';

interface TabConfig {
  id: ProfileTab;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  counts?: {
    filmography?: number;
    career?: number;
    personal?: number;
  };
  className?: string;
}

const TAB_CONFIGS: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
  { id: 'filmography', label: 'Filmography', icon: <Film className="w-4 h-4" /> },
  { id: 'career', label: 'Career', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'personal', label: 'Personal', icon: <Heart className="w-4 h-4" /> },
];

export function ProfileTabs({
  activeTab,
  onTabChange,
  counts = {},
  className = '',
}: ProfileTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Build tabs with counts
  const tabs = TAB_CONFIGS.map(tab => ({
    ...tab,
    count: counts[tab.id as keyof typeof counts],
  }));

  // Check scroll position for mobile arrows
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

    const scrollAmount = 150;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div 
      className={`sticky top-0 z-30 backdrop-blur-xl ${className}`}
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Left scroll arrow (mobile) */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full shadow-lg lg:hidden"
            style={{
              background: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-white/70" />
          </button>
        )}

        {/* Tabs Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-1 overflow-x-auto scrollbar-hide py-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                  whitespace-nowrap transition-all duration-300 min-w-fit
                  ${isActive
                    ? 'text-white shadow-lg'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                  }
                `}
                style={{
                  background: isActive 
                    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.8) 100%)'
                    : 'transparent',
                  boxShadow: isActive 
                    ? '0 4px 20px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                    : 'none',
                }}
              >
                {/* Animated glow effect for active tab */}
                {isActive && (
                  <div 
                    className="absolute inset-0 rounded-xl animate-pulse opacity-30"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
                    }}
                  />
                )}
                
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
                
                {/* Count badge */}
                {tab.count !== undefined && tab.count > 0 && (
                  <span 
                    className={`
                      relative z-10 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                      ${isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-white/10 text-white/70'
                      }
                    `}
                  >
                    {tab.count > 999 ? '999+' : tab.count}
                  </span>
                )}

                {/* Underline indicator */}
                {isActive && (
                  <div 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.5)' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right scroll arrow (mobile) */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full shadow-lg lg:hidden"
            style={{
              background: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-white/70" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ProfileTabs;
