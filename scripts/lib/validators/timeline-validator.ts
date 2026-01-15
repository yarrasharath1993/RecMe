/**
 * TIMELINE VALIDATOR
 * 
 * Validates actor career timelines:
 * - Movies before actor's debut
 * - Movies after actor's death
 * - Movies after retirement
 * - Impossible age scenarios (child actor in old film, etc.)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// TYPES
// ============================================================

export interface MovieForTimeline {
  id: string;
  title_en: string;
  release_year?: number | null;
  hero?: string | null;
  heroine?: string | null;
  director?: string | null;
  supporting_cast?: Array<{ name: string }> | null;
}

export interface ActorCareerData {
  name: string;
  debutYear: number | null;
  lastFilmYear: number | null;
  deathYear: number | null;
  retirementYear: number | null;
  birthYear: number | null;
  totalFilms: number;
  filmography: Array<{ title: string; year: number; role: string }>;
}

export interface TimelineIssue {
  movieId: string;
  title: string;
  movieYear: number;
  actor: string;
  role: string;
  issue: 'before_debut' | 'after_death' | 'after_retirement' | 'impossible_age';
  actorDebutYear?: number;
  actorDeathYear?: number;
  actorRetirementYear?: number;
  actorBirthYear?: number;
  reason: string;
  confidence: number;
  severity: 'high' | 'medium' | 'low';
}

export interface TimelineValidationResult {
  timelineIssues: TimelineIssue[];
  actorsChecked: number;
  totalMoviesChecked: number;
  totalIssuesFound: number;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Extract all heroes from a movie (handles multiple heroes)
 */
function extractHeroes(movie: MovieForTimeline): string[] {
  const heroes: string[] = [];
  
  if (movie.hero) {
    // Handle comma-separated heroes
    if (movie.hero.includes(',')) {
      heroes.push(...movie.hero.split(',').map(h => h.trim()).filter(h => h));
    } else {
      heroes.push(movie.hero);
    }
  }
  
  return heroes;
}

/**
 * Extract all heroines from a movie (handles multiple heroines)
 */
function extractHeroines(movie: MovieForTimeline): string[] {
  const heroines: string[] = [];
  
  if (movie.heroine) {
    // Handle comma-separated heroines
    if (movie.heroine.includes(',')) {
      heroines.push(...movie.heroine.split(',').map(h => h.trim()).filter(h => h));
    } else {
      heroines.push(movie.heroine);
    }
  }
  
  return heroines;
}

// ============================================================
// ACTOR CAREER DATA EXTRACTION
// ============================================================

/**
 * Build actor career data from database
 * Finds debut year, last film year, and full filmography
 */
async function getActorCareerData(
  supabase: SupabaseClient,
  actorName: string
): Promise<ActorCareerData | null> {
  // Get celebrity info first
  const { data: celeb, error: celebError } = await supabase
    .from('celebrities')
    .select('debut_year, death_year, date_of_birth')
    .ilike('name_en', actorName)
    .single();

  // Get all movies featuring this actor
  const { data: heroMovies } = await supabase
    .from('movies')
    .select('title_en, release_year')
    .ilike('hero', actorName)
    .not('release_year', 'is', null)
    .order('release_year', { ascending: true });

  const { data: heroineMovies } = await supabase
    .from('movies')
    .select('title_en, release_year')
    .ilike('heroine', actorName)
    .not('release_year', 'is', null)
    .order('release_year', { ascending: true });

  const { data: hero2Movies } = await supabase
    .from('movies')
    .select('title_en, release_year')
    .ilike('hero2', actorName)
    .not('release_year', 'is', null)
    .order('release_year', { ascending: true });

  const { data: heroine2Movies } = await supabase
    .from('movies')
    .select('title_en, release_year')
    .ilike('heroine2', actorName)
    .not('release_year', 'is', null)
    .order('release_year', { ascending: true });

  const { data: directorMovies } = await supabase
    .from('movies')
    .select('title_en, release_year')
    .ilike('director', actorName)
    .not('release_year', 'is', null)
    .order('release_year', { ascending: true });

  // Combine all filmography
  const filmography: Array<{ title: string; year: number; role: string }> = [];
  
  if (heroMovies) {
    filmography.push(...heroMovies.map(m => ({ title: m.title_en, year: m.release_year!, role: 'hero' })));
  }
  if (heroineMovies) {
    filmography.push(...heroineMovies.map(m => ({ title: m.title_en, year: m.release_year!, role: 'heroine' })));
  }
  if (hero2Movies) {
    filmography.push(...hero2Movies.map(m => ({ title: m.title_en, year: m.release_year!, role: 'hero2' })));
  }
  if (heroine2Movies) {
    filmography.push(...heroine2Movies.map(m => ({ title: m.title_en, year: m.release_year!, role: 'heroine2' })));
  }
  if (directorMovies) {
    filmography.push(...directorMovies.map(m => ({ title: m.title_en, year: m.release_year!, role: 'director' })));
  }

  if (filmography.length === 0) {
    return null;
  }

  // Sort by year
  filmography.sort((a, b) => a.year - b.year);

  // Calculate debut and last film year from actual filmography
  const debutYearFromFilms = filmography[0].year;
  const lastFilmYearFromFilms = filmography[filmography.length - 1].year;

  // Use celebrity debut_year if available, otherwise use calculated
  const debutYear = celeb?.debut_year || debutYearFromFilms;
  const deathYear = celeb?.death_year || null;
  
  // Calculate birth year if date_of_birth exists
  let birthYear: number | null = null;
  if (celeb?.date_of_birth) {
    const dob = new Date(celeb.date_of_birth);
    birthYear = dob.getFullYear();
  }

  return {
    name: actorName,
    debutYear,
    lastFilmYear: lastFilmYearFromFilms,
    deathYear,
    retirementYear: null, // We don't track this in DB currently
    birthYear,
    totalFilms: filmography.length,
    filmography,
  };
}

/**
 * Batch get actor career data for multiple actors
 */
async function getActorCareerDataBatch(
  supabase: SupabaseClient,
  actorNames: string[]
): Promise<Map<string, ActorCareerData>> {
  const uniqueNames = [...new Set(actorNames.filter(n => n))];
  const careerData = new Map<string, ActorCareerData>();

  console.log(`  Fetching career data for ${uniqueNames.length} actors...`);

  for (const name of uniqueNames) {
    const data = await getActorCareerData(supabase, name);
    if (data) {
      careerData.set(name.toLowerCase(), data);
    }
  }

  return careerData;
}

// ============================================================
// TIMELINE VALIDATION
// ============================================================

/**
 * Check if movie is before actor's debut
 */
function checkBeforeDebut(
  movie: MovieForTimeline,
  actorName: string,
  role: string,
  careerData: ActorCareerData
): TimelineIssue | null {
  if (!movie.release_year || !careerData.debutYear) {
    return null;
  }

  if (movie.release_year < careerData.debutYear) {
    return {
      movieId: movie.id,
      title: movie.title_en,
      movieYear: movie.release_year,
      actor: actorName,
      role,
      issue: 'before_debut',
      actorDebutYear: careerData.debutYear,
      reason: `Movie released in ${movie.release_year}, but ${actorName}'s debut was in ${careerData.debutYear}`,
      confidence: 0.90,
      severity: 'high',
    };
  }

  return null;
}

/**
 * Check if movie is after actor's death
 */
function checkAfterDeath(
  movie: MovieForTimeline,
  actorName: string,
  role: string,
  careerData: ActorCareerData
): TimelineIssue | null {
  if (!movie.release_year || !careerData.deathYear) {
    return null;
  }

  if (movie.release_year > careerData.deathYear) {
    return {
      movieId: movie.id,
      title: movie.title_en,
      movieYear: movie.release_year,
      actor: actorName,
      role,
      issue: 'after_death',
      actorDeathYear: careerData.deathYear,
      reason: `Movie released in ${movie.release_year}, but ${actorName} died in ${careerData.deathYear}`,
      confidence: 0.95,
      severity: 'high',
    };
  }

  return null;
}

/**
 * Check for impossible age scenarios
 */
function checkImpossibleAge(
  movie: MovieForTimeline,
  actorName: string,
  role: string,
  careerData: ActorCareerData
): TimelineIssue | null {
  if (!movie.release_year || !careerData.birthYear) {
    return null;
  }

  const ageAtRelease = movie.release_year - careerData.birthYear;

  // Too young (younger than 5 years old in a lead role)
  if (ageAtRelease < 5 && (role === 'hero' || role === 'heroine')) {
    return {
      movieId: movie.id,
      title: movie.title_en,
      movieYear: movie.release_year,
      actor: actorName,
      role,
      issue: 'impossible_age',
      actorBirthYear: careerData.birthYear,
      reason: `${actorName} would be ${ageAtRelease} years old, too young for lead role`,
      confidence: 0.85,
      severity: 'medium',
    };
  }

  // Too old (older than 80 years old in an action role)
  if (ageAtRelease > 80 && role === 'hero') {
    return {
      movieId: movie.id,
      title: movie.title_en,
      movieYear: movie.release_year,
      actor: actorName,
      role,
      issue: 'impossible_age',
      actorBirthYear: careerData.birthYear,
      reason: `${actorName} would be ${ageAtRelease} years old, unlikely for lead hero role`,
      confidence: 0.60,
      severity: 'low',
    };
  }

  return null;
}

// ============================================================
// COMPREHENSIVE TIMELINE VALIDATION
// ============================================================

/**
 * Run all timeline validation checks
 */
export async function validateTimelines(
  supabase: SupabaseClient,
  movies: MovieForTimeline[],
  options: {
    checkDebut?: boolean;
    checkDeath?: boolean;
    checkAge?: boolean;
  } = {}
): Promise<TimelineValidationResult> {
  const {
    checkDebut = true,
    checkDeath = true,
    checkAge = true,
  } = options;

  console.log(`Validating timelines for ${movies.length} movies...`);

  // Collect all actor names (handle multiple heroes/heroines)
  const allActorNames: string[] = [];
  for (const movie of movies) {
    allActorNames.push(...extractHeroes(movie));
    allActorNames.push(...extractHeroines(movie));
    if (movie.director) allActorNames.push(movie.director);
  }

  // Batch fetch career data
  const careerDataMap = await getActorCareerDataBatch(supabase, allActorNames);
  console.log(`  Loaded career data for ${careerDataMap.size} actors`);

  const timelineIssues: TimelineIssue[] = [];

  // Process each movie
  for (const movie of movies) {
    // Extract all cast members (handle multiple heroes/heroines)
    const heroes = extractHeroes(movie);
    const heroines = extractHeroines(movie);
    
    const castMembers: Array<{ name: string; role: string }> = [
      ...heroes.map(name => ({ name, role: 'hero' })),
      ...heroines.map(name => ({ name, role: 'heroine' })),
    ];

    if (movie.director) {
      castMembers.push({ name: movie.director, role: 'director' });
    }

    for (const { name, role } of castMembers) {
      const careerData = careerDataMap.get(name.toLowerCase());
      if (!careerData) continue;

      // Check debut
      if (checkDebut) {
        const issue = checkBeforeDebut(movie, name, role, careerData);
        if (issue) timelineIssues.push(issue);
      }

      // Check death
      if (checkDeath) {
        const issue = checkAfterDeath(movie, name, role, careerData);
        if (issue) timelineIssues.push(issue);
      }

      // Check age
      if (checkAge) {
        const issue = checkImpossibleAge(movie, name, role, careerData);
        if (issue) timelineIssues.push(issue);
      }
    }
  }

  return {
    timelineIssues,
    actorsChecked: careerDataMap.size,
    totalMoviesChecked: movies.length,
    totalIssuesFound: timelineIssues.length,
  };
}
