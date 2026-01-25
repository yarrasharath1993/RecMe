'use client';

/**
 * GenreMilestones Component
 * 
 * Displays an actor's career highlights including:
 * - Cult Classics
 * - Award Winners
 * - Commercial Hits
 * - Top Rated Films
 */

import Link from 'next/link';
import { Star, Award, TrendingUp, Gem, Sparkles } from 'lucide-react';

// Types
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

interface GenreMilestonesProps {
  milestones: GenreMilestonesData;
  actorName?: string;  // Optional for ProfileSection usage
  className?: string;
}

// Category configuration
const CATEGORY_CONFIG: Array<{
  key: keyof GenreMilestonesData;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}> = [
  {
    key: 'cult_classics',
    label: 'Cult Classics',
    icon: Gem,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  {
    key: 'award_winners',
    label: 'Award Winners',
    icon: Award,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  {
    key: 'commercial_hits',
    label: 'Blockbusters',
    icon: TrendingUp,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  {
    key: 'top_rated',
    label: 'Top Rated',
    icon: Star,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
];

export function GenreMilestones({
  milestones,
  actorName: _actorName, // Reserved for future use (e.g., section titles)
  className = '',
}: GenreMilestonesProps) {
  // Filter categories that have milestones
  const activeCategories = CATEGORY_CONFIG.filter(
    (cat) => milestones[cat.key]?.length > 0
  );

  if (activeCategories.length === 0) {
    return null;
  }

  return (
    <section className={`${className}`}>
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        Career Highlights
      </h3>

      <div className="space-y-3">
        {activeCategories.map((category) => {
          const Icon = category.icon;
          const categoryMilestones = milestones[category.key];

          return (
            <div
              key={category.key}
              className={`rounded-lg border ${category.borderColor} ${category.bgColor} p-3`}
            >
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${category.color}`} />
                <span className={`text-xs font-bold ${category.color} uppercase tracking-wide`}>
                  {category.label}
                </span>
              </div>

              {/* Movie Pills */}
              <div className="flex flex-wrap gap-2">
                {categoryMilestones.map((movie) => (
                  <MilestonePill
                    key={movie.slug}
                    movie={movie}
                    color={category.color}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Individual movie pill
function MilestonePill({
  movie,
  color,
}: {
  movie: Milestone;
  color: string;
}) {
  return (
    <Link
      href={`/movies/${movie.slug}`}
      className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-primary)]/50 border border-[var(--border-primary)] hover:border-[var(--brand-primary)] transition-all"
    >
      <span className="text-xs text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">
        {movie.title}
      </span>
      <span className="text-[10px] text-[var(--text-tertiary)]">
        ({movie.year})
      </span>
      {movie.rating && movie.rating > 0 && (
        <span className={`flex items-center gap-0.5 text-[10px] font-bold ${color}`}>
          <Star className="w-2.5 h-2.5 fill-current" />
          {movie.rating.toFixed(1)}
        </span>
      )}
    </Link>
  );
}

export default GenreMilestones;
