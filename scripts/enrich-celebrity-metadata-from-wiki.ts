/**
 * CELEBRITY METADATA ENRICHMENT FROM WIKIPEDIA
 * 
 * Fetches Wikipedia pages for all celebrities and enriches with:
 * - Full biography (English + Telugu)
 * - Personal details (DOB, birthplace, height, education)
 * - Family relationships (spouse, children, dynasty)
 * - Career information (eras, known for, awards)
 * - Industry identity (title, brand pillars, USP)
 * - Social links
 * 
 * Outputs to staging table for manual review before applying.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import 'dotenv/config';

// ============================================================
// TYPES
// ============================================================

interface WikiCelebrityMetadata {
  celebrityId: string;
  celebrityName: string;
  wikipediaUrl: string;
  
  // Biography
  fullBio?: string;
  fullBioTe?: string;
  
  // Personal details
  dateOfBirth?: string;
  placeOfBirth?: string;
  occupation?: string[];
  yearsActive?: string;
  height?: string;
  education?: string;
  nicknames?: string[];
  
  // Family
  spouse?: string;
  childrenCount?: number;
  familyRelationships?: {
    father?: { name: string; slug?: string };
    mother?: { name: string; slug?: string };
    spouse?: { name: string; slug?: string };
    children?: Array<{ name: string; slug?: string }>;
    siblings?: Array<{ name: string; slug?: string; relation: string }>;
  };
  
  // Career
  knownFor?: string[];
  industryTitle?: string;
  signatureStyle?: string;
  brandPillars?: string[];
  actorEras?: Array<{
    name: string;
    years: string;
    themes: string[];
    keyFilms: string[];
  }>;
  
  // Awards
  awards?: Array<{
    year: number;
    award: string;
    film?: string;
    category?: string;
  }>;
  awardsCount?: number;
  
  // Social media
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  
  // Metadata
  confidenceScore: number;
  sourceUrl: string;
  extractedAt: string;
}

// ============================================================
// SUPABASE CLIENT
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('Missing Supabase credentials'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// WIKIPEDIA API
// ============================================================

const WIKIPEDIA_API = {
  TELUGU: 'https://te.wikipedia.org/w/api.php',
  ENGLISH: 'https://en.wikipedia.org/w/api.php',
};

const USER_AGENT = 'TeluguPortalBot/1.0 (https://teluguportal.com) Node.js';

let requestCount = 0;
let lastRequestTime = 0;

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  requestCount++;
}

// ============================================================
// WIKIPEDIA FETCHING
// ============================================================

async function fetchWikipediaPage(wikipediaUrl: string): Promise<{ content: string; wikidataId: string | null; language: 'te' | 'en' } | null> {
  await rateLimit();
  
  // Determine language and extract page title from URL
  let language: 'te' | 'en' = 'en';
  let pageTitle = '';
  
  if (wikipediaUrl.includes('te.wikipedia.org')) {
    language = 'te';
    pageTitle = wikipediaUrl.split('/wiki/')[1] || '';
  } else {
    pageTitle = wikipediaUrl.split('/wiki/')[1] || '';
  }
  
  if (!pageTitle) {
    console.error(chalk.red(`Invalid Wikipedia URL: ${wikipediaUrl}`));
    return null;
  }
  
  pageTitle = decodeURIComponent(pageTitle);
  
  const api = language === 'te' ? WIKIPEDIA_API.TELUGU : WIKIPEDIA_API.ENGLISH;
  
  try {
    const pageUrl = `${api}?action=query&titles=${encodeURIComponent(pageTitle)}&prop=revisions|pageprops|extlinks&rvprop=content&format=json&origin=*`;
    const response = await fetch(pageUrl, {
      headers: { 'User-Agent': USER_AGENT }
    });
    
    const data = await response.json();
    
    if (!data.query?.pages) {
      return null;
    }
    
    const pages = Object.values(data.query.pages) as any[];
    if (pages.length === 0 || pages[0].missing) {
      return null;
    }
    
    const page = pages[0];
    const content = page.revisions?.[0]?.['*'] || '';
    const wikidataId = page.pageprops?.wikibase_item || null;
    const extlinks = page.extlinks || [];
    
    return { content, wikidataId, language };
  } catch (error) {
    console.error(chalk.red(`Fetch error for ${pageTitle}: ${error}`));
    return null;
  }
}

// ============================================================
// PARSING FUNCTIONS
// ============================================================

function extractInfoboxField(content: string, fieldNames: string[]): string | null {
  for (const field of fieldNames) {
    // Pattern: |field = value
    const pattern = new RegExp(`\\|\\s*${field}\\s*=\\s*([^\\|\\}]+)`, 'i');
    const match = content.match(pattern);
    
    if (match && match[1]) {
      let value = match[1].trim();
      
      // Clean up wikitext
      value = value
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')  // [[link|text]] -> text
        .replace(/\[\[([^\]]+)\]\]/g, '$1')              // [[link]] -> link
        .replace(/<ref[^>]*>.*?<\/ref>/g, '')           // Remove refs
        .replace(/{{[^}]+}}/g, '')                       // Remove templates
        .replace(/'''?([^']+)'''?/g, '$1')              // Remove bold/italic
        .replace(/<br\s*\/?>/g, ', ')                   // <br> to comma
        .trim();
      
      if (value && value.length > 0 && value !== '?') {
        return value;
      }
    }
  }
  
  return null;
}

function extractDateOfBirth(content: string): string | null {
  return extractInfoboxField(content, ['పుట్టిన తేదీ', 'born', 'birth_date', 'birthdate']);
}

function extractPlaceOfBirth(content: string): string | null {
  return extractInfoboxField(content, ['పుట్టిన స్థలం', 'birthplace', 'birth_place', 'residence']);
}

function extractOccupation(content: string): string[] {
  const occupation = extractInfoboxField(content, ['వృత్తి', 'occupation', 'profession']);
  
  if (!occupation) return [];
  
  // Split by common separators
  return occupation
    .split(/[,\n•·]/)
    .map(o => o.trim())
    .filter(o => o.length > 0 && o.length < 50);
}

function extractYearsActive(content: string): string | null {
  return extractInfoboxField(content, ['years_active', 'yearsactive', 'active']);
}

function extractHeight(content: string): string | null {
  return extractInfoboxField(content, ['ఎత్తు', 'height']);
}

function extractEducation(content: string): string | null {
  return extractInfoboxField(content, ['విద్య', 'education', 'alma_mater', 'almamater']);
}

function extractSpouse(content: string): string | null {
  return extractInfoboxField(content, ['జీవిత భాగస్వామి', 'spouse', 'partner']);
}

function extractChildren(content: string): number | null {
  const childrenStr = extractInfoboxField(content, ['children', 'child']);
  
  if (!childrenStr) return null;
  
  // Try to parse number
  const match = childrenStr.match(/(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  
  // Count names separated by commas
  const names = childrenStr.split(',').filter(n => n.trim().length > 0);
  return names.length > 0 ? names.length : null;
}

function extractNicknames(content: string): string[] {
  const nicknames = extractInfoboxField(content, ['nicknames', 'nickname', 'other_names']);
  
  if (!nicknames) return [];
  
  return nicknames
    .split(/[,\n•·]/)
    .map(n => n.trim())
    .filter(n => n.length > 0 && n.length < 50)
    .slice(0, 5);
}

function extractBiography(content: string, language: 'te' | 'en'): string | null {
  // Extract first 3-4 paragraphs after infobox
  const paragraphs: string[] = [];
  const lines = content.split('\n');
  let infoboxEnded = false;
  let paragraphCount = 0;
  let currentParagraph = '';
  
  for (const line of lines) {
    // Skip until infobox ends
    if (line.includes('}}') && !infoboxEnded) {
      infoboxEnded = true;
      continue;
    }
    
    if (!infoboxEnded) continue;
    
    // Stop at first section header
    if (line.startsWith('==')) break;
    
    // Skip empty lines, templates, and special markup
    if (!line.trim() || line.startsWith('|') || line.startsWith('{') || line.startsWith('<')) {
      if (currentParagraph.trim().length > 100) {
        paragraphs.push(currentParagraph.trim());
        paragraphCount++;
        currentParagraph = '';
        
        if (paragraphCount >= 3) break;
      }
      continue;
    }
    
    currentParagraph += ' ' + line;
  }
  
  // Add last paragraph
  if (currentParagraph.trim().length > 100 && paragraphCount < 3) {
    paragraphs.push(currentParagraph.trim());
  }
  
  if (paragraphs.length === 0) return null;
  
  let bio = paragraphs.join('\n\n');
  
  // Clean up wikitext
  bio = bio
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')  // [[link|text]] -> text
    .replace(/\[\[([^\]]+)\]\]/g, '$1')              // [[link]] -> link
    .replace(/<ref[^>]*>.*?<\/ref>/g, '')           // Remove refs
    .replace(/{{[^}]+}}/g, '')                       // Remove templates
    .replace(/'''([^']+)'''/g, '$1')                // Remove bold
    .replace(/''([^']+)''/g, '$1')                  // Remove italic
    .replace(/\s+/g, ' ')                            // Normalize whitespace
    .trim();
  
  return bio.length > 50 ? bio : null;
}

function extractKnownFor(content: string): string[] {
  const knownFor = extractInfoboxField(content, ['known_for', 'notable_work', 'notable_works']);
  
  if (!knownFor) return [];
  
  return knownFor
    .split(/[,\n•·]/)
    .map(f => f.trim())
    .filter(f => f.length > 0 && f.length < 100)
    .slice(0, 10);
}

function extractIndustryTitle(content: string): string | null {
  // Look for titles like "Megastar", "Power Star", "Rebel Star"
  const titlePatterns = [
    /(?:known as|called|nicknamed)\s+(?:the\s+)?["']?([^"'\n]+?star|megastar|superstar)["']?/i,
    /industry\s+title[:\s]+["']?([^"'\n]+)["']?/i,
  ];
  
  for (const pattern of titlePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim().slice(0, 50);
    }
  }
  
  return null;
}

function extractAwards(content: string): Array<{ year: number; award: string; film?: string }> {
  const awards: Array<{ year: number; award: string; film?: string }> = [];
  
  // Look for awards section
  const awardsMatch = content.match(/==\s*Awards\s*==\s*\n([^=]+)/i);
  if (!awardsMatch) return awards;
  
  const awardsSection = awardsMatch[1];
  
  // Extract award entries (simple pattern)
  const awardPattern = /(\d{4})[^\d]+([^\n]{10,100})/g;
  let match;
  
  while ((match = awardPattern.exec(awardsSection)) !== null && awards.length < 20) {
    const year = parseInt(match[1]);
    let awardText = match[2].trim();
    
    // Clean up
    awardText = awardText
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/<ref[^>]*>.*?<\/ref>/g, '')
      .trim();
    
    if (awardText.length > 10) {
      awards.push({ year, award: awardText });
    }
  }
  
  return awards;
}

function extractSocialLinks(content: string): WikiCelebrityMetadata['socialLinks'] {
  const socialLinks: WikiCelebrityMetadata['socialLinks'] = {};
  
  // Extract from infobox or external links
  const twitterMatch = content.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i);
  if (twitterMatch) {
    socialLinks.twitter = `https://twitter.com/${twitterMatch[1]}`;
  }
  
  const instaMatch = content.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i);
  if (instaMatch) {
    socialLinks.instagram = `https://instagram.com/${instaMatch[1]}`;
  }
  
  const fbMatch = content.match(/facebook\.com\/([a-zA-Z0-9.]+)/i);
  if (fbMatch) {
    socialLinks.facebook = `https://facebook.com/${fbMatch[1]}`;
  }
  
  const websiteMatch = content.match(/\|\s*website\s*=\s*([^\|\}\n]+)/i);
  if (websiteMatch) {
    let website = websiteMatch[1].trim()
      .replace(/\[([^\]]+)\]/g, '$1')
      .trim();
    
    if (website.startsWith('http')) {
      socialLinks.website = website;
    }
  }
  
  return Object.keys(socialLinks).length > 0 ? socialLinks : undefined;
}

function extractFamilyRelationships(content: string): WikiCelebrityMetadata['familyRelationships'] {
  const family: WikiCelebrityMetadata['familyRelationships'] = {};
  
  // Extract spouse
  const spouse = extractSpouse(content);
  if (spouse) {
    family.spouse = { name: spouse };
  }
  
  // Extract father
  const father = extractInfoboxField(content, ['father', 'parents']);
  if (father) {
    family.father = { name: father };
  }
  
  // Extract mother
  const mother = extractInfoboxField(content, ['mother']);
  if (mother) {
    family.mother = { name: mother };
  }
  
  // Extract children
  const childrenStr = extractInfoboxField(content, ['children', 'child']);
  if (childrenStr) {
    const childrenNames = childrenStr
      .split(/[,\n•·]/)
      .map(c => c.trim())
      .filter(c => c.length > 0 && c.length < 50);
    
    if (childrenNames.length > 0) {
      family.children = childrenNames.map(name => ({ name }));
    }
  }
  
  // Extract relatives
  const relatives = extractInfoboxField(content, ['relatives', 'relations']);
  if (relatives) {
    const relativesList = relatives
      .split(/[,\n•·]/)
      .map(r => r.trim())
      .filter(r => r.length > 0 && r.length < 100)
      .slice(0, 5);
    
    // Parse into siblings (simple heuristic)
    const siblings = relativesList
      .filter(r => r.toLowerCase().includes('brother') || r.toLowerCase().includes('sister'))
      .map(r => ({
        name: r.replace(/\(.*?\)/g, '').trim(),
        relation: r.toLowerCase().includes('brother') ? 'brother' : 'sister'
      }));
    
    if (siblings.length > 0) {
      family.siblings = siblings;
    }
  }
  
  return Object.keys(family).length > 0 ? family : undefined;
}

// ============================================================
// CELEBRITY ENRICHMENT
// ============================================================

async function enrichCelebrity(
  celebrityId: string,
  celebrityName: string,
  wikipediaUrl: string
): Promise<WikiCelebrityMetadata | null> {
  console.log(chalk.gray(`  → Enriching: ${celebrityName}`));
  console.log(chalk.gray(`     URL: ${wikipediaUrl}`));
  
  const pageData = await fetchWikipediaPage(wikipediaUrl);
  
  if (!pageData) {
    console.log(chalk.yellow(`    ⚠️  Could not fetch page`));
    return null;
  }
  
  const { content, wikidataId, language } = pageData;
  
  // If English page, try to fetch Telugu version for Telugu bio
  let teluguContent: string | null = null;
  if (language === 'en') {
    // Try to fetch Telugu version
    const teluguUrl = wikipediaUrl.replace('en.wikipedia.org', 'te.wikipedia.org');
    const teluguData = await fetchWikipediaPage(teluguUrl);
    if (teluguData) {
      teluguContent = teluguData.content;
    }
  }
  
  // Extract all metadata
  const metadata: WikiCelebrityMetadata = {
    celebrityId,
    celebrityName,
    wikipediaUrl,
    sourceUrl: wikipediaUrl,
    
    // Biography
    fullBio: extractBiography(content, language),
    fullBioTe: teluguContent ? extractBiography(teluguContent, 'te') : undefined,
    
    // Personal details
    dateOfBirth: extractDateOfBirth(content),
    placeOfBirth: extractPlaceOfBirth(content),
    occupation: extractOccupation(content),
    yearsActive: extractYearsActive(content),
    height: extractHeight(content),
    education: extractEducation(content),
    nicknames: extractNicknames(content),
    
    // Family
    spouse: extractSpouse(content),
    childrenCount: extractChildren(content),
    familyRelationships: extractFamilyRelationships(content),
    
    // Career
    knownFor: extractKnownFor(content),
    industryTitle: extractIndustryTitle(content),
    
    // Awards
    awards: extractAwards(content),
    
    // Social
    socialLinks: extractSocialLinks(content),
    
    confidenceScore: 0.7, // Default
    extractedAt: new Date().toISOString(),
  };
  
  // Calculate awards count
  if (metadata.awards && metadata.awards.length > 0) {
    metadata.awardsCount = metadata.awards.length;
  }
  
  // Calculate confidence score
  let confidence = 0;
  if (metadata.fullBio) confidence += 0.25;
  if (metadata.dateOfBirth) confidence += 0.10;
  if (metadata.placeOfBirth) confidence += 0.05;
  if (metadata.occupation && metadata.occupation.length > 0) confidence += 0.10;
  if (metadata.familyRelationships) confidence += 0.15;
  if (metadata.knownFor && metadata.knownFor.length > 0) confidence += 0.10;
  if (metadata.awards && metadata.awards.length > 0) confidence += 0.10;
  if (metadata.socialLinks) confidence += 0.05;
  if (metadata.height) confidence += 0.05;
  if (metadata.education) confidence += 0.05;
  
  metadata.confidenceScore = Math.min(confidence, 1.0);
  
  // Log what was extracted
  const extracted = [];
  if (metadata.fullBio) extracted.push('bio');
  if (metadata.fullBioTe) extracted.push('bio_te');
  if (metadata.dateOfBirth) extracted.push('DOB');
  if (metadata.placeOfBirth) extracted.push('birthplace');
  if (metadata.occupation?.length) extracted.push(`${metadata.occupation.length} occupations`);
  if (metadata.familyRelationships) extracted.push('family');
  if (metadata.knownFor?.length) extracted.push(`known for ${metadata.knownFor.length}`);
  if (metadata.awards?.length) extracted.push(`${metadata.awards.length} awards`);
  if (metadata.socialLinks) extracted.push('social');
  if (metadata.height) extracted.push('height');
  if (metadata.education) extracted.push('education');
  
  console.log(chalk.green(`    ✓ Extracted: ${extracted.join(', ')} (confidence: ${(metadata.confidenceScore * 100).toFixed(0)}%)`));
  
  return metadata;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  CELEBRITY METADATA ENRICHMENT FROM WIKIPEDIA'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.yellow(`Fetching celebrities with Wikipedia URLs...\n`));
  
  // Fetch all celebrities with Wikipedia URLs
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('id, name_en, wikipedia_url')
    .not('wikipedia_url', 'is', null)
    .order('name_en');
  
  if (error) {
    console.error(chalk.red(`Error fetching celebrities: ${error.message}`));
    process.exit(1);
  }
  
  if (!celebrities || celebrities.length === 0) {
    console.error(chalk.red('No celebrities with Wikipedia URLs found!'));
    process.exit(1);
  }
  
  console.log(chalk.green(`✓ Found ${celebrities.length} celebrities to enrich\n`));
  
  // Enrich each celebrity
  const enrichedCelebrities: WikiCelebrityMetadata[] = [];
  let processed = 0;
  let successful = 0;
  
  for (const celebrity of celebrities) {
    processed++;
    console.log(chalk.cyan(`\n[${processed}/${celebrities.length}] ${celebrity.name_en}`));
    
    const metadata = await enrichCelebrity(
      celebrity.id,
      celebrity.name_en,
      celebrity.wikipedia_url
    );
    
    if (metadata) {
      enrichedCelebrities.push(metadata);
      successful++;
    }
    
    // Progress update every 10 celebrities
    if (processed % 10 === 0) {
      console.log(chalk.blue(`\n📊 Progress: ${processed}/${celebrities.length} processed, ${successful} enriched (${((successful/processed)*100).toFixed(1)}%)`));
    }
  }
  
  // Save to JSON file for review
  const outputPath = path.join(process.cwd(), 'celebrity-wiki-enrichments.json');
  fs.writeFileSync(outputPath, JSON.stringify(enrichedCelebrities, null, 2));
  
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.green.bold('  ✓ ENRICHMENT COMPLETE'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.yellow('Summary:'));
  console.log(chalk.white(`  • Celebrities processed: ${processed}`));
  console.log(chalk.white(`  • Successfully enriched: ${successful} (${((successful/processed)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Wikipedia requests: ${requestCount}`));
  console.log(chalk.white(`  • Output file: ${outputPath}`));
  
  // Field coverage statistics
  const stats = {
    fullBio: enrichedCelebrities.filter(c => c.fullBio).length,
    fullBioTe: enrichedCelebrities.filter(c => c.fullBioTe).length,
    dateOfBirth: enrichedCelebrities.filter(c => c.dateOfBirth).length,
    placeOfBirth: enrichedCelebrities.filter(c => c.placeOfBirth).length,
    occupation: enrichedCelebrities.filter(c => c.occupation?.length).length,
    family: enrichedCelebrities.filter(c => c.familyRelationships).length,
    knownFor: enrichedCelebrities.filter(c => c.knownFor?.length).length,
    awards: enrichedCelebrities.filter(c => c.awards?.length).length,
    social: enrichedCelebrities.filter(c => c.socialLinks).length,
    height: enrichedCelebrities.filter(c => c.height).length,
    education: enrichedCelebrities.filter(c => c.education).length,
  };
  
  console.log(chalk.yellow('\nField Coverage:'));
  console.log(chalk.white(`  • Biography (EN): ${stats.fullBio}/${successful} (${((stats.fullBio/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Biography (TE): ${stats.fullBioTe}/${successful} (${((stats.fullBioTe/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Date of Birth: ${stats.dateOfBirth}/${successful} (${((stats.dateOfBirth/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Place of Birth: ${stats.placeOfBirth}/${successful} (${((stats.placeOfBirth/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Occupation: ${stats.occupation}/${successful} (${((stats.occupation/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Family: ${stats.family}/${successful} (${((stats.family/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Known For: ${stats.knownFor}/${successful} (${((stats.knownFor/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Awards: ${stats.awards}/${successful} (${((stats.awards/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Social Links: ${stats.social}/${successful} (${((stats.social/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Height: ${stats.height}/${successful} (${((stats.height/successful)*100).toFixed(1)}%)`));
  console.log(chalk.white(`  • Education: ${stats.education}/${successful} (${((stats.education/successful)*100).toFixed(1)}%)`));
  
  console.log(chalk.yellow('\n📝 Next steps:'));
  console.log(chalk.white('  1. Review celebrity-wiki-enrichments.json'));
  console.log(chalk.white('  2. Run migration to create staging tables'));
  console.log(chalk.white('  3. Import enrichments to database for review'));
  console.log();
}

main().catch(console.error);
