#!/usr/bin/env npx tsx
/**
 * Mass Telugu Title Generator
 * Generates Telugu titles for all missing movies using smart rules
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Telugu vowels (dependent forms)
const VOWEL_MARKS: Record<string, string> = {
  'a': '', 'aa': 'ా', 'i': 'ి', 'ii': 'ీ', 'ee': 'ీ',
  'u': 'ు', 'uu': 'ూ', 'oo': 'ూ', 'e': 'ె', 'ae': 'ే',
  'ai': 'ై', 'o': 'ో', 'au': 'ౌ', 'ou': 'ౌ',
};

// Telugu consonants (with inherent 'a')
const CONSONANTS: Record<string, string> = {
  'k': 'క', 'kh': 'ఖ', 'g': 'గ', 'gh': 'ఘ', 'ng': 'ఙ',
  'ch': 'చ', 'chh': 'ఛ', 'j': 'జ', 'jh': 'ఝ', 'ny': 'ఞ',
  't': 'ట', 'th': 'థ', 'd': 'డ', 'dh': 'ధ', 'n': 'న',
  'p': 'ప', 'ph': 'ఫ', 'f': 'ఫ', 'b': 'బ', 'bh': 'భ', 'm': 'మ',
  'y': 'య', 'r': 'ర', 'l': 'ల', 'v': 'వ', 'w': 'వ',
  'sh': 'శ', 's': 'స', 'h': 'హ', 'ksh': 'క్ష', 'gn': 'జ్ఞ',
  'c': 'క', 'q': 'క', 'x': 'క్స', 'z': 'జ',
};

// Independent vowels
const VOWELS: Record<string, string> = {
  'a': 'అ', 'aa': 'ఆ', 'i': 'ఇ', 'ii': 'ఈ', 'ee': 'ఈ',
  'u': 'ఉ', 'uu': 'ఊ', 'oo': 'ఊ', 'e': 'ఎ', 'ae': 'ఏ',
  'ai': 'ఐ', 'o': 'ఒ', 'au': 'ఔ', 'ou': 'ఔ',
};

// Word mappings for common Telugu/English words
const WORD_MAP: Record<string, string> = {
  // Telugu words (romanized -> Telugu script)
  'amma': 'అమ్మ', 'nanna': 'నాన్న', 'anna': 'అన్న', 'akka': 'అక్క',
  'chelli': 'చెల్లి', 'tammudu': 'తమ్ముడు', 'babu': 'బాబు', 'bava': 'బావ',
  'pellam': 'పెళ్ళాం', 'mogudu': 'మొగుడు', 'pelli': 'పెళ్ళి', 'kalyanam': 'కల్యాణం',
  'prema': 'ప్రేమ', 'katha': 'కథ', 'kathalu': 'కథలు', 'paatalu': 'పాటలు',
  'raja': 'రాజా', 'raju': 'రాజు', 'rani': 'రాణి', 'devi': 'దేవి',
  'devudu': 'దేవుడు', 'swamy': 'స్వామి', 'garu': 'గారు', 'ayya': 'అయ్య',
  'nenu': 'నేను', 'nuvvu': 'నువ్వు', 'meeru': 'మీరు', 'manam': 'మనం',
  'vaadu': 'వాడు', 'aame': 'ఆమె', 'vaaru': 'వారు', 'vaallu': 'వాళ్ళు',
  'intlo': 'ఇంట్లో', 'illu': 'ఇల్లు', 'ooru': 'ఊరు', 'oori': 'ఊరి',
  'manishi': 'మనిషి', 'abbai': 'అబ్బాయి', 'ammayi': 'అమ్మాయి', 'pilla': 'పిల్ల',
  'pilladu': 'పిల్లాడు', 'pillu': 'పిల్లు', 'koduku': 'కొడుకు', 'koothuru': 'కూతురు',
  'oka': 'ఒక', 'okka': 'ఒక్క', 'rendu': 'రెండు', 'moodu': 'మూడు',
  'ee': 'ఈ', 'aa': 'ఆ', 'adi': 'అది', 'idi': 'ఇది', 'edi': 'ఏది',
  'ikkada': 'ఇక్కడ', 'akkada': 'అక్కడ', 'ekkada': 'ఎక్కడ',
  'ante': 'అంటే', 'kosam': 'కోసం', 'tho': 'తో', 'lo': 'లో', 'ki': 'కి',
  'undi': 'ఉంది', 'ledu': 'లేదు', 'unnaru': 'ఉన్నారు', 'leru': 'లేరు',
  'ra': 'రా', 'randi': 'రండి', 'po': 'పో', 'povali': 'పోవాలి',
  'manchi': 'మంచి', 'chala': 'చాలా', 'baaga': 'బాగా',
  'sandeham': 'సందేహం', 'sandadi': 'సందడి', 'santhosham': 'సంతోషం',
  'bangaru': 'బంగారు', 'bangaram': 'బంగారం', 'mutyam': 'ముత్యం',
  'raatri': 'రాత్రి', 'pagalu': 'పగలు', 'udhayam': 'ఉదయం', 'saayantram': 'సాయంత్రం',
  'rowdy': 'రౌడీ', 'hero': 'హీరో', 'heroine': 'హీరోయిన్',
  'police': 'పోలీస్', 'doctor': 'డాక్టర్', 'master': 'మాస్టర్',
  'college': 'కాలేజీ', 'school': 'స్కూల్', 'office': 'ఆఫీస్',
  'love': 'లవ్', 'story': 'స్టోరీ', 'family': 'ఫ్యామిలీ', 'friend': 'ఫ్రెండ్',
  'super': 'సూపర్', 'star': 'స్టార్', 'king': 'కింగ్', 'queen': 'క్వీన్',
  'express': 'ఎక్స్‌ప్రెస్', 'special': 'స్పెషల్',
  'part': 'పార్ట్', 'chapter': 'చాప్టర్', 'episode': 'ఎపిసోడ్',
  
  // Common suffixes
  'udu': 'ుడు', 'adu': 'ాడు', 'alu': 'ాలు', 'am': 'ం', 'an': 'న్',
  
  // Numbers
  '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
};

// Function to convert a single word
function convertWord(word: string): string {
  if (!word) return '';
  
  // Check word map first
  const lower = word.toLowerCase();
  if (WORD_MAP[lower]) return WORD_MAP[lower];
  
  // Keep numbers
  if (/^\d+$/.test(word)) return word;
  
  // Keep special chars only
  if (/^[^a-zA-Z0-9]+$/.test(word)) return word;
  
  // Smart transliteration
  return smartTransliterate(word);
}

function smartTransliterate(word: string): string {
  let result = '';
  let i = 0;
  const w = word.toLowerCase();
  
  while (i < w.length) {
    // Try to match consonant clusters first (3 chars)
    if (i + 2 < w.length) {
      const three = w.substring(i, i + 3);
      if (CONSONANTS[three]) {
        // Check for following vowel
        const nextVowel = getNextVowel(w, i + 3);
        if (nextVowel.vowel) {
          result += CONSONANTS[three] + (VOWEL_MARKS[nextVowel.vowel] || '');
          i = nextVowel.nextIndex;
          continue;
        } else {
          result += CONSONANTS[three] + '్'; // Add halant for consonant without vowel
          i += 3;
          continue;
        }
      }
    }
    
    // Try 2-char consonants
    if (i + 1 < w.length) {
      const two = w.substring(i, i + 2);
      if (CONSONANTS[two]) {
        const nextVowel = getNextVowel(w, i + 2);
        if (nextVowel.vowel) {
          result += CONSONANTS[two] + (VOWEL_MARKS[nextVowel.vowel] || '');
          i = nextVowel.nextIndex;
          continue;
        } else {
          result += CONSONANTS[two];
          i += 2;
          continue;
        }
      }
      
      // Try 2-char vowel at start
      if (i === 0 || result === '') {
        if (VOWELS[two]) {
          result += VOWELS[two];
          i += 2;
          continue;
        }
      }
    }
    
    // Single consonant
    const char = w[i];
    if (CONSONANTS[char]) {
      const nextVowel = getNextVowel(w, i + 1);
      if (nextVowel.vowel) {
        result += CONSONANTS[char] + (VOWEL_MARKS[nextVowel.vowel] || '');
        i = nextVowel.nextIndex;
        continue;
      } else {
        result += CONSONANTS[char];
        i++;
        continue;
      }
    }
    
    // Independent vowel at start
    if (VOWELS[char] && (i === 0 || result === '')) {
      result += VOWELS[char];
      i++;
      continue;
    }
    
    // Unknown character - keep as is
    result += char;
    i++;
  }
  
  return result;
}

function getNextVowel(word: string, startIndex: number): { vowel: string | null; nextIndex: number } {
  if (startIndex >= word.length) return { vowel: null, nextIndex: startIndex };
  
  // Try 2-char vowels first
  if (startIndex + 1 < word.length) {
    const two = word.substring(startIndex, startIndex + 2);
    if (VOWEL_MARKS[two] !== undefined) {
      return { vowel: two, nextIndex: startIndex + 2 };
    }
  }
  
  // Single vowel
  const char = word[startIndex];
  if (VOWEL_MARKS[char] !== undefined) {
    return { vowel: char, nextIndex: startIndex + 1 };
  }
  
  // Default 'a' for consonant
  return { vowel: 'a', nextIndex: startIndex };
}

function generateTeluguTitle(englishTitle: string): string {
  if (!englishTitle) return '';
  
  // Clean title (remove year suffix)
  let title = englishTitle.replace(/\s*\(\d{4}\s*(film|చిత్రం)?\)\s*$/gi, '').trim();
  
  // Already has Telugu - return as is
  if (/[\u0C00-\u0C7F]/.test(title)) return title;
  
  // Split into words
  const words = title.split(/[\s\-]+/);
  const teluguWords: string[] = [];
  
  for (const word of words) {
    teluguWords.push(convertWord(word));
  }
  
  return teluguWords.join(' ');
}

async function processDecade(decade: number, limit: number, dryRun: boolean) {
  console.log(chalk.yellow(`\n📆 Processing ${decade}s...`));
  
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year')
    .eq('is_published', true)
    .gte('release_year', decade)
    .lt('release_year', decade + 10)
    .or('title_te.is.null,title_te.eq.')
    .order('release_year', { ascending: false })
    .limit(limit);
  
  if (error || !movies) {
    console.log(chalk.red('Error:', error?.message));
    return 0;
  }
  
  let updated = 0;
  
  for (const movie of movies) {
    const teluguTitle = generateTeluguTitle(movie.title_en);
    
    if (!teluguTitle) continue;
    
    if (!dryRun) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({ title_te: teluguTitle })
        .eq('id', movie.id);
      
      if (!updateError) {
        updated++;
        if (updated <= 5 || updated % 50 === 0) {
          console.log(`  ${movie.title_en} → ${teluguTitle}`);
        }
      }
    } else {
      updated++;
      if (updated <= 5) {
        console.log(`  ${movie.title_en} → ${teluguTitle}`);
      }
    }
  }
  
  console.log(chalk.green(`  ✓ ${updated}/${movies.length} processed`));
  return updated;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 1000;
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════╗
║         MASS TELUGU TITLE GENERATOR                              ║
╚══════════════════════════════════════════════════════════════════╝

Mode: ${dryRun ? chalk.yellow('DRY RUN (use --execute to apply)') : chalk.green('EXECUTING')}
Limit per decade: ${limit}
`));

  const decades = [2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950, 1940, 1930];
  let total = 0;
  
  for (const decade of decades) {
    total += await processDecade(decade, limit, dryRun);
  }
  
  // Also process null years
  console.log(chalk.yellow('\n📆 Processing movies with no year...'));
  const { data: nullYearMovies } = await supabase
    .from('movies')
    .select('id, slug, title_en')
    .eq('is_published', true)
    .is('release_year', null)
    .or('title_te.is.null,title_te.eq.')
    .limit(limit);
  
  if (nullYearMovies) {
    for (const movie of nullYearMovies) {
      const teluguTitle = generateTeluguTitle(movie.title_en);
      if (!teluguTitle) continue;
      
      if (!dryRun) {
        await supabase.from('movies').update({ title_te: teluguTitle }).eq('id', movie.id);
        total++;
      } else {
        total++;
      }
    }
    console.log(chalk.green(`  ✓ ${nullYearMovies.length} processed`));
  }
  
  console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════

  Total ${dryRun ? 'would update' : 'updated'}: ${total}
  
  ${dryRun ? chalk.yellow('Run with --execute to apply changes') : chalk.green('✅ Changes applied!')}
`));
}

main().catch(console.error);
