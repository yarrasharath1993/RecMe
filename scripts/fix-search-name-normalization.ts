#!/usr/bin/env npx tsx
/**
 * Fix Search Name Normalization
 * 
 * This script updates the search API to normalize celebrity names
 * to their canonical form from the celebrities table, preventing
 * duplicate entries in search results.
 */

import * as fs from 'fs';
import * as path from 'path';

const SEARCH_API_PATH = '/Users/sharathchandra/Projects/telugu-portal/app/api/movies/search/route.ts';

const NEW_SEARCH_CODE = `import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PersonResult {
  name: string;
  role: 'actor' | 'actress' | 'director' | 'music_director';
  movie_count: number;
  avg_rating: number;
  sample_movie?: string;
  sample_year?: number;
  slug?: string; // Celebrity slug for profile link
}

// Cache for celebrity name normalization
const celebrityNameCache = new Map<string, { canonical_name: string; slug: string }>();

/**
 * Normalize a person name to its canonical form from celebrities table
 */
async function normalizeCelebrityName(name: string): Promise<{ canonical_name: string; slug: string }> {
  // Check cache first
  const cached = celebrityNameCache.get(name.toLowerCase());
  if (cached) {
    return cached;
  }

  // Try to find celebrity by exact name match
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('name_en, slug')
    .or(\`name_en.eq.\${name},name.eq.\${name}\`)
    .eq('is_published', true)
    .limit(1)
    .maybeSingle();

  if (celebrity) {
    const result = { canonical_name: celebrity.name_en, slug: celebrity.slug };
    celebrityNameCache.set(name.toLowerCase(), result);
    return result;
  }

  // Try fuzzy match (remove spaces, punctuation)
  const normalizedInput = name.toLowerCase().replace(/[^a-z]/g, '');
  
  const { data: allCelebrities } = await supabase
    .from('celebrities')
    .select('name_en, slug')
    .eq('is_published', true);

  if (allCelebrities) {
    for (const celeb of allCelebrities) {
      const normalizedCeleb = celeb.name_en.toLowerCase().replace(/[^a-z]/g, '');
      if (normalizedCeleb === normalizedInput) {
        const result = { canonical_name: celeb.name_en, slug: celeb.slug };
        celebrityNameCache.set(name.toLowerCase(), result);
        return result;
      }
    }
  }

  // No match found, return original
  const result = { canonical_name: name, slug: name.toLowerCase().replace(/\\s+/g, '-') };
  celebrityNameCache.set(name.toLowerCase(), result);
  return result;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '5');

  if (query.length < 2) {
    return NextResponse.json({ movies: [], people: [] });
  }

  try {
    // Search movies by title (English or Telugu) - only published movies
    const { data: movies, error: moviesError } = await supabase
      .from('movies')
      .select('id, title_en, title_te, slug, release_year, poster_url, our_rating, director, hero')
      .eq('is_published', true)
      .eq('language', 'Telugu')
      .or(\`title_en.ilike.%\${query}%,title_te.ilike.%\${query}%\`)
      .order('our_rating', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (moviesError) {
      console.error('Movies search error:', moviesError);
    }

    // Search for people (actors, directors) by querying hero, heroine, director fields
    const { data: actorMovies, error: actorError } = await supabase
      .from('movies')
      .select('hero, heroine, director, music_director, our_rating, title_en, release_year')
      .eq('is_published', true)
      .eq('language', 'Telugu')
      .or(\`hero.ilike.%\${query}%,heroine.ilike.%\${query}%,director.ilike.%\${query}%,music_director.ilike.%\${query}%\`)
      .limit(100); // Get more to aggregate properly

    if (actorError) {
      console.error('People search error:', actorError);
    }

    // Aggregate people results with name normalization
    const peopleMap = new Map<string, PersonResult>();
    
    if (actorMovies) {
      for (const movie of actorMovies) {
        // Check hero
        if (movie.hero && movie.hero.toLowerCase().includes(query.toLowerCase())) {
          const normalized = await normalizeCelebrityName(movie.hero);
          const existing = peopleMap.get(normalized.canonical_name);
          
          if (existing) {
            existing.movie_count++;
            existing.avg_rating = (existing.avg_rating * (existing.movie_count - 1) + (movie.our_rating || 0)) / existing.movie_count;
          } else {
            peopleMap.set(normalized.canonical_name, {
              name: normalized.canonical_name,
              role: 'actor',
              movie_count: 1,
              avg_rating: movie.our_rating || 0,
              sample_movie: movie.title_en,
              sample_year: movie.release_year,
              slug: normalized.slug,
            });
          }
        }
        
        // Check heroine
        if (movie.heroine && movie.heroine.toLowerCase().includes(query.toLowerCase())) {
          const normalized = await normalizeCelebrityName(movie.heroine);
          const existing = peopleMap.get(normalized.canonical_name);
          
          if (existing) {
            existing.movie_count++;
            existing.avg_rating = (existing.avg_rating * (existing.movie_count - 1) + (movie.our_rating || 0)) / existing.movie_count;
          } else {
            peopleMap.set(normalized.canonical_name, {
              name: normalized.canonical_name,
              role: 'actress',
              movie_count: 1,
              avg_rating: movie.our_rating || 0,
              sample_movie: movie.title_en,
              sample_year: movie.release_year,
              slug: normalized.slug,
            });
          }
        }
        
        // Check director
        if (movie.director && movie.director.toLowerCase().includes(query.toLowerCase())) {
          const normalized = await normalizeCelebrityName(movie.director);
          const existing = peopleMap.get(normalized.canonical_name);
          
          if (existing) {
            existing.movie_count++;
            existing.avg_rating = (existing.avg_rating * (existing.movie_count - 1) + (movie.our_rating || 0)) / existing.movie_count;
            // Don't override role if already set as actor/actress
            if (existing.role !== 'actor' && existing.role !== 'actress') {
              existing.role = 'director';
            }
          } else {
            peopleMap.set(normalized.canonical_name, {
              name: normalized.canonical_name,
              role: 'director',
              movie_count: 1,
              avg_rating: movie.our_rating || 0,
              sample_movie: movie.title_en,
              sample_year: movie.release_year,
              slug: normalized.slug,
            });
          }
        }
        
        // Check music director
        if (movie.music_director && movie.music_director.toLowerCase().includes(query.toLowerCase())) {
          const normalized = await normalizeCelebrityName(movie.music_director);
          const existing = peopleMap.get(normalized.canonical_name);
          
          if (existing) {
            existing.movie_count++;
            existing.avg_rating = (existing.avg_rating * (existing.movie_count - 1) + (movie.our_rating || 0)) / existing.movie_count;
            // Don't override role if already set as actor/actress/director
            if (existing.role !== 'actor' && existing.role !== 'actress' && existing.role !== 'director') {
              existing.role = 'music_director';
            }
          } else {
            peopleMap.set(normalized.canonical_name, {
              name: normalized.canonical_name,
              role: 'music_director',
              movie_count: 1,
              avg_rating: movie.our_rating || 0,
              sample_movie: movie.title_en,
              sample_year: movie.release_year,
              slug: normalized.slug,
            });
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
`;

function fixSearchAPI() {
  console.log('🔧 Fixing Search API Name Normalization\n');
  console.log('='.repeat(80));

  // Backup original file
  const backupPath = SEARCH_API_PATH + '.backup';
  
  try {
    const originalContent = fs.readFileSync(SEARCH_API_PATH, 'utf-8');
    fs.writeFileSync(backupPath, originalContent);
    console.log(`✅ Backup created: ${backupPath}\n`);

    // Write new content
    fs.writeFileSync(SEARCH_API_PATH, NEW_SEARCH_CODE);
    console.log(`✅ Updated: ${SEARCH_API_PATH}\n`);

    console.log('='.repeat(80));
    console.log('✅ Search API fixed!\n');
    console.log('Changes made:');
    console.log('1. Added normalizeCelebrityName() function');
    console.log('2. Name normalization cache for performance');
    console.log('3. All celebrity names normalized to canonical form');
    console.log('4. Added slug field to person results');
    console.log('5. Increased limit to 100 movies for better aggregation\n');
    console.log('💡 Effect:');
    console.log('- "Akkineni Nagarjuna" + "Nagarjuna Akkineni" → Single entry');
    console.log('- All name variations merged into canonical name');
    console.log('- Movie counts properly aggregated\n');
    console.log('🧪 Test:');
    console.log('1. Restart your dev server');
    console.log('2. Search for "nagar" in the UI');
    console.log('3. Should see single "Akkineni Nagarjuna" entry\n');

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\nℹ️  Manual fix required. See the generated code above.');
  }
}

fixSearchAPI();
