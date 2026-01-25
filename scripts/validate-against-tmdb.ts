#!/usr/bin/env npx tsx
/**
 * TMDB-ONLY VALIDATION
 * Validates movies with tmdb_id against TMDB API data
 * Fast and reliable - uses API with good rate limits
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

interface Movie {
  id: string;
  slug: string;
  title_en: string;
  release_year: number | null;
  hero: string | null;
  heroine: string | null;
  director: string | null;
  tmdb_id: number;
}

interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  credits?: {
    cast: Array<{ name: string; character: string; order: number; gender: number }>;
    crew: Array<{ name: string; job: string; department: string }>;
  };
}

interface Anomaly {
  id: string;
  slug: string;
  title: string;
  year: number | null;
  tmdb_id: number;
  field: string;
  db_value: string;
  tmdb_value: string;
  confidence: number;
  action: string;
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchTMDBMovie(tmdbId: number): Promise<TMDBMovie | null> {
  try {
    const res = await fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchMoviesWithTMDB(): Promise<Movie[]> {
  console.log(chalk.blue('📊 Fetching movies with TMDB IDs...'));
  let all: Movie[] = [];
  let offset = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, slug, title_en, release_year, hero, heroine, director, tmdb_id')
      .eq('is_published', true)
      .not('tmdb_id', 'is', null)
      .range(offset, offset + 999);
    
    if (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      break;
    }
    if (!data?.length) break;
    all = all.concat(data as Movie[]);
    if (data.length < 1000) break;
    offset += 1000;
  }
  
  console.log(`   Found ${all.length} movies with TMDB IDs\n`);
  return all;
}

const normalize = (s: string | null | undefined): string => 
  (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

async function validateAgainstTMDB(movies: Movie[], limit: number): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  const toProcess = limit > 0 ? movies.slice(0, limit) : movies;
  
  console.log(chalk.blue(`🔍 Validating ${toProcess.length} movies against TMDB...`));
  console.log('   (Rate limited to 40 req/10s)\n');
  
  let processed = 0;
  
  for (const movie of toProcess) {
    const tmdbData = await fetchTMDBMovie(movie.tmdb_id);
    
    if (!tmdbData) {
      anomalies.push({
        id: movie.id, slug: movie.slug, title: movie.title_en, year: movie.release_year,
        tmdb_id: movie.tmdb_id, field: 'tmdb_id', db_value: String(movie.tmdb_id),
        tmdb_value: 'NOT_FOUND', confidence: 0.9, action: 'VERIFY_TMDB_ID',
      });
      processed++;
      if (processed % 40 === 0) await delay(10000); // Rate limit
      continue;
    }
    
    // Year validation
    if (tmdbData.release_date && movie.release_year) {
      const tmdbYear = parseInt(tmdbData.release_date.substring(0, 4));
      if (!isNaN(tmdbYear) && Math.abs(tmdbYear - movie.release_year) > 1) {
        anomalies.push({
          id: movie.id, slug: movie.slug, title: movie.title_en, year: movie.release_year,
          tmdb_id: movie.tmdb_id, field: 'release_year',
          db_value: String(movie.release_year), tmdb_value: String(tmdbYear),
          confidence: 0.95, action: 'VERIFY_YEAR',
        });
      }
    }
    
    // Director validation
    if (tmdbData.credits?.crew) {
      const tmdbDirector = tmdbData.credits.crew.find(c => c.job === 'Director')?.name;
      if (tmdbDirector && movie.director) {
        if (normalize(tmdbDirector) !== normalize(movie.director)) {
          anomalies.push({
            id: movie.id, slug: movie.slug, title: movie.title_en, year: movie.release_year,
            tmdb_id: movie.tmdb_id, field: 'director',
            db_value: movie.director, tmdb_value: tmdbDirector,
            confidence: 0.85, action: 'VERIFY_DIRECTOR',
          });
        }
      } else if (tmdbDirector && !movie.director) {
        anomalies.push({
          id: movie.id, slug: movie.slug, title: movie.title_en, year: movie.release_year,
          tmdb_id: movie.tmdb_id, field: 'director',
          db_value: '', tmdb_value: tmdbDirector,
          confidence: 0.90, action: 'ADD_DIRECTOR',
        });
      }
    }
    
    // Cast validation
    if (tmdbData.credits?.cast?.length) {
      const topCast = tmdbData.credits.cast
        .filter(c => c.order < 3)
        .sort((a, b) => a.order - b.order);
      
      const tmdbHero = topCast.find(c => c.gender === 2)?.name; // Male
      const tmdbHeroine = topCast.find(c => c.gender === 1)?.name; // Female
      
      if (tmdbHero && movie.hero) {
        if (normalize(tmdbHero) !== normalize(movie.hero)) {
          anomalies.push({
            id: movie.id, slug: movie.slug, title: movie.title_en, year: movie.release_year,
            tmdb_id: movie.tmdb_id, field: 'hero',
            db_value: movie.hero, tmdb_value: tmdbHero,
            confidence: 0.80, action: 'VERIFY_HERO',
          });
        }
      } else if (tmdbHero && !movie.hero) {
        anomalies.push({
          id: movie.id, slug: movie.slug, title: movie.title_en, year: movie.release_year,
          tmdb_id: movie.tmdb_id, field: 'hero',
          db_value: '', tmdb_value: tmdbHero,
          confidence: 0.85, action: 'ADD_HERO',
        });
      }
      
      if (tmdbHeroine && movie.heroine) {
        if (normalize(tmdbHeroine) !== normalize(movie.heroine)) {
          anomalies.push({
            id: movie.id, slug: movie.slug, title: movie.title_en, year: movie.release_year,
            tmdb_id: movie.tmdb_id, field: 'heroine',
            db_value: movie.heroine, tmdb_value: tmdbHeroine,
            confidence: 0.80, action: 'VERIFY_HEROINE',
          });
        }
      } else if (tmdbHeroine && !movie.heroine) {
        anomalies.push({
          id: movie.id, slug: movie.slug, title: movie.title_en, year: movie.release_year,
          tmdb_id: movie.tmdb_id, field: 'heroine',
          db_value: '', tmdb_value: tmdbHeroine,
          confidence: 0.85, action: 'ADD_HEROINE',
        });
      }
    }
    
    processed++;
    if (processed % 10 === 0) {
      process.stdout.write(`\r   Processed ${processed}/${toProcess.length}`);
    }
    if (processed % 40 === 0) await delay(10000); // Rate limit: 40 requests per 10 seconds
  }
  
  console.log(`\r   Processed ${processed}/${toProcess.length}\n`);
  return anomalies;
}

function exportCSV(anomalies: Anomaly[], filename: string) {
  const header = 'id,slug,title,year,tmdb_id,field,db_value,tmdb_value,confidence,action';
  const rows = anomalies.map(a => 
    `"${a.id}","${a.slug}","${a.title.replace(/"/g, '""')}",${a.year || 'null'},${a.tmdb_id},"${a.field}","${String(a.db_value).replace(/"/g, '""')}","${String(a.tmdb_value).replace(/"/g, '""')}",${a.confidence},"${a.action}"`
  );
  writeFileSync(filename, [header, ...rows].join('\n'));
  console.log(chalk.cyan(`📄 Exported ${anomalies.length} anomalies to ${filename}`));
}

async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '100');
  
  console.log(chalk.bold('\n🎬 TMDB VALIDATION\n'));
  console.log(`   Limit: ${limit} movies (use --limit=0 for all)\n`);
  
  if (!TMDB_API_KEY) {
    console.error(chalk.red('❌ TMDB_API_KEY not set in .env.local'));
    process.exit(1);
  }
  
  const start = Date.now();
  const movies = await fetchMoviesWithTMDB();
  const anomalies = await validateAgainstTMDB(movies, limit);
  
  // Summary
  const byField: Record<string, number> = {};
  const byAction: Record<string, number> = {};
  
  for (const a of anomalies) {
    byField[a.field] = (byField[a.field] || 0) + 1;
    byAction[a.action] = (byAction[a.action] || 0) + 1;
  }
  
  console.log('\n📊 SUMMARY\n');
  console.log('By Field:');
  for (const [f, c] of Object.entries(byField).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${f.padEnd(15)} ${c}`);
  }
  
  console.log('\nBy Action:');
  for (const [a, c] of Object.entries(byAction).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${a.padEnd(20)} ${c}`);
  }
  
  console.log(`\nTotal: ${chalk.bold(anomalies.length)} anomalies`);
  console.log(`Duration: ${((Date.now() - start) / 1000).toFixed(1)}s\n`);
  
  exportCSV(anomalies, 'TMDB-VALIDATION-RESULTS.csv');
  
  console.log(chalk.green('\n✅ TMDB VALIDATION COMPLETE\n'));
}

main().catch(console.error);
