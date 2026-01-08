#!/usr/bin/env npx tsx
/**
 * AI-POWERED GENRE ENRICHMENT
 * 
 * Enriches movies missing genres using:
 * 1. AI inference from title + synopsis + cast/director
 * 2. Wikipedia scraping for classic films
 * 3. Rule-based fallback for legendary actors/directors
 * 
 * Usage:
 *   npx tsx scripts/enrich-genres-ai.ts --limit=100 --dry-run
 *   npx tsx scripts/enrich-genres-ai.ts --limit=800 --execute
 *   npx tsx scripts/enrich-genres-ai.ts --classics-only --limit=200
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// CONFIGURATION
// ============================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const args = process.argv.slice(2);
const getArg = (name: string, def: string = '') => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : def;
};
const hasFlag = (name: string) => args.includes(`--${name}`);

const LIMIT = parseInt(getArg('limit', '100'));
const DRY_RUN = !hasFlag('execute');
const CLASSICS_ONLY = hasFlag('classics-only');
const VERBOSE = hasFlag('verbose') || hasFlag('-v');
const CONCURRENCY = parseInt(getArg('concurrency', '5'));

// ============================================================
// GENRE KNOWLEDGE BASE
// ============================================================

// Famous Telugu actors and their typical genres
const ACTOR_GENRE_MAP: Record<string, string[]> = {
  'N.T. Rama Rao': ['Drama', 'Mythological', 'Action'],
  'NTR': ['Drama', 'Mythological', 'Action'],
  'Akkineni Nageswara Rao': ['Drama', 'Romance', 'Family'],
  'ANR': ['Drama', 'Romance', 'Family'],
  'Chiranjeevi': ['Action', 'Drama', 'Comedy'],
  'Nagarjuna': ['Action', 'Romance', 'Drama'],
  'Venkatesh': ['Drama', 'Comedy', 'Family'],
  'Balakrishna': ['Action', 'Drama', 'Mythological'],
  'Pawan Kalyan': ['Action', 'Drama', 'Mass'],
  'Mahesh Babu': ['Action', 'Romance', 'Commercial'],
  'Prabhas': ['Action', 'Drama', 'Period'],
  'Allu Arjun': ['Action', 'Dance', 'Commercial'],
  'Ram Charan': ['Action', 'Drama', 'Commercial'],
  'Jr NTR': ['Action', 'Drama', 'Mass'],
  'Ravi Teja': ['Action', 'Comedy', 'Mass'],
  'Sobhan Babu': ['Romance', 'Drama', 'Family'],
  'Krishna': ['Action', 'Cowboy', 'Drama'],
  'Krishnam Raju': ['Action', 'Drama', 'Period'],
  'Mohan Babu': ['Action', 'Drama', 'Comedy'],
};

// Director genre associations
const DIRECTOR_GENRE_MAP: Record<string, string[]> = {
  'K. Raghavendra Rao': ['Drama', 'Romance', 'Family'],
  'S.S. Rajamouli': ['Action', 'Fantasy', 'Period'],
  'Rajamouli': ['Action', 'Fantasy', 'Period'],
  'K. Vishwanath': ['Drama', 'Musical', 'Art'],
  'Bapu': ['Drama', 'Mythological', 'Comedy'],
  'Singeetam Srinivasa Rao': ['Fantasy', 'Comedy', 'Musical'],
  'Dasari Narayana Rao': ['Drama', 'Social', 'Family'],
  'Trivikram Srinivas': ['Comedy', 'Drama', 'Romance'],
  'Puri Jagannadh': ['Action', 'Mass', 'Drama'],
  'Sukumar': ['Action', 'Drama', 'Thriller'],
  'Koratala Siva': ['Action', 'Drama', 'Social'],
  'Vamshi Paidipally': ['Action', 'Drama', 'Commercial'],
};

// Era-based default genres
const ERA_DEFAULTS: Record<string, string[]> = {
  '1930s': ['Drama', 'Mythological'],
  '1940s': ['Drama', 'Mythological', 'Social'],
  '1950s': ['Drama', 'Mythological', 'Romance'],
  '1960s': ['Drama', 'Romance', 'Family'],
  '1970s': ['Drama', 'Action', 'Romance'],
  '1980s': ['Action', 'Drama', 'Comedy'],
  '1990s': ['Action', 'Romance', 'Drama'],
  '2000s': ['Action', 'Romance', 'Comedy'],
  '2010s': ['Action', 'Drama', 'Commercial'],
  '2020s': ['Action', 'Drama', 'Thriller'],
};

// ============================================================
// WIKIPEDIA SCRAPER
// ============================================================

async function getGenresFromWikipedia(title: string, year: number | null): Promise<string[] | null> {
  try {
    // Try different Wikipedia page name patterns
    const patterns = [
      `${title}_(${year}_film)`,
      `${title}_(film)`,
      `${title}_(Telugu_film)`,
      title.replace(/ /g, '_'),
    ];

    for (const pattern of patterns) {
      const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(pattern)}`;
      
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'TeluguPortal/1.0 (contact@example.com)' }
        });
        
        if (!response.ok) continue;
        
        const html = await response.text();
        
        // Extract genres from infobox
        const genreMatch = html.match(/Genre[^<]*<\/th>\s*<td[^>]*>(.*?)<\/td>/is);
        if (genreMatch) {
          const genreText = genreMatch[1]
            .replace(/<[^>]+>/g, ' ')  // Remove HTML tags
            .replace(/\[[^\]]+\]/g, '') // Remove citations
            .trim();
          
          const genres = genreText
            .split(/[,\n]/)
            .map(g => g.trim())
            .filter(g => g.length > 2 && g.length < 30)
            .map(g => capitalizeGenre(g));
          
          if (genres.length > 0) {
            return genres.slice(0, 5);
          }
        }
      } catch {
        continue;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

function capitalizeGenre(genre: string): string {
  return genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase();
}

// ============================================================
// AI GENRE INFERENCE
// ============================================================

interface MovieContext {
  title: string;
  year: number | null;
  synopsis: string | null;
  director: string | null;
  hero: string | null;
  heroine: string | null;
}

async function inferGenresWithAI(movie: MovieContext): Promise<string[] | null> {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  const prompt = `You are a Telugu cinema expert. Based on the following movie information, identify the most likely genres.

MOVIE INFORMATION:
Title: ${movie.title}
Year: ${movie.year || 'Unknown'}
Director: ${movie.director || 'Unknown'}
Lead Actor: ${movie.hero || 'Unknown'}
Lead Actress: ${movie.heroine || 'Unknown'}
Synopsis: ${movie.synopsis || 'Not available'}

INSTRUCTIONS:
1. Return a JSON array of 2-4 genres
2. Use standard genre names: Action, Drama, Romance, Comedy, Thriller, Horror, Family, Musical, Mythological, Fantasy, Period, Social, Art, Crime, Mystery, War, Biographical, Sports, Adventure
3. Consider the era - older films (pre-1980) were often Mythological, Drama, Romance
4. Consider the lead actor's typical roles if known

Return ONLY a JSON array like: ["Drama", "Romance", "Family"]
No explanations, just the array.`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    // Parse JSON array
    const match = content.match(/\[.*\]/s);
    if (match) {
      const genres = JSON.parse(match[0]);
      if (Array.isArray(genres) && genres.length > 0) {
        return genres.map(g => capitalizeGenre(String(g))).slice(0, 5);
      }
    }
    
    return null;
  } catch (error) {
    if (VERBOSE) console.log(`  AI error: ${error}`);
    return null;
  }
}

// ============================================================
// RULE-BASED FALLBACK
// ============================================================

function inferGenresFromRules(movie: MovieContext): string[] {
  const genres: Set<string> = new Set();

  // Check hero
  if (movie.hero) {
    for (const [actor, actorGenres] of Object.entries(ACTOR_GENRE_MAP)) {
      if (movie.hero.toLowerCase().includes(actor.toLowerCase())) {
        actorGenres.forEach(g => genres.add(g));
        break;
      }
    }
  }

  // Check director
  if (movie.director) {
    for (const [director, directorGenres] of Object.entries(DIRECTOR_GENRE_MAP)) {
      if (movie.director.toLowerCase().includes(director.toLowerCase())) {
        directorGenres.forEach(g => genres.add(g));
        break;
      }
    }
  }

  // Check era if we still don't have genres
  if (genres.size === 0 && movie.year) {
    const decade = `${Math.floor(movie.year / 10) * 10}s`;
    const eraGenres = ERA_DEFAULTS[decade] || ['Drama'];
    eraGenres.forEach(g => genres.add(g));
  }

  // Default fallback
  if (genres.size === 0) {
    genres.add('Drama');
  }

  return Array.from(genres).slice(0, 4);
}

// ============================================================
// MAIN ENRICHMENT LOGIC
// ============================================================

interface EnrichmentResult {
  movieId: string;
  title: string;
  genres: string[];
  source: 'ai' | 'wikipedia' | 'rules';
  success: boolean;
}

async function enrichMovie(movie: any): Promise<EnrichmentResult> {
  const context: MovieContext = {
    title: movie.title_en,
    year: movie.release_year,
    synopsis: movie.synopsis || movie.synopsis_te,
    director: movie.director,
    hero: movie.hero,
    heroine: movie.heroine,
  };

  // Strategy 1: Try AI inference
  const aiGenres = await inferGenresWithAI(context);
  if (aiGenres && aiGenres.length > 0) {
    return {
      movieId: movie.id,
      title: movie.title_en,
      genres: aiGenres,
      source: 'ai',
      success: true,
    };
  }

  // Strategy 2: Try Wikipedia for classic films
  if (movie.release_year && movie.release_year < 2000) {
    const wikiGenres = await getGenresFromWikipedia(movie.title_en, movie.release_year);
    if (wikiGenres && wikiGenres.length > 0) {
      return {
        movieId: movie.id,
        title: movie.title_en,
        genres: wikiGenres,
        source: 'wikipedia',
        success: true,
      };
    }
  }

  // Strategy 3: Rule-based fallback
  const ruleGenres = inferGenresFromRules(context);
  return {
    movieId: movie.id,
    title: movie.title_en,
    genres: ruleGenres,
    source: 'rules',
    success: true,
  };
}

// ============================================================
// BATCH PROCESSING
// ============================================================

async function processBatch(movies: any[]): Promise<EnrichmentResult[]> {
  const results: EnrichmentResult[] = [];
  
  // Process in chunks for rate limiting
  for (let i = 0; i < movies.length; i += CONCURRENCY) {
    const batch = movies.slice(i, i + CONCURRENCY);
    
    const batchResults = await Promise.all(
      batch.map(movie => enrichMovie(movie))
    );
    
    results.push(...batchResults);
    
    // Progress update
    if (!VERBOSE && (i + CONCURRENCY) % 50 === 0) {
      const successCount = results.filter(r => r.success).length;
      console.log(`  Progress: ${Math.min(i + CONCURRENCY, movies.length)}/${movies.length} (${successCount} enriched)`);
    }
    
    // Rate limit delay
    await new Promise(r => setTimeout(r, 200));
  }
  
  return results;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           AI-POWERED GENRE ENRICHMENT                        ║
╚══════════════════════════════════════════════════════════════╝
`);

  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN' : '🔴 EXECUTE'}`);
  console.log(`Limit: ${LIMIT} movies`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  if (CLASSICS_ONLY) console.log(`Filter: Classics only (pre-1980)`);
  console.log('');

  // Fetch ALL movies missing genres - we filter in code since Supabase doesn't handle [] well
  // Fetch enough to find all movies missing genres
  let query = supabase
    .from('movies')
    .select('id, title_en, release_year, synopsis, synopsis_te, director, hero, heroine, genres')
    .eq('language', 'Telugu')
    .eq('is_published', true)
    .order('release_year', { ascending: true }); // OLDEST first - classics need genre inference

  if (CLASSICS_ONLY) {
    query = query.lt('release_year', 1980);
  }

  const { data: allMovies, error } = await query;
  
  // Filter to movies missing genres (null or empty array)
  const movies = allMovies?.filter(m => 
    !m.genres || (Array.isArray(m.genres) && m.genres.length === 0)
  ).slice(0, LIMIT);

  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }

  if (!movies || movies.length === 0) {
    console.log('✅ No movies need genre enrichment!');
    return;
  }

  console.log(`📋 Processing ${movies.length} movies...\n`);

  // Process all movies
  const results = await processBatch(movies);

  // Count by source
  const bySource = { ai: 0, wikipedia: 0, rules: 0 };
  results.forEach(r => {
    if (r.success) bySource[r.source]++;
  });

  // Apply updates if not dry run
  if (!DRY_RUN) {
    console.log('\n💾 Saving to database...');
    
    let savedCount = 0;
    for (const result of results) {
      if (result.success && result.genres.length > 0) {
        const { error } = await supabase
          .from('movies')
          .update({ genres: result.genres })
          .eq('id', result.movieId);
        
        if (!error) savedCount++;
        
        if (VERBOSE) {
          console.log(`  ${result.title} → [${result.genres.join(', ')}] (${result.source})`);
        }
      }
    }
    
    console.log(`  ✅ Updated ${savedCount} movies`);
  }

  // Summary
  console.log(`
═══════════════════════════════════════════════════════════════
📊 GENRE ENRICHMENT RESULTS
═══════════════════════════════════════════════════════════════

  Processed:     ${movies.length}
  Enriched:      ${results.filter(r => r.success).length}
  
  By Source:
    AI Inference:   ${bySource.ai}
    Wikipedia:      ${bySource.wikipedia}
    Rule-based:     ${bySource.rules}
`);

  // Show samples
  console.log('📋 Sample Results:');
  results.slice(0, 10).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.title} → [${r.genres.join(', ')}] (${r.source})`);
  });

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN - No changes saved. Use --execute to apply.');
  }

  console.log('\n✅ Genre enrichment complete!\n');
}

main().catch(console.error);

