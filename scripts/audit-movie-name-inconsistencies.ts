#!/usr/bin/env npx tsx
/**
 * Audit Movie Name Inconsistencies
 * 
 * This script finds all name variations for celebrities in the movies table
 * and identifies which ones need to be normalized.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface NameVariation {
  variation: string;
  count: number;
  fields: string[];
  sampleMovies: string[];
}

function normalizeForComparison(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

async function auditMovieNameInconsistencies() {
  console.log('🔍 Auditing Movie Name Inconsistencies\n');
  console.log('='.repeat(80));

  // Fetch all movies
  const { data: allMovies } = await supabase
    .from('movies')
    .select('id, title_en, hero, heroine, director, producer, music_director, writer')
    .eq('is_published', true);

  if (!allMovies || allMovies.length === 0) {
    console.log('❌ No movies found');
    return;
  }

  console.log(`📊 Analyzing ${allMovies.length} movies...\n`);

  // Collect all names from all fields
  const allNames = new Map<string, {
    original: string;
    normalized: string;
    fields: Set<string>;
    count: number;
    movies: Set<string>;
  }>();

  const fields = ['hero', 'heroine', 'director', 'producer', 'music_director', 'writer'];

  allMovies.forEach((movie: any) => {
    fields.forEach(field => {
      const name = movie[field];
      if (name && typeof name === 'string') {
        const normalized = normalizeForComparison(name);
        
        const existing = allNames.get(normalized);
        if (existing) {
          existing.count++;
          existing.fields.add(field);
          existing.movies.add(movie.title_en);
        } else {
          allNames.set(normalized, {
            original: name,
            normalized,
            fields: new Set([field]),
            count: 1,
            movies: new Set([movie.title_en]),
          });
        }
      }
    });
  });

  // Group by normalized name to find variations
  const nameGroups = new Map<string, Array<{
    name: string;
    count: number;
    fields: string[];
    movies: string[];
  }>>();

  allNames.forEach(data => {
    const existing = nameGroups.get(data.normalized) || [];
    existing.push({
      name: data.original,
      count: data.count,
      fields: Array.from(data.fields),
      movies: Array.from(data.movies).slice(0, 3),
    });
    nameGroups.set(data.normalized, existing);
  });

  // Find names with multiple variations
  const inconsistencies: Array<{
    normalizedName: string;
    variations: Array<{ name: string; count: number; fields: string[]; movies: string[] }>;
    totalCount: number;
  }> = [];

  nameGroups.forEach((variations, normalized) => {
    if (variations.length > 1) {
      const totalCount = variations.reduce((sum, v) => sum + v.count, 0);
      inconsistencies.push({
        normalizedName: normalized,
        variations: variations.sort((a, b) => b.count - a.count),
        totalCount,
      });
    }
  });

  // Sort by total count (most impactful first)
  inconsistencies.sort((a, b) => b.totalCount - a.totalCount);

  console.log('='.repeat(80));
  console.log(`📋 Found ${inconsistencies.length} celebrities with name variations\n`);

  // Generate report
  let reportContent = `# Movie Name Inconsistencies Audit Report

**Date:** ${new Date().toISOString()}
**Total Movies:** ${allMovies.length}
**Celebrities with Variations:** ${inconsistencies.length}

## Summary

This report identifies celebrities whose names appear in multiple formats across the movies table,
causing duplicate entries in search results.

---

## Top 50 Inconsistencies (by impact)

`;

  // Display and write top 50
  inconsistencies.slice(0, 50).forEach((inc, index) => {
    console.log(`${index + 1}. Celebrity: ${inc.variations[0].name} (${inc.totalCount} total movies)`);
    console.log(`   Variations found: ${inc.variations.length}`);
    
    reportContent += `\n### ${index + 1}. ${inc.variations[0].name}\n\n`;
    reportContent += `**Total Movies:** ${inc.totalCount}\n`;
    reportContent += `**Variations:** ${inc.variations.length}\n\n`;

    inc.variations.forEach((variation, vIndex) => {
      const primary = vIndex === 0 ? '👑 PRIMARY (KEEP)' : '❌ VARIATION (NORMALIZE)';
      console.log(`   ${primary}`);
      console.log(`      Name: "${variation.name}"`);
      console.log(`      Count: ${variation.count} movies`);
      console.log(`      Fields: ${variation.fields.join(', ')}`);
      console.log(`      Sample: ${variation.movies.slice(0, 2).join(', ')}`);

      reportContent += `\n**${primary}**\n`;
      reportContent += `- Name: \`${variation.name}\`\n`;
      reportContent += `- Count: ${variation.count} movies\n`;
      reportContent += `- Fields: ${variation.fields.join(', ')}\n`;
      reportContent += `- Sample Movies: ${variation.movies.slice(0, 2).join(', ')}\n`;
    });

    reportContent += `\n**Recommended Action:**\n`;
    reportContent += `- Normalize all variations to: \`${inc.variations[0].name}\`\n`;
    reportContent += `- Update ${inc.totalCount - inc.variations[0].count} movie records\n`;
    reportContent += `\n---\n`;

    console.log('');
  });

  // Generate SQL fix script
  reportContent += `\n## SQL Normalization Script\n\n`;
  reportContent += `\`\`\`sql\nBEGIN;\n\n`;
  reportContent += `-- This script normalizes celebrity names in the movies table\n`;
  reportContent += `-- Always backup before running!\n\n`;

  inconsistencies.slice(0, 50).forEach((inc, index) => {
    const primaryName = inc.variations[0].name;
    
    reportContent += `-- ${index + 1}. Normalize "${primaryName}"\n`;
    
    inc.variations.slice(1).forEach(variation => {
      variation.fields.forEach(field => {
        reportContent += `UPDATE movies SET ${field} = '${primaryName}' WHERE ${field} = '${variation.name}';\n`;
      });
    });
    
    reportContent += `\n`;
  });

  reportContent += `-- Uncomment to commit:\n-- COMMIT;\n\n`;
  reportContent += `-- Or rollback to review:\nROLLBACK;\n\`\`\`\n`;

  // Save report
  const reportPath = '/Users/sharathchandra/Projects/telugu-portal/MOVIE-NAME-INCONSISTENCIES-AUDIT-2026-01-15.md';
  fs.writeFileSync(reportPath, reportContent);

  console.log('='.repeat(80));
  console.log(`\n✅ Audit complete!`);
  console.log(`📄 Report saved: ${reportPath}`);
  console.log(`\n📊 Statistics:`);
  console.log(`   - Total celebrities with variations: ${inconsistencies.length}`);
  console.log(`   - Total normalizations needed: ${inconsistencies.reduce((sum, inc) => sum + (inc.variations.length - 1), 0)}`);
  console.log(`   - Movies affected: ${inconsistencies.reduce((sum, inc) => sum + (inc.totalCount - inc.variations[0].count), 0)}`);
  console.log(`\n⚠️  Next steps:`);
  console.log(`   1. Review the report`);
  console.log(`   2. Run normalize-movie-names.ts with dryRun: true`);
  console.log(`   3. Verify changes, then run without dryRun\n`);
}

auditMovieNameInconsistencies().catch(console.error);
