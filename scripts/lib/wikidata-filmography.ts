/**
 * WIKIDATA FILMOGRAPHY FETCHER
 * 
 * Fetches filmography using Wikidata SPARQL queries.
 * Structured data source for film discovery.
 */

import type { DiscoveredFilm } from './film-discovery-engine';

const WIKIDATA_SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

interface WikidataFilm {
  filmLabel: string;
  year: string;
  roleLabel?: string;
  imdbId?: string;
}

/**
 * Execute SPARQL query against Wikidata
 */
async function executeSPARQLQuery(query: string): Promise<any> {
  try {
    const response = await fetch(WIKIDATA_SPARQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Telugu-Portal-FilmDiscovery/1.0',
      },
      body: `query=${encodeURIComponent(query)}`,
    });
    
    if (!response.ok) {
      console.warn(`Wikidata SPARQL failed: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Wikidata SPARQL error:', error);
    return null;
  }
}

/**
 * Find actor's Wikidata ID by name
 */
async function findActorWikidataId(actorName: string): Promise<string | null> {
  const searchQuery = `
    SELECT ?actor WHERE {
      ?actor rdfs:label "${actorName}"@en .
      ?actor wdt:P31 wd:Q5 . # instance of human
      ?actor wdt:P106 wd:Q33999 . # occupation: actor
    }
    LIMIT 1
  `;
  
  const result = await executeSPARQLQuery(searchQuery);
  
  if (result?.results?.bindings?.length > 0) {
    const actorUri = result.results.bindings[0].actor.value;
    return actorUri.split('/').pop() || null;
  }
  
  return null;
}

/**
 * Fetch filmography for actor from Wikidata
 */
export async function fetchWikidataFilmography(actorName: string): Promise<DiscoveredFilm[]> {
  console.log(`Wikidata: Searching for "${actorName}"...`);
  
  // Step 1: Find actor's Wikidata ID
  const actorId = await findActorWikidataId(actorName);
  if (!actorId) {
    console.log(`Wikidata: Actor "${actorName}" not found`);
    return [];
  }
  
  console.log(`Wikidata: Found actor ID ${actorId}`);
  
  // Step 2: Query for all films where actor is cast member
  const filmsQuery = `
    SELECT DISTINCT ?film ?filmLabel ?year ?roleLabel ?imdbId WHERE {
      ?film wdt:P161 wd:${actorId} . # cast member
      ?film wdt:P31 wd:Q11424 . # instance of film
      OPTIONAL { ?film wdt:P577 ?publicationDate . }
      OPTIONAL { ?film wdt:P345 ?imdbId . }
      OPTIONAL { 
        ?film p:P161 ?castStatement .
        ?castStatement ps:P161 wd:${actorId} .
        ?castStatement pq:P453 ?role .
      }
      BIND(YEAR(?publicationDate) as ?year)
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,te". }
    }
    ORDER BY ?year
  `;
  
  const result = await executeSPARQLQuery(filmsQuery);
  
  if (!result?.results?.bindings) {
    console.log(`Wikidata: No films found for actor ${actorId}`);
    return [];
  }
  
  const films: DiscoveredFilm[] = [];
  
  for (const binding of result.results.bindings) {
    const filmLabel = binding.filmLabel?.value;
    const year = binding.year?.value;
    const roleLabel = binding.roleLabel?.value;
    const imdbId = binding.imdbId?.value;
    
    if (!filmLabel || !year) continue;
    
    const releaseYear = parseInt(year);
    if (isNaN(releaseYear)) continue;
    
    // Determine role type
    let role: 'hero' | 'heroine' | 'supporting' = 'supporting';
    if (roleLabel) {
      const roleLower = roleLabel.toLowerCase();
      if (roleLower.includes('lead') || roleLower.includes('protagonist')) {
        role = 'hero';
      }
    }
    
    films.push({
      title_en: filmLabel,
      release_year: releaseYear,
      role,
      sources: ['wikidata'],
      confidence: 0.80, // Wikidata is reliable but not as comprehensive as TMDB
      imdb_id: imdbId || undefined,
      language: 'Unknown', // Wikidata doesn't always have language info
    });
  }
  
  console.log(`Wikidata: Found ${films.length} films for "${actorName}"`);
  
  return films;
}
