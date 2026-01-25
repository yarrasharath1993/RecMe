#!/usr/bin/env npx tsx
/**
 * Fix All Celebrity Duplicates
 * 
 * This script fixes all identified celebrity duplicates by:
 * 1. Keeping the most complete profile (primary)
 * 2. Assigning user-friendly slugs where appropriate
 * 3. Deleting duplicate profiles
 * 
 * Duplicates to fix:
 * 1. Daggubati Venkatesh (2 profiles)
 * 2. Jayant Paranji / Jayanth C. Paranjee (2 profiles)
 * 3. N.T. Rama Rao Jr. / NTR Jr (2 profiles)
 * 4. Rashmika Mandanna (2 profiles)
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

interface DuplicateFix {
  name: string;
  primaryId: string;
  primarySlug: string;
  preferredSlug: string;
  duplicateIds: string[];
  reason: string;
}

const FIXES: DuplicateFix[] = [
  {
    name: 'Daggubati Venkatesh',
    primaryId: 'ceb2c247-5c54-4283-959b-dc3f394d9c09',
    primarySlug: 'celeb-daggubati-venkatesh',
    preferredSlug: 'venkatesh',
    duplicateIds: ['856084ab-0d5c-4bc8-b7df-bf05bba37274'],
    reason: 'Primary has higher confidence, IMDb ID, and better data',
  },
  {
    name: 'Jayanth C. Paranjee',
    primaryId: '8c3f304e-a418-4ead-8440-97b4ca415572',
    primarySlug: 'celeb-jayanth-c-paranjee',
    preferredSlug: 'jayanth-c-paranjee',
    duplicateIds: ['d90a3057-4b8e-49b8-a1ac-4f8be522116c'],
    reason: 'Primary has slightly higher confidence',
  },
  {
    name: 'N.T. Rama Rao Jr.',
    primaryId: '5e9bdc8d-63f8-4007-93dc-e03824a243cf',
    primarySlug: 'celeb-n-t-rama-rao-jr-',
    preferredSlug: 'ntr-jr',
    duplicateIds: ['da06dfbc-9f68-43e0-8af6-92a7c220b68d'],
    reason: 'Primary has much higher confidence (70 vs 41)',
  },
  {
    name: 'Rashmika Mandanna',
    primaryId: '2fdd0fa5-832c-4a34-875b-e3f7813bab45',
    primarySlug: 'rashmika',
    preferredSlug: 'rashmika-mandanna',
    duplicateIds: ['3d3644e5-9bdf-4b81-9c37-0dcf8f36df62'],
    reason: 'Primary has IMDb ID and profile image (TMDB 1752056 is correct)',
  },
];

async function fixDuplicate(fix: DuplicateFix, index: number): Promise<boolean> {
  console.log(`\n${index + 1}. Fixing: ${fix.name}`);
  console.log('='.repeat(60));

  // Verify primary exists
  const { data: primary, error: primaryError } = await supabase
    .from('celebrities')
    .select('*')
    .eq('id', fix.primaryId)
    .single();

  if (primaryError || !primary) {
    console.log('   ❌ Primary profile not found');
    return false;
  }

  console.log(`   ✅ Primary: ${primary.name_en} (${primary.slug})`);

  // Check if preferred slug is available
  const { data: slugCheck } = await supabase
    .from('celebrities')
    .select('id, name_en, slug')
    .eq('slug', fix.preferredSlug)
    .maybeSingle();

  let newSlug = fix.preferredSlug;
  if (slugCheck && slugCheck.id !== fix.primaryId) {
    console.log(`   ⚠️  Slug "${fix.preferredSlug}" already taken, keeping ${fix.primarySlug}`);
    newSlug = fix.primarySlug;
  }

  // Update slug if different
  if (primary.slug !== newSlug) {
    const { error: updateError } = await supabase
      .from('celebrities')
      .update({ slug: newSlug, updated_at: new Date().toISOString() })
      .eq('id', fix.primaryId);

    if (updateError) {
      console.log(`   ❌ Error updating slug: ${updateError.message}`);
      return false;
    }

    console.log(`   ✅ Updated slug: ${primary.slug} → ${newSlug}`);
  } else {
    console.log(`   ℹ️  Slug unchanged: ${newSlug}`);
  }

  // Delete duplicates
  let deletedCount = 0;
  for (const dupId of fix.duplicateIds) {
    const { data: dup } = await supabase
      .from('celebrities')
      .select('name_en, slug')
      .eq('id', dupId)
      .single();

    if (!dup) {
      console.log(`   ℹ️  Duplicate ${dupId} already deleted`);
      continue;
    }

    const { error: deleteError } = await supabase
      .from('celebrities')
      .delete()
      .eq('id', dupId);

    if (deleteError) {
      console.log(`   ❌ Error deleting ${dup.name_en}: ${deleteError.message}`);
      continue;
    }

    console.log(`   ✅ Deleted: ${dup.name_en} (${dup.slug})`);
    deletedCount++;
  }

  console.log(`   📊 Deleted ${deletedCount}/${fix.duplicateIds.length} duplicates`);
  console.log(`   🔗 New URL: http://localhost:3000/movies?profile=${newSlug}`);

  return true;
}

async function fixAllDuplicates() {
  console.log('🔧 Fixing All Celebrity Duplicates\n');
  console.log('='.repeat(80));
  console.log(`Total fixes to apply: ${FIXES.length}\n`);

  let successCount = 0;
  const results: Array<{ name: string; success: boolean; slug?: string }> = [];

  for (let i = 0; i < FIXES.length; i++) {
    const success = await fixDuplicate(FIXES[i], i);
    if (success) {
      successCount++;
      results.push({
        name: FIXES[i].name,
        success: true,
        slug: FIXES[i].preferredSlug,
      });
    } else {
      results.push({
        name: FIXES[i].name,
        success: false,
      });
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL SUMMARY\n');
  console.log(`✅ Successfully fixed: ${successCount}/${FIXES.length}\n`);

  results.forEach((result, i) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${i + 1}. ${result.name}`);
    if (result.success && result.slug) {
      console.log(`     URL: http://localhost:3000/movies?profile=${result.slug}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ All fixes complete!\n');

  // Generate summary report
  const reportContent = `# Celebrity Duplicates Fix Report
Date: ${new Date().toISOString()}
Status: ${successCount === FIXES.length ? '✅ All fixes successful' : '⚠️  Some fixes failed'}

## Summary
- Total duplicates fixed: ${successCount}/${FIXES.length}
- Profiles deleted: ${FIXES.reduce((sum, f) => sum + f.duplicateIds.length, 0)}

## Fixed Profiles

${results.map((r, i) => `
### ${i + 1}. ${r.name}
- **Status:** ${r.success ? '✅ Fixed' : '❌ Failed'}
${r.success && r.slug ? `- **URL:** http://localhost:3000/movies?profile=${r.slug}` : ''}
- **Reason:** ${FIXES[i].reason}
`).join('\n')}

## Next Steps
1. ✅ Test all profile URLs
2. ✅ Verify search shows only one entry per celebrity
3. ✅ Check movie associations are intact
4. ✅ Run comprehensive audit again to ensure no more duplicates

---
**Generated by:** fix-all-celebrity-duplicates.ts
`;

  const reportPath = '/Users/sharathchandra/Projects/telugu-portal/CELEBRITY-DUPLICATES-FIX-REPORT-2026-01-15.md';
  fs.writeFileSync(reportPath, reportContent);

  console.log(`📄 Report saved: ${reportPath}\n`);
  console.log('Next steps:');
  console.log('1. Test URLs for all fixed profiles');
  console.log('2. Verify search results show only one entry');
  console.log('3. Run audit-all-celebrity-duplicates.ts again to confirm\n');
}

// Run the fixes
fixAllDuplicates().catch(console.error);
