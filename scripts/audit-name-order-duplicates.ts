/**
 * Audit for name order duplicates (First-Last vs Last-First)
 * Identifies celebrities who might have duplicate profiles due to reversed name order
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NamePair {
  name1: string;
  name2: string;
  count1: number;
  count2: number;
  totalMovies: number;
  field: string;
}

function reverseFullName(name: string): string {
  // Split by space and reverse
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return '';
  
  // Handle cases like "A. Kodandarami Reddy" - keep initials together with first part
  if (parts[0].includes('.')) {
    // Keep initial with rest
    return parts.slice(1).join(' ') + ' ' + parts[0];
  }
  
  // Simple reversal: "First Last" -> "Last First"
  return parts[parts.length - 1] + ' ' + parts.slice(0, -1).join(' ');
}

function normalizeForMatching(name: string): string {
  // Remove dots, spaces, convert to lowercase for fuzzy matching
  return name.toLowerCase().replace(/[.\s-]/g, '');
}

async function findNameOrderDuplicates(field: string): Promise<NamePair[]> {
  // Get all unique names from this field
  const { data: movies } = await supabase
    .from('movies')
    .select(field)
    .eq('is_published', true)
    .not(field, 'is', null);

  if (!movies) return [];

  // Count occurrences
  const nameCounts = new Map<string, number>();
  
  for (const movie of movies) {
    const value = movie[field as keyof typeof movie] as string;
    if (!value) continue;
    
    // Split by comma for multiple people
    const names = value.split(',').map(n => n.trim()).filter(n => n);
    
    for (const name of names) {
      nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
    }
  }

  // Find potential reversed pairs
  const pairs: NamePair[] = [];
  const checked = new Set<string>();
  
  for (const [name1, count1] of nameCounts.entries()) {
    if (checked.has(name1)) continue;
    
    // Try to generate reversed version
    const reversed = reverseFullName(name1);
    if (!reversed || reversed === name1) continue;
    
    // Check if reversed version exists
    const count2 = nameCounts.get(reversed);
    if (!count2) continue;
    
    // Verify they're likely the same person (fuzzy match)
    const norm1 = normalizeForMatching(name1);
    const norm2 = normalizeForMatching(reversed);
    
    if (norm1 === norm2) {
      pairs.push({
        name1,
        name2: reversed,
        count1,
        count2,
        totalMovies: count1 + count2,
        field,
      });
      
      checked.add(name1);
      checked.add(reversed);
    }
  }
  
  return pairs;
}

async function auditNameOrderDuplicates() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 NAME ORDER DUPLICATES AUDIT');
  console.log('   (First-Last vs Last-First)');
  console.log('='.repeat(80));

  const roles = [
    { name: 'Hero', field: 'hero' },
    { name: 'Heroine', field: 'heroine' },
    { name: 'Director', field: 'director' },
    { name: 'Music Director', field: 'music_director' },
    { name: 'Producer', field: 'producer' },
    { name: 'Writer', field: 'writer' },
  ];

  const allPairs: { role: string; pairs: NamePair[] }[] = [];
  
  for (const role of roles) {
    console.log(`\n🔍 Scanning ${role.name}s...`);
    const pairs = await findNameOrderDuplicates(role.field);
    
    if (pairs.length > 0) {
      allPairs.push({ role: role.name, pairs });
      console.log(`   Found ${pairs.length} potential name order duplicates`);
    } else {
      console.log('   No name order duplicates found');
    }
  }

  // Print detailed results
  console.log('\n' + '='.repeat(80));
  console.log('📊 DETAILED RESULTS');
  console.log('='.repeat(80));

  if (allPairs.length === 0) {
    console.log('\n✅ No name order duplicates found!');
    return;
  }

  let issueNumber = 0;
  
  for (const { role, pairs } of allPairs) {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📌 ${role.toUpperCase()} - ${pairs.length} name order duplicates`);
    console.log('='.repeat(80));
    
    // Sort by total movies (descending)
    pairs.sort((a, b) => b.totalMovies - a.totalMovies);
    
    for (const pair of pairs) {
      issueNumber++;
      console.log(`\n${issueNumber}. Name Order Duplicate:`);
      console.log(`   Version 1: "${pair.name1}" (${pair.count1} movies)`);
      console.log(`   Version 2: "${pair.name2}" (${pair.count2} movies)`);
      console.log(`   Total: ${pair.totalMovies} movies split across 2 profiles`);
      
      // Suggest which should be master
      const masterName = pair.count1 >= pair.count2 ? pair.name1 : pair.name2;
      console.log(`   Suggested Master: "${masterName}"`);
      
      // Show profile URLs
      const slug1 = pair.name1.toLowerCase().replace(/[\s\.]+/g, '-');
      const slug2 = pair.name2.toLowerCase().replace(/[\s\.]+/g, '-');
      console.log(`   Profile URLs:`);
      console.log(`      - http://localhost:3000/movies?profile=${slug1}`);
      console.log(`      - http://localhost:3000/movies?profile=${slug2}`);
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📈 SUMMARY');
  console.log('='.repeat(80));
  
  const totalPairs = allPairs.reduce((sum, r) => sum + r.pairs.length, 0);
  const totalMovies = allPairs.reduce((sum, r) => 
    sum + r.pairs.reduce((s, p) => s + p.totalMovies, 0), 0
  );
  
  console.log(`\nTotal name order duplicates found: ${totalPairs}`);
  console.log(`Total movies affected: ${totalMovies}`);
  
  console.log('\nBreakdown by role:');
  for (const { role, pairs } of allPairs) {
    const movies = pairs.reduce((sum, p) => sum + p.totalMovies, 0);
    console.log(`  - ${role}: ${pairs.length} pairs, ${movies} movies`);
  }

  // Top 10 by movie count
  const allPairsFlat = allPairs.flatMap(r => 
    r.pairs.map(p => ({ ...p, role: r.role }))
  ).sort((a, b) => b.totalMovies - a.totalMovies);
  
  if (allPairsFlat.length > 0) {
    console.log('\n🔥 TOP 10 BY MOVIE COUNT:');
    allPairsFlat.slice(0, 10).forEach((pair, idx) => {
      console.log(`   ${idx + 1}. ${pair.name1} / ${pair.name2} (${pair.role})`);
      console.log(`      ${pair.totalMovies} movies (${pair.count1} + ${pair.count2})`);
    });
  }

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('   1. Fix high-count duplicates first (20+ movies)');
  console.log('   2. Check celebrity table for canonical spelling');
  console.log('   3. Use First-Last order as default (Telugu convention)');
  console.log('   4. Create fix script for batch updates');
  console.log('   5. Document standard naming order');

  console.log('\n' + '='.repeat(80));
  console.log('✅ Audit complete!\n');
}

auditNameOrderDuplicates().catch(console.error);
