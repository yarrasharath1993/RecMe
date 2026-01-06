import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Duplicate pairs to clean up - keep the first, delete the second
const DUPLICATE_PAIRS = [
  { keep: 'Chattamtho Poratam', delete: 'Chattam Tho Poratam', year: 1985 },
  { keep: 'Attaku Yamudu Ammayiki Mogudu', delete: 'attakuyamudu ammayiki mogudu', year: 1989 },
  { keep: 'Jagadeka Veerudu Athiloka Sundari', delete: 'Jagadeeka Veerudu Athiloka Sundari', year: 1990 },
  { keep: 'Alluda Majaka', delete: 'Alludaa Majakaa', year: 1995 },
  { keep: 'Lankeswarudu', delete: 'Lankeshwarudu', year: 1989 },
  { keep: 'Mana Shankara Vara Prasad Garu', delete: 'Mana Shankaravaraprasad Garu', year: 2026 },
  { keep: 'Malle Pandiri', delete: 'Malle Pandhiri', year: 1982 },
  { keep: 'Simhapuri Simham', delete: 'Simhapoori Simham', year: 1983 },
];

// Person names that are incorrectly entered as movie titles
const PERSON_NAMES_TO_DELETE = [
  { title: 'Bhanumathi Ramakrishna', year: 1982 },
  { title: 'Kodi Ramakrishna', year: 1982 },
  { title: 'Savithiri', year: 1982 },
];

// Pre-debut movies (before 1978) - Chiranjeevi was supporting, not lead
const PRE_DEBUT_FIXES = [
  { title: 'Gajula Kishtayya', year: 1975, correctHero: 'Krishna' },
  { title: 'Ramayya Thandri', year: 1975, correctHero: 'Krishna' },
  { title: 'Muthyala Pallaki', year: 1976, correctHero: 'Sobhan Babu' },
  { title: 'Premalekhalu', year: 1977, correctHero: 'Murali Mohan' },
  { title: 'Aame Katha', year: 1977, correctHero: 'Murali Mohan' },
];

async function cleanupDuplicates(dryRun: boolean = true): Promise<number> {
  console.log('\n──────────────────────────────────────────────────────────────────────────────');
  console.log('PHASE 1: CLEANUP DUPLICATE ENTRIES');
  console.log('──────────────────────────────────────────────────────────────────────────────\n');

  let deletedCount = 0;

  for (const pair of DUPLICATE_PAIRS) {
    // Find the duplicate to delete
    const { data: duplicates, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year')
      .eq('language', 'Telugu')
      .ilike('title_en', pair.delete);

    if (error) {
      console.error(`Error finding duplicate "${pair.delete}":`, error);
      continue;
    }

    if (duplicates && duplicates.length > 0) {
      for (const dup of duplicates) {
        console.log(`✓ Deleting duplicate: "${dup.title_en}" (${dup.release_year})`);
        console.log(`  Keeping: "${pair.keep}"`);
        
        if (!dryRun) {
          const { error: deleteError } = await supabase
            .from('movies')
            .delete()
            .eq('id', dup.id);

          if (deleteError) {
            console.error(`  ✗ Delete failed:`, deleteError);
          } else {
            deletedCount++;
          }
        } else {
          deletedCount++;
        }
      }
    } else {
      console.log(`⚠ Duplicate not found: "${pair.delete}"`);
    }
  }

  console.log(`\nDuplicates deleted: ${deletedCount}`);
  return deletedCount;
}

async function deletePersonNames(dryRun: boolean = true): Promise<number> {
  console.log('\n──────────────────────────────────────────────────────────────────────────────');
  console.log('PHASE 2: DELETE PERSON NAME ENTRIES');
  console.log('──────────────────────────────────────────────────────────────────────────────\n');

  let deletedCount = 0;

  for (const entry of PERSON_NAMES_TO_DELETE) {
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year')
      .eq('language', 'Telugu')
      .ilike('title_en', entry.title)
      .eq('release_year', entry.year);

    if (error) {
      console.error(`Error finding "${entry.title}":`, error);
      continue;
    }

    if (movies && movies.length > 0) {
      for (const movie of movies) {
        console.log(`✓ Deleting person name entry: "${movie.title_en}" (${movie.release_year})`);
        
        if (!dryRun) {
          const { error: deleteError } = await supabase
            .from('movies')
            .delete()
            .eq('id', movie.id);

          if (deleteError) {
            console.error(`  ✗ Delete failed:`, deleteError);
          } else {
            deletedCount++;
          }
        } else {
          deletedCount++;
        }
      }
    } else {
      console.log(`⚠ Person name entry not found: "${entry.title}" (${entry.year})`);
    }
  }

  console.log(`\nPerson name entries deleted: ${deletedCount}`);
  return deletedCount;
}

async function fixPreDebutMovies(dryRun: boolean = true): Promise<number> {
  console.log('\n──────────────────────────────────────────────────────────────────────────────');
  console.log('PHASE 3: FIX PRE-DEBUT MOVIES (Before 1978)');
  console.log('──────────────────────────────────────────────────────────────────────────────\n');

  let fixedCount = 0;

  for (const fix of PRE_DEBUT_FIXES) {
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, hero, cast_members')
      .eq('language', 'Telugu')
      .ilike('title_en', fix.title)
      .eq('release_year', fix.year);

    if (error) {
      console.error(`Error finding "${fix.title}":`, error);
      continue;
    }

    if (movies && movies.length > 0) {
      for (const movie of movies) {
        console.log(`✓ Fixing: "${movie.title_en}" (${movie.release_year})`);
        console.log(`  Current hero: ${movie.hero} → Correct hero: ${fix.correctHero}`);
        
        // Update cast_members to add Chiranjeevi as supporting if not present
        let castMembers = movie.cast_members || [];
        if (typeof castMembers === 'string') {
          try {
            castMembers = JSON.parse(castMembers);
          } catch (e) {
            castMembers = [];
          }
        }

        // Parse existing cast members
        const parsedCast = castMembers.map((c: string | object) => 
          typeof c === 'string' ? JSON.parse(c) : c
        );

        // Check if Chiranjeevi is already in cast
        const hasChiranjeevi = parsedCast.some((c: any) => 
          c.name?.toLowerCase().includes('chiranjeevi')
        );

        if (!hasChiranjeevi) {
          parsedCast.push({
            name: 'Chiranjeevi',
            role: 'supporting',
            order: parsedCast.length
          });
          console.log(`  Added Chiranjeevi as supporting cast`);
        } else {
          // Update existing Chiranjeevi entry to supporting
          parsedCast.forEach((c: any) => {
            if (c.name?.toLowerCase().includes('chiranjeevi')) {
              c.role = 'supporting';
            }
          });
          console.log(`  Updated Chiranjeevi role to supporting`);
        }

        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('movies')
            .update({ 
              hero: fix.correctHero,
              cast_members: parsedCast
            })
            .eq('id', movie.id);

          if (updateError) {
            console.error(`  ✗ Update failed:`, updateError);
          } else {
            fixedCount++;
          }
        } else {
          fixedCount++;
        }
      }
    } else {
      console.log(`⚠ Movie not found: "${fix.title}" (${fix.year})`);
    }
  }

  console.log(`\nPre-debut movies fixed: ${fixedCount}`);
  return fixedCount;
}

async function generate1982_83ReviewList(): Promise<void> {
  console.log('\n──────────────────────────────────────────────────────────────────────────────');
  console.log('PHASE 4: 1982-83 MOVIES FOR MANUAL REVIEW');
  console.log('──────────────────────────────────────────────────────────────────────────────\n');

  // Official Chiranjeevi lead films from 1982-83
  const officialLeadFilms = new Set([
    'subhalekha', 'tingu rangadu', 'bandhalu anubandhalu', 'khaidi', 
    'gudachari no.1', 'maga maharaju', 'roshagadu', 'abhilasha', 
    'aalaya sikharam', 'sangharshana', 'mantri gari viyyankudu', 
    'simhapuri simham', 'shivudu shivudu shivudu', 'puli bebbuli',
    'sivudu sivudu sivudu', 'allullostunnaru', 'intiguttu', 'devanthakudu',
    'mahanagaramlo mayagadu', 'challenge', 'naagu', 'agni gundam',
    'rustum', 'donga', 'chiranjeevi', 'jwaala', 'puli', 'rakta sindhuram',
    'vijetha', 'kirathakudu', 'kondaveeti raja', 'palletoori monagadu'
  ]);

  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, director')
    .eq('language', 'Telugu')
    .or('hero.ilike.%chiranjeevi%')
    .gte('release_year', 1982)
    .lte('release_year', 1983)
    .order('title_en', { ascending: true });

  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }

  const likelySupportingRoles: any[] = [];
  const confirmedLeadRoles: any[] = [];

  for (const movie of movies || []) {
    const normalizedTitle = movie.title_en.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    if (officialLeadFilms.has(normalizedTitle)) {
      confirmedLeadRoles.push(movie);
    } else {
      likelySupportingRoles.push(movie);
    }
  }

  console.log(`CONFIRMED LEAD ROLES (${confirmedLeadRoles.length} movies):`);
  console.log('────────────────────────────────────────');
  confirmedLeadRoles.forEach((m, i) => {
    console.log(`  ${i+1}. ${m.title_en} (${m.release_year})`);
  });

  console.log(`\n\nNEEDS MANUAL REVIEW - LIKELY SUPPORTING ROLES (${likelySupportingRoles.length} movies):`);
  console.log('────────────────────────────────────────');
  likelySupportingRoles.forEach((m, i) => {
    console.log(`  ${i+1}. ${m.title_en} (${m.release_year}) | Director: ${m.director || 'N/A'}`);
  });

  console.log(`\n\nFor each movie in the "NEEDS MANUAL REVIEW" list:`);
  console.log(`1. Verify if Chiranjeevi was the lead or supporting actor`);
  console.log(`2. If supporting, identify the actual lead actor`);
  console.log(`3. Update the hero field and add Chiranjeevi to cast_members with role: 'supporting'`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  
  console.log(`\n══════════════════════════════════════════════════════════════════════════════`);
  console.log(`CHIRANJEEVI FILMOGRAPHY CLEANUP (${dryRun ? 'DRY RUN' : 'LIVE'})`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);

  const duplicatesDeleted = await cleanupDuplicates(dryRun);
  const personNamesDeleted = await deletePersonNames(dryRun);
  const preDebutFixed = await fixPreDebutMovies(dryRun);
  await generate1982_83ReviewList();

  console.log(`\n══════════════════════════════════════════════════════════════════════════════`);
  console.log(`FINAL SUMMARY (${dryRun ? 'DRY RUN' : 'COMPLETED'})`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);
  console.log(`  Duplicates deleted:       ${duplicatesDeleted}`);
  console.log(`  Person names deleted:     ${personNamesDeleted}`);
  console.log(`  Pre-debut movies fixed:   ${preDebutFixed}`);
  console.log(`\n${dryRun ? 'Run with --execute to apply these changes.' : ''}`);
}

main().catch(console.error);


