#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Premium completeness criteria
interface CompletenessCheck {
  category: string;
  fields: string[];
  weight: number; // For calculating overall score
}

const PREMIUM_CRITERIA: CompletenessCheck[] = [
  {
    category: 'Core Identity',
    fields: ['name_en', 'slug', 'name_te'],
    weight: 0.10
  },
  {
    category: 'Basic Enrichment',
    fields: ['short_bio', 'industry_title', 'usp', 'profile_image'],
    weight: 0.20
  },
  {
    category: 'Advanced Enrichment',
    fields: ['awards', 'fan_culture', 'social_links', 'brand_pillars'],
    weight: 0.25
  },
  {
    category: 'Premium Data',
    fields: ['actor_eras', 'family_relationships', 'romantic_pairings', 'legacy_impact'],
    weight: 0.25
  },
  {
    category: 'Governance',
    fields: ['trust_score', 'confidence_tier', 'entity_confidence_score', 'freshness_score'],
    weight: 0.20
  }
];

// Check individual celebrity completeness
function checkCelebrityCompleteness(celeb: any) {
  const missing: Record<string, string[]> = {};
  const present: Record<string, string[]> = {};
  let totalScore = 0;

  for (const criteria of PREMIUM_CRITERIA) {
    missing[criteria.category] = [];
    present[criteria.category] = [];
    let categoryScore = 0;

    for (const field of criteria.fields) {
      const value = celeb[field];
      const hasValue = value !== null && 
                      value !== undefined && 
                      value !== '' &&
                      (Array.isArray(value) ? value.length > 0 : true) &&
                      (typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).length > 0 : true);
      
      if (hasValue) {
        present[criteria.category].push(field);
        categoryScore += 1;
      } else {
        missing[criteria.category].push(field);
      }
    }

    // Calculate weighted score for this category
    const categoryCompleteness = categoryScore / criteria.fields.length;
    totalScore += categoryCompleteness * criteria.weight;
  }

  return {
    score: Math.round(totalScore * 100), // 0-100
    missing,
    present,
    isPremium: totalScore >= 0.90, // 90%+ complete = Premium
    isComplete: totalScore >= 0.70, // 70%+ = Complete
    isPartial: totalScore >= 0.40, // 40-70% = Partial
    // Below 40% = Minimal
  };
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

function cyan(text: string) { return `${colors.cyan}${text}${colors.reset}`; }
function green(text: string) { return `${colors.green}${text}${colors.reset}`; }
function yellow(text: string) { return `${colors.yellow}${text}${colors.reset}`; }
function red(text: string) { return `${colors.red}${text}${colors.reset}`; }
function blue(text: string) { return `${colors.blue}${text}${colors.reset}`; }
function gray(text: string) { return `${colors.gray}${text}${colors.reset}`; }
function white(text: string) { return `${colors.white}${text}${colors.reset}`; }
function bold(text: string) { return `${colors.bold}${text}${colors.reset}`; }

// Main audit function
async function auditCelebrityProfiles() {
  console.log(cyan(bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           CELEBRITY PROFILE COMPLETENESS AUDIT                        ║
║                    Premium Criteria Analysis                          ║
╚═══════════════════════════════════════════════════════════════════════╝
`)));

  // Fetch all celebrities
  console.log(white('  📊 Fetching all celebrity profiles...\n'));
  
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('*')
    .order('name_en');

  if (error || !celebrities) {
    console.error(red('❌ Error fetching celebrities:'), error);
    return;
  }

  console.log(green(`  ✅ Loaded ${celebrities.length} celebrity profiles\n`));

  // Also fetch awards count for each celebrity
  const { data: awardsData } = await supabase
    .from('celebrity_awards')
    .select('celebrity_id');

  const awardsCount = awardsData?.reduce((acc: Record<string, number>, award: any) => {
    acc[award.celebrity_id] = (acc[award.celebrity_id] || 0) + 1;
    return acc;
  }, {}) || {};

  // Analyze each celebrity
  const results = celebrities.map(celeb => {
    // Inject awards flag and social_links from fan_culture
    const enrichedCeleb = {
      ...celeb,
      awards: awardsCount[celeb.id] || null,
      social_links: celeb.fan_culture?.social_links || null
    };
    
    const analysis = checkCelebrityCompleteness(enrichedCeleb);
    return {
      id: celeb.id,
      name: celeb.name_en,
      slug: celeb.slug,
      ...analysis
    };
  });

  // Statistics
  const stats = {
    total: results.length,
    premium: results.filter(r => r.isPremium).length,
    complete: results.filter(r => r.isComplete && !r.isPremium).length,
    partial: results.filter(r => r.isPartial).length,
    minimal: results.filter(r => !r.isPartial && !r.isComplete && !r.isPremium).length,
    avgScore: Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length),
  };

  // Display Statistics
  console.log(cyan(bold('╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║                        SUMMARY STATISTICS                              ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));

  console.log(white(`  Total Profiles: ${stats.total}\n`));
  
  console.log(green(`  🏆 Premium (90%+):  ${stats.premium} (${Math.round(stats.premium/stats.total*100)}%)`));
  console.log(blue(`  ✅ Complete (70-89%): ${stats.complete} (${Math.round(stats.complete/stats.total*100)}%)`));
  console.log(yellow(`  ⚠️  Partial (40-69%):  ${stats.partial} (${Math.round(stats.partial/stats.total*100)}%)`));
  console.log(red(`  ❌ Minimal (< 40%):   ${stats.minimal} (${Math.round(stats.minimal/stats.total*100)}%)`));
  
  console.log(white(`\n  Average Completeness: ${stats.avgScore}%\n`));

  // Show Premium profiles (examples)
  console.log(cyan(bold('\n╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║                    PREMIUM PROFILES (Examples)                         ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));
  
  const premiumExamples = results.filter(r => r.isPremium).slice(0, 10);
  if (premiumExamples.length > 0) {
    premiumExamples.forEach(celeb => {
      console.log(green(`  🏆 ${celeb.name} (${celeb.slug}) - ${celeb.score}%`));
    });
  } else {
    console.log(yellow('  No premium profiles found yet.\n'));
  }

  // Show profiles needing work
  console.log(cyan(bold('\n╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║              PROFILES NEEDING ENRICHMENT (Detailed)                    ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));

  const needsWork = results
    .filter(r => !r.isPremium)
    .sort((a, b) => a.score - b.score)
    .slice(0, 20); // Show worst 20

  for (const celeb of needsWork) {
    const scoreColor = celeb.score >= 70 ? blue : celeb.score >= 40 ? yellow : red;
    console.log(scoreColor(`\n  ${celeb.name} (${celeb.slug})`));
    console.log(white(`  Completeness: ${celeb.score}%`));
    console.log(white(`  URL: http://localhost:3000/movies?profile=${celeb.slug}\n`));

    // Show missing fields by category
    for (const [category, fields] of Object.entries(celeb.missing)) {
      if ((fields as string[]).length > 0) {
        console.log(gray(`    Missing ${category}: ${(fields as string[]).join(', ')}`));
      }
    }
  }

  // Recommendations
  console.log(cyan(bold('\n╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║                       RECOMMENDATIONS                                  ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));

  if (stats.minimal > 0) {
    console.log(red(`  🔴 HIGH PRIORITY: ${stats.minimal} profiles have minimal data (< 40%)`));
    console.log(white(`     Action: Run celebrity enrichment scripts or add data manually\n`));
  }

  if (stats.partial > 0) {
    console.log(yellow(`  🟡 MEDIUM PRIORITY: ${stats.partial} profiles have partial data (40-69%)`));
    console.log(white(`     Action: Focus on missing premium fields (eras, family, governance)\n`));
  }

  if (stats.complete > 0) {
    console.log(blue(`  🔵 LOW PRIORITY: ${stats.complete} profiles are complete but not premium`));
    console.log(white(`     Action: Add finishing touches (social links, trivia, fan culture)\n`));
  }

  if (stats.premium === stats.total) {
    console.log(green(`  🎉 EXCELLENT! All profiles are at premium level!\n`));
  }

  console.log(white(`\n  Next Steps:`));
  console.log(white(`  1. Review profiles at: http://localhost:3000/movies?profile=<slug>`));
  console.log(white(`  2. Run enrichment: npx tsx scripts/enrich-actor-profiles.ts`));
  console.log(white(`  3. Add awards: Use celebrity_awards table`));
  console.log(white(`  4. Re-run audit to track progress\n`));

  // Export summary
  const summary = {
    generated_at: new Date().toISOString(),
    total_profiles: stats.total,
    by_tier: {
      premium: stats.premium,
      complete: stats.complete,
      partial: stats.partial,
      minimal: stats.minimal,
    },
    avg_completeness: stats.avgScore,
    premium_profiles: premiumExamples.map(c => ({
      name: c.name,
      slug: c.slug,
      score: c.score,
      url: `http://localhost:3000/movies?profile=${c.slug}`,
    })),
    needs_work: needsWork.map(c => ({
      name: c.name,
      slug: c.slug,
      score: c.score,
      url: `http://localhost:3000/movies?profile=${c.slug}`,
      missing_categories: Object.entries(c.missing)
        .filter(([_, fields]) => (fields as string[]).length > 0)
        .map(([cat, fields]) => `${cat}: ${(fields as string[]).join(', ')}`),
    })),
  };

  console.log(cyan('\n  💾 Exporting summary to: docs/manual-review/CELEBRITY-PROFILE-AUDIT.json\n'));
  
  // Ensure directory exists
  try {
    mkdirSync('docs/manual-review', { recursive: true });
  } catch (e) {
    // Directory already exists
  }
  
  writeFileSync('docs/manual-review/CELEBRITY-PROFILE-AUDIT.json', JSON.stringify(summary, null, 2));
  console.log(green('  ✅ Export complete!\n'));
}

auditCelebrityProfiles().catch(console.error);
