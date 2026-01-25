/**
 * EDITORIAL VIEWS GENERATOR
 * 
 * Auto-generates editorial sections from existing movie and entity data.
 * All content is derived algorithmically from facts - no AI speculation.
 * 
 * Generated Sections:
 * - Career Turning Points
 * - Most Reinvented Phases
 * - Cult vs Mass Balance
 * - Critical vs Audience Gap
 * - Family Legacy Impact
 * 
 * Governance Rules:
 * - All views are derived from verified data only
 * - Speculative content is explicitly labeled
 * - No AI-generated opinions
 */

// ============================================================
// TYPES
// ============================================================

export interface CareerTurningPoint {
  year: number;
  movie_title: string;
  movie_slug: string;
  type: 'debut' | 'breakthrough' | 'reinvention' | 'commercial_peak' | 'critical_acclaim' | 'genre_shift' | 'comeback';
  description: string;
  impact_score: number; // 1-10
  before_after?: {
    before: string;
    after: string;
  };
}

export interface PhaseAnalysis {
  phase_name: string;
  years: string;
  dominant_genre: string;
  avg_rating: number;
  hit_rate: number;
  movie_count: number;
  signature_films: string[];
  themes: string[];
}

export interface CultMassBalance {
  cult_percentage: number;
  mass_percentage: number;
  balanced_percentage: number;
  cult_films: Array<{ title: string; slug: string; rating: number }>;
  mass_films: Array<{ title: string; slug: string; box_office?: string }>;
  analysis: string;
}

export interface CriticalAudienceGap {
  avg_critical_rating: number;
  avg_audience_rating: number;
  gap_score: number;
  direction: 'critic_favorite' | 'audience_favorite' | 'aligned';
  biggest_gaps: Array<{
    title: string;
    slug: string;
    critical_rating: number;
    audience_rating: number;
    gap: number;
  }>;
  analysis: string;
}

export interface FamilyLegacyAnalysis {
  legacy_type: 'dynasty_founder' | 'second_generation' | 'multi_generation' | 'standalone';
  shared_collaborators: Array<{ name: string; role: string; count: number }>;
  genre_inheritance: string[];
  cross_generation_films: Array<{ title: string; slug: string; family_members: string[] }>;
  legacy_score: number;
  analysis: string;
}

export interface EditorialViewsData {
  turning_points: CareerTurningPoint[];
  phase_analysis: PhaseAnalysis[];
  cult_mass_balance: CultMassBalance;
  critical_audience_gap: CriticalAudienceGap;
  family_legacy?: FamilyLegacyAnalysis;
  content_type: 'verified_fact' | 'editorial' | 'speculative';
  generated_at: string;
}

export interface MovieForAnalysis {
  id: string;
  title: string;
  slug: string;
  year: number;
  primary_genre?: string;
  genres?: string[];
  our_rating?: number;
  avg_rating?: number;
  audience_rating?: number;
  is_blockbuster?: boolean;
  is_classic?: boolean;
  is_cult?: boolean;
  box_office_status?: string;
  role_type?: string;
}

// ============================================================
// TURNING POINTS GENERATOR
// ============================================================

export function generateTurningPoints(
  movies: MovieForAnalysis[],
  personName: string
): CareerTurningPoint[] {
  if (movies.length < 3) return [];
  
  const sortedMovies = [...movies].sort((a, b) => a.year - b.year);
  const turningPoints: CareerTurningPoint[] = [];

  // Debut film
  const debut = sortedMovies[0];
  if (debut) {
    turningPoints.push({
      year: debut.year,
      movie_title: debut.title,
      movie_slug: debut.slug,
      type: 'debut',
      description: `${personName}'s cinematic debut marked the beginning of their journey`,
      impact_score: 7,
    });
  }

  // First blockbuster (breakthrough)
  const firstBlockbuster = sortedMovies.find((m) => m.is_blockbuster);
  if (firstBlockbuster && firstBlockbuster !== debut) {
    const yearsToBreakthrough = firstBlockbuster.year - (debut?.year || 0);
    turningPoints.push({
      year: firstBlockbuster.year,
      movie_title: firstBlockbuster.title,
      movie_slug: firstBlockbuster.slug,
      type: 'breakthrough',
      description: `Commercial breakthrough after ${yearsToBreakthrough} year${yearsToBreakthrough !== 1 ? 's' : ''} in the industry`,
      impact_score: 9,
      before_after: {
        before: 'Rising talent',
        after: 'Established star',
      },
    });
  }

  // Highest rated film (critical acclaim)
  const highestRated = [...sortedMovies]
    .filter((m) => (m.our_rating || m.avg_rating || 0) > 0)
    .sort((a, b) => (b.our_rating || b.avg_rating || 0) - (a.our_rating || a.avg_rating || 0))[0];
  
  if (highestRated && highestRated !== debut && highestRated !== firstBlockbuster) {
    turningPoints.push({
      year: highestRated.year,
      movie_title: highestRated.title,
      movie_slug: highestRated.slug,
      type: 'critical_acclaim',
      description: `Career-defining performance that earned critical recognition`,
      impact_score: 8,
    });
  }

  // Genre shifts (detect significant genre changes)
  const genreShifts = detectGenreShifts(sortedMovies);
  turningPoints.push(...genreShifts.map((shift) => ({
    year: shift.movie.year,
    movie_title: shift.movie.title,
    movie_slug: shift.movie.slug,
    type: 'genre_shift' as const,
    description: `Transitioned from ${shift.from_genre} to ${shift.to_genre}`,
    impact_score: 7,
    before_after: {
      before: shift.from_genre,
      after: shift.to_genre,
    },
  })));

  // Comebacks (gap of 3+ years followed by successful film)
  const comebacks = detectComebacks(sortedMovies);
  turningPoints.push(...comebacks);

  // Sort by year and impact
  return turningPoints
    .sort((a, b) => a.year - b.year || b.impact_score - a.impact_score)
    .slice(0, 10);
}

function detectGenreShifts(movies: MovieForAnalysis[]): Array<{
  movie: MovieForAnalysis;
  from_genre: string;
  to_genre: string;
}> {
  const shifts: Array<{ movie: MovieForAnalysis; from_genre: string; to_genre: string }> = [];
  
  const genreHistory = movies.map((m) => ({
    movie: m,
    genre: m.primary_genre || m.genres?.[0] || 'Unknown',
  }));

  // Use a sliding window to detect shifts
  for (let i = 5; i < genreHistory.length; i++) {
    const prevGenres = genreHistory.slice(i - 5, i).map((g) => g.genre);
    const currentGenre = genreHistory[i].genre;
    
    // Count genre frequency in previous window
    const genreCounts = prevGenres.reduce((acc, g) => {
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantPrevGenre = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    
    if (dominantPrevGenre && currentGenre !== dominantPrevGenre && genreCounts[dominantPrevGenre] >= 3) {
      shifts.push({
        movie: genreHistory[i].movie,
        from_genre: dominantPrevGenre,
        to_genre: currentGenre,
      });
    }
  }

  return shifts.slice(0, 3); // Max 3 genre shifts
}

function detectComebacks(movies: MovieForAnalysis[]): CareerTurningPoint[] {
  const comebacks: CareerTurningPoint[] = [];
  
  for (let i = 1; i < movies.length; i++) {
    const gap = movies[i].year - movies[i - 1].year;
    const isSuccessful = (movies[i].our_rating || movies[i].avg_rating || 0) >= 7 || movies[i].is_blockbuster;
    
    if (gap >= 3 && isSuccessful) {
      comebacks.push({
        year: movies[i].year,
        movie_title: movies[i].title,
        movie_slug: movies[i].slug,
        type: 'comeback',
        description: `Triumphant return after ${gap}-year gap`,
        impact_score: 8,
        before_after: {
          before: `${gap}-year hiatus`,
          after: 'Successful comeback',
        },
      });
    }
  }

  return comebacks.slice(0, 2);
}

// ============================================================
// PHASE ANALYSIS GENERATOR
// ============================================================

export function generatePhaseAnalysis(
  movies: MovieForAnalysis[],
  eras?: Array<{ name: string; years: string; themes: string[] }>
): PhaseAnalysis[] {
  if (movies.length < 5) return [];

  // If eras are provided, use them as phases
  if (eras && eras.length > 0) {
    return eras.map((era) => {
      const [startYear, endYear] = era.years.split('-').map((y) => parseInt(y.trim()));
      const phaseMovies = movies.filter((m) => m.year >= startYear && m.year <= (endYear || 2099));
      
      const ratings = phaseMovies
        .map((m) => m.our_rating || m.avg_rating)
        .filter((r): r is number => r !== undefined && r > 0);
      
      const hits = phaseMovies.filter((m) => (m.our_rating || m.avg_rating || 0) >= 7).length;
      
      const genreCounts = phaseMovies.reduce((acc, m) => {
        const genre = m.primary_genre || 'Unknown';
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const dominantGenre = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Mixed';

      return {
        phase_name: era.name,
        years: era.years,
        dominant_genre: dominantGenre,
        avg_rating: ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : 0,
        hit_rate: phaseMovies.length > 0 ? Math.round((hits / phaseMovies.length) * 100) : 0,
        movie_count: phaseMovies.length,
        signature_films: phaseMovies
          .filter((m) => m.is_blockbuster || m.is_classic || (m.our_rating || 0) >= 8)
          .slice(0, 3)
          .map((m) => m.title),
        themes: era.themes,
      };
    });
  }

  // Auto-detect phases by decade
  const decades = groupByDecade(movies);
  return Array.from(decades.entries()).map(([decade, decadeMovies]) => {
    const ratings = decadeMovies
      .map((m) => m.our_rating || m.avg_rating)
      .filter((r): r is number => r !== undefined && r > 0);
    
    const hits = decadeMovies.filter((m) => (m.our_rating || m.avg_rating || 0) >= 7).length;
    
    const genreCounts = decadeMovies.reduce((acc, m) => {
      const genre = m.primary_genre || 'Unknown';
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantGenre = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Mixed';

    return {
      phase_name: `${decade}s Era`,
      years: `${decade}-${decade + 9}`,
      dominant_genre: dominantGenre,
      avg_rating: ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0,
      hit_rate: decadeMovies.length > 0 ? Math.round((hits / decadeMovies.length) * 100) : 0,
      movie_count: decadeMovies.length,
      signature_films: decadeMovies
        .filter((m) => m.is_blockbuster || m.is_classic || (m.our_rating || 0) >= 8)
        .slice(0, 3)
        .map((m) => m.title),
      themes: inferThemesFromGenres(decadeMovies),
    };
  });
}

function groupByDecade(movies: MovieForAnalysis[]): Map<number, MovieForAnalysis[]> {
  const decades = new Map<number, MovieForAnalysis[]>();
  
  for (const movie of movies) {
    const decade = Math.floor(movie.year / 10) * 10;
    const existing = decades.get(decade) || [];
    existing.push(movie);
    decades.set(decade, existing);
  }

  return decades;
}

function inferThemesFromGenres(movies: MovieForAnalysis[]): string[] {
  const genres = movies.flatMap((m) => m.genres || [m.primary_genre]).filter(Boolean);
  const genreCounts = genres.reduce((acc, g) => {
    acc[g!] = (acc[g!] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre);
}

// ============================================================
// CULT VS MASS BALANCE
// ============================================================

export function analyzeCultMassBalance(movies: MovieForAnalysis[]): CultMassBalance {
  if (movies.length === 0) {
    return {
      cult_percentage: 0,
      mass_percentage: 0,
      balanced_percentage: 0,
      cult_films: [],
      mass_films: [],
      analysis: 'Insufficient data for analysis',
    };
  }

  // Classification logic:
  // Cult: High rating (8+) but not blockbuster, or explicitly marked
  // Mass: Blockbuster status regardless of rating
  // Balanced: Everything else
  
  const cultFilms = movies.filter((m) => 
    m.is_cult || 
    ((m.our_rating || m.avg_rating || 0) >= 8 && !m.is_blockbuster)
  );
  
  const massFilms = movies.filter((m) => 
    m.is_blockbuster || 
    m.box_office_status === 'hit' || 
    m.box_office_status === 'blockbuster'
  );
  
  const balancedFilms = movies.filter((m) => 
    !cultFilms.includes(m) && !massFilms.includes(m)
  );

  const total = movies.length;
  const cultPercentage = Math.round((cultFilms.length / total) * 100);
  const massPercentage = Math.round((massFilms.length / total) * 100);
  const balancedPercentage = 100 - cultPercentage - massPercentage;

  // Generate analysis
  let analysis: string;
  if (Math.abs(cultPercentage - massPercentage) <= 15) {
    analysis = 'Demonstrates versatility with a balanced mix of critically acclaimed and commercially successful films';
  } else if (cultPercentage > massPercentage) {
    analysis = 'Leans toward critically acclaimed cinema with a focus on artistic merit over commercial success';
  } else {
    analysis = 'Commercial powerhouse with consistent box office performance across their career';
  }

  return {
    cult_percentage: cultPercentage,
    mass_percentage: massPercentage,
    balanced_percentage: balancedPercentage,
    cult_films: cultFilms.slice(0, 5).map((m) => ({
      title: m.title,
      slug: m.slug,
      rating: m.our_rating || m.avg_rating || 0,
    })),
    mass_films: massFilms.slice(0, 5).map((m) => ({
      title: m.title,
      slug: m.slug,
      box_office: m.box_office_status,
    })),
    analysis,
  };
}

// ============================================================
// CRITICAL VS AUDIENCE GAP
// ============================================================

export function analyzeCriticalAudienceGap(movies: MovieForAnalysis[]): CriticalAudienceGap {
  const moviesWithBothRatings = movies.filter((m) => 
    m.our_rating !== undefined && 
    m.audience_rating !== undefined &&
    m.our_rating > 0 && 
    m.audience_rating > 0
  );

  if (moviesWithBothRatings.length < 5) {
    // Fallback: compare avg_rating vs our_rating as proxy
    const avgCritical = movies
      .map((m) => m.our_rating)
      .filter((r): r is number => r !== undefined && r > 0)
      .reduce((sum, r, _, arr) => sum + r / arr.length, 0);
    
    const avgAudience = movies
      .map((m) => m.avg_rating)
      .filter((r): r is number => r !== undefined && r > 0)
      .reduce((sum, r, _, arr) => sum + r / arr.length, 0);

    return {
      avg_critical_rating: Math.round(avgCritical * 10) / 10,
      avg_audience_rating: Math.round(avgAudience * 10) / 10,
      gap_score: Math.abs(avgCritical - avgAudience),
      direction: avgCritical > avgAudience ? 'critic_favorite' : 
                 avgCritical < avgAudience ? 'audience_favorite' : 'aligned',
      biggest_gaps: [],
      analysis: 'Limited audience rating data available for detailed gap analysis',
    };
  }

  const criticalAvg = moviesWithBothRatings
    .reduce((sum, m) => sum + (m.our_rating || 0), 0) / moviesWithBothRatings.length;
  
  const audienceAvg = moviesWithBothRatings
    .reduce((sum, m) => sum + (m.audience_rating || 0), 0) / moviesWithBothRatings.length;

  const moviesWithGap = moviesWithBothRatings.map((m) => ({
    ...m,
    gap: Math.abs((m.our_rating || 0) - (m.audience_rating || 0)),
  })).sort((a, b) => b.gap - a.gap);

  const gapScore = Math.abs(criticalAvg - audienceAvg);
  let direction: 'critic_favorite' | 'audience_favorite' | 'aligned' = 'aligned';
  let analysis: string;

  if (gapScore < 0.5) {
    direction = 'aligned';
    analysis = 'Critical and audience opinions are remarkably aligned across their filmography';
  } else if (criticalAvg > audienceAvg) {
    direction = 'critic_favorite';
    analysis = 'Films tend to be more appreciated by critics than general audiences';
  } else {
    direction = 'audience_favorite';
    analysis = 'Connects strongly with audiences, sometimes ahead of critical reception';
  }

  return {
    avg_critical_rating: Math.round(criticalAvg * 10) / 10,
    avg_audience_rating: Math.round(audienceAvg * 10) / 10,
    gap_score: Math.round(gapScore * 10) / 10,
    direction,
    biggest_gaps: moviesWithGap.slice(0, 5).map((m) => ({
      title: m.title,
      slug: m.slug,
      critical_rating: m.our_rating || 0,
      audience_rating: m.audience_rating || 0,
      gap: m.gap,
    })),
    analysis,
  };
}

// ============================================================
// FAMILY LEGACY ANALYSIS
// ============================================================

export function analyzeFamilyLegacy(
  movies: MovieForAnalysis[],
  familyRelationships: Record<string, { name: string; slug?: string }>,
  allFamilyMovies?: Map<string, MovieForAnalysis[]>
): FamilyLegacyAnalysis | undefined {
  if (!familyRelationships || Object.keys(familyRelationships).length === 0) {
    return undefined;
  }

  const familyMembers = Object.entries(familyRelationships)
    .flatMap(([relation, member]) => {
      if (Array.isArray(member)) {
        return member.map((m) => ({ ...m, relation }));
      }
      return [{ ...member, relation }];
    });

  if (familyMembers.length === 0) {
    return undefined;
  }

  // Determine legacy type
  const hasParent = familyMembers.some((m) => m.relation === 'father' || m.relation === 'mother');
  const hasChildren = familyMembers.some((m) => m.relation === 'son' || m.relation === 'daughter');
  
  let legacyType: FamilyLegacyAnalysis['legacy_type'] = 'standalone';
  if (hasParent && hasChildren) {
    legacyType = 'multi_generation';
  } else if (hasChildren) {
    legacyType = 'dynasty_founder';
  } else if (hasParent) {
    legacyType = 'second_generation';
  }

  // Calculate legacy score (1-10)
  const legacyScore = Math.min(10, 3 + familyMembers.length + (hasChildren ? 2 : 0) + (hasParent ? 1 : 0));

  // Generate analysis
  const familyNames = familyMembers.map((m) => m.name).join(', ');
  let analysis: string;
  
  switch (legacyType) {
    case 'dynasty_founder':
      analysis = `Established a cinematic dynasty with ${familyMembers.filter((m) => m.relation === 'son' || m.relation === 'daughter').length} children continuing the legacy`;
      break;
    case 'second_generation':
      analysis = `Carrying forward the family legacy with roots in film royalty`;
      break;
    case 'multi_generation':
      analysis = `Central figure in a multi-generational film dynasty spanning several decades`;
      break;
    default:
      analysis = `Connected to the industry through family: ${familyNames}`;
  }

  return {
    legacy_type: legacyType,
    shared_collaborators: [], // Would need more data to compute
    genre_inheritance: [], // Would need family movie data
    cross_generation_films: [], // Would need more data
    legacy_score: legacyScore,
    analysis,
  };
}

// ============================================================
// MAIN GENERATOR
// ============================================================

export function generateEditorialViews(
  movies: MovieForAnalysis[],
  personName: string,
  options?: {
    eras?: Array<{ name: string; years: string; themes: string[] }>;
    familyRelationships?: Record<string, { name: string; slug?: string }>;
  }
): EditorialViewsData {
  return {
    turning_points: generateTurningPoints(movies, personName),
    phase_analysis: generatePhaseAnalysis(movies, options?.eras),
    cult_mass_balance: analyzeCultMassBalance(movies),
    critical_audience_gap: analyzeCriticalAudienceGap(movies),
    family_legacy: options?.familyRelationships
      ? analyzeFamilyLegacy(movies, options.familyRelationships)
      : undefined,
    content_type: 'editorial',
    generated_at: new Date().toISOString(),
  };
}

export default {
  generateEditorialViews,
  generateTurningPoints,
  generatePhaseAnalysis,
  analyzeCultMassBalance,
  analyzeCriticalAudienceGap,
  analyzeFamilyLegacy,
};
