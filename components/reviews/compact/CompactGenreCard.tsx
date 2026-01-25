'use client';

import { Clapperboard } from 'lucide-react';
import { getCardClasses, premiumText, compactSpacing } from './compact.styles';

interface GenreData {
  genre: string;
  count: number;
  avg_rating: number;
}

interface CompactGenreCardProps {
  genres: GenreData[];
  className?: string;
}

export function CompactGenreCard({ genres, className = '' }: CompactGenreCardProps) {
  const maxCount = Math.max(...genres.map(g => g.count));
  
  return (
    <div className={getCardClasses('primary', className)}>
      <h3 className={`${premiumText.heading} mb-3 flex items-center gap-2`}>
        <Clapperboard className="w-4 h-4" />
        Genre Expertise
      </h3>
      
      <div className={`space-y-2`}>
        {genres.slice(0, 5).map((genre, idx) => {
          const percentage = (genre.count / maxCount) * 100;
          
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className={premiumText.subheading}>{genre.genre}</span>
                <div className="flex items-center gap-2">
                  <span className={premiumText.caption}>{genre.count} films</span>
                  <span className="text-xs font-semibold text-yellow-400">
                    {genre.avg_rating.toFixed(1)}★
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
