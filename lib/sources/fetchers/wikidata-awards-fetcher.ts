/**
 * WIKIDATA AWARDS FETCHER
 *
 * Fetches award information for Telugu films from Wikidata using SPARQL.
 * Provides:
 * - Filmfare Awards (Telugu/South)
 * - Nandi Awards
 * - National Film Awards
 * - SIIMA Awards
 * - Other regional awards
 *
 * Free tier: Unlimited (CC0 license)
 * No API Key required
 */

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

// ============================================================
// TYPES
// ============================================================

export interface WikidataAward {
  awardId: string;
  awardName: string;
  awardCategory?: string;
  year?: number;
  recipient?: string;
  recipientId?: string;
  movieTitle?: string;
  movieId?: string;
  awardFor?: string; // "Best Actor", "Best Film", etc.
}

export interface MovieAwardsResult {
  movieId: string;
  movieTitle?: string;
  awards: WikidataAward[];
  totalWins: number;
  totalNominations: number;
  majorAwards: string[]; // e.g., ["National Film Award", "Filmfare"]
}

export interface PersonAwardsResult {
  personId: string;
  personName?: string;
  awards: WikidataAward[];
  totalWins: number;
  careerAwards: { award: string; count: number }[];
}

// ============================================================
// SPARQL QUERIES
// ============================================================

/**
 * Query awards received by a movie
 */
const MOVIE_AWARDS_QUERY = (wikidataId: string) => `
SELECT DISTINCT
  ?award ?awardLabel
  ?category ?categoryLabel
  ?year
  ?recipientLabel
  ?forWork ?forWorkLabel
WHERE {
  wd:${wikidataId} p:P166 ?statement .
  ?statement ps:P166 ?award .
  
  OPTIONAL { ?statement pq:P585 ?year . }
  OPTIONAL { ?statement pq:P1686 ?category . }
  OPTIONAL { ?statement pq:P642 ?forWork . }
  OPTIONAL { ?statement pq:P1346 ?recipient . }
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,te" . }
}
ORDER BY DESC(?year)
`;

/**
 * Query awards received by a person (actor/director)
 */
const PERSON_AWARDS_QUERY = (wikidataId: string) => `
SELECT DISTINCT
  ?award ?awardLabel
  ?category ?categoryLabel
  ?year
  ?forWork ?forWorkLabel
WHERE {
  wd:${wikidataId} p:P166 ?statement .
  ?statement ps:P166 ?award .
  
  OPTIONAL { ?statement pq:P585 ?year . }
  OPTIONAL { ?statement pq:P1686 ?category . }
  OPTIONAL { ?statement pq:P1411 ?forWork . }
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,te" . }
}
ORDER BY DESC(?year)
`;

/**
 * Query Nandi Award winners for a specific year
 */
const NANDI_AWARDS_BY_YEAR_QUERY = (year: number) => `
SELECT DISTINCT
  ?person ?personLabel
  ?award ?awardLabel
  ?category ?categoryLabel
  ?film ?filmLabel
WHERE {
  ?person p:P166 ?statement .
  ?statement ps:P166 ?award .
  ?statement pq:P585 ?year .
  
  FILTER(YEAR(?year) = ${year})
  
  # Nandi Award (Q3514287) or Andhra Pradesh State Nandi Awards
  { ?award wdt:P31 wd:Q3514287 } 
  UNION 
  { ?award wdt:P361 wd:Q3514287 }
  UNION
  { ?award rdfs:label ?awardLabel . FILTER(CONTAINS(LCASE(?awardLabel), "nandi")) }
  
  OPTIONAL { ?statement pq:P1686 ?category . }
  OPTIONAL { ?statement pq:P1411 ?film . }
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,te" . }
}
LIMIT 100
`;

/**
 * Query National Film Award winners for Telugu films
 */
const NATIONAL_AWARDS_TELUGU_QUERY = (yearFrom: number, yearTo: number) => `
SELECT DISTINCT
  ?film ?filmLabel
  ?award ?awardLabel
  ?year
  ?recipient ?recipientLabel
WHERE {
  ?film wdt:P31 wd:Q11424 .           # is a film
  ?film wdt:P364 wd:Q8097 .           # original language: Telugu
  
  ?film p:P166 ?statement .
  ?statement ps:P166 ?award .
  ?statement pq:P585 ?year .
  
  # National Film Award
  { ?award wdt:P31 wd:Q1137587 }
  UNION
  { ?award wdt:P361 wd:Q1137587 }
  
  FILTER(YEAR(?year) >= ${yearFrom} && YEAR(?year) <= ${yearTo})
  
  OPTIONAL { ?statement pq:P1346 ?recipient . }
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
ORDER BY DESC(?year)
LIMIT 200
`;

/**
 * Query Filmfare Awards South for Telugu films
 */
const FILMFARE_SOUTH_QUERY = (yearFrom: number, yearTo: number) => `
SELECT DISTINCT
  ?film ?filmLabel
  ?award ?awardLabel
  ?category ?categoryLabel
  ?year
  ?recipient ?recipientLabel
WHERE {
  ?film wdt:P31 wd:Q11424 .
  ?film wdt:P364 wd:Q8097 .           # Telugu language
  
  ?film p:P166 ?statement .
  ?statement ps:P166 ?award .
  
  # Filmfare Awards South (Q5448607)
  { ?award wdt:P31 wd:Q5448607 }
  UNION
  { ?award wdt:P361 wd:Q5448607 }
  UNION
  { ?award rdfs:label ?awardLabel . FILTER(CONTAINS(LCASE(?awardLabel), "filmfare")) }
  
  OPTIONAL { ?statement pq:P585 ?year . FILTER(YEAR(?year) >= ${yearFrom} && YEAR(?year) <= ${yearTo}) }
  OPTIONAL { ?statement pq:P1686 ?category . }
  OPTIONAL { ?statement pq:P1346 ?recipient . }
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
ORDER BY DESC(?year)
LIMIT 200
`;

// ============================================================
// WIKIDATA AWARDS FETCHER CLASS
// ============================================================

export class WikidataAwardsFetcher {
  private userAgent = 'TeluguVibes/1.0 (https://teluguvibes.com; contact@teluguvibes.com)';

  /**
   * Execute a SPARQL query against Wikidata
   */
  private async executeQuery(sparql: string): Promise<any[]> {
    try {
      const response = await fetch(WIKIDATA_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/sparql-results+json',
          'User-Agent': this.userAgent,
        },
        body: `query=${encodeURIComponent(sparql)}`,
      });

      if (!response.ok) {
        console.error(`Wikidata SPARQL error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.results?.bindings || [];
    } catch (error) {
      console.error('Wikidata query error:', error);
      return [];
    }
  }

  /**
   * Extract Wikidata ID from URL
   */
  private extractId(url?: string): string | undefined {
    if (!url) return undefined;
    const match = url.match(/Q\d+/);
    return match ? match[0] : undefined;
  }

  /**
   * Parse year from Wikidata datetime
   */
  private parseYear(dateValue?: string): number | undefined {
    if (!dateValue) return undefined;
    const match = dateValue.match(/(\d{4})/);
    return match ? parseInt(match[1]) : undefined;
  }

  /**
   * Get awards for a movie by Wikidata ID
   */
  async getMovieAwards(wikidataId: string): Promise<MovieAwardsResult> {
    const cleanId = wikidataId.startsWith('Q') ? wikidataId : `Q${wikidataId}`;
    const query = MOVIE_AWARDS_QUERY(cleanId);
    const results = await this.executeQuery(query);

    const awards: WikidataAward[] = results.map(row => ({
      awardId: this.extractId(row.award?.value) || '',
      awardName: row.awardLabel?.value || 'Unknown Award',
      awardCategory: row.categoryLabel?.value,
      year: this.parseYear(row.year?.value),
      recipient: row.recipientLabel?.value,
      awardFor: row.forWorkLabel?.value,
    }));

    const majorAwardNames = ['National Film Award', 'Filmfare', 'Nandi', 'SIIMA', 'IIFA'];
    const majorAwards = [...new Set(
      awards
        .filter(a => majorAwardNames.some(name => 
          a.awardName.toLowerCase().includes(name.toLowerCase())
        ))
        .map(a => a.awardName)
    )];

    return {
      movieId: cleanId,
      awards,
      totalWins: awards.length, // All listed are wins (nominations are separate in Wikidata)
      totalNominations: 0, // Would need P1411 for nominations
      majorAwards,
    };
  }

  /**
   * Get awards for a person by Wikidata ID
   */
  async getPersonAwards(wikidataId: string): Promise<PersonAwardsResult> {
    const cleanId = wikidataId.startsWith('Q') ? wikidataId : `Q${wikidataId}`;
    const query = PERSON_AWARDS_QUERY(cleanId);
    const results = await this.executeQuery(query);

    const awards: WikidataAward[] = results.map(row => ({
      awardId: this.extractId(row.award?.value) || '',
      awardName: row.awardLabel?.value || 'Unknown Award',
      awardCategory: row.categoryLabel?.value,
      year: this.parseYear(row.year?.value),
      movieTitle: row.forWorkLabel?.value,
      movieId: this.extractId(row.forWork?.value),
    }));

    // Aggregate by award type
    const awardCounts = new Map<string, number>();
    for (const award of awards) {
      const name = award.awardName;
      awardCounts.set(name, (awardCounts.get(name) || 0) + 1);
    }

    const careerAwards = Array.from(awardCounts.entries())
      .map(([award, count]) => ({ award, count }))
      .sort((a, b) => b.count - a.count);

    return {
      personId: cleanId,
      awards,
      totalWins: awards.length,
      careerAwards,
    };
  }

  /**
   * Get Nandi Award winners for a specific year
   */
  async getNandiAwardsByYear(year: number): Promise<WikidataAward[]> {
    const query = NANDI_AWARDS_BY_YEAR_QUERY(year);
    const results = await this.executeQuery(query);

    return results.map(row => ({
      awardId: this.extractId(row.award?.value) || '',
      awardName: row.awardLabel?.value || 'Nandi Award',
      awardCategory: row.categoryLabel?.value,
      year: year,
      recipient: row.personLabel?.value,
      recipientId: this.extractId(row.person?.value),
      movieTitle: row.filmLabel?.value,
      movieId: this.extractId(row.film?.value),
    }));
  }

  /**
   * Get National Film Awards for Telugu films in a date range
   */
  async getNationalAwardsForTelugu(yearFrom: number, yearTo: number): Promise<WikidataAward[]> {
    const query = NATIONAL_AWARDS_TELUGU_QUERY(yearFrom, yearTo);
    const results = await this.executeQuery(query);

    return results.map(row => ({
      awardId: this.extractId(row.award?.value) || '',
      awardName: row.awardLabel?.value || 'National Film Award',
      year: this.parseYear(row.year?.value),
      movieTitle: row.filmLabel?.value,
      movieId: this.extractId(row.film?.value),
      recipient: row.recipientLabel?.value,
    }));
  }

  /**
   * Get Filmfare Awards South for Telugu films in a date range
   */
  async getFilmfareSouthForTelugu(yearFrom: number, yearTo: number): Promise<WikidataAward[]> {
    const query = FILMFARE_SOUTH_QUERY(yearFrom, yearTo);
    const results = await this.executeQuery(query);

    return results.map(row => ({
      awardId: this.extractId(row.award?.value) || '',
      awardName: row.awardLabel?.value || 'Filmfare Award',
      awardCategory: row.categoryLabel?.value,
      year: this.parseYear(row.year?.value),
      movieTitle: row.filmLabel?.value,
      movieId: this.extractId(row.film?.value),
      recipient: row.recipientLabel?.value,
      recipientId: this.extractId(row.recipient?.value),
    }));
  }

  /**
   * Check if a movie has major awards
   */
  async hasMajorAwards(wikidataId: string): Promise<boolean> {
    const result = await this.getMovieAwards(wikidataId);
    return result.majorAwards.length > 0;
  }

  /**
   * Get award summary for display
   */
  async getAwardsSummary(wikidataId: string): Promise<{
    hasAwards: boolean;
    totalCount: number;
    summary: string;
    highlights: string[];
  }> {
    const result = await this.getMovieAwards(wikidataId);

    if (result.awards.length === 0) {
      return {
        hasAwards: false,
        totalCount: 0,
        summary: 'No awards on record',
        highlights: [],
      };
    }

    const highlights = result.majorAwards.slice(0, 3);
    const summary = result.awards.length === 1
      ? `Won ${result.awards[0].awardName}`
      : `${result.awards.length} awards including ${highlights.join(', ')}`;

    return {
      hasAwards: true,
      totalCount: result.awards.length,
      summary,
      highlights,
    };
  }
}

// Singleton instance
let wikidataAwardsFetcherInstance: WikidataAwardsFetcher | null = null;

export function getWikidataAwardsFetcher(): WikidataAwardsFetcher {
  if (!wikidataAwardsFetcherInstance) {
    wikidataAwardsFetcherInstance = new WikidataAwardsFetcher();
  }
  return wikidataAwardsFetcherInstance;
}


