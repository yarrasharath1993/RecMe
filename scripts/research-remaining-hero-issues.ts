#!/usr/bin/env npx tsx
/**
 * Research Remaining Hero Attribution Issues
 * 
 * Generates a research template with TMDB data to help identify correct male leads
 * for the remaining 28 movies with wrong hero gender attribution
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
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Remaining movies that need hero attribution research
const REMAINING_MOVIES = [
  { title: 'Angeekaaram', year: 1977 },
  { title: 'Poombatta', year: 1971 },
  { title: 'Mahaguru', year: 1985 },
  { title: 'Agni Pareeksha', year: 1970 },
  { title: '—N/a', year: 2019 },
  { title: 'Oonjaal', year: 1977 },
  { title: 'Gift', year: 1984 },
  { title: 'Moondram Pirai', year: 1981 },
  { title: 'Poompatta', year: 1971 },
  { title: 'Solva Sawan', year: 1979 },
  { title: 'Meendum Kokila', year: 1982 },
  { title: 'Main Tera Dushman', year: 1989 },
  { title: 'Majaal', year: 1987 },
  { title: 'Guru', year: 1989 },
  { title: 'Chaand Kaa Tukdaa', year: 1994 },
  { title: 'Fire and Flames', year: 1986 },
  { title: 'Lamhe', year: 1992 },
  { title: 'Ram-Avtar', year: 1988 },
  { title: 'Pathar Ke Insan', year: 1990 },
  { title: 'Jawab Hum Denge', year: 1987 },
  { title: 'Aulad', year: 1987 },
  { title: 'Masterji', year: 1985 },
  { title: 'Ghar Sansar', year: 1986 },
  { title: 'Balidaan', year: 1985 },
  { title: 'Suhaagan', year: 1986 },
  { title: 'Ananda Thandavam', year: 2009 },
  { title: 'Chandra Mukhi', year: 1993 },
  { title: 'Pazhani', year: 2008 },
];

interface ResearchEntry {
  title: string;
  year: number;
  currentHero: string;
  currentHeroine: string;
  slug: string;
  tmdbData?: {
    title: string;
    cast: Array<{ name: string; character: string; gender: number }>;
    url: string;
  };
  status: 'found' | 'not_found' | 'needs_verification';
  suggestedHero?: string;
  notes: string;
}

async function searchTMDB(title: string, year: number): Promise<any> {
  if (!TMDB_API_KEY) {
    return null;
  }

  try {
    const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}&language=en-US`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.results || data.results.length === 0) return null;

    // Get the first result
    const movie = data.results[0];
    
    // Get cast details
    const creditsUrl = `${TMDB_BASE_URL}/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`;
    const creditsResponse = await fetch(creditsUrl);
    if (!creditsResponse.ok) return null;
    
    const credits = await creditsResponse.json();
    
    return {
      title: movie.title,
      cast: credits.cast.slice(0, 10), // Top 10 cast members
      url: `https://www.themoviedb.org/movie/${movie.id}`,
    };
  } catch (error) {
    return null;
  }
}

async function researchMovie(movieRef: { title: string; year: number }): Promise<ResearchEntry> {
  // Find in database
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .ilike('title_en', `%${movieRef.title}%`)
    .eq('release_year', movieRef.year)
    .limit(5);

  if (!movies || movies.length === 0) {
    return {
      title: movieRef.title,
      year: movieRef.year,
      currentHero: 'NOT FOUND',
      currentHeroine: 'NOT FOUND',
      slug: '',
      status: 'not_found',
      notes: 'Movie not found in database',
    };
  }

  const movie = movies.find(m => 
    m.title_en?.toLowerCase().includes(movieRef.title.toLowerCase())
  ) || movies[0];

  // Search TMDB
  const tmdbData = await searchTMDB(movie.title_en || movieRef.title, movieRef.year);

  // Determine suggested hero from TMDB cast (first male actor)
  let suggestedHero = '';
  let notes = '';

  if (tmdbData) {
    const maleCast = tmdbData.cast.filter((c: any) => c.gender === 2); // 2 = male in TMDB
    const femaleCast = tmdbData.cast.filter((c: any) => c.gender === 1); // 1 = female in TMDB
    
    if (maleCast.length > 0) {
      suggestedHero = maleCast[0].name;
      notes = `TMDB suggests: ${maleCast[0].name} (${maleCast[0].character || 'lead role'})`;
      
      if (maleCast.length > 1) {
        notes += `\nOther male leads: ${maleCast.slice(1, 3).map((c: any) => c.name).join(', ')}`;
      }
      
      if (femaleCast.length > 0) {
        notes += `\nFemale leads: ${femaleCast.slice(0, 2).map((c: any) => c.name).join(', ')}`;
      }
    } else {
      notes = 'No male cast found in TMDB data';
    }
  } else {
    notes = 'TMDB data not available - manual research needed';
  }

  return {
    title: movie.title_en || movieRef.title,
    year: movieRef.year,
    currentHero: movie.hero || 'null',
    currentHeroine: movie.heroine || 'null',
    slug: movie.slug,
    tmdbData: tmdbData || undefined,
    status: tmdbData ? 'found' : 'needs_verification',
    suggestedHero,
    notes,
  };
}

async function main() {
  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║      RESEARCH REMAINING HERO ATTRIBUTION ISSUES                      ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.cyan(`  Researching ${REMAINING_MOVIES.length} movies...\n`));

  const results: ResearchEntry[] = [];

  for (let i = 0; i < REMAINING_MOVIES.length; i++) {
    const movieRef = REMAINING_MOVIES[i];
    console.log(chalk.gray(`  [${i + 1}/${REMAINING_MOVIES.length}] Researching: ${movieRef.title} (${movieRef.year})...`));
    
    const result = await researchMovie(movieRef);
    results.push(result);
    
    // Rate limiting for TMDB API
    await new Promise(r => setTimeout(r, 300));
  }

  // Generate reports
  console.log(chalk.blue.bold(`\n\n═══════════════════════════════════════════════════════════════════════\n`));
  console.log(chalk.green.bold(`  RESEARCH COMPLETED!\n`));

  // Statistics
  const found = results.filter(r => r.status === 'found').length;
  const needsVerification = results.filter(r => r.status === 'needs_verification').length;
  const notFound = results.filter(r => r.status === 'not_found').length;

  console.log(chalk.cyan('  Statistics:'));
  console.log(chalk.green(`    ✓ Found with TMDB data: ${found}`));
  console.log(chalk.yellow(`    ⚠ Needs verification: ${needsVerification}`));
  console.log(chalk.red(`    ✗ Not found in database: ${notFound}`));

  // Generate markdown report
  const markdown = generateMarkdownReport(results);
  const mdPath = resolve(process.cwd(), 'docs/manual-review/hero-attribution-research.md');
  writeFileSync(mdPath, markdown);
  console.log(chalk.green(`\n  ✅ Markdown report: docs/manual-review/hero-attribution-research.md`));

  // Generate CSV report
  const csv = generateCSVReport(results);
  const csvPath = resolve(process.cwd(), 'docs/manual-review/hero-attribution-research.csv');
  writeFileSync(csvPath, csv);
  console.log(chalk.green(`  ✅ CSV report: docs/manual-review/hero-attribution-research.csv`));

  // Generate table for easy copy-paste
  console.log(chalk.blue.bold(`\n\n═══════════════════════════════════════════════════════════════════════`));
  console.log(chalk.cyan.bold('  RESEARCH TABLE (Ready for Manual Verification)\n'));
  console.log(generateConsoleTable(results.filter(r => r.status === 'found')));

  console.log(chalk.yellow.bold(`\n  ⚠️  NEEDS MANUAL RESEARCH (${needsVerification + notFound}):\n`));
  results
    .filter(r => r.status !== 'found')
    .forEach(r => {
      console.log(chalk.gray(`    • ${r.title} (${r.year}) - ${r.notes}`));
    });

  console.log(chalk.blue.bold(`\n\n═══════════════════════════════════════════════════════════════════════\n`));
  console.log(chalk.cyan('  NEXT STEPS:'));
  console.log(chalk.gray('    1. Review markdown report for detailed findings'));
  console.log(chalk.gray('    2. Verify TMDB suggestions against IMDb/Wikipedia'));
  console.log(chalk.gray('    3. Add manual corrections to the table'));
  console.log(chalk.gray('    4. Run apply-manual-research-fixes.ts with updated data\n'));
}

function generateMarkdownReport(results: ResearchEntry[]): string {
  let md = `# Hero Attribution Research Report\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Total Movies:** ${results.length}\n\n`;
  
  md += `## Summary\n\n`;
  md += `- ✅ Found with TMDB data: ${results.filter(r => r.status === 'found').length}\n`;
  md += `- ⚠️ Needs verification: ${results.filter(r => r.status === 'needs_verification').length}\n`;
  md += `- ❌ Not found in database: ${results.filter(r => r.status === 'not_found').length}\n\n`;

  md += `---\n\n## Movies with TMDB Data\n\n`;
  
  results.filter(r => r.status === 'found').forEach(r => {
    md += `### ${r.title} (${r.year})\n\n`;
    md += `**Current Attribution:**\n`;
    md += `- Hero: ${r.currentHero}\n`;
    md += `- Heroine: ${r.currentHeroine}\n`;
    md += `- URL: http://localhost:3000/movies/${r.slug}\n\n`;
    
    md += `**TMDB Suggestion:**\n`;
    md += `- Suggested Hero: **${r.suggestedHero}**\n`;
    md += `- TMDB: ${r.tmdbData?.url}\n\n`;
    
    if (r.tmdbData) {
      md += `**Full Cast:**\n`;
      r.tmdbData.cast.forEach((c: any, i: number) => {
        const gender = c.gender === 2 ? '♂️' : c.gender === 1 ? '♀️' : '?';
        md += `${i + 1}. ${gender} ${c.name}${c.character ? ` as ${c.character}` : ''}\n`;
      });
    }
    
    md += `\n**Notes:** ${r.notes}\n\n`;
    md += `---\n\n`;
  });

  md += `## Movies Needing Manual Research\n\n`;
  
  results.filter(r => r.status !== 'found').forEach(r => {
    md += `### ${r.title} (${r.year})\n\n`;
    md += `**Status:** ${r.status === 'not_found' ? 'Not found in database' : 'No TMDB data'}\n`;
    if (r.slug) {
      md += `**URL:** http://localhost:3000/movies/${r.slug}\n`;
      md += `**Current Hero:** ${r.currentHero}\n`;
    }
    md += `**Action Required:** Manual research using IMDb, Wikipedia, or other sources\n\n`;
    md += `---\n\n`;
  });

  return md;
}

function generateCSVReport(results: ResearchEntry[]): string {
  let csv = 'Title,Year,Current Hero,Current Heroine,Suggested Hero,Status,TMDB URL,Notes,Local URL\n';
  
  results.forEach(r => {
    const row = [
      `"${r.title}"`,
      r.year,
      `"${r.currentHero}"`,
      `"${r.currentHeroine}"`,
      `"${r.suggestedHero || ''}"`,
      r.status,
      `"${r.tmdbData?.url || ''}"`,
      `"${r.notes.replace(/\n/g, ' ')}"`,
      r.slug ? `"http://localhost:3000/movies/${r.slug}"` : '""',
    ];
    csv += row.join(',') + '\n';
  });
  
  return csv;
}

function generateConsoleTable(results: ResearchEntry[]): string {
  let table = '';
  table += 'Movie Title\tYear\tSuggested Male Lead (Hero)\tDetails\n';
  table += '─'.repeat(120) + '\n';
  
  results.forEach(r => {
    const details = r.tmdbData?.cast
      .filter((c: any) => c.gender === 2)
      .slice(0, 2)
      .map((c: any) => c.name)
      .join(', ') || 'See notes';
    
    table += `${r.title}\t${r.year}\t${r.suggestedHero}\t${details}\n`;
  });
  
  return table;
}

main().catch(console.error);
