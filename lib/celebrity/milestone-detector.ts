/**
 * Career Milestone Detector
 * Analyzes a celebrity's filmography to detect key career milestones
 */

import type { CelebrityMilestone, FilmographyItem, CelebrityProfile } from './types';

interface MovieForAnalysis {
  id: string;
  title_en: string;
  title_te?: string;
  release_year: number;
  our_rating?: number;
  verdict?: string;
  box_office_category?: string;
  is_blockbuster?: boolean;
  genres?: string[];
}

// ============================================================
// MILESTONE DETECTION
// ============================================================

export function detectMilestones(
  celebrity: CelebrityProfile,
  movies: MovieForAnalysis[]
): CelebrityMilestone[] {
  const milestones: CelebrityMilestone[] = [];
  
  if (movies.length === 0) return milestones;

  // Sort movies by year
  const sortedMovies = [...movies].sort((a, b) => a.release_year - b.release_year);

  // 1. Detect DEBUT
  const debut = sortedMovies[0];
  if (debut) {
    milestones.push({
      celebrity_id: celebrity.id,
      milestone_type: 'debut',
      year: debut.release_year,
      movie_id: debut.id,
      movie_title: debut.title_en,
      title: `Film Debut`,
      title_te: 'సినీ ప్రవేశం',
      description: `${celebrity.name_en} made their film debut with ${debut.title_en} in ${debut.release_year}.`,
      impact_score: 0.7,
    });
  }

  // 2. Detect BREAKTHROUGH (first blockbuster or first highly-rated film)
  const breakthrough = sortedMovies.find(m => 
    m.is_blockbuster || 
    m.box_office_category === 'blockbuster' || 
    m.box_office_category === 'industry-hit' ||
    (m.our_rating && m.our_rating >= 8)
  );
  
  if (breakthrough && breakthrough.id !== debut?.id) {
    milestones.push({
      celebrity_id: celebrity.id,
      milestone_type: 'breakthrough',
      year: breakthrough.release_year,
      movie_id: breakthrough.id,
      movie_title: breakthrough.title_en,
      title: `Breakthrough Success`,
      title_te: 'అద్భుత విజయం',
      description: `${breakthrough.title_en} established ${celebrity.name_en} as a major star in Telugu cinema.`,
      impact_score: 0.9,
    });
  }

  // 3. Detect PEAK YEAR (year with most hits or highest average rating)
  const yearStats = new Map<number, { hits: number; totalRating: number; count: number }>();
  
  for (const movie of movies) {
    const year = movie.release_year;
    const stats = yearStats.get(year) || { hits: 0, totalRating: 0, count: 0 };
    
    if (isHit(movie)) stats.hits++;
    if (movie.our_rating) {
      stats.totalRating += movie.our_rating;
      stats.count++;
    }
    
    yearStats.set(year, stats);
  }

  let peakYear: number | null = null;
  let peakScore = 0;
  
  for (const [year, stats] of yearStats.entries()) {
    const avgRating = stats.count > 0 ? stats.totalRating / stats.count : 0;
    const score = stats.hits * 2 + avgRating;
    
    if (score > peakScore && stats.hits >= 1) {
      peakScore = score;
      peakYear = year;
    }
  }

  if (peakYear) {
    const peakMovies = movies.filter(m => m.release_year === peakYear);
    const bestPeakMovie = peakMovies.sort((a, b) => (b.our_rating || 0) - (a.our_rating || 0))[0];
    
    if (bestPeakMovie && peakYear !== debut?.release_year && peakYear !== breakthrough?.release_year) {
      milestones.push({
        celebrity_id: celebrity.id,
        milestone_type: 'peak',
        year: peakYear,
        movie_id: bestPeakMovie.id,
        movie_title: bestPeakMovie.title_en,
        title: `Peak Year`,
        title_te: 'శిఖర సంవత్సరం',
        description: `${peakYear} was a landmark year for ${celebrity.name_en} with multiple successful films.`,
        impact_score: 0.85,
      });
    }
  }

  // 4. Detect COMEBACK (hit after a streak of flops or a gap)
  let flopStreak = 0;
  let lastHitYear = 0;
  
  for (const movie of sortedMovies) {
    if (isHit(movie)) {
      // Check if this is a comeback
      if (flopStreak >= 3 || (lastHitYear > 0 && movie.release_year - lastHitYear >= 4)) {
        milestones.push({
          celebrity_id: celebrity.id,
          milestone_type: 'comeback',
          year: movie.release_year,
          movie_id: movie.id,
          movie_title: movie.title_en,
          title: `Successful Comeback`,
          title_te: 'విజయవంతమైన తిరిగి రాక',
          description: `${celebrity.name_en} made a triumphant comeback with ${movie.title_en}.`,
          impact_score: 0.8,
        });
      }
      flopStreak = 0;
      lastHitYear = movie.release_year;
    } else if (isFlop(movie)) {
      flopStreak++;
    }
  }

  // 5. Detect DOWNFALL (3+ consecutive flops after hits)
  let hitCount = 0;
  let currentFlopStreak = 0;
  let downfallDetected = false;
  
  for (const movie of sortedMovies) {
    if (isHit(movie)) {
      hitCount++;
      currentFlopStreak = 0;
    } else if (isFlop(movie)) {
      currentFlopStreak++;
      
      // Downfall: had hits before, now 3+ consecutive flops
      if (hitCount >= 3 && currentFlopStreak >= 3 && !downfallDetected) {
        downfallDetected = true;
        milestones.push({
          celebrity_id: celebrity.id,
          milestone_type: 'downfall',
          year: movie.release_year,
          movie_id: movie.id,
          movie_title: movie.title_en,
          title: `Career Slump`,
          title_te: 'కెరీర్ సవాలు',
          description: `${celebrity.name_en} faced a challenging phase with a series of unsuccessful films.`,
          impact_score: 0.6,
        });
      }
    }
  }

  // 6. Detect RECORD (if any movie is industry-hit or has exceptional rating)
  const recordMovies = movies.filter(m => 
    m.box_office_category === 'industry-hit' || 
    (m.our_rating && m.our_rating >= 9)
  );
  
  for (const movie of recordMovies) {
    // Avoid duplicating breakthrough
    if (movie.id === breakthrough?.id) continue;
    
    milestones.push({
      celebrity_id: celebrity.id,
      milestone_type: 'record',
      year: movie.release_year,
      movie_id: movie.id,
      movie_title: movie.title_en,
      title: `Box Office Record`,
      title_te: 'బాక్స్ ఆఫీస్ రికార్డు',
      description: `${movie.title_en} became one of the biggest hits in Telugu cinema.`,
      impact_score: 0.95,
    });
  }

  // Sort by year and impact
  milestones.sort((a, b) => a.year - b.year);

  return milestones;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function isHit(movie: MovieForAnalysis): boolean {
  const category = movie.box_office_category?.toLowerCase();
  if (category) {
    return ['industry-hit', 'blockbuster', 'super-hit', 'hit'].includes(category);
  }
  if (movie.is_blockbuster) return true;
  if (movie.our_rating && movie.our_rating >= 7) return true;
  return false;
}

function isFlop(movie: MovieForAnalysis): boolean {
  const category = movie.box_office_category?.toLowerCase();
  if (category) {
    return ['disaster', 'flop', 'below-average'].includes(category);
  }
  if (movie.our_rating && movie.our_rating < 5) return true;
  return false;
}

// ============================================================
// CAREER STATS CALCULATION
// ============================================================

export function calculateCareerStats(movies: MovieForAnalysis[]): {
  total: number;
  hits: number;
  average: number;
  flops: number;
  hitRate: number;
  activeYears: string;
  peakYears: string;
} {
  if (movies.length === 0) {
    return {
      total: 0,
      hits: 0,
      average: 0,
      flops: 0,
      hitRate: 0,
      activeYears: 'N/A',
      peakYears: 'N/A',
    };
  }

  const hits = movies.filter(isHit).length;
  const flops = movies.filter(isFlop).length;
  const average = movies.length - hits - flops;

  const years = movies.map(m => m.release_year).filter(Boolean);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  // Find peak years (years with 2+ hits)
  const yearHits = new Map<number, number>();
  for (const movie of movies) {
    if (isHit(movie)) {
      yearHits.set(movie.release_year, (yearHits.get(movie.release_year) || 0) + 1);
    }
  }
  
  const peakYearsList = Array.from(yearHits.entries())
    .filter(([_, count]) => count >= 2)
    .map(([year]) => year)
    .sort((a, b) => b - a)
    .slice(0, 3);

  return {
    total: movies.length,
    hits,
    average,
    flops,
    hitRate: movies.length > 0 ? Math.round((hits / movies.length) * 100) : 0,
    activeYears: `${minYear}-${maxYear === new Date().getFullYear() ? 'Present' : maxYear}`,
    peakYears: peakYearsList.length > 0 ? peakYearsList.join(', ') : 'N/A',
  };
}

// ============================================================
// ERA CLASSIFICATION
// ============================================================

export function classifyEra(debutYear?: number, birthYear?: number): CelebrityProfile['era'] {
  const currentYear = new Date().getFullYear();
  const debut = debutYear || currentYear;
  
  if (debut < 1970) return 'legend';
  if (debut < 1990) return 'golden';
  if (debut < 2010) return 'classic';
  if (debut < 2020) return 'current';
  return 'emerging';
}


