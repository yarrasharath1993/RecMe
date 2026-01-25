'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Film, User, Clock } from 'lucide-react';

interface Movie {
  id: string;
  slug: string;
  title_en: string;
  title_te?: string | null;
  director?: string | null;
  poster_url?: string | null;
  synopsis?: string | null;
  tmdb_id?: number | null;
  created_at?: string;
}

interface UpcomingMoviesGridProps {
  movies: Movie[];
}

export default function UpcomingMoviesGrid({ movies }: UpcomingMoviesGridProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');

  // Sort movies
  const sortedMovies = [...movies].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    } else {
      return a.title_en.localeCompare(b.title_en);
    }
  });

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex items-center justify-between border-b border-gray-700/50 pb-4">
        <div className="text-sm text-gray-400">
          Showing <span className="text-white font-semibold">{movies.length}</span> upcoming movies
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('recent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sortBy === 'recent'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Recently Added
          </button>
          <button
            onClick={() => setSortBy('title')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sortBy === 'title'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {sortedMovies.map((movie) => (
          <Link
            key={movie.id}
            href={`/movies/${movie.slug}`}
            className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 hover:ring-2 hover:ring-orange-500 transition-all hover:scale-105 duration-300"
          >
            {/* Poster */}
            {movie.poster_url ? (
              <Image
                src={movie.poster_url}
                alt={movie.title_en}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black">
                <Film className="w-12 h-12 text-gray-600 mb-2" />
                <span className="text-xs text-gray-600 text-center px-2">
                  {movie.title_en}
                </span>
              </div>
            )}

            {/* TBA Badge */}
            <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm">
              TBA
            </div>

            {/* Coming Soon Badge */}
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-orange-400 text-xs font-medium px-2 py-1 rounded-full border border-orange-500/30">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Soon</span>
              </div>
            </div>

            {/* Info Overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-3 pt-12">
              <h3 className="text-sm font-bold text-white line-clamp-2 mb-1 leading-tight">
                {movie.title_en}
              </h3>
              
              {movie.title_te && (
                <p
                  className="text-xs text-orange-300/90 line-clamp-1 mb-2 leading-tight"
                  style={{ fontFamily: 'Noto Sans Telugu, sans-serif' }}
                >
                  {movie.title_te}
                </p>
              )}
              
              {movie.director && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                  <User className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{movie.director}</span>
                </div>
              )}
            </div>

            {/* Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/0 via-orange-500/0 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {movies.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
            <Calendar className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No Upcoming Movies
          </h3>
          <p className="text-gray-500 text-sm">
            Check back later for new film announcements!
          </p>
        </div>
      )}
    </div>
  );
}
