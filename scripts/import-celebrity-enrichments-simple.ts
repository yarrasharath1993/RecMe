import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const enrichments = JSON.parse(fs.readFileSync('celebrity-wiki-enrichments.json', 'utf-8'));

async function importAll() {
  console.log(`\nImporting ${enrichments.length} enrichments...\n`);
  
  for (let i = 0; i < enrichments.length; i++) {
    const e = enrichments[i];
    const { error } = await supabase
      .from('celebrity_wiki_enrichments')
      .upsert({
        celebrity_id: e.celebrityId,
        source_url: e.sourceUrl,
        full_bio: e.fullBio,
        full_bio_te: e.fullBioTe,
        date_of_birth: e.dateOfBirth,
        place_of_birth: e.placeOfBirth,
        occupation: e.occupation,
        years_active: e.yearsActive,
        height: e.height,
        education: e.education,
        nicknames: e.nicknames,
        family_relationships: e.familyRelationships,
        known_for: e.knownFor,
        industry_title: e.industryTitle,
        signature_style: e.signatureStyle,
        brand_pillars: e.brandPillars,
        actor_eras: e.actorEras,
        awards: e.awards,
        awards_count: e.awardsCount || 0,
        social_links: e.socialLinks,
        confidence_score: e.confidenceScore,
        status: 'pending'
      }, { onConflict: 'celebrity_id' });
    
    if (error) console.error(`✗ ${e.celebrityName}: ${error.message}`);
    else console.log(`✓ ${i+1}/${enrichments.length} ${e.celebrityName}`);
  }
  
  console.log('\n✓ Import complete!');
}

importAll();
