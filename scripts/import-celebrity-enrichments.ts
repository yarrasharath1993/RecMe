/**
 * IMPORT CELEBRITY ENRICHMENTS TO DATABASE
 * 
 * Reads celebrity-wiki-enrichments.json and imports to 
 * celebrity_wiki_enrichments staging table for review.
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

interface WikiCelebrityEnrichment {
  celebrityId: string;
  celebrityName: string;
  sourceUrl: string;
  fullBio?: string;
  fullBioTe?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  occupation?: string[];
  yearsActive?: string;
  height?: string;
  education?: string;
  nicknames?: string[];
  spouse?: string;
  childrenCount?: number;
  familyRelationships?: any;
  knownFor?: string[];
  industryTitle?: string;
  signatureStyle?: string;
  brandPillars?: string[];
  actorEras?: any[];
  awards?: any[];
  awardsCount?: number;
  socialLinks?: any;
  confidenceScore: number;
  extractedAt: string;
}

async function importEnrichments() {
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  IMPORT CELEBRITY ENRICHMENTS TO DATABASE'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  // Read JSON file
  const jsonPath = path.join(process.cwd(), 'celebrity-wiki-enrichments.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error(chalk.red('❌ celebrity-wiki-enrichments.json not found!'));
    console.error(chalk.yellow('   Run enrich-celebrity-metadata-from-wiki.ts first.'));
    process.exit(1);
  }
  
  const enrichments: WikiCelebrityEnrichment[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  
  console.log(chalk.yellow(`📁 Found ${enrichments.length} enrichments to import\n`));
  
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const enrichment of enrichments) {
    try {
      // Check if already exists
      const { data: existing, error: checkError } = await supabase
        .from('celebrity_wiki_enrichments')
        .select('id, status')
        .eq('celebrity_id', enrichment.celebrityId)
        .single();
      
      if (existing) {
        console.log(chalk.gray(`  ○ Skipped: ${enrichment.celebrityName} (already exists, status: ${existing.status})`));
        skipped++;
        continue;
      }
      
      // Insert enrichment
      const { error } = await supabase
        .from('celebrity_wiki_enrichments')
        .insert({
          celebrity_id: enrichment.celebrityId,
          source_url: enrichment.sourceUrl,
          full_bio: enrichment.fullBio,
          full_bio_te: enrichment.fullBioTe,
          date_of_birth: enrichment.dateOfBirth,
          place_of_birth: enrichment.placeOfBirth,
          occupation: enrichment.occupation,
          years_active: enrichment.yearsActive,
          height: enrichment.height,
          education: enrichment.education,
          nicknames: enrichment.nicknames,
          family_relationships: enrichment.familyRelationships,
          known_for: enrichment.knownFor,
          industry_title: enrichment.industryTitle,
          signature_style: enrichment.signatureStyle,
          brand_pillars: enrichment.brandPillars,
          actor_eras: enrichment.actorEras,
          awards: enrichment.awards,
          awards_count: enrichment.awardsCount,
          social_links: enrichment.socialLinks,
          confidence_score: enrichment.confidenceScore,
          status: 'pending',
        });
      
      if (error) {
        console.error(chalk.red(`  ✗ Failed: ${enrichment.celebrityName} - ${error.message}`));
        failed++;
      } else {
        const confidencePercent = (enrichment.confidenceScore * 100).toFixed(0);
        console.log(chalk.green(`  ✓ Imported: ${enrichment.celebrityName} (${confidencePercent}% confidence)`));
        imported++;
      }
      
      // Progress update every 20 records
      if ((imported + skipped + failed) % 20 === 0) {
        console.log(chalk.blue(`\n📊 Progress: ${imported + skipped + failed}/${enrichments.length} processed (${imported} imported, ${skipped} skipped, ${failed} failed)\n`));
      }
      
    } catch (error: any) {
      console.error(chalk.red(`  ✗ Error: ${enrichment.celebrityName} - ${error.message}`));
      failed++;
    }
  }
  
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.green.bold('  ✓ IMPORT COMPLETE'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.yellow('Summary:'));
  console.log(chalk.white(`  • Total enrichments: ${enrichments.length}`));
  console.log(chalk.white(`  • Imported: ${imported}`));
  console.log(chalk.white(`  • Skipped (already exist): ${skipped}`));
  console.log(chalk.white(`  • Failed: ${failed}`));
  console.log(chalk.white(`  • Success rate: ${((imported / enrichments.length) * 100).toFixed(1)}%`));
  
  // Show stats
  console.log(chalk.yellow('\n📊 Next steps:'));
  console.log(chalk.white('  1. Review enrichments in Supabase:'));
  console.log(chalk.gray('     SELECT * FROM celebrity_enrichments_high_confidence;'));
  console.log(chalk.white('\n  2. Get statistics:'));
  console.log(chalk.gray('     SELECT * FROM get_enrichment_stats();'));
  console.log(chalk.white('\n  3. Approve high-confidence enrichments:'));
  console.log(chalk.gray(`     UPDATE celebrity_wiki_enrichments SET status = 'approved' WHERE confidence_score >= 0.7;`));
  console.log();
}

importEnrichments().catch(console.error);
