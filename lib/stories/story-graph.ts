/**
 * Connected Stories Graph - Phase 12
 * 
 * Builds a story graph connecting movies, actors, events, and timeline:
 * - Entity-based connections (actor → movies, director → filmography)
 * - Event-based connections (OTT release, awards, anniversaries)
 * - Timeline visualization (movie release → trailer → review → OTT)
 * - Mini-timeline UI components
 * - "Continue the story" recommendations
 * - Zero manual curation (all automated)
 * 
 * Usage:
 *   import { storyGraph } from '@/lib/stories/story-graph';
 *   
 *   // Build story graph for a movie
 *   const story = storyGraph.buildMovieStory(movie);
 *   
 *   // Get connected stories
 *   const related = storyGraph.getConnectedStories(movieId);
 */

// ============================================================
// TYPES
// ============================================================

export type StoryNodeType = 'movie' | 'actor' | 'director' | 'event' | 'milestone';
export type EventType = 'announcement' | 'trailer' | 'release' | 'ott_release' | 'award' | 'anniversary';

export interface StoryNode {
  id: string;
  type: StoryNodeType;
  title: string;
  date?: Date;
  description?: string;
  image?: string;
  link?: string;
  metadata?: Record<string, any>;
}

export interface StoryConnection {
  from: string; // node ID
  to: string; // node ID
  type: 'actor' | 'director' | 'sequel' | 'remake' | 'same_universe' | 'timeline';
  strength: number; // 0-1
  label?: string;
}

export interface MovieStory {
  movieId: string;
  title: string;
  timeline: StoryNode[];
  relatedMovies: Array<{ movie: any; connection: string }>;
  relatedActors: Array<{ actor: any; role: string }>;
  milestones: StoryNode[];
}

export interface ConnectedStory {
  mainNode: StoryNode;
  connections: StoryConnection[];
  relatedNodes: StoryNode[];
  timeline: StoryNode[];
}

// ============================================================
// STORY GRAPH ENGINE
// ============================================================

class StoryGraphEngine {
  /**
   * Build comprehensive story for a movie
   */
  buildMovieStory(movie: any): MovieStory {
    const timeline = this.buildTimeline(movie);
    const relatedMovies = this.findRelatedMovies(movie);
    const relatedActors = this.findRelatedActors(movie);
    const milestones = this.extractMilestones(movie);

    return {
      movieId: movie.id,
      title: movie.title_en,
      timeline,
      relatedMovies,
      relatedActors,
      milestones,
    };
  }

  /**
   * Build timeline for a movie
   */
  private buildTimeline(movie: any): StoryNode[] {
    const timeline: StoryNode[] = [];

    // 1. Announcement (if available)
    if (movie.announcement_date) {
      timeline.push({
        id: `announcement-${movie.id}`,
        type: 'event',
        title: 'Movie Announced',
        date: new Date(movie.announcement_date),
        description: `${movie.title_en} officially announced`,
        link: `/reviews/${movie.slug}`,
      });
    }

    // 2. Trailer Release (estimated as 2-3 months before release)
    if (movie.release_date && movie.trailer_url) {
      const releaseDate = new Date(movie.release_date);
      const trailerDate = new Date(releaseDate);
      trailerDate.setMonth(trailerDate.getMonth() - 2);

      timeline.push({
        id: `trailer-${movie.id}`,
        type: 'event',
        title: 'Trailer Released',
        date: trailerDate,
        description: 'Official trailer launched',
        link: movie.trailer_url,
        image: movie.poster_url,
      });
    }

    // 3. Theatrical Release
    if (movie.release_date) {
      timeline.push({
        id: `release-${movie.id}`,
        type: 'milestone',
        title: 'Theatrical Release',
        date: new Date(movie.release_date),
        description: `${movie.title_en} hits theaters`,
        link: `/reviews/${movie.slug}`,
        image: movie.backdrop_url,
        metadata: {
          verdict: movie.verdict,
          boxOffice: movie.worldwide_gross_inr,
        },
      });
    }

    // 4. OTT Release
    if (movie.ott_release_date) {
      timeline.push({
        id: `ott-${movie.id}`,
        type: 'event',
        title: 'OTT Release',
        date: new Date(movie.ott_release_date),
        description: `Now streaming on ${movie.ott_platforms?.join(', ')}`,
        link: `/reviews/${movie.slug}`,
        metadata: {
          platforms: movie.ott_platforms,
        },
      });
    }

    // 5. Awards (if available)
    // This would be populated from awards data

    // Sort by date
    timeline.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return a.date.getTime() - b.date.getTime();
    });

    return timeline;
  }

  /**
   * Find related movies
   */
  private findRelatedMovies(movie: any): Array<{ movie: any; connection: string }> {
    const related: Array<{ movie: any; connection: string }> = [];

    // 1. Same Actor (would query database in real implementation)
    // For now, returning structure

    // 2. Same Director
    if (movie.director) {
      // Would query: movies by same director
      related.push({
        movie: null, // Placeholder
        connection: `Directed by ${movie.director}`,
      });
    }

    // 3. Same Genre
    if (movie.genres && movie.genres.length > 0) {
      related.push({
        movie: null,
        connection: `${movie.genres[0]} movies`,
      });
    }

    // 4. Sequel/Prequel (if metadata exists)
    if (movie.is_sequel_to) {
      related.push({
        movie: null,
        connection: 'Sequel to',
      });
    }

    // 5. Remake (if metadata exists)
    if (movie.is_remake || movie.original_movie_id) {
      related.push({
        movie: null,
        connection: 'Remake of',
      });
    }

    return related;
  }

  /**
   * Find related actors
   */
  private findRelatedActors(movie: any): Array<{ actor: any; role: string }> {
    const actors: Array<{ actor: any; role: string }> = [];

    if (movie.hero) {
      actors.push({
        actor: { name: movie.hero },
        role: 'Hero',
      });
    }

    if (movie.heroine) {
      actors.push({
        actor: { name: movie.heroine },
        role: 'Heroine',
      });
    }

    if (movie.cast_members && Array.isArray(movie.cast_members)) {
      movie.cast_members.slice(0, 5).forEach((cast: any) => {
        actors.push({
          actor: cast,
          role: cast.character || 'Cast',
        });
      });
    }

    return actors;
  }

  /**
   * Extract key milestones
   */
  private extractMilestones(movie: any): StoryNode[] {
    const milestones: StoryNode[] = [];

    // Box office milestones
    if (movie.worldwide_gross_inr) {
      const gross = movie.worldwide_gross_inr;
      if (gross >= 1000000000) { // 100 crore+
        milestones.push({
          id: `milestone-boxoffice-${movie.id}`,
          type: 'milestone',
          title: 'Box Office Blockbuster',
          description: `Crossed ₹${(gross / 10000000).toFixed(0)} crores worldwide`,
        });
      }
    }

    // Verdict milestones
    if (movie.verdict === 'all_time_blockbuster') {
      milestones.push({
        id: `milestone-verdict-${movie.id}`,
        type: 'milestone',
        title: 'All-Time Blockbuster',
        description: 'Certified as an all-time industry hit',
      });
    }

    // Rating milestones
    if (movie.our_rating >= 9) {
      milestones.push({
        id: `milestone-rating-${movie.id}`,
        type: 'milestone',
        title: 'Critically Acclaimed',
        description: `Rated ${movie.our_rating}/10 by TeluguVibes`,
      });
    }

    return milestones;
  }

  /**
   * Get connected stories for a movie
   */
  getConnectedStories(movieId: string, movie: any): ConnectedStory {
    const mainNode: StoryNode = {
      id: movieId,
      type: 'movie',
      title: movie.title_en,
      date: movie.release_date ? new Date(movie.release_date) : undefined,
      description: movie.synopsis,
      image: movie.poster_url,
      link: `/reviews/${movie.slug}`,
    };

    const connections: StoryConnection[] = [];
    const relatedNodes: StoryNode[] = [];

    // Actor connections
    [movie.hero, movie.heroine].filter(Boolean).forEach((actor: string, idx: number) => {
      const actorId = `actor-${actor.toLowerCase().replace(/\s+/g, '-')}`;
      
      relatedNodes.push({
        id: actorId,
        type: 'actor',
        title: actor,
        link: `/celebrities/${actorId}`,
      });

      connections.push({
        from: movieId,
        to: actorId,
        type: 'actor',
        strength: idx === 0 ? 1.0 : 0.9, // Hero has stronger connection
        label: idx === 0 ? 'Starring' : 'Co-starring',
      });
    });

    // Director connection
    if (movie.director) {
      const directorId = `director-${movie.director.toLowerCase().replace(/\s+/g, '-')}`;
      
      relatedNodes.push({
        id: directorId,
        type: 'director',
        title: movie.director,
        link: `/celebrities/${directorId}`,
      });

      connections.push({
        from: movieId,
        to: directorId,
        type: 'director',
        strength: 1.0,
        label: 'Directed by',
      });
    }

    const timeline = this.buildTimeline(movie);

    return {
      mainNode,
      connections,
      relatedNodes,
      timeline,
    };
  }

  /**
   * Generate "Continue the story" recommendations
   */
  continueTheStory(currentMovie: any, allMovies: any[]): any[] {
    const recommendations: any[] = [];

    // 1. Same actor's other movies
    const sameActorMovies = allMovies.filter(m => 
      m.id !== currentMovie.id &&
      (m.hero === currentMovie.hero || m.heroine === currentMovie.heroine)
    );
    recommendations.push(...sameActorMovies.slice(0, 3));

    // 2. Same director's other movies
    if (currentMovie.director) {
      const sameDirectorMovies = allMovies.filter(m =>
        m.id !== currentMovie.id &&
        m.director === currentMovie.director
      );
      recommendations.push(...sameDirectorMovies.slice(0, 2));
    }

    // 3. Same genre movies from same era
    const sameGenreEra = allMovies.filter(m =>
      m.id !== currentMovie.id &&
      m.genres?.some((g: string) => currentMovie.genres?.includes(g)) &&
      m.era === currentMovie.era
    );
    recommendations.push(...sameGenreEra.slice(0, 2));

    // Deduplicate and limit
    const unique = Array.from(new Set(recommendations.map(m => m.id)))
      .map(id => recommendations.find(m => m.id === id))
      .filter(Boolean)
      .slice(0, 6);

    return unique;
  }

  /**
   * Build actor filmography timeline
   */
  buildActorTimeline(actorName: string, movies: any[]): StoryNode[] {
    const actorMovies = movies.filter(m =>
      m.hero === actorName || m.heroine === actorName
    );

    const timeline = actorMovies
      .filter(m => m.release_date)
      .sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime())
      .map(movie => ({
        id: movie.id,
        type: 'movie' as StoryNodeType,
        title: movie.title_en,
        date: new Date(movie.release_date),
        description: movie.synopsis?.slice(0, 100),
        image: movie.poster_url,
        link: `/reviews/${movie.slug}`,
        metadata: {
          verdict: movie.verdict,
          rating: movie.our_rating,
        },
      }));

    return timeline;
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const storyGraph = new StoryGraphEngine();
export default storyGraph;


