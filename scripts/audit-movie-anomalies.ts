/**
 * Comprehensive Movie Data Audit Script
 * 
 * Scans all movies and identifies anomalies for manual review.
 * Outputs results to CSV for easy review.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Anomaly {
  movie_id: string;
  title_en: string;
  title_te?: string;
  release_year?: number;
  slug?: string;
  anomaly_type: string;
  anomaly_description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  current_value?: any;
  expected_value?: any;
}

const anomalies: Anomaly[] = [];

// Helper to add anomaly
function addAnomaly(
  movie: any,
  type: string,
  description: string,
  severity: Anomaly['severity'],
  currentValue?: any,
  expectedValue?: any
) {
  anomalies.push({
    movie_id: movie.id,
    title_en: movie.title_en || movie.title || 'Unknown',
    title_te: movie.title_te,
    release_year: movie.release_year,
    slug: movie.slug,
    anomaly_type: type,
    anomaly_description: description,
    severity,
    current_value: currentValue,
    expected_value: expectedValue,
  });
}

async function auditMovies() {
  console.log('🔍 Starting comprehensive movie data audit...\n');

  // Fetch all movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('*')
    .order('release_year', { ascending: false });

  if (error) {
    console.error('❌ Error fetching movies:', error);
    process.exit(1);
  }

  console.log(`📊 Total movies in database: ${movies?.length || 0}\n`);

  if (!movies || movies.length === 0) {
    console.log('⚠️  No movies found in database.');
    return;
  }

  // Track duplicates and other patterns
  const titleYearMap = new Map<string, any[]>();
  const slugMap = new Map<string, any[]>();
  const heroMap = new Map<string, number>();
  const directorMap = new Map<string, number>();

  // 1. CRITICAL: Missing required fields
  console.log('🔴 Checking for missing required fields...');
  movies.forEach(movie => {
    if (!movie.title_en && !movie.title) {
      addAnomaly(movie, 'missing_title', 'Missing both title_en and title', 'critical');
    }
    if (!movie.slug) {
      addAnomaly(movie, 'missing_slug', 'Missing slug (required for URLs)', 'critical');
    }
    if (!movie.release_year) {
      addAnomaly(movie, 'missing_year', 'Missing release_year', 'critical');
    }
    if (movie.is_published === null || movie.is_published === undefined) {
      addAnomaly(movie, 'missing_published_status', 'Missing is_published flag', 'critical');
    }
  });

  // 2. CRITICAL: Duplicate detection
  console.log('🔴 Checking for duplicates...');
  movies.forEach(movie => {
    const title = (movie.title_en || movie.title || '').trim().toLowerCase();
    const year = movie.release_year;
    const key = `${title}::${year}`;
    
    if (!titleYearMap.has(key)) {
      titleYearMap.set(key, []);
    }
    titleYearMap.get(key)!.push(movie);

    // Check duplicate slugs
    if (movie.slug) {
      if (!slugMap.has(movie.slug)) {
        slugMap.set(movie.slug, []);
      }
      slugMap.get(movie.slug)!.push(movie);
    }
  });

  // Report duplicates
  titleYearMap.forEach((movieList, key) => {
    if (movieList.length > 1) {
      movieList.forEach(movie => {
        addAnomaly(
          movie,
          'duplicate_title_year',
          `Duplicate: ${movieList.length} movies with same title and year`,
          'critical',
          `${movie.title_en || movie.title} (${movie.release_year})`,
          `Found ${movieList.length} duplicates`
        );
      });
    }
  });

  slugMap.forEach((movieList, slug) => {
    if (movieList.length > 1) {
      movieList.forEach(movie => {
        addAnomaly(
          movie,
          'duplicate_slug',
          `Duplicate slug: ${movieList.length} movies share this slug`,
          'critical',
          movie.slug,
          `Found ${movieList.length} duplicates`
        );
      });
    }
  });

  // 3. HIGH: Invalid data formats
  console.log('🟠 Checking for invalid data formats...');
  movies.forEach(movie => {
    // Invalid year
    if (movie.release_year) {
      if (movie.release_year < 1900 || movie.release_year > new Date().getFullYear() + 5) {
        addAnomaly(
          movie,
          'invalid_year',
          `Year ${movie.release_year} is outside valid range (1900-${new Date().getFullYear() + 5})`,
          'high',
          movie.release_year,
          '1900-' + (new Date().getFullYear() + 5)
        );
      }
    }

    // Invalid ratings
    if (movie.our_rating !== null && movie.our_rating !== undefined) {
      if (movie.our_rating < 0 || movie.our_rating > 10) {
        addAnomaly(
          movie,
          'invalid_rating',
          `Rating ${movie.our_rating} is outside valid range (0-10)`,
          'high',
          movie.our_rating,
          '0-10'
        );
      }
    }

    if (movie.avg_rating !== null && movie.avg_rating !== undefined) {
      if (movie.avg_rating < 0 || movie.avg_rating > 10) {
        addAnomaly(
          movie,
          'invalid_avg_rating',
          `Average rating ${movie.avg_rating} is outside valid range (0-10)`,
          'high',
          movie.avg_rating,
          '0-10'
        );
      }
    }

    // Invalid genres (should be array)
    if (movie.genres && !Array.isArray(movie.genres)) {
      addAnomaly(
        movie,
        'invalid_genres',
        'Genres should be an array',
        'high',
        typeof movie.genres,
        'array'
      );
    }

    // Invalid special_categories (should be array if present)
    if (movie.special_categories && !Array.isArray(movie.special_categories)) {
      addAnomaly(
        movie,
        'invalid_special_categories',
        'special_categories should be an array',
        'high',
        typeof movie.special_categories,
        'array'
      );
    }
  });

  // 4. HIGH: Missing critical relationships
  console.log('🟠 Checking for missing relationships...');
  movies.forEach(movie => {
    if (!movie.hero && !movie.heroine && !movie.director) {
      addAnomaly(
        movie,
        'missing_all_credits',
        'Missing hero, heroine, and director (at least one should exist)',
        'high'
      );
    }
  });

  // 5. MEDIUM: Data quality issues
  console.log('🟡 Checking for data quality issues...');
  movies.forEach(movie => {
    // Missing poster for published movies
    if (movie.is_published && !movie.poster_url) {
      addAnomaly(
        movie,
        'missing_poster',
        'Published movie missing poster_url',
        'medium'
      );
    }

    // Missing language
    if (!movie.language) {
      addAnomaly(movie, 'missing_language', 'Missing language field', 'medium');
    }

    // Missing genres
    if (!movie.genres || (Array.isArray(movie.genres) && movie.genres.length === 0)) {
      addAnomaly(movie, 'missing_genres', 'Missing or empty genres array', 'medium');
    }

    // Missing synopsis for published movies
    if (movie.is_published && (!movie.synopsis || movie.synopsis.trim().length < 50)) {
      addAnomaly(
        movie,
        'missing_synopsis',
        'Published movie missing or has very short synopsis',
        'medium',
        movie.synopsis?.length || 0,
        '>= 50 characters'
      );
    }

    // Missing ratings
    if (movie.is_published && !movie.our_rating && !movie.avg_rating) {
      addAnomaly(
        movie,
        'missing_ratings',
        'Published movie missing both our_rating and avg_rating',
        'medium'
      );
    }

    // Unpublished but has all data
    if (!movie.is_published && movie.poster_url && movie.synopsis && movie.our_rating) {
      addAnomaly(
        movie,
        'unpublished_with_data',
        'Movie has all data but is not published',
        'low'
      );
    }
  });

  // 6. MEDIUM: Inconsistency checks
  console.log('🟡 Checking for inconsistencies...');
  movies.forEach(movie => {
    // Rating inconsistency
    if (movie.our_rating && movie.avg_rating) {
      const diff = Math.abs(movie.our_rating - movie.avg_rating);
      if (diff > 2.0) {
        addAnomaly(
          movie,
          'rating_inconsistency',
          `Large difference between our_rating (${movie.our_rating}) and avg_rating (${movie.avg_rating})`,
          'medium',
          `diff: ${diff.toFixed(2)}`,
          '< 2.0'
        );
      }
    }

    // Year vs release_date inconsistency
    if (movie.release_date && movie.release_year) {
      const dateYear = new Date(movie.release_date).getFullYear();
      if (dateYear !== movie.release_year) {
        addAnomaly(
          movie,
          'year_date_mismatch',
          `release_year (${movie.release_year}) doesn't match release_date year (${dateYear})`,
          'medium',
          `${movie.release_year} vs ${dateYear}`,
          'should match'
        );
      }
    }

    // Slug format check
    if (movie.slug) {
      const expectedSlug = `${(movie.title_en || movie.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${movie.release_year}`;
      if (movie.slug !== expectedSlug && !movie.slug.includes(expectedSlug.split('-').slice(0, -1).join('-'))) {
        // Allow some variation but flag if completely different
        if (!movie.slug.includes(String(movie.release_year))) {
          addAnomaly(
            movie,
            'slug_format_issue',
            `Slug format may be incorrect (doesn't include year)`,
            'low',
            movie.slug,
            `Expected format: title-year`
          );
        }
      }
    }
  });

  // 7. LOW: Statistical anomalies
  console.log('🟢 Checking for statistical anomalies...');
  
  // Count movies by year
  const yearCounts = new Map<number, number>();
  movies.forEach(movie => {
    if (movie.release_year) {
      yearCounts.set(movie.release_year, (yearCounts.get(movie.release_year) || 0) + 1);
    }
  });

  // Find years with unusually high/low counts
  const avgPerYear = movies.length / yearCounts.size;
  yearCounts.forEach((count, year) => {
    if (count > avgPerYear * 3) {
      movies.filter(m => m.release_year === year).forEach(movie => {
        addAnomaly(
          movie,
          'unusual_year_count',
          `Year ${year} has unusually high movie count (${count} vs avg ${avgPerYear.toFixed(1)})`,
          'low',
          count,
          `~${avgPerYear.toFixed(1)}`
        );
      });
    }
  });

  // 8. LOW: Empty or suspicious string fields
  console.log('🟢 Checking for empty/suspicious fields...');
  movies.forEach(movie => {
    // Suspiciously short titles
    if (movie.title_en && movie.title_en.trim().length < 3) {
      addAnomaly(
        movie,
        'suspicious_title',
        `Title is suspiciously short: "${movie.title_en}"`,
        'low',
        movie.title_en.length,
        '>= 3 characters'
      );
    }

    // Empty but not null fields that should have values
    if (movie.hero === '') {
      addAnomaly(movie, 'empty_hero', 'Hero field is empty string (should be null or have value)', 'low');
    }
    if (movie.director === '') {
      addAnomaly(movie, 'empty_director', 'Director field is empty string (should be null or have value)', 'low');
    }
  });

  // 9. Language-specific checks
  console.log('🟢 Checking language-specific issues...');
  const languageCounts = new Map<string, number>();
  movies.forEach(movie => {
    if (movie.language) {
      languageCounts.set(movie.language, (languageCounts.get(movie.language) || 0) + 1);
    }
  });

  // Check for movies that should be Telugu but aren't
  movies.forEach(movie => {
    const title = (movie.title_en || movie.title || '').toLowerCase();
    const teluguKeywords = ['telugu', 'telangana', 'andhra'];
    const hasTeluguKeyword = teluguKeywords.some(kw => title.includes(kw));
    
    if (hasTeluguKeyword && movie.language && movie.language !== 'Telugu') {
      addAnomaly(
        movie,
        'language_mismatch',
        `Title suggests Telugu but language is "${movie.language}"`,
        'medium',
        movie.language,
        'Telugu'
      );
    }
  });

  // 10. Special categories validation
  console.log('🟢 Checking special categories...');
  const validCategories = [
    'stress-buster',
    'popcorn',
    'group-watch',
    'watch-with-special-one',
    'weekend-binge',
    'family-night',
    'laugh-riot',
    'mind-benders',
    'cult-classics',
    'horror-night',
  ];

  movies.forEach(movie => {
    if (movie.special_categories && Array.isArray(movie.special_categories)) {
      movie.special_categories.forEach((cat: string) => {
        if (!validCategories.includes(cat)) {
          addAnomaly(
            movie,
            'invalid_special_category',
            `Invalid special category: "${cat}"`,
            'medium',
            cat,
            `One of: ${validCategories.join(', ')}`
          );
        }
      });
    }
  });

  // Generate report
  console.log('\n📋 Generating audit report...\n');

  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  anomalies.forEach(a => {
    severityCounts[a.severity]++;
  });

  console.log('📊 Anomaly Summary:');
  console.log(`   🔴 Critical: ${severityCounts.critical}`);
  console.log(`   🟠 High: ${severityCounts.high}`);
  console.log(`   🟡 Medium: ${severityCounts.medium}`);
  console.log(`   🟢 Low: ${severityCounts.low}`);
  console.log(`   📝 Total: ${anomalies.length}\n`);

  // Group by type
  const byType = new Map<string, Anomaly[]>();
  anomalies.forEach(a => {
    if (!byType.has(a.anomaly_type)) {
      byType.set(a.anomaly_type, []);
    }
    byType.get(a.anomaly_type)!.push(a);
  });

  console.log('📋 Anomalies by Type:');
  Array.from(byType.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([type, list]) => {
      console.log(`   ${type}: ${list.length}`);
    });

  // Write CSV
  const csvHeader = [
    'Movie ID',
    'Title (EN)',
    'Title (TE)',
    'Year',
    'Slug',
    'Anomaly Type',
    'Description',
    'Severity',
    'Current Value',
    'Expected Value',
  ].join(',');

  const csvRows = anomalies.map(a => [
    a.movie_id,
    `"${(a.title_en || '').replace(/"/g, '""')}"`,
    `"${(a.title_te || '').replace(/"/g, '""')}"`,
    a.release_year || '',
    a.slug || '',
    a.anomaly_type,
    `"${a.anomaly_description.replace(/"/g, '""')}"`,
    a.severity,
    a.current_value !== undefined ? `"${String(a.current_value).replace(/"/g, '""')}"` : '',
    a.expected_value !== undefined ? `"${String(a.expected_value).replace(/"/g, '""')}"` : '',
  ].join(','));

  const csvContent = [csvHeader, ...csvRows].join('\n');
  const outputPath = path.join(process.cwd(), 'MOVIE-AUDIT-ANOMALIES.csv');
  fs.writeFileSync(outputPath, csvContent, 'utf-8');

  console.log(`\n✅ Audit complete! Results saved to: ${outputPath}`);
  console.log(`\n📝 Total anomalies found: ${anomalies.length}`);
  console.log(`   Unique movies with anomalies: ${new Set(anomalies.map(a => a.movie_id)).size}`);
}

// Run audit
auditMovies()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Audit failed:', error);
    process.exit(1);
  });
