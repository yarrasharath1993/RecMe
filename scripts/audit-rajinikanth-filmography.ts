#!/usr/bin/env npx tsx
/**
 * RAJINIKANTH FILMOGRAPHY COMPREHENSIVE AUDIT
 * 
 * Complete audit and validation script for Rajinikanth movies:
 * 1. Cross-reference with Wikipedia filmography
 * 2. Detect wrong data (e.g., "K. Balachander" movie title)
 * 3. Identify missing movies
 * 4. Validate director/hero/producer assignments
 * 5. Fix incorrect role assignments
 * 6. Generate comprehensive report
 * 
 * Usage:
 *   npx tsx scripts/audit-rajinikanth-filmography.ts                    # Full audit (dry run)
 *   npx tsx scripts/audit-rajinikanth-filmography.ts --fix --execute   # Apply fixes
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Known Rajinikanth filmography from Wikipedia (key films for validation)
const WIKIPEDIA_FILMS: Array<{
  title: string;
  year: number;
  director: string;
  language: string;
  notes?: string;
}> = [
  // Early films (1975-1979)
  { title: 'Apoorva Raagangal', year: 1975, director: 'K. Balachander', language: 'Tamil' },
  { title: 'Anthuleni Katha', year: 1976, director: 'K. Balachander', language: 'Telugu' },
  { title: 'Moondru Mudichu', year: 1976, director: 'K. Balachander', language: 'Tamil' },
  { title: 'Avargal', year: 1977, director: 'K. Balachander', language: 'Tamil' },
  { title: '16 Vayathinile', year: 1977, director: 'Bharathiraja', language: 'Tamil' },
  { title: 'Bairavi', year: 1978, director: 'M. Bhaskar', language: 'Tamil' },
  { title: 'Mullum Malarum', year: 1978, director: 'Mahendran', language: 'Tamil' },
  { title: 'Aval Appadithan', year: 1978, director: 'C. Rudhraiah', language: 'Tamil' },
  { title: 'Allauddinum Albhutha Vilakkum', year: 1979, director: 'I. V. Sasi', language: 'Malayalam' },
  { title: 'Ninaithaale Inikkum', year: 1979, director: 'K. Balachander', language: 'Tamil' },
  { title: 'Andamaina Anubhavam', year: 1979, director: 'K. Balachander', language: 'Telugu' },
  
  // 1980s
  { title: 'Billa', year: 1980, director: 'R. Krishnamurthy', language: 'Tamil' },
  { title: 'Murattu Kaalai', year: 1980, director: 'S. P. Muthuraman', language: 'Tamil' },
  { title: 'Thillu Mullu', year: 1981, director: 'K. Balachander', language: 'Tamil' },
  { title: 'Moondru Mugam', year: 1982, director: 'A. Jagannathan', language: 'Tamil' },
  { title: 'Andhaa Kaanoon', year: 1983, director: 'T. Rama Rao', language: 'Hindi' },
  { title: 'Nallavanukku Nallavan', year: 1984, director: 'S. P. Muthuraman', language: 'Tamil' },
  { title: 'Sri Raghavendrar', year: 1985, director: 'S. P. Muthuraman', language: 'Tamil' },
  { title: 'Geraftaar', year: 1985, director: 'Prayag Raj', language: 'Hindi' },
  { title: 'Padikkadavan', year: 1985, director: 'R. Krishnamurthy', language: 'Tamil' },
  { title: 'Mr. Bharath', year: 1986, director: 'S. P. Muthuraman', language: 'Tamil' },
  { title: 'Dosti Dushmani', year: 1986, director: 'T. Rama Rao', language: 'Hindi' },
  { title: 'Velaikaran', year: 1987, director: 'S. P. Muthuraman', language: 'Tamil' },
  { title: 'Manithan', year: 1987, director: 'S. P. Muthuraman', language: 'Tamil' },
  { title: 'Guru Sishyan', year: 1988, director: 'S. P. Muthuraman', language: 'Tamil' },
  { title: 'Dharmathin Thalaivan', year: 1988, director: 'S. P. Muthuraman', language: 'Tamil' },
  { title: 'ChaalBaaz', year: 1989, director: 'Pankaj Parashar', language: 'Hindi' },
  
  // 1990s
  { title: 'Thalapathi', year: 1991, director: 'Mani Ratnam', language: 'Tamil' },
  { title: 'Annaamalai', year: 1992, director: 'Suresh Krissna', language: 'Tamil' },
  { title: 'Mannan', year: 1992, director: 'P. Vasu', language: 'Tamil' },
  { title: 'Uzhaippali', year: 1993, director: 'P. Vasu', language: 'Tamil' },
  { title: 'Valli', year: 1993, director: 'Rajinikanth', language: 'Tamil', notes: 'Also writer' },
  { title: 'Baashha', year: 1995, director: 'Suresh Krissna', language: 'Tamil' },
  { title: 'Muthu', year: 1995, director: 'K. S. Ravikumar', language: 'Tamil' },
  { title: 'Padayappa', year: 1999, director: 'K. S. Ravikumar', language: 'Tamil' },
  
  // 2000s
  { title: 'Baba', year: 2002, director: 'Suresh Krissna', language: 'Tamil', notes: 'Also producer and writer' },
  { title: 'Chandramukhi', year: 2005, director: 'P. Vasu', language: 'Tamil' },
  { title: 'Sivaji', year: 2007, director: 'S. Shankar', language: 'Tamil' },
  { title: 'Enthiran', year: 2010, director: 'S. Shankar', language: 'Tamil' },
  { title: 'Ra.One', year: 2011, director: 'Anubhav Sinha', language: 'Hindi' },
  { title: 'Lingaa', year: 2014, director: 'K. S. Ravikumar', language: 'Tamil' },
  { title: 'Kabali', year: 2016, director: 'Pa. Ranjith', language: 'Tamil' },
  { title: 'Kaala', year: 2018, director: 'Pa. Ranjith', language: 'Tamil' },
  { title: '2.0', year: 2018, director: 'S. Shankar', language: 'Tamil' },
  { title: 'Petta', year: 2019, director: 'Karthik Subbaraj', language: 'Tamil' },
  { title: 'Darbar', year: 2020, director: 'A. R. Murugadoss', language: 'Tamil' },
  { title: 'Annaatthe', year: 2021, director: 'Siva', language: 'Tamil' },
  { title: 'Jailer', year: 2023, director: 'Nelson Dilipkumar', language: 'Tamil' },
  { title: 'Vettaiyan', year: 2024, director: 'T. J. Gnanavel', language: 'Tamil' },
  { title: 'Coolie', year: 2025, director: 'Lokesh Kanagaraj', language: 'Tamil' },
];

interface AuditIssue {
  type: 'wrong_title' | 'wrong_director' | 'wrong_role' | 'missing_movie' | 'duplicate' | 'wrong_language' | 'wrong_year';
  movieId?: string;
  currentTitle?: string;
  currentDirector?: string;
  currentRole?: string;
  expectedTitle?: string;
  expectedDirector?: string;
  expectedRole?: string;
  expectedYear?: number;
  confidence: number;
  description: string;
}

interface AuditResult {
  totalMovies: number;
  issues: AuditIssue[];
  missingMovies: Array<{ title: string; year: number; director: string; language: string }>;
  wrongData: Array<{ movieId: string; title: string; issue: string }>;
}

async function auditRajinikanthFilmography(): Promise<AuditResult> {
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  RAJINIKANTH FILMOGRAPHY COMPREHENSIVE AUDIT'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════\n'));

  const issues: AuditIssue[] = [];
  const missingMovies: Array<{ title: string; year: number; director: string; language: string }> = [];
  const wrongData: Array<{ movieId: string; title: string; issue: string }> = [];

  // Fetch all movies with Rajinikanth
  const { data: dbMovies, error } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, hero, heroine, director, producer, language, slug, tmdb_id, is_published')
    .or('hero.ilike.%rajinikanth%,heroine.ilike.%rajinikanth%,director.ilike.%rajinikanth%,producer.ilike.%rajinikanth%')
    .order('release_year', { ascending: false });

  if (error) {
    console.error(chalk.red('Error fetching movies:'), error);
    process.exit(1);
  }

  const totalMovies = dbMovies?.length || 0;
  console.log(chalk.yellow(`Found ${totalMovies} movies in database\n`));

  // 1. Check for wrong titles (like "K. Balachander")
  console.log(chalk.cyan('🔍 Checking for wrong movie titles...'));
  const wrongTitles = dbMovies?.filter(m => {
    // Check if title is a director/producer name
    const title = m.title_en?.toLowerCase() || '';
    return title.includes('balachander') || 
           title.includes('director') ||
           (title.length < 5 && m.director && title === m.director.toLowerCase().substring(0, title.length));
  }) || [];

  for (const movie of wrongTitles) {
    // Try to find the correct title from Wikipedia
    const wikiMatch = WIKIPEDIA_FILMS.find(w => 
      w.year === movie.release_year && 
      w.director === movie.director
    );

    if (wikiMatch) {
      issues.push({
        type: 'wrong_title',
        movieId: movie.id,
        currentTitle: movie.title_en,
        expectedTitle: wikiMatch.title,
        confidence: 95,
        description: `Movie title "${movie.title_en}" appears to be director name. Should be "${wikiMatch.title}"`,
      });
      wrongData.push({
        movieId: movie.id,
        title: movie.title_en || 'Unknown',
        issue: `Wrong title: Should be "${wikiMatch.title}"`,
      });
    }
  }

  console.log(chalk.green(`   Found ${wrongTitles.length} movies with wrong titles\n`));

  // 2. Validate against Wikipedia filmography
  console.log(chalk.cyan('🔍 Validating against Wikipedia filmography...'));
  const dbTitles = new Map<string, typeof dbMovies[0]>();
  dbMovies?.forEach(m => {
    if (m.title_en && m.release_year) {
      const key = `${m.title_en.toLowerCase()}_${m.release_year}`;
      dbTitles.set(key, m);
    }
  });

  for (const wikiFilm of WIKIPEDIA_FILMS) {
    const key = `${wikiFilm.title.toLowerCase()}_${wikiFilm.year}`;
    const dbMovie = dbTitles.get(key);

    if (!dbMovie) {
      // Movie missing from database
      missingMovies.push({
        title: wikiFilm.title,
        year: wikiFilm.year,
        director: wikiFilm.director,
        language: wikiFilm.language,
      });
    } else {
      // Validate director
      if (dbMovie.director !== wikiFilm.director) {
        issues.push({
          type: 'wrong_director',
          movieId: dbMovie.id,
          currentTitle: dbMovie.title_en,
          currentDirector: dbMovie.director || 'Unknown',
          expectedDirector: wikiFilm.director,
          confidence: 90,
          description: `Director mismatch for "${dbMovie.title_en}": DB has "${dbMovie.director}", Wikipedia shows "${wikiFilm.director}"`,
        });
      }

      // Validate language
      if (dbMovie.language !== wikiFilm.language) {
        issues.push({
          type: 'wrong_language',
          movieId: dbMovie.id,
          currentTitle: dbMovie.title_en,
          confidence: 85,
          description: `Language mismatch for "${dbMovie.title_en}": DB has "${dbMovie.language}", Wikipedia shows "${wikiFilm.language}"`,
        });
      }

      // Validate role (should be hero for most)
      if (wikiFilm.notes?.includes('writer') || wikiFilm.notes?.includes('producer')) {
        // These might have additional roles
      } else if (!dbMovie.hero?.toLowerCase().includes('rajinikanth')) {
        issues.push({
          type: 'wrong_role',
          movieId: dbMovie.id,
          currentTitle: dbMovie.title_en,
          currentRole: dbMovie.hero || 'None',
          expectedRole: 'Hero',
          confidence: 80,
          description: `Role mismatch for "${dbMovie.title_en}": Should be Hero, but DB shows "${dbMovie.hero}"`,
        });
      }
    }
  }

  console.log(chalk.green(`   Found ${missingMovies.length} missing movies from Wikipedia\n`));

  // 3. Check for movies where Rajinikanth is incorrectly listed as director/producer
  console.log(chalk.cyan('🔍 Checking for incorrect role assignments...'));
  const incorrectRoles = dbMovies?.filter(m => {
    // Rajinikanth should not be director for most movies (except Valli, Baba)
    if (m.director?.toLowerCase().includes('rajinikanth')) {
      const allowed = ['Valli', 'Baba'];
      return !allowed.some(title => m.title_en?.includes(title));
    }
    // Should not be producer (except Baba)
    if (m.producer?.toLowerCase().includes('rajinikanth')) {
      return m.title_en !== 'Baba';
    }
    return false;
  }) || [];

  for (const movie of incorrectRoles) {
    issues.push({
      type: 'wrong_role',
      movieId: movie.id,
      currentTitle: movie.title_en,
      currentRole: movie.director?.includes('Rajinikanth') ? 'Director' : 'Producer',
      expectedRole: 'Hero',
      confidence: 85,
      description: `"${movie.title_en}" incorrectly lists Rajinikanth as ${movie.director?.includes('Rajinikanth') ? 'Director' : 'Producer'}`,
    });
  }

  console.log(chalk.green(`   Found ${incorrectRoles.length} movies with incorrect roles\n`));

  // 4. Check for duplicates
  console.log(chalk.cyan('🔍 Checking for duplicates...'));
  const titleYearMap = new Map<string, typeof dbMovies>();
  dbMovies?.forEach(m => {
    if (m.title_en && m.release_year) {
      const key = `${m.title_en.toLowerCase()}_${m.release_year}`;
      if (!titleYearMap.has(key)) {
        titleYearMap.set(key, []);
      }
      titleYearMap.get(key)!.push(m);
    }
  });

  for (const [key, movies] of titleYearMap.entries()) {
    if (movies.length > 1) {
      issues.push({
        type: 'duplicate',
        movieId: movies[0].id,
        currentTitle: movies[0].title_en,
        confidence: 100,
        description: `Duplicate entries found for "${movies[0].title_en}" (${movies[0].release_year}): ${movies.length} entries`,
      });
    }
  }

  console.log(chalk.green(`   Found ${Array.from(titleYearMap.values()).filter(m => m.length > 1).length} duplicate groups\n`));

  return {
    totalMovies,
    issues,
    missingMovies,
    wrongData,
  };
}

async function generateReport(result: AuditResult): Promise<void> {
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  AUDIT REPORT'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════\n'));

  console.log(chalk.yellow(`Total movies in database: ${result.totalMovies}`));
  console.log(chalk.yellow(`Total issues found: ${result.issues.length}`));
  console.log(chalk.yellow(`Missing movies: ${result.missingMovies.length}\n`));

  // Group issues by type
  const byType = new Map<string, AuditIssue[]>();
  result.issues.forEach(issue => {
    if (!byType.has(issue.type)) {
      byType.set(issue.type, []);
    }
    byType.get(issue.type)!.push(issue);
  });

  console.log(chalk.cyan.bold('\nIssues by Type:'));
  for (const [type, issues] of byType.entries()) {
    console.log(chalk.yellow(`  ${type}: ${issues.length}`));
    issues.slice(0, 5).forEach(issue => {
      console.log(chalk.gray(`    - ${issue.description}`));
    });
    if (issues.length > 5) {
      console.log(chalk.gray(`    ... and ${issues.length - 5} more`));
    }
  }

  // Wrong data summary
  if (result.wrongData.length > 0) {
    console.log(chalk.red.bold('\n⚠️  Critical Wrong Data:'));
    result.wrongData.forEach(item => {
      console.log(chalk.red(`  - ${item.title}: ${item.issue}`));
    });
  }

  // Missing movies summary
  if (result.missingMovies.length > 0) {
    console.log(chalk.yellow.bold('\n📋 Missing Movies (from Wikipedia):'));
    result.missingMovies.slice(0, 20).forEach(movie => {
      console.log(chalk.gray(`  - ${movie.title} (${movie.year}) - ${movie.director} [${movie.language}]`));
    });
    if (result.missingMovies.length > 20) {
      console.log(chalk.gray(`  ... and ${result.missingMovies.length - 20} more`));
    }
  }

  // Export to CSV
  const csvRows: string[] = [];
  csvRows.push('Type,Movie ID,Current Title,Current Director,Current Role,Expected Title,Expected Director,Expected Role,Confidence,Description');
  
  result.issues.forEach(issue => {
    csvRows.push([
      issue.type,
      issue.movieId || '',
      `"${(issue.currentTitle || '').replace(/"/g, '""')}"`,
      `"${(issue.currentDirector || '').replace(/"/g, '""')}"`,
      `"${(issue.currentRole || '').replace(/"/g, '""')}"`,
      `"${(issue.expectedTitle || '').replace(/"/g, '""')}"`,
      `"${(issue.expectedDirector || '').replace(/"/g, '""')}"`,
      `"${(issue.expectedRole || '').replace(/"/g, '""')}"`,
      issue.confidence.toString(),
      `"${issue.description.replace(/"/g, '""')}"`,
    ].join(','));
  });

  const csvPath = path.join(process.cwd(), 'RAJINIKANTH-AUDIT-ISSUES.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf-8');
  console.log(chalk.green(`\n✅ Report saved to: ${csvPath}`));

  // Export missing movies
  if (result.missingMovies.length > 0) {
    const missingRows: string[] = [];
    missingRows.push('Title,Year,Director,Language');
    result.missingMovies.forEach(m => {
      missingRows.push([
        `"${m.title.replace(/"/g, '""')}"`,
        m.year.toString(),
        `"${m.director.replace(/"/g, '""')}"`,
        m.language,
      ].join(','));
    });
    const missingPath = path.join(process.cwd(), 'RAJINIKANTH-MISSING-MOVIES.csv');
    fs.writeFileSync(missingPath, missingRows.join('\n'), 'utf-8');
    console.log(chalk.green(`✅ Missing movies list saved to: ${missingPath}`));
  }
}

async function applyFixes(result: AuditResult, execute: boolean = false): Promise<void> {
  if (!execute) {
    console.log(chalk.yellow('\n⚠️  Dry run mode - no changes will be made'));
    console.log(chalk.yellow('   Use --execute flag to apply fixes\n'));
    return;
  }

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  APPLYING FIXES'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════\n'));

  let fixedCount = 0;
  let errorCount = 0;

  // Fix wrong titles (high confidence)
  const wrongTitleFixes = result.issues.filter(i => i.type === 'wrong_title' && i.confidence >= 90);
  for (const issue of wrongTitleFixes) {
    if (!issue.movieId || !issue.expectedTitle) continue;

    console.log(chalk.yellow(`Fixing: "${issue.currentTitle}" → "${issue.expectedTitle}"`));
    
    const { error } = await supabase
      .from('movies')
      .update({ title_en: issue.expectedTitle })
      .eq('id', issue.movieId);

    if (error) {
      console.error(chalk.red(`  ❌ Error: ${error.message}`));
      errorCount++;
    } else {
      console.log(chalk.green(`  ✅ Fixed`));
      fixedCount++;
    }
  }

  // Fix wrong directors (high confidence)
  const wrongDirectorFixes = result.issues.filter(i => i.type === 'wrong_director' && i.confidence >= 90);
  for (const issue of wrongDirectorFixes) {
    if (!issue.movieId || !issue.expectedDirector) continue;

    console.log(chalk.yellow(`Fixing director for "${issue.currentTitle}": "${issue.currentDirector}" → "${issue.expectedDirector}"`));
    
    const { error } = await supabase
      .from('movies')
      .update({ director: issue.expectedDirector })
      .eq('id', issue.movieId);

    if (error) {
      console.error(chalk.red(`  ❌ Error: ${error.message}`));
      errorCount++;
    } else {
      console.log(chalk.green(`  ✅ Fixed`));
      fixedCount++;
    }
  }

  // Fix wrong roles (remove Rajinikanth from director/producer where incorrect)
  const wrongRoleFixes = result.issues.filter(i => i.type === 'wrong_role' && i.confidence >= 85);
  for (const issue of wrongRoleFixes) {
    if (!issue.movieId) continue;

    const { data: movie } = await supabase
      .from('movies')
      .select('director, producer, hero')
      .eq('id', issue.movieId)
      .single();

    if (movie) {
      const updates: any = {};
      if (movie.director?.toLowerCase().includes('rajinikanth') && issue.expectedRole === 'Hero') {
        updates.director = null; // Remove from director
        if (!movie.hero?.toLowerCase().includes('rajinikanth')) {
          updates.hero = 'Rajinikanth'; // Add as hero
        }
      }
      if (movie.producer?.toLowerCase().includes('rajinikanth') && issue.expectedRole === 'Hero') {
        updates.producer = null; // Remove from producer
        if (!movie.hero?.toLowerCase().includes('rajinikanth')) {
          updates.hero = 'Rajinikanth'; // Add as hero
        }
      }

      if (Object.keys(updates).length > 0) {
        console.log(chalk.yellow(`Fixing roles for "${issue.currentTitle}"`));
        const { error } = await supabase
          .from('movies')
          .update(updates)
          .eq('id', issue.movieId);

        if (error) {
          console.error(chalk.red(`  ❌ Error: ${error.message}`));
          errorCount++;
        } else {
          console.log(chalk.green(`  ✅ Fixed`));
          fixedCount++;
        }
      }
    }
  }

  console.log(chalk.green.bold(`\n✅ Fixed: ${fixedCount}`));
  if (errorCount > 0) {
    console.log(chalk.red(`❌ Errors: ${errorCount}`));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const fix = args.includes('--fix');

  const result = await auditRajinikanthFilmography();
  await generateReport(result);

  if (fix) {
    await applyFixes(result, execute);
  } else {
    console.log(chalk.yellow('\n💡 To apply fixes, run with --fix --execute flags'));
  }

  console.log(chalk.green.bold('\n✨ Audit complete!\n'));
}

main().catch(console.error);
