/**
 * APPLY APPROVED CELEBRITY ENRICHMENTS
 * 
 * Applies approved enrichments from celebrity_wiki_enrichments staging table
 * to the production celebrities table.
 */

import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Enrichment {
  id: string;
  celebrity_id: string;
  full_bio?: string;
  full_bio_te?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  occupation?: string[];
  years_active?: string;
  height?: string;
  education?: string;
  nicknames?: string[];
  family_relationships?: any;
  known_for?: string[];
  industry_title?: string;
  signature_style?: string;
  brand_pillars?: string[];
  actor_eras?: any[];
  awards?: any[];
  awards_count?: number;
  social_links?: any;
  confidence_score: number;
  celebrity_name?: string;
}

async function applyEnrichments() {
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  APPLY APPROVED CELEBRITY ENRICHMENTS'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  // Get all approved enrichments
  const { data: enrichments, error: fetchError } = await supabase
    .from('celebrity_wiki_enrichments')
    .select(`
      id,
      celebrity_id,
      full_bio,
      full_bio_te,
      date_of_birth,
      place_of_birth,
      occupation,
      years_active,
      height,
      education,
      nicknames,
      family_relationships,
      known_for,
      industry_title,
      signature_style,
      brand_pillars,
      actor_eras,
      awards,
      awards_count,
      social_links,
      confidence_score
    `)
    .eq('status', 'approved')
    .order('confidence_score', { ascending: false });
  
  if (fetchError) {
    console.error(chalk.red('❌ Error fetching enrichments:'), fetchError.message);
    process.exit(1);
  }
  
  if (!enrichments || enrichments.length === 0) {
    console.log(chalk.yellow('⚠️  No approved enrichments found!'));
    console.log(chalk.gray('\nTo approve enrichments, run in Supabase:'));
    console.log(chalk.gray('  UPDATE celebrity_wiki_enrichments SET status = \'approved\' WHERE confidence_score >= 0.7;'));
    process.exit(0);
  }
  
  console.log(chalk.yellow(`📋 Found ${enrichments.length} approved enrichments to apply\n`));
  
  // Get celebrity names for better logging
  const celebrityIds = enrichments.map(e => e.celebrity_id);
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('id, name_en')
    .in('id', celebrityIds);
  
  const celebrityMap = new Map(celebrities?.map(c => [c.id, c.name_en]) || []);
  
  let applied = 0;
  let failed = 0;
  
  for (const enrichment of enrichments as Enrichment[]) {
    const celebrityName = celebrityMap.get(enrichment.celebrity_id) || enrichment.celebrity_id;
    
    try {
      // Parse date of birth if present
      let parsedDob = null;
      if (enrichment.date_of_birth) {
        // Try to parse various date formats
        const dobText = enrichment.date_of_birth;
        // Extract year at minimum
        const yearMatch = dobText.match(/\d{4}/);
        if (yearMatch) {
          parsedDob = dobText; // Store as text for now, can refine parsing later
        }
      }
      
      // Build update object (only update fields that have data)
      const updateData: any = {};
      
      if (enrichment.full_bio) updateData.full_bio = enrichment.full_bio;
      if (enrichment.full_bio_te) updateData.full_bio_te = enrichment.full_bio_te;
      if (parsedDob) updateData.date_of_birth = parsedDob;
      if (enrichment.place_of_birth) updateData.place_of_birth = enrichment.place_of_birth;
      if (enrichment.education) updateData.education = enrichment.education;
      if (enrichment.nicknames) updateData.nicknames = enrichment.nicknames;
      if (enrichment.height) updateData.height = enrichment.height;
      if (enrichment.family_relationships) updateData.family_relationships = enrichment.family_relationships;
      if (enrichment.known_for) updateData.known_for = enrichment.known_for;
      if (enrichment.industry_title) updateData.industry_title = enrichment.industry_title;
      if (enrichment.signature_style) updateData.signature_style = enrichment.signature_style;
      if (enrichment.brand_pillars) updateData.brand_pillars = enrichment.brand_pillars;
      if (enrichment.actor_eras) updateData.actor_eras = enrichment.actor_eras;
      // Note: awards_count not in schema, will be added in future migration
      // if (enrichment.awards_count !== undefined) updateData.awards_count = enrichment.awards_count;
      
      // Handle social links - merge with existing data
      if (enrichment.social_links) {
        const links = enrichment.social_links;
        if (links.twitter) updateData.twitter_url = links.twitter;
        if (links.instagram) updateData.instagram_url = links.instagram;
        if (links.facebook) updateData.facebook_url = links.facebook;
        if (links.website) updateData.website_url = links.website;
      }
      
      // Update celebrity record
      const { error: updateError } = await supabase
        .from('celebrities')
        .update(updateData)
        .eq('id', enrichment.celebrity_id);
      
      if (updateError) {
        console.error(chalk.red(`  ✗ Failed: ${celebrityName} - ${updateError.message}`));
        failed++;
        continue;
      }
      
      // Mark enrichment as applied
      const { error: markError } = await supabase
        .from('celebrity_wiki_enrichments')
        .update({
          status: 'applied',
          applied_at: new Date().toISOString()
        })
        .eq('id', enrichment.id);
      
      if (markError) {
        console.warn(chalk.yellow(`  ⚠️  Applied but failed to mark: ${celebrityName}`));
      }
      
      const fieldsApplied = Object.keys(updateData).length;
      const confidencePercent = (enrichment.confidence_score * 100).toFixed(0);
      console.log(chalk.green(`  ✓ Applied: ${celebrityName} (${fieldsApplied} fields, ${confidencePercent}% confidence)`));
      applied++;
      
      // Progress update every 20 records
      if (applied % 20 === 0) {
        console.log(chalk.blue(`\n📊 Progress: ${applied + failed}/${enrichments.length} processed (${applied} applied, ${failed} failed)\n`));
      }
      
    } catch (error: any) {
      console.error(chalk.red(`  ✗ Error: ${celebrityName} - ${error.message}`));
      failed++;
    }
  }
  
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.green.bold('  ✓ APPLICATION COMPLETE'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.yellow('Summary:'));
  console.log(chalk.white(`  • Total approved enrichments: ${enrichments.length}`));
  console.log(chalk.white(`  • Successfully applied: ${applied}`));
  console.log(chalk.white(`  • Failed: ${failed}`));
  console.log(chalk.white(`  • Success rate: ${((applied / enrichments.length) * 100).toFixed(1)}%`));
  
  // Show verification queries
  console.log(chalk.yellow('\n📊 Verify in Supabase:'));
  console.log(chalk.gray('  -- Check applied enrichments'));
  console.log(chalk.gray('  SELECT COUNT(*) FROM celebrity_wiki_enrichments WHERE status = \'applied\';'));
  console.log(chalk.gray('\n  -- View recently updated celebrities'));
  console.log(chalk.gray('  SELECT name_en, full_bio IS NOT NULL as has_bio, date_of_birth, place_of_birth'));
  console.log(chalk.gray('  FROM celebrities'));
  console.log(chalk.gray('  WHERE updated_at > NOW() - INTERVAL \'1 hour\''));
  console.log(chalk.gray('  ORDER BY updated_at DESC LIMIT 20;'));
  console.log();
}

applyEnrichments().catch(console.error);
