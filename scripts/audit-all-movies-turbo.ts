#!/usr/bin/env npx tsx
/**
 * TURBO MODE MOVIE DATA AUDIT - Cross-verify against 21 sources
 * Usage: npx tsx scripts/audit-all-movies-turbo.ts --execute --turbo
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { fetchFromAllSources } from './lib/multi-source-orchestrator';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Movie {
  id: string; slug: string; title_en: string; release_year: number;
  hero: string | null; heroine: string | null; director: string | null;
  music_director: string | null; supporting_cast: string[] | null;
  tmdb_id: number | null; imdb_id: string | null;
}

interface Anomaly {
  id: string; slug: string; title_en: string; release_year: number;
  field: string; db_value: string; consensus_value: string;
  confidence: number; sources_agree: string; sources_disagree: string;
  anomaly_type: string; auto_fixable: boolean;
}

interface InternalAnomaly {
  id: string; slug: string; title_en: string; release_year: number;
  issue_type: string; description: string; severity: string;
}

const args = process.argv.slice(2);
const hasFlag = (f: string) => args.includes(`--${f}`);
const getValue = (f: string) => { const i = args.findIndex(a => a.startsWith(`--${f}=`)); return i >= 0 ? args[i].split('=')[1] : undefined; };

const LIMIT = parseInt(getValue('limit') || '0') || 0;
const EXECUTE = hasFlag('execute');
const TURBO = hasFlag('turbo');
const FAST = hasFlag('fast');
const INTERNAL_ONLY = hasFlag('internal-only');
const SKIP_INTERNAL = hasFlag('skip-internal');

const CONCURRENCY = TURBO ? 100 : FAST ? 50 : 20;
const RATE_LIMIT_MS = TURBO ? 25 : FAST ? 50 : 200;
const AUDIT_FIELDS = ['hero', 'heroine', 'director', 'music_director', 'cinematographer', 'editor', 'writer'];

const normalize = (v: string | null | undefined) => {
  if (v === null || v === undefined) return '';
  if (typeof v !== 'string') return String(v).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  return v.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
};
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchAllMovies(): Promise<Movie[]> {
  let all: Movie[] = [], offset = 0;
  while (true) {
    const { data } = await supabase.from('movies')
      .select('id, slug, title_en, release_year, hero, heroine, director, music_director, supporting_cast, tmdb_id, imdb_id')
      .eq('is_published', true).range(offset, offset + 999);
    if (!data?.length) break;
    all = all.concat(data as Movie[]);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all;
}

async function runInternalChecks(): Promise<InternalAnomaly[]> {
  console.log(chalk.blue('\n🔍 PHASE 1: Internal Consistency Checks\n'));
  const anomalies: InternalAnomaly[] = [];
  const allMovies = await fetchAllMovies();
  console.log(`  Found ${allMovies.length} movies\n`);

  // Hero/Heroine Swap Detection
  console.log('  Checking hero/heroine swaps...');
  const males = new Set<string>(), females = new Set<string>();
  allMovies.forEach(m => { if (m.hero) males.add(normalize(m.hero)); if (m.heroine) females.add(normalize(m.heroine)); });
  
  for (const m of allMovies) {
    if (m.hero && females.has(normalize(m.hero)) && !males.has(normalize(m.hero)))
      anomalies.push({ id: m.id, slug: m.slug, title_en: m.title_en, release_year: m.release_year, issue_type: 'POTENTIAL_SWAP', description: `Hero "${m.hero}" commonly listed as heroine`, severity: 'medium' });
    if (m.heroine && males.has(normalize(m.heroine)) && !females.has(normalize(m.heroine)))
      anomalies.push({ id: m.id, slug: m.slug, title_en: m.title_en, release_year: m.release_year, issue_type: 'POTENTIAL_SWAP', description: `Heroine "${m.heroine}" commonly listed as hero`, severity: 'medium' });
  }
  console.log(`    Found ${anomalies.filter(a => a.issue_type === 'POTENTIAL_SWAP').length} swaps`);

  // Duplicate Detection
  console.log('  Checking duplicates...');
  const titleMap = new Map<string, Movie[]>();
  allMovies.forEach(m => { const k = `${normalize(m.title_en)}|${m.release_year}`; if (!titleMap.has(k)) titleMap.set(k, []); titleMap.get(k)!.push(m); });
  for (const [, movies] of titleMap) {
    if (movies.length > 1) movies.slice(1).forEach(m => anomalies.push({ id: m.id, slug: m.slug, title_en: m.title_en, release_year: m.release_year, issue_type: 'DUPLICATE', description: `Duplicate of ${movies[0].slug}`, severity: 'high' }));
  }
  console.log(`    Found ${anomalies.filter(a => a.issue_type === 'DUPLICATE').length} duplicates`);

  // Cast in both lead and supporting
  console.log('  Checking cast duplicates...');
  for (const m of allMovies) {
    if (m.supporting_cast?.length) {
      const heroN = normalize(m.hero), heroineN = normalize(m.heroine);
      m.supporting_cast.forEach(c => { if (normalize(c) === heroN || normalize(c) === heroineN) anomalies.push({ id: m.id, slug: m.slug, title_en: m.title_en, release_year: m.release_year, issue_type: 'CAST_DUPLICATE', description: `"${c}" in both lead and supporting`, severity: 'low' }); });
    }
  }
  console.log(`    Found ${anomalies.filter(a => a.issue_type === 'CAST_DUPLICATE').length} cast duplicates`);
  console.log(chalk.green(`\n✅ Internal checks: ${anomalies.length} issues\n`));
  return anomalies;
}

async function auditMovie(movie: Movie): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  try {
    const results = await fetchFromAllSources({ title_en: movie.title_en, release_year: movie.release_year, tmdb_id: movie.tmdb_id || undefined, imdb_id: movie.imdb_id || undefined }, AUDIT_FIELDS);
    for (const r of results) {
      const dbVal = (movie as any)[r.field] as string | null, consVal = r.consensus;
      if (!r.sources?.length || (!dbVal && !consVal)) continue;
      if (normalize(dbVal) !== normalize(consVal)) {
        const type = !dbVal && consVal ? 'MISSING' : !consVal ? 'CONFLICT' : 'WRONG';
        anomalies.push({ id: movie.id, slug: movie.slug, title_en: movie.title_en, release_year: movie.release_year, field: r.field, db_value: dbVal || '', consensus_value: consVal || '', confidence: r.consensusConfidence, sources_agree: r.sources.filter(s => normalize(s.value) === normalize(consVal)).map(s => s.sourceId).join(','), sources_disagree: r.sources.filter(s => normalize(s.value) !== normalize(consVal)).map(s => s.sourceId).join(','), anomaly_type: type, auto_fixable: r.consensusConfidence >= 0.85 && r.action === 'auto_apply' });
      }
    }
  } catch { }
  return anomalies;
}

async function runMultiSourceAudit(): Promise<Anomaly[]> {
  console.log(chalk.blue('\n🔍 PHASE 2: Multi-Source Audit (21 sources)\n'));
  console.log(`  Mode: ${TURBO ? 'TURBO' : FAST ? 'FAST' : 'NORMAL'}, Concurrency: ${CONCURRENCY}\n`);
  
  let allMovies = await fetchAllMovies();
  if (LIMIT > 0) allMovies = allMovies.slice(0, LIMIT);
  console.log(`  Auditing ${allMovies.length} movies...\n`);

  const anomalies: Anomaly[] = [], start = Date.now();
  let processed = 0, found = 0;

  for (let i = 0; i < allMovies.length; i += CONCURRENCY) {
    const batch = allMovies.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(m => auditMovie(m)));
    results.forEach(r => { anomalies.push(...r); found += r.length; });
    processed += batch.length;
    process.stdout.write(`\r  ${processed}/${allMovies.length} (${((processed/allMovies.length)*100).toFixed(1)}%) | Anomalies: ${found} | ${(processed/((Date.now()-start)/1000)).toFixed(1)}/sec    `);
    await delay(RATE_LIMIT_MS);
  }
  console.log(chalk.green(`\n\n✅ Multi-source audit: ${anomalies.length} anomalies\n`));
  return anomalies;
}

function exportCSV(anomalies: Anomaly[], fn: string) {
  const h = 'id,slug,title_en,release_year,field,db_value,consensus_value,confidence,sources_agree,sources_disagree,anomaly_type,auto_fixable';
  const r = anomalies.map(a => `${a.id},"${a.slug}","${a.title_en.replace(/"/g,'""')}",${a.release_year},${a.field},"${a.db_value.replace(/"/g,'""')}","${a.consensus_value.replace(/"/g,'""')}",${a.confidence.toFixed(2)},"${a.sources_agree}","${a.sources_disagree}",${a.anomaly_type},${a.auto_fixable}`);
  writeFileSync(fn, [h,...r].join('\n')); console.log(chalk.cyan(`📄 Exported to ${fn}`));
}

function exportInternalCSV(anomalies: InternalAnomaly[], fn: string) {
  const h = 'id,slug,title_en,release_year,issue_type,description,severity';
  const r = anomalies.map(a => `${a.id},"${a.slug}","${a.title_en.replace(/"/g,'""')}",${a.release_year},${a.issue_type},"${a.description.replace(/"/g,'""')}",${a.severity}`);
  writeFileSync(fn, [h,...r].join('\n')); console.log(chalk.cyan(`📄 Exported to ${fn}`));
}

async function main() {
  console.log(chalk.bold('\n🎬 TURBO MOVIE DATA AUDIT\n'));
  if (!EXECUTE) { console.log(chalk.yellow('⚠️  DRY RUN - Add --execute\n')); console.log('Options: --execute --turbo --fast --limit=N --internal-only --skip-internal'); return; }

  let internal: InternalAnomaly[] = [], multiSource: Anomaly[] = [];
  if (!SKIP_INTERNAL) { internal = await runInternalChecks(); exportInternalCSV(internal, 'MOVIE-AUDIT-INTERNAL.csv'); }
  if (!INTERNAL_ONLY) { multiSource = await runMultiSourceAudit(); exportCSV(multiSource, 'MOVIE-AUDIT-TURBO-ANOMALIES.csv'); }

  writeFileSync('MOVIE-AUDIT-SUMMARY.md', `# Audit Summary\n\n- Internal: ${internal.length}\n- Multi-source: ${multiSource.length}\n- Auto-fixable: ${multiSource.filter(a=>a.auto_fixable).length}`);
  console.log(chalk.green('\n✅ AUDIT COMPLETE\n'));
  console.log(`  Internal: ${internal.length}\n  Multi-source: ${multiSource.length}\n  Auto-fixable: ${multiSource.filter(a=>a.auto_fixable).length}\n`);
}

main().catch(console.error);
