/**
 * Animation Tokens
 * 
 * Type-safe access to animation duration and easing values.
 * Maps to CSS custom properties in globals.css.
 */

import { cssVar } from './colors';

// Duration tokens
export const duration = {
  fast: cssVar('duration-fast'),     // 150ms
  normal: cssVar('duration-normal'), // 300ms
  slow: cssVar('duration-slow'),     // 500ms
} as const;

// Easing tokens
export const easing = {
  default: cssVar('ease-default'), // cubic-bezier(0.4, 0, 0.2, 1)
  bounce: cssVar('ease-bounce'),   // cubic-bezier(0.34, 1.56, 0.64, 1)
  // Standard easing values for when CSS vars can't be used
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
} as const;

// Predefined transitions
export const transitions = {
  fast: `all ${cssVar('duration-fast')} ${cssVar('ease-default')}`,
  normal: `all ${cssVar('duration-normal')} ${cssVar('ease-default')}`,
  slow: `all ${cssVar('duration-slow')} ${cssVar('ease-default')}`,
  bounce: `all ${cssVar('duration-normal')} ${cssVar('ease-bounce')}`,
} as const;

// Combined animation export
export const animation = {
  duration,
  easing,
  transitions,
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;

