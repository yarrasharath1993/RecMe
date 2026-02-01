'use client';

/**
 * EntityProfileLayout V2 - Tab-Based Layout
 * 
 * Premium tab-based layout for entity profile pages.
 * Features: Overview | Filmography | Career | Personal tabs
 * with infinite scroll, filters, and optimized data loading.
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { EntityHero } from './EntityHero';
import { ProfileTabs, ProfileTab } from './ProfileTabs';
import { OverviewTab, FilmographyTab, CareerTab, PersonalTab } from './tabs';
import {
  deriveDecadeBreakdown,
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
  name_te?: string;
  slug: string;
  image_url?: string;
  biography?: string;
  biography_te?: string;
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
  entrepreneurial?: string[];
  tech_edge?: string;
  signature_dialogues?: SignatureDialogue[];
}

interface GenreDistribution {
  genre: string;
  count: number;
  percentage: number;
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
    villain?: RoleStats;
  };
  achievements: Achievements;
  collaborators: CollaboratorsByRole;
  eras: ActorEra[];
  fan_culture: FanCulture;
  dynasty: Dynasty;
  trust_signals: TrustSignals;
  genre_distribution?: GenreDistribution[];
}

interface EntityProfileLayoutV2Props {
  entitySlug: string;
  entityType?: 'actor' | 'director';
  onClose?: () => void;
  className?: string;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function EntityProfileLayoutV2({
  entitySlug,
  entityType = 'actor',
  onClose,
  className = '',
}: EntityProfileLayoutV2Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'filmography', 'career', 'personal'].includes(tab)) {
      return tab as ProfileTab;
    }
    return 'overview';
  });

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

  // Update URL when tab changes
  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === 'overview') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tab);
    }
    router.replace(url.pathname + url.search, { scroll: false });
  };

  // Get all movies from all roles
  const allMovies = useMemo(() => {
    if (!data) return [];
    
    const movies: MovieData[] = [];
    const seenIds = new Set<string>();

    const allRoles = [
      data.roles.actor,
      data.roles.actress,
      data.roles.director,
      data.roles.producer,
      data.roles.supporting,
      data.roles.cameo,
      data.roles.villain,
    ];

    for (const roleStats of allRoles) {
      if (!roleStats?.movies) continue;
      for (const movie of roleStats.movies) {
        if (!seenIds.has(movie.id)) {
          seenIds.add(movie.id);
          movies.push(movie);
        }
      }
    }

    // Sort by year descending
    return movies.sort((a, b) => b.year - a.year);
  }, [data]);

  // Get top movies for overview (by rating or blockbuster status)
  const topMovies = useMemo(() => {
    if (!allMovies.length) return [];
    
    // Prioritize blockbusters and classics, then by rating
    return [...allMovies]
      .sort((a, b) => {
        // Blockbusters first
        if (a.is_blockbuster && !b.is_blockbuster) return -1;
        if (!a.is_blockbuster && b.is_blockbuster) return 1;
        // Then classics
        if (a.is_classic && !b.is_classic) return -1;
        if (!a.is_classic && b.is_classic) return 1;
        // Then by rating
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, 8);
  }, [allMovies]);

  // Derive decade stats
  const decadeStats = useMemo(() => {
    if (!allMovies.length) return [];
    
    const decadeMap = new Map<string, { count: number; ratings: number[]; topRating: number; topFilm?: string }>();
    
    for (const movie of allMovies) {
      const decade = `${Math.floor(movie.year / 10) * 10}s`;
      const existing = decadeMap.get(decade) || { count: 0, ratings: [], topRating: 0 };
      existing.count++;
      if (movie.rating) {
        existing.ratings.push(movie.rating);
        if (movie.rating > existing.topRating) {
          existing.topRating = movie.rating;
          existing.topFilm = movie.title;
        }
      }
      decadeMap.set(decade, existing);
    }

    return Array.from(decadeMap.entries())
      .map(([decade, stats]) => ({
        decade,
        count: stats.count,
        avgRating: stats.ratings.length > 0 
          ? stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length 
          : 0,
        topFilm: stats.topFilm,
      }))
      .sort((a, b) => parseInt(b.decade) - parseInt(a.decade));
  }, [allMovies]);

  // Get active roles for hero (include Supporting and Cameo so they show in filmography)
  const activeRoles = useMemo(() => {
    if (!data) return [];
    const roles: string[] = [];
    if (data.roles.actor?.count > 0) roles.push('Actor');
    if (data.roles.actress?.count > 0) roles.push('Actress');
    if (data.roles.director?.count > 0) roles.push('Director');
    if (data.roles.producer?.count > 0) roles.push('Producer');
    if (data.roles.supporting?.count > 0) roles.push('Supporting');
    if (data.roles.cameo?.count > 0) roles.push('Cameo');
    if (data.roles.villain?.count > 0) roles.push('Villain');
    return roles;
  }, [data]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    filmography: allMovies.length,
    career: (data?.eras?.length || 0) + (data?.achievements.awards?.length || 0),
    personal: Object.keys(data?.dynasty.family_relationships || {}).length + 
      (data?.fan_culture.trivia?.length || 0),
  }), [allMovies, data]);

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center py-20 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-orange-500" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // Error state
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
      {/* Hero Section - Always Visible */}
      <EntityHero
        name={data.person.name}
        nameTe={data.person.name_te}
        imageUrl={data.person.image_url}
        industryTitle={data.person.industry_title}
        usp={data.person.usp}
        brandPillars={data.person.brand_pillars}
        careerStats={data.career_stats}
        roles={activeRoles}
        trustScore={data.trust_signals?.trust_score}
        confidenceTier={data.trust_signals?.confidence_tier}
        biography={data.person.biography}
        socialLinks={data.person.social_links}
        onClose={onClose}
      />

      {/* Sticky Tab Navigation */}
      <ProfileTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={tabCounts}
      />

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <OverviewTab
            name={data.person.name}
            nameTe={data.person.name_te}
            biography={data.person.biography}
            biographyTe={data.person.biography_te}
            legacyImpact={data.person.legacy_impact}
            knownFor={data.person.known_for}
            industryTitle={data.person.industry_title}
            usp={data.person.usp}
            brandPillars={data.person.brand_pillars}
            signatureDialogues={data.fan_culture.signature_dialogues}
            careerStats={data.career_stats}
            topMovies={topMovies}
            onExploreCTA={() => handleTabChange('filmography')}
          />
        )}

        {/* Filmography Tab */}
        {activeTab === 'filmography' && (
          <FilmographyTab
            movies={allMovies}
            genres={data.genre_distribution}
            personName={data.person.name}
          />
        )}

        {/* Career Tab */}
        {activeTab === 'career' && (
          <CareerTab
            eras={data.eras}
            collaborators={data.collaborators}
            awards={data.achievements.awards}
            decadeStats={decadeStats}
            allMovies={allMovies}
          />
        )}

        {/* Personal Tab */}
        {activeTab === 'personal' && (
          <PersonalTab
            dynasty={data.dynasty}
            fanCulture={data.fan_culture}
          />
        )}
      </div>
    </div>
  );
}

export default EntityProfileLayoutV2;
