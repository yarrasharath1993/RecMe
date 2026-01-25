import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import UpcomingMoviesGrid from '@/components/movies/UpcomingMoviesGrid';
import { Calendar, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Upcoming Telugu Movies | Telugu Cinema Portal',
  description: 'Discover upcoming Telugu movies, release dates, and new film announcements. Stay updated with the latest in Telugu cinema.',
  keywords: 'upcoming telugu movies, new telugu films, telugu cinema 2026, upcoming releases',
};

// ISR - Revalidate every hour
export const revalidate = 3600;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function UpcomingMoviesPage() {
  // Fetch upcoming movies (release_year is NULL)
  const { data: upcomingMovies, count } = await supabase
    .from('movies')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .eq('language', 'Telugu')
    .is('release_year', null)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-purple-500/10" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-orange-500/30">
                <Calendar className="w-12 h-12 text-orange-500" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-orange-500 to-purple-500">
                Upcoming Movies
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              {count || 0} Telugu films announced and in production
            </p>

            {/* Badge */}
            <div className="flex justify-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-sm">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span className="text-orange-400 font-medium">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {upcomingMovies && upcomingMovies.length > 0 ? (
          <UpcomingMoviesGrid movies={upcomingMovies} />
        ) : (
          <div className="text-center py-20">
            <Calendar className="w-20 h-20 mx-auto mb-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-400 mb-2">
              No Upcoming Movies
            </h2>
            <p className="text-gray-500">
              Check back later for new announcements!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
