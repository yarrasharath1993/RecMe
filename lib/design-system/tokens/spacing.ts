/**
 * Spacing Tokens
 * 
 * Type-safe access to spacing scale.
 * Based on the CSS custom properties in globals.css.
 * 
 * Usage:
 * - Use with style props: style={{ padding: spacing.md }}
 * - Use with Tailwind: className="p-[var(--space-md)]"
 */

import { cssVar } from './colors';

// Spacing scale tokens
export const spacing = {
  '2xs': cssVar('space-2xs'),  // 0.25rem = 4px
  'xs': cssVar('space-xs'),     // 0.5rem = 8px
  'sm': cssVar('space-sm'),     // 0.75rem = 12px
  'md': cssVar('space-md'),     // 1rem = 16px
  'lg': cssVar('space-lg'),     // 1.5rem = 24px
  'xl': cssVar('space-xl'),     // 2rem = 32px
  '2xl': cssVar('space-2xl'),   // 3rem = 48px
  '3xl': cssVar('space-3xl'),   // 4rem = 64px
} as const;

// Raw pixel values for when CSS vars can't be used
export const spacingPx = {
  '2xs': 4,
  'xs': 8,
  'sm': 12,
  'md': 16,
  'lg': 24,
  'xl': 32,
  '2xl': 48,
  '3xl': 64,
} as const;

// Gap utility for flex/grid
export const gap = {
  none: '0',
  '2xs': spacing['2xs'],
  'xs': spacing.xs,
  'sm': spacing.sm,
  'md': spacing.md,
  'lg': spacing.lg,
  'xl': spacing.xl,
} as const;

export type SpacingToken = keyof typeof spacing;
export type GapToken = keyof typeof gap;

