import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeSlugForSearch } from '@/lib/utils/slugify';
import fs from 'fs';
import path from 'path';

// Ensure profile is always fresh (no cached filmography)
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface Collaborator {
  name: string;
  count: number;
  avg_rating: number;
  movies: Array<{ title: string; year: number; slug: string; rating?: number }>;
}

interface CollaboratorsByRole {
  directors: Collaborator[];
  music_directors: Collaborator[];
  cinematographers: Collaborator[];
  writers: Collaborator[];
  editors: Collaborator[];
  producers: Collaborator[];
  heroes: Collaborator[];
  heroines: Collaborator[];
}

interface Milestone {
  title: string;
  year: number;
  slug: string;
  rating?: number;
  category?: string;
}

interface RoleStats {
  count: number;
  movies: Array<{
    id: string;
    title: string;
    year: number;
    slug: string;
    rating?: number;
    poster_url?: string;
    is_blockbuster?: boolean;
    is_classic?: boolean;
    role_type?: string;
    character?: string;
    role?: string;
    roles?: string[];
    language?: string;
  }>;
  first_year?: number;
  last_year?: number;
  avg_rating?: number;
  hit_rate?: number;
  blockbusters?: number;
}

interface FamilyMember {
  name: string;
  slug?: string;
  relation: string;
}

interface Pairing {
  name: string;
  slug?: string;
  count: number;
  highlight?: string;
  films?: string[];
}

interface ActorEra {
  name: string;
  years: string;
  themes: string[];
  key_films: string[];
  movie_count?: number;
}

interface CareerStats {
  total_movies: number;
  first_year: number;
  last_year: number;
  decades_active: number;
  avg_rating: number;
  hit_rate: number;
  blockbusters: number;
  classics: number;
}

interface SocialLink {
  platform: string;
  url: string;
  handle?: string;
}

interface SignatureDialogue {
  dialogue: string;
  movie_slug?: string;
  movie_title?: string;
  year?: number;
}

interface ProfileResponse {
  person: {
    slug: string;
    name: string;
    name_te?: string; // Telugu name
    image_url?: string;
    industry_title?: string;
    usp?: string;
    brand_pillars?: string[];
    legacy_impact?: string;
    known_for?: string[];
    biography?: string;
    biography_te?: string; // Telugu biography
    social_links?: SocialLink[];
  };
  dynasty: {
    family_relationships: Record<string, FamilyMember | FamilyMember[]>;
    romantic_pairings: Pairing[];
  };
  roles: {
    actor: RoleStats;
    actress: RoleStats;
    director: RoleStats;
    producer: RoleStats;
    music_director: RoleStats;
    writer: RoleStats;
    supporting: RoleStats;
    cameo: RoleStats;
    villain?: RoleStats;
  };
  eras: ActorEra[];
  career_stats: CareerStats;
  achievements: {
    awards: Array<{ name: string; year?: number; category?: string; movie?: string }>;
    milestones: Milestone[];
    records: string[];
  };
  collaborators: CollaboratorsByRole;
  fan_culture: {
    fan_identity?: string;
    cultural_titles?: string[];
    viral_moments?: string[];
    trivia?: string[];
    entrepreneurial?: string[]; // Business ventures
    tech_edge?: string; // Unique technical/educational background
    signature_dialogues?: SignatureDialogue[]; // Famous dialogues
  };
  genre_distribution?: Array<{ genre: string; count: number; percentage: number }>;
  upcoming_projects?: Array<{ title: string; slug: string; status?: string; expected_year?: number }>;
  integrity_rules?: {
    exclude_movies?: string[];
    notes?: string[];
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function aggregateCollaborators(
  movies: Array<{
    title_en: string;
    release_year: number;
    slug: string;
    our_rating?: number;
    avg_rating?: number;
    [key: string]: unknown;
  }>,
  field: string
): Collaborator[] {
  const collabMap = new Map<string, { 
    count: number; 
    ratings: number[];
    movies: Array<{ title: string; year: number; slug: string; rating?: number }>;
  }>();

  const splitNames = (s: string | null | undefined): string[] => {
    if (!s || s === 'N/A') return [];
    return s.split(',').map(n => n.trim()).filter(Boolean);
  };

  for (const movie of movies) {
    let names: string[];
    if (field === 'hero') {
      const arr = movie.heroes as string[] | null | undefined;
      names = Array.isArray(arr) && arr.length > 0 ? arr.filter(n => n && n !== 'N/A') : splitNames(movie.hero as string);
    } else if (field === 'heroine') {
      const arr = movie.heroines as string[] | null | undefined;
      names = Array.isArray(arr) && arr.length > 0 ? arr.filter(n => n && n !== 'N/A') : splitNames(movie.heroine as string);
    } else {
      const name = movie[field] as string | null;
      names = name ? splitNames(name) : [];
    }
    const rating = movie.our_rating || movie.avg_rating;
    for (const name of names) {
      if (!name) continue;
      const existing = collabMap.get(name);
      if (existing) {
        existing.count++;
        if (rating) existing.ratings.push(rating);
        existing.movies.push({
          title: movie.title_en,
          year: movie.release_year,
          slug: movie.slug,
          rating,
        });
      } else {
        collabMap.set(name, {
          count: 1,
          ratings: rating ? [rating] : [],
          movies: [{
            title: movie.title_en,
            year: movie.release_year,
            slug: movie.slug,
            rating,
          }],
        });
      }
    }
  }

  return Array.from(collabMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      avg_rating: data.ratings.length > 0
        ? Math.round((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) * 10) / 10
        : 0,
      movies: data.movies.sort((a, b) => b.year - a.year),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function calculateGenreDistribution(
  movies: Array<Record<string, unknown>>
): Array<{ genre: string; count: number; percentage: number }> {
  const genreCounts = new Map<string, number>();
  
  for (const movie of movies) {
    const movieGenre = movie.genre;
    if (!movieGenre) continue;
    
    let genres: string[] = [];
    if (Array.isArray(movieGenre)) {
      genres = movieGenre.filter((g): g is string => typeof g === 'string');
    } else if (typeof movieGenre === 'string') {
      genres = movieGenre.split(',').map(g => g.trim()).filter(Boolean);
    }
    
    for (const genre of genres) {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
    }
  }
  
  const total = Array.from(genreCounts.values()).reduce((a, b) => a + b, 0);
  
  return Array.from(genreCounts.entries())
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8 genres
}

function calculateRoleStats(
  movies: Array<{
    id: string;
    title_en: string;
    release_year: number;
    slug: string;
    our_rating?: number;
    avg_rating?: number;
    poster_url?: string;
    is_blockbuster?: boolean;
    is_classic?: boolean;
    role_type?: string;
    character?: string;
    language?: string;
  }>,
  roleName?: string,
  movieRolesMap?: Map<string, string[]>
): RoleStats {
  if (movies.length === 0) {
    return { count: 0, movies: [] };
  }

  const years = movies.map(m => m.release_year).filter((y): y is number => y !== null && y !== undefined);
  const ratings = movies
    .map(m => m.our_rating || m.avg_rating)
    .filter((r): r is number => r !== null && r !== undefined && r > 0);
  
  const hits = movies.filter(m => (m.our_rating || m.avg_rating || 0) >= 7).length;
  const blockbusters = movies.filter(m => m.is_blockbuster).length;

  return {
    count: movies.length,
    movies: movies.map(m => ({
      id: m.id,
      title: m.title_en,
      year: m.release_year,
      slug: m.slug,
      rating: m.our_rating || m.avg_rating,
      poster_url: m.poster_url,
      is_blockbuster: m.is_blockbuster,
      is_classic: m.is_classic,
      role_type: m.role_type ?? roleName ?? undefined,
      character: m.character,
      role: roleName,
      roles: movieRolesMap?.get(m.id) || (roleName ? [roleName] : []),
      language: m.language,
    })).sort((a, b) => b.year - a.year),
    first_year: years.length > 0 ? Math.min(...years) : undefined,
    last_year: years.length > 0 ? Math.max(...years) : undefined,
    avg_rating: ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : undefined,
    hit_rate: movies.length > 0
      ? Math.round((hits / movies.length) * 100)
      : undefined,
    blockbusters,
  };
}

// ============================================================
// MAIN API HANDLER
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: 'Profile slug is required' }, { status: 400 });
  }

  try {
    // Step 1: Try to find celebrity by slug in celebrities table
    // Try exact match first
    let celebrity = null;
    let celebrityError = null;
    
    const { data: exactMatch } = await supabase
      .from('celebrities')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (exactMatch) {
      celebrity = exactMatch;
    } else {
      // Try with 'celeb-' prefix (e.g., 'teja' -> 'celeb-teja')
      const { data: prefixMatch } = await supabase
        .from('celebrities')
        .select('*')
        .eq('slug', `celeb-${slug}`)
        .single();
      
      if (prefixMatch) {
        celebrity = prefixMatch;
      } else {
        // Try slug_aliases (e.g., 'akkineni-nagarjuna' -> finds profile with slug 'nagarjuna')
        const { data: aliasMatch } = await supabase
          .from('celebrities')
          .select('*')
          .contains('slug_aliases', [slug])
          .single();
        
        if (aliasMatch) {
          celebrity = aliasMatch;
        }
      }
    }

    // Step 2: If not found in celebrities table, search by name pattern in movies
    let personName = celebrity?.name || celebrity?.name_en;
    let personData = celebrity;

    if (!personName) {
      // Search movies to find the person's name from slug
      const searchPattern = normalizeSlugForSearch(slug);
      
      // Also include writer field for screenwriters like Paruchuri Brothers
      const { data: sampleMovies } = await supabase
        .from('movies')
        .select('hero, heroine, director, music_director, producer, writer')
        .eq('is_published', true)
        .or(`hero.ilike.${searchPattern},heroine.ilike.${searchPattern},director.ilike.${searchPattern},music_director.ilike.${searchPattern},producer.ilike.${searchPattern},writer.ilike.${searchPattern}`)
        .limit(5);

      if (sampleMovies && sampleMovies.length > 0) {
        // Find which field actually matches the slug pattern across all sample movies
        // Prioritize: directors > music_directors > writers > heroes > heroines > producers
        // This helps disambiguate when searching for a director named "Teja" vs actor "Ravi Teja"
        const fields = ['director', 'music_director', 'writer', 'hero', 'heroine', 'producer'];
        const slugNormalized = slug.toLowerCase().replace(/-/g, '');
        
        // Phase 1: Try exact match first (highest priority)
        for (const movie of sampleMovies) {
          for (const field of fields) {
            const value = movie[field as keyof typeof movie] as string;
            if (value) {
              const valueNormalized = value.toLowerCase().replace(/[^a-z0-9]+/g, '');
              // EXACT match only
              if (valueNormalized === slugNormalized) {
                personName = value;
                break;
              }
            }
          }
          if (personName) break;
        }
        
        // Phase 2: If no exact match, try word-boundary matches
        if (!personName) {
          for (const movie of sampleMovies) {
            for (const field of fields) {
              const value = movie[field as keyof typeof movie] as string;
              if (value) {
                const valueNormalized = value.toLowerCase().replace(/[^a-z0-9]+/g, '');
                // Only match if slug is a complete word in the value (starts or ends with it)
                // This prevents "teja" from matching "raviteja"
                if (valueNormalized.startsWith(slugNormalized) || 
                    valueNormalized.endsWith(slugNormalized)) {
                  personName = value;
                  break;
                }
              }
            }
            if (personName) break;
          }
        }
        
        // Fallback: check if any field contains all parts of the slug
        if (!personName) {
          const slugParts = slug.split('-').filter(p => p.length > 2);
          for (const movie of sampleMovies) {
            for (const field of fields) {
              const value = movie[field as keyof typeof movie] as string;
              if (value) {
                const valueLower = value.toLowerCase();
                // Check if all significant slug parts are in the value
                if (slugParts.every(part => valueLower.includes(part))) {
                  personName = value;
                  break;
                }
              }
            }
            if (personName) break;
          }
        }
      }
    }

    if (!personName) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    // Step 3: Fetch all movies where this person appears in any role
    // Part A: Query movies where person appears in main fields
    // Use ilike to catch multi-cast movies (e.g., "Krishna, Sobhan Babu")
    // and name variations (e.g., "Akkineni Nagarjuna" vs "Nagarjuna Akkineni")
    
    // IMPORTANT: Use the LAST word of the name for broader matching
    // "Akkineni Nagarjuna" -> search for "Nagarjuna" to catch all variations:
    //   - "Akkineni Nagarjuna" ✅
    //   - "Nagarjuna Akkineni" ✅
    //   - "Nagarjuna" ✅
    //   - "Nani, Nagarjuna" ✅
    // Then we filter precisely using the full name in the next step
    
    // Special handling for S. Rajinikanth vs Rajinikanth distinction
    // If slug is "s-rajinikanth", we want to match "S. Rajinikanth" (producer) only
    // If slug is "rajinikanth", we want to match "Rajinikanth" (actor) only, excluding "S. Rajinikanth"
    const isSRajinikanth = slug === 's-rajinikanth' || personName?.toLowerCase().startsWith('s. rajini') || personName?.toLowerCase().startsWith('s rajini');
    const isActorRajinikanth = slug === 'rajinikanth' && !isSRajinikanth;
    
    let searchTerm: string;
    if (isSRajinikanth) {
      // For S. Rajinikanth (producer), search for full name with "S." prefix
      searchTerm = 's. rajini'; // Match "S. Rajinikanth" or "S Rajinikanth"
    } else {
      // For regular names, use last word
      searchTerm = personName!.split(/\s+/).pop() || personName!;
    }
    
    console.log(`[PROFILE API] Using searchTerm: "${searchTerm}" for personName: "${personName}" (isSRajinikanth: ${isSRajinikanth}, isActorRajinikanth: ${isActorRajinikanth})`);
    
    const { data: mainMovies, error: moviesError } = await supabase
      .from('movies')
      .select(`
        id, title_en, title_te, slug, release_year, our_rating, avg_rating,
        poster_url, director, music_director, cinematographer, writer, editor, producer,
        is_blockbuster, is_classic, is_underrated, genres, era, tone,
        hero, heroine, heroes, heroines, supporting_cast, crew, awards, language
      `)
      .eq('is_published', true)
      // NO language filter - show all languages (Telugu, Hindi, Tamil, etc.)
      .or(`hero.ilike.%${searchTerm}%,heroine.ilike.%${searchTerm}%,director.ilike.%${searchTerm}%,music_director.ilike.%${searchTerm}%,producer.ilike.%${searchTerm}%,writer.ilike.%${searchTerm}%`);

    if (moviesError) {
      console.error('Error fetching movies:', moviesError);
      return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
    }

    // Part B: Movies where person appears ONLY in supporting_cast (supporting/cameo roles)
    const mainMovieIds = new Set((mainMovies || []).map(m => m.id));
    const personNameLower = personName!.toLowerCase();
    const searchWords = personNameLower.split(/\s+/).filter(w => w.length >= 2); // e.g. ['chiranjeevi']

    const personMatchesSupportingCast = (cast: any[]): boolean => {
      if (!Array.isArray(cast)) return false;
      for (const member of cast) {
        let memberName: string | null = null;
        if (typeof member === 'string') memberName = member;
        else if (typeof member === 'object' && member?.name) memberName = String(member.name);
        if (!memberName) continue;
        const mLower = memberName.toLowerCase();
        if (mLower.includes(personNameLower) || personNameLower.includes(mLower)) return true;
        if (searchWords.some(w => mLower.includes(w))) return true;
      }
      return false;
    };

    // Paginate: fetch all published movies with non-null supporting_cast (server may cap at 1000 per request)
    const PAGE_SIZE = 1000;
    let supportingCastMovies: any[] = [];
    let page = 0;
    let hasMore = true;
    while (hasMore) {
      const { data: pageData } = await supabase
        .from('movies')
        .select('id, title_en, title_te, slug, release_year, our_rating, avg_rating, poster_url, director, music_director, cinematographer, writer, editor, producer, is_blockbuster, is_classic, is_underrated, genres, era, tone, hero, heroine, supporting_cast, crew, awards, language')
        .eq('is_published', true)
        .not('supporting_cast', 'is', null)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      const rows = pageData || [];
      supportingCastMovies = supportingCastMovies.concat(rows);
      hasMore = rows.length === PAGE_SIZE;
      page += 1;
    }

    const additionalSupportingMovies = supportingCastMovies.filter(movie => {
      if (mainMovieIds.has(movie.id)) return false;
      const cast = Array.isArray(movie.supporting_cast) ? movie.supporting_cast : [];
      return personMatchesSupportingCast(cast);
    });

    // Filter out false positives from ilike query
    // Example: "Teja" should NOT match "Ravi Teja"
    const personNameLower2 = personName!.toLowerCase();
    
    // Known actor debut years - exclude pre-debut movies when matching only on producer
    const ACTOR_DEBUT_YEARS: Record<string, number> = {
      'rajinikanth': 1975,
      'shivaji rao gaekwad': 1975,
    };
    const actorDebutYear = ACTOR_DEBUT_YEARS[personNameLower2] || null;
    
    // Load name disambiguation rules for confirmed different persons
    let disambiguationRules: any = null;
    try {
      const disambiguationPath = path.join(process.cwd(), 'lib/utils/name-disambiguation.json');
      disambiguationRules = JSON.parse(fs.readFileSync(disambiguationPath, 'utf-8'));
    } catch (e) {
      // Disambiguation file not found or invalid - continue without it
      console.log('[PROFILE API] Disambiguation map not available');
    }
    
    const filteredMainMovies = (mainMovies || []).filter(movie => {
      // Apply disambiguation rules for confirmed different persons
      if (disambiguationRules) {
        const normalizedName = personNameLower2.replace(/\s+/g, ' ').trim();
        const disambiguation = disambiguationRules[normalizedName];
        
        if (disambiguation && disambiguation.isDifferentPerson) {
          // Check if this movie matches the exclusion rules
          for (const rule of disambiguation.rules || []) {
            const matchesCondition = 
              (rule.condition === 'director' && movie.director?.toLowerCase().includes(normalizedName)) ||
              (rule.condition === 'hero' && movie.hero?.toLowerCase().includes(normalizedName)) ||
              (rule.condition === 'producer' && movie.producer?.toLowerCase().includes(normalizedName)) ||
              (rule.condition === 'music_director' && movie.music_director?.toLowerCase().includes(normalizedName));
            
            if (matchesCondition && rule.years) {
              const movieYear = movie.release_year;
              // If movie year matches exclusion rule, check if we should exclude it
              // This is a simplified check - full implementation would need more context
              // For now, we'll rely on the role-based filtering below
            }
          }
        }
      }
      
      // Special handling for S. Rajinikanth (producer) vs Rajinikanth (actor) distinction
      if (isSRajinikanth) {
        // For S. Rajinikanth profile, ONLY show movies where producer is "S. Rajinikanth"
        // Exclude movies where hero/director is "Rajinikanth" (the actor)
        const producerMatch = movie.producer?.toLowerCase().includes('s. rajini') || movie.producer?.toLowerCase().includes('s rajini');
        const heroMatch = movie.hero?.toLowerCase().includes('rajinikanth') && !movie.hero?.toLowerCase().includes('s. rajini') && !movie.hero?.toLowerCase().includes('s rajini');
        const directorMatch = movie.director?.toLowerCase().includes('rajinikanth') && !movie.director?.toLowerCase().includes('s. rajini') && !movie.director?.toLowerCase().includes('s rajini');
        
        // Only include if producer matches, exclude if only hero/director matches (that's actor Rajinikanth)
        if (heroMatch || directorMatch) {
          if (!producerMatch) {
            return false; // Exclude actor Rajinikanth movies from S. Rajinikanth profile
          }
        }
        // If producer matches, include it
        if (!producerMatch) {
          return false; // Only show movies where S. Rajinikanth is producer
        }
      } else if (isActorRajinikanth) {
        // For actor Rajinikanth profile, exclude "S. Rajinikanth" (producer) matches
        const producerIsSRajini = movie.producer?.toLowerCase().includes('s. rajini') || movie.producer?.toLowerCase().includes('s rajini');
        const matchesHero = movie.hero?.toLowerCase().includes('rajinikanth') && !movie.hero?.toLowerCase().includes('s. rajini') && !movie.hero?.toLowerCase().includes('s rajini');
        const matchesDirector = movie.director?.toLowerCase().includes('rajinikanth') && !movie.director?.toLowerCase().includes('s. rajini') && !movie.director?.toLowerCase().includes('s rajini');
        
        // Exclude if only producer matches (that's S. Rajinikanth, not actor)
        if (producerIsSRajini && !matchesHero && !matchesDirector) {
          return false; // Exclude S. Rajinikanth producer movies from actor profile
        }
      }

      // Chiranjeevi (Megastar) vs Chiranjeevi Sarja (Kannada actor) – exclude Sarja's films from Megastar profile
      if (personNameLower2.includes('chiranjeevi') && !personNameLower2.includes('sarja')) {
        const heroLower = (movie.hero || '').toLowerCase();
        if (heroLower.includes('chiranjeevi') && heroLower.includes('sarja')) {
          return false; // e.g. Aatagara (2015) – stars Chiranjeevi Sarja, not Megastar
        }
      }

      // Krishna (actor Ghattamaneni) – exclude other "Krishna" namesakes from actor Krishna profile
      // When slug is "krishna" and personName is "Krishna", exclude: Krishna Vamsi (director), Ramya Krishna (heroine), Krishnam Raju (hero), SV Krishna Reddy (director)
      if (slug === 'krishna' && personNameLower2 === 'krishna') {
        const directorLower = (movie.director || '').toLowerCase();
        const writerLower = (movie.writer || '').toLowerCase();
        const producerLower = (movie.producer || '').toLowerCase();
        const heroLower = (movie.hero || '').toLowerCase();
        const heroineLower = (movie.heroine || '').toLowerCase();
        const matchesDirectorVamsi = directorLower.includes('krishna') && directorLower.includes('vamsi');
        const matchesWriterVamsi = writerLower.includes('krishna') && writerLower.includes('vamsi');
        const matchesProducerVamsi = producerLower.includes('krishna') && producerLower.includes('vamsi');
        const matchesDirectorReddy = (directorLower.includes('krishna') && directorLower.includes('reddy')) || directorLower.includes('krishna reddy');
        const matchesWriterReddy = (writerLower.includes('krishna') && writerLower.includes('reddy')) || writerLower.includes('krishna reddy');
        const matchesProducerReddy = (producerLower.includes('krishna') && producerLower.includes('reddy')) || producerLower.includes('krishna reddy');
        const matchesHero = heroLower.includes('krishna');
        const matchesHeroine = heroineLower.includes('krishna');
        // Exclude if only director/writer/producer matches Krishna Vamsi (not hero/heroine)
        if ((matchesDirectorVamsi || matchesWriterVamsi || matchesProducerVamsi) && !matchesHero && !matchesHeroine) {
          return false; // Krishna Vamsi (director) – not actor Krishna
        }
        // Exclude if only director/writer/producer matches SV Krishna Reddy (not hero/heroine)
        if ((matchesDirectorReddy || matchesWriterReddy || matchesProducerReddy) && !matchesHero && !matchesHeroine) {
          return false; // SV Krishna Reddy (director) – not actor Krishna
        }
        // Exclude if only heroine matches Ramya Krishna (hero does not have Krishna)
        if (heroineLower.includes('ramya') && heroineLower.includes('krishna') && !heroLower.includes('krishna')) {
          return false; // Ramya Krishna (heroine) – not actor Krishna
        }
        // Exclude if only hero matches Krishnam Raju (the only "krishna" in hero is inside "Krishnam Raju")
        if (heroLower.includes('krishnam raju') && !heroLower.replace(/krishnam raju/g, '').includes('krishna')) {
          return false; // Krishnam Raju (hero) – not actor Krishna
        }
      }

      // Ramya Krishna (actress) – exclude actor Krishna, Krishnam Raju, Krishna Vamsi, SV Krishna Reddy from her profile
      if ((slug === 'ramya-krishna' || slug === 'ramya-krishnan') && personNameLower2.includes('ramya') && personNameLower2.includes('krishna')) {
        const directorLower = (movie.director || '').toLowerCase();
        const writerLower = (movie.writer || '').toLowerCase();
        const producerLower = (movie.producer || '').toLowerCase();
        const heroLower = (movie.hero || '').toLowerCase();
        const heroineLower = (movie.heroine || '').toLowerCase();
        const matchesDirectorVamsi = directorLower.includes('krishna') && directorLower.includes('vamsi');
        const matchesDirectorReddy = (directorLower.includes('krishna') && directorLower.includes('reddy')) || directorLower.includes('krishna reddy');
        const matchesHeroineRamya = heroineLower.includes('ramya') && heroineLower.includes('krishna');
        // Exclude if only hero has Krishna (actor) and heroine is not Ramya Krishna
        if (heroLower.includes('krishna') && !matchesHeroineRamya) {
          return false; // Actor Krishna's movie – not Ramya Krishna
        }
        // Exclude if only hero has Krishnam Raju (no Ramya Krishna in cast)
        if (heroLower.includes('krishnam raju') && !matchesHeroineRamya) {
          return false; // Krishnam Raju's movie – not Ramya Krishna
        }
        // Exclude if only director/writer/producer matches Krishna Vamsi or SV Krishna Reddy (not heroine Ramya Krishna)
        if ((matchesDirectorVamsi || matchesDirectorReddy) && !matchesHeroineRamya) {
          return false; // Director-only match – not Ramya Krishna
        }
      }

      // Krishnam Raju (actor) – exclude actor Krishna, Ramya Krishna, Krishna Vamsi, SV Krishna Reddy from his profile
      if (slug === 'krishnam-raju' && personNameLower2.includes('krishnam') && personNameLower2.includes('raju')) {
        const directorLower = (movie.director || '').toLowerCase();
        const writerLower = (movie.writer || '').toLowerCase();
        const producerLower = (movie.producer || '').toLowerCase();
        const heroLower = (movie.hero || '').toLowerCase();
        const heroineLower = (movie.heroine || '').toLowerCase();
        const matchesDirectorVamsi = directorLower.includes('krishna') && directorLower.includes('vamsi');
        const matchesDirectorReddy = (directorLower.includes('krishna') && directorLower.includes('reddy')) || directorLower.includes('krishna reddy');
        const matchesHeroKrishnam = heroLower.includes('krishnam') && heroLower.includes('raju');
        const matchesHeroineRamya = heroineLower.includes('ramya') && heroineLower.includes('krishna');
        // Exclude if only hero has actor Krishna (not Krishnam Raju)
        if (heroLower.includes('krishna') && !heroLower.includes('krishnam raju')) {
          return false; // Actor Krishna – not Krishnam Raju
        }
        // Exclude if only heroine has Ramya Krishna (hero is not Krishnam Raju)
        if (matchesHeroineRamya && !matchesHeroKrishnam) {
          return false; // Ramya Krishna's movie – not Krishnam Raju
        }
        // Exclude if only director/writer/producer matches Krishna Vamsi or SV Krishna Reddy (not hero Krishnam Raju)
        if ((matchesDirectorVamsi || matchesDirectorReddy) && !matchesHeroKrishnam) {
          return false; // Director-only match – not Krishnam Raju
        }
      }

      // SV Krishna Reddy (director) – exclude actor Krishna, Ramya Krishna, Krishnam Raju from his profile (show only director/writer/producer matches)
      const svKrishnaReddySlug = slug === 'sv-krishna-reddy' || slug === 's-v-krishna-reddy';
      if (svKrishnaReddySlug && personNameLower2.includes('krishna') && personNameLower2.includes('reddy')) {
        const directorLower = (movie.director || '').toLowerCase();
        const writerLower = (movie.writer || '').toLowerCase();
        const producerLower = (movie.producer || '').toLowerCase();
        const heroLower = (movie.hero || '').toLowerCase();
        const heroineLower = (movie.heroine || '').toLowerCase();
        const matchesDirectorReddy = (directorLower.includes('krishna') && directorLower.includes('reddy')) || directorLower.includes('krishna reddy');
        const matchesWriterReddy = (writerLower.includes('krishna') && writerLower.includes('reddy')) || writerLower.includes('krishna reddy');
        const matchesProducerReddy = (producerLower.includes('krishna') && producerLower.includes('reddy')) || producerLower.includes('krishna reddy');
        const matchesCrewReddy = matchesDirectorReddy || matchesWriterReddy || matchesProducerReddy;
        // Exclude if only hero/heroine has "Krishna" (actor Krishna, Ramya Krishna, Krishnam Raju) and crew does not have SV Krishna Reddy
        if (!matchesCrewReddy && (heroLower.includes('krishna') || heroineLower.includes('krishna'))) {
          return false; // Actor/actress match – not SV Krishna Reddy (director)
        }
      }
      
      // Special handling: Exclude pre-debut movies that only match on producer field
      // This prevents "S. Rajinikanth" (producer) from appearing in actor Rajinikanth's filmography
      if (actorDebutYear && movie.release_year && movie.release_year < actorDebutYear) {
        // Check if match is ONLY on producer (not hero, director, etc.)
        const matchesHero = movie.hero?.toLowerCase().includes(personNameLower2);
        const matchesHeroine = movie.heroine?.toLowerCase().includes(personNameLower2);
        const matchesDirector = movie.director?.toLowerCase().includes(personNameLower2);
        const matchesMusic = movie.music_director?.toLowerCase().includes(personNameLower2);
        const matchesWriter = movie.writer?.toLowerCase().includes(personNameLower2);
        const matchesProducer = movie.producer?.toLowerCase().includes(personNameLower2);
        
        // If only producer matches (and it's pre-debut), exclude it
        // This handles cases like "S. Rajinikanth" (producer) vs "Rajinikanth" (actor)
        if (matchesProducer && !matchesHero && !matchesHeroine && !matchesDirector && !matchesMusic && !matchesWriter) {
          return false; // Exclude pre-debut movies that only match on producer
        }
      }
      
      const fields = [
        movie.hero,
        movie.heroine,
        movie.director,
        movie.music_director,
        movie.producer,
        movie.writer,
        ...(Array.isArray(movie.heroes) ? movie.heroes : []),
        ...(Array.isArray(movie.heroines) ? movie.heroines : []),
      ];
      return fields.some(field => {
        if (!field) return false;
        
        const fieldLower = field.toLowerCase();
        
        // Check if person name appears as:
        // 1. Exact match
        if (fieldLower === personNameLower2) return true;
        
        // 2. In a comma-separated list (e.g., "Krishna, Sobhan Babu")
        const names = fieldLower.split(',').map(n => n.trim());
        if (names.some(n => n === personNameLower2)) return true;
        
        // 3. FLEXIBLE word matching - handles any word order!
        // This allows "Akkineni Nagarjuna" to match "Nagarjuna Akkineni"
        const nameWords = personNameLower2.split(/\s+/).filter(w => w.length > 0);
        const fieldWords = fieldLower.split(/[\s,]+/).filter(w => w.length > 0);
        
        // Split field by commas to handle multi-cast (e.g., "Nani, Nagarjuna")
        const fieldNames = fieldLower.split(',').map(n => n.trim());
        
        for (const fieldName of fieldNames) {
          const fieldNameWords = fieldName.split(/\s+/).filter(w => w.length > 0);
          
          // Check if ALL words from person name exist in this field name (any order)
          const allWordsPresent = nameWords.every(nameWord => 
            fieldNameWords.includes(nameWord)
          );
          
          // Also check if field name is just a subset (e.g., "Nagarjuna" matches when searching "Akkineni Nagarjuna")
          const isSubset = fieldNameWords.every(fieldWord => 
            nameWords.includes(fieldWord)
          ) && fieldNameWords.length > 0;
          
          if (allWordsPresent || isSubset) {
            // Additional check: prevent "Teja" from matching "Ravi Teja"
            // by ensuring the shortest name has at least 2 words OR is 8+ chars
            const shortestName = nameWords.length < fieldNameWords.length ? nameWords : fieldNameWords;
            if (shortestName.length >= 2 || shortestName[0].length >= 8) {
              return true;
            }
          }
        }
        
        return false;
      });
    });

    // Combine all movies
    const allMovies = [...filteredMainMovies, ...additionalSupportingMovies];

    // Apply integrity rules if celebrity data exists
    let filteredMovies = allMovies;
    const integrityRules = personData?.integrity_rules as { exclude_movies?: string[]; notes?: string[] } | null;
    
    if (integrityRules?.exclude_movies) {
      filteredMovies = filteredMovies.filter(
        m => !integrityRules.exclude_movies!.includes(m.slug)
      );
    }

    // Step 4: Categorize movies by role
    // IMPORTANT: Use flexible matching (same as filter logic) instead of simple .includes()
    // This handles "Nagarjuna", "Nagarjuna Akkineni", "Akkineni Nagarjuna" all matching
    
    const matchesPersonInField = (field: string | null | undefined): boolean => {
      if (!field) return false;
      const fieldLower = field.toLowerCase();
      const personLower = personName!.toLowerCase();
      
      // Quick check: if it doesn't contain any word from person name, skip
      const personWords = personLower.split(/\s+/);
      if (!personWords.some(word => fieldLower.includes(word))) {
        return false;
      }
      
      // Exact match
      if (fieldLower === personLower) return true;
      
      // In comma-separated list
      const names = fieldLower.split(',').map(n => n.trim());
      if (names.some(n => n === personLower)) return true;
      
      // Flexible word matching
      const nameWords = personLower.split(/\s+/).filter(w => w.length > 0);
      const fieldNames = fieldLower.split(',').map(n => n.trim());
      
      for (const fieldName of fieldNames) {
        const fieldNameWords = fieldName.split(/\s+/).filter(w => w.length > 0);
        
        const allWordsPresent = nameWords.every(nameWord => 
          fieldNameWords.includes(nameWord)
        );
        
        const isSubset = fieldNameWords.every(fieldWord => 
          nameWords.includes(fieldWord)
        ) && fieldNameWords.length > 0;
        
        if (allWordsPresent || isSubset) {
          const shortestName = nameWords.length < fieldNameWords.length ? nameWords : fieldNameWords;
          if (shortestName.length >= 2 || shortestName[0].length >= 8) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    const actorMovies = filteredMovies.filter(m =>
      matchesPersonInField(m.hero) || (Array.isArray(m.heroes) && m.heroes.some(h => matchesPersonInField(h)))
    );
    const actressMovies = filteredMovies.filter(m =>
      matchesPersonInField(m.heroine) || (Array.isArray(m.heroines) && m.heroines.some(h => matchesPersonInField(h)))
    );
    const directorMovies = filteredMovies.filter(m => matchesPersonInField(m.director));
    const producerMovies = filteredMovies.filter(m => matchesPersonInField(m.producer));
    const musicDirectorMovies = filteredMovies.filter(m => matchesPersonInField(m.music_director));
    const writerMovies = filteredMovies.filter(m => matchesPersonInField(m.writer));

    // Check supporting cast for cameos, supporting, and villain roles
    // Extended type to include role_type and character for supporting/cameo/villain movies
    type MovieWithRole = typeof filteredMovies[0] & { role_type?: string; character?: string };
    const supportingMovies: MovieWithRole[] = [];
    const cameoMovies: MovieWithRole[] = [];
    const villainMovies: MovieWithRole[] = [];
    
    for (const movie of filteredMovies) {
      if (!movie.supporting_cast) continue;
      const cast = Array.isArray(movie.supporting_cast) ? movie.supporting_cast : [];
      
      for (const member of cast) {
        let memberName: string | null = null;
        if (typeof member === 'string') memberName = member;
        else if (typeof member === 'object' && member?.name) memberName = String(member.name);
        if (!memberName) continue;
        const mLower = memberName.toLowerCase();
        const pLower = personName!.toLowerCase();
        const matches = mLower.includes(pLower) || pLower.includes(mLower) || pLower.split(/\s+/).some(w => w.length >= 2 && mLower.includes(w));
        if (!matches) continue;
        const memberType = (typeof member === 'object' && member?.type) ? String(member.type).toLowerCase() : '';
        if (memberType === 'villain' || memberType === 'antagonist') {
          villainMovies.push({ ...movie, role_type: 'villain', character: typeof member === 'object' ? member.role : undefined });
        } else if (member.type === 'cameo' || member.type === 'special') {
          cameoMovies.push({ ...movie, role_type: 'cameo', character: typeof member === 'object' ? member.role : undefined });
        } else {
          supportingMovies.push({ ...movie, role_type: 'supporting', character: typeof member === 'object' ? member.role : undefined });
        }
        break;
      }
    }

    // Step 5: Create a map of movie_id -> roles[] for multi-role handling
    const movieRoles = new Map<string, string[]>();
    
    // Collect all roles for each movie
    [
      { movies: actorMovies, role: 'actor' },
      { movies: actressMovies, role: 'actress' },
      { movies: directorMovies, role: 'director' },
      { movies: producerMovies, role: 'producer' },
      { movies: musicDirectorMovies, role: 'music_director' },
      { movies: writerMovies, role: 'writer' },
      { movies: supportingMovies, role: 'supporting' },
      { movies: cameoMovies, role: 'cameo' },
      { movies: villainMovies, role: 'villain' },
    ].forEach(({ movies, role }) => {
      movies.forEach(m => {
        const existing = movieRoles.get(m.id) || [];
        existing.push(role);
        movieRoles.set(m.id, existing);
      });
    });

    // Step 6: Calculate role stats with role information
    const roles = {
      actor: calculateRoleStats(actorMovies, 'actor', movieRoles),
      actress: calculateRoleStats(actressMovies, 'actress', movieRoles),
      director: calculateRoleStats(directorMovies, 'director', movieRoles),
      producer: calculateRoleStats(producerMovies, 'producer', movieRoles),
      music_director: calculateRoleStats(musicDirectorMovies, 'music_director', movieRoles),
      writer: calculateRoleStats(writerMovies, 'writer', movieRoles),
      supporting: calculateRoleStats(supportingMovies, 'supporting', movieRoles),
      cameo: calculateRoleStats(cameoMovies, 'cameo', movieRoles),
      villain: villainMovies.length > 0 ? calculateRoleStats(villainMovies, 'villain', movieRoles) : undefined,
    };

    // Step 7: Aggregate collaborators (for actors, use their movies)
    const primaryMovies = actorMovies.length > 0 ? actorMovies : 
                          actressMovies.length > 0 ? actressMovies : 
                          directorMovies.length > 0 ? directorMovies :
                          writerMovies.length > 0 ? writerMovies :
                          filteredMovies;

    const collaborators: CollaboratorsByRole = {
      directors: aggregateCollaborators(primaryMovies, 'director'),
      music_directors: aggregateCollaborators(primaryMovies, 'music_director'),
      cinematographers: aggregateCollaborators(primaryMovies, 'cinematographer'),
      writers: aggregateCollaborators(primaryMovies, 'writer'),
      editors: aggregateCollaborators(primaryMovies, 'editor'),
      producers: aggregateCollaborators(primaryMovies, 'producer'),
      heroes: aggregateCollaborators(primaryMovies, 'hero'),
      heroines: aggregateCollaborators(primaryMovies, 'heroine'),
    };

    // Step 8: Calculate overall career stats
    const allRoleMovies = [...new Set([
      ...actorMovies,
      ...actressMovies,
      ...directorMovies,
      ...producerMovies,
      ...musicDirectorMovies,
      ...writerMovies,
      ...supportingMovies,
      ...cameoMovies,
      ...villainMovies,
    ].map(m => m.id))].map(id => filteredMovies.find(m => m.id === id)!);

    const years = allRoleMovies.map(m => m.release_year).filter((y): y is number => y !== null);
    const ratings = allRoleMovies
      .map(m => m.our_rating || m.avg_rating)
      .filter((r): r is number => r !== null && r > 0);
    
    const firstYear = years.length > 0 ? Math.min(...years) : 0;
    const lastYear = years.length > 0 ? Math.max(...years) : 0;
    const hits = allRoleMovies.filter(m => (m.our_rating || m.avg_rating || 0) >= 7).length;

    const career_stats: CareerStats = {
      total_movies: allRoleMovies.length,
      first_year: firstYear,
      last_year: lastYear,
      decades_active: firstYear && lastYear ? Math.ceil((lastYear - firstYear + 1) / 10) : 0,
      avg_rating: ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0,
      hit_rate: allRoleMovies.length > 0
        ? Math.round((hits / allRoleMovies.length) * 100)
        : 0,
      blockbusters: allRoleMovies.filter(m => m.is_blockbuster).length,
      classics: allRoleMovies.filter(m => m.is_classic).length,
    };

    // Step 9: Identify milestones
    const milestones: Milestone[] = [];
    
    // Top-rated movies
    const topRated = [...allRoleMovies]
      .filter(m => (m.our_rating || m.avg_rating || 0) >= 8)
      .sort((a, b) => (b.our_rating || b.avg_rating || 0) - (a.our_rating || a.avg_rating || 0))
      .slice(0, 5)
      .map(m => ({
        title: m.title_en,
        year: m.release_year,
        slug: m.slug,
        rating: m.our_rating || m.avg_rating,
        category: 'top_rated',
      }));
    milestones.push(...topRated);

    // Blockbusters
    const blockbusterMilestones = allRoleMovies
      .filter(m => m.is_blockbuster)
      .slice(0, 5)
      .map(m => ({
        title: m.title_en,
        year: m.release_year,
        slug: m.slug,
        rating: m.our_rating || m.avg_rating,
        category: 'blockbuster',
      }));
    milestones.push(...blockbusterMilestones);

    // Classics
    const classicMilestones = allRoleMovies
      .filter(m => m.is_classic)
      .slice(0, 5)
      .map(m => ({
        title: m.title_en,
        year: m.release_year,
        slug: m.slug,
        rating: m.our_rating || m.avg_rating,
        category: 'classic',
      }));
    milestones.push(...classicMilestones);

    // Step 9: Build response
    const known_for: string[] = [];
    if (actorMovies.length > 0) known_for.push('Actor');
    if (actressMovies.length > 0) known_for.push('Actress');
    if (directorMovies.length > 0) known_for.push('Director');
    if (writerMovies.length > 0) known_for.push('Writer');
    if (producerMovies.length > 0) known_for.push('Producer');
    if (musicDirectorMovies.length > 0) known_for.push('Music Director');

    // Fetch awards if celebrity exists
    let awards: Array<{ name: string; year?: number; category?: string; movie?: string }> = [];
    if (personData?.id) {
      const { data: awardData } = await supabase
        .from('celebrity_awards')
        .select('*')
        .eq('celebrity_id', personData.id)
        .order('year', { ascending: false })
        .limit(20);
      
      if (awardData) {
        awards = awardData.map((a: { name?: string; year?: number; category?: string; movie_title?: string }) => ({
          name: a.name || 'Award',
          year: a.year,
          category: a.category,
          movie: a.movie_title,
        }));
      }
    }

    // Calculate genre distribution from filmography
    const genreDistribution = calculateGenreDistribution(allMovies);
    
    // Get upcoming projects (movies with future release year or upcoming status)
    const currentYear = new Date().getFullYear();
    const upcomingProjects = allMovies
      .filter(m => m.release_year && m.release_year > currentYear)
      .slice(0, 5)
      .map(m => ({
        title: m.title_en,
        slug: m.slug,
        expected_year: m.release_year,
        status: 'upcoming',
      }));
    
    // Extract fan_culture with enhanced fields
    const rawFanCulture = personData?.fan_culture as Record<string, unknown> || {};
    const enhancedFanCulture: ProfileResponse['fan_culture'] = {
      fan_identity: rawFanCulture.fan_identity as string | undefined,
      cultural_titles: rawFanCulture.cultural_titles as string[] | undefined,
      viral_moments: rawFanCulture.viral_moments as string[] | undefined,
      trivia: rawFanCulture.trivia as string[] | undefined,
      entrepreneurial: rawFanCulture.entrepreneurial as string[] | undefined,
      tech_edge: rawFanCulture.tech_edge as string | undefined,
      signature_dialogues: rawFanCulture.signature_dialogues as SignatureDialogue[] | undefined,
    };

    const response: ProfileResponse & { governance?: object } = {
      person: {
        slug,
        name: personName,
        name_te: personData?.name_te as string | undefined,
        image_url: personData?.image_url || personData?.profile_image,
        industry_title: personData?.industry_title,
        usp: personData?.usp,
        brand_pillars: personData?.brand_pillars as string[] | undefined,
        legacy_impact: personData?.legacy_impact,
        known_for,
        biography: personData?.short_bio || personData?.full_bio || personData?.biography || rawFanCulture.biography as string | undefined,
        biography_te: (personData?.short_bio_te || personData?.full_bio_te || personData?.biography_te || rawFanCulture.biography_te) as string | undefined,
        social_links: (personData?.social_links || rawFanCulture.social_links) as SocialLink[] | undefined,
      },
      dynasty: {
        family_relationships: (personData?.family_relationships as Record<string, FamilyMember | FamilyMember[]>) || {},
        romantic_pairings: (personData?.romantic_pairings as Pairing[]) || [],
      },
      roles,
      eras: (personData?.actor_eras as ActorEra[]) || [],
      career_stats,
      achievements: {
        awards,
        milestones,
        records: [], // Future: add records like "First actor to..."
      },
      collaborators,
      fan_culture: enhancedFanCulture,
      genre_distribution: genreDistribution,
      upcoming_projects: upcomingProjects.length > 0 ? upcomingProjects : undefined,
      integrity_rules: integrityRules || undefined,
      // Governance data
      governance: personData ? {
        trust_score: personData.trust_score as number | undefined,
        confidence_tier: personData.confidence_tier as string | undefined,
        freshness_score: personData.freshness_score as number | undefined,
        last_verified_at: personData.last_verified_at as string | undefined,
        content_type: personData.content_type as string | undefined,
        is_disputed: personData.is_disputed as boolean | undefined,
        governance_flags: personData.governance_flags as string[] | undefined,
      } : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
