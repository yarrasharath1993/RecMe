/**
 * Scroll Preservation Utility
 * 
 * Preserves scroll position across:
 * - Tab changes
 * - Modal open/close
 * - Navigation
 * - Filter updates
 * 
 * Usage:
 *   const scrollManager = useScrollPreservation('reviews-page');
 *   
 *   // Save scroll before navigation
 *   scrollManager.save();
 *   
 *   // Restore scroll after navigation
 *   scrollManager.restore();
 */

import { useEffect, useRef, useCallback } from 'react';

interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

class ScrollManager {
  private storage: Map<string, ScrollPosition> = new Map();
  private storageKey = 'scroll-positions';
  
  constructor() {
    // Load from sessionStorage on init
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(this.storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.storage = new Map(Object.entries(parsed));
        }
      } catch (e) {
        console.warn('Failed to load scroll positions:', e);
      }
    }
  }

  save(key: string, x: number = window.scrollX, y: number = window.scrollY): void {
    this.storage.set(key, { x, y, timestamp: Date.now() });
    this.persist();
  }

  restore(key: string, options?: { smooth?: boolean; timeout?: number }): boolean {
    const position = this.storage.get(key);
    
    if (!position) return false;

    // Don't restore if too old (> 30 minutes)
    if (Date.now() - position.timestamp > 30 * 60 * 1000) {
      this.storage.delete(key);
      this.persist();
      return false;
    }

    const timeout = options?.timeout || 100;

    setTimeout(() => {
      window.scrollTo({
        left: position.x,
        top: position.y,
        behavior: options?.smooth ? 'smooth' : 'auto',
      });
    }, timeout);

    return true;
  }

  clear(key: string): void {
    this.storage.delete(key);
    this.persist();
  }

  clearAll(): void {
    this.storage.clear();
    this.persist();
  }

  private persist(): void {
    if (typeof window !== 'undefined') {
      try {
        const obj = Object.fromEntries(this.storage.entries());
        sessionStorage.setItem(this.storageKey, JSON.stringify(obj));
      } catch (e) {
        console.warn('Failed to persist scroll positions:', e);
      }
    }
  }
}

// Singleton instance
const scrollManager = new ScrollManager();

/**
 * React hook for scroll preservation
 */
export function useScrollPreservation(key: string) {
  const elementRef = useRef<HTMLElement | null>(null);
  const savedPosition = useRef<ScrollPosition | null>(null);

  // Save scroll position
  const save = useCallback(() => {
    if (elementRef.current) {
      savedPosition.current = {
        x: elementRef.current.scrollLeft,
        y: elementRef.current.scrollTop,
        timestamp: Date.now(),
      };
    } else {
      scrollManager.save(key);
    }
  }, [key]);

  // Restore scroll position
  const restore = useCallback((options?: { smooth?: boolean; timeout?: number }) => {
    if (elementRef.current && savedPosition.current) {
      const timeout = options?.timeout || 0;
      setTimeout(() => {
        if (elementRef.current && savedPosition.current) {
          elementRef.current.scrollTo({
            left: savedPosition.current.x,
            top: savedPosition.current.y,
            behavior: options?.smooth ? 'smooth' : 'auto',
          });
        }
      }, timeout);
    } else {
      scrollManager.restore(key, options);
    }
  }, [key]);

  // Clear saved position
  const clear = useCallback(() => {
    savedPosition.current = null;
    scrollManager.clear(key);
  }, [key]);

  // Auto-save on unmount
  useEffect(() => {
    return () => {
      save();
    };
  }, [save]);

  return {
    elementRef,
    save,
    restore,
    clear,
  };
}

/**
 * Hook to prevent scroll-to-top on state changes
 */
export function usePreventScrollReset() {
  useEffect(() => {
    // Prevent Next.js from scrolling to top on route change
    const handleRouteChange = () => {
      window.history.scrollRestoration = 'manual';
    };

    handleRouteChange();

    return () => {
      window.history.scrollRestoration = 'auto';
    };
  }, []);
}

/**
 * Hook for modal scroll lock (prevents background scrolling)
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Measure scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isLocked]);
}

/**
 * Smooth scroll to element
 */
export function smoothScrollTo(
  element: HTMLElement | null,
  options?: { offset?: number; behavior?: ScrollBehavior }
) {
  if (!element) return;

  const offset = options?.offset || 0;
  const behavior = options?.behavior || 'smooth';

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior,
  });
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement, offset: number = 0): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= -offset &&
    rect.left >= -offset &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
  );
}

export default scrollManager;


