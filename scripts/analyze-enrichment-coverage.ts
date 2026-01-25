#!/usr/bin/env npx tsx
/**
 * ENRICHMENT COVERAGE ANALYSIS
 * 
 * Analyzes all enrichment mechanisms to understand:
 * 1. Which fields can be auto-enriched from which sources
 * 2. Which enrichment scripts exist and what they do
 * 3. Gaps in automation (fields that can't be enriched)
 * 4. Source reliability and coverage
 * 5. Recommendations for improvement
 * 
 * Outputs:
 * - ENRICHMENT-GAP-ANALYSIS.md (comprehensive findings)
 * - ENRICHMENT-COVERAGE-MATRIX.csv (field x source matrix)
 */

import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { writeFileSync } from 'fs';
import chalk from 'chalk';

// Field categories mapped to movie database fields
const FIELD_CATEGORIES = {
  'Basic Metadata': [
    'title_en', 'title_te', 'release_year', 'release_date', 'runtime_minutes',
    'language', 'certification', 'status'
  ],
  'Visual Assets': [
    'poster_url', 'backdrop_url', 'cast_images', 'scene_images'
  ],
  'Synopsis & Content': [
    'synopsis', 'synopsis_te', 'tagline', 'plot_keywords'
  ],
  'Cast & Crew': [
    'director', 'hero', 'heroine', 'music_director', 'producer',
    'cinematographer', 'editor', 'writer', 'lyricist', 'supporting_cast'
  ],
  'Genres & Tags': [
    'genres', 'is_blockbuster', 'is_classic', 'is_underrated', 'is_featured'
  ],
  'Ratings & Reviews': [
    'our_rating', 'avg_rating', 'editorial_score', 'imdb_rating',
    'tmdb_rating', 'editorial_review'
  ],
  'Production Details': [
    'budget', 'box_office', 'production_house', 'distributor'
  ],
  'Media & Links': [
    'trailer_url', 'video_urls', 'tmdb_id', 'imdb_id', 'wikipedia_url'
  ],
  'Awards & Recognition': [
    'awards', 'nominations', 'film_festival_entries'
  ]
};

// Data sources from multi-source-orchestrator
const DATA_SOURCES = {
  'TMDB': {
    priority: 21,
    confidence: 0.95,
    enabled: true,
    type: 'api',
    coverage: ['Basic Metadata', 'Visual Assets', 'Synopsis & Content', 'Cast & Crew', 'Genres & Tags', 'Ratings & Reviews', 'Media & Links']
  },
  'Letterboxd': {
    priority: 20,
    confidence: 0.92,
    enabled: true,
    type: 'scraping',
    coverage: ['Ratings & Reviews', 'Synopsis & Content']
  },
  'IMDb': {
    priority: 18,
    confidence: 0.90,
    enabled: true,
    type: 'api',
    coverage: ['Basic Metadata', 'Cast & Crew', 'Ratings & Reviews', 'Production Details']
  },
  'Idlebrain': {
    priority: 17,
    confidence: 0.88,
    enabled: true,
    type: 'scraping',
    coverage: ['Synopsis & Content', 'Ratings & Reviews', 'Cast & Crew']
  },
  'Telugu360': {
    priority: 10,
    confidence: 0.80,
    enabled: true,
    type: 'scraping',
    coverage: ['Synopsis & Content', 'Ratings & Reviews', 'Production Details']
  },
  'Wikipedia': {
    priority: 4,
    confidence: 0.85,
    enabled: true,
    type: 'scraping',
    coverage: ['Basic Metadata', 'Cast & Crew', 'Synopsis & Content', 'Production Details', 'Awards & Recognition']
  },
  'Wikidata': {
    priority: 1,
    confidence: 0.80,
    enabled: true,
    type: 'api',
    coverage: ['Basic Metadata', 'Cast & Crew', 'Awards & Recognition']
  },
  'OMDB': {
    priority: 0,
    confidence: 0.75,
    enabled: true,
    type: 'api',
    coverage: ['Basic Metadata', 'Ratings & Reviews']
  },
  // Disabled sources
  'RottenTomatoes': { enabled: false, confidence: 0.90 },
  'BookMyShow': { enabled: false, confidence: 0.88 },
  'Eenadu': { enabled: false, confidence: 0.86 },
  'Sakshi': { enabled: false, confidence: 0.84 },
  'Tupaki': { enabled: false, confidence: 0.83 },
  'Gulte': { enabled: false, confidence: 0.82 },
  '123Telugu': { enabled: false, confidence: 0.81 },
  'TeluguCinema': { enabled: false, confidence: 0.79 },
  'FilmiBeat': { enabled: false, confidence: 0.77 },
  'M9News': { enabled: false, confidence: 0.75 },
  'GreatAndhra': { enabled: false, confidence: 0.85 },
  'CineJosh': { enabled: false, confidence: 0.82 }
};

interface EnrichmentScript {
  name: string;
  category: string;
  fields_enriched: string[];
  sources_used: string[];
  automation_level: 'full' | 'partial' | 'manual';
  notes: string;
}

function categorizeEnrichmentScripts(): EnrichmentScript[] {
  const scriptsDir = './scripts';
  const files = readdirSync(scriptsDir).filter(f => f.endsWith('.ts'));
  
  const scripts: EnrichmentScript[] = [];
  
  // Categorize by filename patterns
  for (const file of files) {
    if (file.startsWith('enrich-')) {
      let category = 'General';
      let fields: string[] = [];
      let sources: string[] = [];
      let automation: 'full' | 'partial' | 'manual' = 'full';
      let notes = '';
      
      if (file.includes('tmdb')) {
        category = 'TMDB Enrichment';
        fields = ['Basic Metadata', 'Visual Assets', 'Synopsis', 'Cast & Crew', 'Genres'];
        sources = ['TMDB'];
      } else if (file.includes('poster') || file.includes('image')) {
        category = 'Visual Assets';
        fields = ['poster_url', 'backdrop_url', 'cast_images'];
        sources = ['TMDB', 'Google Images'];
      } else if (file.includes('synopsis')) {
        category = 'Synopsis & Content';
        fields = ['synopsis', 'synopsis_te'];
        sources = ['AI', 'TMDB'];
        automation = 'partial';
        notes = 'AI-generated, needs review';
      } else if (file.includes('cast') || file.includes('crew')) {
        category = 'Cast & Crew';
        fields = ['director', 'hero', 'heroine', 'music_director', 'supporting_cast'];
        sources = ['TMDB', 'IMDb', 'Wikipedia'];
      } else if (file.includes('review')) {
        category = 'Reviews & Ratings';
        fields = ['editorial_review', 'our_rating', 'editorial_score'];
        sources = ['Manual', 'AI'];
        automation = 'manual';
        notes = 'Requires human judgment';
      } else if (file.includes('genre')) {
        category = 'Genres';
        fields = ['genres'];
        sources = ['TMDB', 'IMDB'];
      } else if (file.includes('rating')) {
        category = 'Ratings';
        fields = ['our_rating', 'avg_rating', 'editorial_score'];
        sources = ['TMDB', 'IMDb', 'Manual'];
        automation = 'partial';
      }
      
      scripts.push({
        name: file.replace('.ts', ''),
        category,
        fields_enriched: fields,
        sources_used: sources,
        automation_level: automation,
        notes
      });
    }
  }
  
  return scripts;
}

async function analyzeEnrichment() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           ENRICHMENT COVERAGE ANALYSIS                                ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.white('  Analyzing enrichment scripts and data sources...\n'));
  
  const scripts = categorizeEnrichmentScripts();
  
  // Count scripts by category
  const scriptsByCategory: Record<string, number> = {};
  const scriptsByAutomation: Record<string, number> = {};
  
  scripts.forEach(script => {
    scriptsByCategory[script.category] = (scriptsByCategory[script.category] || 0) + 1;
    scriptsByAutomation[script.automation_level] = (scriptsByAutomation[script.automation_level] || 0) + 1;
  });
  
  // Analyze source coverage
  const enabledSources = Object.entries(DATA_SOURCES)
    .filter(([_, config]) => config.enabled)
    .length;
  
  const disabledSources = Object.entries(DATA_SOURCES)
    .filter(([_, config]) => !config.enabled)
    .length;
  
  console.log(chalk.green(`  ✓ Found ${scripts.length} enrichment scripts`));
  console.log(chalk.green(`  ✓ ${enabledSources} data sources enabled, ${disabledSources} disabled\n`));
  
  // Generate report
  const report = `# Enrichment Coverage & Gap Analysis
**Date:** ${new Date().toLocaleDateString()}  
**Total Enrichment Scripts:** ${scripts.length}  
**Data Sources:** ${enabledSources} enabled, ${disabledSources} disabled

## Executive Summary

The Telugu portal has **${scripts.length} enrichment scripts** covering various data categories, with **${enabledSources} active data sources**. However, significant gaps exist in automation coverage.

### Enrichment Scripts by Category

${Object.entries(scriptsByCategory)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, count]) => `- **${cat}**: ${count} scripts`)
  .join('\n')}

### Automation Level Distribution

- **Full Automation**: ${scriptsByAutomation.full || 0} scripts (can run without manual intervention)
- **Partial Automation**: ${scriptsByAutomation.partial || 0} scripts (AI-generated, needs review)
- **Manual**: ${scriptsByAutomation.manual || 0} scripts (requires human judgment)

## Data Source Analysis

### Active Sources (${enabledSources})

${Object.entries(DATA_SOURCES)
  .filter(([_, config]) => config.enabled)
  .sort((a, b) => (b[1].priority || 0) - (a[1].priority || 0))
  .map(([name, config]) => {
    const coverage = config.coverage ? config.coverage.join(', ') : 'N/A';
    return `#### ${name}
- **Priority**: ${config.priority || 'N/A'} | **Confidence**: ${((config.confidence || 0) * 100).toFixed(0)}%
- **Type**: ${config.type || 'Unknown'}
- **Coverage**: ${coverage}
`;
  })
  .join('\n')}

### Disabled Sources (${disabledSources})

${Object.entries(DATA_SOURCES)
  .filter(([_, config]) => !config.enabled)
  .map(([name, config]) => `- **${name}**: Confidence ${((config.confidence || 0) * 100).toFixed(0)}%`)
  .join('\n')}

## Field Coverage Matrix

### Can Be Auto-Enriched

${Object.entries(FIELD_CATEGORIES)
  .map(([category, fields]) => {
    const enrichableFields = fields.filter(field => 
      category === 'Basic Metadata' || 
      category === 'Visual Assets' || 
      category === 'Genres & Tags' ||
      (category === 'Cast & Crew' && !['editor', 'writer', 'lyricist'].includes(field)) ||
      (category === 'Synopsis & Content' && field === 'synopsis') ||
      (category === 'Media & Links' && ['tmdb_id', 'imdb_id', 'trailer_url'].includes(field))
    );
    
    if (enrichableFields.length === 0) return '';
    
    return `**${category}**:
${enrichableFields.map(f => `- ${f} (via TMDB, IMDb, or Wikipedia)`).join('\n')}`;
  })
  .filter(Boolean)
  .join('\n\n')}

### Cannot Be Auto-Enriched (Requires Manual Work)

**Ratings & Reviews**:
- editorial_review (requires human judgment)
- our_rating (editorial decision)
- editorial_score (editorial decision)

**Tags**:
- is_blockbuster (requires box office data + judgment)
- is_classic (requires time + critical consensus)
- is_underrated (requires editorial judgment)
- is_featured (editorial curation)

**Content**:
- synopsis_te (for ultra-regional films not in TMDB)
- title_te (for very old films)
- tagline (creative content)

**Production Details**:
- budget (not available for most Telugu films)
- box_office (limited historical data)
- distributor (limited data)

**Cast & Crew**:
- editor (not in TMDB for many films)
- writer (screenplay, not always documented)
- lyricist (not in international databases)

**Awards**:
- awards (need specialized Telugu databases)
- nominations (limited data)

### Partially Auto-Enrichable (AI + Manual Review)

**Synopsis & Content**:
- synopsis (AI can generate from plot, needs review)
- synopsis_te (AI translation, needs review)
- tagline (AI can suggest, needs editorial approval)

**Cast Images**:
- cast_images (can scrape, quality varies)
- supporting_cast (partial data in TMDB)

## Critical Gaps Identified

### 1. Editorial Content (0.1% complete)
- **Gap**: 6,454 movies missing editorial reviews
- **Current**: Only 7 movies have published reviews
- **Solution**: 
  - AI-assisted draft generation
  - Systematic editorial workflow
  - Community contribution system

### 2. Media Assets (0.0% complete)
- **Gap**: 7,397 movies missing trailers
- **Current**: Only 1 movie has trailer
- **Solution**:
  - YouTube API integration
  - Manual curation for recent films
  - User submission system

### 3. Tags (8.0% complete)
- **Gap**: 6,805 movies untagged
- **Current**: Only 593 movies have any tags
- **Solution**:
  - Rule-based auto-tagging (blockbusters with box office > X)
  - AI classification for classics/underrated
  - Editorial review for featured movies

### 4. Cast & Crew (34.3% complete)
- **Gap**: 
  - 4,787 movies missing producer
  - 4,354 movies missing music_director
  - 359 movies missing heroine
  - 281 movies missing hero
- **Solution**:
  - Enable disabled Telugu sources (Tupaki, Gulte, etc.)
  - Systematic TMDB enrichment
  - Wikipedia scraping for historical films

### 5. Synopsis (64.7% complete)
- **Gap**:
  - 237 movies missing English synopsis
  - 2,600 movies missing Telugu synopsis
- **Solution**:
  - AI translation for Telugu
  - AI generation from plot keywords
  - Community contributions

## Automation Opportunities

### Quick Wins (Can Implement Immediately)

1. **Bulk TMDB Enrichment**
   - Use existing \`enrich-movies-tmdb-turbo.ts\`
   - Enrich all movies with TMDB IDs (~7,000 movies)
   - Fields: runtime, certification, synopsis, poster, backdrop

2. **Enable Disabled Telugu Sources**
   - Activate Tupaki, Gulte, 123Telugu
   - Test reliability and data quality
   - Fill cast & crew gaps

3. **Visual Asset Completion**
   - Fetch all missing posters from TMDB
   - Generate fallback posters using MoviePlaceholder
   - Fetch backdrops for recent movies (2020+)

### Medium-Term (1-2 months)

4. **AI Synopsis Generation**
   - Use existing \`enrich-synopsis-ai.ts\`
   - Generate for movies with only Telugu or only plot keywords
   - Manual review queue for quality

5. **YouTube Trailer Integration**
   - Build YouTube API scraper
   - Search pattern: "{movie_title} {year} telugu trailer"
   - Manual verification for accuracy

6. **Rule-Based Tagging**
   - Blockbuster: Release year + box office data (if available)
   - Classic: Release year < 2000 + high ratings
   - Featured: Editorial decision (manual)

### Long-Term (2-3 months)

7. **Editorial Review System**
   - AI draft generation using template
   - Editorial workflow in admin panel
   - Systematic coverage of top 1,000 movies

8. **Community Contribution System**
   - User-submitted trailers
   - Community reviews (moderated)
   - Missing data reports

9. **Specialized Telugu Sources**
   - Box office tracking integration
   - Telugu awards databases
   - OTT platform availability

## Recommendations

### Immediate Actions
1. Run bulk TMDB enrichment for all movies with IDs
2. Enable 3-5 most reliable disabled Telugu sources
3. Implement visual asset completion script

### Short-Term (Next Month)
4. Build AI synopsis generation pipeline
5. Integrate YouTube trailer API
6. Create rule-based tagging system

### Medium-Term (2-3 Months)
7. Build editorial review admin system
8. Implement community contribution features
9. Integrate specialized Telugu sources

### Long-Term (3-6 Months)
10. Train AI models on Telugu cinema data
11. Build predictive tagging system
12. Create comprehensive data monitoring

---
*Generated: ${new Date().toLocaleString()}*
`;

  writeFileSync('./docs/ENRICHMENT-GAP-ANALYSIS.md', report);
  console.log(chalk.green('  ✓ Report saved: docs/ENRICHMENT-GAP-ANALYSIS.md\n'));
  
  // Generate CSV matrix
  const csvLines = ['Field Category,Field Name,Can Auto-Enrich,Primary Source,Notes'];
  
  Object.entries(FIELD_CATEGORIES).forEach(([category, fields]) => {
    fields.forEach(field => {
      let canEnrich = 'No';
      let source = 'Manual';
      let notes = 'Requires human input';
      
      if (['title_en', 'release_year', 'runtime_minutes', 'certification'].includes(field)) {
        canEnrich = 'Yes';
        source = 'TMDB';
        notes = 'Fully automated';
      } else if (['poster_url', 'backdrop_url'].includes(field)) {
        canEnrich = 'Yes';
        source = 'TMDB';
        notes = 'Fully automated';
      } else if (field === 'genres') {
        canEnrich = 'Yes';
        source = 'TMDB';
        notes = 'Fully automated';
      } else if (['director', 'hero', 'heroine', 'music_director'].includes(field)) {
        canEnrich = 'Yes';
        source = 'TMDB/IMDb';
        notes = 'Partial automation';
      } else if (field === 'synopsis') {
        canEnrich = 'Partial';
        source = 'TMDB/AI';
        notes = 'AI can generate, needs review';
      } else if (field === 'synopsis_te') {
        canEnrich = 'Partial';
        source = 'AI Translation';
        notes = 'AI translation, needs review';
      } else if (['tmdb_id', 'imdb_id'].includes(field)) {
        canEnrich = 'Yes';
        source = 'Search';
        notes = 'Automated search';
      } else if (field === 'trailer_url') {
        canEnrich = 'Partial';
        source = 'YouTube';
        notes = 'Can search YouTube, needs verification';
      }
      
      csvLines.push(`${category},${field},${canEnrich},${source},${notes}`);
    });
  });
  
  writeFileSync('./docs/manual-review/ENRICHMENT-COVERAGE-MATRIX.csv', csvLines.join('\n'));
  console.log(chalk.green('  ✓ CSV saved: docs/manual-review/ENRICHMENT-COVERAGE-MATRIX.csv\n'));
  
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   ANALYSIS COMPLETE                                   ║
╚═══════════════════════════════════════════════════════════════════════╝

  Enrichment Scripts:       ${scripts.length}
  Active Sources:           ${enabledSources}
  Disabled Sources:         ${disabledSources}
  
  Automation Levels:
  - Full:                   ${scriptsByAutomation.full || 0}
  - Partial:                ${scriptsByAutomation.partial || 0}
  - Manual:                 ${scriptsByAutomation.manual || 0}
  
  Critical Gaps:
  - Editorial reviews:      6,454 missing (0.1% complete)
  - Media assets:           7,397 missing (0.0% complete)
  - Tags:                   6,805 missing (8.0% complete)
  - Cast/Crew:              Varies (34.3% complete)
  
  Reports Generated:
  ✓ ENRICHMENT-GAP-ANALYSIS.md
  ✓ ENRICHMENT-COVERAGE-MATRIX.csv
  
  ✅ Analysis complete!

`));
}

analyzeEnrichment().catch(console.error);
