#!/usr/bin/env npx tsx
/**
 * Comprehensive Duplicate Audit for Movies and Celebrities
 * 
 * Detects:
 * 1. Movie duplicates (exact title+year, slug, TMDB ID, fuzzy matches)
 * 2. Celebrity duplicates (name variations, TMDB/IMDb ID matches)
 * 3. Generates CSV for manual review
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import {
  detectAllDuplicates,
  type MovieSummary,
  type ExactDuplicate,
  type FuzzyDuplicate,
} from './lib/validators/duplicate-detector';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DuplicateRecord {
  type: 'movie' | 'celebrity';
  category: string;
  id1: string;
  id2: string;
  slug1: string;
  slug2: string;
  name1: string;
  name2: string;
  year1?: number | null;
  year2?: number | null;
  match_type: string;
  confidence: number;
  reason: string;
  action: string;
  data_completeness1: string;
  data_completeness2: string;
}

const duplicateRecords: DuplicateRecord[] = [];

// Helper to calculate data completeness score
function calculateCompleteness(movie: any): string {
  let score = 0;
  let max = 0;
  
  if (movie.title_en) { score++; max++; }
  if (movie.title_te) { score++; max++; }
  if (movie.hero) { score++; max++; }
  if (movie.heroine) { score++; max++; }
  if (movie.director) { score++; max++; }
  if (movie.producer) { score++; max++; }
  if (movie.music_director) { score++; max++; }
  if (movie.tmdb_id) { score += 2; max += 2; }
  if (movie.imdb_id) { score += 2; max += 2; }
  if (movie.poster_url) { score++; max++; }
  if (movie.synopsis) { score++; max++; }
  
  const percentage = max > 0 ? Math.round((score / max) * 100) : 0;
  return `${percentage}%`;
}

// Helper to normalize names for comparison
function normalizeName(name: string | null | undefined): string {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Check for duplicate movies
async function auditMovieDuplicates() {
  console.log(chalk.yellow('\n🔍 Auditing Movie Duplicates...\n'));

  // Fetch all movies in batches
  let allMovies: any[] = [];
  let offset = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error } = await supabase
      .from('movies')
      .select('id, slug, title_en, title_te, release_year, tmdb_id, imdb_id, director, hero, heroine, producer, music_director, poster_url, synopsis')
      .order('release_year', { ascending: false })
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error(chalk.red('Error fetching movies:', error.message));
      break;
    }

    if (batch && batch.length > 0) {
      allMovies = allMovies.concat(batch);
      offset += batchSize;
      hasMore = batch.length === batchSize;
    } else {
      hasMore = false;
    }
  }

  const movies = allMovies;

  if (!movies || movies.length === 0) {
    console.error(chalk.red('Error: No movies fetched'));
    return;
  }

  console.log(chalk.gray(`Checking ${movies.length} movies for duplicates...\n`));

  // Additional check: Movies with very similar titles (transliteration variants)
  console.log(chalk.yellow('Checking for transliteration variants...'));
  const titleVariants = new Map<string, any[]>();
  for (const movie of movies) {
    if (movie.title_en) {
      // Normalize title (remove special chars, lowercase)
      const normalized = movie.title_en.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (normalized.length > 3) {
        if (!titleVariants.has(normalized)) {
          titleVariants.set(normalized, []);
        }
        titleVariants.get(normalized)!.push(movie);
      }
    }
  }

  for (const [normalizedTitle, movieList] of titleVariants) {
    if (movieList.length > 1) {
      // Group by year
      const byYear = new Map<number, any[]>();
      for (const m of movieList) {
        const year = m.release_year || 0;
        if (!byYear.has(year)) {
          byYear.set(year, []);
        }
        byYear.get(year)!.push(m);
      }

      for (const [year, yearMovies] of byYear) {
        if (yearMovies.length > 1) {
          for (let i = 0; i < yearMovies.length; i++) {
            for (let j = i + 1; j < yearMovies.length; j++) {
              const m1 = yearMovies[i];
              const m2 = yearMovies[j];
              // Check if not already in duplicate records
              const alreadyRecorded = duplicateRecords.some(r => 
                (r.id1 === m1.id && r.id2 === m2.id) || (r.id1 === m2.id && r.id2 === m1.id)
              );
              if (!alreadyRecorded) {
                duplicateRecords.push({
                  type: 'movie',
                  category: 'TITLE_VARIANT',
                  id1: m1.id,
                  id2: m2.id,
                  slug1: m1.slug || '',
                  slug2: m2.slug || '',
                  name1: m1.title_en || '',
                  name2: m2.title_en || '',
                  year1: m1.release_year,
                  year2: m2.release_year,
                  match_type: 'normalized_title_year',
                  confidence: 0.92,
                  reason: `Normalized title match: "${m1.title_en}" vs "${m2.title_en}" (${year})`,
                  action: 'MERGE_RECOMMENDED',
                  data_completeness1: calculateCompleteness(m1),
                  data_completeness2: calculateCompleteness(m2),
                });
              }
            }
          }
        }
      }
    }
  }
  console.log(chalk.green(`Found ${duplicateRecords.filter(r => r.category === 'TITLE_VARIANT').length} title variant duplicates\n`));

  // Convert to MovieSummary format
  const movieSummaries: MovieSummary[] = movies.map(m => ({
    id: m.id,
    title_en: m.title_en || '',
    title_te: m.title_te || null,
    release_year: m.release_year,
    slug: m.slug || '',
    tmdb_id: m.tmdb_id,
    imdb_id: m.imdb_id,
    director: m.director || null,
    hero: m.hero || null,
    heroine: m.heroine || null,
  }));

  // Use the duplicate detector with stricter fuzzy matching
  const result = detectAllDuplicates(movieSummaries, {
    includeFuzzyMatching: true,
    fuzzyOptions: {
      minSimilarity: 0.90, // Increased from 0.85 to reduce false positives
      maxYearDiff: 1, // Only match movies within 1 year
    },
  });

  console.log(chalk.green(`Found ${result.exactDuplicates.length} exact duplicates`));
  console.log(chalk.yellow(`Found ${result.fuzzyDuplicates.length} fuzzy duplicates\n`));

  // Process exact duplicates
  for (const dup of result.exactDuplicates) {
    const movie1 = movies.find(m => m.id === dup.movie1.id);
    const movie2 = movies.find(m => m.id === dup.movie2.id);

    if (movie1 && movie2) {
      duplicateRecords.push({
        type: 'movie',
        category: 'EXACT_DUPLICATE',
        id1: movie1.id,
        id2: movie2.id,
        slug1: movie1.slug || '',
        slug2: movie2.slug || '',
        name1: movie1.title_en || '',
        name2: movie2.title_en || '',
        year1: movie1.release_year,
        year2: movie2.release_year,
        match_type: dup.matchType,
        confidence: dup.confidence,
        reason: `Exact match: ${dup.matchType}`,
        action: dup.action === 'merge_recommended' ? 'MERGE_RECOMMENDED' : 'INVESTIGATE',
        data_completeness1: calculateCompleteness(movie1),
        data_completeness2: calculateCompleteness(movie2),
      });
    }
  }

  // Process fuzzy duplicates (high confidence only, with stricter filtering)
  for (const dup of result.fuzzyDuplicates) {
    // Only include high confidence matches with same or very close years
    if (dup.confidence >= 0.90 && Math.abs((dup.movie1.release_year || 0) - (dup.movie2.release_year || 0)) <= 1) {
      const movie1 = movies.find(m => m.id === dup.movie1.id);
      const movie2 = movies.find(m => m.id === dup.movie2.id);

      if (movie1 && movie2) {
        // Additional filter: titles should share significant words
        const title1Words = normalizeName(movie1.title_en).split(' ').filter(w => w.length > 3);
        const title2Words = normalizeName(movie2.title_en).split(' ').filter(w => w.length > 3);
        const commonWords = title1Words.filter(w => title2Words.includes(w));
        
        // Only include if they share at least one significant word (excluding common words like "the", "part", etc.)
        const excludeWords = ['the', 'part', 'and', 'of', 'a', 'an'];
        const significantCommon = commonWords.filter(w => !excludeWords.includes(w));
        
        if (significantCommon.length > 0 || dup.titleSimilarity >= 0.95) {
          duplicateRecords.push({
            type: 'movie',
            category: 'FUZZY_DUPLICATE',
            id1: movie1.id,
            id2: movie2.id,
            slug1: movie1.slug || '',
            slug2: movie2.slug || '',
            name1: movie1.title_en || '',
            name2: movie2.title_en || '',
            year1: movie1.release_year,
            year2: movie2.release_year,
            match_type: dup.matchType,
            confidence: dup.confidence,
            reason: dup.likelyReason,
            action: dup.requiresManualReview ? 'MANUAL_REVIEW' : 'MERGE_RECOMMENDED',
            data_completeness1: calculateCompleteness(movie1),
            data_completeness2: calculateCompleteness(movie2),
          });
        }
      }
    }
  }

  // Additional check: Same slug with different IDs (shouldn't happen but check anyway)
  const slugMap = new Map<string, any[]>();
  for (const movie of movies) {
    if (movie.slug) {
      if (!slugMap.has(movie.slug)) {
        slugMap.set(movie.slug, []);
      }
      slugMap.get(movie.slug)!.push(movie);
    }
  }

  for (const [slug, movieList] of slugMap) {
    if (movieList.length > 1) {
      for (let i = 0; i < movieList.length; i++) {
        for (let j = i + 1; j < movieList.length; j++) {
          const m1 = movieList[i];
          const m2 = movieList[j];
          duplicateRecords.push({
            type: 'movie',
            category: 'DUPLICATE_SLUG',
            id1: m1.id,
            id2: m2.id,
            slug1: m1.slug || '',
            slug2: m2.slug || '',
            name1: m1.title_en || '',
            name2: m2.title_en || '',
            year1: m1.release_year,
            year2: m2.release_year,
            match_type: 'same_slug',
            confidence: 1.0,
            reason: 'Multiple movies with same slug',
            action: 'MERGE_RECOMMENDED',
            data_completeness1: calculateCompleteness(m1),
            data_completeness2: calculateCompleteness(m2),
          });
        }
      }
    }
  }
}

// Check for duplicate celebrities
async function auditCelebrityDuplicates() {
  console.log(chalk.yellow('\n🔍 Auditing Celebrity Duplicates...\n'));

  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('id, name_en, name_te, slug, tmdb_id, imdb_id, is_published, entity_confidence_score, occupation, profile_image')
    .order('name_en');

  if (error || !celebrities) {
    console.error(chalk.red('Error fetching celebrities:', error?.message));
    return;
  }

  console.log(chalk.gray(`Checking ${celebrities.length} celebrities for duplicates...\n`));

  // Check by TMDB ID
  const tmdbMap = new Map<number, any[]>();
  for (const celeb of celebrities) {
    if (celeb.tmdb_id) {
      if (!tmdbMap.has(celeb.tmdb_id)) {
        tmdbMap.set(celeb.tmdb_id, []);
      }
      tmdbMap.get(celeb.tmdb_id)!.push(celeb);
    }
  }

  for (const [tmdbId, celebList] of tmdbMap) {
    if (celebList.length > 1) {
      for (let i = 0; i < celebList.length; i++) {
        for (let j = i + 1; j < celebList.length; j++) {
          const c1 = celebList[i];
          const c2 = celebList[j];
          duplicateRecords.push({
            type: 'celebrity',
            category: 'SAME_TMDB_ID',
            id1: c1.id,
            id2: c2.id,
            slug1: c1.slug || '',
            slug2: c2.slug || '',
            name1: c1.name_en || '',
            name2: c2.name_en || '',
            match_type: 'same_tmdb_id',
            confidence: 1.0,
            reason: `Same TMDB ID: ${tmdbId}`,
            action: 'MERGE_RECOMMENDED',
            data_completeness1: c1.is_published ? 'Published' : 'Unpublished',
            data_completeness2: c2.is_published ? 'Published' : 'Unpublished',
          });
        }
      }
    }
  }

  // Check by IMDb ID
  const imdbMap = new Map<string, any[]>();
  for (const celeb of celebrities) {
    if (celeb.imdb_id) {
      if (!imdbMap.has(celeb.imdb_id)) {
        imdbMap.set(celeb.imdb_id, []);
      }
      imdbMap.get(celeb.imdb_id)!.push(celeb);
    }
  }

  for (const [imdbId, celebList] of imdbMap) {
    if (celebList.length > 1) {
      for (let i = 0; i < celebList.length; i++) {
        for (let j = i + 1; j < celebList.length; j++) {
          const c1 = celebList[i];
          const c2 = celebList[j];
          duplicateRecords.push({
            type: 'celebrity',
            category: 'SAME_IMDB_ID',
            id1: c1.id,
            id2: c2.id,
            slug1: c1.slug || '',
            slug2: c2.slug || '',
            name1: c1.name_en || '',
            name2: c2.name_en || '',
            match_type: 'same_imdb_id',
            confidence: 1.0,
            reason: `Same IMDb ID: ${imdbId}`,
            action: 'MERGE_RECOMMENDED',
            data_completeness1: c1.is_published ? 'Published' : 'Unpublished',
            data_completeness2: c2.is_published ? 'Published' : 'Unpublished',
          });
        }
      }
    }
  }

  // Check by normalized name (fuzzy matching)
  const nameMap = new Map<string, any[]>();
  for (const celeb of celebrities) {
    const normalized = normalizeName(celeb.name_en);
    if (normalized) {
      if (!nameMap.has(normalized)) {
        nameMap.set(normalized, []);
      }
      nameMap.get(normalized)!.push(celeb);
    }
  }

  for (const [normalizedName, celebList] of nameMap) {
    if (celebList.length > 1) {
      for (let i = 0; i < celebList.length; i++) {
        for (let j = i + 1; j < celebList.length; j++) {
          const c1 = celebList[i];
          const c2 = celebList[j];
          // Only flag if names are very similar (account for minor variations)
          const name1 = normalizeName(c1.name_en);
          const name2 = normalizeName(c2.name_en);
          
          if (name1 === name2 || 
              name1.replace(/\s+/g, '') === name2.replace(/\s+/g, '') ||
              (name1.includes(name2) && name1.length - name2.length < 5) ||
              (name2.includes(name1) && name2.length - name1.length < 5)) {
            duplicateRecords.push({
              type: 'celebrity',
              category: 'SIMILAR_NAME',
              id1: c1.id,
              id2: c2.id,
              slug1: c1.slug || '',
              slug2: c2.slug || '',
              name1: c1.name_en || '',
              name2: c2.name_en || '',
              match_type: 'similar_name',
              confidence: 0.9,
              reason: `Similar names: "${c1.name_en}" vs "${c2.name_en}"`,
              action: 'MANUAL_REVIEW',
              data_completeness1: c1.is_published ? 'Published' : 'Unpublished',
              data_completeness2: c2.is_published ? 'Published' : 'Unpublished',
            });
          }
        }
      }
    }
  }

  // Check for name order variations (e.g., "Nagarjuna Akkineni" vs "Akkineni Nagarjuna")
  const nameVariations = new Map<string, any[]>();
  for (const celeb of celebrities) {
    const name = normalizeName(celeb.name_en);
    if (name && name.includes(' ')) {
      const parts = name.split(' ');
      if (parts.length === 2) {
        const reversed = `${parts[1]} ${parts[0]}`;
        const key = [name, reversed].sort().join('|');
        if (!nameVariations.has(key)) {
          nameVariations.set(key, []);
        }
        nameVariations.get(key)!.push(celeb);
      }
    }
  }

  for (const [key, celebList] of nameVariations) {
    if (celebList.length > 1) {
      for (let i = 0; i < celebList.length; i++) {
        for (let j = i + 1; j < celebList.length; j++) {
          const c1 = celebList[i];
          const c2 = celebList[j];
          const name1 = normalizeName(c1.name_en);
          const name2 = normalizeName(c2.name_en);
          const parts1 = name1.split(' ');
          const parts2 = name2.split(' ');
          
          if (parts1.length === 2 && parts2.length === 2 &&
              parts1[0] === parts2[1] && parts1[1] === parts2[0]) {
            duplicateRecords.push({
              type: 'celebrity',
              category: 'NAME_ORDER_VARIATION',
              id1: c1.id,
              id2: c2.id,
              slug1: c1.slug || '',
              slug2: c2.slug || '',
              name1: c1.name_en || '',
              name2: c2.name_en || '',
              match_type: 'name_order',
              confidence: 0.95,
              reason: `Name order variation: "${c1.name_en}" vs "${c2.name_en}"`,
              action: 'MERGE_RECOMMENDED',
              data_completeness1: c1.is_published ? 'Published' : 'Unpublished',
              data_completeness2: c2.is_published ? 'Published' : 'Unpublished',
            });
          }
        }
      }
    }
  }
}

// Check specific examples mentioned by user
async function checkSpecificExamples() {
  console.log(chalk.yellow('\n🔍 Checking Specific Examples...\n'));

  const examples = [
    { slug: 'thimmarusu-2021', title: 'Thimmarusu' },
    { slug: 'sagara-sangamam-1983', title: 'Sagara Sangamam' },
  ];

  for (const example of examples) {
    const { data: movies } = await supabase
      .from('movies')
      .select('id, slug, title_en, release_year, tmdb_id, imdb_id')
      .or(`slug.eq.${example.slug},title_en.ilike.%${example.title}%`);

    if (movies && movies.length > 1) {
      console.log(chalk.red(`⚠️  Found ${movies.length} entries for "${example.title}":`));
      movies.forEach(m => {
        console.log(`   - ${m.slug} (${m.release_year}) - ID: ${m.id}`);
      });
      
      // Check if any are duplicates (same year)
      const sameYearGroups = new Map<number, any[]>();
      for (const m of movies) {
        const year = m.release_year || 0;
        if (!sameYearGroups.has(year)) {
          sameYearGroups.set(year, []);
        }
        sameYearGroups.get(year)!.push(m);
      }
      
      for (const [year, yearMovies] of sameYearGroups) {
        if (yearMovies.length > 1) {
          console.log(chalk.yellow(`   ⚠️  ${yearMovies.length} entries with same year (${year}) - potential duplicates`));
          // Add to duplicate records
          for (let i = 0; i < yearMovies.length; i++) {
            for (let j = i + 1; j < yearMovies.length; j++) {
              const m1 = yearMovies[i];
              const m2 = yearMovies[j];
              duplicateRecords.push({
                type: 'movie',
                category: 'SAME_TITLE_YEAR',
                id1: m1.id,
                id2: m2.id,
                slug1: m1.slug || '',
                slug2: m2.slug || '',
                name1: m1.title_en || '',
                name2: m2.title_en || '',
                year1: m1.release_year,
                year2: m2.release_year,
                match_type: 'same_title_year',
                confidence: 0.95,
                reason: `Same title and year: "${m1.title_en}" (${year})`,
                action: 'MERGE_RECOMMENDED',
                data_completeness1: 'N/A',
                data_completeness2: 'N/A',
              });
            }
          }
        }
      }
      console.log();
    } else if (movies && movies.length === 1) {
      console.log(chalk.green(`✓ Single entry found for "${example.title}": ${movies[0].slug}`));
    } else {
      console.log(chalk.yellow(`? No entry found for "${example.title}"`));
    }
  }
}

async function generateCSV() {
  // Sort by type, then by confidence (high to low)
  duplicateRecords.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'movie' ? -1 : 1;
    }
    return b.confidence - a.confidence;
  });

  const csvHeader = 'type,category,id1,id2,slug1,slug2,name1,name2,year1,year2,match_type,confidence,reason,action,data_completeness1,data_completeness2\n';
  const csvRows = duplicateRecords.map(record => {
    return [
      record.type,
      record.category,
      record.id1,
      record.id2,
      record.slug1,
      record.slug2,
      `"${record.name1}"`,
      `"${record.name2}"`,
      record.year1 || '',
      record.year2 || '',
      record.match_type,
      record.confidence,
      `"${record.reason}"`,
      record.action,
      record.data_completeness1,
      record.data_completeness2,
    ].join(',');
  }).join('\n');

  const csv = csvHeader + csvRows;
  writeFileSync('DUPLICATES-AUDIT-RESULTS.csv', csv);

  console.log(chalk.bold('\n' + '═'.repeat(70)));
  console.log(chalk.bold('📊 AUDIT SUMMARY\n'));
  
  const movieDups = duplicateRecords.filter(r => r.type === 'movie');
  const celebDups = duplicateRecords.filter(r => r.type === 'celebrity');
  
  const byCategory = duplicateRecords.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`Total duplicates found: ${chalk.bold(duplicateRecords.length)}\n`);
  console.log('By type:');
  console.log(`  Movies: ${chalk.yellow(movieDups.length)}`);
  console.log(`  Celebrities: ${chalk.yellow(celebDups.length)}\n`);
  console.log('By category:');
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
  
  console.log(chalk.bold(`\n📄 Results saved to: DUPLICATES-AUDIT-RESULTS.csv\n`));
}

async function main() {
  console.log(chalk.bold('\n🔍 COMPREHENSIVE DUPLICATE AUDIT\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');

  await checkSpecificExamples();
  await auditMovieDuplicates();
  await auditCelebrityDuplicates();
  await generateCSV();
}

main().catch(console.error);
