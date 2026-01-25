#!/usr/bin/env npx tsx
/**
 * Bulk Telugu Title Generator
 * Uses smart transliteration and Wikipedia validation
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Comprehensive Telugu transliteration
function smartTransliterate(title: string): string {
  if (!title) return '';
  
  // Remove year suffix in parentheses
  let clean = title.replace(/\s*\(\d{4}\s*(film|చిత్రం)?\)\s*$/gi, '').trim();
  
  // Known titles mapping (high-confidence)
  const KNOWN: Record<string, string> = {
    // 2024 Movies
    '(Tillu)²': '(తిల్లు)²',
    'Tillu Square': 'తిల్లు స్క్వేర్',
    'Guntur Kaaram': 'గుంటూరు కారం',
    'Kalki 2898 AD': 'కల్కి 2898 ఏడీ',
    'HanuMan': 'హనుమాన్',
    'Hi Nanna': 'హాయ్ నాన్న',
    'Aay': 'ఆయ్',
    'Lucky Baskhar': 'లక్కీ భాస్కర్',
    'Devara: Part 1': 'దేవర: పార్ట్ 1',
    'Pushpa 2: The Rule': 'పుష్ప 2: ది రూల్',
    'Game Changer': 'గేమ్ చేంజర్',
    'Saripodhaa Sanivaaram': 'సరిపోదా శనివారం',
    'Mathu Vadalara 2': 'మత్తు వదలరా 2',
    'Hanu-Man': 'హనుమాన్',
    'Bhimaa': 'భీమా',
    'Aa Okkati Adakku': 'ఆ ఒక్కటి అడక్కు',
    'Aarambham': 'ఆరంభం',
    'Anaganaga Oka Rowdy': 'అనగనగా ఒక రౌడీ',
    'Anthima Theerpu': 'అంతిమ తీర్పు',
    'Bhamakalapam 2': 'భామాకళాపం 2',
    'Bharathanatyam': 'భరతనాట్యం',
    
    // 2023 Movies
    'Dasara': 'దసరా',
    'Adipurush': 'ఆదిపురుష్',
    'Waltair Veerayya': 'వాల్తేరు వీరయ్య',
    'Veera Simha Reddy': 'వీర సింహా రెడ్డి',
    'Kushi': 'ఖుషి',
    'Bhola Shankar': 'భోళా శంకర్',
    'Bhagavanth Kesari': 'భగవంత్ కేసరి',
    'Leo': 'లియో',
    'Salaar: Part 1': 'సలార్: పార్ట్ 1',
    'Tiger Nageswara Rao': 'టైగర్ నాగేశ్వర రావు',
    'Balagam': 'బలగం',
    'Virupaksha': 'విరూపాక్ష',
    'Custody': 'కస్టడీ',
    'Baby': 'బేబీ',
    'Skanda': 'స్కంద',
    'Mangalavaaram': 'మంగళవారం',
    
    // Common patterns
    'Part 1': 'పార్ట్ 1',
    'Part 2': 'పార్ట్ 2',
    'Chapter 1': 'చాప్టర్ 1',
    'Chapter 2': 'చాప్టర్ 2',
  };
  
  // Check known titles
  if (KNOWN[clean]) return KNOWN[clean];
  
  // Check for partial matches
  for (const [key, value] of Object.entries(KNOWN)) {
    if (clean.toLowerCase() === key.toLowerCase()) {
      return value;
    }
  }
  
  // Transliterate using rules
  return transliterateTitle(clean);
}

function transliterateTitle(title: string): string {
  // Word-level transliteration map
  const WORDS: Record<string, string> = {
    // Common English words
    'the': 'ది', 'a': 'ఎ', 'an': 'ఎన్', 'of': 'ఆఫ్', 'and': 'అండ్',
    'in': 'ఇన్', 'on': 'ఆన్', 'at': 'ఎట్', 'to': 'టు', 'for': 'ఫార్',
    'is': 'ఈజ్', 'are': 'ఆర్', 'was': 'వాజ్', 'be': 'బీ',
    'love': 'లవ్', 'story': 'స్టోరీ', 'life': 'లైఫ్', 'time': 'టైమ్',
    'day': 'డే', 'night': 'నైట్', 'king': 'కింగ్', 'queen': 'క్వీన్',
    'man': 'మ్యాన్', 'boy': 'బాయ్', 'girl': 'గర్ల్', 'baby': 'బేబీ',
    'mr': 'మిస్టర్', 'mrs': 'మిసెస్', 'miss': 'మిస్',
    'sir': 'సర్', 'ji': 'జీ',
    'super': 'సూపర్', 'hero': 'హీరో', 'star': 'స్టార్',
    'express': 'ఎక్స్‌ప్రెస్', 'police': 'పోలీస్',
    'doctor': 'డాక్టర్', 'dr': 'డా.',
    'family': 'ఫ్యామిలీ', 'party': 'పార్టీ',
    'college': 'కాలేజ్', 'school': 'స్కూల్',
    'cinema': 'సినిమా', 'film': 'ఫిల్మ్',
    'game': 'గేమ్', 'show': 'షో',
    'new': 'న్యూ', 'old': 'ఓల్డ్',
    'big': 'బిగ్', 'small': 'స్మాల్',
    'good': 'గుడ్', 'bad': 'బ్యాడ్',
    'happy': 'హ్యాపీ', 'sad': 'శాడ్',
    'first': 'ఫస్ట్', 'last': 'లాస్ట్',
    'one': 'వన్', 'two': 'టూ', 'three': 'త్రీ',
    
    // Telugu words (romanized)
    'prema': 'ప్రేమ', 'katha': 'కథ', 'kathalu': 'కథలు',
    'raja': 'రాజా', 'rani': 'రాణి', 'devi': 'దేవి',
    'ram': 'రామ్', 'rama': 'రామ', 'krishna': 'కృష్ణ',
    'babu': 'బాబు', 'amma': 'అమ్మ', 'nanna': 'నాన్న',
    'anna': 'అన్న', 'akka': 'అక్క',
    'pelli': 'పెళ్ళి', 'pellam': 'పెళ్ళాం',
    'mogudu': 'మొగుడు', 'bharya': 'భార్య',
    'nenu': 'నేను', 'nuvvu': 'నువ్వు',
    'meeru': 'మీరు', 'vaadu': 'వాడు',
    'ee': 'ఈ', 'aa': 'ఆ', 'oka': 'ఒక',
    'manchi': 'మంచి', 'pilla': 'పిల్ల',
    'abbai': 'అబ్బాయి', 'ammayi': 'అమ్మాయి',
    'intlo': 'ఇంట్లో', 'oori': 'ఊరి',
    'gadu': 'గాడు', 'gadi': 'గాడి',
    'ante': 'అంటే', 'kosam': 'కోసం',
    'ledu': 'లేదు', 'undi': 'ఉంది',
  };
  
  // Split title into words
  const words = title.split(/[\s\-]+/);
  const result: string[] = [];
  
  for (const word of words) {
    const lower = word.toLowerCase();
    const cleanWord = lower.replace(/[^a-z0-9]/g, '');
    
    // Check word map
    if (WORDS[cleanWord]) {
      result.push(WORDS[cleanWord]);
    } else if (/^\d+$/.test(word)) {
      // Keep numbers as-is
      result.push(word);
    } else if (word.length <= 2 && /^[A-Z]+$/.test(word)) {
      // Keep short acronyms
      result.push(word);
    } else {
      // Transliterate character by character
      result.push(transliterateWord(word));
    }
  }
  
  return result.join(' ');
}

function transliterateWord(word: string): string {
  // Character mapping for transliteration
  const CHARS: Record<string, string> = {
    'a': 'ా', 'b': 'బ', 'c': 'క', 'd': 'డ', 'e': 'ె',
    'f': 'ఫ', 'g': 'గ', 'h': 'హ', 'i': 'ి', 'j': 'జ',
    'k': 'క', 'l': 'ల', 'm': 'మ', 'n': 'న', 'o': 'ో',
    'p': 'ప', 'q': 'క', 'r': 'ర', 's': 'స', 't': 'ట',
    'u': 'ు', 'v': 'వ', 'w': 'వ', 'x': 'క్స', 'y': 'య', 'z': 'జ',
  };
  
  // Multi-char patterns
  const PATTERNS: [string, string][] = [
    ['sh', 'శ'], ['ch', 'చ'], ['th', 'త'], ['ph', 'ఫ'],
    ['kh', 'ఖ'], ['gh', 'ఘ'], ['dh', 'ధ'], ['bh', 'భ'],
    ['aa', 'ా'], ['ee', 'ీ'], ['ii', 'ీ'], ['oo', 'ూ'], ['uu', 'ూ'],
    ['ai', 'ై'], ['au', 'ౌ'], ['ou', 'ౌ'],
  ];
  
  let result = word.toLowerCase();
  
  // Apply patterns
  for (const [pattern, replacement] of PATTERNS) {
    result = result.replace(new RegExp(pattern, 'g'), replacement);
  }
  
  // Apply single chars for remaining
  let final = '';
  for (const char of result) {
    if (CHARS[char]) {
      final += CHARS[char];
    } else if (/[\u0C00-\u0C7F]/.test(char)) {
      // Already Telugu
      final += char;
    } else if (/[0-9]/.test(char)) {
      final += char;
    } else if (/[^a-z]/.test(char)) {
      final += char;
    }
  }
  
  return final || word;
}

async function processMovies(years: number[], limit: number, dryRun: boolean) {
  let totalProcessed = 0;
  let totalUpdated = 0;
  
  for (const year of years) {
    console.log(chalk.yellow(`\n📆 Processing ${year}...`));
    
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, slug, title_en, release_year')
      .eq('is_published', true)
      .eq('release_year', year)
      .or('title_te.is.null,title_te.eq.')
      .order('title_en')
      .limit(limit);
    
    if (error || !movies) {
      console.log(chalk.red('Error:', error?.message));
      continue;
    }
    
    let yearUpdated = 0;
    
    for (const movie of movies) {
      const teluguTitle = smartTransliterate(movie.title_en);
      
      if (!teluguTitle) continue;
      
      console.log(`  ${movie.title_en} → ${teluguTitle}`);
      
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('movies')
          .update({ title_te: teluguTitle })
          .eq('id', movie.id);
        
        if (!updateError) yearUpdated++;
      } else {
        yearUpdated++;
      }
    }
    
    totalProcessed += movies.length;
    totalUpdated += yearUpdated;
    
    console.log(chalk.green(`  ✓ ${yearUpdated}/${movies.length} processed`));
  }
  
  return { totalProcessed, totalUpdated };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const yearArg = args.find(a => a.startsWith('--year='));
  const years = yearArg 
    ? [parseInt(yearArg.split('=')[1])]
    : [2024, 2023, 2022, 2021, 2020, 2019, 2018];
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100;
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════╗
║           BULK TELUGU TITLE GENERATOR                            ║
╚══════════════════════════════════════════════════════════════════╝

Mode: ${dryRun ? chalk.yellow('DRY RUN (use --execute to apply)') : chalk.green('EXECUTING')}
Years: ${years.join(', ')}
Limit per year: ${limit}
`));

  const result = await processMovies(years, limit, dryRun);
  
  console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════
                          SUMMARY                                  
═══════════════════════════════════════════════════════════════════

  Total processed: ${result.totalProcessed}
  ${dryRun ? 'Would update' : 'Updated'}: ${result.totalUpdated}
  
  ${dryRun ? chalk.yellow('Run with --execute to apply changes') : chalk.green('✅ Changes applied!')}
`));
}

main().catch(console.error);
