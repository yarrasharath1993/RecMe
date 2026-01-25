'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { MoviePlaceholderStatic } from '@/components/movies/MoviePlaceholder';

interface CompactMovieCardProps {
  movie: {
    title: string;
    year: number;
    slug: string;
    poster_url?: string;
    rating?: number;
  };
  badge?: string;
  size?: 'xs' | 'sm' | 'md';
  showRating?: boolean;
  showBadge?: boolean;
  layout?: 'vertical' | 'horizontal';
}

export function CompactMovieCard({ movie, badge, size = 'sm', showRating, showBadge, layout }: CompactMovieCardProps) {
  const sizeClasses = {
    xs: 'aspect-[2/3]',
    sm: 'aspect-[2/3]',
    md: 'aspect-[2/3]',
  };
  
  const textSizes = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
  };
  
  return (
    <Link href={`/movies/${movie.slug}`} className="group">
      <div className={`${sizeClasses[size]} rounded-lg overflow-hidden relative`} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {/* Image */}
        {movie.poster_url ? (
          <Image 
            src={movie.poster_url} 
            alt={movie.title} 
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
          />
        ) : (
          <MoviePlaceholderStatic title={movie.title} year={movie.year} size="sm" />
        )}
        
        {/* Compact rating badge */}
        {movie.rating && (
          <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            {movie.rating.toFixed(1)}
          </div>
        )}
        
        {/* Custom badge */}
        {badge && (
          <div className="absolute top-1 right-1 text-lg">
            {badge}
          </div>
        )}
      </div>
      
      <p className={`mt-1 ${textSizes[size]} font-medium truncate`} style={{ color: 'var(--text-primary)' }}>
        {movie.title}
      </p>
      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{movie.year}</p>
    </Link>
  );
}
