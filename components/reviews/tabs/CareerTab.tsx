'use client';

/**
 * CareerTab Component
 * 
 * Career-focused content tab for entity profiles.
 * Contains: Career Eras, Decade Stats, Collaborators, Awards
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Clock, Users, Award, TrendingUp, Film, Star,
  ChevronRight, ChevronDown, ChevronUp, BarChart3,
  Music, Camera, Clapperboard, Heart
} from 'lucide-react';
import { CompactMovieCard } from '../CompactMovieCard';
import { getSafePosterUrl } from '@/lib/utils/safe-image';

// Types
interface MovieData {
  id: string;
  title: string;
  year: number;
  slug: string;
  rating?: number;
  poster_url?: string;
}

interface ActorEra {
  name: string;
  years: string;
  themes: string[];
  key_films: string[];
  movie_count?: number;
}

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
  heroes: Collaborator[];
  heroines: Collaborator[];
}

interface Award {
  name: string;
  year?: number;
  category?: string;
  movie?: string;
}

interface DecadeStats {
  decade: string;
  count: number;
  avgRating: number;
  topFilm?: string;
}

interface CareerTabProps {
  eras: ActorEra[];
  collaborators: CollaboratorsByRole;
  awards: Award[];
  decadeStats: DecadeStats[];
  allMovies: MovieData[];
  className?: string;
}

// Glassmorphic Section Card
function SectionCard({ 
  children, 
  className = '',
  gradient = 'default'
}: { 
  children: React.ReactNode; 
  className?: string;
  gradient?: 'default' | 'purple' | 'blue' | 'gold';
}) {
  const bgGradients = {
    default: 'rgba(255,255,255,0.08), rgba(255,255,255,0.02)',
    purple: 'rgba(139, 92, 246, 0.12), rgba(139, 92, 246, 0.04)',
    blue: 'rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.04)',
    gold: 'rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.04)',
  };

  return (
    <div 
      className={`p-5 rounded-2xl backdrop-blur-sm ${className}`}
      style={{
        background: `linear-gradient(135deg, ${bgGradients[gradient].split(', ')[0]} 0%, ${bgGradients[gradient].split(', ')[1]} 100%)`,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {children}
    </div>
  );
}

// Career Eras Timeline
function CareerErasSection({ eras, allMovies }: { eras: ActorEra[]; allMovies: MovieData[] }) {
  const [expandedEra, setExpandedEra] = useState<number | null>(null);

  // Get poster for key films
  const getMoviePoster = (filmTitle: string) => {
    const movie = allMovies.find(m => 
      m.title.toLowerCase() === filmTitle.toLowerCase() ||
      m.title.toLowerCase().includes(filmTitle.toLowerCase())
    );
    return movie ? getSafePosterUrl(movie.poster_url) : null;
  };

  const getMovieSlug = (filmTitle: string) => {
    const movie = allMovies.find(m => 
      m.title.toLowerCase() === filmTitle.toLowerCase() ||
      m.title.toLowerCase().includes(filmTitle.toLowerCase())
    );
    return movie?.slug;
  };

  if (!eras.length) return null;

  return (
    <SectionCard gradient="purple">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-purple-400" />
        Career Eras
      </h3>

      <div className="space-y-3">
        {eras.map((era, index) => (
          <div 
            key={index}
            className="rounded-xl overflow-hidden transition-all duration-300"
            style={{
              background: expandedEra === index 
                ? 'rgba(139, 92, 246, 0.15)' 
                : 'rgba(255,255,255,0.03)',
            }}
          >
            {/* Era Header */}
            <button
              onClick={() => setExpandedEra(expandedEra === index ? null : index)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                {/* Era indicator dot */}
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, rgb(139, 92, 246) 0%, rgb(167, 139, 250) 100%)`,
                    boxShadow: '0 0 8px rgba(139, 92, 246, 0.5)',
                  }}
                />
                <div>
                  <h4 className="font-semibold text-white">{era.name}</h4>
                  <p className="text-sm text-white/50">{era.years}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {era.movie_count && (
                  <span className="text-sm text-purple-400">{era.movie_count} films</span>
                )}
                {expandedEra === index ? (
                  <ChevronUp className="w-4 h-4 text-white/50" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/50" />
                )}
              </div>
            </button>

            {/* Era Details */}
            {expandedEra === index && (
              <div className="px-4 pb-4 space-y-4">
                {/* Themes */}
                <div className="flex flex-wrap gap-2">
                  {era.themes.map((theme, i) => (
                    <span 
                      key={i}
                      className="px-2 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: 'rgba(139, 92, 246, 0.2)',
                        color: 'rgba(167, 139, 250, 1)',
                      }}
                    >
                      {theme}
                    </span>
                  ))}
                </div>

                {/* Key Films with Posters */}
                <div>
                  <h5 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">Key Films</h5>
                  <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                    {era.key_films.slice(0, 5).map((film, i) => {
                      const poster = getMoviePoster(film);
                      const slug = getMovieSlug(film);
                      
                      return slug ? (
                        <Link 
                          key={i}
                          href={`/movies/${slug}`}
                          className="flex-shrink-0 group"
                        >
                          <div className="w-16 aspect-[2/3] rounded-lg overflow-hidden relative">
                            {poster ? (
                              <Image
                                src={poster}
                                alt={film}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                <Film className="w-4 h-4 text-white/30" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-white/60 mt-1 line-clamp-1 text-center max-w-16">
                            {film}
                          </p>
                        </Link>
                      ) : (
                        <div key={i} className="flex-shrink-0">
                          <div className="w-16 aspect-[2/3] rounded-lg bg-white/10 flex items-center justify-center">
                            <Film className="w-4 h-4 text-white/30" />
                          </div>
                          <p className="text-[10px] text-white/60 mt-1 line-clamp-1 text-center max-w-16">
                            {film}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// Decade Performance Chart
function DecadeStatsSection({ stats }: { stats: DecadeStats[] }) {
  if (!stats.length) return null;

  const maxCount = Math.max(...stats.map(s => s.count));

  return (
    <SectionCard gradient="blue">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-400" />
        Decade Performance
      </h3>

      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div key={stat.decade} className="flex items-center gap-3">
            <span className="w-12 text-sm font-medium text-white/70">{stat.decade}</span>
            
            {/* Bar */}
            <div className="flex-1 h-8 rounded-lg overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div 
                className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end pr-3"
                style={{
                  width: `${(stat.count / maxCount) * 100}%`,
                  background: `linear-gradient(90deg, rgba(59, 130, 246, 0.6) 0%, rgba(59, 130, 246, 0.3) 100%)`,
                  minWidth: '60px',
                }}
              >
                <span className="text-xs font-bold text-white">{stat.count} films</span>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 w-14">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-white/70">{stat.avgRating.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// Collaborators Section
function CollaboratorsSection({ collaborators }: { collaborators: CollaboratorsByRole }) {
  const [activeRole, setActiveRole] = useState<keyof CollaboratorsByRole>('directors');

  const roleConfig = [
    { id: 'directors' as const, label: 'Directors', icon: Clapperboard },
    { id: 'music_directors' as const, label: 'Music', icon: Music },
    { id: 'cinematographers' as const, label: 'Camera', icon: Camera },
    { id: 'heroines' as const, label: 'Heroines', icon: Heart },
  ];

  const currentCollaborators = collaborators[activeRole] || [];

  return (
    <SectionCard>
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-orange-500" />
        Frequent Collaborators
      </h3>

      {/* Role Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {roleConfig.map(role => {
          const count = collaborators[role.id]?.length || 0;
          if (count === 0) return null;
          
          return (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeRole === role.id
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <role.icon className="w-3.5 h-3.5" />
              {role.label}
            </button>
          );
        })}
      </div>

      {/* Collaborators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {currentCollaborators.slice(0, 6).map((collab, index) => (
          <div 
            key={collab.name}
            className="p-3 rounded-xl flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            }}
          >
            {/* Rank */}
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                background: index < 3 
                  ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.3) 0%, rgba(249, 115, 22, 0.1) 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: index < 3 ? 'rgb(251, 146, 60)' : 'rgba(255,255,255,0.5)',
              }}
            >
              #{index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white text-sm truncate">{collab.name}</h4>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span>{collab.count} films</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {collab.avg_rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// Awards Section
function AwardsSection({ awards }: { awards: Award[] }) {
  const [showAll, setShowAll] = useState(false);

  if (!awards.length) return null;

  const displayAwards = showAll ? awards : awards.slice(0, 6);

  return (
    <SectionCard gradient="gold">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Awards & Recognition
        </h3>
        <span className="text-sm text-amber-400/70">{awards.length} total</span>
      </div>

      <div className="space-y-2">
        {displayAwards.map((award, index) => (
          <div 
            key={index}
            className="p-3 rounded-xl flex items-start gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%)',
            }}
          >
            <div className="p-1.5 rounded-lg bg-amber-500/20">
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="font-medium text-white text-sm">{award.name}</h4>
              <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                {award.year && <span>{award.year}</span>}
                {award.category && (
                  <>
                    <span>•</span>
                    <span>{award.category}</span>
                  </>
                )}
                {award.movie && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400/70">{award.movie}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {awards.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 w-full py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
        >
          {showAll ? 'Show Less' : `Show All ${awards.length} Awards`}
        </button>
      )}
    </SectionCard>
  );
}

export function CareerTab({
  eras,
  collaborators,
  awards,
  decadeStats,
  allMovies,
  className = '',
}: CareerTabProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Career Eras */}
      <CareerErasSection eras={eras} allMovies={allMovies} />

      {/* Two Column Layout for Stats and Collaborators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decade Stats */}
        <DecadeStatsSection stats={decadeStats} />

        {/* Collaborators */}
        <CollaboratorsSection collaborators={collaborators} />
      </div>

      {/* Awards */}
      <AwardsSection awards={awards} />
    </div>
  );
}

export default CareerTab;
