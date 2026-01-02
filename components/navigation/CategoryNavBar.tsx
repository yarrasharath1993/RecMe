'use client';

/**
 * CategoryNavBar Component
 * 
 * Secondary horizontal navigation strip.
 * Shows quick-access category pills with active highlighting.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Flame } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { 
  CATEGORY_BAR, 
  MORE_MENU,
  getCategoryMeta,
  type NavItem 
} from '@/lib/config/navigation';

interface CategoryNavBarProps {
  className?: string;
}

export function CategoryNavBar({ className = '' }: CategoryNavBarProps) {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMore(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Only show first 6 items in bar, rest in dropdown
  const visibleItems = CATEGORY_BAR.slice(0, 6);
  const moreItems = [...CATEGORY_BAR.slice(6), ...MORE_MENU.slice(0, 3)];

  return (
    <nav 
      className={`border-b overflow-hidden ${className}`}
      style={{ 
        background: 'var(--bg-primary)', 
        borderColor: 'var(--border-secondary)' 
      }}
    >
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center h-10 overflow-x-auto scrollbar-hide">
          {/* Home Link */}
          <Link
            href="/"
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all whitespace-nowrap flex-shrink-0 mr-1 ${
              pathname === '/' ? 'text-white' : ''
            }`}
            style={{ 
              background: pathname === '/' ? 'var(--brand-primary)' : 'transparent',
              color: pathname === '/' ? 'white' : 'var(--text-secondary)',
            }}
          >
            🏠 <span className="hidden sm:inline">హోమ్</span>
          </Link>
          
          {/* Separator */}
          <div 
            className="w-px h-4 mx-1 flex-shrink-0" 
            style={{ background: 'var(--border-primary)' }} 
          />

          {/* Category Items */}
          {visibleItems.map((item) => (
            <CategoryPill
              key={item.id}
              item={item}
              isActive={isActive(item.href)}
            />
          ))}

          {/* More Dropdown */}
          {moreItems.length > 0 && (
            <div className="relative flex-shrink-0 ml-1" ref={dropdownRef}>
              <button
                onClick={() => setShowMore(!showMore)}
                className="flex items-center gap-0.5 px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap"
                style={{ 
                  background: showMore ? 'var(--bg-hover)' : 'transparent',
                  color: showMore ? 'var(--brand-primary)' : 'var(--text-tertiary)',
                }}
              >
                మరిన్ని
                <ChevronDown 
                  className={`w-3 h-3 transition-transform ${showMore ? 'rotate-180' : ''}`} 
                />
              </button>

              {showMore && (
                <div 
                  className="absolute top-full right-0 mt-1 py-2 rounded-xl shadow-xl min-w-[180px] max-h-[300px] overflow-y-auto z-50"
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-primary)' 
                  }}
                >
                  {moreItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex items-center gap-2 px-4 py-2 text-sm transition-colors"
                      style={{ 
                        color: isActive(item.href) ? 'var(--brand-primary)' : 'var(--text-primary)',
                        background: isActive(item.href) ? 'var(--bg-hover)' : 'transparent',
                      }}
                      onClick={() => setShowMore(false)}
                      onMouseEnter={(e) => {
                        if (!isActive(item.href)) {
                          e.currentTarget.style.background = 'var(--bg-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive(item.href)) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <span>{item.emoji}</span>
                      <span>{item.label.replace(/🔥|💬|🏏|🏛️|🎬|⭐|📈|🎥|🌟|📸|🎮|🏆|📖|📅|📝/g, '').trim()}</span>
                      {item.isNew && (
                        <span 
                          className="ml-auto px-1.5 py-0.5 text-[9px] font-bold rounded"
                          style={{ background: 'var(--success)', color: 'white' }}
                        >
                          NEW
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// Category pill component
function CategoryPill({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const meta = getCategoryMeta(item.id);
  
  return (
    <Link
      href={item.href}
      className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-full transition-all whitespace-nowrap flex-shrink-0 mx-0.5"
      style={{ 
        background: isActive ? meta.bgColor : 'transparent',
        color: isActive ? meta.color : 'var(--text-secondary)',
        border: isActive ? `1px solid ${meta.color}33` : '1px solid transparent',
      }}
    >
      {item.isHot && <Flame className="w-3 h-3" style={{ color: isActive ? meta.color : 'var(--text-tertiary)' }} />}
      {!item.isHot && item.emoji && <span className="text-[10px]">{item.emoji}</span>}
      <span>{item.label.replace(/🔥|💬|🏏|🏛️|🎬|⭐|📈/g, '').trim()}</span>
    </Link>
  );
}

export default CategoryNavBar;
