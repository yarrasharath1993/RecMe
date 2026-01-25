#!/usr/bin/env npx tsx
/**
 * Audit Data Quality Issues
 * 
 * Identifies movies with suspicious/incorrect data:
 * - Wrong movie matches (TMDB/IMDb mismatch)
 * - Placeholder/AI-generated content
 * - Self-referential errors
 * - Production houses as actors
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Known issues from manual review
const KNOWN_BAD_MOVIES = [
  { id: '4f1d41e1-1abd-49cc-be6b-06cb1301e013', title: 'Jack', issue: 'Wrong movie (Jackie Brown 1997)' },
  { id: '7fe26824-3387-450e-836c-9d787e256768', title: 'Devil', issue: 'Wrong movie (Late Night with the Devil)' },
  { id: '7c4d5d48-47b7-427f-ada0-fb8b79ae2ddf', title: 'Swathimuthyam', issue: 'Production house as hero' },
  { id: '66a71777-30bc-41a8-85d7-c04d7245aaf7', title: 'Super Raja', issue: 'Self-referential data' },
  { id: 'b1a6907b-f9a9-4e3f-9783-3e436c248901', title: 'Most Eligible Bachelor', issue: 'Wrong director/music director' },
  { id: 'cacdae23-751b-4c9e-a0bd-4e0a110aeff5', title: 'Hello!', issue: 'Wrong cast' },
];

async function auditDataQuality() {
  console.log('🔍 Auditing Data Quality Issues\n');
  console.log('='.repeat(80));
  
  // Fetch all unpublished Telugu movies
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .eq('is_published', false)
    .eq('language', 'Telugu')
    .order('release_year', { ascending: false });
  
  console.log(`\n📊 Analyzing ${movies?.length || 0} unpublished Telugu movies\n`);
  
  if (!movies || movies.length === 0) return;
  
  const issues = {
    wrongMovie: [] as any[],
    aiPlaceholder: [] as any[],
    selfReferential: [] as any[],
    productionAsActor: [] as any[],
    suspiciousCast: [] as any[],
    missingCritical: [] as any[],
    duplicateNames: [] as any[],
    futureYear: [] as any[],
  };
  
  // Production house patterns
  const productionHouseKeywords = [
    'entertainments', 'productions', 'studios', 'films', 'pictures',
    'creations', 'enterprises', 'banner', 'media', 'cinema'
  ];
  
  for (const movie of movies) {
    const movieInfo = {
      id: movie.id,
      title: movie.title_en,
      year: movie.release_year,
      hero: movie.hero,
      director: movie.director,
      synopsis: movie.synopsis,
    };
    
    // Check 1: AI/Placeholder synopses
    if (movie.synopsis) {
      const placeholderPhrases = [
        'under wraps',
        'likely revolves around',
        'specific details remain',
        'expected to explore',
        'plot details are scarce',
        'information is limited',
      ];
      
      if (placeholderPhrases.some(phrase => movie.synopsis.toLowerCase().includes(phrase))) {
        issues.aiPlaceholder.push(movieInfo);
      }
    }
    
    // Check 2: Self-referential data (title appears in all fields)
    if (movie.title_en && movie.hero && movie.director) {
      const titleWords = movie.title_en.toLowerCase().split(' ');
      const heroLower = movie.hero.toLowerCase();
      const directorLower = movie.director.toLowerCase();
      
      const titleInHero = titleWords.some(word => word.length > 3 && heroLower.includes(word));
      const titleInDirector = titleWords.some(word => word.length > 3 && directorLower.includes(word));
      
      if (titleInHero && titleInDirector && movie.hero === movie.director) {
        issues.selfReferential.push(movieInfo);
      }
    }
    
    // Check 3: Production house as actor
    if (movie.hero) {
      const heroLower = movie.hero.toLowerCase();
      if (productionHouseKeywords.some(keyword => heroLower.includes(keyword))) {
        issues.productionAsActor.push(movieInfo);
      }
    }
    
    // Check 4: "disambiguation" in fields
    if (movie.music_director && movie.music_director.toLowerCase().includes('disambiguation')) {
      issues.suspiciousCast.push({ ...movieInfo, field: 'music_director', value: movie.music_director });
    }
    
    // Check 5: Future years (2026+)
    if (movie.release_year && movie.release_year > 2026) {
      issues.futureYear.push(movieInfo);
    }
    
    // Check 6: Actor name in title mismatch
    // Example: "Jack" with Quentin Tarantino (he's a director, not actor)
    if (movie.director === 'Quentin Tarantino' && movie.language === 'Telugu') {
      issues.wrongMovie.push({ ...movieInfo, reason: 'Tarantino never directed Telugu films' });
    }
  }
  
  // Print results
  console.log('📋 Data Quality Issues Found:\n');
  
  if (issues.wrongMovie.length > 0) {
    console.log(`\n🚨 WRONG MOVIE DATA (${issues.wrongMovie.length}):`);
    console.log('   These appear to be wrong movie matches\n');
    issues.wrongMovie.forEach(m => {
      console.log(`   ${m.year} - ${m.title}`);
      console.log(`      Reason: ${m.reason}`);
    });
  }
  
  if (issues.aiPlaceholder.length > 0) {
    console.log(`\n⚠️  AI/PLACEHOLDER SYNOPSES (${issues.aiPlaceholder.length}):`);
    console.log('   Generic AI-generated content\n');
    issues.aiPlaceholder.slice(0, 10).forEach(m => {
      console.log(`   ${m.year} - ${m.title}`);
    });
    if (issues.aiPlaceholder.length > 10) {
      console.log(`   ... and ${issues.aiPlaceholder.length - 10} more\n`);
    }
  }
  
  if (issues.selfReferential.length > 0) {
    console.log(`\n❌ SELF-REFERENTIAL DATA (${issues.selfReferential.length}):`);
    console.log('   Title appears in hero/director fields\n');
    issues.selfReferential.forEach(m => {
      console.log(`   ${m.year} - ${m.title}`);
      console.log(`      Hero: ${m.hero}, Director: ${m.director}`);
    });
  }
  
  if (issues.productionAsActor.length > 0) {
    console.log(`\n❌ PRODUCTION HOUSE AS ACTOR (${issues.productionAsActor.length}):`);
    console.log('   Production company listed as hero\n');
    issues.productionAsActor.forEach(m => {
      console.log(`   ${m.year} - ${m.title}`);
      console.log(`      Hero: ${m.hero}`);
    });
  }
  
  if (issues.suspiciousCast.length > 0) {
    console.log(`\n⚠️  SUSPICIOUS CAST DATA (${issues.suspiciousCast.length}):`);
    console.log('   Contains "disambiguation" or other placeholder text\n');
    issues.suspiciousCast.forEach((m: any) => {
      console.log(`   ${m.year} - ${m.title}`);
      console.log(`      ${m.field}: ${m.value}`);
    });
  }
  
  if (issues.futureYear.length > 0) {
    console.log(`\n⚠️  FUTURE YEARS (${issues.futureYear.length}):`);
    console.log('   Movies dated 2027 or later\n');
    issues.futureYear.forEach(m => {
      console.log(`   ${m.year} - ${m.title}`);
    });
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Summary:\n');
  
  const totalIssues = 
    issues.wrongMovie.length +
    issues.aiPlaceholder.length +
    issues.selfReferential.length +
    issues.productionAsActor.length +
    issues.suspiciousCast.length;
  
  console.log(`   Total movies analyzed: ${movies.length}`);
  console.log(`   Movies with quality issues: ${totalIssues}`);
  console.log(`   Issue-free movies: ${movies.length - totalIssues}\n`);
  
  console.log('   Issues by type:');
  console.log(`   - Wrong movie data: ${issues.wrongMovie.length}`);
  console.log(`   - AI/Placeholder content: ${issues.aiPlaceholder.length}`);
  console.log(`   - Self-referential data: ${issues.selfReferential.length}`);
  console.log(`   - Production as actor: ${issues.productionAsActor.length}`);
  console.log(`   - Suspicious cast: ${issues.suspiciousCast.length}`);
  console.log(`   - Future years: ${issues.futureYear.length}\n`);
  
  // Generate delete list for known bad movies
  console.log('='.repeat(80));
  console.log('\n📝 Recommended Actions:\n');
  
  console.log('   1. DELETE confirmed wrong movies:');
  KNOWN_BAD_MOVIES.forEach(m => {
    console.log(`      - ${m.title}: ${m.issue}`);
  });
  
  console.log('\n   2. FIX production house as actor:');
  console.log(`      ${issues.productionAsActor.length} movies need correct hero name`);
  
  console.log('\n   3. REVIEW all ${issues.aiPlaceholder.length} movies with AI synopses');
  console.log('      Verify data is correct, not just placeholders');
  
  // Generate SQL to delete bad movies
  const deleteSql = `
-- Delete confirmed wrong movie matches
DELETE FROM movies WHERE id IN (
  ${KNOWN_BAD_MOVIES.map(m => `'${m.id}'`).join(',\n  ')}
);

-- Check count before committing
SELECT COUNT(*) FROM movies WHERE id IN (
  ${KNOWN_BAD_MOVIES.map(m => `'${m.id}'`).join(',\n  ')}
);
`;
  
  fs.writeFileSync('delete-bad-movies.sql', deleteSql);
  console.log('\n   ✅ Generated: delete-bad-movies.sql\n');
  
  // Generate CSV of all problematic movies
  const problemMovies = [
    ...issues.wrongMovie,
    ...issues.selfReferential,
    ...issues.productionAsActor,
    ...issues.suspiciousCast,
  ];
  
  if (problemMovies.length > 0) {
    const csv = [
      'ID,Title,Year,Hero,Director,Issue',
      ...problemMovies.map((m: any) => 
        `${m.id},"${m.title}",${m.year},"${m.hero || ''}","${m.director || ''}","${m.reason || m.field || 'Quality issue'}"`
      )
    ].join('\n');
    
    fs.writeFileSync('problem-movies.csv', csv);
    console.log('   ✅ Generated: problem-movies.csv\n');
  }
}

auditDataQuality().catch(console.error);
