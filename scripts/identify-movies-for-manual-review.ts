import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ReviewItem {
  movieId: string;
  title: string;
  year: number | null;
  slug: string;
  category: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  currentValue: string | null;
  suggestedAction: string;
}

async function identifyMoviesForManualReview() {
  console.log('🔍 Identifying movies that need manual review...\n');

  const reviewItems: ReviewItem[] = [];
  const currentYear = new Date().getFullYear();

  // 1. Missing or very short synopsis
  console.log('📋 Checking for missing/short synopsis...');
  const { data: synopsisIssues } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug, synopsis_en')
    .eq('is_published', true)
    .or('synopsis_en.is.null,synopsis_en.eq.,synopsis_en.lt.100');

  if (synopsisIssues) {
    synopsisIssues.forEach(movie => {
      const synopsisLength = (movie.synopsis_en || '').length;
      if (!movie.synopsis_en || synopsisLength < 100) {
        reviewItems.push({
          movieId: movie.id,
          title: movie.title_en || 'Unknown',
          year: movie.release_year,
          slug: movie.slug || '',
          category: 'Missing/Short Synopsis',
          issue: synopsisLength === 0 ? 'Missing synopsis' : `Synopsis too short (${synopsisLength} chars, need 100+)`,
          severity: 'high',
          currentValue: movie.synopsis_en || null,
          suggestedAction: 'Add or expand synopsis to at least 100 characters',
        });
      }
    });
  }
  console.log(`   Found ${synopsisIssues?.length || 0} movies with synopsis issues\n`);

  // 2. Missing ratings for released movies
  console.log('📋 Checking for missing ratings on released movies...');
  const { data: ratingIssues } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug, our_rating, avg_rating, release_date')
    .eq('is_published', true)
    .or('our_rating.is.null,avg_rating.is.null')
    .not('release_year', 'is', null);

  if (ratingIssues) {
    ratingIssues.forEach(movie => {
      const isUnreleased = 
        (movie.release_year && movie.release_year > currentYear) ||
        (movie.release_date && new Date(movie.release_date) > new Date()) ||
        (movie.slug && movie.slug.endsWith('-tba'));

      if (!isUnreleased && !movie.our_rating && !movie.avg_rating) {
        reviewItems.push({
          movieId: movie.id,
          title: movie.title_en || 'Unknown',
          year: movie.release_year,
          slug: movie.slug || '',
          category: 'Missing Ratings',
          issue: 'Released movie missing both our_rating and avg_rating',
          severity: 'high',
          currentValue: `our_rating: ${movie.our_rating}, avg_rating: ${movie.avg_rating}`,
          suggestedAction: 'Add rating from IMDB/TMDB or editorial review',
        });
      }
    });
  }
  console.log(`   Found ${ratingIssues?.filter(m => {
    const isUnreleased = (m.release_year && m.release_year > currentYear) || 
                         (m.release_date && new Date(m.release_date) > new Date()) ||
                         (m.slug && m.slug.endsWith('-tba'));
    return !isUnreleased && !m.our_rating && !m.avg_rating;
  }).length || 0} released movies with missing ratings\n`);

  // 3. Suspicious titles (very short, numbers only, etc.)
  console.log('📋 Checking for suspicious titles...');
  const { data: titleIssues } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug')
    .eq('is_published', true)
    .not('title_en', 'is', null);

  if (titleIssues) {
    titleIssues.forEach(movie => {
      const title = (movie.title_en || '').trim();
      if (title.length <= 2 || /^\d+$/.test(title) || /^[A-Z]$/.test(title)) {
        reviewItems.push({
          movieId: movie.id,
          title: movie.title_en || 'Unknown',
          year: movie.release_year,
          slug: movie.slug || '',
          category: 'Suspicious Title',
          issue: `Title is very short or unusual: "${title}"`,
          severity: 'medium',
          currentValue: title,
          suggestedAction: 'Verify title is correct (may be legitimate like "F1", "83", "Ui")',
        });
      }
    });
  }
  console.log(`   Found ${titleIssues?.filter(m => {
    const title = (m.title_en || '').trim();
    return title.length <= 2 || /^\d+$/.test(title) || /^[A-Z]$/.test(title);
  }).length || 0} movies with suspicious titles\n`);

  // 4. Missing release year
  console.log('📋 Checking for missing release year...');
  const { data: yearIssues } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug, release_date')
    .eq('is_published', true)
    .is('release_year', null);

  if (yearIssues) {
    yearIssues.forEach(movie => {
      reviewItems.push({
        movieId: movie.id,
        title: movie.title_en || 'Unknown',
        year: null,
        slug: movie.slug || '',
        category: 'Missing Release Year',
        issue: 'Missing release_year (critical for sorting and filtering)',
        severity: 'high',
        currentValue: movie.release_date || null,
        suggestedAction: 'Add release_year (can extract from release_date if available)',
      });
    });
  }
  console.log(`   Found ${yearIssues?.length || 0} movies with missing release year\n`);

  // 5. Year/Date mismatch
  console.log('📋 Checking for year/date mismatches...');
  const { data: dateIssues } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug, release_date')
    .eq('is_published', true)
    .not('release_year', 'is', null)
    .not('release_date', 'is', null);

  if (dateIssues) {
    dateIssues.forEach(movie => {
      if (movie.release_date && movie.release_year) {
        const dateYear = new Date(movie.release_date).getFullYear();
        if (dateYear !== movie.release_year) {
          reviewItems.push({
            movieId: movie.id,
            title: movie.title_en || 'Unknown',
            year: movie.release_year,
            slug: movie.slug || '',
            category: 'Year/Date Mismatch',
            issue: `release_year (${movie.release_year}) doesn't match release_date year (${dateYear})`,
            severity: 'medium',
            currentValue: `release_year: ${movie.release_year}, release_date: ${movie.release_date}`,
            suggestedAction: 'Align release_year with release_date year',
          });
        }
      }
    });
  }
  console.log(`   Found ${dateIssues?.filter(m => {
    if (m.release_date && m.release_year) {
      const dateYear = new Date(m.release_date).getFullYear();
      return dateYear !== m.release_year;
    }
    return false;
  }).length || 0} movies with year/date mismatches\n`);

  // 6. Slug format issues
  console.log('📋 Checking for slug format issues...');
  const { data: slugIssues } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug')
    .eq('is_published', true)
    .not('release_year', 'is', null);

  if (slugIssues) {
    slugIssues.forEach(movie => {
      const slug = movie.slug || '';
      const year = movie.release_year;
      const isUnreleased = year && year > currentYear;
      
      // Unreleased movies should have -tba suffix
      if (isUnreleased && !slug.endsWith('-tba')) {
        reviewItems.push({
          movieId: movie.id,
          title: movie.title_en || 'Unknown',
          year: movie.release_year,
          slug: slug,
          category: 'Slug Format Issue',
          issue: `Unreleased movie (${year}) should have -tba suffix`,
          severity: 'medium',
          currentValue: slug,
          suggestedAction: `Update slug to end with -tba: ${slug}-tba`,
        });
      }
      
      // Released movies should have year in slug
      if (!isUnreleased && year && !slug.includes(String(year))) {
        reviewItems.push({
          movieId: movie.id,
          title: movie.title_en || 'Unknown',
          year: movie.release_year,
          slug: slug,
          category: 'Slug Format Issue',
          issue: `Released movie (${year}) should have year in slug`,
          severity: 'low',
          currentValue: slug,
          suggestedAction: `Consider adding year to slug: ${slug}-${year}`,
        });
      }
    });
  }
  console.log(`   Found ${slugIssues?.filter(m => {
    const slug = m.slug || '';
    const year = m.release_year;
    const isUnreleased = year && year > currentYear;
    return (isUnreleased && !slug.endsWith('-tba')) || (!isUnreleased && year && !slug.includes(String(year)));
  }).length || 0} movies with slug format issues\n`);

  // 7. Missing poster URLs
  console.log('📋 Checking for missing poster URLs...');
  const { data: posterIssues } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug, poster_url')
    .eq('is_published', true)
    .is('poster_url', null);

  if (posterIssues) {
    posterIssues.forEach(movie => {
      reviewItems.push({
        movieId: movie.id,
        title: movie.title_en || 'Unknown',
        year: movie.release_year,
        slug: movie.slug || '',
        category: 'Missing Poster',
        issue: 'Missing poster_url (will show placeholder)',
        severity: 'low',
        currentValue: null,
        suggestedAction: 'Add poster URL from TMDB or other source',
      });
    });
  }
  console.log(`   Found ${posterIssues?.length || 0} movies with missing posters\n`);

  // 8. Missing hero/heroine
  console.log('📋 Checking for missing hero/heroine...');
  const { data: castIssues } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug, hero, heroine')
    .eq('is_published', true)
    .is('hero', null)
    .is('heroine', null);

  if (castIssues) {
    castIssues.forEach(movie => {
      reviewItems.push({
        movieId: movie.id,
        title: movie.title_en || 'Unknown',
        year: movie.release_year,
        slug: movie.slug || '',
        category: 'Missing Cast',
        issue: 'Missing both hero and heroine (may be ensemble or documentary)',
        severity: 'medium',
        currentValue: `hero: ${movie.hero || 'null'}, heroine: ${movie.heroine || 'null'}`,
        suggestedAction: 'Add hero/heroine if applicable, or verify if ensemble/documentary',
      });
    });
  }
  console.log(`   Found ${castIssues?.length || 0} movies with missing hero/heroine\n`);

  // 9. Missing director
  console.log('📋 Checking for missing director...');
  const { data: directorIssues } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug, director')
    .eq('is_published', true)
    .is('director', null);

  if (directorIssues) {
    directorIssues.forEach(movie => {
      reviewItems.push({
        movieId: movie.id,
        title: movie.title_en || 'Unknown',
        year: movie.release_year,
        slug: movie.slug || '',
        category: 'Missing Director',
        issue: 'Missing director information',
        severity: 'medium',
        currentValue: null,
        suggestedAction: 'Add director name',
      });
    });
  }
  console.log(`   Found ${directorIssues?.length || 0} movies with missing director\n`);

  // 10. Movies with ratings but marked as unreleased
  console.log('📋 Checking for unreleased movies with ratings...');
  const { data: unreleasedWithRatings } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug, our_rating, avg_rating, release_date')
    .eq('is_published', true)
    .not('release_year', 'is', null)
    .or('our_rating.not.is.null,avg_rating.not.is.null');

  if (unreleasedWithRatings) {
    unreleasedWithRatings.forEach(movie => {
      const isUnreleased = 
        (movie.release_year && movie.release_year > currentYear) ||
        (movie.release_date && new Date(movie.release_date) > new Date()) ||
        (movie.slug && movie.slug.endsWith('-tba'));

      if (isUnreleased && (movie.our_rating || movie.avg_rating)) {
        reviewItems.push({
          movieId: movie.id,
          title: movie.title_en || 'Unknown',
          year: movie.release_year,
          slug: movie.slug || '',
          category: 'Unreleased with Rating',
          issue: 'Unreleased movie has rating (should be removed)',
          severity: 'high',
          currentValue: `our_rating: ${movie.our_rating}, avg_rating: ${movie.avg_rating}`,
          suggestedAction: 'Remove ratings from unreleased movie',
        });
      }
    });
  }
  console.log(`   Found ${unreleasedWithRatings?.filter(m => {
    const isUnreleased = (m.release_year && m.release_year > currentYear) || 
                         (m.release_date && new Date(m.release_date) > new Date()) ||
                         (m.slug && m.slug.endsWith('-tba'));
    return isUnreleased && (m.our_rating || m.avg_rating);
  }).length || 0} unreleased movies with ratings\n`);

  // Sort by severity and category
  reviewItems.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return a.category.localeCompare(b.category);
  });

  // Generate CSV report
  const csvHeader = 'Movie ID,Title,Year,Slug,Category,Issue,Severity,Current Value,Suggested Action';
  const csvRows = reviewItems.map(item => {
    const escape = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
    return [
      item.movieId,
      escape(item.title),
      item.year || '',
      escape(item.slug),
      escape(item.category),
      escape(item.issue),
      item.severity,
      escape(item.currentValue),
      escape(item.suggestedAction),
    ].join(',');
  });

  const csvPath = path.join(process.cwd(), 'MOVIES-FOR-MANUAL-REVIEW.csv');
  fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'), 'utf-8');

  // Generate summary by category
  const byCategory = new Map<string, { high: number; medium: number; low: number }>();
  reviewItems.forEach(item => {
    if (!byCategory.has(item.category)) {
      byCategory.set(item.category, { high: 0, medium: 0, low: 0 });
    }
    const counts = byCategory.get(item.category)!;
    counts[item.severity]++;
  });

  console.log('\n📊 Summary by Category:\n');
  const sortedCategories = Array.from(byCategory.entries()).sort((a, b) => {
    const totalA = a[1].high + a[1].medium + a[1].low;
    const totalB = b[1].high + b[1].medium + b[1].low;
    return totalB - totalA;
  });

  sortedCategories.forEach(([category, counts]) => {
    const total = counts.high + counts.medium + counts.low;
    console.log(`   ${category}:`);
    console.log(`      Total: ${total} (High: ${counts.high}, Medium: ${counts.medium}, Low: ${counts.low})`);
  });

  console.log(`\n📝 Detailed report saved to: ${csvPath}\n`);
  console.log(`✨ Found ${reviewItems.length} movies needing manual review!\n`);
}

identifyMoviesForManualReview().catch(console.error);
