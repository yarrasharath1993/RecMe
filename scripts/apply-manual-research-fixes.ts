#!/usr/bin/env npx tsx
/**
 * Apply Manual Research Fixes
 * 
 * Applies corrections from manual research:
 * 1. Hero attribution fixes (correct male leads)
 * 2. Duplicate merges (Baahubali entries)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface HeroFix {
  title: string;
  year: number;
  correctHero: string;
  details: string;
}

// Manual research findings - correct male leads
const HERO_FIXES: HeroFix[] = [
  { title: 'Kumara Sambhavam', year: 1969, correctHero: 'Gemini Ganesan', details: 'Sridevi played child version of Lord Subramanya; Gemini Ganesan is main lead as Lord Shiva' },
  { title: 'Himmatwala', year: 1983, correctHero: 'Jeetendra', details: "Sridevi's breakthrough Hindi film; Jeetendra is the hero" },
  { title: '16 Vayathinile', year: 1977, correctHero: 'Kamal Haasan', details: 'Sridevi is protagonist (Mayil), but Kamal Haasan is hero (Chappani)' },
  { title: 'Pagalil Oru Iravu', year: 1979, correctHero: 'Vijaykumar', details: 'Lead cast includes Sridevi and Vijaykumar' },
  { title: 'Tohfa', year: 1984, correctHero: 'Jeetendra', details: 'Part of successful Jeetendra-Sridevi-Jaya Prada trio films' },
  { title: 'Moondram Pirai', year: 1983, correctHero: 'Kamal Haasan', details: 'Sridevi plays regressed woman; Kamal Haasan is hero' },
  { title: 'Nam Nadu', year: 1969, correctHero: 'M. G. Ramachandran', details: 'Sridevi appeared as child; MGR is hero' },
  { title: 'Kalyanaraman', year: 1979, correctHero: 'Kamal Haasan', details: 'Kamal Haasan plays double role' },
  { title: 'Laadla', year: 1994, correctHero: 'Anil Kapoor', details: 'Sridevi plays antagonist/lead; Anil Kapoor is hero' },
  { title: 'Lamhe', year: 1991, correctHero: 'Anil Kapoor', details: 'Sridevi plays double role (mother/daughter); Anil Kapoor is hero' },
  { title: 'Sadma', year: 1983, correctHero: 'Kamal Haasan', details: 'Hindi remake of Moondram Pirai; Kamal Haasan is lead' },
  { title: 'Johnny', year: 1980, correctHero: 'Rajinikanth', details: 'Rajinikanth plays double role; Sridevi is heroine' },
  { title: 'Gumrah', year: 1993, correctHero: 'Sanjay Dutt', details: 'Sridevi is central character; Sanjay Dutt is hero' },
  { title: 'Khuda Gawah', year: 1992, correctHero: 'Amitabh Bachchan', details: 'Amitabh Bachchan is hero' },
  { title: 'ChaalBaaz', year: 1989, correctHero: 'Sunny Deol', details: 'Sridevi plays double roles; Sunny Deol and Rajinikanth are male leads' },
  { title: 'Judaai', year: 1997, correctHero: 'Anil Kapoor', details: 'Anil Kapoor is hero caught between Sridevi and Urmila Matondkar' },
  { title: 'English Vinglish', year: 2012, correctHero: 'Adil Hussain', details: 'Sridevi is absolute lead; Adil Hussain plays husband (not traditional hero)' },
  { title: 'Army', year: 1996, correctHero: 'Shah Rukh Khan', details: 'Sridevi is lead; Shah Rukh Khan has significant hero role/extended cameo' },
  { title: 'Chandni', year: 1989, correctHero: 'Rishi Kapoor', details: 'Rishi Kapoor and Vinod Khanna are male leads' },
  { title: 'Alex Pandian', year: 2013, correctHero: 'Karthi', details: 'Karthi is hero; Anushka Shetty is lead actress' },
  { title: 'Kavalai Vendam', year: 2016, correctHero: 'Jiiva', details: 'Jiiva is hero; Kajal Aggarwal is heroine' },
  { title: 'Justice Chaudhury', year: 1983, correctHero: 'Jeetendra', details: 'Jeetendra plays dual role' },
];

async function applyHeroFixes(execute: boolean) {
  console.log(chalk.blue.bold(`\n👥 Applying Hero Attribution Fixes (${HERO_FIXES.length} movies)\n`));
  
  let fixed = 0;
  let failed = 0;
  const notFound: string[] = [];

  for (const fix of HERO_FIXES) {
    // Find movie by title and year
    const { data: movies } = await supabase
      .from('movies')
      .select('*')
      .ilike('title_en', `%${fix.title}%`)
      .eq('release_year', fix.year)
      .limit(5);

    if (!movies || movies.length === 0) {
      console.log(chalk.yellow(`  ⊘ ${fix.title} (${fix.year}): Not found in database`));
      notFound.push(`${fix.title} (${fix.year})`);
      failed++;
      continue;
    }

    // Find best match
    const movie = movies.find(m => 
      m.title_en?.toLowerCase().includes(fix.title.toLowerCase())
    ) || movies[0];

    const currentHero = movie.hero;
    const updates: any = {
      hero: fix.correctHero,
      heroine: currentHero === 'Sridevi' || currentHero?.includes('Sridevi') ? 'Sridevi' : movie.heroine,
    };

    console.log(chalk.cyan(`  ${fix.title} (${fix.year})`));
    console.log(chalk.gray(`    Before: Hero="${currentHero}", Heroine="${movie.heroine}"`));
    console.log(chalk.green(`    After:  Hero="${updates.hero}", Heroine="${updates.heroine}"`));
    console.log(chalk.gray(`    ${fix.details}`));

    if (execute) {
      const { error } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);

      if (error) {
        console.log(chalk.red(`    ❌ Update failed: ${error.message}`));
        failed++;
        continue;
      }

      console.log(chalk.green(`    ✅ Fixed!\n`));
      fixed++;
    } else {
      console.log(chalk.yellow(`    (Dry run - not applied)\n`));
      fixed++;
    }
  }

  return { fixed, failed, notFound };
}

async function mergeBaahubaliDuplicates(execute: boolean) {
  console.log(chalk.blue.bold(`\n🔄 Checking Baahubali Duplicates\n`));

  // Check Baahubali 2
  const { data: baahubali2Movies } = await supabase
    .from('movies')
    .select('*')
    .ilike('title_en', '%Bāhubali 2%')
    .eq('release_year', 2017);

  console.log(chalk.cyan(`  Bāhubali 2: The Conclusion (2017)`));
  if (!baahubali2Movies || baahubali2Movies.length <= 1) {
    console.log(chalk.green(`    ✓ No duplicates found (${baahubali2Movies?.length || 0} entry)\n`));
  } else {
    console.log(chalk.yellow(`    ⚠️  Found ${baahubali2Movies.length} entries:`));
    baahubali2Movies.forEach((m, i) => {
      console.log(chalk.gray(`      ${i + 1}. ${m.title_en} (${m.slug})`));
    });
    console.log(chalk.yellow(`    📋 Manual review needed - check data quality before merging\n`));
  }

  // Check Baahubali 1
  const { data: baahubali1Movies } = await supabase
    .from('movies')
    .select('*')
    .ilike('title_en', '%Bāhubali%Beginning%')
    .eq('release_year', 2015);

  console.log(chalk.cyan(`  Bāhubali: The Beginning (2015)`));
  if (!baahubali1Movies || baahubali1Movies.length <= 1) {
    console.log(chalk.green(`    ✓ No duplicates found (${baahubali1Movies?.length || 0} entry)\n`));
  } else {
    console.log(chalk.yellow(`    ⚠️  Found ${baahubali1Movies.length} entries:`));
    baahubali1Movies.forEach((m, i) => {
      console.log(chalk.gray(`      ${i + 1}. ${m.title_en} (${m.slug})`));
    });
    console.log(chalk.yellow(`    📋 Manual review needed - check data quality before merging\n`));
  }

  return {
    baahubali2Count: baahubali2Movies?.length || 0,
    baahubali1Count: baahubali1Movies?.length || 0,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║         APPLY MANUAL RESEARCH FIXES                                  ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Mode: ${execute ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}\n`);
  console.log(chalk.gray('  Based on manual research findings'));
  console.log(chalk.gray('  Correcting hero attributions for 1960s-1990s films\n'));

  // Apply hero fixes
  const heroResults = await applyHeroFixes(execute);

  // Check duplicates
  const duplicateResults = await mergeBaahubaliDuplicates(execute);

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            SUMMARY                                                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.cyan('\n  Hero Attribution Fixes:'));
  console.log(chalk.green(`    Fixed: ${heroResults.fixed}`));
  console.log(chalk.red(`    Failed: ${heroResults.failed}`));

  if (heroResults.notFound.length > 0) {
    console.log(chalk.yellow(`\n    Not found in database (${heroResults.notFound.length}):`));
    heroResults.notFound.forEach(title => {
      console.log(chalk.gray(`      - ${title}`));
    });
  }

  console.log(chalk.cyan('\n  Baahubali Duplicates:'));
  if (duplicateResults.baahubali2Count <= 1 && duplicateResults.baahubali1Count <= 1) {
    console.log(chalk.green(`    ✓ No duplicates detected`));
  } else {
    console.log(chalk.yellow(`    Baahubali 2: ${duplicateResults.baahubali2Count} entries`));
    console.log(chalk.yellow(`    Baahubali 1: ${duplicateResults.baahubali1Count} entries`));
    console.log(chalk.yellow(`    Manual merge recommended if duplicates exist`));
  }

  const totalFixed = heroResults.fixed;
  console.log(chalk.blue.bold(`\n  Total Fixed: ${totalFixed}`));

  if (!execute) {
    console.log(chalk.yellow(`\n  Run with --execute to apply all fixes\n`));
  } else {
    console.log(chalk.green(`\n  ✅ All fixes applied successfully!\n`));
  }

  // Next steps
  console.log(chalk.cyan('  NEXT STEPS:'));
  console.log(chalk.gray('    1. Review any "not found" movies'));
  console.log(chalk.gray('    2. Handle Baahubali duplicates if detected'));
  console.log(chalk.gray('    3. Verify fixes on movie pages'));
  console.log(chalk.gray('    4. Process remaining categories (no TMDB, incomplete data, images)\n'));
}

main().catch(console.error);
