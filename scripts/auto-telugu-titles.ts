#!/usr/bin/env npx tsx
/**
 * Auto-generate Telugu Titles via Transliteration
 * Converts English movie titles to Telugu script
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Telugu transliteration map
const TELUGU_MAP: Record<string, string> = {
  // Vowels
  'a': 'ా', 'aa': 'ా', 'i': 'ి', 'ii': 'ీ', 'ee': 'ీ',
  'u': 'ు', 'uu': 'ూ', 'oo': 'ూ', 'e': 'ె', 'ai': 'ై',
  'o': 'ో', 'au': 'ౌ', 'ou': 'ౌ',
  
  // Consonants
  'k': 'క', 'kh': 'ఖ', 'g': 'గ', 'gh': 'ఘ', 'ng': 'ఙ',
  'ch': 'చ', 'chh': 'ఛ', 'j': 'జ', 'jh': 'ఝ',
  't': 'ట', 'th': 'థ', 'd': 'డ', 'dh': 'ధ', 'n': 'న',
  'p': 'ప', 'ph': 'ఫ', 'f': 'ఫ', 'b': 'బ', 'bh': 'భ', 'm': 'మ',
  'y': 'య', 'r': 'ర', 'l': 'ల', 'v': 'వ', 'w': 'వ',
  'sh': 'శ', 's': 'స', 'h': 'హ', 'x': 'క్స', 'z': 'జ',
  'q': 'క', 'c': 'క',
};

// Common word mappings for Telugu film titles
const WORD_MAP: Record<string, string> = {
  // Common words
  'the': 'ది', 'a': 'ఎ', 'an': 'ఎన్', 'of': 'ఆఫ్', 'and': 'అండ్', '&': 'అండ్',
  'in': 'ఇన్', 'on': 'ఆన్', 'at': 'ఎట్', 'to': 'టు', 'for': 'ఫార్',
  'is': 'ఈజ్', 'are': 'ఆర్', 'was': 'వాజ్', 'be': 'బీ',
  'my': 'మై', 'your': 'యువర్', 'our': 'అవర్', 'his': 'హిజ్', 'her': 'హర్',
  'love': 'లవ్', 'story': 'స్టోరీ', 'life': 'లైఫ్', 'time': 'టైమ్',
  'day': 'డే', 'night': 'నైట్', 'year': 'ఇయర్', 'years': 'ఇయర్స్',
  'king': 'కింగ్', 'queen': 'క్వీన్', 'prince': 'ప్రిన్స్',
  'man': 'మ్యాన్', 'men': 'మెన్', 'woman': 'వుమన్', 'women': 'విమెన్',
  'boy': 'బాయ్', 'girl': 'గర్ల్', 'baby': 'బేబీ',
  'mr': 'మిస్టర్', 'mrs': 'మిసెస్', 'miss': 'మిస్',
  'sir': 'సర్', 'madam': 'మేడమ్',
  
  // Numbers
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
  '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  '10': '10', '100': '100', '1000': '1000',
  
  // Common Telugu film words (keep as-is transliterated)
  'prema': 'ప్రేమ', 'katha': 'కథ', 'katha': 'కథ',
  'raja': 'రాజా', 'rani': 'రాణి', 'devi': 'దేవి',
  'ram': 'రామ్', 'rama': 'రామ', 'krishna': 'కృష్ణ',
  'babu': 'బాబు', 'amma': 'అమ్మ', 'nanna': 'నాన్న',
  'anna': 'అన్న', 'akka': 'అక్క', 'chelli': 'చెల్లి',
  'pellam': 'పెళ్ళాం', 'pelli': 'పెళ్ళి', 'mogudu': 'మొగుడు',
  'nenu': 'నేను', 'nuvvu': 'నువ్వు', 'meeru': 'మీరు',
  'ee': 'ఈ', 'aa': 'ఆ', 'oka': 'ఒక',
  
  // Common English words in Telugu cinema
  'express': 'ఎక్స్‌ప్రెస్', 'super': 'సూపర్', 'hero': 'హీరో',
  'police': 'పోలీస్', 'doctor': 'డాక్టర్', 'college': 'కాలేజీ',
  'school': 'స్కూల్', 'cinema': 'సినిమా', 'film': 'ఫిల్మ్',
  'party': 'పార్టీ', 'family': 'ఫ్యామిలీ', 'friends': 'ఫ్రెండ్స్',
};

// Smart transliteration function
function transliterateToTelugu(text: string): string {
  // Handle special cases
  if (!text || text.trim() === '') return '';
  
  // Clean the title
  let title = text.trim();
  
  // Remove content in parentheses if it's year or subtitle
  title = title.replace(/\s*\([^)]*\)\s*$/g, '').trim();
  
  // Check if it's already mostly Telugu (contains Telugu characters)
  if (/[\u0C00-\u0C7F]/.test(title)) {
    return title;
  }
  
  // Split into words
  const words = title.split(/\s+/);
  const teluguWords: string[] = [];
  
  for (const word of words) {
    const lowerWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Check word map first
    if (WORD_MAP[lowerWord]) {
      teluguWords.push(WORD_MAP[lowerWord]);
      continue;
    }
    
    // Handle numbers
    if (/^\d+$/.test(word)) {
      teluguWords.push(word);
      continue;
    }
    
    // Handle special characters
    if (/^[#@!?:]+$/.test(word)) {
      teluguWords.push(word);
      continue;
    }
    
    // Transliterate the word
    teluguWords.push(transliterateWord(word));
  }
  
  return teluguWords.join(' ');
}

function transliterateWord(word: string): string {
  // Keep special characters
  const prefix = word.match(/^[^a-zA-Z0-9]+/)?.[0] || '';
  const suffix = word.match(/[^a-zA-Z0-9]+$/)?.[0] || '';
  const cleanWord = word.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9]+$/, '');
  
  if (!cleanWord) return word;
  
  let result = '';
  let i = 0;
  const lower = cleanWord.toLowerCase();
  
  while (i < lower.length) {
    // Try 3-letter combinations
    if (i + 2 < lower.length) {
      const three = lower.substring(i, i + 3);
      if (TELUGU_MAP[three]) {
        result += TELUGU_MAP[three];
        i += 3;
        continue;
      }
    }
    
    // Try 2-letter combinations
    if (i + 1 < lower.length) {
      const two = lower.substring(i, i + 2);
      if (TELUGU_MAP[two]) {
        result += TELUGU_MAP[two];
        i += 2;
        continue;
      }
    }
    
    // Single letter
    const one = lower[i];
    if (TELUGU_MAP[one]) {
      result += TELUGU_MAP[one];
    } else if (/[0-9]/.test(one)) {
      result += one;
    } else {
      // Keep unknown characters
      result += one;
    }
    i++;
  }
  
  return prefix + result + suffix;
}

// Better approach: use phonetic patterns
function phoneticToTelugu(title: string): string {
  // Common Telugu title patterns
  const patterns: [RegExp, string][] = [
    // Common suffixes
    [/(\w)lu$/gi, '$1లు'],
    [/(\w)du$/gi, '$1డు'],
    [/(\w)mu$/gi, '$1ము'],
    [/(\w)nu$/gi, '$1ను'],
    [/(\w)vu$/gi, '$1వు'],
    
    // Common word endings
    [/am$/gi, 'ం'],
    [/an$/gi, 'న్'],
    [/ar$/gi, 'ర్'],
    [/al$/gi, 'ల్'],
    
    // Vowel handling
    [/aa/gi, 'ా'],
    [/ee/gi, 'ీ'],
    [/ii/gi, 'ీ'],
    [/oo/gi, 'ూ'],
    [/uu/gi, 'ూ'],
    [/ai/gi, 'ై'],
    [/au/gi, 'ౌ'],
    [/ou/gi, 'ౌ'],
  ];
  
  let result = title;
  for (const [pattern, replacement] of patterns) {
    result = result.replace(pattern, replacement);
  }
  
  return result;
}

// Main title generator using simple approach
function generateTeluguTitle(englishTitle: string): string {
  if (!englishTitle) return '';
  
  // Known direct mappings for common films
  const KNOWN_TITLES: Record<string, string> = {
    '(Tillu)²': '(తిల్లు)²',
    'Tillu Square': 'తిల్లు స్క్వేర్',
    'Guntur Kaaram': 'గుంటూరు కారం',
    'Salaar': 'సలార్',
    'Kalki 2898 AD': 'కల్కి 2898 ఏడీ',
    'Devara': 'దేవర',
    'Pushpa 2': 'పుష్ప 2',
    'HanuMan': 'హనుమాన్',
    'Hi Nanna': 'హాయ్ నాన్న',
    'Lucky Baskhar': 'లక్కీ భాస్కర్',
    'Game Changer': 'గేమ్ చేంజర్',
    'Saripodhaa Sanivaaram': 'సరిపోదా శనివారం',
  };
  
  // Check known titles first
  const cleanTitle = englishTitle.replace(/\s*\([^)]*\)\s*$/g, '').trim();
  if (KNOWN_TITLES[cleanTitle]) {
    return KNOWN_TITLES[cleanTitle];
  }
  
  // Use transliteration
  return transliterateToTelugu(englishTitle);
}

async function processMovies(year: number, limit: number = 50, dryRun: boolean = true) {
  console.log(chalk.cyan(`\n📋 Processing ${year} movies (limit: ${limit}, dry-run: ${dryRun})`));
  
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, slug, title_en, title_te, release_year')
    .eq('is_published', true)
    .eq('release_year', year)
    .or('title_te.is.null,title_te.eq.')
    .order('title_en')
    .limit(limit);
  
  if (error || !movies) {
    console.log(chalk.red('Error fetching movies:', error?.message));
    return { processed: 0, updated: 0 };
  }
  
  let updated = 0;
  
  for (const movie of movies) {
    const teluguTitle = generateTeluguTitle(movie.title_en);
    
    if (!teluguTitle) continue;
    
    console.log(`  ${movie.title_en} → ${teluguTitle}`);
    
    if (!dryRun) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({ title_te: teluguTitle })
        .eq('id', movie.id);
      
      if (!updateError) updated++;
    } else {
      updated++;
    }
  }
  
  return { processed: movies.length, updated };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const yearArg = args.find(a => a.startsWith('--year='));
  const year = yearArg ? parseInt(yearArg.split('=')[1]) : 2024;
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 50;
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════╗
║           AUTO TELUGU TITLE GENERATOR                            ║
╚══════════════════════════════════════════════════════════════════╝

Mode: ${dryRun ? chalk.yellow('DRY RUN (use --execute to apply)') : chalk.green('EXECUTING')}
Year: ${year}
Limit: ${limit}
`));

  const result = await processMovies(year, limit, dryRun);
  
  console.log(chalk.cyan(`
═══════════════════════════════════════════════════════════════════
                          SUMMARY                                  
═══════════════════════════════════════════════════════════════════

  Processed: ${result.processed}
  ${dryRun ? 'Would update' : 'Updated'}: ${result.updated}
  
  ${dryRun ? chalk.yellow('Run with --execute to apply changes') : chalk.green('✅ Changes applied!')}
`));
}

main().catch(console.error);
