/**
 * Border Radius Tokens
 * 
 * Type-safe access to border radius values.
 * Maps to CSS custom properties in globals.css.
 */

import { cssVar } from './colors';

export const radius = {
  sm: cssVar('radius-sm'),     // 0.25rem = 4px
  md: cssVar('radius-md'),     // 0.5rem = 8px
  lg: cssVar('radius-lg'),     // 0.75rem = 12px
  xl: cssVar('radius-xl'),     // 1rem = 16px
  '2xl': cssVar('radius-2xl'), // 1.5rem = 24px
  full: cssVar('radius-full'), // 9999px (pill)
  none: '0',
} as const;

export type RadiusToken = keyof typeof radius;

