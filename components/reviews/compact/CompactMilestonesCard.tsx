'use client';

import Link from 'next/link';
import { Award, Star, Trophy } from 'lucide-react';
import { getCardClasses, premiumText } from './compact.styles';

interface Milestone {
  title?: string;
  year?: number;
  slug?: string;
  rating?: number;
  category?: string;
}

interface AwardData {
  name?: string;
  year?: number;
  category?: string;
  movie?: string;
}

interface CompactMilestonesCardProps {
  achievements: {
    milestones?: Milestone[];
    awards?: AwardData[];
    records?: string[];
  };
  className?: string;
}

export function CompactMilestonesCard({ achievements, className = '' }: CompactMilestonesCardProps) {
  const topRated = achievements.milestones?.filter(m => m.category === 'top_rated' && m.title && m.slug).slice(0, 3) || [];
  const classics = achievements.milestones?.filter(m => m.category === 'classic' && m.title && m.slug).slice(0, 3) || [];
  
  return (
    <div className={getCardClasses('success', className)}>
      <h3 className={`${premiumText.heading} mb-3 flex items-center gap-2`}>
        <Award className="w-4 h-4" />
        Milestones
      </h3>
      
      {/* Top Rated */}
      {topRated.length > 0 && (
        <div className="mb-3">
          <div className={`${premiumText.subheading} mb-2 text-yellow-400 flex items-center gap-1.5`}>
            <Star className="w-3 h-3 fill-current" />
            Top Rated
          </div>
          <div className="space-y-1">
            {topRated.map((film, idx) => (
              <Link
                key={idx}
                href={`/movies/${film.slug}`}
                className="flex justify-between items-center p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span className={premiumText.body}>{film.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/50">{film.year}</span>
                  <span className="text-xs text-yellow-400 font-semibold">
                    {film.rating?.toFixed(1)}★
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Classics */}
      {classics.length > 0 && (
        <div className="mb-3">
          <div className={`${premiumText.subheading} mb-2 text-purple-400 flex items-center gap-1.5`}>
            <Trophy className="w-3 h-3" />
            Classics
          </div>
          <div className="flex flex-wrap gap-1.5">
            {classics.map((film, idx) => (
              <Link
                key={idx}
                href={`/movies/${film.slug}`}
                className="px-2 py-1 rounded-md text-[10px] font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors border border-purple-500/30"
              >
                {film.title} ({film.year})
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Awards */}
      {achievements.awards && achievements.awards.length > 0 && (
        <div>
          <div className={`${premiumText.subheading} mb-2 text-green-400`}>Awards</div>
          <div className="space-y-1">
            {achievements.awards.slice(0, 3).map((award, idx) => (
              <div 
                key={idx}
                className="p-1.5 rounded bg-green-500/10 border border-green-500/20"
              >
                <div className="text-xs text-white/90">{award.name}</div>
                <div className={premiumText.caption}>
                  {award.year} {award.category && `• ${award.category}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Show message if no data */}
      {topRated.length === 0 && classics.length === 0 && (!achievements.awards || achievements.awards.length === 0) && (
        <div className={`${premiumText.body} text-center py-4 text-white/50`}>
          Milestone data coming soon
        </div>
      )}
    </div>
  );
}
