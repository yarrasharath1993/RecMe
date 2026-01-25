#!/bin/bash

# Import celebrity enrichments to Supabase
echo "Starting import..."

# Use Node.js to parse JSON and generate SQL
node << 'NODESCRIPT'
const fs = require('fs');
const enrichments = JSON.parse(fs.readFileSync('celebrity-wiki-enrichments.json', 'utf-8'));

console.log(`Found ${enrichments.length} enrichments to import`);

// Generate INSERT statements
const statements = enrichments.map(e => {
  const values = {
    celebrity_id: e.celebrityId,
    source_url: e.sourceUrl,
    full_bio: e.fullBio || null,
    full_bio_te: e.fullBioTe || null,
    date_of_birth: e.dateOfBirth || null,
    place_of_birth: e.placeOfBirth || null,
    occupation: e.occupation || null,
    years_active: e.yearsActive || null,
    height: e.height || null,
    education: e.education || null,
    nicknames: e.nicknames || null,
    family_relationships: e.familyRelationships || null,
    known_for: e.knownFor || null,
    industry_title: e.industryTitle || null,
    signature_style: e.signatureStyle || null,
    brand_pillars: e.brandPillars || null,
    actor_eras: e.actorEras || null,
    awards: e.awards || null,
    awards_count: e.awardsCount || 0,
    social_links: e.socialLinks || null,
    confidence_score: e.confidenceScore,
    status: 'pending'
  };
  
  return values;
});

// Save to SQL file
const sql = statements.map((v, i) => {
  const escape = (s) => s ? `'${s.replace(/'/g, "''")}'` : 'NULL';
  const escapeArray = (arr) => arr ? `ARRAY[${arr.map(escape).join(',')}]` : 'NULL';
  const escapeJson = (obj) => obj ? `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb` : 'NULL';
  
  return `INSERT INTO celebrity_wiki_enrichments (
    celebrity_id, source_url, full_bio, full_bio_te, date_of_birth, 
    place_of_birth, occupation, years_active, height, education, 
    nicknames, family_relationships, known_for, industry_title, 
    signature_style, brand_pillars, actor_eras, awards, awards_count,
    social_links, confidence_score, status
  ) VALUES (
    ${escape(v.celebrity_id)}, ${escape(v.source_url)}, ${escape(v.full_bio)}, 
    ${escape(v.full_bio_te)}, ${escape(v.date_of_birth)}, ${escape(v.place_of_birth)},
    ${escapeArray(v.occupation)}, ${escape(v.years_active)}, ${escape(v.height)},
    ${escape(v.education)}, ${escapeArray(v.nicknames)}, ${escapeJson(v.family_relationships)},
    ${escapeArray(v.known_for)}, ${escape(v.industry_title)}, ${escape(v.signature_style)},
    ${escapeArray(v.brand_pillars)}, ${escapeJson(v.actor_eras)}, ${escapeJson(v.awards)},
    ${v.awards_count}, ${escapeJson(v.social_links)}, ${v.confidence_score}, 'pending'
  ) ON CONFLICT (celebrity_id) DO NOTHING;`;
}).join('\n\n');

fs.writeFileSync('import-enrichments.sql', sql);
console.log('Generated import-enrichments.sql');
console.log('\nNow run in Supabase SQL Editor or via psql');
NODESCRIPT

echo "Done! SQL file created: import-enrichments.sql"
