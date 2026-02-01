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
  languageLabel?: string;
  crewRole?: string;
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
  
  // Step 2: Query for all films where actor has ANY role (cast OR crew)
  // This includes: actor (P161), producer (P162), director (P57), writer (P58), composer (P86), cinematographer (P344), editor (P1040)
  const filmsQuery = `
    SELECT DISTINCT ?film ?filmLabel ?year ?roleLabel ?imdbId ?languageLabel ?crewRole WHERE {
      {
        # Cast member
        ?film wdt:P161 wd:${actorId} .
        OPTIONAL { 
          ?film p:P161 ?castStatement .
          ?castStatement ps:P161 wd:${actorId} .
          ?castStatement pq:P453 ?role .
        }
      } UNION {
        # Producer
        ?film wdt:P162 wd:${actorId} .
        BIND("Producer" as ?crewRole)
      } UNION {
        # Director
        ?film wdt:P57 wd:${actorId} .
        BIND("Director" as ?crewRole)
      } UNION {
        # Writer/Screenwriter
        ?film wdt:P58 wd:${actorId} .
        BIND("Writer" as ?crewRole)
      } UNION {
        # Composer/Music Director
        ?film wdt:P86 wd:${actorId} .
        BIND("Music Director" as ?crewRole)
      } UNION {
        # Cinematographer
        ?film wdt:P344 wd:${actorId} .
        BIND("Cinematographer" as ?crewRole)
      } UNION {
        # Editor
        ?film wdt:P1040 wd:${actorId} .
        BIND("Editor" as ?crewRole)
      }
      ?film wdt:P31 wd:Q11424 . # instance of film
      OPTIONAL { ?film wdt:P577 ?publicationDate . }
      OPTIONAL { ?film wdt:P345 ?imdbId . }
      OPTIONAL { ?film wdt:P364 ?language . } # original language
      BIND(YEAR(?publicationDate) as ?year)
      SERVICE wikibase:label { 
        bd:serviceParam wikibase:language "en,te" .
      }
    }
    ORDER BY ?year
  `;
  
  const result = await executeSPARQLQuery(filmsQuery);
  
  if (!result?.results?.bindings) {
    console.log(`Wikidata: No films found for actor ${actorId}`);
    return [];
  }
  
  const films: DiscoveredFilm[] = [];
  
  // Group films by title+year to handle multiple roles
  const filmMap = new Map<string, DiscoveredFilm>();
  
  for (const binding of result.results.bindings) {
    const filmLabel = binding.filmLabel?.value;
    const year = binding.year?.value;
    const roleLabel = binding.roleLabel?.value;
    const imdbId = binding.imdbId?.value;
    const languageLabel = binding.languageLabel?.value;
    const crewRole = binding.crewRole?.value;
    
    if (!filmLabel || !year) continue;
    
    const releaseYear = parseInt(year);
    if (isNaN(releaseYear)) continue;
    
    const key = `${filmLabel}-${releaseYear}`;
    
    // Determine role type (for cast roles)
    let role: 'hero' | 'heroine' | 'supporting' = 'supporting';
    if (roleLabel) {
      const roleLower = roleLabel.toLowerCase();
      if (roleLower.includes('lead') || roleLower.includes('protagonist')) {
        role = 'hero';
      }
    }
    
    // Collect crew roles
    const crewRoles: string[] = [];
    if (crewRole) {
      crewRoles.push(crewRole);
    }
    
    // Map language
    let language = 'Unknown';
    if (languageLabel) {
      const langLower = languageLabel.toLowerCase();
      if (langLower.includes('telugu')) language = 'Telugu';
      else if (langLower.includes('tamil')) language = 'Tamil';
      else if (langLower.includes('hindi')) language = 'Hindi';
      else if (langLower.includes('kannada')) language = 'Kannada';
      else if (langLower.includes('malayalam')) language = 'Malayalam';
      else language = languageLabel;
    }
    
    // Check if film already exists (same title+year)
    if (filmMap.has(key)) {
      const existing = filmMap.get(key)!;
      // Merge crew roles
      if (crewRoles.length > 0) {
        existing.crewRoles = [...(existing.crewRoles || []), ...crewRoles];
      }
      // Update role if this is a lead role
      if (role === 'hero' && existing.role === 'supporting') {
        existing.role = role;
      }
      // Update language if we have better info
      if (language !== 'Unknown' && existing.language === 'Unknown') {
        existing.language = language;
      }
    } else {
      filmMap.set(key, {
        title_en: filmLabel,
        release_year: releaseYear,
        role,
        sources: ['wikidata'],
        confidence: 0.80,
        imdb_id: imdbId || undefined,
        language,
        crewRoles: crewRoles.length > 0 ? crewRoles : undefined,
      });
    }
  }
  
  films.push(...Array.from(filmMap.values()));
  
  console.log(`Wikidata: Found ${films.length} films for "${actorName}"`);
  
  return films;
}
