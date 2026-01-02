'use client';

/**
 * Header Component
 * 
 * Rich header with:
 * - Logo
 * - Main navigation with Entertainment mega-menu
 * - Featured pills (Hot, Reviews)
 * - Search bar
 * - Theme toggle
 * - Mobile menu
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, Menu, Sun, Moon, Sparkles, X, ChevronDown, Star } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { SearchBar } from './SearchBar';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '@/lib/i18n';
import { 
  PRIMARY_NAV,
  FEATURED_PILLS,
  MORE_MENU_SECTIONS,
  QUICK_LINKS,
  getLocalizedLabel,
  getLocalizedSectionTitle,
  type NavItem,
  type MenuSection,
} from '@/lib/config/navigation';

export function Header() {
  const pathname = usePathname();
  const { lang, t, isEnglish } = useLanguage();
  const [theme, setTheme] = useState<'dark' | 'light' | 'vibrant'>('dark');
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('teluguvibes-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'vibrant') {
      setTheme(stored);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.remove('light', 'dark', 'vibrant');
      document.documentElement.classList.add(theme);
      localStorage.setItem('teluguvibes-theme', theme);
    }
  }, [theme, mounted]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cycle through themes: dark → light → vibrant → dark
  const toggleTheme = () => setTheme(prev => {
    if (prev === 'dark') return 'light';
    if (prev === 'light') return 'vibrant';
    return 'dark';
  });
  const toggleDropdown = (id: string) => setActiveDropdown(prev => prev === id ? null : id);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header 
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{ 
        background: 'rgba(var(--bg-secondary-rgb), 0.95)',
        borderBottom: '1px solid var(--border-secondary)',
      }}
    >
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
            >
              <Newspaper className="w-5 h-5 text-white icon-animate" />
            </div>
            <div className="hidden sm:block">
              <span 
                className={`text-lg font-bold group-hover:text-[var(--brand-primary)] transition-colors ${isEnglish ? 'font-heading' : ''}`}
                style={{ color: 'var(--text-primary)' }}
              >
                {t('brand', 'name')}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
            {PRIMARY_NAV.map((item) => {
              const itemLabel = getLocalizedLabel(item, lang);
              
              // If item has children, show dropdown
              if (item.children && item.children.length > 0) {
                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => toggleDropdown(item.id)}
                      className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                        activeDropdown === item.id ? 'bg-[var(--bg-hover)]' : ''
                      } ${isEnglish ? 'font-body' : ''}`}
                      style={{ 
                        color: isActive(item.href) 
                          ? 'var(--brand-primary)' 
                          : 'var(--text-primary)',
                      }}
                    >
                      {itemLabel}
                      <ChevronDown 
                        className={`w-3.5 h-3.5 transition-transform ${
                          activeDropdown === item.id ? 'rotate-180' : ''
                        }`} 
                      />
                    </button>

                    {/* Mega Menu Dropdown */}
                    {activeDropdown === item.id && (
                      <div 
                        className="absolute top-full left-0 mt-1 p-3 rounded-xl shadow-xl min-w-[280px] z-50"
                        style={{ 
                          background: 'var(--bg-secondary)', 
                          border: '1px solid var(--border-primary)',
                        }}
                      >
                        <div className="space-y-1">
                          {item.children.map((child) => {
                            const childLabel = getLocalizedLabel(child, lang);
                            return (
                              <Link
                                key={child.id}
                                href={child.href}
                                onClick={() => setActiveDropdown(null)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isEnglish ? 'font-body' : ''}`}
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = child.isGlam 
                                    ? 'linear-gradient(135deg, rgba(155,93,229,0.15), rgba(241,91,181,0.15))'
                                    : 'var(--bg-hover)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <span className="text-lg">{child.emoji || '📄'}</span>
                                <div>
                                  <span className="text-sm font-medium">{childLabel}</span>
                                  {child.isGlam && (
                                    <span 
                                      className="ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded badge-glam"
                                    >
                                      GLAM
                                    </span>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Regular nav item
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all hover:bg-[var(--bg-hover)] ${isEnglish ? 'font-body' : ''}`}
                  style={{ 
                    color: isActive(item.href) 
                      ? 'var(--brand-primary)' 
                      : 'var(--text-primary)',
                  }}
                >
                  {itemLabel}
                </Link>
              );
            })}

            {/* More Dropdown - Mega Menu with Sections */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('more')}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all touch-target ${
                  activeDropdown === 'more' ? 'bg-[var(--bg-hover)]' : ''
                }`}
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className="icon-animate">📚</span>
                {t('nav', 'more')}
                <ChevronDown 
                  className={`w-3.5 h-3.5 transition-transform icon-rotate ${
                    activeDropdown === 'more' ? 'open' : ''
                  }`} 
                />
              </button>

              {activeDropdown === 'more' && (
                <div 
                  className="absolute top-full right-0 mt-2 p-5 rounded-2xl z-50 dropdown-menu open"
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-primary)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 30px rgba(var(--brand-primary-rgb, 255, 107, 0), 0.1)',
                    width: '560px',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                  }}
                >
                  {/* 2x2 Grid of Section Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    {MORE_MENU_SECTIONS.map((section, sectionIdx) => (
                      <div 
                        key={section.id} 
                        className="rounded-xl overflow-hidden"
                        style={{ 
                          background: 'var(--bg-tertiary)',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                          animationDelay: `${sectionIdx * 50}ms`,
                        }}
                      >
                        {/* Section Header with Gradient */}
                        <div 
                          className={`px-3 py-2 bg-gradient-to-r ${section.gradient} flex items-center gap-2`}
                        >
                          <span className="text-white text-lg icon-animate">{section.emoji}</span>
                          <span className={`text-white text-xs font-bold uppercase tracking-wide ${isEnglish ? 'font-heading' : ''}`}>
                            {getLocalizedSectionTitle(section, lang)}
                          </span>
                        </div>
                        
                        {/* Section Items as Button Cards */}
                        <div className="p-2 grid grid-cols-2 gap-1.5">
                          {section.items.map((item, itemIdx) => (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => setActiveDropdown(null)}
                              className="menu-item-animate relative flex flex-col items-center gap-1 p-2.5 rounded-lg text-center transition-all group"
                              style={{ 
                                background: 'var(--bg-secondary)',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                animationDelay: `${(sectionIdx * 6 + itemIdx) * 25}ms`,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.25)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                              }}
                            >
                              {/* Emoji Icon */}
                              <span className="text-xl icon-animate group-hover:scale-110 transition-transform">
                                {item.emoji}
                              </span>
                              {/* Label */}
                              <span 
                                className={`text-[10px] font-medium leading-tight ${isEnglish ? 'font-body' : ''}`}
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {getLocalizedLabel(item, lang)}
                              </span>
                              {/* Hot/New Badge */}
                              {item.isHot && (
                                <span 
                                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] animate-pulse"
                                  style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white' }}
                                >
                                  🔥
                                </span>
                              )}
                              {item.isNew && (
                                <span 
                                  className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[7px] font-bold"
                                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}
                                >
                                  NEW
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Section: Featured Pills + Search + Theme */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Featured Pills - Desktop */}
            <div className="hidden md:flex items-center gap-1.5">
              {FEATURED_PILLS.map((pill) => {
                const pillLabel = getLocalizedLabel(pill, lang).replace(/✨|🎬|🔥|⭐/g, '').trim();
                return (
                  <Link
                    key={pill.id}
                    href={pill.href}
                    className={`category-pill flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r ${pill.gradient} ${pill.textColor} font-bold rounded-full text-xs sm:text-sm shadow-md touch-target haptic ${isEnglish ? 'font-body' : ''}`}
                  >
                    {pill.id === 'glam' && <Sparkles className="w-4 h-4 icon-animate" />}
                    {pill.id === 'reviews' && <Star className="w-4 h-4 icon-animate" />}
                    <span>{pillLabel}</span>
                  </Link>
                );
              })}
            </div>

            {/* Search - Desktop */}
            <div className="hidden sm:block">
              <SearchBar variant="header" />
            </div>

            {/* Language Toggle - Desktop */}
            <div className="hidden sm:block">
              <LanguageToggle variant="pill" />
            </div>

            {/* Theme Toggle - 3 modes: Dark, Light, Vibrant */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all ${
                  theme === 'vibrant' 
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-pulse' 
                    : 'hover:bg-[var(--bg-hover)]'
                }`}
                aria-label={`Theme: ${theme}. Click to change.`}
                title={`Current: ${theme === 'dark' ? '🌙 Dark' : theme === 'light' ? '☀️ Light' : '✨ Vibrant'}`}
              >
                {theme === 'dark' && (
                  <Sun className="w-5 h-5 text-yellow-400" />
                )}
                {theme === 'light' && (
                  <Sparkles className="w-5 h-5 text-purple-500" />
                )}
                {theme === 'vibrant' && (
                  <Moon className="w-5 h-5 text-white" />
                )}
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[var(--text-primary)]" />
              ) : (
                <Menu className="w-6 h-6 text-[var(--text-primary)]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Thumb-friendly */}
        {mobileMenuOpen && (
          <nav 
            className="lg:hidden py-4 border-t animate-fade-in safe-area-bottom"
            style={{ 
              borderColor: 'var(--border-secondary)',
              maxHeight: 'calc(100vh - 60px)',
              overflowY: 'auto',
            }}
          >
            {/* Mobile Search + Language Toggle */}
            <div className="mb-4 px-2 flex gap-2">
              <div className="flex-1">
                <SearchBar 
                  variant="page" 
                  placeholder={t('ui', 'search')}
                  onClose={() => setMobileMenuOpen(false)}
                />
              </div>
              <LanguageToggle variant="pill" />
            </div>

            {/* Featured Pills - Mobile (Large touch targets) */}
            <div className="flex gap-2 mb-4 px-2">
              {FEATURED_PILLS.map((pill) => {
                const pillLabel = getLocalizedLabel(pill, lang).replace(/✨|🎬|🔥|⭐/g, '').trim();
                return (
                  <Link
                    key={pill.id}
                    href={pill.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r ${pill.gradient} ${pill.textColor} font-bold rounded-xl text-sm shadow-md touch-ripple haptic ${isEnglish ? 'font-body' : ''}`}
                  >
                    <span className="icon-animate text-lg">{pill.id === 'glam' ? '✨' : '⭐'}</span>
                    <span>{pillLabel}</span>
                  </Link>
                );
              })}
            </div>

            {/* 4 Section Cards */}
            <div className="grid grid-cols-2 gap-3 px-2">
              {MORE_MENU_SECTIONS.map((section, sectionIdx) => (
                <div 
                  key={section.id}
                  className="rounded-xl overflow-hidden"
                  style={{ 
                    background: 'var(--bg-tertiary)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  {/* Section Header with Gradient */}
                  <div 
                    className={`px-3 py-2 bg-gradient-to-r ${section.gradient} flex items-center gap-2`}
                  >
                    <span className="text-white text-base">{section.emoji}</span>
                    <span className={`text-white text-[10px] font-bold uppercase tracking-wide truncate ${isEnglish ? 'font-heading' : ''}`}>
                      {getLocalizedSectionTitle(section, lang)}
                    </span>
                  </div>
                  
                  {/* Section Items as Buttons */}
                  <div className="p-2 grid grid-cols-3 gap-1">
                    {section.items.slice(0, 6).map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="relative flex flex-col items-center gap-0.5 p-2 rounded-lg touch-ripple haptic active:scale-95 transition-transform"
                        style={{ 
                          background: isActive(item.href) ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        <span className="text-lg icon-animate relative">
                          {item.emoji}
                          {(item.isHot || item.isNew) && (
                            <span 
                              className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-pulse"
                              style={{ background: item.isHot ? '#f97316' : '#10b981' }}
                            />
                          )}
                        </span>
                        <span 
                          className={`text-[8px] font-medium text-center leading-tight truncate w-full ${isEnglish ? 'font-body' : ''}`}
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {getLocalizedLabel(item, lang)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick access bottom bar - thumb zone */}
            <div 
              className="mt-4 pt-4 border-t flex justify-around"
              style={{ borderColor: 'var(--border-secondary)' }}
            >
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex flex-col items-center gap-1 p-2 touch-target haptic ${isEnglish ? 'font-body' : ''}`}
                  style={{ color: isActive(link.href) ? 'var(--brand-primary)' : 'var(--text-secondary)' }}
                >
                  <span className="icon-animate text-xl">{link.emoji}</span>
                  <span className="text-[10px]">{getLocalizedLabel(link, lang)}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;
