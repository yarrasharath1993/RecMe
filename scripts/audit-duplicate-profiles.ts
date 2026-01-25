/**
 * Audit for duplicate profiles across all roles
 * Looks for spelling variations, similar names, and potential duplicates
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NameVariation {
  name: string;
  count: number;
  movies: string[];
}

interface DuplicateGroup {
  baseName: string;
  variations: NameVariation[];
  totalMovies: number;
  potentialDuplicate: boolean;
}

function normalizeForComparison(name: string): string {
  // Remove spaces, dots, hyphens, convert to lowercase
  return name.toLowerCase().replace(/[\s\.\-]/g, '');
}

function findSimilarNames(names: Set<string>): Map<string, string[]> {
  const normalized = new Map<string, string[]>();
  
  for (const name of names) {
    const norm = normalizeForComparison(name);
    if (!normalized.has(norm)) {
      normalized.set(norm, []);
    }
    normalized.get(norm)!.push(name);
  }
  
  // Only return groups with multiple variations
  const duplicates = new Map<string, string[]>();
  for (const [norm, variations] of normalized.entries()) {
    if (variations.length > 1) {
      duplicates.set(norm, variations);
    }
  }
  
  return duplicates;
}

async function auditRole(role: string, fieldName: string): Promise<DuplicateGroup[]> {
  console.log(`\n🔍 Auditing ${role}s...`);
  
  // Get all unique names for this role
  const { data: movies } = await supabase
    .from('movies')
    .select(fieldName)
    .eq('is_published', true)
    .not(fieldName, 'is', null);

  if (!movies) return [];

  // Count occurrences of each name
  const nameCounts = new Map<string, NameVariation>();
  
  for (const movie of movies) {
    const value = movie[fieldName as keyof typeof movie] as string;
    if (!value) continue;
    
    // Split by comma for multiple people
    const names = value.split(',').map(n => n.trim()).filter(n => n);
    
    for (const name of names) {
      if (!nameCounts.has(name)) {
        nameCounts.set(name, { name, count: 0, movies: [] });
      }
      nameCounts.get(name)!.count++;
    }
  }

  // Find similar names
  const allNames = new Set(nameCounts.keys());
  const similarGroups = findSimilarNames(allNames);
  
  const duplicateGroups: DuplicateGroup[] = [];
  
  for (const [normalized, variations] of similarGroups.entries()) {
    const group: DuplicateGroup = {
      baseName: variations[0],
      variations: variations.map(v => nameCounts.get(v)!),
      totalMovies: variations.reduce((sum, v) => sum + nameCounts.get(v)!.count, 0),
      potentialDuplicate: true,
    };
    
    duplicateGroups.push(group);
  }
  
  // Sort by total movies (descending)
  duplicateGroups.sort((a, b) => b.totalMovies - a.totalMovies);
  
  return duplicateGroups;
}

async function auditAllProfiles() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 DUPLICATE PROFILES AUDIT');
  console.log('='.repeat(80));

  const roles = [
    { name: 'Hero', field: 'hero' },
    { name: 'Heroine', field: 'heroine' },
    { name: 'Director', field: 'director' },
    { name: 'Music Director', field: 'music_director' },
    { name: 'Producer', field: 'producer' },
    { name: 'Writer', field: 'writer' },
    { name: 'Cinematographer', field: 'cinematographer' },
    { name: 'Editor', field: 'editor' },
  ];

  const allDuplicates: { role: string; duplicates: DuplicateGroup[] }[] = [];

  for (const role of roles) {
    const duplicates = await auditRole(role.name, role.field);
    if (duplicates.length > 0) {
      allDuplicates.push({ role: role.name, duplicates });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 AUDIT RESULTS');
  console.log('='.repeat(80));

  if (allDuplicates.length === 0) {
    console.log('\n✅ No potential duplicates found!');
    return;
  }

  let totalIssues = 0;
  
  for (const { role, duplicates } of allDuplicates) {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📌 ${role.toUpperCase()} - ${duplicates.length} potential duplicate groups`);
    console.log('='.repeat(80));
    
    for (const group of duplicates) {
      totalIssues++;
      console.log(`\n${totalIssues}. Potential duplicate for "${group.baseName}":`);
      console.log(`   Total movies: ${group.totalMovies}`);
      console.log(`   Variations found:`);
      
      for (const variation of group.variations) {
        console.log(`      - "${variation.name}" (${variation.count} movies)`);
      }
      
      // Show profile URLs
      console.log(`   Profile URLs:`);
      for (const variation of group.variations) {
        const slug = variation.name.toLowerCase().replace(/[\s\.\-]+/g, '-');
        console.log(`      - http://localhost:3000/movies?profile=${slug}`);
      }
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📈 SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTotal potential duplicate groups found: ${totalIssues}`);
  console.log('\nBreakdown by role:');
  for (const { role, duplicates } of allDuplicates) {
    console.log(`  - ${role}: ${duplicates.length} groups`);
  }

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('   1. Review each group manually');
  console.log('   2. Check if variations are same person (spelling differences)');
  console.log('   3. If same person, standardize to one spelling');
  console.log('   4. Update all movies to use consistent spelling');
  console.log('   5. Consider adding celebrity records for common names');

  console.log('\n' + '='.repeat(80));
  console.log('✅ Audit complete!\n');
}

auditAllProfiles().catch(console.error);
