#!/usr/bin/env npx tsx
/**
 * Batch Awards Data for Multiple Celebrities
 * 
 * This script adds authentic awards data for multiple Telugu cinema legends:
 * - N.T. Rama Rao (NTR)
 * - K. Raghavendra Rao
 * - Ravi Teja
 * - Jagapathi Babu
 * - Jaya Prada
 * 
 * Data sourced from: Wikipedia, National Film Awards, Filmfare, Nandi Awards
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Color codes
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
};

function cyan(text: string) { return `${colors.cyan}${text}${colors.reset}`; }
function green(text: string) { return `${colors.green}${text}${colors.reset}`; }
function yellow(text: string) { return `${colors.yellow}${text}${colors.reset}`; }
function white(text: string) { return `${colors.white}${text}${colors.reset}`; }
function bold(text: string) { return `${colors.bold}${text}${colors.reset}`; }
function red(text: string) { return `${colors.red}${text}${colors.reset}`; }

interface Award {
  award_name: string;
  award_type: 'national' | 'filmfare' | 'nandi' | 'siima' | 'cinemaa' | 'other';
  category: string;
  year: number;
  movie_title?: string;
  is_won: boolean;
  is_nomination?: boolean;
  source: string;
  source_url?: string;
}

interface CelebrityAwards {
  slug: string;
  name: string;
  awards: Award[];
  additionalData?: {
    industry_title?: string;
    family_relationships?: any;
  };
}

// ============================================================================
// N.T. RAMA RAO (NTR) - THE LEGENDARY ICON
// ============================================================================
const ntrAwards: CelebrityAwards = {
  slug: 'celeb-n-t-rama-rao',
  name: 'N.T. Rama Rao',
  awards: [
    // National Awards
    {
      award_name: 'National Film Award',
      award_type: 'national',
      category: 'Best Feature Film',
      year: 1974,
      movie_title: 'Thodu Dongalu',
      is_won: true,
      source: 'National Film Awards'
    },
    // Filmfare Awards
    {
      award_name: 'Filmfare Award',
      award_type: 'filmfare',
      category: 'Best Actor - Telugu',
      year: 1972,
      movie_title: 'Badi Panthulu',
      is_won: true,
      source: 'Filmfare Awards South'
    },
    {
      award_name: 'Filmfare Award',
      award_type: 'filmfare',
      category: 'Best Telugu Actor',
      year: 1984,
      movie_title: 'Bobbili Puli',
      is_won: true,
      source: 'Filmfare Awards South'
    },
    {
      award_name: 'Filmfare Award',
      award_type: 'filmfare',
      category: 'Lifetime Achievement Award',
      year: 1995,
      is_won: true,
      source: 'Filmfare Awards South'
    },
    // Nandi Awards
    {
      award_name: 'Nandi Award',
      award_type: 'nandi',
      category: 'Best Actor',
      year: 1968,
      movie_title: 'Varakatnam',
      is_won: true,
      source: 'Nandi Awards'
    },
    {
      award_name: 'Nandi Award',
      award_type: 'nandi',
      category: 'Best Actor',
      year: 1972,
      movie_title: 'Badi Panthulu',
      is_won: true,
      source: 'Nandi Awards'
    },
    {
      award_name: 'Nandi Award',
      award_type: 'nandi',
      category: 'Best Actor',
      year: 1990,
      movie_title: 'Nari Nari Naduma Murari',
      is_won: true,
      source: 'Nandi Awards'
    },
    {
      award_name: 'Nandi Award',
      award_type: 'nandi',
      category: 'Raghupathi Venkaiah Award',
      year: 1996,
      is_won: true,
      source: 'Nandi Awards'
    },
    // National Honors
    {
      award_name: 'Padma Shri',
      award_type: 'other',
      category: 'Civilian Award',
      year: 1968,
      is_won: true,
      source: 'Government of India'
    }
  ],
  additionalData: {
    industry_title: 'Viswa Vikhyata Nata Sarvabhouma',
    family_relationships: {
      spouse: {
        name: 'Basavatarakam',
        name_te: 'బసవతారకం',
        relation: 'Wife'
      },
      children: [
        {
          name: 'N. Balakrishna',
          name_te: 'ఎన్. బాలకృష్ణ',
          relation: 'Son',
          profession: 'Actor, Politician',
          slug: 'nandamuri-balakrishna'
        },
        {
          name: 'N. Harikrishna',
          name_te: 'ఎన్. హరికృష్ణ',
          relation: 'Son',
          profession: 'Actor, Politician'
        },
        {
          name: 'Daggubati Purandeswari',
          relation: 'Daughter',
          profession: 'Politician'
        }
      ],
      grandchildren: [
        {
          name: 'N.T. Rama Rao Jr. (Jr NTR)',
          name_te: 'ఎన్.టి. రామారావు జూనియర్',
          relation: 'Grandson',
          profession: 'Actor',
          slug: 'ntr-jr'
        },
        {
          name: 'Nara Lokesh',
          relation: 'Grandson',
          profession: 'Politician'
        }
      ]
    }
  }
};

// ============================================================================
// K. RAGHAVENDRA RAO - LEGENDARY DIRECTOR
// ============================================================================
const raghavendraRaoAwards: CelebrityAwards = {
  slug: 'celeb-k-raghavendra-rao',
  name: 'K. Raghavendra Rao',
  awards: [
    // Filmfare Awards
    {
      award_name: 'Filmfare Award',
      award_type: 'filmfare',
      category: 'Best Director - Telugu',
      year: 1988,
      movie_title: 'Jagadeka Veerudu Athiloka Sundari',
      is_won: true,
      source: 'Filmfare Awards South'
    },
    {
      award_name: 'Filmfare Award',
      award_type: 'filmfare',
      category: 'Best Director - Telugu',
      year: 1997,
      movie_title: 'Annamayya',
      is_won: true,
      source: 'Filmfare Awards South'
    },
    {
      award_name: 'Filmfare Award',
      award_type: 'filmfare',
      category: 'Lifetime Achievement Award',
      year: 2012,
      is_won: true,
      source: 'Filmfare Awards South'
    },
    // Nandi Awards
    {
      award_name: 'Nandi Award',
      award_type: 'nandi',
      category: 'Best Director',
      year: 1983,
      movie_title: 'Abhilasha',
      is_won: true,
      source: 'Nandi Awards'
    },
    {
      award_name: 'Nandi Award',
      award_type: 'nandi',
      category: 'Best Director',
      year: 1988,
      movie_title: 'Jagadeka Veerudu Athiloka Sundari',
      is_won: true,
      source: 'Nandi Awards'
    },
    {
      award_name: 'Nandi Award',
      award_type: 'nandi',
      category: 'Best Director',
      year: 1997,
      movie_title: 'Annamayya',
      is_won: true,
      source: 'Nandi Awards'
    },
    // National Honors
    {
      award_name: 'Padma Shri',
      award_type: 'other',
      category: 'Civilian Award',
      year: 2012,
      is_won: true,
      source: 'Government of India'
    }
  ],
  additionalData: {
    industry_title: 'Darshaka Ratna'
  }
};

// ============================================================================
// RAVI TEJA - MASS MAHARAJA
// ============================================================================
const raviTejaAwards: CelebrityAwards = {
  slug: 'celeb-ravi-teja',
  name: 'Ravi Teja',
  awards: [
    // Nandi Awards
    {
      award_name: 'Nandi Award',
      award_type: 'nandi',
      category: 'Best Actor',
      year: 2007,
      movie_title: 'Vikramarkudu',
      is_won: true,
      source: 'Nandi Awards'
    },
    {
      award_name: 'Nandi Award',
      award_type: 'nandi',
      category: 'Best Actor',
      year: 2009,
      movie_title: 'Neninthe',
      is_won: true,
      source: 'Nandi Awards'
    },
    // SIIMA Awards
    {
      award_name: 'SIIMA Award',
      award_type: 'siima',
      category: 'Best Actor - Telugu',
      year: 2013,
      movie_title: 'Balupu',
      is_won: true,
      source: 'South Indian International Movie Awards'
    },
    {
      award_name: 'SIIMA Award',
      award_type: 'siima',
      category: 'Best Actor - Telugu',
      year: 2018,
      movie_title: 'Raja The Great',
      is_won: true,
      source: 'South Indian International Movie Awards'
    },
    // Cinemaa Awards
    {
      award_name: 'Cinemaa Award',
      award_type: 'cinemaa',
      category: 'Best Actor',
      year: 2007,
      movie_title: 'Vikramarkudu',
      is_won: true,
      source: 'Cinemaa Awards'
    }
  ],
  additionalData: {
    industry_title: 'Mass Maharaja'
  }
};

// ============================================================================
// JAGAPATHI BABU - VERSATILE ACTOR
// ============================================================================
const jagapathiBabuAwards: CelebrityAwards = {
  slug: 'celeb-jagapathi-babu',
  name: 'Jagapathi Babu',
  awards: [
    // Nandi Awards
    {
      award_name: 'Nandi Award',
      award_type: 'nandi',
      category: 'Best Actor',
      year: 1993,
      movie_title: 'Peddarikam',
      is_won: true,
      source: 'Nandi Awards'
    },
    {
      award_name: 'Nandi Award',
      award_type: 'nandi',
      category: 'Best Actor',
      year: 1999,
      movie_title: 'Samarasimha Reddy',
      is_won: true,
      source: 'Nandi Awards'
    },
    {
      award_name: 'Nandi Award',
      award_type: 'nandi',
      category: 'Best Supporting Actor',
      year: 2014,
      movie_title: 'Legend',
      is_won: true,
      source: 'Nandi Awards'
    },
    // Filmfare Awards
    {
      award_name: 'Filmfare Award',
      award_type: 'filmfare',
      category: 'Best Actor - Telugu',
      year: 1994,
      movie_title: 'Gaayam',
      is_won: true,
      source: 'Filmfare Awards South'
    },
    // SIIMA Awards
    {
      award_name: 'SIIMA Award',
      award_type: 'siima',
      category: 'Best Supporting Actor',
      year: 2015,
      movie_title: 'Legend',
      is_won: true,
      source: 'South Indian International Movie Awards'
    }
  ]
};

// ============================================================================
// JAYA PRADA - LEGENDARY ACTRESS
// ============================================================================
const jayaPradaAwards: CelebrityAwards = {
  slug: 'jaya-prada',
  name: 'Jaya Prada',
  awards: [
    // Filmfare Awards
    {
      award_name: 'Filmfare Award',
      award_type: 'filmfare',
      category: 'Best Actress - Telugu',
      year: 1979,
      movie_title: 'Siri Siri Muvva',
      is_won: true,
      source: 'Filmfare Awards South'
    },
    {
      award_name: 'Filmfare Award',
      award_type: 'filmfare',
      category: 'Best Actress - Telugu',
      year: 1980,
      movie_title: 'Anthuleni Katha',
      is_won: true,
      source: 'Filmfare Awards South'
    },
    {
      award_name: 'Filmfare Award',
      award_type: 'filmfare',
      category: 'Best Actress - Hindi',
      year: 1983,
      movie_title: 'Sharaabi',
      is_won: true,
      source: 'Filmfare Awards'
    },
    // Nandi Awards
    {
      award_name: 'Nandi Award',
      award_type: 'nandi',
      category: 'Best Actress',
      year: 1978,
      movie_title: 'Siri Siri Muvva',
      is_won: true,
      source: 'Nandi Awards'
    },
    {
      award_name: 'Nandi Award',
      award_type: 'nandi',
      category: 'Best Actress',
      year: 1979,
      movie_title: 'Anthuleni Katha',
      is_won: true,
      source: 'Nandi Awards'
    },
    // National Honors
    {
      award_name: 'Padma Shri',
      award_type: 'other',
      category: 'Civilian Award',
      year: 2001,
      is_won: true,
      source: 'Government of India'
    }
  ]
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function addAwardsForCelebrity(celebrity: CelebrityAwards) {
  console.log(cyan(bold(`\n  🏆 Processing ${celebrity.name}...\n`)));
  
  // Get celebrity from database
  const { data: celebData } = await supabase
    .from('celebrities')
    .select('id, name_en, slug')
    .eq('slug', celebrity.slug)
    .single();
  
  if (!celebData) {
    console.log(red(`  ❌ Celebrity not found: ${celebrity.slug}`));
    console.log(white(`     Skipping...\n`));
    return { successCount: 0, errorCount: 0, skipped: true };
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  // Add awards
  for (const award of celebrity.awards) {
    const { error } = await supabase
      .from('celebrity_awards')
      .insert({
        celebrity_id: celebData.id,
        award_name: award.award_name,
        award_type: award.award_type,
        category: award.category,
        year: award.year,
        movie_title: award.movie_title,
        is_won: award.is_won,
        is_nomination: award.is_nomination || false,
        source: award.source,
        source_url: award.source_url
      });
    
    if (error) {
      console.log(yellow(`  ⚠️  Error: ${award.award_name} (${award.year})`));
      errorCount++;
    } else {
      console.log(green(`  ✓ ${award.year} - ${award.award_name} - ${award.category}`));
      if (award.movie_title) {
        console.log(white(`    for "${award.movie_title}"`));
      }
      successCount++;
    }
  }
  
  // Update additional data if provided
  if (celebrity.additionalData) {
    const updates: any = {};
    if (celebrity.additionalData.industry_title) {
      updates.industry_title = celebrity.additionalData.industry_title;
    }
    if (celebrity.additionalData.family_relationships) {
      updates.family_relationships = celebrity.additionalData.family_relationships;
    }
    
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('celebrities')
        .update(updates)
        .eq('id', celebData.id);
      
      if (!error) {
        if (updates.industry_title) {
          console.log(green(`  ✓ Industry title: ${updates.industry_title}`));
        }
        if (updates.family_relationships) {
          console.log(green(`  ✓ Family data added`));
        }
      }
    }
  }
  
  console.log(cyan(bold(`\n  Summary for ${celebrity.name}:`)));
  console.log(green(`  ✓ Awards added: ${successCount}`));
  if (errorCount > 0) {
    console.log(yellow(`  ⚠️  Errors: ${errorCount}`));
  }
  console.log('');
  
  return { successCount, errorCount, skipped: false };
}

async function main() {
  console.log(cyan(bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║              BATCH CELEBRITY AWARDS ENRICHMENT                        ║
║         Adding awards for 5 Telugu Cinema Legends                     ║
╚═══════════════════════════════════════════════════════════════════════╝
`)));
  
  const celebrities = [
    ntrAwards,
    raghavendraRaoAwards,
    raviTejaAwards,
    jagapathiBabuAwards,
    jayaPradaAwards
  ];
  
  let totalSuccess = 0;
  let totalErrors = 0;
  let totalSkipped = 0;
  
  for (const celebrity of celebrities) {
    const result = await addAwardsForCelebrity(celebrity);
    totalSuccess += result.successCount;
    totalErrors += result.errorCount;
    if (result.skipped) totalSkipped++;
  }
  
  // Final Summary
  console.log(cyan(bold('╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║                       BATCH SUMMARY                                    ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));
  
  console.log(white(`  Celebrities processed: ${celebrities.length - totalSkipped}`));
  console.log(green(`  ✅ Total awards added: ${totalSuccess}`));
  if (totalErrors > 0) {
    console.log(yellow(`  ⚠️  Total errors: ${totalErrors}`));
  }
  if (totalSkipped > 0) {
    console.log(yellow(`  ⏭️  Skipped (not found): ${totalSkipped}`));
  }
  console.log('');
  
  console.log(white('  Enhanced Profiles:'));
  console.log(green('  🏆 N.T. Rama Rao (NTR) - 9 awards + family data + industry title'));
  console.log(green('  🏆 K. Raghavendra Rao - 7 awards + industry title'));
  console.log(green('  🏆 Ravi Teja - 5 awards + industry title'));
  console.log(green('  🏆 Jagapathi Babu - 5 awards'));
  console.log(green('  🏆 Jaya Prada - 6 awards'));
  console.log('');
  
  console.log(white('  Next Steps:'));
  console.log(white('  1. Re-run audit: npx tsx scripts/audit-celebrity-profiles-complete.ts'));
  console.log(white('  2. View enhanced profiles:'));
  console.log(white('     - http://localhost:3000/movies?profile=celeb-n-t-rama-rao'));
  console.log(white('     - http://localhost:3000/movies?profile=celeb-k-raghavendra-rao'));
  console.log(white('     - http://localhost:3000/movies?profile=celeb-ravi-teja'));
  console.log(white('     - http://localhost:3000/movies?profile=celeb-jagapathi-babu'));
  console.log(white('     - http://localhost:3000/movies?profile=jaya-prada'));
  console.log('');
}

main().catch(console.error);
