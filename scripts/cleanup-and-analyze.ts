/**
 * Cleanup Invalid Entries & Generate Analysis Report
 * 
 * 1. Identifies and removes person names incorrectly indexed as movies
 * 2. Identifies and removes duplicates
 * 3. Generates comprehensive category analysis
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Known person names that are NOT movies (director names, actor names etc.)
const KNOWN_PERSON_PATTERNS = [
  // Director name patterns (name-year format with no movie title)
  /^[a-z]+-[a-z]+-\d{4}$/, // "venky-atluri-2024"
  /^[a-z]+-\d{4}$/, // "parasuram-2024"
  
  // Common Telugu director/actor first names followed by year
  'ravi-basara', 'anil-katz', 'nagesh-naradasi', 'rajesh-nellore',
  'srinivas-mahath', 'venky-atluri', 'surya-yakkalooru', 'eashvar-karthic',
  'manoj-palleti', 'narayana-chenna', 'ravi-gogula', 'rajesh-mudunuri',
  'agricos', 'yadhu-vamsi', 'virinchi-varma', 'prakash-dantuluri',
  'osho-tulasiram', 'viplav', 'mihiraam-vynatheya', 'vishnu-bompally',
  'rajesh-jagannadham', 'bobby-varma', 'satish-paramaveda', 'venkatesh-vipparthi',
  'chinna-venkatesh', 'akshara', 'sree-koneti', 'prasanth-varma',
  'sam-anton', 'n-laxmi-nanda', 'santhosh-babu', 'anji-ram',
  'manikanth-gelli', 'ritesh-rana', 'aakash-bikki', 't-nagendar',
  'siva-sashu', 'naveen-gandhi', 'arjun-sai', 'umamahesh-marpu',
  'kalyan-santosh', 'pradeep-allu', 'macha-saikishor', 'hasith-goli',
  'vamsi-jonnalgadda', 'harish-shankar', 'anand-gurram', 'yata-satyanarayana',
  'harinath-puli', 'suman-chikkala', 'mallam-ramesh', 'muni-sahekara',
  'mallik-ram', 'srinu-vaitla', 'v-yeshasvi', 'naresh-dekkala',
  'satheesh-malempati', 'thota-nag', 'harsha-konuganti', 'vidyadhar-kagita',
  'sateesh-rapolu', 'srinivas-gopisetti', 'krishnamachary', 'a-sreedhar-reddy',
  'parasuram', 'naveen-reddy', 'd-naga-sasidhar-reddy', 'arjun-jandyala',
  'choudappa', 'ramakrishna-kanchi', 'eshaku-dasari', 'sahit-mothkuri',
  'hanu-kotla', 'uday-bomisetty', 'bhavanam', 'smaran-reddy',
  'vishwanath-prathap', 'alanaati-ramchandrudu', 'dayanandh',
  'bala-rajasekharuni', 'stephen-pallam', 'neelagiri-mamilla',
  'ramesh-cheppala', 'adhyanth-harsha', 'aswin-raam', 'whisky-dasari',
  'chittajallu-prasad', 'murthy-devagupthapu', 'renigunta-narsing',
  'dadi-lokesh', 'rajesh-tadakala', 'kowshik-bheemidi', 'nagaraj-bodem',
  'prandeep-thakore', 'harsha', 'sanjeev-megoti', 'basireddy-rana',
  'ram-bhimana', 'makka-srinu', 'vikranth-srinivas', 'surath-rambabu',
  'garudavega-anji', 'gnanasagar-dwaraka', 'rohit-penumatsa',
  'shirin-sriram', 'lakshman-karya', 'vi-anand', 'ramesh-nani',
  'panna-royal', 'praveen-jetti', 'srinath-badineni', 'chandu-koduri',
  'k-vijaya-bhaskar', 'krishna-chaithanya', 'kotha-parsharamulu',
  'dhruva-vaayu', 'santosh-kambhampati', 'ramakhanth-reddy',
  'kalyan-chakravarthy', 'sreenath-pulakuram'
];

interface Movie {
  id: string;
  slug: string;
  title_en: string;
  release_year: number | null;
  our_rating: number | null;
  verdict: string | null;
  tmdb_id: number | null;
  poster_url: string | null;
}

async function cleanupAndAnalyze() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧹 CLEANUP & ANALYSIS SCRIPT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const dryRun = process.argv.includes('--dry-run');
  const deleteInvalid = process.argv.includes('--delete');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No deletions will be performed');
  }

  // Fetch all Telugu movies
  let allMovies: Movie[] = [];
  let offset = 0;
  const limit = 1000;

  console.log('📚 Fetching all movies from database...');
  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, slug, title_en, release_year, our_rating, verdict, tmdb_id, poster_url')
      .eq('language', 'Telugu')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching movies:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allMovies = allMovies.concat(data);
    offset += limit;
  }

  console.log(`📊 Found ${allMovies.length} Telugu movies`);
  console.log('');

  // STEP 1: Identify invalid entries (person names as movies)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 STEP 1: Identifying Invalid Entries (Person Names)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const invalidEntries: Movie[] = [];
  const validMovies: Movie[] = [];

  for (const movie of allMovies) {
    const slug = movie.slug || '';
    let isInvalid = false;
    let reason = '';

    // Check against known person patterns
    for (const pattern of KNOWN_PERSON_PATTERNS) {
      if (typeof pattern === 'string') {
        if (slug.includes(pattern)) {
          isInvalid = true;
          reason = `matches person pattern: ${pattern}`;
          break;
        }
      } else {
        if (pattern.test(slug)) {
          isInvalid = true;
          reason = 'matches person name regex pattern';
          break;
        }
      }
    }

    // Additional heuristics for detecting person entries
    if (!isInvalid) {
      // Very short titles with year-2024 that look like person names
      const nameParts = slug.replace(/-\d{4}$/, '').split('-');
      if (nameParts.length === 2 && 
          slug.endsWith('-2024') && 
          !movie.tmdb_id && 
          !movie.poster_url) {
        isInvalid = true;
        reason = 'likely person name (2-part slug, no TMDB, no poster)';
      }
    }

    if (isInvalid) {
      invalidEntries.push(movie);
    } else {
      validMovies.push(movie);
    }
  }

  console.log(`  ❌ Invalid entries (person names): ${invalidEntries.length}`);
  console.log(`  ✅ Valid movies: ${validMovies.length}`);
  console.log('');

  if (invalidEntries.length > 0 && invalidEntries.length <= 50) {
    console.log('  Invalid entries found:');
    invalidEntries.forEach(m => console.log(`    - ${m.slug} (${m.title_en})`));
    console.log('');
  }

  // STEP 2: Identify duplicates
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 STEP 2: Identifying Duplicates');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const titleYearMap: Map<string, Movie[]> = new Map();
  for (const movie of validMovies) {
    const key = `${movie.title_en?.toLowerCase() || ''}-${movie.release_year || 'unknown'}`;
    if (!titleYearMap.has(key)) {
      titleYearMap.set(key, []);
    }
    titleYearMap.get(key)!.push(movie);
  }

  const duplicateGroups: Movie[][] = [];
  for (const [key, movies] of titleYearMap) {
    if (movies.length > 1) {
      duplicateGroups.push(movies);
    }
  }

  console.log(`  🔄 Duplicate groups found: ${duplicateGroups.length}`);
  
  const duplicatesToRemove: Movie[] = [];
  for (const group of duplicateGroups) {
    // Keep the one with TMDB ID and poster, remove others
    const sorted = group.sort((a, b) => {
      const aScore = (a.tmdb_id ? 10 : 0) + (a.poster_url ? 5 : 0) + (a.our_rating ? 1 : 0);
      const bScore = (b.tmdb_id ? 10 : 0) + (b.poster_url ? 5 : 0) + (b.our_rating ? 1 : 0);
      return bScore - aScore;
    });
    duplicatesToRemove.push(...sorted.slice(1));
  }

  console.log(`  🗑️ Duplicates to remove: ${duplicatesToRemove.length}`);
  console.log('');

  // STEP 3: Delete invalid entries if requested
  if (deleteInvalid && !dryRun) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗑️ STEP 3: Deleting Invalid Entries');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const toDelete = [...invalidEntries, ...duplicatesToRemove];
    let deleted = 0;

    for (const movie of toDelete) {
      // First delete related reviews
      await supabase.from('movie_reviews').delete().eq('movie_id', movie.id);
      
      // Then delete the movie
      const { error } = await supabase.from('movies').delete().eq('id', movie.id);
      if (!error) {
        deleted++;
      }
    }

    console.log(`  ✅ Deleted ${deleted} invalid/duplicate entries`);
    console.log('');

    // Remove deleted entries from valid movies
    const deletedIds = new Set(toDelete.map(m => m.id));
    validMovies.splice(0, validMovies.length, ...validMovies.filter(m => !deletedIds.has(m.id)));
  }

  // STEP 4: Generate Category Analysis
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 STEP 4: Generating Category Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Sort by rating
  const moviesWithRating = validMovies.filter(m => m.our_rating && m.our_rating > 0);
  moviesWithRating.sort((a, b) => (b.our_rating || 0) - (a.our_rating || 0));

  // Group by category
  const categories: Record<string, Movie[]> = {
    'masterpiece': [],
    'must-watch': [],
    'mass-classic': [],
    'highly-recommended': [],
    'watchable': [],
    'one-time-watch': [],
    'uncategorized': []
  };

  for (const movie of validMovies) {
    const cat = movie.verdict || 'uncategorized';
    if (categories[cat]) {
      categories[cat].push(movie);
    } else {
      categories['uncategorized'].push(movie);
    }
  }

  // Sort each category by rating
  for (const cat of Object.keys(categories)) {
    categories[cat].sort((a, b) => (b.our_rating || 0) - (a.our_rating || 0));
  }

  // Generate report
  let report = `# Telugu Movies Analysis Report\n\n`;
  report += `**Generated**: ${new Date().toISOString().split('T')[0]}\n\n`;
  report += `## Summary\n\n`;
  report += `| Metric | Value |\n|--------|-------|\n`;
  report += `| Total Valid Movies | ${validMovies.length} |\n`;
  report += `| Movies with Rating | ${moviesWithRating.length} |\n`;
  report += `| Invalid Entries | ${invalidEntries.length} |\n`;
  report += `| Duplicates | ${duplicatesToRemove.length} |\n\n`;

  report += `## Category Distribution\n\n`;
  report += `| Category | Count | Avg Rating |\n|----------|-------|------------|\n`;
  for (const [cat, movies] of Object.entries(categories)) {
    const avgRating = movies.length > 0 
      ? (movies.reduce((sum, m) => sum + (m.our_rating || 0), 0) / movies.length).toFixed(2)
      : 'N/A';
    report += `| ${cat} | ${movies.length} | ${avgRating} |\n`;
  }
  report += '\n';

  // Top 100 movies overall
  report += `## 🏆 TOP 100 MOVIES OVERALL\n\n`;
  report += `| # | Title | Year | Rating | Category |\n|---|-------|------|--------|----------|\n`;
  moviesWithRating.slice(0, 100).forEach((m, i) => {
    report += `| ${i + 1} | ${m.title_en} | ${m.release_year || 'N/A'} | ${m.our_rating?.toFixed(1)} | ${m.verdict || 'N/A'} |\n`;
  });
  report += '\n';

  // Bottom 100 movies overall
  report += `## 📉 BOTTOM 100 MOVIES OVERALL\n\n`;
  report += `| # | Title | Year | Rating | Category |\n|---|-------|------|--------|----------|\n`;
  const bottom100 = [...moviesWithRating].reverse().slice(0, 100);
  bottom100.forEach((m, i) => {
    report += `| ${i + 1} | ${m.title_en} | ${m.release_year || 'N/A'} | ${m.our_rating?.toFixed(1)} | ${m.verdict || 'N/A'} |\n`;
  });
  report += '\n';

  // Top/Bottom for each category
  for (const [cat, movies] of Object.entries(categories)) {
    if (cat === 'uncategorized' || movies.length === 0) continue;

    report += `---\n\n`;
    report += `## ${cat.toUpperCase()}\n\n`;
    report += `Total: ${movies.length} movies\n\n`;

    // Top 100 in category
    report += `### Top 100 ${cat}\n\n`;
    report += `| # | Title | Year | Rating |\n|---|-------|------|--------|\n`;
    movies.slice(0, 100).forEach((m, i) => {
      report += `| ${i + 1} | ${m.title_en} | ${m.release_year || 'N/A'} | ${m.our_rating?.toFixed(1)} |\n`;
    });
    report += '\n';

    // Bottom 100 in category (if more than 100)
    if (movies.length > 100) {
      report += `### Bottom 100 ${cat}\n\n`;
      report += `| # | Title | Year | Rating |\n|---|-------|------|--------|\n`;
      const bottom = [...movies].reverse().slice(0, 100);
      bottom.forEach((m, i) => {
        report += `| ${i + 1} | ${m.title_en} | ${m.release_year || 'N/A'} | ${m.our_rating?.toFixed(1)} |\n`;
      });
      report += '\n';
    }
  }

  // Write report
  fs.writeFileSync('docs/CATEGORY-ANALYSIS.md', report);
  console.log('📄 Report saved to docs/CATEGORY-ANALYSIS.md');
  console.log('');

  // Create JSON summary for analysis
  const jsonSummary = {
    generated_at: new Date().toISOString(),
    summary: {
      total_valid_movies: validMovies.length,
      movies_with_rating: moviesWithRating.length,
      invalid_entries: invalidEntries.length,
      duplicates: duplicatesToRemove.length
    },
    category_distribution: Object.entries(categories).map(([cat, movies]) => ({
      category: cat,
      count: movies.length,
      avg_rating: movies.length > 0 
        ? parseFloat((movies.reduce((sum, m) => sum + (m.our_rating || 0), 0) / movies.length).toFixed(2))
        : null
    })),
    top_100_overall: moviesWithRating.slice(0, 100).map(m => ({
      slug: m.slug,
      title: m.title_en,
      year: m.release_year,
      rating: m.our_rating,
      category: m.verdict
    })),
    bottom_100_overall: bottom100.map(m => ({
      slug: m.slug,
      title: m.title_en,
      year: m.release_year,
      rating: m.our_rating,
      category: m.verdict
    })),
    categories: Object.fromEntries(
      Object.entries(categories).map(([cat, movies]) => [
        cat,
        {
          top_100: movies.slice(0, 100).map(m => ({
            slug: m.slug,
            title: m.title_en,
            year: m.release_year,
            rating: m.our_rating
          })),
          bottom_100: movies.length > 100 
            ? [...movies].reverse().slice(0, 100).map(m => ({
                slug: m.slug,
                title: m.title_en,
                year: m.release_year,
                rating: m.our_rating
              }))
            : []
        }
      ])
    ),
    invalid_entries: invalidEntries.map(m => ({
      slug: m.slug,
      title: m.title_en,
      year: m.release_year
    })),
    duplicates: duplicatesToRemove.map(m => ({
      slug: m.slug,
      title: m.title_en,
      year: m.release_year
    }))
  };

  fs.writeFileSync('docs/CATEGORY-ANALYSIS.json', JSON.stringify(jsonSummary, null, 2));
  console.log('📄 JSON data saved to docs/CATEGORY-ANALYSIS.json');
  console.log('');

  // Print summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`  Total Valid Movies: ${validMovies.length}`);
  console.log(`  Movies with Rating: ${moviesWithRating.length}`);
  console.log('');
  console.log('  CATEGORY DISTRIBUTION:');
  for (const [cat, movies] of Object.entries(categories)) {
    const bar = '█'.repeat(Math.min(50, Math.round(movies.length / 100)));
    console.log(`    ${cat.padEnd(20)}: ${String(movies.length).padStart(5)} ${bar}`);
  }
  console.log('');

  console.log('  TOP 10 MOVIES:');
  moviesWithRating.slice(0, 10).forEach((m, i) => {
    console.log(`    ${i + 1}. ${m.title_en} (${m.release_year}) - ${m.our_rating?.toFixed(1)} [${m.verdict}]`);
  });
  console.log('');

  console.log('  BOTTOM 10 MOVIES:');
  bottom100.slice(0, 10).forEach((m, i) => {
    console.log(`    ${i + 1}. ${m.title_en} (${m.release_year}) - ${m.our_rating?.toFixed(1)} [${m.verdict}]`);
  });
  console.log('');

  if (!deleteInvalid && (invalidEntries.length > 0 || duplicatesToRemove.length > 0)) {
    console.log('⚠️  Run with --delete to remove invalid/duplicate entries');
  }
}

cleanupAndAnalyze();

