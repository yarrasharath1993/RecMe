/**
 * Movies Search API - OPTIMIZED VERSION
 * 
 * Provides quick search functionality for the search bar autocomplete.
 * Searches movies by title (English and Telugu) and people (actors, directors).
 * 
 * PERFORMANCE IMPROVEMENTS:
 * - Pre-builds celebrity name mapping (1-2 queries instead of 400+)
 * - Handles multi-cast movies (splits "Krishna, Sobhan Babu")
 * - Uses in-memory Map for O(1) lookups
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PersonResult {
  name: string;
  role: 'actor' | 'director' | 'music_director';
  movie_count: number;
  avg_rating: number;
  sample_movie?: string;
  sample_year?: number;
  slug?: string;
}

/**
 * Normalize a name for fuzzy matching
 * Handles word order variations: "Akkineni Nagarjuna" = "Nagarjuna Akkineni"
 */
function normalizeNameForMatching(name: string): string {
  // Remove special chars, split into words, sort, rejoin
  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .sort();
  return words.join(' ');
}

/**
 * Build a fast lookup map for celebrity name normalization
 * Maps all name variations to their canonical name and slug
 */
async function buildCelebrityNameMap(searchQuery: string): Promise<Map<string, { canonical_name: string; slug: string }>> {
  const nameMap = new Map<string, { canonical_name: string; slug: string }>();

  // Fetch ALL published celebrities that might match the search query
  // This is just 1 query instead of 100+ individual queries!
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('name_en, slug')
    .eq('is_published', true)
    .order('name_en');

  if (celebrities) {
    for (const celeb of celebrities) {
      const canonicalData = { canonical_name: celeb.name_en, slug: celeb.slug };

      // Map exact name (case-insensitive)
      nameMap.set(celeb.name_en.toLowerCase().trim(), canonicalData);

      // Map normalized version (handles word order variations)
      // "Akkineni Nagarjuna" and "Nagarjuna Akkineni" both map to same key
      const normalized = normalizeNameForMatching(celeb.name_en);
      nameMap.set(normalized, canonicalData);

      // Also map with no spaces (for very fuzzy matches)
      const noSpaces = normalized.replace(/\s+/g, '');
      nameMap.set(noSpaces, canonicalData);
    }
  }

  return nameMap;
}

/**
 * Normalize a person name using the pre-built map
 * Also handles multi-cast names like "Krishna, Sobhan Babu"
 */
function normalizePersonName(
  name: string,
  nameMap: Map<string, { canonical_name: string; slug: string }>
): Array<{ canonical_name: string; slug: string }> {
  // Split on comma for multi-cast (e.g., "Krishna, Sobhan Babu" -> ["Krishna", "Sobhan Babu"])
  const names = name.split(',').map(n => n.trim()).filter(n => n.length > 0);

  const results: Array<{ canonical_name: string; slug: string }> = [];

  for (const singleName of names) {
    // Try exact match first (case-insensitive)
    const exactMatch = nameMap.get(singleName.toLowerCase().trim());
    if (exactMatch) {
      results.push(exactMatch);
      continue;
    }

    // Try fuzzy match (handles word order variations)
    // "Akkineni Nagarjuna" and "Nagarjuna Akkineni" both normalize to "akkineni nagarjuna"
    const fuzzyKey = normalizeNameForMatching(singleName);
    const fuzzyMatch = nameMap.get(fuzzyKey);
    if (fuzzyMatch) {
      results.push(fuzzyMatch);
      continue;
    }

    // Try no-spaces match (very fuzzy)
    const noSpacesKey = fuzzyKey.replace(/\s+/g, '');
    const noSpacesMatch = nameMap.get(noSpacesKey);
    if (noSpacesMatch) {
      results.push(noSpacesMatch);
      continue;
    }

    // NEW: Try partial word match - handles "Nagarjuna" matching "Akkineni Nagarjuna"
    // This prevents duplicate entries in search results
    const nameWords = singleName.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    let partialMatch: { canonical_name: string; slug: string } | undefined;

    // Only do partial matching for names with significant length (avoid false positives like "Kumar")
    if (nameWords.length > 0 && nameWords.some(w => w.length >= 6)) {
      // Iterate through all celebrities in the map
      for (const [mapKey, celebrity] of nameMap.entries()) {
        const celebrityWords = celebrity.canonical_name.toLowerCase().split(/\s+/);

        // Check if ALL words from singleName appear in celebrity name
        const allWordsMatch = nameWords.every(word =>
          celebrityWords.some(celWord => celWord.includes(word) || word.includes(celWord))
        );

        if (allWordsMatch) {
          partialMatch = celebrity;
          break; // Found match, stop searching
        }
      }
    }

    if (partialMatch) {
      results.push(partialMatch);
      continue;
    }

    // No match found - use original name with generated slug
    results.push({
      canonical_name: singleName,
      slug: singleName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    });
  }

  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '5');

  if (query.length < 2) {
    return NextResponse.json({ movies: [], people: [] });
  }

  try {
    // ============================================================
    // 1. Search Movies by Title
    // ============================================================
    const { data: movies, error: moviesError } = await supabase
      .from('movies')
      .select('id, title_en, title_te, slug, release_year, poster_url, our_rating, director, hero, heroes, heroines')
      .eq('is_published', true)
      .eq('language', 'Telugu')
      .or(`title_en.ilike.%${query}%,title_te.ilike.%${query}%`)
      .order('our_rating', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (moviesError) {
      console.error('Movies search error:', moviesError);
    }

    // ============================================================
    // 2. Build Celebrity Name Map (1 query for ALL celebrities)
    // ============================================================
    const celebrityNameMap = await buildCelebrityNameMap(query);

    // ============================================================
    // 3. Search for People
    // ============================================================
    const { data: actorMovies, error: actorError } = await supabase
      .from('movies')
      .select('hero, heroine, heroes, heroines, director, music_director, our_rating, title_en, release_year')
      .eq('is_published', true)
      .eq('language', 'Telugu')
      .or(`hero.ilike.%${query}%,heroine.ilike.%${query}%,director.ilike.%${query}%,music_director.ilike.%${query}%`)
      .limit(200); // Get more to properly aggregate

    if (actorError) {
      console.error('People search error:', actorError);
    }

    // ============================================================
    // 4. Aggregate People Results with Name Normalization
    // ============================================================
    const peopleMap = new Map<string, PersonResult>();

    if (actorMovies) {
      for (const movie of actorMovies) {
        // Process hero field
        if (movie.hero && movie.hero.toLowerCase().includes(query.toLowerCase())) {
          const normalizedPeople = normalizePersonName(movie.hero, celebrityNameMap);

          for (const person of normalizedPeople) {
            // Only include if this specific person matches the query
            if (!person.canonical_name.toLowerCase().includes(query.toLowerCase())) {
              continue;
            }

            const existing = peopleMap.get(person.canonical_name);
            if (existing) {
              existing.movie_count++;
              existing.avg_rating = (existing.avg_rating * (existing.movie_count - 1) + (movie.our_rating || 0)) / existing.movie_count;
            } else {
              peopleMap.set(person.canonical_name, {
                name: person.canonical_name,
                role: 'actor',
                movie_count: 1,
                avg_rating: movie.our_rating || 0,
                sample_movie: movie.title_en,
                sample_year: movie.release_year,
                slug: person.slug,
              });
            }
          }
        }

        // Process heroine field
        if (movie.heroine && movie.heroine.toLowerCase().includes(query.toLowerCase())) {
          const normalizedPeople = normalizePersonName(movie.heroine, celebrityNameMap);

          for (const person of normalizedPeople) {
            if (!person.canonical_name.toLowerCase().includes(query.toLowerCase())) {
              continue;
            }

            const existing = peopleMap.get(person.canonical_name);
            if (existing) {
              existing.movie_count++;
              existing.avg_rating = (existing.avg_rating * (existing.movie_count - 1) + (movie.our_rating || 0)) / existing.movie_count;
            } else {
              peopleMap.set(person.canonical_name, {
                name: person.canonical_name,
                role: 'actor',
                movie_count: 1,
                avg_rating: movie.our_rating || 0,
                sample_movie: movie.title_en,
                sample_year: movie.release_year,
                slug: person.slug,
              });
            }
          }
        }

        // Process director field
        if (movie.director && movie.director.toLowerCase().includes(query.toLowerCase())) {
          const normalizedPeople = normalizePersonName(movie.director, celebrityNameMap);

          for (const person of normalizedPeople) {
            if (!person.canonical_name.toLowerCase().includes(query.toLowerCase())) {
              continue;
            }

            const existing = peopleMap.get(person.canonical_name);
            if (existing) {
              existing.movie_count++;
              existing.avg_rating = (existing.avg_rating * (existing.movie_count - 1) + (movie.our_rating || 0)) / existing.movie_count;
              // Keep actor role if already set (some people are both)
              if (existing.role !== 'actor') {
                existing.role = 'director';
              }
            } else {
              peopleMap.set(person.canonical_name, {
                name: person.canonical_name,
                role: 'director',
                movie_count: 1,
                avg_rating: movie.our_rating || 0,
                sample_movie: movie.title_en,
                sample_year: movie.release_year,
                slug: person.slug,
              });
            }
          }
        }

        // Process music director field
        if (movie.music_director && movie.music_director.toLowerCase().includes(query.toLowerCase())) {
          const normalizedPeople = normalizePersonName(movie.music_director, celebrityNameMap);

          for (const person of normalizedPeople) {
            if (!person.canonical_name.toLowerCase().includes(query.toLowerCase())) {
              continue;
            }

            const existing = peopleMap.get(person.canonical_name);
            if (existing) {
              existing.movie_count++;
              existing.avg_rating = (existing.avg_rating * (existing.movie_count - 1) + (movie.our_rating || 0)) / existing.movie_count;
              // Keep actor/director role if already set
              if (existing.role !== 'actor' && existing.role !== 'director') {
                existing.role = 'music_director';
              }
            } else {
              peopleMap.set(person.canonical_name, {
                name: person.canonical_name,
                role: 'music_director',
                movie_count: 1,
                avg_rating: movie.our_rating || 0,
                sample_movie: movie.title_en,
                sample_year: movie.release_year,
                slug: person.slug,
              });
            }
          }
        }
      }
    }

    // Convert to array and sort by movie count
    const people = Array.from(peopleMap.values())
      .sort((a, b) => b.movie_count - a.movie_count)
      .slice(0, limit);

    return NextResponse.json({
      movies: movies || [],
      people: people || [],
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ movies: [], people: [], error: String(error) }, { status: 500 });
  }
}
