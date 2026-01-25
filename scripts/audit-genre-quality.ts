#!/usr/bin/env npx tsx
/**
 * Genre Quality Audit
 * 
 * Analyzes the quality of genre assignments across all 7,398 movies
 * Identifies suspicious patterns, generic classifications, and improvements needed
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Movie {
  id: string;
  title_en: string;
  release_year: number;
  genres: string[];
  tmdb_id: number;
  slug: string;
  director?: string;
  hero?: string;
}

interface QualityIssue {
  category: string;
  severity: 'high' | 'medium' | 'low';
  count: number;
  movies: Movie[];
  description: string;
}

async function getAllMovies(): Promise<Movie[]> {
  const { data, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, genres, tmdb_id, slug, director, hero')
    .order('release_year', { ascending: false });

  if (error) {
    console.error('Error fetching movies:', error);
    return [];
  }

  return data as Movie[];
}

function analyzeGenreQuality(movies: Movie[]): QualityIssue[] {
  const issues: QualityIssue[] = [];

  // 1. Movies with too many genres (>3)
  const tooManyGenres = movies.filter(m => m.genres && m.genres.length > 3);
  if (tooManyGenres.length > 0) {
    issues.push({
      category: 'Too Many Genres',
      severity: 'medium',
      count: tooManyGenres.length,
      movies: tooManyGenres.slice(0, 50),
      description: 'Movies with more than 3 genres - should be simplified to 1-2 main genres'
    });
  }

  // 2. Movies with only generic "Drama" genre
  const onlyDrama = movies.filter(m => 
    m.genres && m.genres.length === 1 && m.genres[0] === 'Drama'
  );
  if (onlyDrama.length > 0) {
    issues.push({
      category: 'Generic Drama Only',
      severity: 'medium',
      count: onlyDrama.length,
      movies: onlyDrama.slice(0, 50),
      description: 'Movies with only "Drama" genre - likely need more specific classification'
    });
  }

  // 3. Suspicious genre combinations
  const suspiciousCombos = movies.filter(m => {
    if (!m.genres || m.genres.length === 0) return false;
    const genres = m.genres.map(g => g.toLowerCase());
    
    // Horror + Comedy (rare combination)
    if (genres.includes('horror') && genres.includes('comedy')) return true;
    
    // Romance + Horror (unusual)
    if (genres.includes('romance') && genres.includes('horror')) return true;
    
    // Documentary + Action (doesn't make sense)
    if (genres.includes('documentary') && genres.includes('action')) return true;
    
    return false;
  });
  
  if (suspiciousCombos.length > 0) {
    issues.push({
      category: 'Suspicious Combinations',
      severity: 'high',
      count: suspiciousCombos.length,
      movies: suspiciousCombos,
      description: 'Unusual genre combinations that may indicate errors'
    });
  }

  // 4. Non-standard genre names
  const validGenres = new Set([
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
    'Romance', 'Science Fiction', 'Thriller', 'War', 'Western',
    // Telugu-specific
    'Devotional', 'Mythological', 'Social', 'Political', 'Period', 'Musical'
  ]);

  const nonStandardGenres: Movie[] = [];
  const genreFrequency: Record<string, number> = {};

  movies.forEach(movie => {
    if (!movie.genres) return;
    movie.genres.forEach(genre => {
      genreFrequency[genre] = (genreFrequency[genre] || 0) + 1;
      if (!validGenres.has(genre)) {
        nonStandardGenres.push(movie);
      }
    });
  });

  if (nonStandardGenres.length > 0) {
    issues.push({
      category: 'Non-Standard Genres',
      severity: 'high',
      count: nonStandardGenres.length,
      movies: nonStandardGenres.slice(0, 50),
      description: 'Movies with genre names that don\'t match standard classifications'
    });
  }

  // 5. Recent movies (2020+) with poor genre data
  const recentPoorGenres = movies.filter(m => 
    m.release_year >= 2020 && 
    (!m.genres || m.genres.length === 0 || 
     (m.genres.length === 1 && m.genres[0] === 'Drama'))
  );
  
  if (recentPoorGenres.length > 0) {
    issues.push({
      category: 'Recent Movies - Poor Genres',
      severity: 'high',
      count: recentPoorGenres.length,
      movies: recentPoorGenres,
      description: 'Recent movies (2020+) with missing or generic genre data'
    });
  }

  // 6. Popular directors with inconsistent genres
  const directorGenres: Record<string, Set<string>> = {};
  movies.forEach(movie => {
    if (movie.director && movie.genres) {
      if (!directorGenres[movie.director]) {
        directorGenres[movie.director] = new Set();
      }
      movie.genres.forEach(g => directorGenres[movie.director].add(g));
    }
  });

  // 7. Movies with TMDB but generic genres (missed enrichment opportunities)
  const tmdbButGeneric = movies.filter(m => 
    m.tmdb_id && 
    m.genres && 
    (m.genres.length === 1 && ['Drama', 'Action'].includes(m.genres[0]))
  );
  
  if (tmdbButGeneric.length > 0) {
    issues.push({
      category: 'TMDB Available - Generic Genres',
      severity: 'medium',
      count: tmdbButGeneric.length,
      movies: tmdbButGeneric.slice(0, 100),
      description: 'Movies with TMDB IDs but only generic single genre - can be enriched from TMDB'
    });
  }

  // 8. Empty or null genres (should be 0 now, but check)
  const emptyGenres = movies.filter(m => !m.genres || m.genres.length === 0);
  if (emptyGenres.length > 0) {
    issues.push({
      category: 'Empty Genres',
      severity: 'high',
      count: emptyGenres.length,
      movies: emptyGenres,
      description: 'Movies with no genre data at all'
    });
  }

  return issues;
}

async function runQualityAudit() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   GENRE QUALITY AUDIT                                 ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.white('  Phase 1: Fetching all movies...'));
  const movies = await getAllMovies();
  console.log(chalk.green(`  ✓ Loaded ${movies.length.toLocaleString()} movies\n`));

  console.log(chalk.white('  Phase 2: Analyzing genre quality...'));
  const issues = analyzeGenreQuality(movies);
  console.log(chalk.green(`  ✓ Identified ${issues.length} quality issue categories\n`));

  // Display summary
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   QUALITY ISSUES SUMMARY                              ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  let totalIssues = 0;
  issues.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  issues.forEach((issue, idx) => {
    totalIssues += issue.count;
    const severityColor = issue.severity === 'high' ? chalk.red : 
                          issue.severity === 'medium' ? chalk.yellow : chalk.gray;
    const severityLabel = issue.severity.toUpperCase().padEnd(6);
    
    console.log(severityColor(`  ${(idx + 1).toString().padStart(2)}. [${severityLabel}] ${issue.category}`));
    console.log(chalk.white(`      ${issue.count.toLocaleString()} movies affected`));
    console.log(chalk.gray(`      ${issue.description}\n`));
  });

  console.log(chalk.white(`  Total issues: ${chalk.cyan(totalIssues.toLocaleString())} movies need attention\n`));

  // Generate detailed reports
  console.log(chalk.white('  Phase 3: Generating detailed reports...\n'));

  // Report 1: High Priority Issues
  const highPriorityReport = generateHighPriorityReport(issues);
  const highPriorityPath = './docs/manual-review/GENRE-AUDIT-HIGH-PRIORITY.md';
  writeFileSync(highPriorityPath, highPriorityReport);
  console.log(chalk.green(`  ✓ High priority report: ${highPriorityPath}`));

  // Report 2: All Issues CSV
  const csvReport = generateCSVReport(issues);
  const csvPath = './docs/manual-review/GENRE-AUDIT-ALL-ISSUES.csv';
  writeFileSync(csvPath, csvReport);
  console.log(chalk.green(`  ✓ CSV report: ${csvPath}`));

  // Report 3: Genre Statistics
  const statsReport = generateGenreStats(movies);
  const statsPath = './docs/manual-review/GENRE-AUDIT-STATISTICS.md';
  writeFileSync(statsPath, statsReport);
  console.log(chalk.green(`  ✓ Statistics report: ${statsPath}`));

  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   AUDIT COMPLETE                                      ║
╚═══════════════════════════════════════════════════════════════════════╝

  Total Movies Analyzed:    ${movies.length.toLocaleString()}
  Issues Identified:        ${totalIssues.toLocaleString()}
  Quality Score:            ${((1 - totalIssues / movies.length) * 100).toFixed(1)}%

  Next Steps:
  1. Review high-priority issues (${issues.filter(i => i.severity === 'high').map(i => i.count).reduce((a, b) => a + b, 0)} movies)
  2. Fix non-standard genre names
  3. Enrich movies with TMDB data
  4. Refine generic "Drama" classifications

  📊 Reports Generated:
     - GENRE-AUDIT-HIGH-PRIORITY.md (action items)
     - GENRE-AUDIT-ALL-ISSUES.csv (full list)
     - GENRE-AUDIT-STATISTICS.md (analysis)

`));
}

function generateHighPriorityReport(issues: QualityIssue[]): string {
  const highPriority = issues.filter(i => i.severity === 'high');
  
  let report = `# Genre Quality Audit - High Priority Issues
**Generated:** ${new Date().toISOString()}

## Summary

${highPriority.length} high-priority issue categories identified requiring immediate attention.

---

`;

  highPriority.forEach((issue, idx) => {
    report += `## ${idx + 1}. ${issue.category} (${issue.count} movies)\n\n`;
    report += `**Severity:** HIGH 🔴\n\n`;
    report += `**Description:** ${issue.description}\n\n`;
    report += `**Sample Movies:**\n\n`;
    
    issue.movies.slice(0, 20).forEach((movie, mIdx) => {
      report += `${mIdx + 1}. **${movie.title_en}** (${movie.release_year})\n`;
      report += `   - Genres: [${movie.genres?.join(', ') || 'None'}]\n`;
      report += `   - URL: http://localhost:3000/movies/${movie.slug}\n`;
      if (movie.tmdb_id) {
        report += `   - TMDB: ${movie.tmdb_id}\n`;
      }
      report += `\n`;
    });
    
    if (issue.movies.length > 20) {
      report += `... and ${issue.movies.length - 20} more\n\n`;
    }
    
    report += `---\n\n`;
  });

  return report;
}

function generateCSVReport(issues: QualityIssue[]): string {
  let csv = 'Category,Severity,Title,Year,Genres,TMDB_ID,Slug,URL\n';
  
  issues.forEach(issue => {
    issue.movies.forEach(movie => {
      const genres = movie.genres?.join('; ') || '';
      csv += `"${issue.category}","${issue.severity}","${movie.title_en}",${movie.release_year},"${genres}",${movie.tmdb_id || ''},"${movie.slug}","http://localhost:3000/movies/${movie.slug}"\n`;
    });
  });
  
  return csv;
}

function generateGenreStats(movies: Movie[]): string {
  const genreCount: Record<string, number> = {};
  const genreByDecade: Record<string, Record<string, number>> = {};
  
  movies.forEach(movie => {
    if (!movie.genres) return;
    
    const decade = Math.floor(movie.release_year / 10) * 10;
    if (!genreByDecade[decade]) {
      genreByDecade[decade] = {};
    }
    
    movie.genres.forEach(genre => {
      genreCount[genre] = (genreCount[genre] || 0) + 1;
      genreByDecade[decade][genre] = (genreByDecade[decade][genre] || 0) + 1;
    });
  });

  let report = `# Genre Statistics Report
**Generated:** ${new Date().toISOString()}

## Overall Genre Distribution

| Genre | Count | Percentage |
|-------|-------|------------|
`;

  const totalGenreAssignments = Object.values(genreCount).reduce((a, b) => a + b, 0);
  
  Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([genre, count]) => {
      const percent = ((count / totalGenreAssignments) * 100).toFixed(1);
      report += `| ${genre} | ${count.toLocaleString()} | ${percent}% |\n`;
    });

  report += `\n**Total Genre Assignments:** ${totalGenreAssignments.toLocaleString()}\n`;
  report += `**Average Genres per Movie:** ${(totalGenreAssignments / movies.length).toFixed(2)}\n\n`;

  report += `## Genre Distribution by Decade\n\n`;
  
  Object.entries(genreByDecade)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .forEach(([decade, genres]) => {
      report += `### ${decade}s\n\n`;
      report += `| Genre | Count |\n`;
      report += `|-------|-------|\n`;
      Object.entries(genres)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([genre, count]) => {
          report += `| ${genre} | ${count} |\n`;
        });
      report += `\n`;
    });

  return report;
}

runQualityAudit();
