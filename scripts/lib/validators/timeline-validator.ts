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

/** Normalize name for matching (lowercase, trim). */
function norm(name: string): string {
  return name.toLowerCase().trim();
}

/** Check if celebrity name matches actor name (exact or contains). */
function celebMatchesActor(celebName: string | null, actorName: string): boolean {
  if (!celebName) return false;
  const a = norm(actorName);
  const c = norm(celebName);
  return c === a || c.includes(a) || a.includes(c);
}

/**
 * Build career data from the movie batch we already have (no per-actor DB queries).
 * Then fetch celebrities in one batched query and merge death_year / date_of_birth / optional debut_year.
 */
async function getActorCareerDataBatch(
  supabase: SupabaseClient,
  movies: MovieForTimeline[],
  actorNames: string[]
): Promise<Map<string, ActorCareerData>> {
  const uniqueNames = [...new Set(actorNames.filter(n => n))];
  console.log(`  Fetching career data for ${uniqueNames.length} actors (from batch + 1 celeb query)...`);

  // 1. Build debut/last year and filmography from the passed-in movies only (no extra queries)
  const actorYears = new Map<string, number[]>();
  const actorFilmography = new Map<string, Array<{ title: string; year: number; role: string }>>();

  for (const movie of movies) {
    const year = movie.release_year ?? 0;
    if (year < 1900 || year > 2030) continue;

    const add = (name: string, role: string) => {
      if (!name) return;
      const key = norm(name);
      if (!actorYears.has(key)) {
        actorYears.set(key, []);
        actorFilmography.set(key, []);
      }
      actorYears.get(key)!.push(year);
      actorFilmography.get(key)!.push({ title: movie.title_en || '', year, role });
    };

    extractHeroes(movie).forEach(h => add(h, 'hero'));
    extractHeroines(movie).forEach(h => add(h, 'heroine'));
    if (movie.director) add(movie.director, 'director');
  }

  // 2. Fetch all celebrities in one query; match by name in memory
  let celebs: Array<{ name_en: string | null; debut_year: number | null; death_year: number | null; date_of_birth: string | null }> = [];
  const { data: allCelebs } = await supabase
    .from('celebrities')
    .select('name_en, debut_year, death_year, date_of_birth')
    .limit(10000);
  if (allCelebs) celebs = allCelebs;

  const careerData = new Map<string, ActorCareerData>();

  for (const name of uniqueNames) {
    const key = norm(name);
    const years = actorYears.get(key);
    if (!years || years.length === 0) continue;

    const filmography = actorFilmography.get(key) ?? [];
    filmography.sort((a, b) => a.year - b.year);
    const debutYearFromFilms = Math.min(...years);
    const lastFilmYearFromFilms = Math.max(...years);

    const celeb = celebs.find(c => celebMatchesActor(c.name_en, name));
    const debutYear = celeb?.debut_year ?? debutYearFromFilms;
    const deathYear = celeb?.death_year ?? null;
    let birthYear: number | null = null;
    if (celeb?.date_of_birth) {
      try {
        birthYear = new Date(celeb.date_of_birth).getFullYear();
      } catch {
        // ignore
      }
    }

    careerData.set(key, {
      name,
      debutYear,
      lastFilmYear: lastFilmYearFromFilms,
      deathYear,
      retirementYear: null,
      birthYear,
      totalFilms: filmography.length,
      filmography,
    });
  }

  console.log(`  Loaded career data for ${careerData.size} actors`);
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

  // Build career data from this movie batch + one celeb query (no per-actor queries)
  const careerDataMap = await getActorCareerDataBatch(supabase, movies, allActorNames);

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
