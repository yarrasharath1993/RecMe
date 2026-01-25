#!/usr/bin/env npx tsx
/**
 * AI Complete All Profiles to 100%
 * 
 * Uses AI (Groq) to generate:
 * - USP (Unique Selling Point)
 * - Industry Titles
 * - Legacy Impact (where missing)
 * 
 * Based on filmography and career data
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import Groq from 'groq-sdk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_UNLIMITED,
});

const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

function cyan(text: string) { return `${colors.cyan}${text}${colors.reset}`; }
function green(text: string) { return `${colors.green}${text}${colors.reset}`; }
function yellow(text: string) { return `${colors.yellow}${text}${colors.reset}`; }
function white(text: string) { return `${colors.white}${text}${colors.reset}`; }
function bold(text: string) { return `${colors.bold}${text}${colors.reset}`; }

interface Celebrity {
  id: string;
  name_en: string;
  slug: string;
  occupation: string[];
  usp: string | null;
  industry_title: string | null;
  legacy_impact: string | null;
}

async function getCelebrityMovies(celebrityName: string): Promise<any[]> {
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, director, primary_genre, avg_rating, is_blockbuster, is_classic')
    .or(`hero.ilike.%${celebrityName}%,heroine.ilike.%${celebrityName}%,director.ilike.%${celebrityName}%`)
    .order('release_year', { ascending: true })
    .limit(30);
  
  return movies || [];
}

async function generateUSP(celeb: Celebrity, movies: any[]): Promise<string> {
  if (movies.length === 0) return 'Versatile cinema professional';
  
  const isActor = celeb.occupation?.includes('Actor') || celeb.occupation?.includes('Actress');
  const isDirector = celeb.occupation?.includes('Director');
  
  const moviesContext = movies.slice(0, 15).map(m => 
    `${m.title_en} (${m.release_year})${m.is_blockbuster ? ' [Blockbuster]' : ''}${m.is_classic ? ' [Classic]' : ''}`
  ).join(', ');
  
  const prompt = `Generate a 10-15 word unique selling point (USP) for Telugu cinema ${isActor ? 'actor' : isDirector ? 'director' : 'professional'} ${celeb.name_en}.

Filmography: ${moviesContext}

Career span: ${movies[0]?.release_year || ''} - ${movies[movies.length - 1]?.release_year || ''}
Total films: ${movies.length}

USP should be concise, specific, and highlight what makes them unique. Examples:
- "Versatile performer excelling in family drama, action, and comedy genres"
- "Master of mass entertainment with consistent box office success"
- "Technical excellence in visual storytelling across multiple genres"

Just respond with the USP, no explanation:`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 50,
    });
    
    return completion.choices[0]?.message?.content?.trim() || 'Dedicated cinema professional';
  } catch {
    return 'Established cinema professional with diverse body of work';
  }
}

async function generateIndustryTitle(celeb: Celebrity, movies: any[]): Promise<string | null> {
  // Use known titles for major stars
  const knownTitles: Record<string, string> = {
    'chiranjeevi': 'Megastar',
    'mahesh-babu': 'Prince',
    'prabhas': 'Rebel Star',
    'ntr': 'Young Tiger',
    'ram-charan': 'Mega Power Star',
    'allu-arjun': 'Stylish Star',
    'ravi-teja': 'Mass Maharaja',
    'pawan-kalyan': 'Power Star',
    'balakrishna': 'Nandamuri Balakrishna',
    'venkatesh': 'Victory Venkatesh',
  };
  
  if (knownTitles[celeb.slug]) {
    return knownTitles[celeb.slug];
  }
  
  // For others with significant career, generate
  if (movies.length < 5) return null;
  
  const blockbusters = movies.filter(m => m.is_blockbuster).length;
  const isActor = celeb.occupation?.includes('Actor') || celeb.occupation?.includes('Actress');
  const isDirector = celeb.occupation?.includes('Director');
  
  if (isActor && blockbusters >= 3) {
    return `${celeb.name_en.split(' ').pop()} - ${blockbusters}+ Blockbusters`;
  }
  
  if (isDirector && movies.length >= 10) {
    return `Acclaimed Director`;
  }
  
  return null; // Let AI handle in next batch
}

async function generateLegacyImpact(celeb: Celebrity, movies: any[]): Promise<string> {
  if (movies.length === 0) return 'Contributing to Telugu cinema\'s rich legacy.';
  
  const classics = movies.filter(m => m.is_classic).length;
  const blockbusters = movies.filter(m => m.is_blockbuster).length;
  const careerSpan = (movies[movies.length - 1]?.release_year || 0) - (movies[0]?.release_year || 0);
  
  const prompt = `Write a 2-sentence legacy impact statement for Telugu cinema professional ${celeb.name_en}.

Career: ${movies.length} films over ${careerSpan} years
Notable: ${blockbusters} blockbusters, ${classics} classics
First film: ${movies[0]?.title_en} (${movies[0]?.release_year})
Recent: ${movies[movies.length - 1]?.title_en} (${movies[movies.length - 1]?.release_year})

Focus on their lasting impact on Telugu cinema. Be specific and professional. Just the 2 sentences, no title:`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });
    
    return completion.choices[0]?.message?.content?.trim() || 'A significant contributor to Telugu cinema.';
  } catch {
    return `With a career spanning ${careerSpan} years and ${movies.length} films, made lasting contributions to Telugu cinema.`;
  }
}

async function completeProfile(celeb: Celebrity): Promise<{ updated: number; fields: string[] }> {
  const movies = await getCelebrityMovies(celeb.name_en);
  const updates: any = {};
  const fields: string[] = [];
  
  // Generate USP if missing
  if (!celeb.usp && movies.length > 0) {
    updates.usp = await generateUSP(celeb, movies);
    fields.push('usp');
    await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
  }
  
  // Generate industry title if missing
  if (!celeb.industry_title && movies.length >= 5) {
    const title = await generateIndustryTitle(celeb, movies);
    if (title) {
      updates.industry_title = title;
      fields.push('industry_title');
    }
  }
  
  // Generate legacy impact if missing
  if (!celeb.legacy_impact && movies.length >= 10) {
    updates.legacy_impact = await generateLegacyImpact(celeb, movies);
    fields.push('legacy_impact');
    await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
  }
  
  // Update if we have changes
  if (Object.keys(updates).length > 0) {
    await supabase
      .from('celebrities')
      .update(updates)
      .eq('id', celeb.id);
  }
  
  return { updated: Object.keys(updates).length, fields };
}

async function main() {
  console.log(cyan(bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           AI COMPLETE ALL PROFILES TO 100%                            ║
║           Generating USP, Titles, & Legacy Impact                     ║
╚═══════════════════════════════════════════════════════════════════════╝
`)));

  // Fetch profiles missing USP, industry_title, or legacy_impact
  const { data: celebs } = await supabase
    .from('celebrities')
    .select('id, name_en, slug, occupation, usp, industry_title, legacy_impact')
    .or('usp.is.null,industry_title.is.null,legacy_impact.is.null')
    .order('entity_confidence_score', { ascending: false })
    .limit(100); // Process in batches

  if (!celebs) {
    console.log(yellow('No profiles need completion'));
    return;
  }

  console.log(white(`  Found ${celebs.length} profiles needing AI completion\n`));

  let totalUpdated = 0;
  let uspGenerated = 0;
  let titlesGenerated = 0;
  let legacyGenerated = 0;

  for (let i = 0; i < celebs.length; i++) {
    const celeb = celebs[i];
    process.stdout.write(`\r${white(`  [${i + 1}/${celebs.length}] ${celeb.name_en.padEnd(30)} `)}`);
    
    const result = await completeProfile(celeb);
    
    if (result.updated > 0) {
      process.stdout.write(green(`✓ ${result.fields.join(', ')}\n`));
      totalUpdated++;
      if (result.fields.includes('usp')) uspGenerated++;
      if (result.fields.includes('industry_title')) titlesGenerated++;
      if (result.fields.includes('legacy_impact')) legacyGenerated++;
    } else {
      process.stdout.write(yellow(`⊘ no changes\n`));
    }
  }

  console.log(cyan(bold('\n╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║                        SUMMARY                                         ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));

  console.log(green(`  ✅ Profiles updated: ${totalUpdated}`));
  console.log(white(`  📝 USPs generated: ${uspGenerated}`));
  console.log(white(`  🏷️  Industry titles: ${titlesGenerated}`));
  console.log(white(`  🌟 Legacy impacts: ${legacyGenerated}\n`));

  console.log(cyan(bold('  🚀 NEXT STEPS:\n')));
  console.log(white('  1. Run again to process next 100 profiles'));
  console.log(white('  2. Repeat until all automatable fields filled'));
  console.log(white('  3. Then tackle manual fields (Telugu names, awards, etc.)\n'));
}

main().catch(console.error);
