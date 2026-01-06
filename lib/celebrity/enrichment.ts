/**
 * Celebrity Enrichment Logic
 * Waterfall pattern: TMDB -> Wikipedia -> Wikidata -> AI
 */

import type {
  CelebrityProfile,
  CelebrityEnrichmentData,
  CelebrityAward,
  CelebrityTrivia,
  EnrichmentResult,
} from './types';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_UNLIMITED;

// Rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const RATE_LIMIT_MS = 300;

// ============================================================
// SOURCE 1: TMDB PERSON API
// ============================================================

export async function tryTMDBPerson(
  name: string,
  tmdbId?: number
): Promise<CelebrityEnrichmentData | null> {
  if (!TMDB_API_KEY) return null;

  try {
    let personId = tmdbId;

    // Search for person if no TMDB ID
    if (!personId) {
      const searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name)}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (!searchData.results || searchData.results.length === 0) return null;

      // Find best match (prefer Indian actors)
      const person = searchData.results.find(
        (p: any) => p.known_for_department === 'Acting'
      ) || searchData.results[0];
      personId = person.id;
    }

    // Get person details
    const detailsUrl = `https://api.themoviedb.org/3/person/${personId}?api_key=${TMDB_API_KEY}&append_to_response=movie_credits,images`;
    const detailsRes = await fetch(detailsUrl);
    const details = await detailsRes.json();

    if (details.success === false) return null;

    const result: CelebrityEnrichmentData = {
      tmdb_id: personId,
      name_en: details.name,
      gender: details.gender === 1 ? 'female' : details.gender === 2 ? 'male' : undefined,
      birth_date: details.birthday,
      death_date: details.deathday,
      birth_place: details.place_of_birth,
      short_bio: details.biography?.substring(0, 500),
      full_bio: details.biography,
      imdb_id: details.imdb_id,
      profile_image: details.profile_path
        ? `https://image.tmdb.org/t/p/w500${details.profile_path}`
        : undefined,
      profile_image_source: 'tmdb',
    };

    // Extract known for movies
    if (details.movie_credits?.cast) {
      const topMovies = details.movie_credits.cast
        .filter((m: any) => m.original_language === 'te')
        .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 5)
        .map((m: any) => m.title);
      
      if (topMovies.length > 0) {
        result.known_for = topMovies;
      }

      // Find debut year
      const teluguMovies = details.movie_credits.cast
        .filter((m: any) => m.release_date && m.original_language === 'te')
        .sort((a: any, b: any) => 
          new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
        );
      
      if (teluguMovies.length > 0) {
        result.debut_year = new Date(teluguMovies[0].release_date).getFullYear();
        result.debut_movie = teluguMovies[0].title;
      }
    }

    return result;
  } catch (error) {
    console.error('TMDB Person error:', error);
    return null;
  }
}

// ============================================================
// SOURCE 2: WIKIPEDIA API
// ============================================================

export async function tryWikipediaBio(name: string): Promise<CelebrityEnrichmentData | null> {
  try {
    // Search Wikipedia
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/ /g, '_'))}`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'TeluguVibes/1.0' }
    });

    if (!res.ok) return null;

    const data = await res.json();

    if (data.type === 'disambiguation') return null;

    const result: CelebrityEnrichmentData = {
      short_bio: data.extract,
      wikipedia_url: data.content_urls?.desktop?.page,
    };

    // Try to get full article for more details
    const fullUrl = `https://en.wikipedia.org/api/rest_v1/page/mobile-sections/${encodeURIComponent(name.replace(/ /g, '_'))}`;
    const fullRes = await fetch(fullUrl, {
      headers: { 'User-Agent': 'TeluguVibes/1.0' }
    });

    if (fullRes.ok) {
      const fullData = await fullRes.json();
      
      // Extract sections
      const sections = fullData.remaining?.sections || [];
      
      for (const section of sections) {
        const sectionText = section.text || '';
        const sectionTitle = section.line?.toLowerCase() || '';

        // Extract education
        if (sectionTitle.includes('education') || sectionTitle.includes('early life')) {
          const eduMatch = sectionText.match(/(?:graduated from|studied at|attended)\s+([^.]+)/i);
          if (eduMatch) {
            result.education = eduMatch[1].replace(/<[^>]+>/g, '').trim();
          }
        }

        // Extract spouse info
        if (sectionTitle.includes('personal life') || sectionTitle.includes('family')) {
          const spouseMatch = sectionText.match(/(?:married to|wife|husband|spouse)\s+([^.(<]+)/i);
          if (spouseMatch) {
            result.spouse = spouseMatch[1].replace(/<[^>]+>/g, '').trim();
          }
        }
      }

      // Build full bio from lead sections
      const leadSections = fullData.lead?.sections || [];
      if (leadSections.length > 0) {
        result.full_bio = leadSections
          .map((s: any) => s.text?.replace(/<[^>]+>/g, '') || '')
          .join('\n\n')
          .substring(0, 5000);
      }
    }

    return result;
  } catch (error) {
    console.error('Wikipedia error:', error);
    return null;
  }
}

// ============================================================
// SOURCE 3: WIKIDATA SPARQL
// ============================================================

export async function tryWikidataInfo(wikidataId: string): Promise<CelebrityEnrichmentData | null> {
  if (!wikidataId) return null;

  try {
    const query = `
      SELECT ?person ?personLabel ?birthDate ?birthPlaceLabel ?spouseLabel ?childrenCount ?heightValue ?educationLabel ?awardLabel ?awardYear WHERE {
        BIND(wd:${wikidataId} AS ?person)
        
        OPTIONAL { ?person wdt:P569 ?birthDate. }
        OPTIONAL { ?person wdt:P19 ?birthPlace. }
        OPTIONAL { ?person wdt:P26 ?spouse. }
        OPTIONAL { ?person wdt:P1971 ?childrenCount. }
        OPTIONAL { ?person wdt:P2048 ?heightValue. }
        OPTIONAL { ?person wdt:P69 ?education. }
        OPTIONAL {
          ?person p:P166 ?awardStatement.
          ?awardStatement ps:P166 ?award.
          OPTIONAL { ?awardStatement pq:P585 ?awardYear. }
        }
        
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en,te". }
      }
      LIMIT 50
    `;

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'TeluguVibes/1.0' }
    });

    if (!res.ok) return null;

    const data = await res.json();
    const bindings = data.results?.bindings;

    if (!bindings || bindings.length === 0) return null;

    const first = bindings[0];
    const result: CelebrityEnrichmentData = {
      wikidata_id: wikidataId,
      birth_date: first.birthDate?.value?.split('T')[0],
      birth_place: first.birthPlaceLabel?.value,
      spouse: first.spouseLabel?.value,
      children_count: first.childrenCount?.value ? parseInt(first.childrenCount.value) : undefined,
      height: first.heightValue?.value ? `${first.heightValue.value} m` : undefined,
      education: first.educationLabel?.value,
    };

    // Collect awards
    const awards: CelebrityAward[] = [];
    const seenAwards = new Set<string>();
    
    for (const binding of bindings) {
      if (binding.awardLabel?.value) {
        const awardKey = `${binding.awardLabel.value}-${binding.awardYear?.value}`;
        if (!seenAwards.has(awardKey)) {
          seenAwards.add(awardKey);
          awards.push({
            celebrity_id: '', // Will be set later
            award_name: binding.awardLabel.value,
            award_type: detectAwardType(binding.awardLabel.value),
            year: binding.awardYear?.value 
              ? new Date(binding.awardYear.value).getFullYear() 
              : undefined,
            is_won: true,
            source: 'wikidata',
          });
        }
      }
    }

    if (awards.length > 0) {
      result.awards = awards;
    }

    return result;
  } catch (error) {
    console.error('Wikidata error:', error);
    return null;
  }
}

// ============================================================
// SOURCE 4: AI GENERATION (GROQ)
// ============================================================

export async function tryAIGeneration(
  celebrity: CelebrityProfile
): Promise<CelebrityEnrichmentData | null> {
  if (!GROQ_API_KEY) return null;

  try {
    const { default: Groq } = await import('groq-sdk');
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    const prompt = `You are a Telugu cinema historian. Generate factual information about ${celebrity.name_en}, a Telugu film ${celebrity.occupation?.join(', ') || 'actor'}.

Based on your knowledge, provide the following in JSON format:
{
  "nicknames": ["list of popular nicknames"],
  "signature_style": "brief description of their acting/working style",
  "known_for": ["top 3-5 iconic movies"],
  "trivia": [
    {"text": "interesting fact 1", "category": "career"},
    {"text": "interesting fact 2", "category": "personal"},
    {"text": "interesting fact 3", "category": "fun_fact"}
  ]
}

Only include information you are 90%+ confident about. If unsure, use empty arrays.
Respond with ONLY valid JSON, no other text.`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    const result: CelebrityEnrichmentData = {
      nicknames: parsed.nicknames || [],
      signature_style: parsed.signature_style,
      known_for: parsed.known_for || [],
    };

    // Convert trivia to proper format
    if (parsed.trivia && Array.isArray(parsed.trivia)) {
      result.trivia = parsed.trivia.map((t: any) => ({
        celebrity_id: celebrity.id,
        trivia_text: t.text,
        category: t.category || 'fun_fact',
        is_verified: false,
      }));
    }

    return result;
  } catch (error) {
    console.error('AI Generation error:', error);
    return null;
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function detectAwardType(awardName: string): CelebrityAward['award_type'] {
  const name = awardName.toLowerCase();
  if (name.includes('national') || name.includes('padma')) return 'national';
  if (name.includes('filmfare')) return 'filmfare';
  if (name.includes('nandi')) return 'nandi';
  if (name.includes('siima')) return 'siima';
  if (name.includes('cinemaa') || name.includes('maa')) return 'cinemaa';
  return 'other';
}

// ============================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================

export async function enrichCelebrity(
  celebrity: CelebrityProfile,
  options: { dryRun?: boolean } = {}
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    celebrity_id: celebrity.id,
    name: celebrity.name_en,
    source: 'none',
    data: {},
    fields_updated: [],
    awards_found: 0,
    trivia_found: 0,
  };

  console.log(`\n[${celebrity.name_en}]`);
  console.log(`  Current: tmdb=${celebrity.tmdb_id || 'null'}, wikidata=${celebrity.wikidata_id || 'null'}`);

  // 1. Try TMDB
  console.log('  Trying TMDB...');
  await delay(RATE_LIMIT_MS);
  const tmdbData = await tryTMDBPerson(celebrity.name_en, celebrity.tmdb_id);
  if (tmdbData) {
    result.source = 'tmdb';
    result.data = { ...result.data, ...tmdbData };
    console.log(`  ✓ TMDB: Found profile, bio: ${tmdbData.short_bio?.substring(0, 50)}...`);
  }

  // 2. Try Wikipedia
  console.log('  Trying Wikipedia...');
  await delay(RATE_LIMIT_MS);
  const wikiData = await tryWikipediaBio(celebrity.name_en);
  if (wikiData) {
    if (result.source === 'none') result.source = 'wikipedia';
    // Merge, preferring existing data
    result.data = {
      ...wikiData,
      ...result.data,
      full_bio: result.data.full_bio || wikiData.full_bio,
      wikipedia_url: wikiData.wikipedia_url || result.data.wikipedia_url,
    };
    console.log(`  ✓ Wikipedia: Found bio`);
  }

  // 3. Try Wikidata
  const wikidataId = celebrity.wikidata_id || result.data.wikidata_id;
  if (wikidataId) {
    console.log('  Trying Wikidata...');
    await delay(RATE_LIMIT_MS);
    const wikidataData = await tryWikidataInfo(wikidataId);
    if (wikidataData) {
      if (result.source === 'none') result.source = 'wikidata';
      result.data = {
        ...result.data,
        ...wikidataData,
        awards: [...(result.data.awards || []), ...(wikidataData.awards || [])],
      };
      result.awards_found = result.data.awards?.length || 0;
      console.log(`  ✓ Wikidata: Found ${result.awards_found} awards`);
    }
  }

  // 4. Try AI generation for missing fields
  if (!result.data.nicknames?.length || !result.data.trivia?.length) {
    console.log('  Trying AI generation...');
    await delay(RATE_LIMIT_MS);
    const aiData = await tryAIGeneration(celebrity);
    if (aiData) {
      if (result.source === 'none') result.source = 'ai';
      result.data = {
        ...result.data,
        nicknames: result.data.nicknames?.length ? result.data.nicknames : aiData.nicknames,
        signature_style: result.data.signature_style || aiData.signature_style,
        known_for: result.data.known_for?.length ? result.data.known_for : aiData.known_for,
        trivia: [...(result.data.trivia || []), ...(aiData.trivia || [])],
      };
      result.trivia_found = result.data.trivia?.length || 0;
      console.log(`  ✓ AI: Generated ${result.trivia_found} trivia items`);
    }
  }

  // Calculate fields updated
  const fieldsToCheck = [
    'name_en', 'short_bio', 'full_bio', 'birth_date', 'birth_place',
    'profile_image', 'tmdb_id', 'imdb_id', 'wikidata_id', 'wikipedia_url',
    'spouse', 'education', 'nicknames', 'known_for', 'signature_style',
  ];

  for (const field of fieldsToCheck) {
    if (result.data[field as keyof CelebrityEnrichmentData] !== undefined) {
      result.fields_updated.push(field);
    }
  }

  console.log(`  Result: source=${result.source}, fields=${result.fields_updated.length}, awards=${result.awards_found}, trivia=${result.trivia_found}`);

  return result;
}


