'use client';

/**
 * ProfileSection Component
 * 
 * Comprehensive entity profile page for film industry professionals.
 * Displays:
 * - Hero header with industry title, USP, and brand identity
 * - Role tabs (Actor, Director, Producer, etc.)
 * - Era views (actor-specific career timeline)
 * - Dynasty graph (family relationships)
 * - Romantic pairings (on-screen chemistry)
 * - Career achievements and milestones
 * - Frequent collaborators
 * - Fan culture and trivia
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  User, Film, Star, Calendar, TrendingUp, X, Loader2,
  Award, Heart, Users, Sparkles, ChevronRight, Clock,
  Clapperboard, Music, Camera, Video, Shield, AlertCircle, RefreshCw
} from 'lucide-react';
import { CollaboratorStats } from './CollaboratorStats';
import { GenreMilestones } from './GenreMilestones';
import { TrustBadge } from './TrustBadge';
import { isValidImageUrl } from '@/lib/utils/safe-image';
import { MoviePlaceholderStatic } from '@/components/movies/MoviePlaceholder';

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

interface Milestone {
  title: string;
  year: number;
  slug: string;
  rating?: number;
  category?: string;
}

interface RoleStats {
  count: number;
  movies: Array<{
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
  }>;
  first_year?: number;
  last_year?: number;
  avg_rating?: number;
  hit_rate?: number;
  blockbusters?: number;
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

interface ActorEra {
  name: string;
  years: string;
  themes: string[];
  key_films: string[];
  movie_count?: number;
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

interface ProfileResponse {
  person: {
    slug: string;
    name: string;
    image_url?: string;
    industry_title?: string;
    usp?: string;
    brand_pillars?: string[];
    legacy_impact?: string;
    known_for?: string[];
    biography?: string;
  };
  dynasty: {
    family_relationships: Record<string, FamilyMember | FamilyMember[]>;
    romantic_pairings: Pairing[];
  };
  roles: Record<string, RoleStats>;
  eras: ActorEra[];
  career_stats: CareerStats;
  achievements: {
    awards: Array<{ name: string; year?: number; category?: string; movie?: string }>;
    milestones: Milestone[];
    records: string[];
  };
  collaborators: CollaboratorsByRole;
  fan_culture: {
    fan_identity?: string;
    cultural_titles?: string[];
    viral_moments?: string[];
    trivia?: string[];
  };
  integrity_rules?: {
    exclude_movies?: string[];
    notes?: string[];
  };
  // Governance fields
  governance?: {
    trust_score?: number;
    confidence_tier?: 'high' | 'medium' | 'low' | 'unverified';
    freshness_score?: number;
    last_verified_at?: string;
    content_type?: string;
    is_disputed?: boolean;
    governance_flags?: string[];
  };
}

interface ProfileSectionProps {
  slug: string;
  onClearFilter: () => void;
  onCollaboratorClick?: (name: string, role: string) => void;
  className?: string;
}

// ============================================================
// ROLE CONFIGURATION
// ============================================================

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  actor: { label: 'Actor', icon: User, color: 'text-orange-500' },
  actress: { label: 'Actress', icon: User, color: 'text-pink-500' },
  director: { label: 'Director', icon: Clapperboard, color: 'text-blue-500' },
  producer: { label: 'Producer', icon: Film, color: 'text-green-500' },
  music_director: { label: 'Music Director', icon: Music, color: 'text-purple-500' },
  supporting: { label: 'Supporting', icon: Users, color: 'text-teal-500' },
  cameo: { label: 'Cameos', icon: Video, color: 'text-amber-500' },
};

// ============================================================
// MOVIE CARD WITH ERROR HANDLING
// ============================================================

function MovieCardWithErrorHandling({ 
  movie 
}: { 
  movie: { 
    id: string; 
    title: string; 
    year: number; 
    slug: string; 
    poster_url?: string; 
    rating?: number;
    language?: string;
    role?: string;
    roles?: string[];
  } 
}) {
  const [imageError, setImageError] = useState(false);

  // Language display helper
  const getLanguageLabel = (lang?: string) => {
    // Return full language name
    return lang || '';
  };

  // Role display helper
  const getRoleLabel = (role?: string) => {
    const labels: Record<string, string> = {
      'actor': 'Acted',
      'actress': 'Acted',
      'director': 'Directed',
      'producer': 'Produced',
      'music_director': 'Music',
      'writer': 'Written',
      'supporting': 'Supporting',
      'cameo': 'Cameo',
    };
    return role ? labels[role] : '';
  };

  return (
    <Link
      href={`/movies/${movie.slug}`}
      className="group relative rounded-lg overflow-hidden aspect-[2/3]"
    >
      {movie.poster_url && isValidImageUrl(movie.poster_url) && !imageError ? (
        <Image
          src={movie.poster_url}
          alt={movie.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform"
          sizes="(max-width: 640px) 25vw, (max-width: 768px) 16vw, 12vw"
          onError={() => setImageError(true)}
        />
      ) : (
        <MoviePlaceholderStatic
          title={movie.title}
          year={movie.year}
          size="xs"
        />
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-1.5">
          <div className="text-[10px] text-white font-medium line-clamp-2 leading-tight">
            {movie.title}
          </div>
          <div className="text-[9px] text-white/70 mb-1">{movie.year}</div>
          
          {/* Language and role badges */}
          <div className="flex gap-1 flex-wrap">
            {movie.language && (
              <span className="px-1.5 py-0.5 bg-blue-500/90 rounded text-white font-medium text-[9px]">
                {getLanguageLabel(movie.language)}
              </span>
            )}
            {movie.roles && movie.roles.length > 0 ? (
              movie.roles.map(role => (
                <span key={role} className="px-1.5 py-0.5 bg-orange-500/90 rounded text-white font-medium text-[9px]">
                  {getRoleLabel(role)}
                </span>
              ))
            ) : movie.role ? (
              <span className="px-1.5 py-0.5 bg-orange-500/90 rounded text-white font-medium text-[9px]">
                {getRoleLabel(movie.role)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Badges */}
      {movie.rating && movie.rating >= 7.5 && (
        <div className="absolute top-1 left-1 text-xs">⭐</div>
      )}
    </Link>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function ProfileSection({
  slug,
  onClearFilter,
  onCollaboratorClick,
  className = '',
}: ProfileSectionProps) {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [showAllEras, setShowAllEras] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/profile/${slug}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch profile');
        }

        const profileData = await response.json();
        setData(profileData);

        // Set default active role to the one with most movies
        const roles = profileData.roles;
        const mainRole = Object.entries(roles)
          .filter(([_, stats]) => (stats as RoleStats).count > 0)
          .sort(([_, a], [__, b]) => (b as RoleStats).count - (a as RoleStats).count)[0];
        if (mainRole) {
          setActiveRole(mainRole[0]);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchProfile();
    }
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <section className={className}>
        <div
          className="rounded-2xl p-6 animate-pulse"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[var(--bg-tertiary)]" />
            <div className="flex-1">
              <div className="h-6 w-48 rounded bg-[var(--bg-tertiary)] mb-2" />
              <div className="h-4 w-64 rounded bg-[var(--bg-tertiary)] mb-2" />
              <div className="h-3 w-32 rounded bg-[var(--bg-tertiary)]" />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-[var(--text-tertiary)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading profile...</span>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <section className={className}>
        <div
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <User className="w-5 h-5 text-[var(--text-tertiary)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Profile Not Found
              </h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                {error || 'No data available'}
              </p>
            </div>
          </div>
          <button
            onClick={onClearFilter}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label="Clear filter"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>
      </section>
    );
  }

  const { person, dynasty, roles, eras, career_stats, achievements, collaborators, fan_culture, governance } = data;
  const activeRoleStats = activeRole ? roles[activeRole] : null;

  // Convert milestones to GenreMilestones format
  const genreMilestones = {
    cult_classics: achievements.milestones.filter(m => m.category === 'classic'),
    award_winners: achievements.milestones.filter(m => m.category === 'award'),
    commercial_hits: achievements.milestones.filter(m => m.category === 'blockbuster'),
    top_rated: achievements.milestones.filter(m => m.category === 'top_rated'),
  };

  return (
    <section className={`space-y-4 ${className}`}>
      {/* ==================== HERO HEADER ==================== */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(249,115,22,0.08))',
          border: '1px solid rgba(234,179,8,0.25)',
        }}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            {/* Avatar and Identity */}
            <div className="flex items-center gap-4">
              {/* Profile Image/Avatar */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{
                  background: person.image_url && isValidImageUrl(person.image_url) ? 'transparent' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: '3px solid rgba(234,179,8,0.4)',
                }}
              >
                {person.image_url && isValidImageUrl(person.image_url) ? (
                  <Image
                    src={person.image_url}
                    alt={person.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {person.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                )}
              </div>

              {/* Name and Title */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">
                  {person.name}
                </h2>
                
                {/* Industry Title */}
                {person.industry_title && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-500">
                      {person.industry_title}
                    </span>
                  </div>
                )}

                {/* USP */}
                {person.usp && (
                  <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                    {person.usp}
                  </p>
                )}

                {/* Known For Tags */}
                {person.known_for && person.known_for.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {person.known_for.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-0.5 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: 'rgba(234,179,8,0.2)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Trust Badge & Clear Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {governance?.trust_score !== undefined && (
                <TrustBadge
                  score={governance.trust_score}
                  tier={governance.confidence_tier as 'high' | 'medium' | 'low' | 'unverified' | undefined}
                  size="sm"
                />
              )}
              <button
                onClick={onClearFilter}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                aria-label="Clear filter"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
          </div>

          {/* Brand Pillars */}
          {person.brand_pillars && person.brand_pillars.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {person.brand_pillars.map((pillar, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-xs rounded-full border"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-secondary)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {pillar}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div
          className="px-4 py-3 flex items-center justify-around border-t"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <StatItem
            icon={Star}
            label="Avg Rating"
            value={career_stats.avg_rating.toFixed(1)}
            color="text-yellow-500"
          />
          <div className="w-px h-8 bg-[var(--border-primary)]" />
          <StatItem
            icon={TrendingUp}
            label="Hit Rate"
            value={`${career_stats.hit_rate}%`}
            color="text-green-500"
          />
          <div className="w-px h-8 bg-[var(--border-primary)]" />
          <StatItem
            icon={Film}
            label="Movies"
            value={career_stats.total_movies.toString()}
            color="text-orange-500"
          />
          <div className="w-px h-8 bg-[var(--border-primary)] hidden sm:block" />
          <div className="hidden sm:block">
            <StatItem
              icon={Calendar}
              label="Active"
              value={`${career_stats.first_year}-${career_stats.last_year}`}
              color="text-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ==================== ROLE TABS ==================== */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {Object.entries(roles)
          .filter(([_, stats]) => stats.count > 0)
          .sort(([_, a], [__, b]) => b.count - a.count)
          .map(([role, stats]) => {
            const config = ROLE_CONFIG[role] || { label: role, icon: User, color: 'text-gray-500' };
            const Icon = config.icon;
            const isActive = activeRole === role;

            return (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : config.color}`} />
                <span>{config.label}</span>
                <span
                  className={`px-1.5 py-0.5 text-xs rounded-full ${
                    isActive ? 'bg-white/20' : 'bg-[var(--bg-secondary)]'
                  }`}
                >
                  {stats.count}
                </span>
              </button>
            );
          })}
      </div>

      {/* ==================== ACTIVE ROLE FILMOGRAPHY ==================== */}
      {activeRole && activeRoleStats && activeRoleStats.movies && activeRoleStats.movies.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Film className="w-4 h-4 text-orange-500" />
              {ROLE_CONFIG[activeRole]?.label || activeRole} Filmography
              <span className="text-xs text-[var(--text-tertiary)] font-normal">
                ({activeRoleStats.count} films)
              </span>
            </h3>
            {activeRoleStats.avg_rating && (
              <div className="flex items-center gap-1 text-xs">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="text-[var(--text-secondary)]">
                  {activeRoleStats.avg_rating.toFixed(1)} avg
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {activeRoleStats.movies.slice(0, 16).map((movie) => (
              <MovieCardWithErrorHandling key={movie.id} movie={movie} />
            ))}
          </div>

          {activeRoleStats.movies.length > 16 && (
            <div className="mt-3 text-center">
              <Link
                href={`/movies?${activeRole === 'actor' ? 'actor' : activeRole === 'director' ? 'director' : 'person'}=${encodeURIComponent(person.name)}`}
                className="text-xs text-orange-500 hover:text-orange-400"
              >
                View all {activeRoleStats.count} films →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ==================== ERA VIEWS ==================== */}
      {eras && eras.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Career Eras
            </h3>
            {eras.length > 2 && (
              <button
                onClick={() => setShowAllEras(!showAllEras)}
                className="text-xs text-orange-500 hover:text-orange-400"
              >
                {showAllEras ? 'Show Less' : 'Show All'}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {(showAllEras ? eras : eras.slice(0, 2)).map((era, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[var(--text-primary)]">{era.name}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">{era.years}</span>
                </div>
                
                {/* Themes */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {era.themes.map((theme, tidx) => (
                    <span
                      key={tidx}
                      className="px-2 py-0.5 text-xs rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                    >
                      {theme}
                    </span>
                  ))}
                </div>

                {/* Key Films */}
                {era.key_films && era.key_films.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <span>Key films:</span>
                    <div className="flex flex-wrap gap-1">
                      {era.key_films.slice(0, 3).map((film, fidx) => (
                        <Link
                          key={fidx}
                          href={`/movies/${film}`}
                          className="text-orange-500 hover:text-orange-400 hover:underline"
                        >
                          {film.replace(/-\d{4}$/, '').replace(/-/g, ' ')}
                        </Link>
                      ))}
                      {era.key_films.length > 3 && (
                        <span className="text-[var(--text-tertiary)]">+{era.key_films.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== DYNASTY GRAPH ==================== */}
      {Object.keys(dynasty.family_relationships).length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-purple-500" />
            Family Dynasty
          </h3>

          <div className="flex flex-wrap gap-3">
            {Object.entries(dynasty.family_relationships).map(([relation, members]) => {
              const memberArray = Array.isArray(members) ? members : [members];
              return memberArray.map((member, idx) => (
                <Link
                  key={`${relation}-${idx}`}
                  href={member.slug ? `/movies?profile=${member.slug}` : '#'}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    {member.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{member.name}</div>
                    <div className="text-xs text-[var(--text-tertiary)] capitalize">
                      {member.relation || relation}
                    </div>
                  </div>
                  {member.slug && <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />}
                </Link>
              ));
            })}
          </div>
        </div>
      )}

      {/* ==================== ROMANTIC PAIRINGS ==================== */}
      {dynasty.romantic_pairings && dynasty.romantic_pairings.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-pink-500" />
            On-Screen Pairings
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {dynasty.romantic_pairings.map((pairing, idx) => (
              <Link
                key={idx}
                href={pairing.slug ? `/movies?profile=${pairing.slug}` : '#'}
                className="p-3 rounded-lg text-center transition-colors hover:bg-[var(--bg-tertiary)]"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div className="text-sm font-medium text-[var(--text-primary)]">{pairing.name}</div>
                {pairing.count && (
                  <div className="text-xs text-[var(--text-tertiary)]">{pairing.count} films</div>
                )}
                {pairing.highlight && (
                  <div className="text-xs text-pink-500 mt-1 line-clamp-1">{pairing.highlight}</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ==================== COLLABORATORS ==================== */}
      <CollaboratorStats
        collaborators={collaborators}
        onCollaboratorClick={onCollaboratorClick}
      />

      {/* ==================== AWARDS ==================== */}
      {achievements.awards && achievements.awards.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-yellow-500" />
            Awards & Recognitions
            <span className="text-xs text-[var(--text-tertiary)] font-normal">
              ({achievements.awards.length})
            </span>
          </h3>

          <div className="grid gap-2 sm:grid-cols-2">
            {achievements.awards.slice(0, 6).map((award, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(234,179,8,0.2)' }}
                >
                  <Award className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">
                    {award.name}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                    {award.year && <span>{award.year}</span>}
                    {award.category && (
                      <>
                        <span>•</span>
                        <span className="line-clamp-1">{award.category}</span>
                      </>
                    )}
                  </div>
                  {award.movie && (
                    <div className="text-xs text-orange-500 mt-0.5 line-clamp-1">
                      for {award.movie}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {achievements.awards.length > 6 && (
            <div className="mt-2 text-center">
              <span className="text-xs text-[var(--text-tertiary)]">
                +{achievements.awards.length - 6} more awards
              </span>
            </div>
          )}
        </div>
      )}

      {/* ==================== MILESTONES ==================== */}
      <GenreMilestones milestones={genreMilestones} />

      {/* ==================== FAN CULTURE & TRIVIA ==================== */}
      {(fan_culture.viral_moments?.length || fan_culture.trivia?.length || fan_culture.cultural_titles?.length) && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Fan Culture & Trivia
          </h3>

          <div className="space-y-3">
            {/* Cultural Titles */}
            {fan_culture.cultural_titles && fan_culture.cultural_titles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fan_culture.cultural_titles.map((title, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-500"
                  >
                    {title}
                  </span>
                ))}
              </div>
            )}

            {/* Fan Identity */}
            {fan_culture.fan_identity && (
              <p className="text-sm text-[var(--text-secondary)]">
                <span className="font-medium">Fan Base:</span> {fan_culture.fan_identity}
              </p>
            )}

            {/* Viral Moments */}
            {fan_culture.viral_moments && fan_culture.viral_moments.length > 0 && (
              <div>
                <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                  Viral Moments
                </span>
                <ul className="mt-1 space-y-1">
                  {fan_culture.viral_moments.map((moment, idx) => (
                    <li key={idx} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      {moment}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trivia */}
            {fan_culture.trivia && fan_culture.trivia.length > 0 && (
              <div>
                <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                  Did You Know?
                </span>
                <ul className="mt-1 space-y-1">
                  {fan_culture.trivia.map((item, idx) => (
                    <li key={idx} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== LEGACY IMPACT ==================== */}
      {person.legacy_impact && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-500" />
            Legacy Impact
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {person.legacy_impact}
          </p>
        </div>
      )}
    </section>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className={`text-lg font-bold ${color}`}>{value}</span>
      </div>
      <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

export default ProfileSection;
