import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runFinalAudit() {
  console.log('=== FINAL DATABASE AUDIT ===\n');
  
  // Get all published movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, director, hero, heroine, genres, synopsis, tmdb_id, poster_url, title_te')
    .eq('is_published', true)
    .order('release_year', { ascending: false });
  
  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }
  
  console.log(`📊 TOTAL PUBLISHED MOVIES: ${movies.length}\n`);
  
  // Movies by decade
  const decades: Record<string, number> = {};
  movies.forEach(m => {
    const decade = Math.floor(m.release_year / 10) * 10;
    decades[decade] = (decades[decade] || 0) + 1;
  });
  
  console.log('📅 MOVIES BY DECADE:');
  Object.keys(decades).sort((a, b) => parseInt(b) - parseInt(a)).forEach(d => {
    console.log(`   ${d}s: ${decades[d]} movies`);
  });
  
  // Missing data analysis
  const missingDirector = movies.filter(m => !m.director);
  const missingHero = movies.filter(m => !m.hero);
  const missingHeroine = movies.filter(m => !m.heroine);
  const missingGenre = movies.filter(m => !m.genres || m.genres.length === 0);
  const missingSynopsis = movies.filter(m => !m.synopsis);
  const missingTmdbId = movies.filter(m => !m.tmdb_id);
  const missingPoster = movies.filter(m => !m.poster_url);
  const missingTeluguTitle = movies.filter(m => !m.title_te);
  
  console.log('\n🔍 MISSING DATA ANALYSIS:');
  console.log(`   Missing Director: ${missingDirector.length} (${(missingDirector.length/movies.length*100).toFixed(1)}%)`);
  console.log(`   Missing Hero: ${missingHero.length} (${(missingHero.length/movies.length*100).toFixed(1)}%)`);
  console.log(`   Missing Heroine: ${missingHeroine.length} (${(missingHeroine.length/movies.length*100).toFixed(1)}%)`);
  console.log(`   Missing Genre: ${missingGenre.length} (${(missingGenre.length/movies.length*100).toFixed(1)}%)`);
  console.log(`   Missing Synopsis: ${missingSynopsis.length} (${(missingSynopsis.length/movies.length*100).toFixed(1)}%)`);
  console.log(`   Missing TMDB ID: ${missingTmdbId.length} (${(missingTmdbId.length/movies.length*100).toFixed(1)}%)`);
  console.log(`   Missing Poster: ${missingPoster.length} (${(missingPoster.length/movies.length*100).toFixed(1)}%)`);
  console.log(`   Missing Telugu Title: ${missingTeluguTitle.length} (${(missingTeluguTitle.length/movies.length*100).toFixed(1)}%)`);
  
  // Data completeness score
  const completeMovies = movies.filter(m => 
    m.director && m.hero && m.genres?.length > 0
  );
  const completenessScore = (completeMovies.length / movies.length * 100).toFixed(1);
  console.log(`\n✅ CORE DATA COMPLETENESS: ${completenessScore}% (director + hero + genre)`);
  
  // Recent movies analysis (2020+)
  const recentMovies = movies.filter(m => m.release_year >= 2020);
  const recentMissingDirector = recentMovies.filter(m => !m.director).length;
  const recentMissingHero = recentMovies.filter(m => !m.hero).length;
  const recentMissingGenre = recentMovies.filter(m => !m.genres || m.genres.length === 0).length;
  
  console.log(`\n📽️ RECENT MOVIES (2020-2026): ${recentMovies.length} movies`);
  console.log(`   Missing Director: ${recentMissingDirector}`);
  console.log(`   Missing Hero: ${recentMissingHero}`);
  console.log(`   Missing Genre: ${recentMissingGenre}`);
  
  // Classic movies analysis (pre-1970)
  const classicMovies = movies.filter(m => m.release_year < 1970);
  const classicMissingDirector = classicMovies.filter(m => !m.director).length;
  const classicMissingHero = classicMovies.filter(m => !m.hero).length;
  
  console.log(`\n🎬 CLASSIC MOVIES (pre-1970): ${classicMovies.length} movies`);
  console.log(`   Missing Director: ${classicMissingDirector}`);
  console.log(`   Missing Hero: ${classicMissingHero}`);
  
  // Sample of movies still missing core data
  const stillMissing = movies.filter(m => !m.director || !m.hero).slice(0, 20);
  
  if (stillMissing.length > 0) {
    console.log('\n⚠️ SAMPLE MOVIES STILL MISSING CORE DATA (first 20):');
    stillMissing.forEach(m => {
      const missing = [];
      if (!m.director) missing.push('Director');
      if (!m.hero) missing.push('Hero');
      if (!m.heroine) missing.push('Heroine');
      console.log(`   ${m.title_en} (${m.release_year}) - Missing: ${missing.join(', ')}`);
    });
  }
  
  // Get celebrities stats
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('id, name_en, industry_title, tmdb_id')
    .eq('is_published', true);
  
  if (celebrities) {
    const celebsWithTitle = celebrities.filter(c => c.industry_title);
    const celebsWithTmdb = celebrities.filter(c => c.tmdb_id);
    
    console.log(`\n👤 CELEBRITIES: ${celebrities.length} total`);
    console.log(`   With Industry Title: ${celebsWithTitle.length}`);
    console.log(`   With TMDB ID: ${celebsWithTmdb.length}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 ENRICHMENT STATUS SUMMARY');
  console.log('='.repeat(50));
  
  const coreComplete = parseFloat(completenessScore);
  if (coreComplete >= 95) {
    console.log('✅ EXCELLENT: Core data enrichment is essentially complete!');
  } else if (coreComplete >= 80) {
    console.log('🟡 GOOD: Most movies have core data, some gaps remain.');
  } else {
    console.log('🔴 NEEDS WORK: Significant data gaps exist.');
  }
  
  console.log(`\n📈 RECOMMENDATIONS:`);
  if (missingTmdbId.length > 100) {
    console.log(`   - ${missingTmdbId.length} movies missing TMDB ID (can auto-enrich posters/synopses)`);
  }
  if (missingSynopsis.length > movies.length * 0.3) {
    console.log(`   - ${missingSynopsis.length} movies missing synopsis`);
  }
  if (missingTeluguTitle.length > movies.length * 0.5) {
    console.log(`   - ${missingTeluguTitle.length} movies missing Telugu title`);
  }
  if (missingDirector.length > 0) {
    console.log(`   - ${missingDirector.length} movies still need director attribution`);
  }
}

runFinalAudit().catch(console.error);
