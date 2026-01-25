'use client';

/**
 * OverviewTab Component
 * 
 * Primary information tab for entity profiles.
 * Contains: Bio, Legacy Impact, Known For, Signature Dialogues, Quick Stats
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronRight, Sparkles, Quote, Star, Film, 
  TrendingUp, Award, ChevronDown, ChevronUp, Play
} from 'lucide-react';
import { CompactMovieCard } from '../CompactMovieCard';

// Types
interface MovieData {
  id: string;
  title: string;
  year: number;
  slug: string;
  rating?: number;
  poster_url?: string;
  is_blockbuster?: boolean;
  is_classic?: boolean;
}

interface SignatureDialogue {
  dialogue: string;
  movie_slug?: string;
  movie_title?: string;
  year?: number;
}

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

interface OverviewTabProps {
  name: string;
  nameTe?: string;
  biography?: string;
  biographyTe?: string;
  legacyImpact?: string;
  knownFor?: string[];
  industryTitle?: string;
  usp?: string;
  brandPillars?: string[];
  signatureDialogues?: SignatureDialogue[];
  careerStats?: CareerStats;
  topMovies: MovieData[];
  onExploreCTA?: () => void;
  className?: string;
}

// Glassmorphic Section Card
function SectionCard({ 
  children, 
  className = '',
  gradient = 'default'
}: { 
  children: React.ReactNode; 
  className?: string;
  gradient?: 'default' | 'purple' | 'orange' | 'gold';
}) {
  const gradients = {
    default: 'from-white/[0.08] to-white/[0.02]',
    purple: 'from-purple-500/[0.12] to-purple-500/[0.04]',
    orange: 'from-orange-500/[0.12] to-orange-500/[0.04]',
    gold: 'from-amber-500/[0.12] to-amber-500/[0.04]',
  };

  return (
    <div 
      className={`p-5 rounded-2xl backdrop-blur-sm ${className}`}
      style={{
        background: `linear-gradient(135deg, ${gradient === 'default' ? 'rgba(255,255,255,0.08)' : ''} 0%, transparent 100%)`,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {children}
    </div>
  );
}

// Quick Stats Bar
function QuickStatsBar({ stats }: { stats: CareerStats }) {
  const statItems = [
    { label: 'Films', value: stats.total_movies, icon: Film },
    { label: 'Avg Rating', value: stats.avg_rating.toFixed(1), icon: Star },
    { label: 'Hit Rate', value: `${Math.round(stats.hit_rate)}%`, icon: TrendingUp },
    { label: 'Blockbusters', value: stats.blockbusters, icon: Award },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((stat, index) => (
        <div 
          key={stat.label}
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div 
            className="p-2 rounded-lg"
            style={{ background: 'rgba(249, 115, 22, 0.15)' }}
          >
            <stat.icon className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{stat.value}</div>
            <div className="text-xs text-white/50">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Signature Dialogues Carousel
function SignatureDialoguesSection({ dialogues }: { dialogues: SignatureDialogue[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!dialogues.length) return null;

  return (
    <SectionCard gradient="purple">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <Quote className="w-4 h-4 text-purple-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Signature Dialogues</h3>
      </div>

      {/* Main dialogue */}
      <div className="relative mb-4">
        <div 
          className="p-5 rounded-xl min-h-[100px] flex items-center justify-center text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
          }}
        >
          <div>
            <p className="text-xl md:text-2xl font-medium text-white/90 italic mb-2">
              "{dialogues[activeIndex].dialogue}"
            </p>
            {dialogues[activeIndex].movie_title && (
              <Link 
                href={`/movies/${dialogues[activeIndex].movie_slug}`}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                — {dialogues[activeIndex].movie_title} ({dialogues[activeIndex].year})
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Dialogue dots */}
      {dialogues.length > 1 && (
        <div className="flex justify-center gap-2">
          {dialogues.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === activeIndex 
                  ? 'w-6 bg-purple-500' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Dialogue ${index + 1}`}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function OverviewTab({
  name,
  nameTe,
  biography,
  biographyTe,
  legacyImpact,
  knownFor,
  industryTitle,
  usp,
  brandPillars,
  signatureDialogues,
  careerStats,
  topMovies,
  onExploreCTA,
  className = '',
}: OverviewTabProps) {
  const [showFullBio, setShowFullBio] = useState(false);
  const [showTeluguBio, setShowTeluguBio] = useState(false);

  // Truncate biography for preview
  const bioPreview = biography && biography.length > 300 
    ? biography.slice(0, 300) + '...' 
    : biography;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Stats Bar */}
      {careerStats && <QuickStatsBar stats={careerStats} />}

      {/* Biography Section */}
      {biography && (
        <SectionCard>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            About {name}
          </h3>
          
          <div className="text-white/70 leading-relaxed">
            {showFullBio ? biography : bioPreview}
          </div>
          
          {biography.length > 300 && (
            <button
              onClick={() => setShowFullBio(!showFullBio)}
              className="mt-3 flex items-center gap-1 text-orange-500 hover:text-orange-400 text-sm font-medium transition-colors"
            >
              {showFullBio ? (
                <>Show Less <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Read More <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          )}

          {/* Telugu Bio Toggle */}
          {biographyTe && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => setShowTeluguBio(!showTeluguBio)}
                className="flex items-center gap-2 text-sm text-white/60 hover:text-white/80 transition-colors"
              >
                <span className="text-lg">తె</span>
                <span>తెలుగులో చదవండి</span>
                {showTeluguBio ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {showTeluguBio && (
                <p className="mt-3 text-white/70 leading-relaxed" style={{ fontFamily: 'Telugu, sans-serif' }}>
                  {biographyTe}
                </p>
              )}
            </div>
          )}
        </SectionCard>
      )}

      {/* Legacy & Impact */}
      {legacyImpact && (
        <SectionCard gradient="gold">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            Legacy & Impact
          </h3>
          <p className="text-white/70 leading-relaxed">{legacyImpact}</p>
        </SectionCard>
      )}

      {/* Signature Dialogues */}
      {signatureDialogues && signatureDialogues.length > 0 && (
        <SignatureDialoguesSection dialogues={signatureDialogues} />
      )}

      {/* Known For / Top Movies */}
      {topMovies.length > 0 && (
        <SectionCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-orange-500" />
              Known For
            </h3>
            <button
              onClick={onExploreCTA}
              className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-400 transition-colors"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Movies Grid - Top 8 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {topMovies.slice(0, 8).map((movie) => (
              <CompactMovieCard 
                key={movie.id} 
                movie={movie}
                showRating
                showBadge
              />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Brand Pillars */}
      {brandPillars && brandPillars.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {brandPillars.map((pillar, index) => (
            <span
              key={index}
              className="px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.05) 100%)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                color: 'rgba(249, 115, 22, 0.9)',
              }}
            >
              {pillar}
            </span>
          ))}
        </div>
      )}

      {/* Explore Full Career CTA */}
      <button
        onClick={onExploreCTA}
        className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.8) 100%)',
          boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)',
        }}
      >
        <Play className="w-5 h-5" />
        Explore Full Filmography
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

export default OverviewTab;
