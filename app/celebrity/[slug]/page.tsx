/**
 * Celebrity Profile Page
 * Main actor/actress page with comprehensive information
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { CelebrityHero } from '@/components/celebrity/CelebrityHero';
import { CareerTimeline } from '@/components/celebrity/CareerTimeline';
import { AwardsSection } from '@/components/celebrity/AwardsSection';
import { FilmographyGrid } from '@/components/celebrity/FilmographyGrid';
import { TriviaCards } from '@/components/celebrity/TriviaCards';
import { RelatedCelebrities } from '@/components/celebrity/RelatedCelebrities';
import { ShareButton } from '@/components/celebrity/ShareButton';
import type { 
  CelebrityProfile, 
  CelebrityAward, 
  CelebrityMilestone, 
  CelebrityTrivia,
  FilmographyItem,
  RelatedCelebrity,
} from '@/lib/celebrity/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('name_en, name_te, short_bio, occupation, profile_image')
    .eq('slug', slug)
    .single();

  if (!celebrity) {
    return {
      title: 'Celebrity Not Found | TeluguVibes',
    };
  }

  const title = celebrity.name_te 
    ? `${celebrity.name_en} (${celebrity.name_te})` 
    : celebrity.name_en;
  
  const description = celebrity.short_bio || 
    `${celebrity.name_en} - Telugu ${celebrity.occupation?.[0] || 'Celebrity'}. View biography, filmography, awards, and more.`;

  return {
    title: `${title} | TeluguVibes`,
    description,
    openGraph: {
      title,
      description,
      images: celebrity.profile_image ? [celebrity.profile_image] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: celebrity.profile_image ? [celebrity.profile_image] : [],
    },
  };
}

// Fetch all celebrity data
async function getCelebrityData(slug: string) {
  // Fetch celebrity profile
  const { data: celebrity, error: celebrityError } = await supabase
    .from('celebrities')
    .select('*')
    .eq('slug', slug)
    .single();

  if (celebrityError || !celebrity) {
    return null;
  }

  // Fetch awards
  const { data: awards } = await supabase
    .from('celebrity_awards')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .eq('is_won', true)
    .order('year', { ascending: false });

  // Fetch milestones
  const { data: milestones } = await supabase
    .from('celebrity_milestones')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .eq('is_published', true)
    .order('year', { ascending: true });

  // Fetch trivia
  const { data: trivia } = await supabase
    .from('celebrity_trivia')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .eq('is_published', true)
    .order('display_order', { ascending: true });

  // Fetch filmography
  const celebrityName = celebrity.name_en;
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, title_te, slug, release_year, poster_url, our_rating, verdict, box_office_category, genres, director, hero, heroine, is_blockbuster, is_classic')
    .or(`hero.ilike.%${celebrityName}%,heroine.ilike.%${celebrityName}%,director.ilike.%${celebrityName}%`)
    .eq('is_published', true)
    .order('release_year', { ascending: false });

  // Transform filmography
  const filmography: FilmographyItem[] = (movies || []).map(movie => {
    let role = 'Lead';
    let roleType: 'lead' | 'supporting' | 'cameo' | 'voice' | 'special_appearance' = 'lead';
    
    if (movie.hero?.toLowerCase().includes(celebrityName.toLowerCase())) {
      role = 'Lead Hero';
    } else if (movie.heroine?.toLowerCase().includes(celebrityName.toLowerCase())) {
      role = 'Lead Actress';
    } else if (movie.director?.toLowerCase().includes(celebrityName.toLowerCase())) {
      role = 'Director';
    }

    return {
      movie_id: movie.id,
      title_en: movie.title_en,
      title_te: movie.title_te,
      slug: movie.slug,
      release_year: movie.release_year,
      poster_url: movie.poster_url,
      our_rating: movie.our_rating,
      verdict: movie.verdict || movie.box_office_category,
      verdict_color: getVerdictColor(movie.box_office_category),
      genres: movie.genres || [],
      director: movie.director,
      role,
      role_type: roleType,
      is_blockbuster: movie.is_blockbuster,
      is_iconic: movie.is_classic,
    };
  });

  // Fetch related celebrities
  const relatedCelebrities = await fetchRelatedCelebrities(celebrity.id, celebrityName);

  // Calculate stats
  const hits = filmography.filter(m => isHit(m.verdict)).length;
  const flops = filmography.filter(m => isFlop(m.verdict)).length;
  
  const careerStats = {
    total_movies: celebrity.total_movies || filmography.length,
    hits: celebrity.hits_count || hits,
    flops: celebrity.flops_count || flops,
    hit_rate: celebrity.hit_rate || (filmography.length > 0 ? Math.round((hits / filmography.length) * 100) : 0),
    active_years: getActiveYears(filmography),
    peak_year: celebrity.peak_year,
    debut_movie: celebrity.debut_movie,
    awards_won: (awards || []).length,
  };

  const awardsSummary = {
    total: (awards || []).length,
    national: (awards || []).filter((a: any) => a.award_type === 'national').length,
    filmfare: (awards || []).filter((a: any) => a.award_type === 'filmfare').length,
    nandi: (awards || []).filter((a: any) => a.award_type === 'nandi').length,
    siima: (awards || []).filter((a: any) => a.award_type === 'siima').length,
    other: (awards || []).filter((a: any) => !['national', 'filmfare', 'nandi', 'siima'].includes(a.award_type)).length,
  };

  return {
    celebrity: {
      ...celebrity,
      career_stats: careerStats,
      awards_summary: awardsSummary,
    } as CelebrityProfile & { career_stats: typeof careerStats; awards_summary: typeof awardsSummary },
    awards: (awards || []) as CelebrityAward[],
    milestones: (milestones || []) as CelebrityMilestone[],
    trivia: (trivia || []) as CelebrityTrivia[],
    filmography,
    relatedCelebrities,
  };
}

async function fetchRelatedCelebrities(celebrityId: string, celebrityName: string): Promise<RelatedCelebrity[]> {
  try {
    const { data: movies } = await supabase
      .from('movies')
      .select('hero, heroine, director')
      .or(`hero.ilike.%${celebrityName}%,heroine.ilike.%${celebrityName}%,director.ilike.%${celebrityName}%`)
      .eq('is_published', true);

    if (!movies) return [];

    const collaborators = new Map<string, { count: number; type: string }>();

    for (const movie of movies) {
      const names = [movie.hero, movie.heroine, movie.director].filter(Boolean);
      for (const name of names) {
        if (name.toLowerCase() !== celebrityName.toLowerCase()) {
          const existing = collaborators.get(name) || { count: 0, type: 'costar' };
          existing.count++;
          if (name === movie.director) existing.type = 'director';
          collaborators.set(name, existing);
        }
      }
    }

    const topCollaborators = Array.from(collaborators.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    const related: RelatedCelebrity[] = [];
    for (const [name, { count, type }] of topCollaborators) {
      const { data: celeb } = await supabase
        .from('celebrities')
        .select('id, slug, name_en, name_te, profile_image, occupation')
        .ilike('name_en', `%${name}%`)
        .limit(1)
        .single();

      if (celeb) {
        related.push({
          id: celeb.id,
          slug: celeb.slug,
          name_en: celeb.name_en,
          name_te: celeb.name_te,
          profile_image: celeb.profile_image,
          occupation: celeb.occupation?.[0],
          collaboration_count: count,
          relation_type: type as 'costar' | 'director' | 'producer' | 'music_director',
        });
      }
    }

    return related;
  } catch (error) {
    console.error('Error fetching related celebrities:', error);
    return [];
  }
}

// Helper functions
function getVerdictColor(verdict?: string): string {
  const colors: Record<string, string> = {
    'industry-hit': '#FFD700',
    'blockbuster': '#22C55E',
    'super-hit': '#10B981',
    'hit': '#34D399',
    'average': '#FCD34D',
    'below-average': '#F97316',
    'flop': '#EF4444',
    'disaster': '#DC2626',
  };
  return colors[verdict?.toLowerCase() || ''] || '#6B7280';
}

function isHit(verdict?: string): boolean {
  return ['industry-hit', 'blockbuster', 'super-hit', 'hit'].includes(verdict?.toLowerCase() || '');
}

function isFlop(verdict?: string): boolean {
  return ['flop', 'disaster', 'below-average'].includes(verdict?.toLowerCase() || '');
}

function getActiveYears(filmography: FilmographyItem[]): string {
  if (filmography.length === 0) return 'N/A';
  const years = filmography.map(m => m.release_year).filter(Boolean).sort();
  const min = years[0];
  const max = years[years.length - 1];
  const current = new Date().getFullYear();
  return `${min}-${max === current ? 'Present' : max}`;
}

export default async function CelebrityPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getCelebrityData(slug);

  if (!data) {
    notFound();
  }

  const { celebrity, awards, milestones, trivia, filmography, relatedCelebrities } = data;

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border-primary)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            href="/celebrities" 
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Celebrities</span>
          </Link>

          <ShareButton title={celebrity.name_en} />
        </div>
      </header>

      {/* Hero Section */}
      <CelebrityHero celebrity={celebrity} />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Biography */}
        {(celebrity.short_bio || celebrity.full_bio) && (
          <section>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Biography</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {celebrity.full_bio || celebrity.short_bio}
              </p>
              {celebrity.full_bio_te && (
                <p className="text-orange-400/80 mt-4 leading-relaxed">
                  {celebrity.full_bio_te}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Rise to Stardom */}
        {milestones.length > 0 && (
          <CareerTimeline 
            milestones={milestones} 
            celebrityName={celebrity.name_en} 
          />
        )}

        {/* Awards Section */}
        {awards.length > 0 && (
          <AwardsSection awards={awards} />
        )}

        {/* Filmography */}
        {filmography.length > 0 && (
          <FilmographyGrid 
            filmography={filmography} 
            celebritySlug={slug}
          />
        )}

        {/* Trivia */}
        {trivia.length > 0 && (
          <TriviaCards trivia={trivia} />
        )}

        {/* Related Celebrities */}
        {relatedCelebrities.length > 0 && (
          <RelatedCelebrities celebrities={relatedCelebrities} />
        )}

        {/* Footer Note */}
        <div className="text-center py-8 border-t border-[var(--border-primary)]">
          <p className="text-xs text-[var(--text-tertiary)]">
            Information is sourced from TMDB, Wikipedia, and other public sources. 
            Some data may be estimated or incomplete.
          </p>
        </div>
      </div>
    </main>
  );
}


