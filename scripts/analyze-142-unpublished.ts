import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Movie {
  id: string;
  title_en: string;
  release_year: number;
  hero: string | null;
  heroine: string | null;
  director: string | null;
  music_director: string | null;
  our_rating: number | null;
  poster_url: string | null;
  synopsis: string | null;
}

interface MissingData {
  hero: boolean;
  director: boolean;
  rating: boolean; // both our_rating and tmdb_rating
  poster: boolean;
  synopsis: boolean;
}

async function analyze142Movies() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ANALYZING 142 UNPUBLISHED TELUGU MOVIES');
  console.log('='.repeat(80) + '\n');

  // Fetch all unpublished Telugu movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, director, music_director, our_rating, poster_url, synopsis')
    .eq('is_published', false)
    .eq('language', 'Telugu')
    .order('release_year', { ascending: false });

  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }

  if (!movies || movies.length === 0) {
    console.log('✅ No unpublished Telugu movies found!');
    return;
  }

  console.log(`📊 Found ${movies.length} unpublished Telugu movies\n`);

  // Categorize by what's missing
  const categories = {
    excellent: [] as Movie[], // Has everything except maybe music_director
    good: [] as Movie[], // Has hero + director + (rating OR poster)
    needsHero: [] as Movie[], // Missing hero
    needsDirector: [] as Movie[], // Missing director (but has hero)
    needsRating: [] as Movie[], // Missing both ratings (but has hero + director)
    needsPoster: [] as Movie[], // Missing poster (but has hero + director)
    minimal: [] as Movie[], // Has very little data
  };

  const missingStats = {
    hero: 0,
    director: 0,
    rating: 0,
    poster: 0,
    synopsis: 0,
  };

  for (const movie of movies) {
    const missing: MissingData = {
      hero: !movie.hero,
      director: !movie.director,
      rating: !movie.our_rating,
      poster: !movie.poster_url,
      synopsis: !movie.synopsis || movie.synopsis.length < 50,
    };

    // Count missing data
    if (missing.hero) missingStats.hero++;
    if (missing.director) missingStats.director++;
    if (missing.rating) missingStats.rating++;
    if (missing.poster) missingStats.poster++;
    if (missing.synopsis) missingStats.synopsis++;

    // Categorize
    if (!missing.hero && !missing.director && !missing.rating && !missing.poster) {
      categories.excellent.push(movie);
    } else if (!missing.hero && !missing.director && (!missing.rating || !missing.poster)) {
      categories.good.push(movie);
    } else if (missing.hero) {
      categories.needsHero.push(movie);
    } else if (missing.director) {
      categories.needsDirector.push(movie);
    } else if (missing.rating) {
      categories.needsRating.push(movie);
    } else if (missing.poster) {
      categories.needsPoster.push(movie);
    } else {
      categories.minimal.push(movie);
    }
  }

  // Display analysis
  console.log('📊 CATEGORIZATION BY COMPLETENESS:');
  console.log('-'.repeat(80));
  console.log(`🌟 EXCELLENT (Hero + Director + Rating + Poster):  ${categories.excellent.length}`);
  console.log(`✅ GOOD (Hero + Director + Rating OR Poster):      ${categories.good.length}`);
  console.log(`👤 NEEDS HERO:                                      ${categories.needsHero.length}`);
  console.log(`🎬 NEEDS DIRECTOR (has hero):                       ${categories.needsDirector.length}`);
  console.log(`⭐ NEEDS RATING (has hero + director):              ${categories.needsRating.length}`);
  console.log(`🖼️  NEEDS POSTER (has hero + director):              ${categories.needsPoster.length}`);
  console.log(`📝 MINIMAL DATA:                                    ${categories.minimal.length}`);
  console.log('='.repeat(80));

  console.log('\n📊 MISSING DATA BREAKDOWN:');
  console.log('-'.repeat(80));
  console.log(`Missing Hero:      ${missingStats.hero} movies`);
  console.log(`Missing Director:  ${missingStats.director} movies`);
  console.log(`Missing Rating:    ${missingStats.rating} movies`);
  console.log(`Missing Poster:    ${missingStats.poster} movies`);
  console.log(`Missing Synopsis:  ${missingStats.synopsis} movies`);
  console.log('='.repeat(80));

  // Distribution by decade
  const byDecade: { [key: string]: Movie[] } = {};
  movies.forEach(movie => {
    const decade = Math.floor(movie.release_year / 10) * 10;
    const key = `${decade}s`;
    if (!byDecade[key]) byDecade[key] = [];
    byDecade[key].push(movie);
  });

  console.log('\n📊 DISTRIBUTION BY DECADE:');
  console.log('-'.repeat(80));
  Object.keys(byDecade).sort().reverse().forEach(decade => {
    console.log(`${decade}: ${byDecade[decade].length} movies`);
  });
  console.log('='.repeat(80));

  // Export to CSV files
  console.log('\n📁 EXPORTING TO CSV FILES...\n');

  // Export excellent movies (ready to publish with minor verification)
  exportToCsv('unpublished-142-EXCELLENT.csv', categories.excellent, 'Excellent Quality (Ready to Publish)');
  
  // Export good movies (need minor enrichment)
  exportToCsv('unpublished-142-GOOD.csv', categories.good, 'Good Quality (Minor Enrichment Needed)');
  
  // Export needs hero
  exportToCsv('unpublished-142-NEEDS-HERO.csv', categories.needsHero, 'Needs Hero Data');
  
  // Export needs director
  exportToCsv('unpublished-142-NEEDS-DIRECTOR.csv', categories.needsDirector, 'Needs Director Data');
  
  // Export needs rating
  exportToCsv('unpublished-142-NEEDS-RATING.csv', categories.needsRating, 'Needs Rating Data');
  
  // Export needs poster
  exportToCsv('unpublished-142-NEEDS-POSTER.csv', categories.needsPoster, 'Needs Poster');
  
  // Export minimal data
  exportToCsv('unpublished-142-MINIMAL.csv', categories.minimal, 'Minimal Data (Extensive Enrichment)');

  // Create master CSV
  exportToCsv('unpublished-142-MASTER.csv', movies, 'All 142 Unpublished Movies');

  console.log('\n' + '='.repeat(80));
  console.log('📊 ENRICHMENT PRIORITY RECOMMENDATION:');
  console.log('='.repeat(80));
  console.log(`\n1. 🌟 QUICK WINS (${categories.excellent.length} movies)`);
  console.log('   → Review and publish immediately (complete data)');
  console.log(`\n2. ✅ GOOD QUALITY (${categories.good.length} movies)`);
  console.log('   → Add missing poster OR rating');
  console.log(`\n3. 👤 NEEDS HERO (${categories.needsHero.length} movies)`);
  console.log('   → Critical: Add hero data');
  console.log(`\n4. 🎬 NEEDS DIRECTOR (${categories.needsDirector.length} movies)`);
  console.log('   → Add director data');
  console.log(`\n5. ⭐ NEEDS RATING (${categories.needsRating.length} movies)`);
  console.log('   → Add ratings (can use TMDB API)');
  console.log(`\n6. 🖼️  NEEDS POSTER (${categories.needsPoster.length} movies)`);
  console.log('   → Add posters (can use TMDB API)');
  console.log(`\n7. 📝 MINIMAL DATA (${categories.minimal.length} movies)`);
  console.log('   → Extensive research needed');
  console.log('='.repeat(80));

  // Summary stats
  const publishable = categories.excellent.length + categories.good.length;
  const needsEnrichment = movies.length - publishable;

  console.log('\n🎯 QUICK SUMMARY:');
  console.log('-'.repeat(80));
  console.log(`Publishable with quick review:    ${publishable} movies (${Math.round(publishable/movies.length*100)}%)`);
  console.log(`Needs enrichment:                  ${needsEnrichment} movies (${Math.round(needsEnrichment/movies.length*100)}%)`);
  console.log('='.repeat(80));

  console.log('\n✅ Analysis complete! Check CSV files for details.\n');

  return {
    categories,
    missingStats,
    byDecade,
  };
}

function exportToCsv(filename: string, movies: Movie[], description: string) {
  const csvHeader = 'ID,Title,Year,Hero,Director,Our Rating,Has Poster,Synopsis (first 100 chars),Missing Data\n';
  
  let csv = csvHeader;
  
  movies.forEach(m => {
    const missing = [];
    if (!m.hero) missing.push('HERO');
    if (!m.director) missing.push('DIRECTOR');
    if (!m.our_rating) missing.push('RATING');
    if (!m.poster_url) missing.push('POSTER');
    if (!m.synopsis || m.synopsis.length < 50) missing.push('SYNOPSIS');
    
    const synopsis = m.synopsis ? m.synopsis.substring(0, 100).replace(/"/g, '""') : '';
    
    csv += `${m.id},"${m.title_en}",${m.release_year},"${m.hero || ''}","${m.director || ''}",${m.our_rating || ''},${m.poster_url ? 'YES' : 'NO'},"${synopsis}","${missing.join(', ')}"\n`;
  });
  
  fs.writeFileSync(filename, csv);
  console.log(`✅ Exported: ${filename} (${movies.length} movies) - ${description}`);
}

analyze142Movies()
  .then(() => {
    console.log('✅ Analysis complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
