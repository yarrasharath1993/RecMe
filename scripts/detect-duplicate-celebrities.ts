import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import chalk from 'chalk';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Celebrity {
  id: string;
  name_en: string;
  name_te?: string;
  occupation?: string[];
  birth_date?: string;
  death_date?: string;
  tmdb_id?: number;
  imdb_id?: string;
  slug?: string;
  popularity_score?: number;
  is_published?: boolean;
}

interface DuplicateGroup {
  type: 'exact' | 'similar' | 'variation' | 'external_id' | 'slug';
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  celebrities: Celebrity[];
}

// Fuzzy string matching (simple Levenshtein distance)
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function similarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const longerLength = longer.length;
  
  if (longerLength === 0) {
    return 1.0;
  }
  
  const distance = levenshteinDistance(longer, shorter);
  return (longerLength - distance) / longerLength;
}

// Normalize name for comparison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Check if names are variations of each other
function areNameVariations(name1: string, name2: string): boolean {
  const n1 = name1.toLowerCase();
  const n2 = name2.toLowerCase();
  
  // Check if one is a substring of the other
  if (n1.includes(n2) || n2.includes(n1)) {
    return true;
  }
  
  // Check common patterns
  // e.g., "Akkineni Nagarjuna" vs "Nagarjuna"
  const words1 = n1.split(/\s+/);
  const words2 = n2.split(/\s+/);
  
  // If last word matches (common for Telugu names)
  if (words1[words1.length - 1] === words2[words2.length - 1]) {
    return true;
  }
  
  return false;
}

async function getAllCelebrities(): Promise<Celebrity[]> {
  const { data, error } = await supabase
    .from('celebrities')
    .select('id, name_en, name_te, occupation, birth_date, death_date, tmdb_id, imdb_id, slug, popularity_score, is_published')
    .order('name_en');
  
  if (error) {
    throw new Error(`Failed to fetch celebrities: ${error.message}`);
  }
  
  return data as Celebrity[];
}

function detectDuplicates(celebrities: Celebrity[]): DuplicateGroup[] {
  const duplicates: DuplicateGroup[] = [];
  const processed = new Set<string>();
  
  console.log(chalk.cyan('🔍 Detecting duplicates...\n'));
  
  // 1. Exact name matches
  console.log(chalk.gray('Checking exact name matches...'));
  const nameMap = new Map<string, Celebrity[]>();
  
  for (const celeb of celebrities) {
    const normalized = normalizeName(celeb.name_en);
    if (!nameMap.has(normalized)) {
      nameMap.set(normalized, []);
    }
    nameMap.get(normalized)!.push(celeb);
  }
  
  for (const [name, celebs] of nameMap) {
    if (celebs.length > 1) {
      duplicates.push({
        type: 'exact',
        confidence: 'high',
        reason: `Exact name match: "${celebs[0].name_en}"`,
        celebrities: celebs,
      });
      celebs.forEach(c => processed.add(c.id));
    }
  }
  
  // 2. External ID matches (TMDB/IMDB)
  console.log(chalk.gray('Checking external ID matches...'));
  const tmdbMap = new Map<number, Celebrity[]>();
  const imdbMap = new Map<string, Celebrity[]>();
  
  for (const celeb of celebrities) {
    if (celeb.tmdb_id && celeb.tmdb_id > 0) {
      if (!tmdbMap.has(celeb.tmdb_id)) {
        tmdbMap.set(celeb.tmdb_id, []);
      }
      tmdbMap.get(celeb.tmdb_id)!.push(celeb);
    }
    
    if (celeb.imdb_id) {
      if (!imdbMap.has(celeb.imdb_id)) {
        imdbMap.set(celeb.imdb_id, []);
      }
      imdbMap.get(celeb.imdb_id)!.push(celeb);
    }
  }
  
  for (const [tmdbId, celebs] of tmdbMap) {
    if (celebs.length > 1) {
      duplicates.push({
        type: 'external_id',
        confidence: 'high',
        reason: `Same TMDB ID: ${tmdbId}`,
        celebrities: celebs,
      });
      celebs.forEach(c => processed.add(c.id));
    }
  }
  
  for (const [imdbId, celebs] of imdbMap) {
    if (celebs.length > 1) {
      duplicates.push({
        type: 'external_id',
        confidence: 'high',
        reason: `Same IMDB ID: ${imdbId}`,
        celebrities: celebs,
      });
      celebs.forEach(c => processed.add(c.id));
    }
  }
  
  // 3. Slug matches
  console.log(chalk.gray('Checking slug matches...'));
  const slugMap = new Map<string, Celebrity[]>();
  
  for (const celeb of celebrities) {
    if (celeb.slug) {
      if (!slugMap.has(celeb.slug)) {
        slugMap.set(celeb.slug, []);
      }
      slugMap.get(celeb.slug)!.push(celeb);
    }
  }
  
  for (const [slug, celebs] of slugMap) {
    if (celebs.length > 1) {
      duplicates.push({
        type: 'slug',
        confidence: 'high',
        reason: `Same slug: "${slug}"`,
        celebrities: celebs,
      });
      celebs.forEach(c => processed.add(c.id));
    }
  }
  
  // 4. Similar names (fuzzy matching)
  console.log(chalk.gray('Checking similar names (fuzzy matching)...'));
  const unprocessed = celebrities.filter(c => !processed.has(c.id));
  
  for (let i = 0; i < unprocessed.length; i++) {
    const celeb1 = unprocessed[i];
    
    for (let j = i + 1; j < unprocessed.length; j++) {
      const celeb2 = unprocessed[j];
      
      // Skip if already processed in this check
      if (processed.has(celeb1.id) || processed.has(celeb2.id)) {
        continue;
      }
      
      const sim = similarity(celeb1.name_en, celeb2.name_en);
      
      // High similarity (90%+)
      if (sim >= 0.9) {
        const existing = duplicates.find(d => 
          d.celebrities.some(c => c.id === celeb1.id || c.id === celeb2.id)
        );
        
        if (!existing) {
          duplicates.push({
            type: 'similar',
            confidence: 'high',
            reason: `Very similar names (${Math.round(sim * 100)}% match): "${celeb1.name_en}" vs "${celeb2.name_en}"`,
            celebrities: [celeb1, celeb2],
          });
          processed.add(celeb1.id);
          processed.add(celeb2.id);
        }
      }
      // Medium similarity (80-90%)
      else if (sim >= 0.8) {
        duplicates.push({
          type: 'similar',
          confidence: 'medium',
          reason: `Similar names (${Math.round(sim * 100)}% match): "${celeb1.name_en}" vs "${celeb2.name_en}"`,
          celebrities: [celeb1, celeb2],
        });
      }
    }
  }
  
  // 5. Name variations
  console.log(chalk.gray('Checking name variations...'));
  for (let i = 0; i < celebrities.length; i++) {
    const celeb1 = celebrities[i];
    
    for (let j = i + 1; j < celebrities.length; j++) {
      const celeb2 = celebrities[j];
      
      if (areNameVariations(celeb1.name_en, celeb2.name_en)) {
        // Check if not already in duplicates
        const alreadyFound = duplicates.some(d => 
          d.celebrities.some(c => c.id === celeb1.id) &&
          d.celebrities.some(c => c.id === celeb2.id)
        );
        
        if (!alreadyFound) {
          duplicates.push({
            type: 'variation',
            confidence: 'medium',
            reason: `Name variation detected: "${celeb1.name_en}" vs "${celeb2.name_en}"`,
            celebrities: [celeb1, celeb2],
          });
        }
      }
    }
  }
  
  // 6. Same birth date + occupation
  console.log(chalk.gray('Checking birth date + occupation matches...'));
  const birthOccupationMap = new Map<string, Celebrity[]>();
  
  for (const celeb of celebrities) {
    if (celeb.birth_date && celeb.occupation && celeb.occupation.length > 0) {
      const key = `${celeb.birth_date}_${celeb.occupation.sort().join('_')}`;
      if (!birthOccupationMap.has(key)) {
        birthOccupationMap.set(key, []);
      }
      birthOccupationMap.get(key)!.push(celeb);
    }
  }
  
  for (const [key, celebs] of birthOccupationMap) {
    if (celebs.length > 1) {
      // Check if names are at least somewhat similar
      for (let i = 0; i < celebs.length; i++) {
        for (let j = i + 1; j < celebs.length; j++) {
          const sim = similarity(celebs[i].name_en, celebs[j].name_en);
          if (sim > 0.5) {
            const alreadyFound = duplicates.some(d => 
              d.celebrities.some(c => c.id === celebs[i].id) &&
              d.celebrities.some(c => c.id === celebs[j].id)
            );
            
            if (!alreadyFound) {
              duplicates.push({
                type: 'variation',
                confidence: 'low',
                reason: `Same birth date and occupation: "${celebs[i].name_en}" vs "${celebs[j].name_en}"`,
                celebrities: [celebs[i], celebs[j]],
              });
            }
          }
        }
      }
    }
  }
  
  return duplicates;
}

async function main() {
  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  DUPLICATE CELEBRITY DETECTION'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  // Get all celebrities
  const celebrities = await getAllCelebrities();
  console.log(chalk.green(`✓ Loaded ${celebrities.length} celebrities\n`));
  
  // Detect duplicates
  const duplicates = detectDuplicates(celebrities);
  
  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  RESULTS'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  // Statistics
  const stats = {
    total: duplicates.length,
    high: duplicates.filter(d => d.confidence === 'high').length,
    medium: duplicates.filter(d => d.confidence === 'medium').length,
    low: duplicates.filter(d => d.confidence === 'low').length,
    exact: duplicates.filter(d => d.type === 'exact').length,
    similar: duplicates.filter(d => d.type === 'similar').length,
    variation: duplicates.filter(d => d.type === 'variation').length,
    externalId: duplicates.filter(d => d.type === 'external_id').length,
    slug: duplicates.filter(d => d.type === 'slug').length,
  };
  
  console.log(chalk.cyan('Total Duplicate Groups Found:'), chalk.yellow(stats.total));
  console.log(chalk.cyan('\nBy Confidence:'));
  console.log(chalk.red(`  ⚠️  High Confidence:   ${stats.high}`));
  console.log(chalk.yellow(`  ⚠️  Medium Confidence: ${stats.medium}`));
  console.log(chalk.gray(`  ⚠️  Low Confidence:    ${stats.low}`));
  
  console.log(chalk.cyan('\nBy Type:'));
  console.log(chalk.red(`  Exact Name:         ${stats.exact}`));
  console.log(chalk.yellow(`  Similar Name:       ${stats.similar}`));
  console.log(chalk.yellow(`  Name Variation:     ${stats.variation}`));
  console.log(chalk.red(`  External ID Match:  ${stats.externalId}`));
  console.log(chalk.red(`  Slug Match:         ${stats.slug}`));
  
  // Generate CSV reports
  const timestamp = new Date().toISOString().split('T')[0];
  
  // 1. All duplicates
  const allDuplicatesCsv = [
    'Group ID,Confidence,Type,Reason,Celebrity 1 ID,Celebrity 1 Name,Popularity 1,Published 1,Celebrity 2 ID,Celebrity 2 Name,Popularity 2,Published 2,Birth Date 1,Birth Date 2,TMDB ID 1,TMDB ID 2,IMDB ID 1,IMDB ID 2,Occupation 1,Occupation 2',
    ...duplicates.map((group, index) => {
      const rows: string[] = [];
      
      // For each pair in the group
      for (let i = 0; i < group.celebrities.length; i++) {
        for (let j = i + 1; j < group.celebrities.length; j++) {
          const c1 = group.celebrities[i];
          const c2 = group.celebrities[j];
          
          rows.push([
            `DUP-${String(index + 1).padStart(3, '0')}`,
            group.confidence,
            group.type,
            `"${group.reason.replace(/"/g, '""')}"`,
            c1.id,
            `"${c1.name_en}"`,
            c1.popularity_score || 0,
            c1.is_published ? 'Yes' : 'No',
            c2.id,
            `"${c2.name_en}"`,
            c2.popularity_score || 0,
            c2.is_published ? 'Yes' : 'No',
            c1.birth_date || '',
            c2.birth_date || '',
            c1.tmdb_id || '',
            c2.tmdb_id || '',
            c1.imdb_id || '',
            c2.imdb_id || '',
            `"${c1.occupation?.join(', ') || ''}"`,
            `"${c2.occupation?.join(', ') || ''}"`,
          ].join(','));
        }
      }
      
      return rows.join('\n');
    }).join('\n')
  ].join('\n');
  
  fs.writeFileSync(`DUPLICATE-CELEBRITIES-ALL-${timestamp}.csv`, allDuplicatesCsv);
  console.log(chalk.green(`\n✓ Created: DUPLICATE-CELEBRITIES-ALL-${timestamp}.csv`));
  
  // 2. High confidence only (needs immediate action)
  const highConfidence = duplicates.filter(d => d.confidence === 'high');
  
  const highConfidenceCsv = [
    'Group ID,Type,Reason,Celebrity 1 ID,Celebrity 1 Name,Popularity 1,Celebrity 2 ID,Celebrity 2 Name,Popularity 2,Action Required',
    ...highConfidence.map((group, index) => {
      const rows: string[] = [];
      
      for (let i = 0; i < group.celebrities.length; i++) {
        for (let j = i + 1; j < group.celebrities.length; j++) {
          const c1 = group.celebrities[i];
          const c2 = group.celebrities[j];
          
          // Suggest which one to keep (higher popularity or published)
          let action = '';
          if (c1.is_published && !c2.is_published) {
            action = `Keep ${c1.name_en} (published), merge data from ${c2.name_en}`;
          } else if (!c1.is_published && c2.is_published) {
            action = `Keep ${c2.name_en} (published), merge data from ${c1.name_en}`;
          } else if ((c1.popularity_score || 0) > (c2.popularity_score || 0)) {
            action = `Keep ${c1.name_en} (higher popularity), merge data from ${c2.name_en}`;
          } else if ((c2.popularity_score || 0) > (c1.popularity_score || 0)) {
            action = `Keep ${c2.name_en} (higher popularity), merge data from ${c1.name_en}`;
          } else {
            action = 'Manual review needed - similar data';
          }
          
          rows.push([
            `DUP-${String(index + 1).padStart(3, '0')}`,
            group.type,
            `"${group.reason.replace(/"/g, '""')}"`,
            c1.id,
            `"${c1.name_en}"`,
            c1.popularity_score || 0,
            c2.id,
            `"${c2.name_en}"`,
            c2.popularity_score || 0,
            `"${action}"`,
          ].join(','));
        }
      }
      
      return rows.join('\n');
    }).join('\n')
  ].join('\n');
  
  fs.writeFileSync(`DUPLICATE-CELEBRITIES-HIGH-PRIORITY-${timestamp}.csv`, highConfidenceCsv);
  console.log(chalk.red(`✓ Created: DUPLICATE-CELEBRITIES-HIGH-PRIORITY-${timestamp}.csv (${highConfidence.length} groups)`));
  
  // 3. Summary report
  const summary = `# Duplicate Celebrity Detection Report

**Date**: ${new Date().toLocaleDateString()}
**Total Celebrities**: ${celebrities.length}
**Duplicate Groups Found**: ${stats.total}

## Summary by Confidence

| Confidence | Count | Action Required |
|------------|-------|-----------------|
| 🔴 High | ${stats.high} | Immediate merge/deletion needed |
| 🟡 Medium | ${stats.medium} | Manual review recommended |
| 🟢 Low | ${stats.low} | Optional review |

## Summary by Type

| Type | Count | Description |
|------|-------|-------------|
| Exact Name | ${stats.exact} | Same normalized name (different IDs) |
| Similar Name | ${stats.similar} | 80%+ name similarity |
| Name Variation | ${stats.variation} | One name contains the other |
| External ID Match | ${stats.externalId} | Same TMDB/IMDB ID |
| Slug Match | ${stats.slug} | Same URL slug |

## High Priority Issues (${stats.high})

${highConfidence.length > 0 ? highConfidence.map((group, i) => {
  const celebList = group.celebrities.map(c => 
    `- **${c.name_en}** (ID: ${c.id}, Popularity: ${c.popularity_score || 0}, Published: ${c.is_published ? 'Yes' : 'No'})`
  ).join('\n  ');
  
  return `### ${i + 1}. ${group.reason}

${celebList}

**Type**: ${group.type}  
**Confidence**: ${group.confidence}
`;
}).join('\n---\n\n') : '_No high priority duplicates found._'}

## Files Generated

1. **DUPLICATE-CELEBRITIES-ALL-${timestamp}.csv**
   - Complete list of all ${stats.total} duplicate groups
   - Includes all confidence levels
   - Full details for comparison

2. **DUPLICATE-CELEBRITIES-HIGH-PRIORITY-${timestamp}.csv**
   - Only high confidence duplicates (${stats.high} groups)
   - Action recommendations included
   - Ready for immediate processing

## Recommended Actions

### For High Confidence Duplicates

1. **Review DUPLICATE-CELEBRITIES-HIGH-PRIORITY-${timestamp}.csv**
2. **For each duplicate group:**
   - Verify they are truly the same person
   - Choose which record to keep (usually the published one with higher popularity)
   - Merge data from duplicate into the kept record
   - Update all movie references to point to kept record
   - Delete the duplicate record

### For Medium/Low Confidence

1. **Review DUPLICATE-CELEBRITIES-ALL-${timestamp}.csv**
2. **Manually verify** each potential duplicate
3. **Merge or dismiss** based on verification

## Database Cleanup Script

After manual review, use the cleanup script:

\`\`\`bash
npx tsx scripts/merge-duplicate-celebrities.ts --input DUPLICATE-CELEBRITIES-HIGH-PRIORITY-${timestamp}.csv
\`\`\`

---

**Generated**: ${new Date().toISOString()}
`;
  
  fs.writeFileSync(`DUPLICATE-DETECTION-REPORT-${timestamp}.md`, summary);
  console.log(chalk.cyan(`✓ Created: DUPLICATE-DETECTION-REPORT-${timestamp}.md\n`));
  
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  DETECTION COMPLETE'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  if (stats.high > 0) {
    console.log(chalk.red(`⚠️  ${stats.high} HIGH PRIORITY duplicates found!`));
    console.log(chalk.yellow(`   Review DUPLICATE-CELEBRITIES-HIGH-PRIORITY-${timestamp}.csv\n`));
  }
  
  if (stats.medium > 0) {
    console.log(chalk.yellow(`⚠️  ${stats.medium} MEDIUM priority duplicates found`));
    console.log(chalk.gray(`   Review when possible\n`));
  }
  
  if (stats.low > 0) {
    console.log(chalk.gray(`ℹ️  ${stats.low} LOW priority potential duplicates`));
    console.log(chalk.gray(`   Optional review\n`));
  }
  
  if (stats.total === 0) {
    console.log(chalk.green('✅ No duplicates detected! Database is clean.\n'));
  }
}

main().catch(console.error);
