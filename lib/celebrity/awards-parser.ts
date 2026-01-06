/**
 * Celebrity Awards Parser
 * Parse and normalize awards from various sources
 */

import type { CelebrityAward } from './types';

// ============================================================
// AWARD TYPE DETECTION
// ============================================================

export function detectAwardType(awardName: string): CelebrityAward['award_type'] {
  const name = awardName.toLowerCase();
  
  if (name.includes('national') || name.includes('padma') || name.includes('dadasaheb phalke')) {
    return 'national';
  }
  if (name.includes('filmfare')) {
    return 'filmfare';
  }
  if (name.includes('nandi')) {
    return 'nandi';
  }
  if (name.includes('siima') || name.includes('south indian international')) {
    return 'siima';
  }
  if (name.includes('cinemaa') || name.includes('maa tv') || name.includes('maa awards')) {
    return 'cinemaa';
  }
  
  return 'other';
}

// ============================================================
// AWARD CATEGORY NORMALIZATION
// ============================================================

export function normalizeCategory(category: string): string {
  const cat = category.toLowerCase();
  
  // Actor categories
  if (cat.includes('best actor') || cat.includes('best hero')) {
    if (cat.includes('supporting')) return 'Best Supporting Actor';
    if (cat.includes('comedian') || cat.includes('comedy')) return 'Best Comedian';
    return 'Best Actor';
  }
  
  // Actress categories
  if (cat.includes('best actress') || cat.includes('best heroine')) {
    if (cat.includes('supporting')) return 'Best Supporting Actress';
    return 'Best Actress';
  }
  
  // Direction
  if (cat.includes('director') || cat.includes('direction')) {
    if (cat.includes('debut')) return 'Best Debut Director';
    return 'Best Director';
  }
  
  // Music
  if (cat.includes('music director') || cat.includes('music')) {
    return 'Best Music Director';
  }
  if (cat.includes('playback') || cat.includes('singer')) {
    if (cat.includes('male')) return 'Best Male Playback Singer';
    if (cat.includes('female')) return 'Best Female Playback Singer';
    return 'Best Playback Singer';
  }
  
  // Film categories
  if (cat.includes('best film') || cat.includes('best feature') || cat.includes('best telugu')) {
    return 'Best Film';
  }
  
  // Special
  if (cat.includes('lifetime') || cat.includes('life time')) return 'Lifetime Achievement';
  if (cat.includes('debut')) return 'Best Debut';
  if (cat.includes('villain') || cat.includes('negative')) return 'Best Villain';
  if (cat.includes('character')) return 'Best Character Actor';
  
  return category;
}

// ============================================================
// PARSE WIKIPEDIA AWARDS TABLE
// ============================================================

export function parseWikipediaAwardsTable(
  html: string,
  celebrityId: string
): CelebrityAward[] {
  const awards: CelebrityAward[] = [];
  
  // Simple regex-based parsing for award tables
  // Matches rows with year, award name, category, and film
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  
  let rowMatch;
  let currentYear: number | undefined;
  
  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const row = rowMatch[1];
    const cells: string[] = [];
    let cellMatch;
    
    while ((cellMatch = cellPattern.exec(row)) !== null) {
      // Strip HTML tags
      const text = cellMatch[1].replace(/<[^>]+>/g, '').trim();
      cells.push(text);
    }
    
    if (cells.length >= 2) {
      // Try to parse year from first cell
      const yearMatch = cells[0].match(/\d{4}/);
      if (yearMatch) {
        currentYear = parseInt(yearMatch[0]);
      }
      
      // Look for award info
      for (let i = 1; i < cells.length; i++) {
        const cell = cells[i];
        
        // Check if this looks like an award
        if (cell.toLowerCase().includes('award') || 
            cell.toLowerCase().includes('nomination') ||
            cell.toLowerCase().includes('winner')) {
          
          const isWon = !cell.toLowerCase().includes('nominated') && 
                       !cell.toLowerCase().includes('nomination');
          
          awards.push({
            celebrity_id: celebrityId,
            award_name: extractAwardName(cell),
            award_type: detectAwardType(cell),
            category: cells[i + 1] ? normalizeCategory(cells[i + 1]) : undefined,
            year: currentYear,
            movie_title: cells[i + 2] || undefined,
            is_won: isWon,
            is_nomination: !isWon,
            source: 'wikipedia',
          });
        }
      }
    }
  }
  
  return awards;
}

// ============================================================
// EXTRACT AWARD NAME
// ============================================================

function extractAwardName(text: string): string {
  // Common award patterns
  const patterns = [
    /National Film Award/i,
    /Filmfare Award/i,
    /Nandi Award/i,
    /SIIMA Award/i,
    /CineMAA Award/i,
    /Padma Shri/i,
    /Padma Bhushan/i,
    /Padma Vibhushan/i,
    /Dadasaheb Phalke/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  
  // Return cleaned text if no pattern matches
  return text.split('-')[0].trim().substring(0, 100);
}

// ============================================================
// MERGE AND DEDUPLICATE AWARDS
// ============================================================

export function mergeAwards(awards: CelebrityAward[]): CelebrityAward[] {
  const unique = new Map<string, CelebrityAward>();
  
  for (const award of awards) {
    const key = `${award.award_type}-${award.category}-${award.year}-${award.movie_title}`.toLowerCase();
    
    if (!unique.has(key)) {
      unique.set(key, award);
    } else {
      // Merge with existing, preferring won over nominated
      const existing = unique.get(key)!;
      if (award.is_won && !existing.is_won) {
        unique.set(key, award);
      }
    }
  }
  
  return Array.from(unique.values()).sort((a, b) => (b.year || 0) - (a.year || 0));
}

// ============================================================
// CALCULATE AWARDS SUMMARY
// ============================================================

export function calculateAwardsSummary(awards: CelebrityAward[]): {
  total: number;
  national: number;
  filmfare: number;
  nandi: number;
  siima: number;
  cinemaa: number;
  other: number;
} {
  const won = awards.filter(a => a.is_won);
  
  return {
    total: won.length,
    national: won.filter(a => a.award_type === 'national').length,
    filmfare: won.filter(a => a.award_type === 'filmfare').length,
    nandi: won.filter(a => a.award_type === 'nandi').length,
    siima: won.filter(a => a.award_type === 'siima').length,
    cinemaa: won.filter(a => a.award_type === 'cinemaa').length,
    other: won.filter(a => a.award_type === 'other').length,
  };
}

// ============================================================
// FETCH AWARDS FROM WIKIPEDIA
// ============================================================

export async function fetchWikipediaAwards(
  celebrityName: string,
  celebrityId: string
): Promise<CelebrityAward[]> {
  try {
    // Get mobile sections which include awards
    const url = `https://en.wikipedia.org/api/rest_v1/page/mobile-sections/${encodeURIComponent(celebrityName.replace(/ /g, '_'))}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TeluguVibes/1.0' }
    });

    if (!res.ok) return [];

    const data = await res.json();
    const sections = data.remaining?.sections || [];
    
    const awards: CelebrityAward[] = [];
    
    for (const section of sections) {
      const title = section.line?.toLowerCase() || '';
      
      if (title.includes('award') || title.includes('accolade') || title.includes('honour') || title.includes('recognition')) {
        const html = section.text || '';
        const parsed = parseWikipediaAwardsTable(html, celebrityId);
        awards.push(...parsed);
      }
    }
    
    return mergeAwards(awards);
  } catch (error) {
    console.error('Error fetching Wikipedia awards:', error);
    return [];
  }
}


