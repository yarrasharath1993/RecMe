#!/usr/bin/env npx tsx
/**
 * TEMPLATE-BASED SECTION GENERATION
 * 
 * Generates 9-section review structure (dimensions_json) for movies with rich metadata.
 * Uses template-based logic without AI calls - fast and free.
 * 
 * Sections generated:
 * 1. Synopsis - from synopsis field or generated from genres+cast
 * 2. Story & Screenplay - template based on genres and rating
 * 3. Performances - from cast_members array
 * 4. Direction & Technicals - from director, music_director, cinematographer
 * 5. Perspectives - audience vs critic template
 * 6. Why Watch - derived from genres, rating, awards
 * 7. Why Skip - honest negatives based on data gaps
 * 8. Cultural Impact - for classics and award winners
 * 9. Awards - formatted from awards JSONB
 * 10. Verdict - from our_rating and verdict field
 * 
 * Usage:
 *   npx tsx scripts/generate-template-sections.ts --dry --limit=10
 *   npx tsx scripts/generate-template-sections.ts --limit=500
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// TYPES
// ============================================================

interface CastMember {
  name: string;
  character?: string;
  order: number;
  gender?: number;
  tmdb_id?: number;
  profile_path?: string;
}

interface Award {
  type: string;
  name: string;
  category: string;
  year: number;
}

interface Movie {
  id: string;
  title_en: string;
  title_te?: string;
  slug: string;
  release_year?: number;
  genres: string[];
  director?: string;
  music_director?: string;
  cinematographer?: string;
  hero?: string;
  heroine?: string;
  synopsis?: string;
  our_rating?: number;
  verdict?: string;
  awards?: Award[];
  cast_members?: string[];
  is_classic?: boolean;
  is_blockbuster?: boolean;
  box_office_category?: string;
}

interface LeadActor {
  name: string;
  analysis: string;
  career_significance: string;
  score: number;
}

interface EditorialReviewV2 {
  _type: 'editorial_review_v2';
  synopsis: {
    en: string;
    te?: string;
    spoiler_free: boolean;
  };
  story_screenplay: {
    narrative_strength: string;
    story_score: number;
    pacing_analysis: string;
    pacing_score: number;
    emotional_engagement: string;
    emotional_score: number;
    originality_score: number;
  };
  performances: {
    lead_actors: LeadActor[];
    supporting_cast: string;
    ensemble_chemistry: string;
  };
  direction_technicals: {
    direction_style: string;
    direction_score: number;
    cinematography_highlights: string;
    cinematography_score: number;
    music_bgm_impact: string;
    music_score: number;
    editing_notes: string;
    editing_score: number;
  };
  perspectives: {
    audience_reception: string;
    critic_consensus: string;
    divergence_points: string[];
  };
  why_watch: {
    reasons: string[];
    best_for: string[];
  };
  why_skip: {
    drawbacks: string[];
    not_for: string[];
  };
  cultural_impact: {
    cultural_significance: string;
    influence_on_cinema: string;
    memorable_elements: string[];
    legacy_status: string;
    cult_status: boolean;
  };
  awards?: {
    national_awards?: string[];
    filmfare_awards?: string[];
    nandi_awards?: string[];
    siima_awards?: string[];
    cinemaa_awards?: string[];
    other_awards?: string[];
    box_office_records?: string[];
  };
  verdict: {
    category: string;
    en: string;
    te?: string;
    final_rating: number;
    confidence_score: number;
  };
  sources_used: string[];
  generated_at: string;
  quality_score: number;
}

// ============================================================
// SUPABASE CLIENT
// ============================================================

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(url, key);
}

// ============================================================
// GENRE-BASED TEMPLATES
// ============================================================

const GENRE_TEMPLATES: Record<string, {
  narrative: string;
  pacing: string;
  emotional: string;
  why_watch: string[];
  best_for: string[];
  not_for: string[];
}> = {
  Action: {
    narrative: 'The film delivers high-octane action sequences with a storyline that keeps viewers on the edge of their seats.',
    pacing: 'Fast-paced with well-choreographed action set pieces that maintain momentum throughout.',
    emotional: 'Engages viewers through thrilling moments and heroic confrontations.',
    why_watch: ['Impressive action choreography', 'High entertainment value', 'Power-packed performances'],
    best_for: ['Action movie enthusiasts', 'Fans of mass entertainment', 'Weekend movie plans'],
    not_for: ['Those seeking slow-burn drama', 'Viewers who prefer dialogue-heavy films'],
  },
  Drama: {
    narrative: 'A compelling narrative that explores human emotions and relationships with depth and nuance.',
    pacing: 'Measured pacing that allows character development and emotional beats to land effectively.',
    emotional: 'Deeply moving with moments that resonate long after the credits roll.',
    why_watch: ['Strong emotional core', 'Powerful performances', 'Meaningful storytelling'],
    best_for: ['Drama lovers', 'Those seeking meaningful cinema', 'Emotional movie experiences'],
    not_for: ['Those looking for light entertainment', 'Action-only viewers'],
  },
  Comedy: {
    narrative: 'A fun-filled story that prioritizes laughs while maintaining an engaging plot.',
    pacing: 'Energetic pacing with well-timed comedic beats and situations.',
    emotional: 'Light-hearted entertainment that provides genuine moments of joy and laughter.',
    why_watch: ['Guaranteed laughs', 'Feel-good entertainment', 'Memorable comedy scenes'],
    best_for: ['Comedy fans', 'Family viewing', 'Stress-relief movie night'],
    not_for: ['Those seeking serious drama', 'Viewers who prefer intense narratives'],
  },
  Romance: {
    narrative: 'A heartfelt love story that captures the magic and challenges of relationships.',
    pacing: 'Romantic pacing with beautiful moments between the lead pair.',
    emotional: 'Emotionally engaging with chemistry that makes you root for the couple.',
    why_watch: ['Beautiful romance', 'Chemistry between leads', 'Heartwarming moments'],
    best_for: ['Romance enthusiasts', 'Date night viewing', 'Feel-good movie lovers'],
    not_for: ['Those who dislike romantic films', 'Action-only viewers'],
  },
  Thriller: {
    narrative: 'A gripping story with twists and turns that keep viewers guessing until the end.',
    pacing: 'Taut pacing with suspenseful sequences that build tension expertly.',
    emotional: 'Edge-of-seat engagement with moments of genuine surprise and shock.',
    why_watch: ['Unpredictable twists', 'Engaging mystery', 'Suspenseful narrative'],
    best_for: ['Thriller enthusiasts', 'Those who love mysteries', 'Viewers seeking intelligent cinema'],
    not_for: ['Those seeking light entertainment', 'Viewers who dislike tension'],
  },
  Family: {
    narrative: 'A wholesome story that celebrates family values and relationships.',
    pacing: 'Balanced pacing suitable for all age groups with engaging family dynamics.',
    emotional: 'Warm and touching moments that highlight the importance of family bonds.',
    why_watch: ['Family-friendly content', 'Heartwarming story', 'Multi-generational appeal'],
    best_for: ['Family viewing', 'All age groups', 'Festival season watching'],
    not_for: ['Those seeking adult-only content', 'Action enthusiasts'],
  },
  Horror: {
    narrative: 'A spine-chilling story designed to create fear and suspense.',
    pacing: 'Deliberate pacing with carefully crafted scares and atmospheric tension.',
    emotional: 'Evokes fear and unease with effective horror elements.',
    why_watch: ['Genuine scares', 'Atmospheric tension', 'Creative horror elements'],
    best_for: ['Horror fans', 'Thrill seekers', 'Late night viewing'],
    not_for: ['Those who scare easily', 'Young children', 'Sensitive viewers'],
  },
};

const DEFAULT_TEMPLATE = {
  narrative: 'The film presents an engaging narrative with notable performances and technical merit.',
  pacing: 'Well-paced storytelling that maintains viewer interest throughout its runtime.',
  emotional: 'Provides an engaging cinematic experience with moments of entertainment.',
  why_watch: ['Solid entertainment', 'Good performances', 'Quality production'],
  best_for: ['General audiences', 'Weekend viewing'],
  not_for: ['Those with specific genre preferences'],
};

// Get template for movie, with fallback chain
function getGenreTemplate(genres?: string[]) {
  if (!genres || genres.length === 0) return DEFAULT_TEMPLATE;
  
  // Try each genre in order until we find a match
  for (const genre of genres) {
    if (GENRE_TEMPLATES[genre]) {
      return GENRE_TEMPLATES[genre];
    }
  }
  return DEFAULT_TEMPLATE;
}

// ============================================================
// SECTION GENERATORS
// ============================================================

function parseCastMembers(castStrings?: string[]): CastMember[] {
  if (!castStrings || castStrings.length === 0) return [];
  
  return castStrings.map(str => {
    try {
      return JSON.parse(str) as CastMember;
    } catch {
      return null;
    }
  }).filter((c): c is CastMember => c !== null);
}

function generateSynopsis(movie: Movie): EditorialReviewV2['synopsis'] {
  if (movie.synopsis) {
    return {
      en: movie.synopsis,
      spoiler_free: true,
    };
  }

  // Generate from available data
  const cast = parseCastMembers(movie.cast_members);
  const leadActor = movie.hero || cast[0]?.name || 'the protagonist';
  const genre = movie.genres?.[0] || 'drama';
  const director = movie.director || 'the director';

  const synopsis = `${movie.title_en} (${movie.release_year || 'N/A'}) is a Telugu ${genre.toLowerCase()} film directed by ${director}, featuring ${leadActor} in the lead role. ${
    movie.heroine ? `The film also stars ${movie.heroine}. ` : ''
  }This ${movie.genres?.join('/').toLowerCase() || ''} entertainer takes viewers on a journey through its compelling narrative and memorable performances.`;

  return {
    en: synopsis,
    spoiler_free: true,
  };
}

function generateStoryScreenplay(movie: Movie): EditorialReviewV2['story_screenplay'] {
  const template = getGenreTemplate(movie.genres);
  const rating = movie.our_rating || 6;
  
  // Scale scores based on overall rating
  const baseScore = Math.min(10, Math.max(4, rating));
  const variance = 0.5;

  return {
    narrative_strength: template.narrative,
    story_score: Math.round((baseScore + (Math.random() * variance - variance/2)) * 10) / 10,
    pacing_analysis: template.pacing,
    pacing_score: Math.round((baseScore - 0.2 + (Math.random() * variance)) * 10) / 10,
    emotional_engagement: template.emotional,
    emotional_score: Math.round((baseScore + 0.1 + (Math.random() * variance - variance/2)) * 10) / 10,
    originality_score: Math.round((baseScore - 0.3 + (Math.random() * variance)) * 10) / 10,
  };
}

function generatePerformances(movie: Movie): EditorialReviewV2['performances'] {
  const cast = parseCastMembers(movie.cast_members);
  const rating = movie.our_rating || 6;
  const baseScore = Math.min(10, Math.max(4, rating));

  const leadActors: LeadActor[] = [];

  // Add hero
  if (movie.hero) {
    const heroChar = cast.find(c => c.name === movie.hero)?.character;
    leadActors.push({
      name: movie.hero,
      analysis: `${movie.hero} delivers a compelling performance${heroChar ? ` as ${heroChar}` : ''}, showcasing their range and screen presence. The actor brings depth to the character with nuanced expressions and powerful screen presence.`,
      career_significance: `This role adds to ${movie.hero}'s impressive filmography, demonstrating their versatility as a leading actor in Telugu cinema.`,
      score: Math.round((baseScore + 0.3) * 10) / 10,
    });
  }

  // Add heroine
  if (movie.heroine) {
    const heroineChar = cast.find(c => c.name === movie.heroine)?.character;
    leadActors.push({
      name: movie.heroine,
      analysis: `${movie.heroine} complements the lead${heroineChar ? ` as ${heroineChar}` : ''} with a performance that balances grace and substance. Her chemistry with the lead actor enhances the film's emotional quotient.`,
      career_significance: `${movie.heroine} continues to establish herself as a talented actress with this role.`,
      score: Math.round((baseScore + 0.1) * 10) / 10,
    });
  }

  // Supporting cast summary
  const supportingNames = cast
    .filter(c => c.name !== movie.hero && c.name !== movie.heroine)
    .slice(0, 5)
    .map(c => c.name);

  const supportingCast = supportingNames.length > 0
    ? `The supporting cast including ${supportingNames.join(', ')} deliver solid performances that add value to the film. Each actor brings their character to life with conviction.`
    : 'The supporting cast provides adequate support to the lead performances.';

  return {
    lead_actors: leadActors,
    supporting_cast: supportingCast,
    ensemble_chemistry: leadActors.length >= 2
      ? 'The chemistry between the leads is palpable and adds to the film\'s appeal.'
      : 'The ensemble works well together to deliver a cohesive narrative.',
  };
}

function generateDirectionTechnicals(movie: Movie): EditorialReviewV2['direction_technicals'] {
  const rating = movie.our_rating || 6;
  const baseScore = Math.min(10, Math.max(4, rating));
  const variance = 0.4;

  const directorName = movie.director || 'The director';
  const musicDirector = movie.music_director;
  const primaryGenre = movie.genres?.[0] || 'Drama';

  return {
    direction_style: `${directorName} crafts a ${primaryGenre.toLowerCase()} that balances commercial and creative elements effectively. The directorial vision is evident in the way scenes are structured and emotions are extracted from the performances.`,
    direction_score: Math.round((baseScore + 0.2 + (Math.random() * variance - variance/2)) * 10) / 10,
    cinematography_highlights: movie.cinematographer
      ? `${movie.cinematographer}'s cinematography elevates the visual storytelling with well-composed frames and effective use of lighting.`
      : 'The cinematography complements the narrative with visually appealing compositions and effective mood-setting.',
    cinematography_score: Math.round((baseScore + (Math.random() * variance - variance/2)) * 10) / 10,
    music_bgm_impact: musicDirector
      ? `${musicDirector}'s music adds significant value to the film. The songs are melodious and the background score enhances key moments effectively.`
      : 'The music department delivers songs and background score that complement the narrative.',
    music_score: Math.round((baseScore + 0.1 + (Math.random() * variance - variance/2)) * 10) / 10,
    editing_notes: 'The editing maintains a good pace, ensuring the film doesn\'t drag while giving important scenes their due time.',
    editing_score: Math.round((baseScore - 0.1 + (Math.random() * variance)) * 10) / 10,
  };
}

function generatePerspectives(movie: Movie): EditorialReviewV2['perspectives'] {
  const rating = movie.our_rating || 6;
  const isHighRated = rating >= 7.5;
  const isBlockbuster = movie.is_blockbuster || movie.box_office_category === 'blockbuster';

  return {
    audience_reception: isBlockbuster
      ? `${movie.title_en} received an enthusiastic response from audiences, with packed theaters and strong word-of-mouth.`
      : isHighRated
        ? `The film was well-received by audiences who appreciated its entertainment value and performances.`
        : `The film found its audience among fans of ${movie.genres?.join(' and ') || 'this genre'}.`,
    critic_consensus: isHighRated
      ? 'Critics praised the film for its engaging narrative and strong performances.'
      : 'Critics offered mixed reviews, appreciating certain aspects while noting areas for improvement.',
    divergence_points: isHighRated
      ? ['Strong agreement on entertainment value', 'Performances universally praised']
      : ['Varying opinions on pacing', 'Divided views on the narrative approach'],
  };
}

function generateWhyWatch(movie: Movie): EditorialReviewV2['why_watch'] {
  const template = getGenreTemplate(movie.genres);
  const reasons: string[] = [...template.why_watch];
  const bestFor: string[] = [...template.best_for];

  // Add specific reasons based on movie data
  if (movie.hero) {
    reasons.push(`${movie.hero}'s stellar performance`);
    bestFor.push(`Fans of ${movie.hero}`);
  }

  if (movie.director) {
    reasons.push(`${movie.director}'s engaging direction`);
  }

  if (movie.music_director) {
    reasons.push(`Memorable music by ${movie.music_director}`);
  }

  if (movie.awards && movie.awards.length > 0) {
    reasons.push(`Award-winning film (${movie.awards.length} awards)`);
    bestFor.push('Award-winning cinema enthusiasts');
  }

  if (movie.is_classic) {
    reasons.push('A timeless classic of Telugu cinema');
    bestFor.push('Classic film lovers');
  }

  if (movie.is_blockbuster) {
    reasons.push('Blockbuster entertainer with mass appeal');
  }

  return {
    reasons: reasons.slice(0, 6),
    best_for: bestFor.slice(0, 4),
  };
}

function generateWhySkip(movie: Movie): EditorialReviewV2['why_skip'] {
  const template = getGenreTemplate(movie.genres);
  const rating = movie.our_rating || 6;

  const drawbacks: string[] = [];
  const notFor: string[] = [...template.not_for];

  // Add drawbacks based on rating
  if (rating < 6) {
    drawbacks.push('May not meet high expectations');
    drawbacks.push('Some aspects could have been better executed');
  } else if (rating < 7) {
    drawbacks.push('Follows familiar genre conventions');
  }

  // Generic drawbacks based on runtime/genre
  if (movie.genres?.includes('Action')) {
    drawbacks.push('Action-heavy sequences may not appeal to all');
  }

  if (movie.genres?.includes('Drama')) {
    drawbacks.push('Slower moments in the narrative');
  }

  if (drawbacks.length === 0) {
    drawbacks.push('Minor pacing issues in parts');
  }

  return {
    drawbacks: drawbacks.slice(0, 3),
    not_for: notFor.slice(0, 3),
  };
}

function generateCulturalImpact(movie: Movie): EditorialReviewV2['cultural_impact'] {
  const isClassic = movie.is_classic || (movie.release_year && movie.release_year < 2000);
  const hasAwards = movie.awards && movie.awards.length > 0;
  const isBlockbuster = movie.is_blockbuster || movie.box_office_category === 'blockbuster';

  const memorableElements: string[] = [];
  if (movie.hero) memorableElements.push(`${movie.hero}'s iconic performance`);
  if (movie.music_director) memorableElements.push(`Memorable songs by ${movie.music_director}`);
  if (movie.director) memorableElements.push(`${movie.director}'s direction`);

  return {
    cultural_significance: isClassic
      ? `${movie.title_en} holds a special place in Telugu cinema history, representing the best of its era.`
      : hasAwards
        ? `An award-winning film that has been recognized for its artistic merit.`
        : isBlockbuster
          ? `A commercial success that resonated with mass audiences.`
          : `The film contributes to the rich tapestry of Telugu cinema.`,
    influence_on_cinema: isClassic
      ? 'This film has influenced subsequent productions and remains a reference point for filmmakers.'
      : 'The film represents the evolving landscape of Telugu cinema.',
    memorable_elements: memorableElements.length > 0 ? memorableElements : ['Strong narrative', 'Quality entertainment'],
    legacy_status: isClassic ? 'Classic' : hasAwards ? 'Award-winning' : isBlockbuster ? 'Commercial hit' : 'Notable release',
    cult_status: isClassic || isBlockbuster,
  };
}

function formatAwards(awards?: Award[]): EditorialReviewV2['awards'] {
  if (!awards || awards.length === 0) return undefined;

  const result: EditorialReviewV2['awards'] = {
    national_awards: [],
    filmfare_awards: [],
    nandi_awards: [],
    siima_awards: [],
    cinemaa_awards: [],
    other_awards: [],
    box_office_records: [],
  };

  for (const award of awards) {
    const awardStr = `${award.name} - ${award.category} (${award.year})`;
    
    switch (award.type) {
      case 'national':
        result.national_awards?.push(awardStr);
        break;
      case 'filmfare':
        result.filmfare_awards?.push(awardStr);
        break;
      case 'nandi':
        result.nandi_awards?.push(awardStr);
        break;
      case 'siima':
        result.siima_awards?.push(awardStr);
        break;
      case 'cinemaa':
        result.cinemaa_awards?.push(awardStr);
        break;
      default:
        result.other_awards?.push(awardStr);
    }
  }

  // Remove empty arrays
  Object.keys(result).forEach(key => {
    const k = key as keyof typeof result;
    if (result[k]?.length === 0) {
      delete result[k];
    }
  });

  return Object.keys(result).length > 0 ? result : undefined;
}

function generateVerdict(movie: Movie): EditorialReviewV2['verdict'] {
  const rating = movie.our_rating || 6;
  
  let category: string;
  let verdictEn: string;

  if (rating >= 9) {
    category = 'masterpiece';
    verdictEn = `${movie.title_en} is a masterpiece of Telugu cinema that deserves to be watched and celebrated. A must-watch that sets the standard for excellence.`;
  } else if (rating >= 8.5) {
    category = 'must-watch';
    verdictEn = `${movie.title_en} is a must-watch that delivers on all fronts. Highly recommended for all movie lovers.`;
  } else if (rating >= 8) {
    category = 'highly-recommended';
    verdictEn = `${movie.title_en} is highly recommended for its engaging narrative and strong performances. A satisfying cinematic experience.`;
  } else if (rating >= 7) {
    category = 'recommended';
    verdictEn = `${movie.title_en} is a recommended watch that offers solid entertainment. Worth your time for fans of the genre.`;
  } else if (rating >= 6) {
    category = 'watchable';
    verdictEn = `${movie.title_en} is a watchable film with its share of moments. A decent option for casual viewing.`;
  } else {
    category = 'one-time-watch';
    verdictEn = `${movie.title_en} is a one-time watch at best. Has its moments but may not appeal to everyone.`;
  }

  return {
    category,
    en: verdictEn,
    final_rating: rating,
    confidence_score: 0.6, // Template-generated confidence
  };
}

// ============================================================
// MAIN GENERATOR
// ============================================================

function generateTemplateSections(movie: Movie): EditorialReviewV2 {
  return {
    _type: 'editorial_review_v2',
    synopsis: generateSynopsis(movie),
    story_screenplay: generateStoryScreenplay(movie),
    performances: generatePerformances(movie),
    direction_technicals: generateDirectionTechnicals(movie),
    perspectives: generatePerspectives(movie),
    why_watch: generateWhyWatch(movie),
    why_skip: generateWhySkip(movie),
    cultural_impact: generateCulturalImpact(movie),
    awards: formatAwards(movie.awards),
    verdict: generateVerdict(movie),
    sources_used: ['template_generation', 'movie_metadata'],
    generated_at: new Date().toISOString(),
    quality_score: 0.6,
  };
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 500;
  const createMissing = args.includes('--create-missing'); // Create reviews for movies without one

  console.log(chalk.cyan('\n╔══════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║         TEMPLATE SECTION GENERATION                              ║'));
  console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════════╝\n'));

  if (dryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be made\n'));
  }
  if (createMissing) {
    console.log(chalk.blue('📝 CREATE-MISSING MODE - Will create reviews for movies without one\n'));
  }

  const supabase = getSupabaseClient();

  // Fetch movies with rich data that need section generation
  console.log(chalk.blue('📊 Fetching eligible movies...\n'));

  // First, get ALL movies with reviews (paginated)
  console.log(chalk.blue('   Fetching all existing reviews (paginated)...'));
  
  interface ReviewRow {
    movie_id: string;
    dimensions_json: unknown;
  }
  
  const allExistingReviews: ReviewRow[] = [];
  let reviewOffset = 0;
  const reviewPageSize = 1000;
  
  while (true) {
    const { data: page } = await supabase
      .from('movie_reviews')
      .select('movie_id, dimensions_json')
      .range(reviewOffset, reviewOffset + reviewPageSize - 1);
    
    if (!page || page.length === 0) break;
    allExistingReviews.push(...(page as ReviewRow[]));
    if (page.length < reviewPageSize) break;
    reviewOffset += reviewPageSize;
  }

  const moviesWithSections = new Set(
    allExistingReviews.filter(r => r.dimensions_json).map(r => r.movie_id)
  );
  const moviesWithReviews = new Set(allExistingReviews.map(r => r.movie_id));
  
  console.log(`   Movies with reviews: ${moviesWithReviews.size}`);
  console.log(`   Movies with sections: ${moviesWithSections.size}`);

  // Fetch ALL published movies with minimal data requirement
  // Paginate to get all movies (Supabase default limit is 1000)
  console.log(chalk.blue('   Fetching all published movies (paginated)...'));
  
  interface MovieRow {
    id: string;
    title_en: string;
    title_te?: string;
    slug: string;
    release_year?: number;
    genres: string[];
    director?: string;
    music_director?: string;
    cinematographer?: string;
    hero?: string;
    heroine?: string;
    synopsis?: string;
    our_rating?: number;
    verdict?: string;
    awards?: Award[];
    cast_members?: string[];
    is_classic?: boolean;
    is_blockbuster?: boolean;
    box_office_category?: string;
  }
  
  const allMovies: MovieRow[] = [];
  let offset = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: page, error: pageError } = await supabase
      .from('movies')
      .select('id, title_en, title_te, slug, release_year, genres, director, music_director, cinematographer, hero, heroine, synopsis, our_rating, verdict, awards, cast_members, is_classic, is_blockbuster, box_office_category')
      .eq('is_published', true)
      .order('our_rating', { ascending: false, nullsFirst: false })
      .range(offset, offset + pageSize - 1);
    
    if (pageError) {
      console.error(chalk.red('Error fetching movies:'), pageError.message);
      process.exit(1);
    }
    
    if (!page || page.length === 0) break;
    
    allMovies.push(...(page as MovieRow[]));
    console.log(chalk.gray(`   Fetched ${allMovies.length} movies...`));
    
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  
  const movies = allMovies;

  // Filter to movies that:
  // 1. Don't already have dimensions_json
  // 2. Have at least hero OR director (relaxed criteria)
  const eligibleMovies = (movies || []).filter(m => 
    !moviesWithSections.has(m.id) &&
    (m.hero || m.director)
  ).slice(0, limit);

  const needsReviewCreation = eligibleMovies.filter(m => !moviesWithReviews.has(m.id));
  const needsSectionUpdate = eligibleMovies.filter(m => moviesWithReviews.has(m.id));

  console.log(`   Eligible movies: ${eligibleMovies.length}`);
  console.log(`   - Need review creation: ${needsReviewCreation.length}`);
  console.log(`   - Need section update: ${needsSectionUpdate.length}\n`);

  if (eligibleMovies.length === 0) {
    console.log(chalk.yellow('No movies found that need section generation.'));
    return;
  }

  // Process movies
  let processed = 0;
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const movie of eligibleMovies) {
    processed++;
    const hasReview = moviesWithReviews.has(movie.id);
    
    try {
      const sections = generateTemplateSections(movie as Movie);
      const rating = movie.our_rating || 6;

      if (dryRun) {
        const action = hasReview ? 'UPDATE' : 'CREATE';
        console.log(chalk.gray(`[${processed}/${eligibleMovies.length}] [${action}] ${movie.title_en} (${movie.release_year})`));
        if (processed <= 5) {
          console.log(chalk.gray('   Synopsis: ' + sections.synopsis.en.slice(0, 80) + '...'));
          console.log(chalk.gray('   Verdict: ' + sections.verdict.category + ' (' + sections.verdict.final_rating + ')'));
        }
      } else if (hasReview) {
        // Update existing review
        const { error: updateError } = await supabase
          .from('movie_reviews')
          .update({ 
            dimensions_json: sections,
            source: 'template_fallback',
            confidence: 0.6,
          })
          .eq('movie_id', movie.id);

        if (updateError) {
          console.error(chalk.red(`   Error updating ${movie.title_en}:`), updateError.message);
          errors++;
        } else {
          updated++;
        }
      } else if (createMissing) {
        // Create new review with sections
        const { error: insertError } = await supabase
          .from('movie_reviews')
          .insert({
            movie_id: movie.id,
            reviewer_type: 'admin',
            reviewer_name: 'TeluguVibes Editorial',
            overall_rating: rating,
            dimensions_json: sections,
            source: 'template_fallback',
            confidence: 0.6,
            status: 'published',
            is_spoiler_free: true,
            worth_watching: rating >= 6,
          });

        if (insertError) {
          console.error(chalk.red(`   Error creating review for ${movie.title_en}:`), insertError.message);
          errors++;
        } else {
          created++;
        }
      }

      // Progress indicator
      if (!dryRun && (created + updated) % 100 === 0) {
        console.log(chalk.blue(`   Progress: ${created} created, ${updated} updated...`));
      }
    } catch (err) {
      console.error(chalk.red(`Error processing ${movie.title_en}:`), err);
      errors++;
    }
  }

  // Summary
  console.log(chalk.cyan('\n══════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan('SUMMARY'));
  console.log(chalk.cyan('══════════════════════════════════════════════════════════════════\n'));

  console.log(`   Processed: ${processed}`);
  if (!dryRun) {
    console.log(`   Reviews created: ${created}`);
    console.log(`   Reviews updated: ${updated}`);
    console.log(`   Errors: ${errors}`);
  }

  if (dryRun) {
    console.log(chalk.yellow('\n🔍 This was a dry run. Run without --dry to apply changes.'));
    if (needsReviewCreation.length > 0) {
      console.log(chalk.yellow(`   Add --create-missing to create ${needsReviewCreation.length} new reviews.`));
    }
  } else {
    console.log(chalk.green(`\n✅ Section generation complete!`));
  }
}

main().catch(console.error);

