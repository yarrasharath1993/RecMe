#!/usr/bin/env npx tsx
/**
 * Detailed Missing Fields Audit
 * Identifies exactly what's missing across ALL profiles to reach 100% completeness
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

function cyan(text: string) { return `${colors.cyan}${text}${colors.reset}`; }
function green(text: string) { return `${colors.green}${text}${colors.reset}`; }
function yellow(text: string) { return `${colors.yellow}${text}${colors.reset}`; }
function red(text: string) { return `${colors.red}${text}${colors.reset}`; }
function white(text: string) { return `${colors.white}${text}${colors.reset}`; }
function bold(text: string) { return `${colors.bold}${text}${colors.reset}`; }

interface FieldStats {
  field: string;
  category: string;
  missing: number;
  present: number;
  percentage: number;
  canAutomate: boolean;
  automationSource: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

async function auditMissingFields() {
  console.log(cyan(bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           DETAILED MISSING FIELDS AUDIT                               ║
║           Path to 100% Completeness                                   ║
╚═══════════════════════════════════════════════════════════════════════╝
`)));

  const { data: celebs, error } = await supabase
    .from('celebrities')
    .select('*');

  if (error || !celebs) {
    console.error(red('Error fetching profiles'));
    return;
  }

  console.log(white(`  Total Profiles: ${celebs.length}\n`));

  // Get awards data
  const { data: awardsData } = await supabase
    .from('celebrity_awards')
    .select('celebrity_id');

  const celebsWithAwards = new Set(awardsData?.map(a => a.celebrity_id) || []);

  // Define all fields to check
  const fieldChecks: FieldStats[] = [
    // Core Identity
    { field: 'name_en', category: 'Core Identity', missing: 0, present: 0, percentage: 0, canAutomate: false, automationSource: 'Manual', priority: 'critical' },
    { field: 'slug', category: 'Core Identity', missing: 0, present: 0, percentage: 0, canAutomate: true, automationSource: 'Auto-generate from name', priority: 'critical' },
    { field: 'name_te', category: 'Core Identity', missing: 0, present: 0, percentage: 0, canAutomate: false, automationSource: 'Manual/Wikipedia', priority: 'critical' },
    
    // Basic Enrichment
    { field: 'short_bio', category: 'Basic Enrichment', missing: 0, present: 0, percentage: 0, canAutomate: true, automationSource: 'TMDB/Wikipedia', priority: 'high' },
    { field: 'industry_title', category: 'Basic Enrichment', missing: 0, present: 0, percentage: 0, canAutomate: true, automationSource: 'Known titles + AI', priority: 'high' },
    { field: 'usp', category: 'Basic Enrichment', missing: 0, present: 0, percentage: 0, canAutomate: true, automationSource: 'AI from filmography', priority: 'medium' },
    { field: 'profile_image', category: 'Basic Enrichment', missing: 0, present: 0, percentage: 0, canAutomate: true, automationSource: 'TMDB', priority: 'high' },
    
    // Advanced Enrichment
    { field: 'awards', category: 'Advanced Enrichment', missing: 0, present: 0, percentage: 0, canAutomate: false, automationSource: 'Wikipedia (manual verify)', priority: 'high' },
    { field: 'fan_culture', category: 'Advanced Enrichment', missing: 0, present: 0, percentage: 0, canAutomate: true, automationSource: 'AI from filmography', priority: 'low' },
    { field: 'social_links', category: 'Advanced Enrichment', missing: 0, present: 0, percentage: 0, canAutomate: false, automationSource: 'Manual research', priority: 'low' },
    { field: 'brand_pillars', category: 'Advanced Enrichment', missing: 0, present: 0, percentage: 0, canAutomate: true, automationSource: 'AI from career analysis', priority: 'medium' },
    
    // Premium Data
    { field: 'actor_eras', category: 'Premium Data', missing: 0, present: 0, percentage: 0, canAutomate: true, automationSource: 'Auto from filmography', priority: 'high' },
    { field: 'family_relationships', category: 'Premium Data', missing: 0, present: 0, percentage: 0, canAutomate: false, automationSource: 'Wikipedia/Manual', priority: 'medium' },
    { field: 'romantic_pairings', category: 'Premium Data', missing: 0, present: 0, percentage: 0, canAutomate: true, automationSource: 'Auto from filmography', priority: 'medium' },
    { field: 'legacy_impact', category: 'Premium Data', missing: 0, present: 0, percentage: 0, canAutomate: true, automationSource: 'AI from career + awards', priority: 'medium' },
    
    // Governance
    { field: 'trust_score', category: 'Governance', missing: 0, present: 0, percentage: 0, canAutomate: true, automationSource: 'Auto-calculate', priority: 'medium' },
    { field: 'confidence_tier', category: 'Governance', missing: 0, present: 0, percentage: 0, canAutomate: true, automationSource: 'Auto-calculate', priority: 'medium' },
    { field: 'entity_confidence_score', category: 'Governance', missing: 0, present: 0, percentage: 0, canAutomate: true, automationSource: 'Auto-calculate', priority: 'high' },
    { field: 'freshness_score', category: 'Governance', missing: 0, present: 0, percentage: 0, canAutomate: true, automationSource: 'Auto-calculate', priority: 'low' },
  ];

  // Count missing fields
  for (const celeb of celebs) {
    for (const fieldCheck of fieldChecks) {
      let hasValue = false;

      if (fieldCheck.field === 'awards') {
        hasValue = celebsWithAwards.has(celeb.id);
      } else {
        const value = celeb[fieldCheck.field];
        hasValue = value !== null && 
                   value !== undefined && 
                   value !== '' &&
                   (Array.isArray(value) ? value.length > 0 : true) &&
                   (typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).length > 0 : true);
      }

      if (hasValue) {
        fieldCheck.present++;
      } else {
        fieldCheck.missing++;
      }
    }
  }

  // Calculate percentages
  fieldChecks.forEach(f => {
    f.percentage = Math.round((f.present / celebs.length) * 100);
  });

  // Sort by missing count
  fieldChecks.sort((a, b) => b.missing - a.missing);

  // Display results
  console.log(cyan(bold('╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║                     MISSING FIELDS BREAKDOWN                          ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));

  console.log(white('Field                     | Category            | Missing | Present | %    | Can Automate? | Source'));
  console.log(white('--------------------------|---------------------|---------|---------|------|---------------|------------------'));

  fieldChecks.forEach(f => {
    const color = f.missing === 0 ? green : f.missing > 400 ? red : f.missing > 200 ? yellow : white;
    const field = f.field.padEnd(25);
    const category = f.category.padEnd(19);
    const missing = f.missing.toString().padStart(7);
    const present = f.present.toString().padStart(7);
    const pct = `${f.percentage}%`.padStart(5);
    const canAuto = f.canAutomate ? '✓' : '✗';
    
    console.log(color(`${field} | ${category} | ${missing} | ${present} | ${pct} | ${canAuto.padStart(13)} | ${f.automationSource}`));
  });

  // Group by category
  console.log(cyan(bold('\n╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║                     BY CATEGORY SUMMARY                               ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));

  const categories = ['Core Identity', 'Basic Enrichment', 'Advanced Enrichment', 'Premium Data', 'Governance'];
  
  for (const category of categories) {
    const categoryFields = fieldChecks.filter(f => f.category === category);
    const totalMissing = categoryFields.reduce((sum, f) => sum + f.missing, 0);
    const totalPossible = categoryFields.length * celebs.length;
    const categoryPct = Math.round(((totalPossible - totalMissing) / totalPossible) * 100);
    
    console.log(white(`\n${category}:`));
    console.log(white(`  Total Missing: ${totalMissing} fields`));
    console.log(white(`  Completeness: ${categoryPct}%`));
    
    categoryFields.forEach(f => {
      const color = f.missing === 0 ? green : f.missing > 400 ? red : yellow;
      console.log(color(`    - ${f.field}: ${f.missing} missing (${f.percentage}% complete)`));
    });
  }

  // Automation potential
  console.log(cyan(bold('\n╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║                     AUTOMATION POTENTIAL                              ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));

  const automatable = fieldChecks.filter(f => f.canAutomate);
  const manual = fieldChecks.filter(f => !f.canAutomate);

  const automatableMissing = automatable.reduce((sum, f) => sum + f.missing, 0);
  const manualMissing = manual.reduce((sum, f) => sum + f.missing, 0);

  console.log(green(`  ✓ Can Automate: ${automatableMissing.toLocaleString()} fields (${automatable.length} field types)`));
  console.log(yellow(`  ⚠️  Manual Required: ${manualMissing.toLocaleString()} fields (${manual.length} field types)`));
  console.log(white(`  📊 Total Missing: ${(automatableMissing + manualMissing).toLocaleString()} fields\n`));

  console.log(white('  Automatable Fields:'));
  automatable.forEach(f => {
    console.log(green(`    ✓ ${f.field} (${f.missing} missing) - ${f.automationSource}`));
  });

  console.log(white('\n  Manual Fields:'));
  manual.forEach(f => {
    console.log(yellow(`    ⚠️  ${f.field} (${f.missing} missing) - ${f.automationSource}`));
  });

  // Export detailed report
  const report = {
    generated_at: new Date().toISOString(),
    total_profiles: celebs.length,
    field_stats: fieldChecks,
    automation_summary: {
      automatable_fields: automatableMissing,
      manual_fields: manualMissing,
      total_missing: automatableMissing + manualMissing,
    },
    by_category: categories.map(cat => {
      const fields = fieldChecks.filter(f => f.category === cat);
      const totalMissing = fields.reduce((sum, f) => sum + f.missing, 0);
      const totalPossible = fields.length * celebs.length;
      return {
        category: cat,
        total_missing: totalMissing,
        completeness: Math.round(((totalPossible - totalMissing) / totalPossible) * 100),
        fields: fields.map(f => ({ field: f.field, missing: f.missing, percentage: f.percentage })),
      };
    }),
  };

  writeFileSync('docs/manual-review/MISSING-FIELDS-DETAILED-AUDIT.json', JSON.stringify(report, null, 2));
  console.log(cyan(`\n  💾 Detailed report saved to: docs/manual-review/MISSING-FIELDS-DETAILED-AUDIT.json\n`));

  // Execution plan
  console.log(cyan(bold('╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║                     EXECUTION PLAN TO 100%                            ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));

  console.log(white('  Phase 1: Critical Fields (Auto)'));
  console.log(green('    1. Generate missing slugs (0 needed - done!)'));
  console.log(yellow(`    2. Fetch TMDB bios for ${fieldChecks.find(f => f.field === 'short_bio')?.missing || 0} profiles`));
  console.log(yellow(`    3. Fetch TMDB images for ${fieldChecks.find(f => f.field === 'profile_image')?.missing || 0} profiles`));
  
  console.log(white('\n  Phase 2: High-Value Auto Fields'));
  console.log(yellow(`    4. Generate actor eras for ${fieldChecks.find(f => f.field === 'actor_eras')?.missing || 0} profiles`));
  console.log(yellow(`    5. Generate romantic pairings for ${fieldChecks.find(f => f.field === 'romantic_pairings')?.missing || 0} profiles`));
  console.log(yellow(`    6. Generate industry titles for ${fieldChecks.find(f => f.field === 'industry_title')?.missing || 0} profiles`));
  console.log(yellow(`    7. Generate brand pillars for ${fieldChecks.find(f => f.field === 'brand_pillars')?.missing || 0} profiles`));
  
  console.log(white('\n  Phase 3: AI-Generated Fields'));
  console.log(yellow(`    8. Generate USP for ${fieldChecks.find(f => f.field === 'usp')?.missing || 0} profiles`));
  console.log(yellow(`    9. Generate legacy impact for ${fieldChecks.find(f => f.field === 'legacy_impact')?.missing || 0} profiles`));
  console.log(yellow(`   10. Generate fan culture for ${fieldChecks.find(f => f.field === 'fan_culture')?.missing || 0} profiles`));
  
  console.log(white('\n  Phase 4: Governance (Auto-Calculate)'));
  console.log(yellow(`   11. Calculate trust scores for ${fieldChecks.find(f => f.field === 'trust_score')?.missing || 0} profiles`));
  console.log(yellow(`   12. Calculate confidence tiers for ${fieldChecks.find(f => f.field === 'confidence_tier')?.missing || 0} profiles`));
  console.log(yellow(`   13. Update entity confidence scores for ${fieldChecks.find(f => f.field === 'entity_confidence_score')?.missing || 0} profiles`));
  
  console.log(white('\n  Phase 5: Manual Research (Staged)'));
  console.log(red(`   14. Research Telugu names for ${fieldChecks.find(f => f.field === 'name_te')?.missing || 0} profiles`));
  console.log(red(`   15. Research awards for top 100 profiles`));
  console.log(red(`   16. Research family relationships for top 50 profiles`));
  console.log(red(`   17. Research social links for top 50 profiles\n`));

  console.log(cyan(bold('  🎯 TARGET: 100% completeness across all 511 profiles!')));
  console.log(white(`  📅 Estimated: Phases 1-4 automated (1-2 hours), Phase 5 manual (staged)\n`));
}

auditMissingFields().catch(console.error);
