/**
 * Shadow Tokens
 * 
 * Type-safe access to shadow and elevation tokens.
 * Maps to CSS custom properties in globals.css.
 */

import { cssVar } from './colors';

// Standard shadows (elevation)
export const shadows = {
  sm: cssVar('shadow-sm'),
  md: cssVar('shadow-md'),
  lg: cssVar('shadow-lg'),
  xl: cssVar('shadow-xl'),
  none: 'none',
} as const;

// Glow shadows (for emphasis/hover states)
export const glows = {
  brand: cssVar('shadow-glow'),
  pink: cssVar('shadow-glow-pink'),
  purple: cssVar('shadow-glow-purple'),
  teal: cssVar('shadow-glow-teal'),
  blue: cssVar('shadow-glow-blue'),
  red: cssVar('shadow-glow-red'),
} as const;

// Combined shadows export
export const elevation = {
  shadows,
  glows,
} as const;

export type ShadowToken = keyof typeof shadows;
export type GlowToken = keyof typeof glows;

