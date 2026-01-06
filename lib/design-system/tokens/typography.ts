/**
 * Typography Tokens
 * 
 * Type-safe typography system for consistent text styling.
 * Maps to font CSS variables defined in globals.css.
 * 
 * Usage:
 * - Use with Text component: <Text variant="body" />
 * - Use font family vars: style={{ fontFamily: fonts.heading }}
 */

import { cssVar } from './colors';

// Font family tokens (from next/font CSS variables)
export const fonts = {
  inter: cssVar('font-inter'),
  poppins: cssVar('font-poppins'),
  telugu: cssVar('font-telugu'),
  // Semantic aliases
  heading: cssVar('font-poppins'),
  body: cssVar('font-inter'),
  display: cssVar('font-poppins'),
} as const;

// Font size scale (in rem)
export const fontSize = {
  'xs': '0.75rem',      // 12px
  'sm': '0.875rem',     // 14px
  'base': '1rem',       // 16px
  'lg': '1.125rem',     // 18px
  'xl': '1.25rem',      // 20px
  '2xl': '1.5rem',      // 24px
  '3xl': '1.875rem',    // 30px
  '4xl': '2.25rem',     // 36px
  '5xl': '3rem',        // 48px
} as const;

// Font weight tokens
export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

// Line height tokens
export const lineHeight = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '1.75',
  // Telugu needs more line height
  telugu: '1.7',
} as const;

// Letter spacing tokens
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

// Predefined text variants (combines size, weight, line-height)
export const textVariants = {
  // Display variants (hero sections)
  'display-lg': {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.extrabold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  'display-md': {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  'display-sm': {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.snug,
  },
  
  // Heading variants
  'heading-lg': {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.snug,
  },
  'heading-md': {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
  },
  'heading-sm': {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
  },
  
  // Body variants
  'body-lg': {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.relaxed,
  },
  'body-md': {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },
  'body-sm': {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },
  
  // Label/Caption variants
  'label': {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
  },
  'caption': {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },
  
  // Overline (small caps style)
  'overline': {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },
} as const;

// Combined typography export
export const typography = {
  fonts,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  variants: textVariants,
} as const;

export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;
export type TextVariant = keyof typeof textVariants;

