/**
 * Accessibility Utilities
 * 
 * Ensures WCAG 2.1 AA compliance across the platform
 * 
 * Features:
 * - ARIA attributes generation
 * - Keyboard navigation helpers
 * - Focus management
 * - Screen reader announcements
 * - Color contrast validation
 * - Semantic HTML helpers
 */

import { useEffect, useRef, useState } from 'react';

// ============================================================
// ARIA HELPERS
// ============================================================

/**
 * Generate ARIA attributes for interactive elements
 */
export function ariaButton(label: string, options?: {
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  describedBy?: string;
}) {
  return {
    role: 'button',
    'aria-label': label,
    ...(options?.pressed !== undefined && { 'aria-pressed': options.pressed }),
    ...(options?.expanded !== undefined && { 'aria-expanded': options.expanded }),
    ...(options?.controls && { 'aria-controls': options.controls }),
    ...(options?.describedBy && { 'aria-describedby': options.describedBy }),
    tabIndex: 0,
  };
}

/**
 * Generate ARIA attributes for navigation
 */
export function ariaNav(label: string) {
  return {
    role: 'navigation',
    'aria-label': label,
  };
}

/**
 * Generate ARIA attributes for regions
 */
export function ariaRegion(label: string) {
  return {
    role: 'region',
    'aria-label': label,
  };
}

/**
 * Generate ARIA attributes for modals
 */
export function ariaModal(labelId: string, descId?: string) {
  return {
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': labelId,
    ...(descId && { 'aria-describedby': descId }),
  };
}

/**
 * Generate ARIA attributes for tabs
 */
export function ariaTabs(selected: boolean, controls: string) {
  return {
    role: 'tab',
    'aria-selected': selected,
    'aria-controls': controls,
    tabIndex: selected ? 0 : -1,
  };
}

/**
 * Generate ARIA attributes for tab panels
 */
export function ariaTabPanel(labeledBy: string, hidden: boolean) {
  return {
    role: 'tabpanel',
    'aria-labelledby': labeledBy,
    hidden,
    tabIndex: 0,
  };
}

// ============================================================
// KEYBOARD NAVIGATION
// ============================================================

/**
 * Handle keyboard navigation for interactive elements
 */
export function handleKeyboardClick(
  callback: () => void,
  options?: { preventDefault?: boolean }
) {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (options?.preventDefault !== false) {
        e.preventDefault();
      }
      callback();
    }
  };
}

/**
 * Handle escape key
 */
export function handleEscapeKey(callback: () => void) {
  return (e: React.KeyboardEvent | KeyboardEvent) => {
    if (e.key === 'Escape') {
      callback();
    }
  };
}

/**
 * Trap focus within a container (for modals)
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [containerRef, isActive]);
}

/**
 * Auto-focus element on mount
 */
export function useAutoFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return ref;
}

// ============================================================
// SCREEN READER ANNOUNCEMENTS
// ============================================================

/**
 * Announce message to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Hook for live region announcements
 */
export function useLiveRegion() {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  const announceMessage = (text: string, priority: 'polite' | 'assertive' = 'polite') => {
    setMessage(text);
    setPriority(priority);

    // Clear message after announcement
    setTimeout(() => setMessage(''), 1000);
  };

  const LiveRegion = () => (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );

  return { announceMessage, LiveRegion };
}

// ============================================================
// COLOR CONTRAST
// ============================================================

/**
 * Calculate relative luminance (WCAG formula)
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Parse hex colors
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);

  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);

  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  options?: { isLargeText?: boolean }
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const threshold = options?.isLargeText ? 3 : 4.5;
  return ratio >= threshold;
}

// ============================================================
// SEMANTIC HTML HELPERS
// ============================================================

/**
 * Get appropriate heading level
 */
export function getHeadingLevel(level: 1 | 2 | 3 | 4 | 5 | 6 = 2) {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  return HeadingTag;
}

/**
 * Skip link component for keyboard navigation
 */
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-yellow-500 focus:text-black"
    >
      {children}
    </a>
  );
}

// ============================================================
// FORM ACCESSIBILITY
// ============================================================

/**
 * Generate form field attributes with proper ARIA
 */
export function formField(options: {
  id: string;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
}) {
  const describedBy = [];
  if (options.error) describedBy.push(`${options.id}-error`);
  if (options.description) describedBy.push(`${options.id}-description`);

  return {
    input: {
      id: options.id,
      'aria-label': options.label,
      'aria-required': options.required || false,
      'aria-invalid': !!options.error,
      ...(describedBy.length > 0 && { 'aria-describedby': describedBy.join(' ') }),
    },
    label: {
      htmlFor: options.id,
    },
    error: {
      id: `${options.id}-error`,
      role: 'alert',
    },
    description: {
      id: `${options.id}-description`,
    },
  };
}

// ============================================================
// IMAGE ACCESSIBILITY
// ============================================================

/**
 * Generate image attributes with proper alt text
 */
export function accessibleImage(options: {
  src: string;
  alt: string;
  decorative?: boolean;
  loading?: 'lazy' | 'eager';
}) {
  return {
    src: options.src,
    alt: options.decorative ? '' : options.alt,
    ...(options.decorative && { role: 'presentation', 'aria-hidden': true }),
    loading: options.loading || 'lazy',
  };
}

// ============================================================
// EXPORTS
// ============================================================

export const a11y = {
  ariaButton,
  ariaNav,
  ariaRegion,
  ariaModal,
  ariaTabs,
  ariaTabPanel,
  handleKeyboardClick,
  handleEscapeKey,
  announce,
  formField,
  accessibleImage,
  meetsWCAGAA,
  getContrastRatio,
};

export default a11y;


