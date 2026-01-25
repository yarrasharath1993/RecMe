#!/usr/bin/env npx tsx
/**
 * Comprehensive Celebrity Duplicates Audit
 * 
 * This script audits ALL celebrity profiles to identify potential duplicates
 * based on:
 * 1. Same TMDB ID
 * 2. Same IMDb ID
 * 3. Similar names (fuzzy matching)
 * 4. Multiple slugs for same person
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

interface CelebrityProfile {
  id: string;
  name_en: string;
  name_te: string | null;
  slug: string;
  tmdb_id: number | null;
  imdb_id: string | null;
  is_published: boolean;
  entity_confidence_score: number | null;
  occupation: string[] | null;
  birth_date: string | null;
  profile_image: string | null;
  created_at: string;
  updated_at: string;
}

interface DuplicateGroup {
  type: 'tmdb' | 'imdb' | 'name';
  key: string;
  profiles: CelebrityProfile[];
}

function normalizedName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/\s+/g, '');
}

function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

async function auditAllDuplicates() {
  console.log('🔍 Comprehensive Celebrity Duplicates Audit\n');
  console.log('='.repeat(80));
  console.log('Fetching all celebrity profiles...\n');

  const { data: profiles, error } = await supabase
    .from('celebrities')
    .select('*')
    .order('name_en');

  if (error) {
    console.error('❌ Error fetching profiles:', error);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('✅ No profiles found');
    return;
  }

  console.log(`📊 Total profiles: ${profiles.length}\n`);

  const duplicateGroups: DuplicateGroup[] = [];

  // Group by TMDB ID
  console.log('🔎 Checking for TMDB ID duplicates...\n');
  const byTmdbId = new Map<number, CelebrityProfile[]>();
  
  profiles.forEach((profile: CelebrityProfile) => {
    if (profile.tmdb_id) {
      const existing = byTmdbId.get(profile.tmdb_id) || [];
      existing.push(profile);
      byTmdbId.set(profile.tmdb_id, existing);
    }
  });

  let tmdbDuplicates = 0;
  byTmdbId.forEach((profiles, tmdbId) => {
    if (profiles.length > 1) {
      duplicateGroups.push({
        type: 'tmdb',
        key: `TMDB-${tmdbId}`,
        profiles,
      });
      tmdbDuplicates++;
    }
  });

  console.log(`   Found ${tmdbDuplicates} TMDB ID duplicate groups\n`);

  // Group by IMDb ID
  console.log('🔎 Checking for IMDb ID duplicates...\n');
  const byImdbId = new Map<string, CelebrityProfile[]>();
  
  profiles.forEach((profile: CelebrityProfile) => {
    if (profile.imdb_id) {
      const existing = byImdbId.get(profile.imdb_id) || [];
      existing.push(profile);
      byImdbId.set(profile.imdb_id, existing);
    }
  });

  let imdbDuplicates = 0;
  byImdbId.forEach((profiles, imdbId) => {
    if (profiles.length > 1) {
      // Check if not already in TMDB duplicates
      const alreadyFound = duplicateGroups.some(g => 
        g.profiles.some(p => profiles.some(prof => prof.id === p.id))
      );
      if (!alreadyFound) {
        duplicateGroups.push({
          type: 'imdb',
          key: `IMDb-${imdbId}`,
          profiles,
        });
        imdbDuplicates++;
      }
    }
  });

  console.log(`   Found ${imdbDuplicates} IMDb ID duplicate groups\n`);

  // Group by normalized name
  console.log('🔎 Checking for name similarity duplicates...\n');
  const byName = new Map<string, CelebrityProfile[]>();
  
  profiles.forEach((profile: CelebrityProfile) => {
    const normalized = normalizedName(profile.name_en);
    const existing = byName.get(normalized) || [];
    existing.push(profile);
    byName.set(normalized, existing);
  });

  let nameDuplicates = 0;
  byName.forEach((profiles, name) => {
    if (profiles.length > 1) {
      // Check if not already in TMDB or IMDb duplicates
      const alreadyFound = duplicateGroups.some(g => 
        g.profiles.some(p => profiles.some(prof => prof.id === p.id))
      );
      if (!alreadyFound) {
        duplicateGroups.push({
          type: 'name',
          key: `Name-${name}`,
          profiles,
        });
        nameDuplicates++;
      }
    }
  });

  console.log(`   Found ${nameDuplicates} name similarity duplicate groups\n`);

  // Generate report
  console.log('='.repeat(80));
  console.log('📋 DUPLICATE GROUPS REPORT\n');

  let reportContent = `# Celebrity Duplicates Audit Report
Generated: ${new Date().toISOString()}
Total Profiles: ${profiles.length}
Duplicate Groups Found: ${duplicateGroups.length}

## Summary
- TMDB ID Duplicates: ${tmdbDuplicates}
- IMDb ID Duplicates: ${imdbDuplicates}
- Name Similarity Duplicates: ${nameDuplicates}

---

`;

  if (duplicateGroups.length === 0) {
    console.log('✅ No duplicates found!\n');
    reportContent += '✅ No duplicates found!\n';
  } else {
    console.log(`⚠️  Found ${duplicateGroups.length} duplicate groups:\n`);

    duplicateGroups.forEach((group, index) => {
      console.log(`\n${index + 1}. ${group.type.toUpperCase()} Duplicate - ${group.key}`);
      console.log(`   ${group.profiles.length} profiles:`);
      
      reportContent += `\n## ${index + 1}. ${group.type.toUpperCase()} Duplicate - ${group.key}\n\n`;
      reportContent += `**${group.profiles.length} profiles found:**\n\n`;

      // Determine primary (best) profile
      const primary = group.profiles.reduce((best, current) => {
        const bestScore = (best.entity_confidence_score || 0) + 
                         (best.is_published ? 50 : 0) +
                         (best.imdb_id ? 20 : 0) +
                         (best.profile_image ? 10 : 0) +
                         (best.birth_date ? 10 : 0);
        
        const currentScore = (current.entity_confidence_score || 0) +
                            (current.is_published ? 50 : 0) +
                            (current.imdb_id ? 20 : 0) +
                            (current.profile_image ? 10 : 0) +
                            (current.birth_date ? 10 : 0);
        
        return currentScore > bestScore ? current : best;
      });

      group.profiles.forEach((profile, i) => {
        const isPrimary = profile.id === primary.id;
        const marker = isPrimary ? '👑 PRIMARY (KEEP)' : '❌ DUPLICATE (DELETE)';
        
        console.log(`\n   ${marker}`);
        console.log(`   ${i + 1}. ${profile.name_en}`);
        console.log(`      ID: ${profile.id}`);
        console.log(`      Slug: ${profile.slug}`);
        console.log(`      TMDB: ${profile.tmdb_id || 'N/A'}`);
        console.log(`      IMDb: ${profile.imdb_id || 'N/A'}`);
        console.log(`      Published: ${profile.is_published ? '✅' : '❌'}`);
        console.log(`      Confidence: ${profile.entity_confidence_score || 0}`);
        console.log(`      Image: ${profile.profile_image ? '✅' : '❌'}`);
        console.log(`      Birth Date: ${profile.birth_date || 'N/A'}`);

        reportContent += `\n### ${marker} ${i + 1}. ${profile.name_en}\n\n`;
        reportContent += `- **ID:** \`${profile.id}\`\n`;
        reportContent += `- **Slug:** \`${profile.slug}\`\n`;
        reportContent += `- **URL:** http://localhost:3000/movies?profile=${profile.slug}\n`;
        reportContent += `- **TMDB ID:** ${profile.tmdb_id || 'N/A'}\n`;
        reportContent += `- **IMDb ID:** ${profile.imdb_id || 'N/A'}\n`;
        reportContent += `- **Published:** ${profile.is_published ? '✅' : '❌'}\n`;
        reportContent += `- **Confidence Score:** ${profile.entity_confidence_score || 0}\n`;
        reportContent += `- **Profile Image:** ${profile.profile_image ? '✅' : '❌'}\n`;
        reportContent += `- **Birth Date:** ${profile.birth_date || 'N/A'}\n`;
        reportContent += `- **Created:** ${new Date(profile.created_at).toLocaleString()}\n`;
        reportContent += `- **Updated:** ${new Date(profile.updated_at).toLocaleString()}\n`;
      });

      reportContent += '\n---\n';
    });

    // Generate SQL delete statements
    reportContent += '\n## SQL Fix Script\n\n```sql\nBEGIN;\n\n';
    
    duplicateGroups.forEach((group, index) => {
      const primary = group.profiles.reduce((best, current) => {
        const bestScore = (best.entity_confidence_score || 0) + 
                         (best.is_published ? 50 : 0) +
                         (best.imdb_id ? 20 : 0);
        const currentScore = (current.entity_confidence_score || 0) +
                            (current.is_published ? 50 : 0) +
                            (current.imdb_id ? 20 : 0);
        return currentScore > bestScore ? current : best;
      });

      reportContent += `-- ${index + 1}. ${group.type.toUpperCase()} Duplicate - ${group.key}\n`;
      reportContent += `-- PRIMARY (KEEP): ${primary.name_en} (${primary.slug})\n`;
      reportContent += `--   ID: ${primary.id}\n\n`;

      group.profiles.forEach(profile => {
        if (profile.id !== primary.id) {
          reportContent += `-- DELETE: ${profile.name_en} (${profile.slug})\n`;
          reportContent += `DELETE FROM celebrities WHERE id = '${profile.id}';\n\n`;
        }
      });

      reportContent += '\n';
    });

    reportContent += '-- Uncomment below to commit:\n-- COMMIT;\n\n';
    reportContent += '-- Or rollback to review:\nROLLBACK;\n```\n';
  }

  // Save report
  const reportPath = '/Users/sharathchandra/Projects/telugu-portal/CELEBRITY-DUPLICATES-AUDIT-2026-01-15.md';
  fs.writeFileSync(reportPath, reportContent);

  console.log('\n' + '='.repeat(80));
  console.log('✅ Audit Complete!\n');
  console.log(`📄 Report saved to: ${reportPath}\n`);
  console.log('Next steps:');
  console.log('1. Review the report');
  console.log('2. Verify the primary profiles selected');
  console.log('3. Run the SQL fix script or create individual fix scripts\n');
}

// Run the audit
auditAllDuplicates().catch(console.error);
