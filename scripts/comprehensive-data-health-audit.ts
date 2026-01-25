#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { writeFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface HealthMetrics {
  totalMovies: number;
  withTeluguTitles: number;
  withoutTeluguTitles: number;
  withHero: number;
  withHeroine: number;
  withDirector: number;
  withReleaseYear: number;
  withRatings: number;
  withImages: number;
  published: number;
  unpublished: number;
  byYear: Record<string, number>;
  byLanguage: Record<string, number>;
  missingFields: {
    teluguTitle: string[];
    hero: string[];
    heroine: string[];
    director: string[];
    releaseYear: string[];
    images: string[];
  };
  dataQuality: {
    excellent: number;
    good: number;
    needs_work: number;
    critical: number;
  };
}

async function comprehensiveDataHealthAudit() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║          COMPREHENSIVE DATA HEALTH AUDIT                             ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.yellow('🔍 Fetching all movies from database...\n'));

  const { data: movies, error } = await supabase
    .from('movies')
    .select('*')
    .eq('language', 'Telugu')
    .order('release_year', { ascending: false, nullsFirst: false });

  if (error) {
    console.error(chalk.red('❌ Error fetching movies:'), error);
    return;
  }

  if (!movies || movies.length === 0) {
    console.log(chalk.red('❌ No movies found in database'));
    return;
  }

  console.log(chalk.green(`✓ Loaded ${movies.length} Telugu movies\n`));

  const metrics: HealthMetrics = {
    totalMovies: movies.length,
    withTeluguTitles: 0,
    withoutTeluguTitles: 0,
    withHero: 0,
    withHeroine: 0,
    withDirector: 0,
    withReleaseYear: 0,
    withRatings: 0,
    withImages: 0,
    published: 0,
    unpublished: 0,
    byYear: {},
    byLanguage: {},
    missingFields: {
      teluguTitle: [],
      hero: [],
      heroine: [],
      director: [],
      releaseYear: [],
      images: []
    },
    dataQuality: {
      excellent: 0,
      good: 0,
      needs_work: 0,
      critical: 0
    }
  };

  console.log(chalk.yellow('🔍 Analyzing data quality...\n'));

  for (const movie of movies) {
    // Telugu title check
    if (movie.title_te && movie.title_te.trim().length > 0) {
      metrics.withTeluguTitles++;
    } else {
      metrics.withoutTeluguTitles++;
      metrics.missingFields.teluguTitle.push(movie.slug);
    }

    // Cast & crew checks
    if (movie.hero && movie.hero.trim().length > 0 && movie.hero !== 'No Hero Lead') {
      metrics.withHero++;
    } else if (!movie.hero || movie.hero.trim().length === 0) {
      metrics.missingFields.hero.push(movie.slug);
    }

    if (movie.heroine && movie.heroine.trim().length > 0 && movie.heroine !== 'No Female Lead') {
      metrics.withHeroine++;
    } else if (!movie.heroine || movie.heroine.trim().length === 0) {
      metrics.missingFields.heroine.push(movie.slug);
    }

    if (movie.director && movie.director.trim().length > 0) {
      metrics.withDirector++;
    } else {
      metrics.missingFields.director.push(movie.slug);
    }

    // Release year
    if (movie.release_year) {
      metrics.withReleaseYear++;
      const year = movie.release_year.toString();
      metrics.byYear[year] = (metrics.byYear[year] || 0) + 1;
    } else {
      metrics.missingFields.releaseYear.push(movie.slug);
    }

    // Ratings
    if (movie.our_rating || movie.avg_rating) {
      metrics.withRatings++;
    }

    // Images
    if (movie.poster_path || movie.backdrop_path) {
      metrics.withImages++;
    } else {
      metrics.missingFields.images.push(movie.slug);
    }

    // Publication status
    if (movie.is_published) {
      metrics.published++;
    } else {
      metrics.unpublished++;
    }

    // Data quality score
    let qualityScore = 0;
    if (movie.title_te) qualityScore++;
    if (movie.hero) qualityScore++;
    if (movie.heroine) qualityScore++;
    if (movie.director) qualityScore++;
    if (movie.release_year) qualityScore++;
    if (movie.our_rating || movie.avg_rating) qualityScore++;
    if (movie.poster_path) qualityScore++;
    if (movie.synopsis_te || movie.synopsis_en) qualityScore++;

    if (qualityScore >= 7) metrics.dataQuality.excellent++;
    else if (qualityScore >= 5) metrics.dataQuality.good++;
    else if (qualityScore >= 3) metrics.dataQuality.needs_work++;
    else metrics.dataQuality.critical++;
  }

  // Generate report
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   OVERALL HEALTH METRICS                              '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green.bold('📊 DATABASE OVERVIEW:\n'));
  console.log(chalk.white(`   Total Movies: ${metrics.totalMovies}`));
  console.log(chalk.white(`   Published: ${metrics.published} (${Math.round(metrics.published/metrics.totalMovies*100)}%)`));
  console.log(chalk.white(`   Unpublished: ${metrics.unpublished} (${Math.round(metrics.unpublished/metrics.totalMovies*100)}%)\n`));

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   FIELD COMPLETENESS                                  '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  const tePercent = Math.round(metrics.withTeluguTitles/metrics.totalMovies*100);
  const heroPercent = Math.round(metrics.withHero/metrics.totalMovies*100);
  const heroinePercent = Math.round(metrics.withHeroine/metrics.totalMovies*100);
  const directorPercent = Math.round(metrics.withDirector/metrics.totalMovies*100);
  const yearPercent = Math.round(metrics.withReleaseYear/metrics.totalMovies*100);
  const ratingPercent = Math.round(metrics.withRatings/metrics.totalMovies*100);
  const imagePercent = Math.round(metrics.withImages/metrics.totalMovies*100);

  const printBar = (percent: number, label: string, count: number, total: number) => {
    const barLength = 40;
    const filled = Math.round((percent / 100) * barLength);
    const empty = barLength - filled;
    const color = percent >= 95 ? chalk.green : percent >= 80 ? chalk.yellow : chalk.red;
    const emoji = percent >= 95 ? '✅' : percent >= 80 ? '🟡' : '🔴';
    
    console.log(color(`${emoji} ${label.padEnd(20)} ${count}/${total} (${percent}%)`));
    console.log(color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty)));
    console.log('');
  };

  printBar(tePercent, 'Telugu Titles', metrics.withTeluguTitles, metrics.totalMovies);
  printBar(heroPercent, 'Hero', metrics.withHero, metrics.totalMovies);
  printBar(heroinePercent, 'Heroine', metrics.withHeroine, metrics.totalMovies);
  printBar(directorPercent, 'Director', metrics.withDirector, metrics.totalMovies);
  printBar(yearPercent, 'Release Year', metrics.withReleaseYear, metrics.totalMovies);
  printBar(ratingPercent, 'Ratings', metrics.withRatings, metrics.totalMovies);
  printBar(imagePercent, 'Images', metrics.withImages, metrics.totalMovies);

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   DATA QUALITY DISTRIBUTION                           '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  const excellentPercent = Math.round(metrics.dataQuality.excellent/metrics.totalMovies*100);
  const goodPercent = Math.round(metrics.dataQuality.good/metrics.totalMovies*100);
  const needsWorkPercent = Math.round(metrics.dataQuality.needs_work/metrics.totalMovies*100);
  const criticalPercent = Math.round(metrics.dataQuality.critical/metrics.totalMovies*100);

  console.log(chalk.green(`✅ EXCELLENT (7-8 fields): ${metrics.dataQuality.excellent} (${excellentPercent}%)`));
  console.log(chalk.yellow(`🟡 GOOD (5-6 fields): ${metrics.dataQuality.good} (${goodPercent}%)`));
  console.log(chalk.yellow(`⚠️  NEEDS WORK (3-4 fields): ${metrics.dataQuality.needs_work} (${needsWorkPercent}%)`));
  console.log(chalk.red(`🔴 CRITICAL (0-2 fields): ${metrics.dataQuality.critical} (${criticalPercent}%)\n`));

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   DISTRIBUTION BY YEAR                                '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  const sortedYears = Object.keys(metrics.byYear).sort((a, b) => parseInt(b) - parseInt(a));
  
  console.log(chalk.yellow('📅 Movies by Release Year:\n'));
  sortedYears.slice(0, 15).forEach(year => {
    const count = metrics.byYear[year];
    const barLength = Math.round((count / 200) * 30);
    console.log(chalk.cyan(`   ${year}: ${count.toString().padStart(3)} ${'█'.repeat(Math.max(1, barLength))}`));
  });

  if (sortedYears.length > 15) {
    console.log(chalk.gray(`   ... and ${sortedYears.length - 15} more years\n`));
  } else {
    console.log('');
  }

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   TOP ISSUES TO ADDRESS                               '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  const issues: Array<{priority: string, count: number, description: string, emoji: string}> = [];

  if (metrics.missingFields.teluguTitle.length > 0) {
    issues.push({
      priority: 'CRITICAL',
      count: metrics.missingFields.teluguTitle.length,
      description: 'Movies without Telugu titles',
      emoji: '🔴'
    });
  }

  if (metrics.missingFields.images.length > 0) {
    issues.push({
      priority: 'HIGH',
      count: metrics.missingFields.images.length,
      description: 'Movies without poster images',
      emoji: '🟠'
    });
  }

  if (metrics.missingFields.director.length > 0) {
    issues.push({
      priority: 'MEDIUM',
      count: metrics.missingFields.director.length,
      description: 'Movies without director info',
      emoji: '🟡'
    });
  }

  if (metrics.missingFields.hero.length > 0) {
    issues.push({
      priority: 'MEDIUM',
      count: metrics.missingFields.hero.length,
      description: 'Movies without hero info',
      emoji: '🟡'
    });
  }

  if (metrics.totalMovies - metrics.withRatings > 0) {
    issues.push({
      priority: 'LOW',
      count: metrics.totalMovies - metrics.withRatings,
      description: 'Movies without ratings',
      emoji: '🔵'
    });
  }

  if (metrics.unpublished > 0) {
    issues.push({
      priority: 'INFO',
      count: metrics.unpublished,
      description: 'Movies not yet published',
      emoji: '⚪'
    });
  }

  issues.sort((a, b) => {
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
    return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
  });

  issues.forEach((issue, index) => {
    const color = issue.priority === 'CRITICAL' ? chalk.red :
                  issue.priority === 'HIGH' ? chalk.yellow :
                  issue.priority === 'MEDIUM' ? chalk.yellow :
                  issue.priority === 'LOW' ? chalk.blue : chalk.gray;
    
    console.log(color(`${issue.emoji} ${index + 1}. [${issue.priority}] ${issue.description}: ${issue.count}`));
  });
  console.log('');

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   OVERALL HEALTH SCORE                                '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  // Calculate overall health score (0-100)
  const healthScore = Math.round(
    (tePercent * 0.3) +
    (heroPercent * 0.15) +
    (heroinePercent * 0.10) +
    (directorPercent * 0.15) +
    (yearPercent * 0.10) +
    (ratingPercent * 0.10) +
    (imagePercent * 0.10)
  );

  const scoreColor = healthScore >= 90 ? chalk.green : 
                      healthScore >= 75 ? chalk.yellow : 
                      chalk.red;

  const scoreEmoji = healthScore >= 90 ? '🟢' : 
                      healthScore >= 75 ? '🟡' : 
                      '🔴';

  console.log(scoreColor.bold(`${scoreEmoji} Overall Health Score: ${healthScore}/100\n`));

  const healthBar = Math.round(healthScore / 2);
  console.log(scoreColor('█'.repeat(healthBar)) + chalk.gray('░'.repeat(50 - healthBar)) + ` ${healthScore}%\n`);

  let healthGrade = '';
  if (healthScore >= 95) healthGrade = 'A+ (Excellent)';
  else if (healthScore >= 90) healthGrade = 'A (Very Good)';
  else if (healthScore >= 85) healthGrade = 'B+ (Good)';
  else if (healthScore >= 80) healthGrade = 'B (Above Average)';
  else if (healthScore >= 75) healthGrade = 'C+ (Average)';
  else if (healthScore >= 70) healthGrade = 'C (Below Average)';
  else healthGrade = 'D (Needs Work)';

  console.log(chalk.magenta.bold(`📊 Database Grade: ${healthGrade}\n`));

  // Generate detailed report
  const reportLines: string[] = [];
  reportLines.push('# COMPREHENSIVE DATA HEALTH AUDIT REPORT');
  reportLines.push(`**Date:** ${new Date().toISOString().slice(0, 10)}`);
  reportLines.push(`**Database:** Telugu Movies Portal`);
  reportLines.push(`**Total Movies:** ${metrics.totalMovies}\n`);
  reportLines.push('---\n');

  reportLines.push('## Executive Summary\n');
  reportLines.push(`**Overall Health Score:** ${healthScore}/100 (Grade: ${healthGrade})\n`);
  reportLines.push('### Key Metrics:\n');
  reportLines.push(`- ✅ Telugu Titles: ${metrics.withTeluguTitles}/${metrics.totalMovies} (${tePercent}%)`);
  reportLines.push(`- ✅ With Hero: ${metrics.withHero}/${metrics.totalMovies} (${heroPercent}%)`);
  reportLines.push(`- ✅ With Heroine: ${metrics.withHeroine}/${metrics.totalMovies} (${heroinePercent}%)`);
  reportLines.push(`- ✅ With Director: ${metrics.withDirector}/${metrics.totalMovies} (${directorPercent}%)`);
  reportLines.push(`- ✅ With Release Year: ${metrics.withReleaseYear}/${metrics.totalMovies} (${yearPercent}%)`);
  reportLines.push(`- ✅ With Ratings: ${metrics.withRatings}/${metrics.totalMovies} (${ratingPercent}%)`);
  reportLines.push(`- ✅ With Images: ${metrics.withImages}/${metrics.totalMovies} (${imagePercent}%)\n`);
  reportLines.push('---\n');

  reportLines.push('## Data Quality Distribution\n');
  reportLines.push(`- 🟢 **Excellent** (7-8 fields): ${metrics.dataQuality.excellent} (${excellentPercent}%)`);
  reportLines.push(`- 🟡 **Good** (5-6 fields): ${metrics.dataQuality.good} (${goodPercent}%)`);
  reportLines.push(`- 🟠 **Needs Work** (3-4 fields): ${metrics.dataQuality.needs_work} (${needsWorkPercent}%)`);
  reportLines.push(`- 🔴 **Critical** (0-2 fields): ${metrics.dataQuality.critical} (${criticalPercent}%)\n`);
  reportLines.push('---\n');

  reportLines.push('## Publication Status\n');
  reportLines.push(`- **Published:** ${metrics.published} (${Math.round(metrics.published/metrics.totalMovies*100)}%)`);
  reportLines.push(`- **Unpublished:** ${metrics.unpublished} (${Math.round(metrics.unpublished/metrics.totalMovies*100)}%)\n`);
  reportLines.push('---\n');

  reportLines.push('## Missing Fields Summary\n');
  reportLines.push(`- Telugu Titles Missing: ${metrics.missingFields.teluguTitle.length}`);
  reportLines.push(`- Hero Missing: ${metrics.missingFields.hero.length}`);
  reportLines.push(`- Heroine Missing: ${metrics.missingFields.heroine.length}`);
  reportLines.push(`- Director Missing: ${metrics.missingFields.director.length}`);
  reportLines.push(`- Release Year Missing: ${metrics.missingFields.releaseYear.length}`);
  reportLines.push(`- Images Missing: ${metrics.missingFields.images.length}\n`);
  reportLines.push('---\n');

  reportLines.push('## Top Priority Actions\n');
  issues.slice(0, 5).forEach((issue, index) => {
    reportLines.push(`${index + 1}. **[${issue.priority}]** ${issue.description}: ${issue.count} movies`);
  });
  reportLines.push('\n---\n');

  reportLines.push('## Distribution by Year\n');
  sortedYears.slice(0, 20).forEach(year => {
    reportLines.push(`- ${year}: ${metrics.byYear[year]} movies`);
  });
  reportLines.push('\n---\n');

  if (metrics.missingFields.teluguTitle.length > 0) {
    reportLines.push('## Movies Without Telugu Titles\n');
    metrics.missingFields.teluguTitle.slice(0, 50).forEach(slug => {
      const movie = movies.find(m => m.slug === slug);
      if (movie) {
        reportLines.push(`- ${movie.title_en} (\`${slug}\`) - ${movie.release_year || 'Unknown'}`);
      }
    });
    if (metrics.missingFields.teluguTitle.length > 50) {
      reportLines.push(`\n... and ${metrics.missingFields.teluguTitle.length - 50} more\n`);
    }
    reportLines.push('\n---\n');
  }

  if (metrics.missingFields.images.length > 0 && metrics.missingFields.images.length <= 30) {
    reportLines.push('## Movies Without Images (High Priority)\n');
    metrics.missingFields.images.forEach(slug => {
      const movie = movies.find(m => m.slug === slug);
      if (movie) {
        reportLines.push(`- ${movie.title_en} (\`${slug}\`) - ${movie.release_year || 'Unknown'}`);
      }
    });
    reportLines.push('\n---\n');
  }

  const reportFile = 'DATA-HEALTH-AUDIT-REPORT-2026-01-15.md';
  writeFileSync(reportFile, reportLines.join('\n'));

  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   RECOMMENDATIONS                                     '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  if (healthScore >= 90) {
    console.log(chalk.green.bold('🎉 DATABASE HEALTH: EXCELLENT!\n'));
    console.log(chalk.white('Your database is in excellent condition. Minor improvements suggested:\n'));
  } else if (healthScore >= 75) {
    console.log(chalk.yellow.bold('🟡 DATABASE HEALTH: GOOD\n'));
    console.log(chalk.white('Your database is in good condition but could use improvements:\n'));
  } else {
    console.log(chalk.red.bold('🔴 DATABASE HEALTH: NEEDS ATTENTION\n'));
    console.log(chalk.white('Your database needs significant improvements:\n'));
  }

  if (metrics.missingFields.teluguTitle.length > 0) {
    console.log(chalk.red(`   🔴 Priority 1: Fill ${metrics.missingFields.teluguTitle.length} missing Telugu titles`));
  }
  if (metrics.missingFields.images.length > 20) {
    console.log(chalk.yellow(`   🟡 Priority 2: Add poster images to ${metrics.missingFields.images.length} movies`));
  }
  if (metrics.totalMovies - metrics.withRatings > 100) {
    console.log(chalk.blue(`   🔵 Priority 3: Add ratings to ${metrics.totalMovies - metrics.withRatings} movies`));
  }
  if (metrics.unpublished > 100) {
    console.log(chalk.gray(`   ⚪ Priority 4: Review ${metrics.unpublished} unpublished movies for publication`));
  }

  console.log('');
  console.log(chalk.green(`✅ Report generated: ${reportFile}\n`));

  console.log(chalk.magenta.bold('🎊 AUDIT COMPLETE! 🎊\n'));
}

comprehensiveDataHealthAudit().catch(console.error);
