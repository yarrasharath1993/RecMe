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
  title_te?: string;
  release_year: number;
  hero?: string;
  heroine?: string;
  director?: string;
  music_director?: string;
  producer?: string;
  our_rating?: number;
  tmdb_rating?: number;
  poster_url?: string;
  language: string;
  synopsis?: string;
  genres?: string;
}

async function analyzeUnpublishedMovies() {
  console.log('🔍 Analyzing 227 Unpublished Telugu Movies...\n');
  console.log('='.repeat(80));
  
  // Fetch all unpublished movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('*')
    .eq('is_published', false)
    .eq('language', 'Telugu')
    .order('release_year', { ascending: false });
  
  if (error || !movies) {
    console.error('❌ Error fetching movies:', error);
    return;
  }
  
  console.log(`\n📊 Total Unpublished: ${movies.length}\n`);
  
  // Categorize by completeness
  const categories = {
    excellent: [] as Movie[], // hero + director + rating + poster
    good: [] as Movie[], // (hero OR director) AND (rating OR poster)
    basic: [] as Movie[], // Missing critical data
    noHero: [] as Movie[],
    noDirector: [] as Movie[],
    noRating: [] as Movie[],
    noPoster: [] as Movie[],
    suspicious: [] as Movie[], // Potential data issues
  };
  
  // Hero distribution
  const heroCount: Record<string, number> = {};
  
  // Year distribution
  const byDecade: Record<string, number> = {};
  
  // Language issues (suspected non-Telugu)
  const languageIssues: Movie[] = [];
  
  for (const movie of movies) {
    const hasHero = !!movie.hero;
    const hasDirector = !!movie.director;
    const hasRating = !!(movie.our_rating || movie.tmdb_rating);
    const hasPoster = !!movie.poster_url;
    
    // Categorize by quality
    if (hasHero && hasDirector && hasRating && hasPoster) {
      categories.excellent.push(movie);
    } else if ((hasHero || hasDirector) && (hasRating || hasPoster)) {
      categories.good.push(movie);
    } else {
      categories.basic.push(movie);
    }
    
    // Track missing fields
    if (!hasHero) categories.noHero.push(movie);
    if (!hasDirector) categories.noDirector.push(movie);
    if (!hasRating) categories.noRating.push(movie);
    if (!hasPoster) categories.noPoster.push(movie);
    
    // Hero distribution
    if (movie.hero) {
      const heroes = movie.hero.split(',').map(h => h.trim());
      heroes.forEach(hero => {
        heroCount[hero] = (heroCount[hero] || 0) + 1;
      });
    }
    
    // Decade distribution
    const decade = Math.floor(movie.release_year / 10) * 10;
    byDecade[`${decade}s`] = (byDecade[`${decade}s`] || 0) + 1;
    
    // Suspicious entries (potential language issues)
    const suspiciousNames = [
      'Salman Khan', 'Shah Rukh Khan', 'Akshay Kumar', 'Ajay Devgn',
      'Hrithik Roshan', 'Aamir Khan', 'Mammootty', 'Mohanlal',
      'Vijay', 'Suriya', 'Karthi', 'Darshan'
    ];
    
    if (movie.hero && suspiciousNames.some(name => movie.hero!.includes(name))) {
      languageIssues.push(movie);
      categories.suspicious.push(movie);
    }
  }
  
  // Sort hero count
  const topHeroes = Object.entries(heroCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  
  // Generate Report
  const report: string[] = [];
  
  report.push('# 227 Unpublished Telugu Movies - Complete Analysis');
  report.push('');
  report.push(`**Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  report.push(`**Total Unpublished:** ${movies.length}`);
  report.push('');
  report.push('---');
  report.push('');
  
  // Quality Breakdown
  report.push('## 📊 Quality Breakdown');
  report.push('');
  report.push('| Category | Count | % | Criteria |');
  report.push('|----------|-------|---|----------|');
  report.push(`| ⭐⭐⭐ Excellent | ${categories.excellent.length} | ${((categories.excellent.length / movies.length) * 100).toFixed(1)}% | Hero + Director + Rating + Poster |`);
  report.push(`| ⭐⭐ Good | ${categories.good.length} | ${((categories.good.length / movies.length) * 100).toFixed(1)}% | (Hero OR Director) AND (Rating OR Poster) |`);
  report.push(`| ⭐ Basic | ${categories.basic.length} | ${((categories.basic.length / movies.length) * 100).toFixed(1)}% | Missing critical data |`);
  report.push('');
  
  // Missing Data Analysis
  report.push('## 🔍 Missing Data Analysis');
  report.push('');
  report.push('| Missing Field | Count | % | Impact |');
  report.push('|---------------|-------|---|--------|');
  report.push(`| No Hero | ${categories.noHero.length} | ${((categories.noHero.length / movies.length) * 100).toFixed(1)}% | ❌ Critical |`);
  report.push(`| No Director | ${categories.noDirector.length} | ${((categories.noDirector.length / movies.length) * 100).toFixed(1)}% | ⚠️ Important |`);
  report.push(`| No Rating | ${categories.noRating.length} | ${((categories.noRating.length / movies.length) * 100).toFixed(1)}% | 💡 Nice to have |`);
  report.push(`| No Poster | ${categories.noPoster.length} | ${((categories.noPoster.length / movies.length) * 100).toFixed(1)}% | 🎨 Visual appeal |`);
  report.push('');
  
  // Year Distribution
  report.push('## 📅 Distribution by Decade');
  report.push('');
  report.push('| Decade | Count | % |');
  report.push('|--------|-------|---|');
  const sortedDecades = Object.entries(byDecade).sort((a, b) => b[0].localeCompare(a[0]));
  sortedDecades.forEach(([decade, count]) => {
    report.push(`| ${decade} | ${count} | ${((count / movies.length) * 100).toFixed(1)}% |`);
  });
  report.push('');
  
  // Top Heroes
  report.push('## 🎬 Top 20 Heroes (Unpublished Movies)');
  report.push('');
  report.push('| Rank | Hero | Movies | Impact |');
  report.push('|------|------|--------|--------|');
  topHeroes.forEach(([hero, count], index) => {
    const impact = count >= 10 ? '🔥 High' : count >= 5 ? '⚠️ Medium' : '💡 Low';
    report.push(`| ${index + 1} | ${hero} | ${count} | ${impact} |`);
  });
  report.push('');
  
  // Language Issues
  if (languageIssues.length > 0) {
    report.push('## ⚠️ Suspected Language Issues');
    report.push('');
    report.push(`**Found ${languageIssues.length} movies** tagged as Telugu but likely Hindi/Tamil/Malayalam:`);
    report.push('');
    report.push('| Title | Year | Hero | Suspected Language |');
    report.push('|-------|------|------|-------------------|');
    languageIssues.slice(0, 30).forEach(movie => {
      let suspectedLang = 'Unknown';
      if (movie.hero?.includes('Salman') || movie.hero?.includes('Shah Rukh') || movie.hero?.includes('Akshay')) {
        suspectedLang = 'Hindi';
      } else if (movie.hero?.includes('Mammootty') || movie.hero?.includes('Mohanlal')) {
        suspectedLang = 'Malayalam';
      } else if (movie.hero?.includes('Vijay') || movie.hero?.includes('Suriya')) {
        suspectedLang = 'Tamil';
      } else if (movie.hero?.includes('Darshan')) {
        suspectedLang = 'Kannada';
      }
      report.push(`| ${movie.title_en} | ${movie.release_year} | ${movie.hero} | ${suspectedLang} |`);
    });
    if (languageIssues.length > 30) {
      report.push(`| ... | ... | ... | ... |`);
      report.push(`| *(${languageIssues.length - 30} more)* | | | |`);
    }
    report.push('');
  }
  
  // Actionable Recommendations
  report.push('## 🎯 Actionable Recommendations');
  report.push('');
  report.push('### Priority 1: Quick Wins (Excellent Quality)');
  report.push(`- **${categories.excellent.length} movies** are complete and ready to publish`);
  report.push('- Action: Review and bulk publish');
  report.push('- Estimated effort: 1-2 hours');
  report.push('');
  
  report.push('### Priority 2: Good Quality Enhancement');
  report.push(`- **${categories.good.length} movies** need 1-2 fields filled`);
  report.push('- Action: Fill missing hero/director or add rating/poster');
  report.push('- Estimated effort: 3-5 hours');
  report.push('');
  
  report.push('### Priority 3: Language Correction');
  report.push(`- **${languageIssues.length} movies** are likely non-Telugu`);
  report.push('- Action: Update language field to Hindi/Tamil/Malayalam/Kannada');
  report.push('- Estimated effort: 2-3 hours');
  report.push('');
  
  report.push('### Priority 4: Basic Quality Improvement');
  report.push(`- **${categories.basic.length} movies** need significant data enrichment`);
  report.push('- Action: Research and fill hero, director, and poster');
  report.push('- Estimated effort: 10-15 hours');
  report.push('');
  
  // Top Lists for Manual Review
  report.push('## 📋 Top Lists for Manual Review');
  report.push('');
  
  // Excellent movies
  if (categories.excellent.length > 0) {
    report.push('### ✅ Excellent Quality (Ready to Publish)');
    report.push('');
    report.push('| Title | Year | Hero | Director | Rating | Poster |');
    report.push('|-------|------|------|----------|--------|--------|');
    categories.excellent.slice(0, 20).forEach(movie => {
      const rating = movie.our_rating || movie.tmdb_rating || 0;
      report.push(`| ${movie.title_en} | ${movie.release_year} | ${movie.hero} | ${movie.director} | ${rating} | ✅ |`);
    });
    if (categories.excellent.length > 20) {
      report.push(`| ... | ... | ... | ... | ... | ... |`);
      report.push(`| *(${categories.excellent.length - 20} more)* | | | | | |`);
    }
    report.push('');
  }
  
  // Movies missing only hero
  const onlyMissingHero = movies.filter(m => !m.hero && m.director && (m.our_rating || m.tmdb_rating));
  if (onlyMissingHero.length > 0) {
    report.push('### 🎭 Missing Only Hero (Easy Fixes)');
    report.push('');
    report.push('| Title | Year | Director | Rating |');
    report.push('|-------|------|----------|--------|');
    onlyMissingHero.slice(0, 15).forEach(movie => {
      const rating = movie.our_rating || movie.tmdb_rating || 0;
      report.push(`| ${movie.title_en} | ${movie.release_year} | ${movie.director} | ${rating} |`);
    });
    if (onlyMissingHero.length > 15) {
      report.push(`| ... | ... | ... | ... |`);
      report.push(`| *(${onlyMissingHero.length - 15} more)* | | | |`);
    }
    report.push('');
  }
  
  // Statistics Summary
  report.push('## 📈 Statistical Summary');
  report.push('');
  report.push('```');
  report.push(`Total Unpublished: ${movies.length}`);
  report.push('');
  report.push('Data Completeness:');
  report.push(`  Has Hero: ${movies.length - categories.noHero.length} (${(((movies.length - categories.noHero.length) / movies.length) * 100).toFixed(1)}%)`);
  report.push(`  Has Director: ${movies.length - categories.noDirector.length} (${(((movies.length - categories.noDirector.length) / movies.length) * 100).toFixed(1)}%)`);
  report.push(`  Has Rating: ${movies.length - categories.noRating.length} (${(((movies.length - categories.noRating.length) / movies.length) * 100).toFixed(1)}%)`);
  report.push(`  Has Poster: ${movies.length - categories.noPoster.length} (${(((movies.length - categories.noPoster.length) / movies.length) * 100).toFixed(1)}%)`);
  report.push('');
  report.push('Quality Distribution:');
  report.push(`  Excellent: ${categories.excellent.length} (${((categories.excellent.length / movies.length) * 100).toFixed(1)}%)`);
  report.push(`  Good: ${categories.good.length} (${((categories.good.length / movies.length) * 100).toFixed(1)}%)`);
  report.push(`  Basic: ${categories.basic.length} (${((categories.basic.length / movies.length) * 100).toFixed(1)}%)`);
  report.push('');
  report.push('Potential Issues:');
  report.push(`  Suspected non-Telugu: ${languageIssues.length} (${((languageIssues.length / movies.length) * 100).toFixed(1)}%)`);
  report.push('```');
  report.push('');
  
  // Export CSVs
  report.push('## 📁 Exported Files');
  report.push('');
  report.push('The following CSV files have been generated for manual review:');
  report.push('');
  report.push('1. `unpublished-excellent-quality.csv` - Ready to publish');
  report.push('2. `unpublished-good-quality.csv` - Need minor fixes');
  report.push('3. `unpublished-basic-quality.csv` - Need significant work');
  report.push('4. `unpublished-language-issues.csv` - Suspected non-Telugu films');
  report.push('5. `unpublished-missing-hero-only.csv` - Easy fixes');
  report.push('');
  
  // Write report
  const reportPath = 'UNPUBLISHED-227-MOVIES-ANALYSIS-2026-01-15.md';
  fs.writeFileSync(reportPath, report.join('\n'));
  console.log(`✅ Report written to: ${reportPath}\n`);
  
  // Export CSVs
  const csvHeader = 'ID,Title,Year,Hero,Director,Our Rating,TMDB Rating,Has Poster,Synopsis Preview\n';
  
  // Excellent quality
  let csv = csvHeader;
  categories.excellent.forEach(m => {
    const synopsis = (m.synopsis || '').substring(0, 100).replace(/"/g, '""');
    const hero = (m.hero || '').replace(/"/g, '""');
    const director = (m.director || '').replace(/"/g, '""');
    csv += `${m.id},"${m.title_en}",${m.release_year},"${hero}","${director}",${m.our_rating || ''},${m.tmdb_rating || ''},${m.poster_url ? 'YES' : 'NO'},"${synopsis}"\n`;
  });
  fs.writeFileSync('unpublished-excellent-quality.csv', csv);
  console.log(`✅ Exported: unpublished-excellent-quality.csv (${categories.excellent.length} movies)`);
  
  // Good quality
  csv = csvHeader;
  categories.good.forEach(m => {
    const synopsis = (m.synopsis || '').substring(0, 100).replace(/"/g, '""');
    const hero = (m.hero || '').replace(/"/g, '""');
    const director = (m.director || '').replace(/"/g, '""');
    csv += `${m.id},"${m.title_en}",${m.release_year},"${hero}","${director}",${m.our_rating || ''},${m.tmdb_rating || ''},${m.poster_url ? 'YES' : 'NO'},"${synopsis}"\n`;
  });
  fs.writeFileSync('unpublished-good-quality.csv', csv);
  console.log(`✅ Exported: unpublished-good-quality.csv (${categories.good.length} movies)`);
  
  // Basic quality
  csv = csvHeader;
  categories.basic.forEach(m => {
    const synopsis = (m.synopsis || '').substring(0, 100).replace(/"/g, '""');
    const hero = (m.hero || '').replace(/"/g, '""');
    const director = (m.director || '').replace(/"/g, '""');
    csv += `${m.id},"${m.title_en}",${m.release_year},"${hero}","${director}",${m.our_rating || ''},${m.tmdb_rating || ''},${m.poster_url ? 'YES' : 'NO'},"${synopsis}"\n`;
  });
  fs.writeFileSync('unpublished-basic-quality.csv', csv);
  console.log(`✅ Exported: unpublished-basic-quality.csv (${categories.basic.length} movies)`);
  
  // Language issues
  csv = csvHeader;
  languageIssues.forEach(m => {
    const synopsis = (m.synopsis || '').substring(0, 100).replace(/"/g, '""');
    const hero = (m.hero || '').replace(/"/g, '""');
    const director = (m.director || '').replace(/"/g, '""');
    csv += `${m.id},"${m.title_en}",${m.release_year},"${hero}","${director}",${m.our_rating || ''},${m.tmdb_rating || ''},${m.poster_url ? 'YES' : 'NO'},"${synopsis}"\n`;
  });
  fs.writeFileSync('unpublished-language-issues.csv', csv);
  console.log(`✅ Exported: unpublished-language-issues.csv (${languageIssues.length} movies)`);
  
  // Missing hero only
  csv = csvHeader;
  onlyMissingHero.forEach(m => {
    const synopsis = (m.synopsis || '').substring(0, 100).replace(/"/g, '""');
    const hero = (m.hero || '').replace(/"/g, '""');
    const director = (m.director || '').replace(/"/g, '""');
    csv += `${m.id},"${m.title_en}",${m.release_year},"${hero}","${director}",${m.our_rating || ''},${m.tmdb_rating || ''},${m.poster_url ? 'YES' : 'NO'},"${synopsis}"\n`;
  });
  fs.writeFileSync('unpublished-missing-hero-only.csv', csv);
  console.log(`✅ Exported: unpublished-missing-hero-only.csv (${onlyMissingHero.length} movies)\n`);
  
  console.log('='.repeat(80));
  console.log('🎉 Analysis Complete!');
  console.log('='.repeat(80));
}

analyzeUnpublishedMovies()
  .then(() => {
    console.log('\n✅ All analysis complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
