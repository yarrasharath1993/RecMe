/**
 * Browser-Only Personalization Engine
 * 
 * GDPR-safe, privacy-first personalization using only localStorage
 * NO cookies, NO backend tracking, NO user profiles
 * 
 * Features:
 * - Actor/Director preference tracking
 * - Genre affinity learning
 * - Era preference detection
 * - Language preference
 * - Watch history (local only)
 * - Personalized recommendations
 * 
 * Usage:
 *   import { personalization } from '@/lib/utils/personalization';
 *   
 *   // Track interaction
 *   personalization.trackMovieView(movieId, { actors, genres, language });
 *   
 *   // Get recommendations
 *   const recommendations = personalization.getRecommendations(movies);
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================
// TYPES
// ============================================================

interface MovieInteraction {
  movieId: string;
  title: string;
  timestamp: number;
  actors?: string[];
  director?: string;
  genres?: string[];
  language?: string;
  era?: string;
  rating?: number;
  action: 'view' | 'rate' | 'favorite' | 'share';
}

interface UserPreferences {
  favoriteActors: Record<string, number>; // actor → score
  favoriteDirectors: Record<string, number>; // director → score
  genreAffinity: Record<string, number>; // genre → score
  languagePreference: Record<string, number>; // language → score
  eraPreference: Record<string, number>; // era → score
  lastUpdated: number;
}

interface WatchHistory {
  movieIds: string[];
  interactions: MovieInteraction[];
  maxSize: number;
}

interface PersonalizationScores {
  actorScore: number;
  directorScore: number;
  genreScore: number;
  languageScore: number;
  eraScore: number;
  totalScore: number;
}

// ============================================================
// STORAGE KEYS
// ============================================================

const STORAGE_KEYS = {
  PREFERENCES: 'teluguvibes_preferences',
  HISTORY: 'teluguvibes_history',
  FAVORITES: 'teluguvibes_favorites',
  SETTINGS: 'teluguvibes_settings',
} as const;

// ============================================================
// PERSONALIZATION ENGINE
// ============================================================

class PersonalizationEngine {
  private preferences: UserPreferences;
  private history: WatchHistory;
  private favorites: Set<string>;

  constructor() {
    this.preferences = this.loadPreferences();
    this.history = this.loadHistory();
    this.favorites = this.loadFavorites();
  }

  // ============================================================
  // STORAGE OPERATIONS
  // ============================================================

  private loadPreferences(): UserPreferences {
    if (typeof window === 'undefined') {
      return this.getDefaultPreferences();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (!stored) return this.getDefaultPreferences();

      const parsed = JSON.parse(stored);
      
      // Check if data is stale (> 90 days)
      if (Date.now() - parsed.lastUpdated > 90 * 24 * 60 * 60 * 1000) {
        return this.getDefaultPreferences();
      }

      return parsed;
    } catch (error) {
      console.warn('Failed to load preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  private loadHistory(): WatchHistory {
    if (typeof window === 'undefined') {
      return { movieIds: [], interactions: [], maxSize: 100 };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!stored) return { movieIds: [], interactions: [], maxSize: 100 };

      return JSON.parse(stored);
    } catch (error) {
      console.warn('Failed to load history:', error);
      return { movieIds: [], interactions: [], maxSize: 100 };
    }
  }

  private loadFavorites(): Set<string> {
    if (typeof window === 'undefined') {
      return new Set();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (!stored) return new Set();

      return new Set(JSON.parse(stored));
    } catch (error) {
      console.warn('Failed to load favorites:', error);
      return new Set();
    }
  }

  private savePreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      this.preferences.lastUpdated = Date.now();
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save preferences:', error);
    }
  }

  private saveHistory(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
    } catch (error) {
      console.warn('Failed to save history:', error);
    }
  }

  private saveFavorites(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([...this.favorites]));
    } catch (error) {
      console.warn('Failed to save favorites:', error);
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      favoriteActors: {},
      favoriteDirectors: {},
      genreAffinity: {},
      languagePreference: {},
      eraPreference: {},
      lastUpdated: Date.now(),
    };
  }

  // ============================================================
  // TRACKING OPERATIONS
  // ============================================================

  trackMovieView(movieId: string, metadata: {
    title: string;
    actors?: string[];
    director?: string;
    genres?: string[];
    language?: string;
    era?: string;
    rating?: number;
  }): void {
    // Add to history
    const interaction: MovieInteraction = {
      movieId,
      title: metadata.title,
      timestamp: Date.now(),
      actors: metadata.actors,
      director: metadata.director,
      genres: metadata.genres,
      language: metadata.language,
      era: metadata.era,
      rating: metadata.rating,
      action: 'view',
    };

    this.history.interactions.push(interaction);
    if (!this.history.movieIds.includes(movieId)) {
      this.history.movieIds.push(movieId);
    }

    // Trim history if too large
    if (this.history.interactions.length > this.history.maxSize) {
      this.history.interactions = this.history.interactions.slice(-this.history.maxSize);
      this.history.movieIds = this.history.movieIds.slice(-this.history.maxSize);
    }

    // Update preferences
    this.updatePreferences(metadata);

    // Save
    this.saveHistory();
    this.savePreferences();
  }

  trackRating(movieId: string, rating: number, metadata: any): void {
    this.trackMovieView(movieId, { ...metadata, rating });
    
    // Higher weight for rated movies
    if (rating >= 7) {
      this.updatePreferences(metadata, 2); // 2x weight for high ratings
    }
  }

  toggleFavorite(movieId: string): boolean {
    if (this.favorites.has(movieId)) {
      this.favorites.delete(movieId);
      this.saveFavorites();
      return false;
    } else {
      this.favorites.add(movieId);
      this.saveFavorites();
      return true;
    }
  }

  isFavorite(movieId: string): boolean {
    return this.favorites.has(movieId);
  }

  private updatePreferences(metadata: any, weight: number = 1): void {
    // Update actor preferences
    if (metadata.actors) {
      metadata.actors.forEach((actor: string) => {
        this.preferences.favoriteActors[actor] = 
          (this.preferences.favoriteActors[actor] || 0) + weight;
      });
    }

    // Update director preferences
    if (metadata.director) {
      this.preferences.favoriteDirectors[metadata.director] = 
        (this.preferences.favoriteDirectors[metadata.director] || 0) + weight;
    }

    // Update genre affinity
    if (metadata.genres) {
      metadata.genres.forEach((genre: string) => {
        this.preferences.genreAffinity[genre] = 
          (this.preferences.genreAffinity[genre] || 0) + weight;
      });
    }

    // Update language preference
    if (metadata.language) {
      this.preferences.languagePreference[metadata.language] = 
        (this.preferences.languagePreference[metadata.language] || 0) + weight;
    }

    // Update era preference
    if (metadata.era) {
      this.preferences.eraPreference[metadata.era] = 
        (this.preferences.eraPreference[metadata.era] || 0) + weight;
    }
  }

  // ============================================================
  // RECOMMENDATION ENGINE
  // ============================================================

  getPersonalizationScore(movie: any): PersonalizationScores {
    let actorScore = 0;
    let directorScore = 0;
    let genreScore = 0;
    let languageScore = 0;
    let eraScore = 0;

    // Actor score
    if (movie.actors) {
      const actors = Array.isArray(movie.actors) ? movie.actors : [movie.hero, movie.heroine].filter(Boolean);
      actors.forEach((actor: string) => {
        actorScore += this.preferences.favoriteActors[actor] || 0;
      });
      actorScore = actorScore / (actors.length || 1); // Average
    }

    // Director score
    if (movie.director) {
      directorScore = this.preferences.favoriteDirectors[movie.director] || 0;
    }

    // Genre score
    if (movie.genres) {
      const genres = Array.isArray(movie.genres) ? movie.genres : [];
      genres.forEach((genre: string) => {
        genreScore += this.preferences.genreAffinity[genre] || 0;
      });
      genreScore = genreScore / (genres.length || 1); // Average
    }

    // Language score
    if (movie.language) {
      languageScore = this.preferences.languagePreference[movie.language] || 0;
    }

    // Era score
    if (movie.era) {
      eraScore = this.preferences.eraPreference[movie.era] || 0;
    }

    // Weighted total (actor and director matter more)
    const totalScore = 
      actorScore * 3 + 
      directorScore * 2.5 + 
      genreScore * 1.5 + 
      languageScore * 1 + 
      eraScore * 1;

    return {
      actorScore,
      directorScore,
      genreScore,
      languageScore,
      eraScore,
      totalScore,
    };
  }

  getRecommendations<T extends any>(movies: T[], limit: number = 10): T[] {
    // Filter out already watched
    const unwatched = movies.filter((movie: any) => 
      !this.history.movieIds.includes(movie.id)
    );

    // Score each movie
    const scored = unwatched.map(movie => ({
      movie,
      score: this.getPersonalizationScore(movie).totalScore,
    }));

    // Sort by score (descending)
    scored.sort((a, b) => b.score - a.score);

    // Return top N
    return scored.slice(0, limit).map(item => item.movie);
  }

  getTopActors(limit: number = 5): Array<{ name: string; score: number }> {
    return Object.entries(this.preferences.favoriteActors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([name, score]) => ({ name, score }));
  }

  getTopGenres(limit: number = 5): Array<{ name: string; score: number }> {
    return Object.entries(this.preferences.genreAffinity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([name, score]) => ({ name, score }));
  }

  getWatchHistory(limit?: number): MovieInteraction[] {
    const history = [...this.history.interactions].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  getFavorites(): string[] {
    return [...this.favorites];
  }

  // ============================================================
  // DATA MANAGEMENT
  // ============================================================

  clearHistory(): void {
    this.history = { movieIds: [], interactions: [], maxSize: 100 };
    this.saveHistory();
  }

  clearPreferences(): void {
    this.preferences = this.getDefaultPreferences();
    this.savePreferences();
  }

  clearFavorites(): void {
    this.favorites.clear();
    this.saveFavorites();
  }

  clearAll(): void {
    this.clearHistory();
    this.clearPreferences();
    this.clearFavorites();
  }

  exportData(): string {
    return JSON.stringify({
      preferences: this.preferences,
      history: this.history,
      favorites: [...this.favorites],
    }, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.preferences) {
        this.preferences = data.preferences;
        this.savePreferences();
      }
      
      if (data.history) {
        this.history = data.history;
        this.saveHistory();
      }
      
      if (data.favorites) {
        this.favorites = new Set(data.favorites);
        this.saveFavorites();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const personalization = new PersonalizationEngine();

// ============================================================
// REACT HOOKS
// ============================================================

/**
 * Hook for personalized recommendations
 */
export function usePersonalizedRecommendations<T extends any>(movies: T[], limit: number = 10) {
  const [recommendations, setRecommendations] = useState<T[]>([]);

  useEffect(() => {
    const recs = personalization.getRecommendations(movies, limit);
    setRecommendations(recs);
  }, [movies, limit]);

  return recommendations;
}

/**
 * Hook for favorite management
 */
export function useFavorite(movieId: string) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(personalization.isFavorite(movieId));
  }, [movieId]);

  const toggle = useCallback(() => {
    const newState = personalization.toggleFavorite(movieId);
    setIsFavorite(newState);
    return newState;
  }, [movieId]);

  return { isFavorite, toggle };
}

/**
 * Hook for user preferences
 */
export function useUserPreferences() {
  const [topActors, setTopActors] = useState<Array<{ name: string; score: number }>>([]);
  const [topGenres, setTopGenres] = useState<Array<{ name: string; score: number }>>([]);
  const [watchHistory, setWatchHistory] = useState<MovieInteraction[]>([]);

  const refresh = useCallback(() => {
    setTopActors(personalization.getTopActors(5));
    setTopGenres(personalization.getTopGenres(5));
    setWatchHistory(personalization.getWatchHistory(10));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    topActors,
    topGenres,
    watchHistory,
    refresh,
    clearAll: personalization.clearAll.bind(personalization),
    exportData: personalization.exportData.bind(personalization),
    importData: personalization.importData.bind(personalization),
  };
}

/**
 * Hook to track movie view
 */
export function useTrackMovieView() {
  return useCallback((movieId: string, metadata: any) => {
    personalization.trackMovieView(movieId, metadata);
  }, []);
}

export default personalization;


