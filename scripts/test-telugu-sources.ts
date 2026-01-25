#!/usr/bin/env npx tsx
/**
 * TEST SUITE FOR TELUGU DATA SOURCES
 * 
 * Tests all 15 Telugu-specific scrapers to verify they work correctly.
 * 
 * Usage:
 *   npx tsx scripts/test-telugu-sources.ts
 *   npx tsx scripts/test-telugu-sources.ts --source=letterboxd
 *   npx tsx scripts/test-telugu-sources.ts --movie="Gopala Gopala"
 */

import chalk from 'chalk';
import { scrapeLetterboxdCredits } from './lib/letterboxd-scraper';
import { scrapeRottenTomatoesCredits } from './lib/rottentomatoes-scraper';
import { scrapeIdlebrainCredits } from './lib/idlebrain-scraper';
import { scrapeGreatAndhraCredits } from './lib/greatandhra-scraper';
import { scrapeCineJoshCredits } from './lib/cinejosh-scraper';
import { scrapeBookMyShowCredits } from './lib/bookmyshow-scraper';
import { scrapeTupakiCredits } from './lib/tupaki-scraper';
import { scrape123TeluguCredits } from './lib/123telugu-scraper';
import { scrapeTeluguCinemaCredits } from './lib/telugucinema-scraper';
import { scrapeFilmiBeatCredits } from './lib/filmibeat-scraper';
import { scrapeM9NewsCredits } from './lib/m9news-scraper';
import { scrapeEenaduCredits } from './lib/eenadu-scraper';
import { scrapeSakshiCredits } from './lib/sakshi-scraper';
import { scrapeGulteCredits } from './lib/gulte-scraper';
import { scrapeTelugu360Credits } from './lib/telugu360-scraper';

// Test movies (covering different years and genres)
const TEST_MOVIES = [
  { title: 'Gopala Gopala', year: 2015 },
  { title: 'Baahubali', year: 2015 },
  { title: 'Arjun Reddy', year: 2017 },
  { title: 'Mahanati', year: 2018 },
  { title: 'Jersey', year: 2019 },
];

// Source configurations
interface SourceConfig {
  name: string;
  scraper: (title: string, year: number) => Promise<any>;
  confidence: number;
  enabled: boolean;
}

const SOURCES: SourceConfig[] = [
  { name: 'Letterboxd', scraper: scrapeLetterboxdCredits, confidence: 0.92, enabled: true },
  { name: 'RottenTomatoes', scraper: scrapeRottenTomatoesCredits, confidence: 0.90, enabled: true },
  { name: 'IdleBrain', scraper: scrapeIdlebrainCredits, confidence: 0.88, enabled: true },
  { name: 'BookMyShow', scraper: scrapeBookMyShowCredits, confidence: 0.88, enabled: true },
  { name: 'Eenadu', scraper: scrapeEenaduCredits, confidence: 0.86, enabled: true },
  { name: 'GreatAndhra', scraper: scrapeGreatAndhraCredits, confidence: 0.85, enabled: true },
  { name: 'Sakshi', scraper: scrapeSakshiCredits, confidence: 0.84, enabled: true },
  { name: 'Tupaki', scraper: scrapeTupakiCredits, confidence: 0.83, enabled: true },
  { name: 'Gulte', scraper: scrapeGulteCredits, confidence: 0.82, enabled: true },
  { name: 'CineJosh', scraper: scrapeCineJoshCredits, confidence: 0.82, enabled: true },
  { name: '123Telugu', scraper: scrape123TeluguCredits, confidence: 0.81, enabled: true },
  { name: 'Telugu360', scraper: scrapeTelugu360Credits, confidence: 0.80, enabled: true },
  { name: 'TeluguCinema', scraper: scrapeTeluguCinemaCredits, confidence: 0.79, enabled: true },
  { name: 'FilmiBeat', scraper: scrapeFilmiBeatCredits, confidence: 0.77, enabled: true },
  { name: 'M9News', scraper: scrapeM9NewsCredits, confidence: 0.75, enabled: true },
];

// CLI Arguments
const args = process.argv.slice(2);
const getArg = (name: string): string | null => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};

const SOURCE_FILTER = getArg('source');
const MOVIE_FILTER = getArg('movie');

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

interface TestResult {
  source: string;
  movie: string;
  year: number;
  success: boolean;
  dataQuality: {
    hasDirector: boolean;
    hasCast: boolean;
    hasCrew: boolean;
    crewFields: string[];
  };
  confidence: number;
  duration: number;
  error?: string;
}

async function testSource(
  source: SourceConfig,
  movie: { title: string; year: number }
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log(chalk.gray(`  Testing ${source.name} for ${movie.title} (${movie.year})...`));
    
    const credits = await source.scraper(movie.title, movie.year);
    const duration = Date.now() - startTime;
    
    if (!credits) {
      return {
        source: source.name,
        movie: movie.title,
        year: movie.year,
        success: false,
        dataQuality: {
          hasDirector: false,
          hasCast: false,
          hasCrew: false,
          crewFields: [],
        },
        confidence: source.confidence,
        duration,
        error: 'No credits found',
      };
    }
    
    // Analyze data quality
    const hasDirector = !!(credits.director && credits.director.length > 0);
    const hasCast = !!(credits.cast && credits.cast.length > 0);
    const crewFields: string[] = [];
    
    if (credits.crew) {
      if (credits.crew.cinematographer) crewFields.push('cinematographer');
      if (credits.crew.editor) crewFields.push('editor');
      if (credits.crew.writer) crewFields.push('writer');
      if (credits.crew.producer) crewFields.push('producer');
      if (credits.crew.musicDirector) crewFields.push('musicDirector');
    }
    
    const hasCrew = crewFields.length > 0;
    
    return {
      source: source.name,
      movie: movie.title,
      year: movie.year,
      success: true,
      dataQuality: {
        hasDirector,
        hasCast,
        hasCrew,
        crewFields,
      },
      confidence: source.confidence,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      source: source.name,
      movie: movie.title,
      year: movie.year,
      success: false,
      dataQuality: {
        hasDirector: false,
        hasCast: false,
        hasCrew: false,
        crewFields: [],
      },
      confidence: source.confidence,
      duration,
      error: error.message || String(error),
    };
  }
}

function printTestResult(result: TestResult): void {
  const status = result.success ? chalk.green('✓') : chalk.red('✗');
  const duration = chalk.gray(`(${result.duration}ms)`);
  
  console.log(`  ${status} ${result.source} ${duration}`);
  
  if (result.success) {
    const quality = result.dataQuality;
    const directorStatus = quality.hasDirector ? chalk.green('✓') : chalk.gray('-');
    const castStatus = quality.hasCast ? chalk.green('✓') : chalk.gray('-');
    const crewStatus = quality.hasCrew ? chalk.green('✓') : chalk.gray('-');
    
    console.log(`    ${directorStatus} Director  ${castStatus} Cast  ${crewStatus} Crew`);
    
    if (quality.crewFields.length > 0) {
      console.log(`    Crew fields: ${chalk.cyan(quality.crewFields.join(', '))}`);
    }
  } else if (result.error) {
    console.log(`    ${chalk.red('Error:')} ${result.error}`);
  }
}

function printSummary(results: TestResult[]): void {
  console.log(chalk.bold(`\n${'='.repeat(80)}`));
  console.log(chalk.bold('TEST SUMMARY'));
  console.log(chalk.bold(`${'='.repeat(80)}\n`));
  
  // Overall stats
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.success).length;
  const successRate = (successfulTests / totalTests * 100).toFixed(1);
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Successful:  ${chalk.green(successfulTests)} (${successRate}%)`);
  console.log(`Failed:      ${chalk.red(totalTests - successfulTests)}`);
  console.log('');
  
  // Per-source stats
  console.log(chalk.bold('Per-Source Results:'));
  console.log('');
  
  const sourceStats = SOURCES.map(source => {
    const sourceResults = results.filter(r => r.source === source.name);
    const successful = sourceResults.filter(r => r.success).length;
    const total = sourceResults.length;
    const rate = total > 0 ? (successful / total * 100).toFixed(1) : '0.0';
    const avgDuration = total > 0 
      ? (sourceResults.reduce((sum, r) => sum + r.duration, 0) / total).toFixed(0)
      : '0';
    
    // Data quality analysis
    const withDirector = sourceResults.filter(r => r.dataQuality.hasDirector).length;
    const withCast = sourceResults.filter(r => r.dataQuality.hasCast).length;
    const withCrew = sourceResults.filter(r => r.dataQuality.hasCrew).length;
    
    return {
      name: source.name,
      successful,
      total,
      rate,
      avgDuration,
      withDirector,
      withCast,
      withCrew,
      confidence: source.confidence,
    };
  }).sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));
  
  for (const stat of sourceStats) {
    const rateColor = parseFloat(stat.rate) >= 80 ? chalk.green : 
                     parseFloat(stat.rate) >= 50 ? chalk.yellow : chalk.red;
    
    console.log(`${chalk.bold(stat.name.padEnd(20))} ${rateColor(`${stat.rate}%`.padEnd(6))} (${stat.successful}/${stat.total})`);
    console.log(`  Avg Duration: ${stat.avgDuration}ms`);
    console.log(`  Confidence:   ${(stat.confidence * 100).toFixed(0)}%`);
    console.log(`  Data Quality: Director=${stat.withDirector}  Cast=${stat.withCast}  Crew=${stat.withCrew}`);
    console.log('');
  }
  
  // Recommendations
  console.log(chalk.bold('Recommendations:'));
  console.log('');
  
  const lowPerformers = sourceStats.filter(s => parseFloat(s.rate) < 50);
  if (lowPerformers.length > 0) {
    console.log(chalk.yellow('⚠ Low performing sources (< 50% success):'));
    lowPerformers.forEach(s => {
      console.log(`  - ${s.name}: Consider checking URL patterns or HTML selectors`);
    });
    console.log('');
  }
  
  const slowSources = sourceStats.filter(s => parseInt(s.avgDuration) > 3000);
  if (slowSources.length > 0) {
    console.log(chalk.yellow('⚠ Slow sources (> 3s avg):'));
    slowSources.forEach(s => {
      console.log(`  - ${s.name}: Consider implementing caching or rate limit optimization`);
    });
    console.log('');
  }
  
  const highPerformers = sourceStats.filter(s => parseFloat(s.rate) >= 80);
  if (highPerformers.length > 0) {
    console.log(chalk.green('✓ High performing sources (≥ 80% success):'));
    highPerformers.forEach(s => {
      console.log(`  - ${s.name}: Excellent data coverage`);
    });
    console.log('');
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  console.log(chalk.bold.cyan('\n🎬 Telugu Data Sources Test Suite\n'));
  
  // Filter sources if specified
  const sourcesToTest = SOURCE_FILTER
    ? SOURCES.filter(s => s.name.toLowerCase() === SOURCE_FILTER.toLowerCase())
    : SOURCES;
  
  if (sourcesToTest.length === 0) {
    console.error(chalk.red(`Source "${SOURCE_FILTER}" not found`));
    process.exit(1);
  }
  
  // Filter movies if specified
  const moviesToTest = MOVIE_FILTER
    ? TEST_MOVIES.filter(m => m.title.toLowerCase().includes(MOVIE_FILTER.toLowerCase()))
    : TEST_MOVIES;
  
  if (moviesToTest.length === 0) {
    console.error(chalk.red(`Movie "${MOVIE_FILTER}" not found`));
    process.exit(1);
  }
  
  console.log(chalk.gray(`Testing ${sourcesToTest.length} sources with ${moviesToTest.length} movies...\n`));
  
  const results: TestResult[] = [];
  
  // Test each movie with each source
  for (const movie of moviesToTest) {
    console.log(chalk.bold(`\n${movie.title} (${movie.year})`));
    console.log(chalk.gray('-'.repeat(80)));
    
    for (const source of sourcesToTest) {
      if (!source.enabled) {
        console.log(chalk.gray(`  ⊘ ${source.name} (disabled)`));
        continue;
      }
      
      const result = await testSource(source, movie);
      results.push(result);
      printTestResult(result);
      
      // Rate limiting between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Print summary
  printSummary(results);
  
  // Exit with appropriate code
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
