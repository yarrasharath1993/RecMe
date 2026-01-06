/**
 * CAST VALIDATOR
 * 
 * Validates cast/crew data by cross-referencing with external sources:
 * - Wikipedia (filmographies)
 * - TMDB (cast/crew data with gender)
 * - Wikidata (structured data)
 * 
 * Usage:
 *   npx tsx scripts/cast-validator.ts --movie="Movie Name" --year=2020
 *   npx tsx scripts/cast-validator.ts --actor="Actor Name" --validate-filmography
 *   npx tsx scripts/cast-validator.ts --batch=docs/MOVIES_TO_VALIDATE.csv
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql';

// ============================================================
// TYPES
// ============================================================

export interface ValidationResult {
  movieId: string;
  title: string;
  year: number;
  isValid: boolean;
  source: 'tmdb' | 'wikipedia' | 'wikidata' | 'manual' | 'none';
  confidence: number;
  currentData: {
    hero: string | null;
    heroine: string | null;
    director: string | null;
  };
  suggestions: CastCorrection[];
  warnings: string[];
}

export interface CastCorrection {
  field: 'hero' | 'heroine' | 'director';
  currentValue: string | null;
  suggestedValue: string;
  role?: 'lead' | 'supporting' | 'cameo' | 'special_appearance';
  source: string;
  confidence: number;
}

interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  order: number;
  gender: number; // 1=female, 2=male
}

interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

interface FilmographyEntry {
  title: string;
  year: number;
  role: 'lead' | 'supporting' | 'cameo' | 'unknown';
  source: string;
}

// ============================================================
// TMDB VALIDATION
// ============================================================

async function validateWithTMDB(title: string, year: number): Promise<{
  hero?: string;
  heroine?: string;
  director?: string;
  cast?: TMDBCastMember[];
  confidence: number;
} | null> {
  if (!TMDB_API_KEY) {
    console.log('  ⚠️  TMDB API key not configured');
    return null;
  }

  try {
    // Search for the movie
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}&language=en-US`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      return null;
    }

    // Prefer Telugu movies
    const movie = searchData.results.find((m: any) => m.original_language === 'te') 
      || searchData.results[0];

    // Get credits
    const creditsUrl = `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`;
    const creditsRes = await fetch(creditsUrl);
    const credits = await creditsRes.json();

    const result: {
      hero?: string;
      heroine?: string;
      director?: string;
      cast?: TMDBCastMember[];
      confidence: number;
    } = { confidence: 0.85 };

    // Director
    const director = credits.crew?.find((c: TMDBCrewMember) => c.job === 'Director');
    if (director) {
      result.director = director.name;
    }

    // Cast with gender-based detection
    const cast = credits.cast || [];
    result.cast = cast.slice(0, 10);

    // Hero (first male lead by order)
    const males = cast
      .filter((c: TMDBCastMember) => c.gender === 2)
      .sort((a: TMDBCastMember, b: TMDBCastMember) => a.order - b.order);
    if (males[0]) {
      result.hero = males[0].name;
    }

    // Heroine (first female lead by order)
    const females = cast
      .filter((c: TMDBCastMember) => c.gender === 1)
      .sort((a: TMDBCastMember, b: TMDBCastMember) => a.order - b.order);
    if (females[0]) {
      result.heroine = females[0].name;
    }

    return result;
  } catch (error) {
    console.log('  ✗ TMDB error:', (error as Error).message);
    return null;
  }
}

// ============================================================
// WIKIDATA VALIDATION
// ============================================================

async function validateWithWikidata(title: string, year: number): Promise<{
  hero?: string;
  heroine?: string;
  director?: string;
  confidence: number;
} | null> {
  try {
    const query = `
      SELECT ?film ?filmLabel ?directorLabel ?castLabel ?castGenderLabel WHERE {
        ?film wdt:P31 wd:Q11424.
        ?film rdfs:label ?filmLabel.
        ?film wdt:P364 wd:Q8097.
        OPTIONAL { ?film wdt:P577 ?date. }
        OPTIONAL { ?film wdt:P57 ?director. }
        OPTIONAL { 
          ?film wdt:P161 ?cast. 
          ?cast wdt:P21 ?castGender.
        }
        FILTER(LANG(?filmLabel) = "en")
        FILTER(CONTAINS(LCASE(?filmLabel), "${title.toLowerCase().replace(/'/g, "\\'")}"))
        ${year ? `FILTER(YEAR(?date) = ${year})` : ''}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT 30
    `;

    const url = `${WIKIDATA_SPARQL}?query=${encodeURIComponent(query)}&format=json`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'TeluguPortal/1.0' }
    });

    if (!res.ok) return null;

    const data = await res.json();
    const bindings = data.results?.bindings;

    if (!bindings || bindings.length === 0) return null;

    const result: {
      hero?: string;
      heroine?: string;
      director?: string;
      confidence: number;
    } = { confidence: 0.75 };

    // Director
    const directorBinding = bindings.find((b: any) => b.directorLabel?.value);
    if (directorBinding) {
      result.director = directorBinding.directorLabel.value;
    }

    // Hero (male cast)
    const maleBinding = bindings.find((b: any) =>
      b.castLabel?.value && b.castGenderLabel?.value === 'male'
    );
    if (maleBinding) {
      result.hero = maleBinding.castLabel.value;
    }

    // Heroine (female cast)
    const femaleBinding = bindings.find((b: any) =>
      b.castLabel?.value && b.castGenderLabel?.value === 'female'
    );
    if (femaleBinding) {
      result.heroine = femaleBinding.castLabel.value;
    }

    return result;
  } catch (error) {
    console.log('  ✗ Wikidata error:', (error as Error).message);
    return null;
  }
}

// ============================================================
// WIKIPEDIA FILMOGRAPHY FETCH
// ============================================================

export async function fetchActorFilmography(actorName: string): Promise<FilmographyEntry[]> {
  try {
    // Search Wikipedia for actor's filmography
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(actorName.replace(/ /g, '_'))}_filmography`;
    
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'TeluguPortal/1.0' }
    });

    if (!res.ok) {
      // Try alternate search
      const altUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(actorName.replace(/ /g, '_'))}`;
      const altRes = await fetch(altUrl, { headers: { 'User-Agent': 'TeluguPortal/1.0' } });
      
      if (!altRes.ok) return [];
    }

    // Note: Wikipedia REST API doesn't give us filmography directly
    // This is a placeholder - in production, you'd parse the HTML or use a more sophisticated approach
    console.log(`  📚 Fetching filmography for ${actorName} from Wikipedia...`);
    
    return [];
  } catch (error) {
    console.log(`  ✗ Wikipedia error for ${actorName}:`, (error as Error).message);
    return [];
  }
}

// ============================================================
// DUPLICATE DETECTION
// ============================================================

export async function detectDuplicates(title: string, year: number): Promise<{
  hasDuplicates: boolean;
  duplicates: { id: string; title: string; year: number }[];
}> {
  // Normalize title for comparison
  const normalizedTitle = title.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');

  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, release_year')
    .eq('language', 'Telugu')
    .or(`release_year.eq.${year},release_year.eq.${year - 1},release_year.eq.${year + 1}`);

  const duplicates = (movies || []).filter(m => {
    const normalized = m.title_en.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/\s+/g, '');
    
    // Check for similar titles (Levenshtein distance could be used here)
    return normalized === normalizedTitle || 
           normalized.includes(normalizedTitle) || 
           normalizedTitle.includes(normalized);
  });

  // Filter out exact match
  const actualDuplicates = duplicates.filter(d => 
    d.title_en !== title || d.release_year !== year
  );

  return {
    hasDuplicates: actualDuplicates.length > 0,
    duplicates: actualDuplicates.map(d => ({
      id: d.id,
      title: d.title_en,
      year: d.release_year
    }))
  };
}

// ============================================================
// ROLE CLASSIFICATION
// ============================================================

export function classifyRole(
  actorName: string,
  castList: TMDBCastMember[],
  debutYear?: number,
  movieYear?: number
): 'lead' | 'supporting' | 'cameo' | 'special_appearance' | 'unknown' {
  const actor = castList.find(c => 
    c.name.toLowerCase() === actorName.toLowerCase()
  );

  if (!actor) return 'unknown';

  // Pre-debut check
  if (debutYear && movieYear && movieYear < debutYear) {
    return 'supporting'; // Before debut = likely supporting role
  }

  // Order-based classification
  if (actor.order === 0) return 'lead';
  if (actor.order <= 2) return 'lead';
  if (actor.order <= 5) return 'supporting';
  if (actor.order <= 10) return 'cameo';
  
  return 'special_appearance';
}

// ============================================================
// MAIN VALIDATION FUNCTION
// ============================================================

export async function validateMovie(
  title: string,
  year: number,
  currentData?: { hero?: string | null; heroine?: string | null; director?: string | null }
): Promise<ValidationResult> {
  console.log(`\nValidating: ${title} (${year})`);

  // Fetch current data from DB if not provided
  let movieData = currentData;
  let movieId = '';

  if (!movieData) {
    const { data: movie } = await supabase
      .from('movies')
      .select('id, hero, heroine, director')
      .eq('title_en', title)
      .eq('release_year', year)
      .single();

    if (movie) {
      movieData = { hero: movie.hero, heroine: movie.heroine, director: movie.director };
      movieId = movie.id;
    } else {
      movieData = { hero: null, heroine: null, director: null };
    }
  }

  const result: ValidationResult = {
    movieId,
    title,
    year,
    isValid: true,
    source: 'none',
    confidence: 0,
    currentData: {
      hero: movieData.hero || null,
      heroine: movieData.heroine || null,
      director: movieData.director || null
    },
    suggestions: [],
    warnings: []
  };

  // 1. Check for duplicates
  const duplicateCheck = await detectDuplicates(title, year);
  if (duplicateCheck.hasDuplicates) {
    result.warnings.push(`Possible duplicates: ${duplicateCheck.duplicates.map(d => `${d.title} (${d.year})`).join(', ')}`);
  }

  // 2. Validate with TMDB
  console.log('  Checking TMDB...');
  const tmdbData = await validateWithTMDB(title, year);
  
  if (tmdbData) {
    result.source = 'tmdb';
    result.confidence = tmdbData.confidence;

    // Check hero mismatch
    if (tmdbData.hero && movieData.hero && 
        tmdbData.hero.toLowerCase() !== movieData.hero.toLowerCase()) {
      result.suggestions.push({
        field: 'hero',
        currentValue: movieData.hero,
        suggestedValue: tmdbData.hero,
        source: 'tmdb',
        confidence: tmdbData.confidence,
        role: 'lead'
      });
      result.isValid = false;
    }

    // Check heroine mismatch
    if (tmdbData.heroine && movieData.heroine && 
        tmdbData.heroine.toLowerCase() !== movieData.heroine.toLowerCase()) {
      result.suggestions.push({
        field: 'heroine',
        currentValue: movieData.heroine,
        suggestedValue: tmdbData.heroine,
        source: 'tmdb',
        confidence: tmdbData.confidence,
        role: 'lead'
      });
      result.isValid = false;
    }

    // Check director mismatch
    if (tmdbData.director && movieData.director && 
        tmdbData.director.toLowerCase() !== movieData.director.toLowerCase()) {
      result.suggestions.push({
        field: 'director',
        currentValue: movieData.director,
        suggestedValue: tmdbData.director,
        source: 'tmdb',
        confidence: tmdbData.confidence
      });
      result.isValid = false;
    }

    // Suggest missing fields
    if (!movieData.hero && tmdbData.hero) {
      result.suggestions.push({
        field: 'hero',
        currentValue: null,
        suggestedValue: tmdbData.hero,
        source: 'tmdb',
        confidence: tmdbData.confidence,
        role: 'lead'
      });
    }
    if (!movieData.heroine && tmdbData.heroine) {
      result.suggestions.push({
        field: 'heroine',
        currentValue: null,
        suggestedValue: tmdbData.heroine,
        source: 'tmdb',
        confidence: tmdbData.confidence,
        role: 'lead'
      });
    }
    if (!movieData.director && tmdbData.director) {
      result.suggestions.push({
        field: 'director',
        currentValue: null,
        suggestedValue: tmdbData.director,
        source: 'tmdb',
        confidence: tmdbData.confidence
      });
    }
  }

  // 3. Validate with Wikidata if TMDB didn't find anything
  if (!tmdbData) {
    console.log('  Checking Wikidata...');
    const wikidata = await validateWithWikidata(title, year);
    
    if (wikidata) {
      result.source = 'wikidata';
      result.confidence = wikidata.confidence;

      if (wikidata.director && !movieData.director) {
        result.suggestions.push({
          field: 'director',
          currentValue: null,
          suggestedValue: wikidata.director,
          source: 'wikidata',
          confidence: wikidata.confidence
        });
      }
      if (wikidata.hero && !movieData.hero) {
        result.suggestions.push({
          field: 'hero',
          currentValue: null,
          suggestedValue: wikidata.hero,
          source: 'wikidata',
          confidence: wikidata.confidence,
          role: 'lead'
        });
      }
    }
  }

  // 4. Check for invalid data patterns
  const invalidPatterns = ['Unknown', 'N/A', 'null', 'undefined', 'No Hero', 'No Director'];
  
  if (movieData.hero && invalidPatterns.some(p => movieData.hero?.includes(p))) {
    result.warnings.push(`Invalid hero value: "${movieData.hero}"`);
    result.isValid = false;
  }
  if (movieData.heroine && invalidPatterns.some(p => movieData.heroine?.includes(p))) {
    result.warnings.push(`Invalid heroine value: "${movieData.heroine}"`);
  }
  if (movieData.director && invalidPatterns.some(p => movieData.director?.includes(p))) {
    result.warnings.push(`Invalid director value: "${movieData.director}"`);
    result.isValid = false;
  }

  // Log results
  console.log(`  Source: ${result.source}`);
  console.log(`  Valid: ${result.isValid}`);
  console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
  if (result.suggestions.length > 0) {
    console.log(`  Suggestions: ${result.suggestions.length}`);
    result.suggestions.forEach(s => {
      console.log(`    - ${s.field}: "${s.currentValue}" → "${s.suggestedValue}" (${s.source})`);
    });
  }
  if (result.warnings.length > 0) {
    console.log(`  Warnings: ${result.warnings.join(', ')}`);
  }

  return result;
}

// ============================================================
// BATCH VALIDATION
// ============================================================

export async function validateMovies(
  movies: { title: string; year: number }[],
  options: { parallel?: boolean; batchSize?: number } = {}
): Promise<ValidationResult[]> {
  const { parallel = false, batchSize = 5 } = options;
  const results: ValidationResult[] = [];

  if (parallel) {
    // Process in batches
    for (let i = 0; i < movies.length; i += batchSize) {
      const batch = movies.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(m => validateMovie(m.title, m.year))
      );
      results.push(...batchResults);
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 500));
    }
  } else {
    // Sequential processing
    for (const movie of movies) {
      const result = await validateMovie(movie.title, movie.year);
      results.push(result);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  return results;
}

// ============================================================
// CLI
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  
  const movieArg = args.find(a => a.startsWith('--movie='));
  const yearArg = args.find(a => a.startsWith('--year='));
  const actorArg = args.find(a => a.startsWith('--actor='));
  const limitArg = args.find(a => a.startsWith('--limit='));
  const validateFilmography = args.includes('--validate-filmography');

  console.log('\n' + '═'.repeat(70));
  console.log('CAST VALIDATOR');
  console.log('═'.repeat(70));

  if (movieArg && yearArg) {
    // Single movie validation
    const title = movieArg.split('=')[1];
    const year = parseInt(yearArg.split('=')[1]);
    
    const result = await validateMovie(title, year);
    
    console.log('\n' + '─'.repeat(70));
    console.log('RESULT');
    console.log('─'.repeat(70));
    console.log(JSON.stringify(result, null, 2));
    
  } else if (actorArg && validateFilmography) {
    // Actor filmography validation
    const actorName = actorArg.split('=')[1];
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 50;
    
    console.log(`\nValidating filmography for: ${actorName}`);
    
    // Fetch movies where this actor is listed as hero
    const { data: movies } = await supabase
      .from('movies')
      .select('id, title_en, release_year, hero, heroine, director')
      .eq('language', 'Telugu')
      .ilike('hero', `%${actorName}%`)
      .order('release_year', { ascending: true })
      .limit(limit);

    if (!movies || movies.length === 0) {
      console.log(`No movies found for actor: ${actorName}`);
      return;
    }

    console.log(`Found ${movies.length} movies in database\n`);

    const results = await validateMovies(
      movies.map(m => ({ title: m.title_en, year: m.release_year })),
      { parallel: true, batchSize: 3 }
    );

    // Summary
    const invalid = results.filter(r => !r.isValid);
    const withSuggestions = results.filter(r => r.suggestions.length > 0);
    const withWarnings = results.filter(r => r.warnings.length > 0);

    console.log('\n' + '═'.repeat(70));
    console.log('VALIDATION SUMMARY');
    console.log('═'.repeat(70));
    console.log(`  Total movies:     ${results.length}`);
    console.log(`  Valid:            ${results.length - invalid.length}`);
    console.log(`  Invalid:          ${invalid.length}`);
    console.log(`  With suggestions: ${withSuggestions.length}`);
    console.log(`  With warnings:    ${withWarnings.length}`);

    if (invalid.length > 0) {
      console.log('\n  Invalid movies:');
      invalid.forEach(r => {
        console.log(`    - ${r.title} (${r.year}): ${r.warnings.join(', ')}`);
      });
    }

  } else {
    // Default: validate movies with missing or invalid data
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 20;
    
    console.log(`\nFetching ${limit} movies with potential issues...`);

    const { data: movies } = await supabase
      .from('movies')
      .select('id, title_en, release_year, hero, heroine, director')
      .eq('language', 'Telugu')
      .not('our_rating', 'is', null)
      .or('hero.ilike.%unknown%,director.ilike.%unknown%,hero.is.null,director.is.null')
      .limit(limit);

    if (!movies || movies.length === 0) {
      console.log('No movies with issues found!');
      return;
    }

    console.log(`Found ${movies.length} movies to validate\n`);

    const results = await validateMovies(
      movies.map(m => ({ title: m.title_en, year: m.release_year })),
      { parallel: false }
    );

    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('SUMMARY');
    console.log('═'.repeat(70));
    console.log(`  Total validated: ${results.length}`);
    console.log(`  With suggestions: ${results.filter(r => r.suggestions.length > 0).length}`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}


