#!/usr/bin/env npx tsx
/**
 * AUTOMATED ACTOR ATTRIBUTION AUDIT
 * 
 * Automatically scrapes Wikipedia filmography and audits attribution.
 * For each actor:
 * 1. Scrapes their Wikipedia filmography page
 * 2. Parses movie list (title, year)
 * 3. Searches if movies exist in DB
 * 4. Checks if actor is properly attributed
 * 5. Generates per-actor CSV report
 * 
 * Usage:
 *   npx tsx scripts/automated-attribution-audit.ts --top=10
 *   npx tsx scripts/automated-attribution-audit.ts --all
 */

import { createClient } from '@supabase/supabase-js';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fetchFilmographyFromAPI, fetchFilmographyFromHTML } from './lib/wikipedia-filmography-scraper';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Actor {
  id: string;
  name_en: string;
  name_te?: string;
  slug: string;
  wikipediaUrl: string;
  filmographyUrl: string;
}

type CrewRoleType = 
  | 'hero'              // Main lead (male)
  | 'heroine'           // Main lead (female)
  | 'cast_members'      // General cast
  | 'supporting_cast'   // Supporting actors
  | 'cameo'             // Cameo appearances
  | 'director' 
  | 'producer' 
  | 'music_director'
  | 'cinematographer'
  | 'editor'
  | 'writer'
  | 'choreographer'
  | 'art_director'
  | 'lyricist'
  | 'costume_designer'
  | 'production_designer';

interface WikiMovie {
  title: string;
  year: number;
  role?: string; // Actor, Director, Producer, Writer, etc.
  roleType?: CrewRoleType; // Normalized role for DB field
  castType?: 'lead' | 'supporting' | 'cameo'; // For actors specifically
}

interface AuditResult {
  wikiMovie: WikiMovie;
  status: 'attributed' | 'exists_not_attributed' | 'missing';
  dbMovieId?: string;
  dbMovieTitle?: string;
  dbMovieYear?: number;
  currentAttribution?: string;
  matchConfidence?: number;
  suggestedField?: CrewRoleType;
  suggestedAction?: string;
}

// Fetch Wikipedia page with proper headers
function fetchWikipedia(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'TeluguPortalBot/1.0 (https://teluguportal.com) Node.js',
        'Accept': 'text/html,application/xhtml+xml',
      }
    };
    
    https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        resolve('');
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

// Determine role type from role text
function determineRoleType(roleText: string, actorGender?: 'male' | 'female'): { roleType: CrewRoleType; castType?: 'lead' | 'supporting' | 'cameo' } {
  const roleLower = roleText.toLowerCase();
  
  // ============ CREW ROLES (Technical) ============
  
  // Director (check before cinematographer to avoid false matches)
  if (roleLower.match(/\bdirector\b/) && !roleLower.includes('cinematograph') && !roleLower.includes('art director') && !roleLower.includes('music director')) {
    return { roleType: 'director' };
  }
  
  // Music & Sound
  if (roleLower.match(/\bmusic\b|\bmusic director\b|\bcomposer\b|\bbgm\b/)) {
    return { roleType: 'music_director' };
  }
  
  // Cinematography
  if (roleLower.match(/\bcinematographer\b|\bcinematography\b|\bdop\b|\bdirector of photography\b/)) {
    return { roleType: 'cinematographer' };
  }
  
  // Editing
  if (roleLower.match(/\beditor\b|\bediting\b/)) {
    return { roleType: 'editor' };
  }
  
  // Writing
  if (roleLower.match(/\bwriter\b|\bwritten\b|\bscreenplay\b|\bstory\b|\bdialogue\b/)) {
    return { roleType: 'writer' };
  }
  
  // Lyrics
  if (roleLower.match(/\blyricist\b|\blyrics\b|\bsongwriter\b/)) {
    return { roleType: 'lyricist' };
  }
  
  // Choreography
  if (roleLower.match(/\bchoreographer\b|\bchoreography\b|\bdance\b/)) {
    return { roleType: 'choreographer' };
  }
  
  // Art Direction
  if (roleLower.match(/\bart director\b|\bart direction\b|\bproduction designer\b|\bproduction design\b/)) {
    return { roleType: 'art_director' };
  }
  
  // Costume
  if (roleLower.match(/\bcostume\b/)) {
    return { roleType: 'costume_designer' };
  }
  
  // Producer
  if (roleLower.match(/\bproducer\b|\bproduced\b/)) {
    return { roleType: 'producer' };
  }
  
  // ============ CAST ROLES (Actors) ============
  
  // Cameo / Special Appearance
  if (roleLower.match(/\bcameo\b|\bspecial appearance\b|\bguest appearance\b|\bguest role\b/)) {
    return { roleType: 'cameo', castType: 'cameo' };
  }
  
  // Supporting Role
  if (roleLower.match(/\bsupporting\b|\bsecondary\b|\bside character\b/)) {
    return { roleType: 'supporting_cast', castType: 'supporting' };
  }
  
  // Lead Role / Hero / Heroine
  if (roleLower.match(/\blead\b|\bmain role\b|\bprotagonist\b|\bhero\b|\bheroine\b|\blead role\b|\btitle role\b/)) {
    // Determine if male or female lead
    if (roleLower.includes('heroine') || actorGender === 'female') {
      return { roleType: 'heroine', castType: 'lead' };
    } else {
      return { roleType: 'hero', castType: 'lead' };
    }
  }
  
  // Generic "Actor" - default to cast_members
  if (roleLower.match(/\bactor\b|\bactress\b|\bperformer\b/)) {
    return { roleType: 'cast_members', castType: 'supporting' };
  }
  
  // Default: assume general cast
  return { roleType: 'cast_members', castType: 'supporting' };
}

// Parse filmography from HTML (improved Wikipedia table parsing)
function parseFilmographyFromHtml(html: string, actorName: string): WikiMovie[] {
  const movies: WikiMovie[] = [];
  
  if (!html) return movies;
  
  // Extract all tables (Wikipedia filmographies use wikitable class)
  const tablePattern = /<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  const tables = [...html.matchAll(tablePattern)];
  
  for (const tableMatch of tables) {
    const tableHtml = tableMatch[0];
    
    // Check if this looks like a filmography table
    if (!tableHtml.toLowerCase().includes('film') && 
        !tableHtml.toLowerCase().includes('year') && 
        !tableHtml.toLowerCase().includes('title')) {
      continue;
    }
    
    // Extract rows
    const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows = [...tableHtml.matchAll(rowPattern)];
    
    for (const rowMatch of rows) {
      const rowHtml = rowMatch[1];
      
      // Skip header rows
      if (rowHtml.includes('<th')) continue;
      
      // Extract cells
      const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells: string[] = [];
      let cellMatch;
      
      while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
        cells.push(cellMatch[1]);
      }
      
      if (cells.length < 2) continue;
      
      // Extract year (usually first or second column)
      let year = 0;
      let yearIndex = -1;
      
      for (let i = 0; i < Math.min(cells.length, 3); i++) {
        const cellText = cells[i].replace(/<[^>]+>/g, '').trim();
        const yearMatch = cellText.match(/\b(19\d{2}|20\d{2})\b/);
        if (yearMatch) {
          year = parseInt(yearMatch[1]);
          yearIndex = i;
          break;
        }
      }
      
      if (!year || year < 1900 || year > 2030) continue;
      
      // Extract title (usually next column after year, or with <i> tag)
      let title = '';
      let titleIndex = -1;
      
      // First try to find italicized film titles
      for (let i = 0; i < cells.length; i++) {
        if (i === yearIndex) continue;
        
        const italicMatch = cells[i].match(/<i[^>]*>([\s\S]*?)<\/i>/i);
        if (italicMatch) {
          // Extract text from within italics, including links
          const linkMatch = italicMatch[1].match(/<a[^>]*>([^<]+)<\/a>/i);
          title = linkMatch ? linkMatch[1] : italicMatch[1].replace(/<[^>]+>/g, '');
          titleIndex = i;
          break;
        }
      }
      
      // If no italics, look for any link after the year
      if (!title) {
        for (let i = yearIndex + 1; i < cells.length; i++) {
          const linkMatch = cells[i].match(/<a[^>]*title="([^"]+)"[^>]*>([^<]+)<\/a>/i);
          if (linkMatch) {
            title = linkMatch[2];
            titleIndex = i;
            break;
          }
        }
      }
      
      // Last resort: use any text in column after year
      if (!title && yearIndex >= 0 && yearIndex + 1 < cells.length) {
        title = cells[yearIndex + 1].replace(/<[^>]+>/g, '').trim();
        titleIndex = yearIndex + 1;
      }
      
      if (!title || title.length < 2 || title.length > 100) continue;
      
      // Clean up title
      title = title
        .replace(/&#\d+;/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      
      // Extract role (look in remaining columns)
      let role = 'Actor'; // Default
      
      for (let i = 0; i < cells.length; i++) {
        if (i === yearIndex || i === titleIndex) continue;
        
        const cellText = cells[i].replace(/<[^>]+>/g, '').trim();
        
        if (cellText.match(/director|producer|writer|music|cinematographer|editor|lyricist|choreographer|costume|art director/i)) {
          role = cellText;
          break;
        }
        if (cellText.match(/lead|hero|heroine|supporting|cameo|guest|special appearance/i)) {
          role = cellText;
          break;
        }
      }
      
      const roleInfo = determineRoleType(role);
      movies.push({ 
        title, 
        year, 
        role, 
        roleType: roleInfo.roleType,
        castType: roleInfo.castType
      });
    }
  }
  
  return movies;
}

// Normalize title for fuzzy matching
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\bthe\b/g, '')
    .trim();
}

// Calculate similarity score
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeTitle(str1);
  const s2 = normalizeTitle(str2);
  
  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) return 90;
  
  // Simple word overlap
  const words1 = s1.split(' ');
  const words2 = s2.split(' ');
  const common = words1.filter(w => words2.includes(w)).length;
  const total = Math.max(words1.length, words2.length);
  
  return Math.round((common / total) * 100);
}

// Check if actor is attributed in movie (for their specific role)
function isActorAttributed(movie: any, actorName: string, roleType?: CrewRoleType): boolean {
  const searchNames = [
    actorName.toLowerCase(),
    actorName.split(' ').pop()!.toLowerCase(), // Last name
    actorName.split(' ').slice(1).join(' ').toLowerCase() // Without first name
  ];
  
  // Function to check a field value
  const checkField = (field: any): boolean => {
    if (!field) return false;
    
    if (typeof field === 'string') {
      const fieldLower = field.toLowerCase();
      return searchNames.some(name => name.length > 2 && fieldLower.includes(name));
    }
    
    if (typeof field === 'object') {
      const jsonStr = JSON.stringify(field).toLowerCase();
      return searchNames.some(name => name.length > 2 && jsonStr.includes(name));
    }
    
    return false;
  };
  
  // Check based on role type
  switch (roleType) {
    // ===== CREW ROLES =====
    case 'director':
      return checkField(movie.director) || checkField(movie.directors);
      
    case 'producer':
      return checkField(movie.producer) || checkField(movie.producers);
      
    case 'music_director':
      return checkField(movie.music_director) || checkField(movie.crew?.music_director);
      
    case 'cinematographer':
      return checkField(movie.cinematographer) || checkField(movie.crew?.cinematographer);
      
    case 'editor':
      return checkField(movie.crew?.editor);
      
    case 'writer':
      return checkField(movie.writer) || checkField(movie.writers) || checkField(movie.crew?.writer) || checkField(movie.crew?.screenplay);
      
    case 'lyricist':
      return checkField(movie.crew?.lyricist);
      
    case 'choreographer':
      return checkField(movie.crew?.choreographer);
      
    case 'art_director':
      return checkField(movie.crew?.art_director) || checkField(movie.crew?.production_designer);
      
    case 'costume_designer':
      return checkField(movie.crew?.costume_designer);
      
    case 'production_designer':
      return checkField(movie.crew?.production_designer);
    
    // ===== CAST ROLES =====
    case 'hero':
      return checkField(movie.hero) || 
             checkField(movie.cast_members) || 
             checkField(movie.supporting_cast);
      
    case 'heroine':
      return checkField(movie.heroine) || 
             checkField(movie.cast_members) || 
             checkField(movie.supporting_cast);
      
    case 'supporting_cast':
      return checkField(movie.supporting_cast) || 
             checkField(movie.cast_members) ||
             checkField(movie.hero) ||
             checkField(movie.heroine);
      
    case 'cameo':
      return checkField(movie.supporting_cast) || 
             checkField(movie.cast_members);
      
    case 'cast_members':
    default:
      // For general cast, check all cast-related fields
      return checkField(movie.hero) ||
             checkField(movie.heroine) ||
             checkField(movie.cast_members) ||
             checkField(movie.supporting_cast);
  }
}

// Get current attribution
function getCurrentAttribution(movie: any, actorName: string): string {
  const attributions: string[] = [];
  const lastName = actorName.toLowerCase().split(' ').pop()!;
  
  if (movie.hero && typeof movie.hero === 'string' && movie.hero.toLowerCase().includes(lastName)) {
    attributions.push(`Hero: ${movie.hero}`);
  }
  if (movie.heroine && typeof movie.heroine === 'string' && movie.heroine.toLowerCase().includes(lastName)) {
    attributions.push(`Heroine: ${movie.heroine}`);
  }
  if (movie.director && typeof movie.director === 'string' && movie.director.toLowerCase().includes(lastName)) {
    attributions.push(`Director: ${movie.director}`);
  }
  if (movie.cast_members && typeof movie.cast_members === 'string' && movie.cast_members.toLowerCase().includes(lastName)) {
    attributions.push('Cast member');
  }
  
  return attributions.length > 0 ? attributions.join('; ') : 'Not attributed';
}

// Search for movie in DB
async function findMovieInDb(
  title: string,
  year: number,
  actorName: string,
  roleType?: string
): Promise<{ status: 'attributed' | 'exists_not_attributed' | 'missing'; movie?: any; confidence?: number }> {
  
  // Search by year +/- 1
  const { data: candidates, error: queryError } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, hero, heroine, cast_members, supporting_cast, director, producer, music_director, cinematographer, writer, crew')
    .gte('release_year', year - 1)
    .lte('release_year', year + 1);
  
  if (queryError) {
    console.error(`Query error: ${queryError.message}`);
    return { status: 'missing' };
  }
  
  if (!candidates || candidates.length === 0) {
    return { status: 'missing' };
  }
  
  // Find best match
  let bestMatch: any = null;
  let bestScore = 0;
  
  for (const movie of candidates) {
    const scoreEn = calculateSimilarity(title, movie.title_en || '');
    const scoreTe = movie.title_te ? calculateSimilarity(title, movie.title_te) : 0;
    const score = Math.max(scoreEn, scoreTe);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = movie;
    }
  }
  
  // Threshold for match
  if (bestMatch && bestScore >= 70) {
    const isAttributed = isActorAttributed(bestMatch, actorName, roleType);
    
    return {
      status: isAttributed ? 'attributed' : 'exists_not_attributed',
      movie: bestMatch,
      confidence: bestScore
    };
  }
  
  return { status: 'missing' };
}

// Audit single actor
async function auditActor(actor: Actor): Promise<AuditResult[]> {
  console.log(chalk.cyan(`\n[${actor.name_en}] Fetching Wikipedia filmography...`));
  
  // Fetch filmography using robust scraper (try API first, fallback to HTML)
  console.log(chalk.gray(`  Trying Wikipedia API...`));
  let wikiMovies = await fetchFilmographyFromAPI(actor.filmographyUrl);
  
  if (wikiMovies.length === 0) {
    console.log(chalk.yellow(`  API returned 0 movies, trying HTML fallback...`));
    wikiMovies = await fetchFilmographyFromHTML(actor.filmographyUrl);
  }
  
  console.log(chalk.gray(`  Found ${wikiMovies.length} movies on Wikipedia`));
  
  if (wikiMovies.length === 0) {
    return [];
  }
  
  // Audit each movie
  const results: AuditResult[] = [];
  
  for (const wikiMovie of wikiMovies) {
    const searchResult = await findMovieInDb(
      wikiMovie.title,
      wikiMovie.year,
      actor.name_en,
      wikiMovie.roleType
    );
    
    // Determine suggested field based on role
    let suggestedField: AuditResult['suggestedField'];
    let suggestedAction = '';
    
    if (searchResult.status === 'exists_not_attributed') {
      suggestedField = wikiMovie.roleType || 'cast';
      
      // Create action text based on role
      const roleName = wikiMovie.role || 'Cast Member';
      suggestedAction = `Add ${actor.name_en} as ${roleName}`;
    } else if (searchResult.status === 'missing') {
      suggestedAction = 'Create movie';
    } else {
      suggestedAction = 'None';
    }
    
    results.push({
      wikiMovie,
      status: searchResult.status,
      dbMovieId: searchResult.movie?.id,
      dbMovieTitle: searchResult.movie?.title_en,
      dbMovieYear: searchResult.movie?.release_year,
      currentAttribution: searchResult.movie 
        ? getCurrentAttribution(searchResult.movie, actor.name_en)
        : undefined,
      matchConfidence: searchResult.confidence,
      suggestedField,
      suggestedAction
    });
  }
  
  const attributed = results.filter(r => r.status === 'attributed').length;
  const needsAttribution = results.filter(r => r.status === 'exists_not_attributed').length;
  const missing = results.filter(r => r.status === 'missing').length;
  
  console.log(chalk.green(`  ✓ Attributed: ${attributed}`));
  console.log(chalk.yellow(`  ⚠️  Needs attribution: ${needsAttribution}`));
  console.log(chalk.red(`  ❌ Missing: ${missing}`));
  
  return results;
}

// Generate CSV report
function generateReport(actor: Actor, results: AuditResult[]): string {
  const headers = [
    'Status',
    'Wikipedia Title',
    'Wikipedia Year',
    'Role',
    'Cast Type',
    'DB Movie ID',
    'DB Title',
    'DB Year',
    'Current Attribution',
    'Match %',
    'Suggested Field',
    'Action'
  ];
  
  const rows: string[][] = [headers];
  
  // Sort: needs attribution first, then missing, then attributed
  const sorted = [
    ...results.filter(r => r.status === 'exists_not_attributed'),
    ...results.filter(r => r.status === 'missing'),
    ...results.filter(r => r.status === 'attributed')
  ];
  
  sorted.forEach(r => {
    const statusEmoji = r.status === 'attributed' ? '✓' : 
                        r.status === 'exists_not_attributed' ? '⚠️' : '❌';
    
    const castType = r.wikiMovie.castType 
      ? r.wikiMovie.castType.charAt(0).toUpperCase() + r.wikiMovie.castType.slice(1)
      : '';
    
    rows.push([
      `${statusEmoji} ${r.status.toUpperCase()}`,
      r.wikiMovie.title,
      r.wikiMovie.year.toString(),
      r.wikiMovie.role || 'Actor',
      castType,
      r.dbMovieId || '',
      r.dbMovieTitle || '',
      r.dbMovieYear?.toString() || '',
      r.currentAttribution || '',
      r.matchConfidence?.toString() || '',
      r.suggestedField || '',
      r.suggestedAction || ''
    ]);
  });
  
  return rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
}

async function main() {
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  COMPREHENSIVE FILMOGRAPHY AUDIT'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 1000; // Default to all
  
  console.log(chalk.yellow(`Fetching celebrities with Wikipedia URLs...\n`));
  
  // Fetch ALL celebrities with Wikipedia URLs from database
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('id, name_en, name_te, slug, wikipedia_url')
    .not('wikipedia_url', 'is', null)
    .order('name_en')
    .limit(limit);
  
  if (error) {
    console.error(chalk.red(`Error fetching celebrities: ${error.message}`));
    process.exit(1);
  }
  
  if (!celebrities || celebrities.length === 0) {
    console.error(chalk.red('No celebrities with Wikipedia URLs found!'));
    process.exit(1);
  }
  
  const actors: Actor[] = celebrities.map(celeb => ({
    id: celeb.id,
    name_en: celeb.name_en,
    name_te: celeb.name_te,
    slug: celeb.slug,
    wikipediaUrl: celeb.wikipedia_url,
    filmographyUrl: celeb.wikipedia_url // Will try to find filmography page
  }));
  
  console.log(chalk.green(`✓ Loaded ${actors.length} celebrities with Wikipedia URLs\n`));
  
  // Create output directory
  const outputDir = path.join(process.cwd(), 'attribution-audits');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  // Process each actor
  let totalAttributed = 0;
  let totalNeedsAttribution = 0;
  let totalMissing = 0;
  let totalScraped = 0;
  
  for (let i = 0; i < actors.length; i++) {
    const actor = actors[i];
    
    console.log(chalk.blue(`\nProgress: ${i + 1}/${actors.length}`));
    
    const results = await auditActor(actor);
    
    if (results.length > 0) {
      totalScraped += results.length;
      
      const attributed = results.filter(r => r.status === 'attributed').length;
      const needsAttribution = results.filter(r => r.status === 'exists_not_attributed').length;
      const missing = results.filter(r => r.status === 'missing').length;
      
      totalAttributed += attributed;
      totalNeedsAttribution += needsAttribution;
      totalMissing += missing;
      
      // Generate report
      const csv = generateReport(actor, results);
      const outputFile = path.join(outputDir, `${actor.slug}-attribution.csv`);
      fs.writeFileSync(outputFile, csv);
      
      console.log(chalk.green(`  Saved: ${path.basename(outputFile)}`));
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  AUDIT SUMMARY'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.cyan(`Actors Processed:           ${actors.length}`));
  console.log(chalk.gray(`Movies Scraped:             ${totalScraped}`));
  console.log(chalk.green(`✓ Properly Attributed:      ${totalAttributed}`));
  console.log(chalk.yellow(`⚠️  Needs Attribution:       ${totalNeedsAttribution} (${totalScraped > 0 ? Math.round(totalNeedsAttribution/totalScraped*100) : 0}%)`));
  console.log(chalk.red(`❌ Missing from DB:         ${totalMissing} (${totalScraped > 0 ? Math.round(totalMissing/totalScraped*100) : 0}%)`));
  
  if (totalNeedsAttribution > 0) {
    console.log(chalk.yellow.bold(`\n⚠️  CRITICAL: ${totalNeedsAttribution} movies exist in DB but need re-attribution!\n`));
  }
  
  console.log(chalk.gray(`Reports saved in: ${outputDir}/\n`));
  
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
