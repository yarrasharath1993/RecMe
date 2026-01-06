import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CastMember {
  name: string;
  character?: string;
  order: number;
  gender?: 1 | 2;
  role?: 'lead' | 'supporting' | 'cameo' | 'special_appearance';
  profile_path?: string;
  tmdb_id?: number;
}

async function enhanceCastRoles({ limit = 1000, dryRun = true }: { limit?: number; dryRun?: boolean }) {
  console.log(`\n══════════════════════════════════════════════════════════════════════════════`);
  console.log(`ENHANCE CAST ROLES MIGRATION (${dryRun ? 'DRY RUN' : 'LIVE'})`);
  console.log(`══════════════════════════════════════════════════════════════════════════════\n`);

  // Fetch movies with cast_members that need role assignment
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, cast_members')
    .eq('language', 'Telugu')
    .not('cast_members', 'is', null)
    .limit(limit);

  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }

  console.log(`Found ${movies.length} movies with cast_members\n`);

  let updatedCount = 0;
  let alreadyHasRoles = 0;
  let errorCount = 0;

  for (const movie of movies) {
    if (!movie.cast_members || movie.cast_members.length === 0) {
      continue;
    }

    // Parse cast_members (they may be stringified JSON)
    let castMembers: CastMember[];
    try {
      castMembers = movie.cast_members.map((c: string | CastMember) => 
        typeof c === 'string' ? JSON.parse(c) : c
      );
    } catch (e) {
      console.error(`Error parsing cast for ${movie.title_en}:`, e);
      errorCount++;
      continue;
    }

    // Check if roles are already assigned
    const hasRoles = castMembers.some(c => c.role);
    if (hasRoles) {
      alreadyHasRoles++;
      continue;
    }

    // Assign roles based on order and hero/heroine match
    const heroName = movie.hero?.toLowerCase();
    const heroineName = movie.heroine?.toLowerCase();

    const enhancedCast = castMembers.map((cast, index) => {
      const castName = cast.name?.toLowerCase();
      let role: CastMember['role'] = 'supporting';

      // Check if this is the lead actor/actress
      if (heroName && castName?.includes(heroName.split(' ')[0])) {
        role = 'lead';
      } else if (heroineName && castName?.includes(heroineName.split(' ')[0])) {
        role = 'lead';
      } else if (cast.order === 0 || cast.order === 1) {
        // First two positions are typically leads
        role = 'lead';
      } else if (cast.order <= 5) {
        role = 'supporting';
      } else if (cast.order <= 10) {
        role = 'supporting';
      } else {
        role = 'cameo';
      }

      // Check for special appearances
      if (cast.character?.toLowerCase().includes('special') || 
          cast.character?.toLowerCase().includes('cameo') ||
          cast.character?.toLowerCase().includes('himself') ||
          cast.character?.toLowerCase().includes('herself')) {
        role = 'special_appearance';
      }

      return {
        ...cast,
        role
      };
    });

    if (!dryRun) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({ cast_members: enhancedCast })
        .eq('id', movie.id);

      if (updateError) {
        console.error(`Error updating ${movie.title_en}:`, updateError);
        errorCount++;
        continue;
      }
    }

    updatedCount++;
    if (updatedCount <= 10) {
      console.log(`✓ ${movie.title_en} (${movie.release_year}) - ${enhancedCast.length} cast members updated`);
      console.log(`  Leads: ${enhancedCast.filter(c => c.role === 'lead').map(c => c.name).join(', ')}`);
    }
  }

  if (updatedCount > 10) {
    console.log(`... and ${updatedCount - 10} more movies`);
  }

  console.log(`\n══════════════════════════════════════════════════════════════════════════════`);
  console.log(`SUMMARY (${dryRun ? 'DRY RUN' : 'COMPLETED'})`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);
  console.log(`  Total movies processed:   ${movies.length}`);
  console.log(`  Already had roles:        ${alreadyHasRoles}`);
  console.log(`  Updated with roles:       ${updatedCount}`);
  console.log(`  Errors:                   ${errorCount}`);
  console.log(`\n${dryRun ? 'Run with --execute to apply these changes.' : ''}`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '5000');
  enhanceCastRoles({ limit, dryRun }).catch(console.error);
}

export { enhanceCastRoles };


