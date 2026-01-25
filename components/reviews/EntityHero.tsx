'use client';

/**
 * EntityHero Component
 * 
 * Compact premium hero header for entity profile pages.
 * Features: Image, name, title, USP, highlights/trivia sidebar, expandable biography
 */

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Sparkles, Trophy, X, ChevronDown, ChevronUp,
  Instagram, Twitter, ExternalLink, BookOpen
} from 'lucide-react';
import { TrustBadge } from './TrustBadge';

interface CareerStats {
  total_movies: number;
  first_year: number;
  last_year: number;
  decades_active: number;
  avg_rating: number;
  hit_rate: number;
  blockbusters: number;
  classics: number;
}

interface SocialLink {
  platform: string;
  url: string;
  handle?: string;
}

interface EntityHeroProps {
  name: string;
  nameTe?: string; // Telugu name
  slug?: string;
  imageUrl?: string;
  industryTitle?: string;
  usp?: string;
  brandPillars?: string[];
  careerStats?: CareerStats;
  roles?: string[];
  trustScore?: number;
  confidenceTier?: 'high' | 'medium' | 'low';
  biography?: string;
  socialLinks?: SocialLink[];
  trivia?: string[]; // Fun facts/trivia
  highlights?: string[]; // Career highlights
  onClose?: () => void;
  className?: string;
}

export function EntityHero({
  name,
  nameTe,
  imageUrl,
  industryTitle,
  usp,
  biography,
  socialLinks = [],
  trivia = [],
  highlights = [],
  trustScore,
  confidenceTier,
  onClose,
  className = '',
}: EntityHeroProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  // Generate initials for avatar fallback
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Prestige configuration
  const prestige = { color: '#FFA500', glow: 'rgba(255, 165, 0, 0.3)', label: 'Icon' };

  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Cinematic Background with Gradient Mesh */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, ${prestige.glow} 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(139,92,246,0.2) 0%, transparent 50%),
            linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(15,15,25,0.98) 100%)
          `,
        }}
      />
      
      {/* Animated Particles/Stars */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(20)].map((_, i) => {
          // Pre-calculate positions to avoid impure function calls during render
          const top = (i * 5.26) % 100;
          const left = ((i * 13.7) % 100);
          const delay = (i * 0.15) % 3;
          const duration = 2 + ((i * 0.25) % 3);
          
          return (
      <div 
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
        style={{
                top: `${top}%`,
                left: `${left}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
        }}
      />
          );
        })}
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-5 md:py-6">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all hover:scale-110 group"
            aria-label="Close profile"
          >
            <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>
        )}

        {/* Two Column Layout: Main Info (Left) + Trivia/Highlights (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* LEFT COLUMN: Main Profile Info (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Compact Avatar Section */}
              <div className="relative shrink-0 group">
                {/* Prestige Glow Ring */}
            <div 
                  className="absolute inset-0 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500"
                  style={{ 
                    background: `radial-gradient(circle, ${prestige.color} 0%, transparent 70%)`,
                    transform: 'scale(1.2)',
                  }}
                />
                
                <div className="relative">
                  {/* Avatar Container - Compact size */}
                  <div 
                    className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl overflow-hidden ring-2 ring-white/10 shadow-2xl group-hover:ring-white/20 transition-all duration-500 group-hover:scale-105"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                        className={`object-cover transition-all duration-700 ${imageLoaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}
                        sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
                        onLoad={() => setImageLoaded(true)}
                        priority
                />
              ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white"
                        style={{
                          background: `linear-gradient(135deg, ${prestige.color}40, ${prestige.color}60)`,
                        }}
                      >
                        <span className="text-2xl md:text-3xl font-bold drop-shadow-lg">
                    {initials}
                  </span>
                </div>
              )}
                    
                    {/* Overlay Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  
                  {/* Prestige Badge - Minimal */}
                  <div 
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-md border whitespace-nowrap shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${prestige.color}40, ${prestige.color}20)`,
                      borderColor: prestige.color,
                      color: prestige.color,
                    }}
                  >
                    <Sparkles className="w-2 h-2 inline mr-0.5" />
                    {prestige.label}
            </div>
            
                  {/* Trust Badge - Minimal */}
            {(trustScore !== undefined || confidenceTier) && (
                    <div className="absolute -top-1 -right-1 transform hover:scale-110 transition-transform">
                <TrustBadge 
                  score={trustScore} 
                  tier={confidenceTier}
                  size="sm"
                  showLabel={false}
                />
              </div>
            )}
                </div>
          </div>

              {/* Compact Info Section */}
              <div className="flex-1 min-w-0 space-y-2">
            {/* Name & Title */}
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-0.5 tracking-tight leading-none">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-300">
                {name}
                    </span>
              </h1>
                  
                  {/* Telugu Name */}
                  {nameTe && (
                    <p className="text-sm md:text-base text-white/70 font-medium mb-1.5" style={{ fontFamily: 'Noto Sans Telugu, sans-serif' }}>
                      {nameTe}
              </p>
            )}

                  {/* Industry Title - Minimal Badge */}
                  {industryTitle && (
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <div 
                        className="group relative px-2.5 py-1 rounded-md text-[11px] font-bold backdrop-blur-md overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, rgba(249,115,22,0.35), rgba(234,179,8,0.25))',
                          border: '1px solid rgba(249,115,22,0.5)',
                          color: '#FFB347',
                          boxShadow: '0 2px 12px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                        }}
                      >
                        <Trophy className="w-3 h-3 inline mr-1 text-orange-400" />
                        <span className="relative">{industryTitle}</span>
                      </div>
              </div>
            )}

                  {/* Social Links Row - Minimal */}
                  {socialLinks && socialLinks.length > 0 && (
                    <div className="flex items-center gap-1 mb-1.5">
                      {socialLinks.map((link, idx) => (
                        <SocialLinkIcon key={idx} link={link} />
                ))}
              </div>
            )}

                </div>

                {/* USP - Minimal */}
                {usp && (
                  <div 
                    className="px-2.5 py-1.5 rounded-lg backdrop-blur-sm"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <p className="text-[11px] text-white/90 leading-relaxed font-medium italic">
                      &ldquo;{usp}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Trivia & Highlights (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="space-y-3">
              {/* Career Highlights */}
              {highlights.length > 0 && (
                <div 
                  className="p-3 rounded-xl backdrop-blur-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.06))',
                    border: '1px solid rgba(249,115,22,0.25)',
                  }}
                >
                  <h3 className="text-xs font-bold text-orange-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Career Highlights
                  </h3>
                  <ul className="space-y-1.5">
                    {highlights.slice(0, 4).map((highlight, idx) => (
                      <li key={idx} className="text-[11px] text-white/80 leading-relaxed flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">•</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fun Facts / Trivia */}
              {trivia.length > 0 && (
                <div 
                  className="p-3 rounded-xl backdrop-blur-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.06))',
                    border: '1px solid rgba(139,92,246,0.25)',
                    }}
                  >
                  <h3 className="text-xs font-bold text-purple-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Did You Know?
                  </h3>
                  <ul className="space-y-1.5">
                    {trivia.slice(0, 4).map((fact, idx) => (
                      <li key={idx} className="text-[11px] text-white/80 leading-relaxed flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
              </div>
            )}

            </div>
          </div>
        </div>
        
        {/* Expandable Biography - Full Width at Bottom */}
        {biography && (
          <div className="mt-4">
            <div 
              className="px-4 py-3 rounded-xl backdrop-blur-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <div className={`prose prose-sm prose-invert max-w-none ${bioExpanded ? '' : 'line-clamp-3'}`}>
                <p className="text-xs text-white/80 leading-relaxed m-0">
                  {biography}
                </p>
              </div>
              <button
                onClick={() => setBioExpanded(!bioExpanded)}
                className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                {bioExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Read full biography
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Social Link Icon Component
function SocialLinkIcon({ link }: { link: SocialLink }) {
  const platformConfig: Record<string, { icon: React.ReactNode; color: string; hoverColor: string }> = {
    instagram: { 
      icon: <Instagram className="w-3.5 h-3.5" />, 
      color: 'rgba(225, 48, 108, 0.8)', 
      hoverColor: 'rgba(225, 48, 108, 1)' 
    },
    twitter: { 
      icon: <Twitter className="w-3.5 h-3.5" />, 
      color: 'rgba(29, 161, 242, 0.8)', 
      hoverColor: 'rgba(29, 161, 242, 1)' 
    },
    wikipedia: { 
      icon: <BookOpen className="w-3.5 h-3.5" />, 
      color: 'rgba(255, 255, 255, 0.7)', 
      hoverColor: 'rgba(255, 255, 255, 1)' 
    },
    imdb: { 
      icon: <span className="text-[10px] font-bold">IMDb</span>, 
      color: 'rgba(245, 197, 24, 0.8)', 
      hoverColor: 'rgba(245, 197, 24, 1)' 
    },
  };

  const config = platformConfig[link.platform.toLowerCase()] || { 
    icon: <ExternalLink className="w-3.5 h-3.5" />, 
    color: 'rgba(255, 255, 255, 0.7)', 
    hoverColor: 'rgba(255, 255, 255, 1)' 
  };

  return (
    <Link
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group p-1.5 rounded-md backdrop-blur-sm transition-all duration-300 hover:scale-110"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        border: '1px solid rgba(255,255,255,0.15)',
        color: config.color,
      }}
      title={link.platform}
    >
      <span className="group-hover:text-white transition-colors" style={{ color: config.color }}>
        {config.icon}
      </span>
    </Link>
  );
}
