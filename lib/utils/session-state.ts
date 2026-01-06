/**
 * SESSION STATE MANAGER
 * 
 * Manages cross-page state persistence for improved UX.
 * 
 * Features:
 * - Preserves scroll position across navigation
 * - Tracks active carousels and filters
 * - Persists modal state
 * - Handles tag click history
 * 
 * Storage Strategy:
 * - sessionStorage for volatile state (cleared on browser close)
 * - URL params for shareable state (filters, active sections)
 */

// ============================================================
// TYPES
// ============================================================

export interface ReviewPageState {
  /** Current scroll position */
  scrollY: number;
  /** Currently active/visible carousel ID */
  activeCarouselId?: string;
  /** Active filter values */
  activeFilters: string[];
  /** Tags that have been clicked in this session */
  clickedTags: string[];
  /** Whether a modal is currently open */
  modalOpen: boolean;
  /** ID of the last viewed movie */
  lastMovieId?: string;
  /** Timestamp of last update */
  timestamp: number;
}

export interface MoviePageState {
  /** Current scroll position */
  scrollY: number;
  /** Active tab (reviews, similar, etc.) */
  activeTab?: string;
  /** Expanded sections */
  expandedSections: string[];
  /** Timestamp of last update */
  timestamp: number;
}

export interface SearchState {
  /** Last search query */
  query: string;
  /** Selected filters */
  filters: Record<string, string[]>;
  /** Current page */
  page: number;
  /** Scroll position */
  scrollY: number;
  /** Timestamp */
  timestamp: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_PREFIX = 'telugu_session_';
const DEFAULT_MAX_AGE = 30 * 60 * 1000; // 30 minutes

// ============================================================
// SESSION STATE MANAGER CLASS
// ============================================================

/**
 * Manages session state for review pages and navigation
 */
export class SessionStateManager {
  private maxAge: number;
  private prefix: string;

  constructor(options?: { maxAge?: number; prefix?: string }) {
    this.maxAge = options?.maxAge ?? DEFAULT_MAX_AGE;
    this.prefix = options?.prefix ?? STORAGE_PREFIX;
  }

  // ============================================================
  // GENERIC STATE OPERATIONS
  // ============================================================

  /**
   * Save page state
   */
  savePageState<T extends { timestamp?: number }>(
    path: string,
    state: Partial<T>
  ): void {
    if (typeof window === 'undefined') return;

    const key = this.getKey(path);
    const existingState = this.getPageState<T>(path);

    const newState = {
      ...existingState,
      ...state,
      timestamp: Date.now(),
    };

    try {
      sessionStorage.setItem(key, JSON.stringify(newState));
    } catch (error) {
      // Storage might be full, try clearing old entries
      this.clearExpiredEntries();
      try {
        sessionStorage.setItem(key, JSON.stringify(newState));
      } catch {
        // Still failing, give up silently
      }
    }
  }

  /**
   * Get page state
   */
  getPageState<T extends { timestamp?: number }>(path: string): T | null {
    if (typeof window === 'undefined') return null;

    const key = this.getKey(path);

    try {
      const stored = sessionStorage.getItem(key);
      if (!stored) return null;

      const state = JSON.parse(stored) as T & { timestamp: number };

      // Check expiration
      if (Date.now() - state.timestamp > this.maxAge) {
        sessionStorage.removeItem(key);
        return null;
      }

      return state;
    } catch {
      return null;
    }
  }

  /**
   * Clear page state
   */
  clearPageState(path: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.getKey(path));
  }

  // ============================================================
  // REVIEW PAGE SPECIFIC OPERATIONS
  // ============================================================

  /**
   * Save review page state
   */
  saveReviewPageState(
    path: string,
    state: Partial<Omit<ReviewPageState, 'timestamp'>>
  ): void {
    this.savePageState<ReviewPageState>(path, {
      scrollY: state.scrollY ?? window?.scrollY ?? 0,
      activeCarouselId: state.activeCarouselId,
      activeFilters: state.activeFilters ?? [],
      clickedTags: state.clickedTags ?? [],
      modalOpen: state.modalOpen ?? false,
      lastMovieId: state.lastMovieId,
    });
  }

  /**
   * Get review page state
   */
  getReviewPageState(path: string): ReviewPageState | null {
    return this.getPageState<ReviewPageState>(path);
  }

  /**
   * Record a tag click
   */
  recordTagClick(path: string, tag: string): void {
    const existing = this.getReviewPageState(path);
    const clickedTags = existing?.clickedTags ?? [];

    if (!clickedTags.includes(tag)) {
      clickedTags.push(tag);
    }

    this.saveReviewPageState(path, {
      ...existing,
      clickedTags,
    });
  }

  /**
   * Check if tag was clicked
   */
  wasTagClicked(path: string, tag: string): boolean {
    const state = this.getReviewPageState(path);
    return state?.clickedTags?.includes(tag) ?? false;
  }

  /**
   * Set modal state
   */
  setModalState(path: string, isOpen: boolean): void {
    const existing = this.getReviewPageState(path);
    this.saveReviewPageState(path, {
      ...existing,
      modalOpen: isOpen,
    });
  }

  // ============================================================
  // MOVIE PAGE SPECIFIC OPERATIONS
  // ============================================================

  /**
   * Save movie page state
   */
  saveMoviePageState(
    path: string,
    state: Partial<Omit<MoviePageState, 'timestamp'>>
  ): void {
    this.savePageState<MoviePageState>(path, {
      scrollY: state.scrollY ?? window?.scrollY ?? 0,
      activeTab: state.activeTab,
      expandedSections: state.expandedSections ?? [],
    });
  }

  /**
   * Get movie page state
   */
  getMoviePageState(path: string): MoviePageState | null {
    return this.getPageState<MoviePageState>(path);
  }

  // ============================================================
  // SEARCH STATE OPERATIONS
  // ============================================================

  /**
   * Save search state
   */
  saveSearchState(state: Partial<Omit<SearchState, 'timestamp'>>): void {
    this.savePageState<SearchState>('__search__', {
      query: state.query ?? '',
      filters: state.filters ?? {},
      page: state.page ?? 1,
      scrollY: state.scrollY ?? window?.scrollY ?? 0,
    });
  }

  /**
   * Get search state
   */
  getSearchState(): SearchState | null {
    return this.getPageState<SearchState>('__search__');
  }

  // ============================================================
  // NAVIGATION HELPERS
  // ============================================================

  /**
   * Restore scroll position for a path
   */
  restoreScrollPosition(path: string, delay: number = 50): void {
    if (typeof window === 'undefined') return;

    const state = this.getReviewPageState(path) || this.getMoviePageState(path);
    if (state?.scrollY) {
      setTimeout(() => {
        window.scrollTo({
          top: state.scrollY,
          behavior: 'auto',
        });
      }, delay);
    }
  }

  /**
   * Save current scroll position before navigation
   */
  saveBeforeNavigation(currentPath: string): void {
    if (typeof window === 'undefined') return;

    const existingReview = this.getReviewPageState(currentPath);
    const existingMovie = this.getMoviePageState(currentPath);

    if (existingReview) {
      this.saveReviewPageState(currentPath, {
        ...existingReview,
        scrollY: window.scrollY,
      });
    } else if (existingMovie) {
      this.saveMoviePageState(currentPath, {
        ...existingMovie,
        scrollY: window.scrollY,
      });
    } else {
      // Create minimal state with scroll position
      this.saveReviewPageState(currentPath, {
        scrollY: window.scrollY,
      });
    }
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  /**
   * Get storage key for a path
   */
  private getKey(path: string): string {
    // Create a consistent hash from path
    const hash = path
      .split('')
      .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
    return `${this.prefix}${Math.abs(hash).toString(36)}`;
  }

  /**
   * Clear all expired entries
   */
  clearExpiredEntries(): void {
    if (typeof window === 'undefined') return;

    const keysToRemove: string[] = [];
    const now = Date.now();

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        try {
          const value = sessionStorage.getItem(key);
          if (value) {
            const state = JSON.parse(value);
            if (state.timestamp && now - state.timestamp > this.maxAge) {
              keysToRemove.push(key);
            }
          }
        } catch {
          keysToRemove.push(key!);
        }
      }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  }

  /**
   * Clear all session state
   */
  clearAll(): void {
    if (typeof window === 'undefined') return;

    const keysToRemove: string[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

/**
 * Default session state manager instance
 */
export const sessionState = new SessionStateManager();

// ============================================================
// REACT HOOK
// ============================================================

import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hook for using session state in React components
 */
export function useSessionState() {
  const pathname = usePathname();

  const saveCurrentState = useCallback(
    (state: Partial<Omit<ReviewPageState, 'timestamp'>>) => {
      sessionState.saveReviewPageState(pathname, state);
    },
    [pathname]
  );

  const getCurrentState = useCallback(() => {
    return sessionState.getReviewPageState(pathname);
  }, [pathname]);

  const restoreScroll = useCallback(() => {
    sessionState.restoreScrollPosition(pathname);
  }, [pathname]);

  const recordTag = useCallback(
    (tag: string) => {
      sessionState.recordTagClick(pathname, tag);
    },
    [pathname]
  );

  const wasClicked = useCallback(
    (tag: string) => {
      return sessionState.wasTagClicked(pathname, tag);
    },
    [pathname]
  );

  const setModal = useCallback(
    (isOpen: boolean) => {
      sessionState.setModalState(pathname, isOpen);
    },
    [pathname]
  );

  // Save state before unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionState.saveBeforeNavigation(pathname);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also save on unmount
      sessionState.saveBeforeNavigation(pathname);
    };
  }, [pathname]);

  return {
    saveState: saveCurrentState,
    getState: getCurrentState,
    restoreScroll,
    recordTagClick: recordTag,
    wasTagClicked: wasClicked,
    setModalOpen: setModal,
    pathname,
  };
}

export default sessionState;

