'use client';

/**
 * EntityProfileLayout Component
 * 
 * Redesigned premium layout for entity profile pages with story-first approach.
 * Features two-column layout: Main content (biography, highlights, recent work) + Stats sidebar.
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, AlertCircle, Film, Calendar, Star, 
  ChevronRight, Users, Award, Clock, Heart, Sparkles, ChevronDown, ChevronUp, TrendingUp
} from 'lucide-react';
import { EntityHero } from './EntityHero';
import { CompactStatsCard } from './compact/CompactStatsCard';
import { CompactGenreCard } from './compact/CompactGenreCard';
import { CompactErasCard } from './compact/CompactErasCard';
import { CompactCollaboratorsCard } from './compact/CompactCollaboratorsCard';
import { FilmographyGrid } from './compact/FilmographyGrid';
import { CompactDynastyCard } from './compact/CompactDynastyCard';
import { CompactCultureCard } from './compact/CompactCultureCard';
import { CompactMilestonesCard } from './compact/CompactMilestonesCard';
import { CompactLegacyCard } from './compact/CompactLegacyCard';
import { slugify } from '@/lib/utils/slugify';
import {
  deriveCareerHighlights,
} from '@/lib/profile/derivedInsights';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface Collaborator {
  name: string;
  count: number;
  avg_rating: number;
  movies: Array<{ title: string; year: number; slug: string; rating?: number }>;
}

interface CollaboratorsByRole {
  directors: Collaborator[];
  music_directors: Collaborator[];
  cinematographers: Collaborator[];
  writers: Collaborator[];
  editors: Collaborator[];
  producers: Collaborator[];
  heroes: Collaborator[];
  heroines: Collaborator[];
}

interface MovieData {
    id: string;
    title: string;
    year: number;
    slug: string;
    rating?: number;
    poster_url?: string;
    is_blockbuster?: boolean;
    is_classic?: boolean;
    role_type?: string;
    character?: string;
    genres?: string[];
}

interface RoleStats {
  count: number;
  movies: MovieData[];
  first_year?: number;
  last_year?: number;
  avg_rating?: number;
  hit_rate?: number;
  blockbusters?: number;
}

interface ActorEra {
  name: string;
  years: string;
  themes: string[];
  key_films: string[];
  movie_count?: number;
}

interface FamilyMember {
  name: string;
  slug?: string;
  relation: string;
}

interface Pairing {
  name: string;
  slug?: string;
  count: number;
  highlight?: string;
  films?: string[];
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

interface Award {
  name: string;
  year?: number;
  category?: string;
  movie?: string;
}

interface Milestone {
  id?: string;
  title: string;
  year?: number;
  description?: string;
  category?: string;
  slug?: string;
  poster_url?: string;
  rating?: number;
}

interface Achievements {
  awards: Award[];
  milestones: Milestone[];
}

interface TrustSignals {
  trust_score?: number;
  confidence_tier?: 'high' | 'medium' | 'low';
}

interface SocialLink {
  platform: string;
  url: string;
  handle?: string;
}

interface SignatureDialogue {
  dialogue: string;
  movie_slug?: string;
  movie_title?: string;
  year?: number;
}

interface Person {
  name: string;
  name_te?: string; // Telugu name
    slug: string;
    image_url?: string;
  biography?: string;
  biography_te?: string; // Telugu biography
  known_for?: string[];
    industry_title?: string;
    usp?: string;
    brand_pillars?: string[];
    legacy_impact?: string;
  social_links?: SocialLink[];
}

interface FanCulture {
  cultural_titles?: string[];
  trivia?: string[];
  viral_moments?: string[];
  pairings?: Pairing[];
  entrepreneurial?: string[]; // Business ventures
  tech_edge?: string; // Unique technical/educational background
  signature_dialogues?: SignatureDialogue[]; // Famous dialogues
}

interface GenreDistribution {
  genre: string;
  count: number;
  percentage: number;
}

interface UpcomingProject {
  title: string;
  slug: string;
  status?: string;
  expected_year?: number;
}

interface Dynasty {
  family_relationships: Record<string, FamilyMember[]>;
  romantic_pairings?: Pairing[];
}

interface ProfileData {
  person: Person;
  career_stats: CareerStats;
  roles: {
    actor: RoleStats;
    actress: RoleStats;
    director: RoleStats;
    producer: RoleStats;
    supporting: RoleStats;
    cameo: RoleStats;
  };
  achievements: Achievements;
  collaborators: CollaboratorsByRole;
  eras: ActorEra[];
  fan_culture: FanCulture;
  dynasty: Dynasty;
  trust_signals: TrustSignals;
  genre_distribution?: GenreDistribution[];
  upcoming_projects?: UpcomingProject[];
}

interface EntityProfileLayoutProps {
  entitySlug: string;
  entityType?: 'actor' | 'director';
  onClose?: () => void;
  className?: string;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function EntityProfileLayout({
  entitySlug,
  entityType = 'actor',
  onClose,
  className = '',
}: EntityProfileLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProfileData | null>(null);
  const [showFullFilmography, setShowFullFilmography] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/profile/${entitySlug}`);
        if (!response.ok) {
          throw new Error('Failed to load profile');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

      fetchProfile();
  }, [entitySlug]);

  // Get genre data
  const genreData = useMemo(() => {
    if (!data) return [];
    
    const genreCounts = new Map<string, { count: number; ratings: number[]; topFilm?: string; topRating: number }>();
    
    const allRoles = [
      data.roles.actor,
      data.roles.actress,
      data.roles.director,
      data.roles.producer,
      data.roles.supporting,
      data.roles.cameo,
    ];

    for (const roleStats of allRoles) {
      if (!roleStats?.movies) continue;
      for (const movie of roleStats.movies) {
        const genres = movie.genres || [];
        for (const genre of genres) {
          const existing = genreCounts.get(genre) || { count: 0, ratings: [], topRating: 0 };
          existing.count++;
          if (movie.rating) {
            existing.ratings.push(movie.rating);
            if (movie.rating > existing.topRating) {
              existing.topRating = movie.rating;
              existing.topFilm = movie.title;
            }
          }
          genreCounts.set(genre, existing);
        }
      }
    }

    return Array.from(genreCounts.entries())
      .map(([genre, data]) => ({
        genre,
        count: data.count,
        avg_rating: data.ratings.length > 0 
          ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length 
          : 0,
        topFilm: data.topFilm,
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  // Get all movies
  const allMovies = useMemo(() => {
    if (!data) return [];
    
    const movies: Array<{
      id: string;
      title: string;
      year: number;
      slug: string;
      rating?: number;
      poster_url?: string;
      is_blockbuster?: boolean;
      is_classic?: boolean;
      role_type?: string;
      genres?: string[];
      character?: string;
    }> = [];
    
    const seenIds = new Set<string>();
    const roles = [
      { key: 'actor', label: 'Lead' },
      { key: 'actress', label: 'Lead' },
      { key: 'director', label: 'Director' },
      { key: 'producer', label: 'Producer' },
      { key: 'supporting', label: 'Supporting' },
      { key: 'cameo', label: 'Cameo' },
    ];

    for (const { key, label } of roles) {
      const roleStats = data.roles[key as keyof typeof data.roles];
      if (!roleStats?.movies) continue;
      
      for (const movie of roleStats.movies) {
        if (seenIds.has(movie.id)) continue;
        seenIds.add(movie.id);
        
        movies.push({
          ...movie,
          role_type: movie.role_type || label,
        });
      }
    }

    movies.sort((a, b) => b.year - a.year);
    return movies;
  }, [data]);

  // Get active roles
  const activeRoles = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.roles)
      .filter(([_, stats]) => stats.count > 0)
      .map(([role]) => role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' '));
  }, [data]);

  // Role breakdown for sidebar
  const roleBreakdown = useMemo(() => {
    if (!data) return [];
    return activeRoles.map(role => ({
      role,
      count: data.roles[role.toLowerCase().replace(' ', '_') as keyof typeof data.roles]?.count || 0,
    })).filter(r => r.count > 0);
  }, [data, activeRoles]);

  // Derived insights - career highlights for hero section
  const careerHighlights = useMemo(() => 
    data ? deriveCareerHighlights(allMovies, data.career_stats) : [], 
    [allMovies, data]
  );
  
  // Helper to convert milestones to movie card format
  const milestoneToMovieCard = (m: Milestone) => ({
    title: m.title,
    year: m.year || 0,
    slug: m.slug || slugify(m.title),
    poster_url: m.poster_url,
    rating: m.rating,
  });

  // Get milestones by category
  const topRatedMilestones = useMemo(() => {
    if (!data) return [];
    return data.achievements.milestones
      .filter(m => m.category === 'top_rated')
      .slice(0, 5)
      .map(milestoneToMovieCard);
  }, [data]);

  const blockbusterMilestones = useMemo(() => {
    if (!data) return [];
    return data.achievements.milestones
      .filter(m => m.category === 'blockbuster')
      .slice(0, 5)
      .map(milestoneToMovieCard);
  }, [data]);
  
  const classicMilestones = useMemo(() => {
    if (!data) return [];
    return data.achievements.milestones
      .filter(m => m.category === 'classic')
      .slice(0, 5)
      .map(milestoneToMovieCard);
  }, [data]);

  // Loading State
  if (loading) {
    return (
      <div className={`flex items-center justify-center py-20 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-orange-500" />
          <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className={`flex items-center justify-center py-20 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-500" />
          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Failed to load profile
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {error || 'Profile not found'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Hero Section */}
      <EntityHero
        name={data.person.name}
        nameTe={data.person.name_te}
        imageUrl={data.person.image_url}
        industryTitle={data.person.industry_title}
        usp={data.person.usp}
        trustScore={data.trust_signals?.trust_score}
        confidenceTier={data.trust_signals?.confidence_tier}
        biography={data.person.biography}
        socialLinks={data.person.social_links}
        trivia={data.fan_culture?.trivia || []}
        highlights={careerHighlights.map(h => typeof h === 'string' ? h : (h as any).description || String(h))}
        onClose={onClose}
      />

      {/* Compact Multi-Column Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
          {/* Career Stats Card */}
          <CompactStatsCard data={data.career_stats} />
          
          {/* Genre Expertise Card */}
          {genreData.length > 0 && (
            <CompactGenreCard genres={genreData} />
          )}
          
          {/* Career Eras Timeline - Spans 2 columns on large screens */}
          {data.eras && data.eras.length > 0 && (
            <CompactErasCard eras={data.eras} className="lg:col-span-2" />
          )}
          
          {/* Top Collaborators Card */}
          <CompactCollaboratorsCard 
            collaborators={{
              directors: data.collaborators.directors.slice(0, 3),
              music: data.collaborators.music_directors.slice(0, 3),
              heroines: data.collaborators.heroines.slice(0, 3),
            }}
          />
          
          {/* Recent Filmography Grid - Spans full width */}
          {allMovies.length > 0 && (
            <FilmographyGrid movies={allMovies} className="lg:col-span-3" />
          )}
          
          {/* Family & Dynasty Card */}
          {data.dynasty && (
            <CompactDynastyCard 
              family={data.dynasty.family_relationships}
              pairings={data.dynasty.romantic_pairings || []}
                        />
                      )}
                      
          {/* Fan Culture Card */}
          {data.fan_culture && (
            <CompactCultureCard culture={data.fan_culture} />
          )}
          
          {/* Awards & Milestones Card */}
          <CompactMilestonesCard achievements={data.achievements} />
          
          {/* Legacy Impact Card - Spans 2 columns on large screens */}
          {data.person.legacy_impact && (
            <CompactLegacyCard legacy={data.person.legacy_impact} className="lg:col-span-2" />
                      )}
                    </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPER COMPONENTS (Keep for potential future use)
// ============================================================

// All old helper components removed - using compact cards now
function SignatureDialoguesSection({ dialogues }: { dialogues: SignatureDialogue[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextDialogue = () => {
    setCurrentIndex((prev) => (prev + 1) % dialogues.length);
  };

  const prevDialogue = () => {
    setCurrentIndex((prev) => (prev - 1 + dialogues.length) % dialogues.length);
  };

  const current = dialogues[currentIndex];

  return (
    <section 
      className="p-4 lg:p-5 rounded-xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(249, 115, 22, 0.1))',
        border: '1px solid rgba(234, 179, 8, 0.25)',
      }}
    >
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <span className="text-xl">💬</span>
        Signature Dialogues
      </h2>
      
      <div className="relative min-h-[100px] flex items-center">
        {dialogues.length > 1 && (
          <button 
            onClick={prevDialogue}
            className="absolute left-0 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white rotate-180" />
          </button>
        )}
        
        <div className="flex-1 text-center px-8">
                    <p 
            className="text-lg md:text-xl font-medium italic mb-3"
            style={{ color: 'var(--text-primary)', fontFamily: 'Noto Sans Telugu, sans-serif' }}
          >
            "{current.dialogue}"
          </p>
          {(current.movie_title || current.year) && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              — {current.movie_title}{current.year ? ` (${current.year})` : ''}
            </p>
          )}
              </div>

        {dialogues.length > 1 && (
                  <button
            onClick={nextDialogue}
            className="absolute right-0 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white" />
                  </button>
        )}
      </div>

      {/* Dots indicator */}
      {dialogues.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {dialogues.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? 'bg-orange-400 w-4' : 'bg-white/30'
              }`}
            />
          ))}
                </div>
              )}
    </section>
  );
}

// Telugu Biography Section (Collapsible)
function TeluguBiographySection({ biography }: { biography: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section 
      className="p-4 lg:p-5 rounded-xl"
                    style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
        border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <span className="text-xl">🇮🇳</span>
          తెలుగులో (In Telugu)
        </h2>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
        )}
      </button>
      
      {expanded && (
        <p 
          className="mt-4 text-sm leading-relaxed"
          style={{ color: 'var(--text-secondary)', fontFamily: 'Noto Sans Telugu, sans-serif' }}
        >
          {biography}
        </p>
      )}
    </section>
  );
}

// Entrepreneurial Ventures Section
function EntrepreneurialSection({ ventures }: { ventures: string[] }) {
  return (
    <section 
      className="p-4 lg:p-5 rounded-xl"
                  style={{
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(34, 197, 94, 0.06))',
        border: '1px solid rgba(34, 197, 94, 0.2)',
                  }}
                >
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <span className="text-xl">🏢</span>
        Entrepreneurial Ventures
      </h2>
      
      <div className="flex flex-wrap gap-2">
        {ventures.map((venture, idx) => (
                        <span 
            key={idx}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#4ade80',
            }}
                        >
            {venture}
                        </span>
                      ))}
                    </div>
    </section>
  );
}

// Tech Edge / Unique Traits Section
function TechEdgeSection({ techEdge }: { techEdge: string }) {
  return (
    <section 
      className="p-4 lg:p-5 rounded-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(6, 182, 212, 0.06))',
        border: '1px solid rgba(6, 182, 212, 0.2)',
      }}
    >
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <span className="text-xl">⚡</span>
        Unique Edge
      </h2>
      
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {techEdge}
      </p>
    </section>
  );
}

// Genre Distribution Section
function GenreDistributionSection({ genres }: { genres: GenreDistribution[] }) {
  const colors = [
    '#f97316', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  return (
    <section 
      className="p-4 lg:p-5 rounded-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Film className="w-5 h-5 text-orange-500" />
        Genre Distribution
      </h2>
      
      <div className="space-y-3">
        {genres.slice(0, 6).map((genre, idx) => (
          <div key={genre.genre} className="flex items-center gap-3">
            <div className="w-20 text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
              {genre.genre}
            </div>
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <div 
                className="h-full rounded-full transition-all duration-1000"
                  style={{
                  width: `${genre.percentage}%`,
                  backgroundColor: colors[idx % colors.length],
                }}
              />
                  </div>
            <div className="w-12 text-right text-sm font-bold" style={{ color: colors[idx % colors.length] }}>
              {genre.percentage}%
                  </div>
                </div>
              ))}
            </div>
    </section>
  );
}

// Upcoming Projects Section
function UpcomingProjectsSection({ projects }: { projects: UpcomingProject[] }) {
  return (
    <section 
      className="p-4 lg:p-5 rounded-xl"
                    style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 179, 8, 0.1))',
        border: '1px solid rgba(249, 115, 22, 0.25)',
      }}
    >
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Calendar className="w-5 h-5 text-orange-500" />
        Upcoming Projects
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {projects.map((project, idx) => (
                    <Link
                      key={idx}
            href={`/movies/${project.slug}`}
            className="group p-3 rounded-lg transition-all hover:scale-[1.02]"
                      style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
            <div className="flex items-center justify-between">
              <p className="font-semibold group-hover:text-orange-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                {project.title}
              </p>
              {project.expected_year && (
                      <span 
                  className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                    backgroundColor: 'rgba(249, 115, 22, 0.2)',
                    color: '#fb923c',
                      }}
                    >
                  {project.expected_year}
                    </span>
              )}
                    </div>
            {project.status && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Status: {project.status}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default EntityProfileLayout;
