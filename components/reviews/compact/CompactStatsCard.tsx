'use client';

import { Film, Star, Calendar, TrendingUp, Award, Clock } from 'lucide-react';
import { getCardClasses, premiumText, iconSizes, compactSpacing } from './compact.styles';

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

interface CompactStatsCardProps {
  data: CareerStats;
  className?: string;
}

export function CompactStatsCard({ data, className = '' }: CompactStatsCardProps) {
  const stats = [
    {
      icon: <Film className={iconSizes.sm} />,
      value: data.total_movies,
      label: 'Films',
      color: 'text-blue-400',
    },
    {
      icon: <Star className={iconSizes.sm} />,
      value: data.avg_rating.toFixed(1),
      label: 'Avg Rating',
      color: 'text-yellow-400',
    },
    {
      icon: <Calendar className={iconSizes.sm} />,
      value: `${data.last_year - data.first_year + 1}`,
      label: 'Years',
      color: 'text-cyan-400',
    },
    {
      icon: <TrendingUp className={iconSizes.sm} />,
      value: `${data.hit_rate}%`,
      label: 'Hit Rate',
      color: 'text-green-400',
    },
    {
      icon: <Award className={iconSizes.sm} />,
      value: data.classics,
      label: 'Classics',
      color: 'text-purple-400',
    },
    {
      icon: <Clock className={iconSizes.sm} />,
      value: data.decades_active,
      label: 'Decades',
      color: 'text-orange-400',
    },
  ];

  return (
    <div className={getCardClasses('neutral', className)}>
      <h3 className={`${premiumText.heading} mb-3`}>Career Stats</h3>
      
      <div className={`grid grid-cols-2 ${compactSpacing.itemGap}`}>
        {stats.map((stat, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className={stat.color}>
              {stat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`${premiumText.miniStat} ${stat.color}`}>
                {stat.value}
              </div>
              <div className={premiumText.caption}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs text-white/60">
        <span>Debut: {data.first_year}</span>
        <span>Recent: {data.last_year}</span>
      </div>
    </div>
  );
}
