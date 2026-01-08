/**
 * DATA QUALITY & CLEANUP SCRIPT
 * 
 * Detects and fixes:
 * - Orphan records (reviews without movies, etc.)
 * - Duplicate entities
 * - Incomplete entries
 * - Missing images
 * - Broken references
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

// ============================================================
// SUPABASE CLIENT
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// VALIDATION RULES
// ============================================================

interface ValidationIssue {
  type: 'orphan' | 'duplicate' | 'incomplete' | 'broken_reference' | 'missing_image';
  severity: 'critical' | 'high' | 'medium' | 'low';
  entity: string;
  entityId: string;
  description: string;
  fixable: boolean;
}

const issues: ValidationIssue[] = [];

// ============================================================
// ORPHAN DETECTION
// ============================================================

async function detectOrphanReviews() {
  console.log('\n🔍 Checking for orphan reviews...');
  
  const { data: reviews } = await supabase
    .from('movie_reviews')
    .select('id, movie_id');

  if (!reviews) return;

  for (const review of reviews) {
    const { data: movie } = await supabase
      .from('movies')
      .select('id')
      .eq('id', review.movie_id)
      .single();

    if (!movie) {
      issues.push({
        type: 'orphan',
        severity: 'high',
        entity: 'movie_reviews',
        entityId: review.id,
        description: `Review ${review.id} references non-existent movie ${review.movie_id}`,
        fixable: true,
      });
    }
  }

  console.log(`   Found ${issues.filter(i => i.type === 'orphan' && i.entity === 'movie_reviews').length} orphan reviews`);
}

async function detectOrphanCelebrities() {
  console.log('\n🔍 Checking for orphan celebrities...');
  
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('id, name_en');

  if (!celebrities) return;

  let orphanCount = 0;
  let linkedCount = 0;

  for (const celeb of celebrities) {
    const celebName = celeb.name_en?.trim();
    if (!celebName || celebName.length < 2) continue;

    // Use PARTIAL matching (ilike) since movie names often include full names
    // e.g., celebrity "Nagarjuna" should match movie hero "Akkineni Nagarjuna"
    const searchPattern = `%${celebName}%`;

    const { data: heroMovies } = await supabase
      .from('movies')
      .select('id')
      .ilike('hero', searchPattern)
      .limit(1);

    const { data: heroineMovies } = await supabase
      .from('movies')
      .select('id')
      .ilike('heroine', searchPattern)
      .limit(1);

    const { data: directorMovies } = await supabase
      .from('movies')
      .select('id')
      .ilike('director', searchPattern)
      .limit(1);

    const { data: musicMovies } = await supabase
      .from('movies')
      .select('id')
      .ilike('music_director', searchPattern)
      .limit(1);

    const { data: producerMovies } = await supabase
      .from('movies')
      .select('id')
      .ilike('producer', searchPattern)
      .limit(1);

    const isLinked = 
      (heroMovies?.length ?? 0) > 0 || 
      (heroineMovies?.length ?? 0) > 0 || 
      (directorMovies?.length ?? 0) > 0 ||
      (musicMovies?.length ?? 0) > 0 ||
      (producerMovies?.length ?? 0) > 0;

    if (isLinked) {
      linkedCount++;
    } else {
      orphanCount++;
      issues.push({
        type: 'orphan',
        severity: 'low',
        entity: 'celebrities',
        entityId: celeb.id,
        description: `Celebrity "${celebName}" is not linked to any movie (checked hero, heroine, director, music_director, producer)`,
        fixable: false, // Changed to false - requires manual review before deletion
      });
    }
  }

  console.log(`   Found ${orphanCount} orphan celebrities (${linkedCount} are properly linked)`);
}

// ============================================================
// DUPLICATE DETECTION
// ============================================================

async function detectDuplicateMovies() {
  console.log('\n🔍 Checking for duplicate movies...');
  
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug');

  if (!movies) return;

  const titleYearMap = new Map<string, string[]>();

  for (const movie of movies) {
    const key = `${movie.title_en.toLowerCase()}-${movie.release_year}`;
    if (!titleYearMap.has(key)) {
      titleYearMap.set(key, []);
    }
    titleYearMap.get(key)!.push(movie.id);
  }

  for (const [key, ids] of titleYearMap.entries()) {
    if (ids.length > 1) {
      issues.push({
        type: 'duplicate',
        severity: 'high',
        entity: 'movies',
        entityId: ids.join(','),
        description: `Potential duplicate movies: ${key} (IDs: ${ids.join(', ')})`,
        fixable: false, // Requires manual review
      });
    }
  }

  console.log(`   Found ${issues.filter(i => i.type === 'duplicate').length} potential duplicates`);
}

// ============================================================
// INCOMPLETE ENTRY DETECTION
// ============================================================

async function detectIncompleteMovies() {
  console.log('\n🔍 Checking for incomplete movies...');
  
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, genres, language, poster_url, backdrop_url, director, hero')
    .eq('is_published', true);

  if (!movies) return;

  for (const movie of movies) {
    const missingFields: string[] = [];

    if (!movie.title_en) missingFields.push('title_en');
    if (!movie.slug) missingFields.push('slug');
    if (!movie.release_year) missingFields.push('release_year');
    if (!movie.genres || movie.genres.length === 0) missingFields.push('genres');
    if (!movie.language) missingFields.push('language');
    if (!movie.poster_url) missingFields.push('poster_url');
    if (!movie.director) missingFields.push('director');
    if (!movie.hero) missingFields.push('hero');

    if (missingFields.length > 0) {
      issues.push({
        type: 'incomplete',
        severity: missingFields.includes('poster_url') ? 'high' : 'medium',
        entity: 'movies',
        entityId: movie.id,
        description: `Movie ${movie.title_en || movie.id} missing: ${missingFields.join(', ')}`,
        fixable: true,
      });
    }
  }

  console.log(`   Found ${issues.filter(i => i.type === 'incomplete').length} incomplete movies`);
}

// ============================================================
// BROKEN IMAGE DETECTION
// ============================================================

async function detectBrokenImages() {
  console.log('\n🔍 Checking for broken images...');
  
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, poster_url, backdrop_url')
    .eq('is_published', true)
    .not('poster_url', 'is', null);

  if (!movies) return;

  let checkedCount = 0;
  const batchSize = 50;

  for (let i = 0; i < movies.length; i += batchSize) {
    const batch = movies.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (movie) => {
        // Check poster
        if (movie.poster_url) {
          try {
            const response = await fetch(movie.poster_url, { method: 'HEAD' });
            if (!response.ok) {
              issues.push({
                type: 'missing_image',
                severity: 'high',
                entity: 'movies',
                entityId: movie.id,
                description: `Movie ${movie.title_en} has broken poster URL: ${movie.poster_url}`,
                fixable: true,
              });
            }
          } catch (error) {
            issues.push({
              type: 'missing_image',
              severity: 'high',
              entity: 'movies',
              entityId: movie.id,
              description: `Movie ${movie.title_en} has inaccessible poster URL: ${movie.poster_url}`,
              fixable: true,
            });
          }
        }

        // Check backdrop
        if (movie.backdrop_url) {
          try {
            const response = await fetch(movie.backdrop_url, { method: 'HEAD' });
            if (!response.ok) {
              issues.push({
                type: 'missing_image',
                severity: 'medium',
                entity: 'movies',
                entityId: movie.id,
                description: `Movie ${movie.title_en} has broken backdrop URL: ${movie.backdrop_url}`,
                fixable: true,
              });
            }
          } catch (error) {
            // Backdrop is optional, lower severity
          }
        }

        checkedCount++;
        if (checkedCount % 100 === 0) {
          console.log(`   Checked ${checkedCount}/${movies.length} images...`);
        }
      })
    );
  }

  console.log(`   Found ${issues.filter(i => i.type === 'missing_image').length} broken images`);
}

// ============================================================
// CELEBRITY IMAGE DETECTION
// ============================================================

async function detectMissingCelebrityImages() {
  console.log('\n🔍 Checking for missing celebrity images...');
  
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('id, name_en, profile_image')
    .is('profile_image', null);

  if (!celebrities) return;

  for (const celeb of celebrities) {
    issues.push({
      type: 'missing_image',
      severity: 'low',
      entity: 'celebrities',
      entityId: celeb.id,
      description: `Celebrity ${celeb.name_en} has no profile image`,
      fixable: true,
    });
  }

  console.log(`   Found ${issues.filter(i => i.type === 'missing_image' && i.entity === 'celebrities').length} celebrities without images`);
}

// ============================================================
// FIXES
// ============================================================

async function fixOrphanReviews(dryRun: boolean = true) {
  const orphanReviews = issues.filter(i => i.type === 'orphan' && i.entity === 'movie_reviews');
  
  if (orphanReviews.length === 0) return;

  console.log(`\n🔧 ${dryRun ? '[DRY RUN]' : ''} Fixing ${orphanReviews.length} orphan reviews...`);

  for (const issue of orphanReviews) {
    if (!dryRun) {
      await supabase
        .from('movie_reviews')
        .delete()
        .eq('id', issue.entityId);
    }
    console.log(`   ${dryRun ? 'Would delete' : 'Deleted'} review ${issue.entityId}`);
  }
}

async function fixOrphanCelebrities(dryRun: boolean = true) {
  const orphanCelebs = issues.filter(i => i.type === 'orphan' && i.entity === 'celebrities');
  
  if (orphanCelebs.length === 0) return;

  // Filter to only fixable issues (orphan celebrities are now marked as NOT auto-fixable)
  const fixableOrphans = orphanCelebs.filter(i => i.fixable);
  const reviewRequired = orphanCelebs.filter(i => !i.fixable);

  if (reviewRequired.length > 0) {
    console.log(`\n⚠️  ${reviewRequired.length} orphan celebrities require MANUAL REVIEW (not auto-deletable)`);
    console.log('   These use partial name matching and may be false positives.');
    console.log('   Review with: npx tsx scripts/validate-and-fix-data.ts --list-orphan-celebs');
  }

  if (fixableOrphans.length === 0) {
    console.log(`\n✅ No auto-fixable orphan celebrities found.`);
    return;
  }

  console.log(`\n🔧 ${dryRun ? '[DRY RUN]' : ''} Fixing ${fixableOrphans.length} orphan celebrities...`);

  for (const issue of fixableOrphans) {
    if (!dryRun) {
      await supabase
        .from('celebrities')
        .delete()
        .eq('id', issue.entityId);
    }
    console.log(`   ${dryRun ? 'Would delete' : 'Deleted'} celebrity ${issue.entityId}`);
  }
}

async function fixIncompleteMovies(dryRun: boolean = true) {
  const incompleteMovies = issues.filter(i => i.type === 'incomplete' && i.entity === 'movies');
  
  if (incompleteMovies.length === 0) return;

  console.log(`\n🔧 ${dryRun ? '[DRY RUN]' : ''} Marking ${incompleteMovies.length} incomplete movies as unpublished...`);

  for (const issue of incompleteMovies) {
    if (!dryRun) {
      await supabase
        .from('movies')
        .update({ is_published: false })
        .eq('id', issue.entityId);
    }
    console.log(`   ${dryRun ? 'Would unpublish' : 'Unpublished'} movie ${issue.entityId}`);
  }
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function listOrphanCelebrities() {
  console.log('\n📋 ORPHAN CELEBRITIES - MANUAL REVIEW LIST\n');
  console.log('=' .repeat(70));
  
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('id, name_en, name_te, tmdb_id, profile_image');

  if (!celebrities) {
    console.log('No celebrities found.');
    return;
  }

  const orphans: Array<{ id: string; name: string; tmdb: string; hasImage: boolean; reason: string }> = [];

  for (const celeb of celebrities) {
    const celebName = celeb.name_en?.trim();
    if (!celebName || celebName.length < 2) continue;

    const searchPattern = `%${celebName}%`;

    const { data: heroMovies } = await supabase.from('movies').select('id, title_en').ilike('hero', searchPattern).limit(1);
    const { data: heroineMovies } = await supabase.from('movies').select('id, title_en').ilike('heroine', searchPattern).limit(1);
    const { data: directorMovies } = await supabase.from('movies').select('id, title_en').ilike('director', searchPattern).limit(1);
    const { data: musicMovies } = await supabase.from('movies').select('id, title_en').ilike('music_director', searchPattern).limit(1);

    const isLinked = 
      (heroMovies?.length ?? 0) > 0 || 
      (heroineMovies?.length ?? 0) > 0 || 
      (directorMovies?.length ?? 0) > 0 ||
      (musicMovies?.length ?? 0) > 0;

    if (!isLinked) {
      orphans.push({
        id: celeb.id,
        name: celebName,
        tmdb: celeb.tmdb_id || 'None',
        hasImage: !!celeb.profile_image,
        reason: 'No partial match found in hero/heroine/director/music_director',
      });
    }
  }

  if (orphans.length === 0) {
    console.log('\n✅ No orphan celebrities found! All are linked to movies.\n');
    return;
  }

  console.log(`\nFound ${orphans.length} orphan celebrities:\n`);
  
  orphans.forEach((o, i) => {
    console.log(`${i + 1}. ${o.name}`);
    console.log(`   ID: ${o.id}`);
    console.log(`   TMDB: ${o.tmdb} | Image: ${o.hasImage ? '✅' : '❌'}`);
    console.log(`   Reason: ${o.reason}`);
    console.log('');
  });

  console.log('=' .repeat(70));
  console.log('\n💡 To delete a celebrity manually:');
  console.log('   npx tsx -e "require(\'@supabase/supabase-js\').createClient(...)');
  console.log('      .from(\'celebrities\').delete().eq(\'id\', \'<ID>\')"\n');
}

async function main() {
  console.log('🚀 Starting data quality validation...\n');
  console.log('=' .repeat(60));

  const dryRun = process.argv.includes('--dry-run');
  const fix = process.argv.includes('--fix');

  // Special command: list orphan celebrities for manual review
  if (process.argv.includes('--list-orphan-celebs')) {
    await listOrphanCelebrities();
    return;
  }

  // Run all validations
  await detectOrphanReviews();
  await detectOrphanCelebrities();
  await detectDuplicateMovies();
  await detectIncompleteMovies();
  
  // Image checks (can be slow)
  if (process.argv.includes('--check-images')) {
    await detectBrokenImages();
    await detectMissingCelebrityImages();
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 VALIDATION SUMMARY\n');
  console.log(`Total issues found: ${issues.length}`);
  console.log(`  Critical: ${issues.filter(i => i.severity === 'critical').length}`);
  console.log(`  High: ${issues.filter(i => i.severity === 'high').length}`);
  console.log(`  Medium: ${issues.filter(i => i.severity === 'medium').length}`);
  console.log(`  Low: ${issues.filter(i => i.severity === 'low').length}`);
  console.log(`\nFixable issues: ${issues.filter(i => i.fixable).length}`);

  // Issue breakdown
  console.log('\n📋 ISSUE BREAKDOWN\n');
  const byType = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }

  // Apply fixes if requested
  if (fix) {
    console.log('\n🔧 APPLYING FIXES...\n');
    await fixOrphanReviews(dryRun);
    await fixOrphanCelebrities(dryRun);
    await fixIncompleteMovies(dryRun);
    
    if (dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes were made');
      console.log('   Run with --fix (without --dry-run) to apply changes');
    } else {
      console.log('\n✅ Fixes applied successfully!');
    }
  } else {
    console.log('\n💡 TIP: Run with --fix --dry-run to see what would be fixed');
    console.log('   Run with --fix to apply fixes');
    console.log('   Add --check-images to validate image URLs (slower)');
  }

  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);

