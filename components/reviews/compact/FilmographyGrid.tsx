'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Film, Star } from 'lucide-react';
import { getCardClasses, premiumText } from './compact.styles';

interface Movie {
  id: string;
  title: string;
  year: number;
  slug: string;
  rating?: number;
  poster_url?: string;
  is_blockbuster?: boolean;
  is_classic?: boolean;
}

interface FilmographyGridProps {
  movies: Movie[];
  className?: string;
}

export function FilmographyGrid({ movies, className = '' }: FilmographyGridProps) {
  return (
    <div className={getCardClasses('neutral', className)}>
      <h3 className={`${premiumText.heading} mb-3 flex items-center gap-2`}>
        <Film className="w-4 h-4" />
        Recent Filmography
      </h3>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {movies.slice(0, 12).map((movie) => (
          <Link 
            key={movie.id}
            href={`/movies/${movie.slug}`}
            className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5 hover:ring-2 hover:ring-purple-500/50 transition-all"
          >
            {movie.poster_url ? (
              <Image
                src={movie.poster_url}
                alt={movie.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <Film className="w-8 h-8 text-white/30" />
              </div>
            )}
            
            {/* Overlay with rating */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <div className="text-[10px] font-semibold text-white line-clamp-2 mb-1">
                  {movie.title}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-white/70">{movie.year}</span>
                  {movie.rating && (
                    <div className="flex items-center gap-0.5 text-[9px] text-yellow-400">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {movie.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Badge for classics */}
            {movie.is_classic && (
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                <Star className="w-3 h-3 fill-current text-white" />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
