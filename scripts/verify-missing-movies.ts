import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MissingMovie {
  actor: string;
  title: string;
  year: number;
  role: string;
  castType: string;
}

interface VerificationResult {
  movie: MissingMovie;
  status: 'truly_missing' | 'exists_different_year' | 'exists_different_title' | 'exists_matched';
  dbMovie?: any;
  matchScore?: number;
}

// Enhanced similarity check
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return Math.floor((shorter / longer) * 90);
  }
  
  // Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const distance = matrix[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return Math.floor(((maxLen - distance) / maxLen) * 100);
}

// Read all missing movies from CSV files
function readMissingMovies(): MissingMovie[] {
  const auditsDir = path.join(process.cwd(), 'attribution-audits');
  const csvFiles = fs.readdirSync(auditsDir).filter(f => f.endsWith('.csv'));
  
  const missing: MissingMovie[] = [];
  
  for (const file of csvFiles) {
    const actor = file.replace('-attribution.csv', '').replace(/-/g, ' ');
    const content = fs.readFileSync(path.join(auditsDir, file), 'utf-8');
    const lines = content.split('\n').slice(1); // Skip header
    
    for (const line of lines) {
      if (!line.trim() || !line.includes('MISSING')) continue;
      
      const parts = line.split('","').map(p => p.replace(/^"|"$/g, ''));
      
      if (parts[0] && parts[0].includes('MISSING')) {
        missing.push({
          actor,
          title: parts[1] || '',
          year: parseInt(parts[2]) || 0,
          role: parts[3] || '',
          castType: parts[4] || ''
        });
      }
    }
  }
  
  return missing;
}

// Fast in-memory search (no DB queries per movie)
function searchMovieInMemory(movie: MissingMovie, allMovies: any[]): VerificationResult {
  const { title, year } = movie;
  
  let bestMatch: any = null;
  let bestScore = 0;
  
  // Filter to relevant years first for performance
  const relevantMovies = allMovies.filter(m => 
    Math.abs(m.release_year - year) <= 3
  );
  
  // Search through relevant movies
  for (const dbMovie of relevantMovies) {
    const scoreEn = calculateSimilarity(title, dbMovie.title_en || '');
    const scoreTe = dbMovie.title_te ? calculateSimilarity(title, dbMovie.title_te) : 0;
    const maxScore = Math.max(scoreEn, scoreTe);
    
    if (maxScore > bestScore) {
      bestScore = maxScore;
      bestMatch = dbMovie;
    }
  }
  
  // Determine status based on score and year match
  if (bestScore >= 85 && bestMatch.release_year === year) {
    return {
      movie,
      status: 'exists_matched',
      dbMovie: bestMatch,
      matchScore: bestScore
    };
  } else if (bestScore >= 75) {
    return {
      movie,
      status: bestMatch.release_year === year ? 'exists_different_title' : 'exists_different_year',
      dbMovie: bestMatch,
      matchScore: bestScore
    };
  }
  
  return {
    movie,
    status: 'truly_missing'
  };
}

// Check if movie is likely Telugu
function isLikelyTelugu(title: string, year: number): boolean {
  // Telugu movies are more likely if:
  // 1. Recent movies (post-1990)
  // 2. Not obviously English/Hindi titles
  
  if (year < 1950) return false; // Very old, might be Tamil/Hindi
  
  const englishPatterns = /^(The |A |An |Mission|Fast|Avatar|Avengers|Star|Spider|Batman|Superman|Iron Man)/i;
  if (englishPatterns.test(title)) return false;
  
  return true;
}

async function main() {
  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  VERIFYING "MISSING" MOVIES FROM WIKIPEDIA SCRAPE'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.cyan('📖 Reading missing movies from CSV files...\n'));
  const missingMovies = readMissingMovies();
  
  console.log(chalk.green(`✓ Found ${missingMovies.length} movies marked as MISSING\n`));
  
  // Filter Telugu-likely movies
  const teluguMovies = missingMovies.filter(m => isLikelyTelugu(m.title, m.year));
  const otherMovies = missingMovies.filter(m => !isLikelyTelugu(m.title, m.year));
  
  console.log(chalk.cyan(`🎬 Telugu-likely movies: ${teluguMovies.length}`));
  console.log(chalk.gray(`🌍 Other language movies: ${otherMovies.length}\n`));
  
  console.log(chalk.yellow('📥 Loading all movies from database...\n'));
  
  // Load ALL movies once (much faster than individual queries!)
  let allMovies: any[] = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title_en, title_te, release_year, language, slug')
      .order('release_year', { ascending: false })
      .range(offset, offset + batchSize - 1);
    
    if (error || !data || data.length === 0) break;
    
    allMovies = allMovies.concat(data);
    offset += batchSize;
    
    console.log(chalk.gray(`  Loaded: ${allMovies.length} movies`));
    
    if (data.length < batchSize) break;
  }
  
  console.log(chalk.green(`\n✓ Loaded ${allMovies.length} movies from database\n`));
  
  console.log(chalk.yellow('🔍 Verifying Telugu movies (in-memory matching)...\n'));
  
  const results: VerificationResult[] = [];
  
  for (let i = 0; i < teluguMovies.length; i++) {
    const movie = teluguMovies[i];
    const result = searchMovieInMemory(movie, allMovies);
    results.push(result);
    
    if ((i + 1) % 100 === 0) {
      console.log(chalk.gray(`  Progress: ${i + 1}/${teluguMovies.length}`));
    }
  }
  
  console.log(chalk.green(`\n✓ Verification complete!\n`));
  
  // Categorize results
  const trulyMissing = results.filter(r => r.status === 'truly_missing');
  const existsMatched = results.filter(r => r.status === 'exists_matched');
  const existsDiffYear = results.filter(r => r.status === 'exists_different_year');
  const existsDiffTitle = results.filter(r => r.status === 'exists_different_title');
  
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  VERIFICATION SUMMARY'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.red(`❌ Truly Missing:              ${trulyMissing.length} (${Math.round(trulyMissing.length / teluguMovies.length * 100)}%)`));
  console.log(chalk.green(`✓ Exists (Matched):            ${existsMatched.length} (${Math.round(existsMatched.length / teluguMovies.length * 100)}%)`));
  console.log(chalk.yellow(`⚠️  Exists (Different Year):    ${existsDiffYear.length} (${Math.round(existsDiffYear.length / teluguMovies.length * 100)}%)`));
  console.log(chalk.yellow(`⚠️  Exists (Different Title):   ${existsDiffTitle.length} (${Math.round(existsDiffTitle.length / teluguMovies.length * 100)}%)`));
  
  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════\n'));
  
  // Generate detailed CSV report
  const reportPath = path.join(process.cwd(), 'MISSING-MOVIES-VERIFICATION.csv');
  const headers = [
    'Actor',
    'Wikipedia Title',
    'Wikipedia Year',
    'Role',
    'Verification Status',
    'DB Title (EN)',
    'DB Title (TE)',
    'DB Year',
    'Match Score',
    'DB Movie ID',
    'Action Required'
  ];
  
  const rows: string[][] = [headers];
  
  // Sort by status: truly missing first
  const sorted = [
    ...trulyMissing,
    ...existsDiffYear,
    ...existsDiffTitle,
    ...existsMatched
  ];
  
  sorted.forEach(r => {
    const statusEmoji = {
      'truly_missing': '❌ TRULY MISSING',
      'exists_matched': '✓ EXISTS',
      'exists_different_year': '⚠️ EXISTS (YEAR MISMATCH)',
      'exists_different_title': '⚠️ EXISTS (TITLE VARIANT)'
    }[r.status];
    
    const action = r.status === 'truly_missing' 
      ? 'Create movie entry'
      : r.status === 'exists_matched'
      ? `Add ${r.movie.actor} to cast/crew`
      : `Verify and add ${r.movie.actor}`;
    
    rows.push([
      r.movie.actor,
      r.movie.title,
      r.movie.year.toString(),
      `${r.movie.role}${r.movie.castType ? ` (${r.movie.castType})` : ''}`,
      statusEmoji,
      r.dbMovie?.title_en || '',
      r.dbMovie?.title_te || '',
      r.dbMovie?.release_year?.toString() || '',
      r.matchScore?.toString() || '',
      r.dbMovie?.id || '',
      action
    ]);
  });
  
  const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  fs.writeFileSync(reportPath, csv);
  
  console.log(chalk.green(`✓ Detailed report saved: ${reportPath}\n`));
  
  // Show sample of truly missing Telugu movies
  console.log(chalk.bold('📋 Sample of Truly Missing Telugu Movies:\n'));
  
  trulyMissing.slice(0, 20).forEach((r, i) => {
    console.log(chalk.gray(`${i + 1}. ${r.movie.title} (${r.movie.year}) - ${r.movie.actor} as ${r.movie.role}`));
  });
  
  if (trulyMissing.length > 20) {
    console.log(chalk.gray(`\n... and ${trulyMissing.length - 20} more\n`));
  }
  
  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════\n'));
}

main();
