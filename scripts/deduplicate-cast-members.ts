/**
 * DEDUPLICATE CAST MEMBERS
 * 
 * Fixes the double-encoding issue and removes duplicate cast members.
 * Repurposed from apply-attribution-fixes logic.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DeduplicationResult {
  movieId: string;
  movieTitle: string;
  originalCount: number;
  deduplicatedCount: number;
  duplicatesRemoved: number;
  duplicateNames: string[];
}

/**
 * Parse cast members that may be double-encoded as strings
 */
function parseCastMembers(castMembers: any): any[] {
  if (!castMembers) return [];
  
  // If it's already an array of objects, return it
  if (Array.isArray(castMembers)) {
    return castMembers.map(member => {
      // If member is a string (double-encoded), parse it
      if (typeof member === 'string') {
        try {
          return JSON.parse(member);
        } catch {
          return member;
        }
      }
      return member;
    });
  }
  
  return [];
}

/**
 * Deduplicate cast members by name (case-insensitive)
 * Keep the first occurrence of each unique name
 */
function deduplicateCastMembers(castMembers: any[]): {
  deduplicated: any[];
  duplicates: string[];
} {
  const seen = new Map<string, any>();
  const duplicates: string[] = [];
  
  for (const member of castMembers) {
    const name = member.name?.trim().toLowerCase();
    
    if (!name) continue;
    
    if (seen.has(name)) {
      duplicates.push(member.name);
    } else {
      seen.set(name, member);
    }
  }
  
  return {
    deduplicated: Array.from(seen.values()),
    duplicates
  };
}

/**
 * Process a single movie to deduplicate its cast
 */
async function deduplicateMovie(movie: any): Promise<DeduplicationResult | null> {
  const parsed = parseCastMembers(movie.cast_members);
  
  if (parsed.length === 0) {
    return null; // No cast members to deduplicate
  }
  
  const { deduplicated, duplicates } = deduplicateCastMembers(parsed);
  
  // Only update if we found duplicates
  if (duplicates.length === 0) {
    return null;
  }
  
  // Update the database with deduplicated cast
  const { error } = await supabase
    .from('movies')
    .update({
      cast_members: deduplicated,
      updated_at: new Date().toISOString()
    })
    .eq('id', movie.id);
  
  if (error) {
    console.error(chalk.red(`    ✗ Failed to update ${movie.title_en}:`), error.message);
    return null;
  }
  
  return {
    movieId: movie.id,
    movieTitle: movie.title_en || 'Unknown',
    originalCount: parsed.length,
    deduplicatedCount: deduplicated.length,
    duplicatesRemoved: duplicates.length,
    duplicateNames: [...new Set(duplicates)].slice(0, 5) // Show up to 5 unique duplicate names
  };
}

async function main() {
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  DEDUPLICATE CAST MEMBERS'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.yellow('🔍 Fetching movies with cast_members...'));
  
  // Fetch ALL movies with cast_members in batches
  let movies: any[] = [];
  let offset = 0;
  const FETCH_BATCH_SIZE = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title_en, title_te, release_year, slug, cast_members')
      .not('cast_members', 'is', null)
      .range(offset, offset + FETCH_BATCH_SIZE - 1);
    
    if (error) {
      console.error(chalk.red('❌ Error fetching movies:'), error);
      process.exit(1);
    }
    
    if (!data || data.length === 0) break;
    
    movies = [...movies, ...data];
    offset += FETCH_BATCH_SIZE;
    
    console.log(chalk.gray(`   Fetched ${movies.length} movies...`));
    
    if (data.length < FETCH_BATCH_SIZE) break; // Last batch
  }
  
  if (movies.length === 0) {
    console.log(chalk.yellow('⚠️  No movies with cast_members found'));
    process.exit(0);
  }
  
  console.log(chalk.green(`✓ Found ${movies.length} movies with cast_members\n`));
  console.log(chalk.cyan('🧹 Processing deduplication...\n'));
  
  const results: DeduplicationResult[] = [];
  let processed = 0;
  let moviesWithDuplicates = 0;
  let totalDuplicatesRemoved = 0;
  
  // Process in batches
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);
    
    for (const movie of batch) {
      processed++;
      
      const result = await deduplicateMovie(movie);
      
      if (result) {
        results.push(result);
        moviesWithDuplicates++;
        totalDuplicatesRemoved += result.duplicatesRemoved;
        
        console.log(chalk.green(`  ✓ ${result.movieTitle}`));
        console.log(chalk.gray(`    ${result.originalCount} → ${result.deduplicatedCount} (removed ${result.duplicatesRemoved} duplicates)`));
        
        if (result.duplicateNames.length > 0) {
          console.log(chalk.gray(`    Duplicates: ${result.duplicateNames.slice(0, 3).join(', ')}${result.duplicateNames.length > 3 ? '...' : ''}`));
        }
      }
      
      if (processed % 100 === 0) {
        console.log(chalk.blue(`\n📊 Progress: ${processed}/${movies.length} (${Math.round(processed/movies.length*100)}%)`));
        console.log(chalk.gray(`   Movies cleaned: ${moviesWithDuplicates}, Duplicates removed: ${totalDuplicatesRemoved}\n`));
      }
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.green.bold('  ✓ DEDUPLICATION COMPLETE'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.yellow('Summary:'));
  console.log(chalk.white(`  • Total movies processed: ${movies.length}`));
  console.log(chalk.white(`  • Movies with duplicates: ${moviesWithDuplicates}`));
  console.log(chalk.white(`  • Movies already clean: ${movies.length - moviesWithDuplicates}`));
  console.log(chalk.white(`  • Total duplicates removed: ${totalDuplicatesRemoved}`));
  
  if (moviesWithDuplicates > 0) {
    const avgDuplicates = (totalDuplicatesRemoved / moviesWithDuplicates).toFixed(1);
    console.log(chalk.white(`  • Avg duplicates per affected movie: ${avgDuplicates}`));
  }
  
  // Generate CSV report
  if (results.length > 0) {
    const headers = [
      'Movie ID',
      'Movie Title',
      'Original Cast Count',
      'Deduplicated Count',
      'Duplicates Removed',
      'Sample Duplicate Names'
    ];
    
    const rows: string[][] = [headers];
    
    results.sort((a, b) => b.duplicatesRemoved - a.duplicatesRemoved);
    
    for (const result of results) {
      rows.push([
        result.movieId,
        result.movieTitle,
        result.originalCount.toString(),
        result.deduplicatedCount.toString(),
        result.duplicatesRemoved.toString(),
        result.duplicateNames.join(', ')
      ]);
    }
    
    const csv = rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const reportFile = path.join(process.cwd(), 'DEDUPLICATION-REPORT.csv');
    fs.writeFileSync(reportFile, csv);
    
    console.log(chalk.cyan(`\n📄 Detailed report saved: ${reportFile}\n`));
  }
  
  // Show top movies with most duplicates
  if (results.length > 0) {
    console.log(chalk.yellow('\n🔝 Top 10 movies with most duplicates removed:'));
    const top10 = results
      .sort((a, b) => b.duplicatesRemoved - a.duplicatesRemoved)
      .slice(0, 10);
    
    for (const [idx, result] of top10.entries()) {
      console.log(chalk.white(`  ${idx + 1}. ${result.movieTitle} - ${result.duplicatesRemoved} duplicates removed`));
      console.log(chalk.gray(`     (${result.originalCount} → ${result.deduplicatedCount} cast members)`));
    }
  }
  
  console.log(chalk.green('\n✨ All cast members deduplicated successfully!\n'));
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
