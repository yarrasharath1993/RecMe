/**
 * Knowledge Graph & Auto-Tagging System - Phase 5
 * 
 * Canonical tagging system with knowledge graph:
 * - Genre tags
 * - Era tags (golden_age, classic, modern, new_wave)
 * - Language tags
 * - Actor/Director entity linking
 * - Box-office classification (Hit/Blockbuster/Classic/Hidden Gem)
 * - All sections derive from tags (no hardcoding)
 * - Zero orphan pages
 * 
 * Usage:
 *   import { knowledgeGraph } from '@/lib/graph/knowledge-graph';
 *   
 *   const tags = knowledgeGraph.generateTags(movie);
 *   const related = knowledgeGraph.findRelated(movieId);
 */

// ============================================================
// TYPES
// ============================================================

export interface MovieTags {
  id: string;
  genres: string[];
  era: 'golden_age' | 'classic' | 'modern' | 'new_wave';
  language: string;
  boxOfficeClass: 'blockbuster' | 'superhit' | 'hit' | 'average' | 'flop' | 'hidden_gem' | 'classic';
  actors: string[];
  directors: string[];
  themes: string[];
  decade: string; // 1950s, 1960s, etc.
  certifications: string[];
}

export interface KnowledgeNode {
  id: string;
  type: 'movie' | 'actor' | 'director' | 'genre' | 'era' | 'theme';
  label: string;
  properties: Record<string, any>;
}

export interface KnowledgeEdge {
  from: string;
  to: string;
  type: 'acted_in' | 'directed' | 'has_genre' | 'belongs_to_era' | 'related_to' | 'similar_theme';
  weight: number;
}

export interface KnowledgeGraphResult {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  clusters: Array<{
    id: string;
    label: string;
    nodes: string[];
  }>;
}

// ============================================================
// ERA DEFINITIONS
// ============================================================

const ERA_DEFINITIONS = {
  golden_age: { start: 1950, end: 1969, label: 'Golden Age' },
  classic: { start: 1970, end: 1989, label: 'Classic Era' },
  modern: { start: 1990, end: 2009, label: 'Modern Era' },
  new_wave: { start: 2010, end: 2030, label: 'New Wave' },
};

// ============================================================
// BOX OFFICE CLASSIFICATIONS
// ============================================================

const BOX_OFFICE_THRESHOLDS = {
  all_time_blockbuster: 3000000000,  // 300 crores
  blockbuster: 1000000000,           // 100 crores
  superhit: 500000000,               // 50 crores
  hit: 250000000,                    // 25 crores
  average: 100000000,                // 10 crores
};

// ============================================================
// KNOWLEDGE GRAPH ENGINE
// ============================================================

class KnowledgeGraphEngine {
  /**
   * Generate canonical tags for a movie
   */
  generateTags(movie: any): MovieTags {
    return {
      id: movie.id,
      genres: this.normalizeGenres(movie.genres || []),
      era: this.determineEra(movie.release_year),
      language: movie.language || 'Telugu',
      boxOfficeClass: this.classifyBoxOffice(movie),
      actors: this.extractActors(movie),
      directors: [movie.director].filter(Boolean),
      themes: this.extractThemes(movie),
      decade: this.getDecade(movie.release_year),
      certifications: [movie.certification].filter(Boolean),
    };
  }

  /**
   * Normalize genre tags (canonical names)
   */
  private normalizeGenres(genres: string[]): string[] {
    const genreMap: Record<string, string> = {
      'sci-fi': 'Science Fiction',
      'scifi': 'Science Fiction',
      'adventure': 'Adventure',
      'action': 'Action',
      'drama': 'Drama',
      'comedy': 'Comedy',
      'romance': 'Romance',
      'thriller': 'Thriller',
      'horror': 'Horror',
      'mystery': 'Mystery',
      'crime': 'Crime',
      'fantasy': 'Fantasy',
      'family': 'Family',
      'animation': 'Animation',
    };

    return [...new Set(
      genres
        .map(g => genreMap[g.toLowerCase()] || g)
        .filter(Boolean)
    )];
  }

  /**
   * Determine era based on release year
   */
  private determineEra(releaseYear?: number): MovieTags['era'] {
    if (!releaseYear) return 'modern';

    if (releaseYear >= ERA_DEFINITIONS.new_wave.start) return 'new_wave';
    if (releaseYear >= ERA_DEFINITIONS.modern.start) return 'modern';
    if (releaseYear >= ERA_DEFINITIONS.classic.start) return 'classic';
    return 'golden_age';
  }

  /**
   * Classify box office performance
   */
  private classifyBoxOffice(movie: any): MovieTags['boxOfficeClass'] {
    const gross = movie.worldwide_gross_inr || movie.india_gross_inr || 0;

    // Special classifications
    if (movie.is_classic || movie.verdict === 'all_time_blockbuster') {
      return 'classic';
    }

    if (movie.is_underrated && gross < BOX_OFFICE_THRESHOLDS.hit) {
      return 'hidden_gem';
    }

    // Box office thresholds
    if (gross >= BOX_OFFICE_THRESHOLDS.blockbuster) return 'blockbuster';
    if (gross >= BOX_OFFICE_THRESHOLDS.superhit) return 'superhit';
    if (gross >= BOX_OFFICE_THRESHOLDS.hit) return 'hit';
    if (gross >= BOX_OFFICE_THRESHOLDS.average) return 'average';
    
    return 'flop';
  }

  /**
   * Extract actor entities
   */
  private extractActors(movie: any): string[] {
    const actors: string[] = [];

    if (movie.hero) actors.push(movie.hero);
    if (movie.heroine) actors.push(movie.heroine);

    if (movie.cast_members && Array.isArray(movie.cast_members)) {
      movie.cast_members.slice(0, 5).forEach((cast: any) => {
        const name = typeof cast === 'string' ? cast : cast.name;
        if (name) actors.push(name);
      });
    }

    return [...new Set(actors)];
  }

  /**
   * Extract themes
   */
  private extractThemes(movie: any): string[] {
    const themes: string[] = [];

    // Genre-based themes
    if (movie.genres) {
      if (movie.genres.includes('Action')) themes.push('heroism', 'justice');
      if (movie.genres.includes('Romance')) themes.push('love', 'relationships');
      if (movie.genres.includes('Drama')) themes.push('family', 'emotions');
      if (movie.genres.includes('Comedy')) themes.push('humor', 'entertainment');
    }

    // Plot-based themes
    if (movie.plot_keywords && Array.isArray(movie.plot_keywords)) {
      themes.push(...movie.plot_keywords);
    }

    return [...new Set(themes)];
  }

  /**
   * Get decade label
   */
  private getDecade(releaseYear?: number): string {
    if (!releaseYear) return 'unknown';
    const decade = Math.floor(releaseYear / 10) * 10;
    return `${decade}s`;
  }

  /**
   * Build knowledge graph for a movie
   */
  buildGraph(movie: any, tags: MovieTags): KnowledgeGraphResult {
    const nodes: KnowledgeNode[] = [];
    const edges: KnowledgeEdge[] = [];

    // Movie node
    const movieNode: KnowledgeNode = {
      id: movie.id,
      type: 'movie',
      label: movie.title_en,
      properties: {
        release_year: movie.release_year,
        rating: movie.our_rating,
        ...tags,
      },
    };
    nodes.push(movieNode);

    // Actor nodes & edges
    tags.actors.forEach((actor, idx) => {
      const actorId = this.generateEntityId('actor', actor);
      nodes.push({
        id: actorId,
        type: 'actor',
        label: actor,
        properties: {},
      });

      edges.push({
        from: actorId,
        to: movie.id,
        type: 'acted_in',
        weight: 1.0 - (idx * 0.1), // Lead actors have higher weight
      });
    });

    // Director nodes & edges
    tags.directors.forEach(director => {
      const directorId = this.generateEntityId('director', director);
      nodes.push({
        id: directorId,
        type: 'director',
        label: director,
        properties: {},
      });

      edges.push({
        from: directorId,
        to: movie.id,
        type: 'directed',
        weight: 1.0,
      });
    });

    // Genre nodes & edges
    tags.genres.forEach(genre => {
      const genreId = this.generateEntityId('genre', genre);
      nodes.push({
        id: genreId,
        type: 'genre',
        label: genre,
        properties: {},
      });

      edges.push({
        from: movie.id,
        to: genreId,
        type: 'has_genre',
        weight: 0.8,
      });
    });

    // Era node & edge
    const eraId = `era-${tags.era}`;
    nodes.push({
      id: eraId,
      type: 'era',
      label: tags.era,
      properties: ERA_DEFINITIONS[tags.era],
    });

    edges.push({
      from: movie.id,
      to: eraId,
      type: 'belongs_to_era',
      weight: 0.6,
    });

    // Generate clusters
    const clusters = this.generateClusters(nodes, edges);

    return { nodes, edges, clusters };
  }

  /**
   * Find related entities
   */
  findRelated(movieId: string, allMovies: any[], tags: MovieTags): any[] {
    const related: Array<{ movie: any; score: number; reasons: string[] }> = [];

    allMovies.forEach(otherMovie => {
      if (otherMovie.id === movieId) return;

      const otherTags = this.generateTags(otherMovie);
      const { score, reasons } = this.calculateRelatedness(tags, otherTags);

      if (score > 0.3) {
        related.push({ movie: otherMovie, score, reasons });
      }
    });

    // Sort by score
    related.sort((a, b) => b.score - a.score);

    return related.slice(0, 10);
  }

  /**
   * Calculate relatedness score
   */
  private calculateRelatedness(
    tags1: MovieTags,
    tags2: MovieTags
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Same actors
    const commonActors = tags1.actors.filter(a => tags2.actors.includes(a));
    if (commonActors.length > 0) {
      score += 0.4 * commonActors.length;
      reasons.push(`Shared actors: ${commonActors.join(', ')}`);
    }

    // Same director
    const commonDirectors = tags1.directors.filter(d => tags2.directors.includes(d));
    if (commonDirectors.length > 0) {
      score += 0.3;
      reasons.push(`Same director: ${commonDirectors[0]}`);
    }

    // Same genres
    const commonGenres = tags1.genres.filter(g => tags2.genres.includes(g));
    if (commonGenres.length > 0) {
      score += 0.2 * commonGenres.length;
      reasons.push(`Shared genres: ${commonGenres.join(', ')}`);
    }

    // Same era
    if (tags1.era === tags2.era) {
      score += 0.1;
      reasons.push(`Same era: ${tags1.era}`);
    }

    // Same box office class
    if (tags1.boxOfficeClass === tags2.boxOfficeClass) {
      score += 0.1;
      reasons.push(`Same box office class: ${tags1.boxOfficeClass}`);
    }

    return { score: Math.min(score, 1.0), reasons };
  }

  /**
   * Generate clusters
   */
  private generateClusters(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): any[] {
    const clusters: any[] = [];

    // Cluster by actor
    const actorNodes = nodes.filter(n => n.type === 'actor');
    actorNodes.forEach(actor => {
      const connectedMovies = edges
        .filter(e => e.from === actor.id && e.type === 'acted_in')
        .map(e => e.to);

      if (connectedMovies.length > 0) {
        clusters.push({
          id: `actor-${actor.id}`,
          label: `${actor.label}'s Filmography`,
          nodes: [actor.id, ...connectedMovies],
        });
      }
    });

    // Cluster by genre
    const genreNodes = nodes.filter(n => n.type === 'genre');
    genreNodes.forEach(genre => {
      const connectedMovies = edges
        .filter(e => e.to === genre.id && e.type === 'has_genre')
        .map(e => e.from);

      if (connectedMovies.length > 0) {
        clusters.push({
          id: `genre-${genre.id}`,
          label: `${genre.label} Movies`,
          nodes: [genre.id, ...connectedMovies],
        });
      }
    });

    return clusters;
  }

  /**
   * Generate entity ID
   */
  private generateEntityId(type: string, name: string): string {
    return `${type}-${name.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * Get all tags (for tag cloud/navigation)
   */
  getAllTags(movies: any[]): Record<string, { count: number; movies: string[] }> {
    const tagIndex: Record<string, { count: number; movies: string[] }> = {};

    movies.forEach(movie => {
      const tags = this.generateTags(movie);

      // Index genres
      tags.genres.forEach(genre => {
        if (!tagIndex[`genre:${genre}`]) {
          tagIndex[`genre:${genre}`] = { count: 0, movies: [] };
        }
        tagIndex[`genre:${genre}`].count++;
        tagIndex[`genre:${genre}`].movies.push(movie.id);
      });

      // Index era
      if (!tagIndex[`era:${tags.era}`]) {
        tagIndex[`era:${tags.era}`] = { count: 0, movies: [] };
      }
      tagIndex[`era:${tags.era}`].count++;
      tagIndex[`era:${tags.era}`].movies.push(movie.id);

      // Index box office class
      if (!tagIndex[`boxoffice:${tags.boxOfficeClass}`]) {
        tagIndex[`boxoffice:${tags.boxOfficeClass}`] = { count: 0, movies: [] };
      }
      tagIndex[`boxoffice:${tags.boxOfficeClass}`].count++;
      tagIndex[`boxoffice:${tags.boxOfficeClass}`].movies.push(movie.id);
    });

    return tagIndex;
  }

  /**
   * Ensure zero orphan pages (all entities are linked)
   */
  validateGraph(graph: KnowledgeGraphResult): { valid: boolean; orphans: string[] } {
    const connectedNodes = new Set<string>();

    // Collect all connected nodes
    graph.edges.forEach(edge => {
      connectedNodes.add(edge.from);
      connectedNodes.add(edge.to);
    });

    // Find orphans
    const orphans = graph.nodes
      .filter(node => !connectedNodes.has(node.id))
      .map(node => node.id);

    return {
      valid: orphans.length === 0,
      orphans,
    };
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const knowledgeGraph = new KnowledgeGraphEngine();
export default knowledgeGraph;


