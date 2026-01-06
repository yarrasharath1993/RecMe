/**
 * CAST CORRECTION ENGINE
 * 
 * Core engine for updating cast/crew data with full propagation:
 * 1. Movies table (hero, heroine, director)
 * 2. Cast members JSONB array (with roles)
 * 3. Review propagation (performances, synopsis)
 * 4. Audit trail for rollback
 * 
 * Usage:
 *   npx tsx scripts/cast-correction-engine.ts --movie="Movie Name" --year=2020 --hero=NewHero --execute
 *   npx tsx scripts/cast-correction-engine.ts --input=docs/CORRECTIONS.csv --validate --execute
 *   npx tsx scripts/cast-correction-engine.ts --movie="Movie Name" --demote-to-supporting="OldHero" --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { validateMovie, type CastCorrection, type ValidationResult } from './cast-validator';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// TYPES
// ============================================================

export interface CastChange {
  field: 'hero' | 'heroine' | 'director';
  oldValue: string | null;
  newValue: string;
  role?: 'lead' | 'supporting' | 'cameo' | 'special_appearance';
}

export interface ChangeLog {
  timestamp: Date;
  movieId: string;
  title: string;
  year: number;
  changes: CastChange[];
  propagatedTo: ('cast_members' | 'review_performances' | 'review_synopsis' | 'movie_synopsis')[];
  validated: boolean;
  source: string;
}

interface CastMember {
  name: string;
  character?: string;
  order: number;
  gender?: 1 | 2;
  role?: 'lead' | 'supporting' | 'cameo' | 'special_appearance';
  profile_path?: string;
  tmdb_id?: number;
}

// Global change log
const changeLogs: ChangeLog[] = [];

// ============================================================
// MOVIES TABLE UPDATE
// ============================================================

async function updateMovieCast(
  movieId: string,
  corrections: { hero?: string; heroine?: string; director?: string },
  dryRun: boolean = true
): Promise<CastChange[]> {
  // Get current values
  const { data: movie } = await supabase
    .from('movies')
    .select('hero, heroine, director')
    .eq('id', movieId)
    .single();

  if (!movie) {
    throw new Error(`Movie not found: ${movieId}`);
  }

  const changes: CastChange[] = [];

  if (corrections.hero && corrections.hero !== movie.hero) {
    changes.push({
      field: 'hero',
      oldValue: movie.hero,
      newValue: corrections.hero,
      role: 'lead'
    });
  }

  if (corrections.heroine && corrections.heroine !== movie.heroine) {
    changes.push({
      field: 'heroine',
      oldValue: movie.heroine,
      newValue: corrections.heroine,
      role: 'lead'
    });
  }

  if (corrections.director && corrections.director !== movie.director) {
    changes.push({
      field: 'director',
      oldValue: movie.director,
      newValue: corrections.director
    });
  }

  if (changes.length === 0) {
    console.log('  No changes needed');
    return changes;
  }

  if (!dryRun) {
    const updates: Record<string, string> = {};
    for (const change of changes) {
      updates[change.field] = change.newValue;
    }

    const { error } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', movieId);

    if (error) {
      throw new Error(`Failed to update movie: ${error.message}`);
    }
  }

  console.log('  ✓ Movie table updated:');
  changes.forEach(c => {
    console.log(`    ${c.field}: "${c.oldValue}" → "${c.newValue}"`);
  });

  return changes;
}

// ============================================================
// CAST MEMBERS SYNC
// ============================================================

async function syncCastMembers(
  movieId: string,
  changes: CastChange[],
  demoteOldLeadTo?: 'supporting' | 'cameo' | 'special_appearance',
  dryRun: boolean = true
): Promise<boolean> {
  const { data: movie } = await supabase
    .from('movies')
    .select('cast_members')
    .eq('id', movieId)
    .single();

  if (!movie) return false;

  let castMembers: CastMember[] = movie.cast_members || [];
  let modified = false;

  for (const change of changes) {
    if (change.field === 'hero' || change.field === 'heroine') {
      // Find old lead and demote if requested
      if (change.oldValue && demoteOldLeadTo) {
        const oldLeadIdx = castMembers.findIndex(c => 
          c.name.toLowerCase() === change.oldValue?.toLowerCase()
        );
        if (oldLeadIdx >= 0) {
          castMembers[oldLeadIdx].role = demoteOldLeadTo;
          console.log(`    Demoted ${change.oldValue} to ${demoteOldLeadTo}`);
          modified = true;
        }
      }

      // Find new lead and promote
      const newLeadIdx = castMembers.findIndex(c => 
        c.name.toLowerCase() === change.newValue.toLowerCase()
      );
      if (newLeadIdx >= 0) {
        castMembers[newLeadIdx].role = 'lead';
        // Move to front if not already there
        if (newLeadIdx > 0) {
          const [member] = castMembers.splice(newLeadIdx, 1);
          castMembers.unshift(member);
        }
        console.log(`    Promoted ${change.newValue} to lead`);
        modified = true;
      } else {
        // Add new lead if not in cast
        const gender = change.field === 'hero' ? 2 : 1;
        castMembers.unshift({
          name: change.newValue,
          order: 0,
          gender,
          role: 'lead'
        });
        // Reorder
        castMembers = castMembers.map((c, i) => ({ ...c, order: i }));
        console.log(`    Added ${change.newValue} as new lead`);
        modified = true;
      }
    }
  }

  if (modified && !dryRun) {
    const { error } = await supabase
      .from('movies')
      .update({ cast_members: castMembers })
      .eq('id', movieId);

    if (error) {
      console.log(`    ✗ Failed to update cast_members: ${error.message}`);
      return false;
    }
  }

  if (modified) {
    console.log('  ✓ Cast members synced');
  }

  return modified;
}

// ============================================================
// REVIEW PROPAGATION
// ============================================================

async function propagateToReviews(
  movieId: string,
  changes: CastChange[],
  dryRun: boolean = true
): Promise<string[]> {
  const propagatedTo: string[] = [];

  // Get the review
  const { data: review } = await supabase
    .from('movie_reviews')
    .select('id, dimensions_json')
    .eq('movie_id', movieId)
    .single();

  if (!review || !review.dimensions_json) {
    console.log('  ⚠️  No review found to propagate');
    return propagatedTo;
  }

  let dimensions = review.dimensions_json;
  let modified = false;

  // 1. Update performances.lead_actors
  if (dimensions.performances?.lead_actors) {
    for (const change of changes) {
      if (change.field === 'hero' || change.field === 'heroine') {
        const actors = dimensions.performances.lead_actors;
        
        // Find and update actor name
        for (let i = 0; i < actors.length; i++) {
          if (actors[i].name?.toLowerCase() === change.oldValue?.toLowerCase()) {
            actors[i].name = change.newValue;
            // Also update the analysis text if it contains the old name
            if (actors[i].analysis) {
              actors[i].analysis = actors[i].analysis.replace(
                new RegExp(change.oldValue || '', 'gi'),
                change.newValue
              );
            }
            console.log(`    Updated performance: ${change.oldValue} → ${change.newValue}`);
            modified = true;
            propagatedTo.push('review_performances');
          }
        }
      }
    }
  }

  // 2. Update synopsis text
  if (dimensions.synopsis) {
    for (const change of changes) {
      if (change.oldValue && dimensions.synopsis.includes(change.oldValue)) {
        dimensions.synopsis = dimensions.synopsis.replace(
          new RegExp(change.oldValue, 'gi'),
          change.newValue
        );
        console.log(`    Updated synopsis references`);
        modified = true;
        if (!propagatedTo.includes('review_synopsis')) {
          propagatedTo.push('review_synopsis');
        }
      }
    }
  }

  // 3. Update cultural_impact references
  if (dimensions.cultural_impact) {
    for (const change of changes) {
      if (change.oldValue) {
        const impactStr = JSON.stringify(dimensions.cultural_impact);
        if (impactStr.includes(change.oldValue)) {
          dimensions.cultural_impact = JSON.parse(
            impactStr.replace(new RegExp(change.oldValue, 'gi'), change.newValue)
          );
          console.log(`    Updated cultural_impact references`);
          modified = true;
        }
      }
    }
  }

  // 4. Update verdict references
  if (dimensions.verdict) {
    for (const change of changes) {
      if (change.oldValue) {
        const verdictStr = JSON.stringify(dimensions.verdict);
        if (verdictStr.includes(change.oldValue)) {
          dimensions.verdict = JSON.parse(
            verdictStr.replace(new RegExp(change.oldValue, 'gi'), change.newValue)
          );
          console.log(`    Updated verdict references`);
          modified = true;
        }
      }
    }
  }

  if (modified && !dryRun) {
    const { error } = await supabase
      .from('movie_reviews')
      .update({ dimensions_json: dimensions })
      .eq('id', review.id);

    if (error) {
      console.log(`    ✗ Failed to update review: ${error.message}`);
      return [];
    }
  }

  if (modified) {
    console.log('  ✓ Review propagated');
  }

  return propagatedTo;
}

// ============================================================
// MOVIE SYNOPSIS CLEANUP
// ============================================================

async function cleanupMovieSynopsis(
  movieId: string,
  changes: CastChange[],
  dryRun: boolean = true
): Promise<boolean> {
  const { data: movie } = await supabase
    .from('movies')
    .select('synopsis')
    .eq('id', movieId)
    .single();

  if (!movie?.synopsis) return false;

  let synopsis = movie.synopsis;
  let modified = false;

  for (const change of changes) {
    if (change.oldValue && synopsis.includes(change.oldValue)) {
      synopsis = synopsis.replace(
        new RegExp(change.oldValue, 'gi'),
        change.newValue
      );
      modified = true;
    }
  }

  if (modified) {
    if (!dryRun) {
      const { error } = await supabase
        .from('movies')
        .update({ synopsis })
        .eq('id', movieId);

      if (error) {
        console.log(`    ✗ Failed to update synopsis: ${error.message}`);
        return false;
      }
    }
    console.log('  ✓ Movie synopsis cleaned');
  }

  return modified;
}

// ============================================================
// MAIN CORRECTION FUNCTION
// ============================================================

export async function correctMovieCast(
  options: {
    movie?: string;
    year?: number;
    movieId?: string;
    hero?: string;
    heroine?: string;
    director?: string;
    demoteOldLead?: 'supporting' | 'cameo' | 'special_appearance';
    specialAppearance?: string; // Actor name to mark as special appearance
    validate?: boolean;
    propagate?: boolean;
    dryRun?: boolean;
  }
): Promise<ChangeLog | null> {
  const { 
    movie, year, movieId, hero, heroine, director,
    demoteOldLead, specialAppearance,
    validate = true, propagate = true, dryRun = true 
  } = options;

  // Find movie
  let targetMovieId = movieId;
  let movieTitle = movie || '';
  let movieYear = year || 0;

  if (!targetMovieId && movie && year) {
    const { data: found } = await supabase
      .from('movies')
      .select('id, title_en, release_year')
      .eq('title_en', movie)
      .eq('release_year', year)
      .single();

    if (!found) {
      console.log(`Movie not found: ${movie} (${year})`);
      return null;
    }

    targetMovieId = found.id;
    movieTitle = found.title_en;
    movieYear = found.release_year;
  }

  if (!targetMovieId) {
    console.log('No movie specified');
    return null;
  }

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`Correcting: ${movieTitle} (${movieYear})`);
  console.log(`${'─'.repeat(70)}`);

  const changeLog: ChangeLog = {
    timestamp: new Date(),
    movieId: targetMovieId,
    title: movieTitle,
    year: movieYear,
    changes: [],
    propagatedTo: [],
    validated: false,
    source: 'manual'
  };

  // 1. Validate if requested
  if (validate) {
    console.log('\n  Validating with external sources...');
    const validation = await validateMovie(movieTitle, movieYear);
    changeLog.validated = validation.isValid;
    
    if (validation.warnings.length > 0) {
      console.log('  ⚠️  Warnings:', validation.warnings.join(', '));
    }
  }

  // 2. Update movie table
  const corrections: { hero?: string; heroine?: string; director?: string } = {};
  if (hero) corrections.hero = hero;
  if (heroine) corrections.heroine = heroine;
  if (director) corrections.director = director;

  if (Object.keys(corrections).length > 0) {
    changeLog.changes = await updateMovieCast(targetMovieId, corrections, dryRun);
  }

  // 3. Handle special appearance
  if (specialAppearance && changeLog.changes.length > 0) {
    const heroChange = changeLog.changes.find(c => c.field === 'hero');
    if (heroChange && heroChange.oldValue === specialAppearance) {
      // The old hero is being marked as special appearance
      const { data: movie } = await supabase
        .from('movies')
        .select('cast_members')
        .eq('id', targetMovieId)
        .single();

      if (movie?.cast_members) {
        let cast = movie.cast_members as CastMember[];
        const idx = cast.findIndex(c => c.name === specialAppearance);
        if (idx >= 0) {
          cast[idx].role = 'special_appearance';
        } else {
          cast.push({
            name: specialAppearance,
            role: 'special_appearance',
            order: cast.length
          });
        }

        if (!dryRun) {
          await supabase
            .from('movies')
            .update({ cast_members: cast })
            .eq('id', targetMovieId);
        }
        console.log(`  ✓ ${specialAppearance} marked as special appearance`);
      }
    }
  }

  // 4. Sync cast members
  if (changeLog.changes.length > 0) {
    const synced = await syncCastMembers(targetMovieId, changeLog.changes, demoteOldLead, dryRun);
    if (synced) {
      changeLog.propagatedTo.push('cast_members');
    }
  }

  // 5. Propagate to reviews
  if (propagate && changeLog.changes.length > 0) {
    const propagatedTo = await propagateToReviews(targetMovieId, changeLog.changes, dryRun);
    changeLog.propagatedTo.push(...propagatedTo as any[]);
  }

  // 6. Cleanup movie synopsis
  if (propagate && changeLog.changes.length > 0) {
    const cleaned = await cleanupMovieSynopsis(targetMovieId, changeLog.changes, dryRun);
    if (cleaned) {
      changeLog.propagatedTo.push('movie_synopsis');
    }
  }

  // Store in global log
  changeLogs.push(changeLog);

  console.log(`\n  Changes: ${changeLog.changes.length}`);
  console.log(`  Propagated to: ${changeLog.propagatedTo.join(', ') || 'none'}`);

  return changeLog;
}

// ============================================================
// BATCH PROCESSING
// ============================================================

interface CSVCorrection {
  title: string;
  year: number;
  hero?: string;
  heroine?: string;
  director?: string;
  specialAppearance?: string;
}

async function processCSVCorrections(
  csvPath: string,
  options: { validate?: boolean; propagate?: boolean; dryRun?: boolean }
): Promise<ChangeLog[]> {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const corrections: CSVCorrection[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });

    corrections.push({
      title: row.title || row.movie || row.title_en || '',
      year: parseInt(row.year || row.release_year || '0'),
      hero: row.hero || row.new_hero || undefined,
      heroine: row.heroine || row.new_heroine || undefined,
      director: row.director || row.new_director || undefined,
      specialAppearance: row.special_appearance || undefined
    });
  }

  console.log(`\nProcessing ${corrections.length} corrections from CSV...`);

  const logs: ChangeLog[] = [];

  for (const correction of corrections) {
    if (!correction.title || !correction.year) {
      console.log(`Skipping invalid row: ${JSON.stringify(correction)}`);
      continue;
    }

    const log = await correctMovieCast({
      movie: correction.title,
      year: correction.year,
      hero: correction.hero,
      heroine: correction.heroine,
      director: correction.director,
      specialAppearance: correction.specialAppearance,
      ...options
    });

    if (log) {
      logs.push(log);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  return logs;
}

// ============================================================
// ROLLBACK SCRIPT GENERATOR
// ============================================================

export function generateRollbackScript(logs: ChangeLog[]): string {
  const lines: string[] = [
    '-- ROLLBACK SCRIPT',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Changes: ${logs.length}`,
    '',
  ];

  for (const log of logs) {
    lines.push(`-- ${log.title} (${log.year})`);
    
    for (const change of log.changes) {
      const oldValue = change.oldValue === null ? 'NULL' : `'${change.oldValue}'`;
      lines.push(
        `UPDATE movies SET ${change.field} = ${oldValue} WHERE id = '${log.movieId}';`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================
// SAVE AUDIT LOG
// ============================================================

function saveAuditLog(logs: ChangeLog[], outputPath?: string): void {
  const output = outputPath || `docs/CAST_CHANGES_${new Date().toISOString().split('T')[0]}.json`;
  
  fs.writeFileSync(output, JSON.stringify(logs, null, 2));
  console.log(`\n  📝 Audit log saved: ${output}`);

  // Also save rollback script
  const rollbackPath = output.replace('.json', '_ROLLBACK.sql');
  fs.writeFileSync(rollbackPath, generateRollbackScript(logs));
  console.log(`  📝 Rollback script saved: ${rollbackPath}`);
}

// ============================================================
// CLI
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  
  const movieArg = args.find(a => a.startsWith('--movie='));
  const yearArg = args.find(a => a.startsWith('--year='));
  const heroArg = args.find(a => a.startsWith('--hero='));
  const heroineArg = args.find(a => a.startsWith('--heroine='));
  const directorArg = args.find(a => a.startsWith('--director='));
  const inputArg = args.find(a => a.startsWith('--input='));
  const specialArg = args.find(a => a.startsWith('--special-appearance='));
  const demoteArg = args.find(a => a.startsWith('--demote-to='));
  
  const validate = args.includes('--validate');
  const propagate = args.includes('--propagate') || !args.includes('--no-propagate');
  const dryRun = !args.includes('--execute');

  console.log('\n' + '═'.repeat(70));
  console.log(`CAST CORRECTION ENGINE ${dryRun ? '(DRY RUN)' : '(LIVE)'}`);
  console.log('═'.repeat(70));

  if (inputArg) {
    // Batch mode from CSV
    const csvPath = inputArg.split('=')[1];
    const logs = await processCSVCorrections(csvPath, { validate, propagate, dryRun });
    
    console.log('\n' + '═'.repeat(70));
    console.log('BATCH SUMMARY');
    console.log('═'.repeat(70));
    console.log(`  Total processed: ${logs.length}`);
    console.log(`  With changes: ${logs.filter(l => l.changes.length > 0).length}`);
    console.log(`  Propagated: ${logs.filter(l => l.propagatedTo.length > 0).length}`);

    if (!dryRun && logs.length > 0) {
      saveAuditLog(logs);
    }

  } else if (movieArg && yearArg) {
    // Single movie mode
    const movie = movieArg.split('=')[1];
    const year = parseInt(yearArg.split('=')[1]);
    const hero = heroArg?.split('=')[1];
    const heroine = heroineArg?.split('=')[1];
    const director = directorArg?.split('=')[1];
    const specialAppearance = specialArg?.split('=')[1];
    const demoteOldLead = demoteArg?.split('=')[1] as 'supporting' | 'cameo' | 'special_appearance' | undefined;

    const log = await correctMovieCast({
      movie,
      year,
      hero,
      heroine,
      director,
      specialAppearance,
      demoteOldLead,
      validate,
      propagate,
      dryRun
    });

    if (log && !dryRun) {
      saveAuditLog([log]);
    }

  } else {
    console.log(`
Usage:
  Single movie:
    npx tsx scripts/cast-correction-engine.ts \\
      --movie="Movie Name" --year=2020 \\
      --hero=NewHero --heroine=NewHeroine \\
      --propagate --execute

  Batch from CSV:
    npx tsx scripts/cast-correction-engine.ts \\
      --input=docs/CORRECTIONS.csv \\
      --validate --propagate --execute

  Mark as special appearance:
    npx tsx scripts/cast-correction-engine.ts \\
      --movie="Movie Name" --year=2020 \\
      --hero=NewHero --special-appearance=OldHero \\
      --execute

Options:
  --validate      Validate with external sources before updating
  --propagate     Propagate changes to reviews (default: true)
  --no-propagate  Skip review propagation
  --execute       Apply changes (without this, runs in dry-run mode)
  --demote-to=    Demote old lead to: supporting, cameo, special_appearance
`);
  }

  if (dryRun) {
    console.log('\n⚠️  DRY RUN - no changes made. Use --execute to apply.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}


