/**
 * Breakpoint Tokens
 * 
 * Responsive breakpoints matching Tailwind CSS defaults.
 * Use with media queries or responsive utilities.
 */

// Breakpoint values in pixels
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Media query strings for use in CSS-in-JS or matchMedia
export const mediaQueries = {
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,
  // Max-width queries for mobile-first exceptions
  'max-sm': `(max-width: ${breakpoints.sm - 1}px)`,
  'max-md': `(max-width: ${breakpoints.md - 1}px)`,
  'max-lg': `(max-width: ${breakpoints.lg - 1}px)`,
} as const;

export type BreakpointToken = keyof typeof breakpoints;

