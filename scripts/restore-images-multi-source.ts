#!/usr/bin/env npx tsx
/**
 * Multi-Source Image Restoration
 * 
 * Tries multiple data sources to restore cleared images:
 * 1. TMDB (primary - 95% trust)
 * 2. Wikipedia (80% trust)
 * 3. Wikimedia Commons (CC-licensed)
 * 4. Internet Archive (historical)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

interface Movie {
  id: string;
  title_en: string;
  release_year: number | null;
  tmdb_id: number | null;
  director: string | null;
}

interface ImageResult {
  poster_url: string | null;
  backdrop_url: string | null;
  tmdb_id?: number;
  source: string;
}

// ============================================================
// SOURCE 1: TMDB
// ============================================================

async function tryTMDB(title: string, year?: number): Promise<ImageResult | null> {
  if (!TMDB_API_KEY) return null;

  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
    query: title,
    language: 'en-US',
  });
  
  if (year) params.set('year', year.toString());

  try {
    const response = await fetch(`https://api.themoviedb.org/3/search/movie?${params}`);
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) return null;
    
    // Prefer Telugu match
    const match = data.results.find((r: any) => r.original_language === 'te') || 
                  data.results.find((r: any) => {
                    if (!r.release_date || !year) return false;
                    return Math.abs(parseInt(r.release_date.split('-')[0]) - year) <= 1;
                  });
    
    if (!match) return null;
    
    // Only accept Telugu movies or exact title match
    if (match.original_language !== 'te') {
      const titleMatch = title.toLowerCase() === match.title.toLowerCase() ||
                         title.toLowerCase() === match.original_title?.toLowerCase();
      if (!titleMatch) return null;
    }
    
    return {
      poster_url: match.poster_path ? `${TMDB_IMAGE_BASE}/w500${match.poster_path}` : null,
      backdrop_url: match.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${match.backdrop_path}` : null,
      tmdb_id: match.id,
      source: 'tmdb'
    };
  } catch {
    return null;
  }
}

// ============================================================
// SOURCE 2: Wikipedia
// ============================================================

async function tryWikipedia(title: string, year?: number): Promise<ImageResult | null> {
  try {
    // Try different Wikipedia title formats
    const searchTerms = [
      `${title} (${year} film)`,
      `${title} (${year} Telugu film)`,
      `${title} (film)`,
      title
    ];
    
    for (const term of searchTerms) {
      const wikiTitle = term.replace(/ /g, '_');
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'TeluguVibes/1.0 (contact@teluguvibes.com)' }
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      // Check if it's about a Telugu film
      const description = (data.description || '').toLowerCase();
      const extract = (data.extract || '').toLowerCase();
      
      const isTeluguFilm = description.includes('telugu') || 
                           extract.includes('telugu') ||
                           description.includes('indian film') ||
                           extract.includes('tollywood');
      
      if (data.originalimage?.source && isTeluguFilm) {
        return {
          poster_url: data.originalimage.source,
          backdrop_url: null,
          source: 'wikipedia'
        };
      }
      
      if (data.thumbnail?.source && isTeluguFilm) {
        // Get higher resolution
        const hiRes = data.thumbnail.source.replace(/\/\d+px-/, '/500px-');
        return {
          poster_url: hiRes,
          backdrop_url: null,
          source: 'wikipedia'
        };
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

// ============================================================
// SOURCE 3: Wikimedia Commons
// ============================================================

async function tryWikimediaCommons(title: string, year?: number): Promise<ImageResult | null> {
  try {
    const searchQuery = `${title} ${year || ''} Telugu film poster`;
    const searchUrl = `https://commons.wikimedia.org/w/api.php?` +
      `action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}` +
      `&srnamespace=6&format=json&srlimit=5`;

    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'TeluguVibes/1.0 (contact@teluguvibes.com)' }
    });
    
    if (!response.ok) return null;

    const data = await response.json();
    const results = data.query?.search || [];

    for (const result of results) {
      const fileTitle = result.title;
      const infoUrl = `https://commons.wikimedia.org/w/api.php?` +
        `action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo` +
        `&iiprop=url|size|extmetadata&format=json`;

      const infoResponse = await fetch(infoUrl, {
        headers: { 'User-Agent': 'TeluguVibes/1.0 (contact@teluguvibes.com)' }
      });
      
      if (!infoResponse.ok) continue;

      const infoData = await infoResponse.json();
      const pages = infoData.query?.pages || {};
      const page = Object.values(pages)[0] as any;
      const imageInfo = page?.imageinfo?.[0];

      if (!imageInfo) continue;

      // Check license
      const license = imageInfo.extmetadata?.LicenseShortName?.value || '';
      const isCC = license.toLowerCase().includes('cc') || 
                   license.toLowerCase().includes('public domain');

      if (isCC && imageInfo.url) {
        return {
          poster_url: imageInfo.url,
          backdrop_url: null,
          source: 'wikimedia_commons'
        };
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

// ============================================================
// SOURCE 4: Internet Archive
// ============================================================

async function tryInternetArchive(title: string, year?: number): Promise<ImageResult | null> {
  try {
    const query = `${title} Telugu ${year || ''} poster`;
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title&rows=5&output=json`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'TeluguVibes/1.0' }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const docs = data.response?.docs || [];
    
    for (const doc of docs) {
      // Get metadata to find image files
      const metaUrl = `https://archive.org/metadata/${doc.identifier}`;
      const metaResponse = await fetch(metaUrl);
      
      if (!metaResponse.ok) continue;
      
      const metaData = await metaResponse.json();
      const files = metaData.files || [];
      
      // Find image files
      const imageFile = files.find((f: any) => 
        f.name && (f.name.endsWith('.jpg') || f.name.endsWith('.png') || f.name.endsWith('.jpeg'))
      );
      
      if (imageFile) {
        return {
          poster_url: `https://archive.org/download/${doc.identifier}/${imageFile.name}`,
          backdrop_url: null,
          source: 'internet_archive'
        };
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

// ============================================================
// MAIN RESTORATION LOGIC
// ============================================================

async function restoreMovie(movie: Movie): Promise<{
  success: boolean;
  source?: string;
  poster_url?: string;
  tmdb_id?: number;
  reason?: string;
}> {
  // Try sources in order of trust
  
  // 1. TMDB (95% trust)
  const tmdbResult = await tryTMDB(movie.title_en, movie.release_year || undefined);
  if (tmdbResult?.poster_url) {
    const updates: Record<string, any> = { poster_url: tmdbResult.poster_url };
    if (tmdbResult.backdrop_url) updates.backdrop_url = tmdbResult.backdrop_url;
    if (tmdbResult.tmdb_id) updates.tmdb_id = tmdbResult.tmdb_id;
    
    const { error } = await supabase.from('movies').update(updates).eq('id', movie.id);
    if (!error) {
      return { success: true, source: 'tmdb', poster_url: tmdbResult.poster_url, tmdb_id: tmdbResult.tmdb_id };
    }
  }
  
  // 2. Wikipedia (80% trust)
  const wikiResult = await tryWikipedia(movie.title_en, movie.release_year || undefined);
  if (wikiResult?.poster_url) {
    const { error } = await supabase
      .from('movies')
      .update({ poster_url: wikiResult.poster_url })
      .eq('id', movie.id);
    
    if (!error) {
      return { success: true, source: 'wikipedia', poster_url: wikiResult.poster_url };
    }
  }
  
  // 3. Wikimedia Commons (CC-licensed)
  const commonsResult = await tryWikimediaCommons(movie.title_en, movie.release_year || undefined);
  if (commonsResult?.poster_url) {
    const { error } = await supabase
      .from('movies')
      .update({ poster_url: commonsResult.poster_url })
      .eq('id', movie.id);
    
    if (!error) {
      return { success: true, source: 'wikimedia_commons', poster_url: commonsResult.poster_url };
    }
  }
  
  // 4. Internet Archive (historical)
  const archiveResult = await tryInternetArchive(movie.title_en, movie.release_year || undefined);
  if (archiveResult?.poster_url) {
    const { error } = await supabase
      .from('movies')
      .update({ poster_url: archiveResult.poster_url })
      .eq('id', movie.id);
    
    if (!error) {
      return { success: true, source: 'internet_archive', poster_url: archiveResult.poster_url };
    }
  }
  
  return { success: false, reason: 'Not found in any source' };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '100');
  const daysBack = parseInt(args.find(a => a.startsWith('--days='))?.split('=')[1] || '7');
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║          MULTI-SOURCE IMAGE RESTORATION                       ║
╚══════════════════════════════════════════════════════════════╝
`));
  
  console.log('Sources (in order of trust):');
  console.log('  1. TMDB (95%)');
  console.log('  2. Wikipedia (80%)');
  console.log('  3. Wikimedia Commons (CC)');
  console.log('  4. Internet Archive (Historical)');
  console.log();

  if (dryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE\n'));
  }

  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, tmdb_id, director')
    .is('poster_url', null)
    .gte('updated_at', cutoffDate)
    .order('release_year', { ascending: false })
    .limit(limit);

  if (error || !movies || movies.length === 0) {
    console.log(chalk.green('✅ No movies need restoration'));
    return;
  }

  console.log(`📋 Found ${movies.length} movies to restore\n`);

  const stats = { tmdb: 0, wikipedia: 0, wikimedia_commons: 0, internet_archive: 0, failed: 0 };

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    const progress = `[${i + 1}/${movies.length}]`;
    
    if (dryRun) {
      console.log(`${progress} ${movie.title_en} (${movie.release_year})`);
      await new Promise(r => setTimeout(r, 100));
      continue;
    }

    const result = await restoreMovie(movie);
    
    if (result.success) {
      stats[result.source as keyof typeof stats]++;
      const icon = result.source === 'tmdb' ? '🎬' : 
                   result.source === 'wikipedia' ? '📖' :
                   result.source === 'wikimedia_commons' ? '🖼️' : '📚';
      console.log(chalk.green(`${progress} ${icon} ${movie.title_en} (${movie.release_year}) - ${result.source}`));
    } else {
      stats.failed++;
      console.log(chalk.gray(`${progress} ○ ${movie.title_en} (${movie.release_year}) - ${result.reason}`));
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  const total = stats.tmdb + stats.wikipedia + stats.wikimedia_commons + stats.internet_archive;
  
  console.log(chalk.cyan(`
═══════════════════════════════════════════════════════════
📊 RESTORATION RESULTS
═══════════════════════════════════════════════════════════
  🎬 TMDB:              ${chalk.green(stats.tmdb)}
  📖 Wikipedia:         ${chalk.green(stats.wikipedia)}
  🖼️  Wikimedia Commons: ${chalk.green(stats.wikimedia_commons)}
  📚 Internet Archive:  ${chalk.green(stats.internet_archive)}
  ─────────────────────────────────────────────────────────
  ✅ Total Restored:    ${chalk.green(total)}
  ○  Failed:            ${chalk.gray(stats.failed)}
`));
}

main().catch(console.error);

