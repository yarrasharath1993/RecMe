/**
 * Export Missing Ratings List
 * 
 * Generates a clean list of movies with missing ratings for manual review.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function exportMissingRatingsList() {
  console.log('📋 Fetching movies with missing ratings...\n');

  // Fetch all published movies missing both ratings
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, is_published, our_rating, avg_rating')
    .eq('is_published', true)
    .is('our_rating', null)
    .is('avg_rating', null)
    .order('release_year', { ascending: false })
    .order('title_en', { ascending: true });

  if (error) {
    console.error('❌ Error fetching movies:', error);
    process.exit(1);
  }

  if (!movies || movies.length === 0) {
    console.log('✅ No movies with missing ratings found.');
    return;
  }

  console.log(`Found ${movies.length} published movies with missing ratings\n`);

  // Group by year
  const byYear = new Map<number | null, typeof movies>();
  movies.forEach(movie => {
    const year = movie.release_year;
    if (!byYear.has(year)) {
      byYear.set(year, []);
    }
    byYear.get(year)!.push(movie);
  });

  // Generate CSV
  const csvHeader = 'Movie Title,Release Year,Status';
  const currentYear = new Date().getFullYear();
  const csvRows = movies.map(movie => {
    const year = movie.release_year || 'TBA';
    const isUnreleased = movie.release_year && movie.release_year > currentYear;
    const status = isUnreleased ? 'Unreleased (No Rating Needed)' : 'Released - Needs Rating';
    return `"${(movie.title_en || 'Unknown').replace(/"/g, '""')}",${year},"${status}"`;
  });

  const csvContent = [csvHeader, ...csvRows].join('\n');
  const csvPath = path.join(process.cwd(), 'MISSING-RATINGS-REVIEW.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf-8');

  // Generate summary by year
  console.log('📊 Summary by Year:');
  console.log('─'.repeat(50));
  
  const sortedYears = Array.from(byYear.keys()).sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return b - a;
  });

  sortedYears.forEach(year => {
    const yearMovies = byYear.get(year)!;
    const unreleased = yearMovies.filter(m => m.release_year && m.release_year > currentYear).length;
    const released = yearMovies.length - unreleased;
    
    const yearLabel = year === null ? 'No Year' : year.toString();
    console.log(`${yearLabel}: ${yearMovies.length} movies (${released} released, ${unreleased} unreleased)`);
  });

  console.log('\n📝 Detailed list saved to: MISSING-RATINGS-REVIEW.csv');
  console.log(`\n✅ Total: ${movies.length} movies`);
  console.log(`   Released (need rating): ${movies.filter(m => m.release_year && m.release_year <= currentYear).length}`);
  console.log(`   Unreleased (no rating needed): ${movies.filter(m => m.release_year && m.release_year > currentYear).length}`);
  console.log(`   No year: ${movies.filter(m => !m.release_year).length}`);
}

// Run export
exportMissingRatingsList()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  });
