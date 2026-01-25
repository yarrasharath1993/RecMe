'use client';

/**
 * ActorProfileSection Component
 * 
 * Displays a comprehensive actor profile when filtering by actor,
 * including:
 * - Actor header with stats (total movies, avg rating, decades active)
 * - Frequent collaborators by role
 * - Career milestones (cult classics, awards, hits)
 */

import { useState, useEffect } from 'react';
import { User, Film, Star, Calendar, TrendingUp, X, Loader2 } from 'lucide-react';
import { CollaboratorStats } from './CollaboratorStats';
import { GenreMilestones } from './GenreMilestones';

// Types
interface Collaborator {
  name: string;
  count: number;
  movies: Array<{ title: string; year: number; slug: string }>;
}

interface CollaboratorsByRole {
  directors: Collaborator[];
  music_directors: Collaborator[];
  cinematographers: Collaborator[];
  writers: Collaborator[];
  editors: Collaborator[];
  producers: Collaborator[];
}

interface Milestone {
  title: string;
  year: number;
  slug: string;
  rating?: number;
}

interface GenreMilestonesData {
  cult_classics: Milestone[];
  award_winners: Milestone[];
  commercial_hits: Milestone[];
  top_rated: Milestone[];
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

interface ActorStatsResponse {
  actor: string;
  collaborators: CollaboratorsByRole;
  milestones: GenreMilestonesData;
  career_stats: CareerStats;
}

interface ActorProfileSectionProps {
  actorName: string;
  onClearFilter: () => void;
  onCollaboratorClick?: (name: string, role: string) => void;
  className?: string;
}

export function ActorProfileSection({
  actorName,
  onClearFilter,
  onCollaboratorClick,
  className = '',
}: ActorProfileSectionProps) {
  const [data, setData] = useState<ActorStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActorStats() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/actors/stats?actor=${encodeURIComponent(actorName)}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch actor stats');
        }

        const statsData = await response.json();
        setData(statsData);
      } catch (err) {
        console.error('Error fetching actor stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load actor data');
      } finally {
        setLoading(false);
      }
    }

    if (actorName) {
      fetchActorStats();
    }
  }, [actorName]);

  // Loading state
  if (loading) {
    return (
      <section className={`${className}`}>
        <div
          className="rounded-2xl p-6 animate-pulse"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)]" />
            <div className="flex-1">
              <div className="h-6 w-48 rounded bg-[var(--bg-tertiary)] mb-2" />
              <div className="h-4 w-32 rounded bg-[var(--bg-tertiary)]" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-[var(--text-tertiary)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading actor profile...</span>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <section className={`${className}`}>
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
                {actorName}
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

  const { career_stats, collaborators, milestones } = data;

  return (
    <section className={`space-y-4 ${className}`}>
      {/* Actor Header Card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(249,115,22,0.05))',
          border: '1px solid rgba(234,179,8,0.2)',
        }}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              }}
            >
              <span className="text-xl font-bold text-white">
                {actorName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </span>
            </div>

            {/* Name and Quick Stats */}
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {actorName}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Film className="w-3.5 h-3.5" />
                  {career_stats.total_movies} films
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {career_stats.first_year}–{career_stats.last_year}
                </span>
              </div>
            </div>
          </div>

          {/* Clear Filter Button */}
          <button
            onClick={onClearFilter}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label="Clear filter"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
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
            label="Blockbusters"
            value={career_stats.blockbusters.toString()}
            color="text-orange-500"
          />
          <div className="w-px h-8 bg-[var(--border-primary)] hidden sm:block" />
          <div className="hidden sm:block">
            <StatItem
              icon={Calendar}
              label="Decades"
              value={career_stats.decades_active.toString()}
              color="text-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Collaborators Section */}
      <CollaboratorStats
        collaborators={collaborators}
        actorName={actorName}
        onCollaboratorClick={onCollaboratorClick}
      />

      {/* Milestones Section */}
      <GenreMilestones
        milestones={milestones}
        actorName={actorName}
      />
    </section>
  );
}

// Stat item component
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

export default ActorProfileSection;
