/**
 * Color Tokens
 * 
 * Type-safe access to CSS custom property color tokens.
 * These map directly to the CSS variables defined in globals.css.
 * 
 * Usage:
 * - Use `cssVar()` to get the CSS variable string for inline styles
 * - Use token names with Tailwind's arbitrary value syntax: `bg-[var(--brand-primary)]`
 */

// CSS Variable helper - returns the var() syntax for use in style props
export const cssVar = (name: string) => `var(--${name})`;

// Brand Colors
export const brand = {
  primary: cssVar('brand-primary'),
  secondary: cssVar('brand-secondary'),
  accent: cssVar('brand-accent'),
} as const;

// Semantic Colors
export const semantic = {
  success: cssVar('success'),
  successBg: cssVar('success-bg'),
  error: cssVar('error'),
  errorBg: cssVar('error-bg'),
  warning: cssVar('warning'),
  warningBg: cssVar('warning-bg'),
  info: cssVar('info'),
  infoBg: cssVar('info-bg'),
} as const;

// Background Colors (theme-aware)
export const background = {
  primary: cssVar('bg-primary'),
  secondary: cssVar('bg-secondary'),
  tertiary: cssVar('bg-tertiary'),
  hover: cssVar('bg-hover'),
  active: cssVar('bg-active'),
  card: cssVar('bg-card'),
  elevated: cssVar('bg-elevated'),
} as const;

// Text Colors (theme-aware)
export const text = {
  primary: cssVar('text-primary'),
  secondary: cssVar('text-secondary'),
  tertiary: cssVar('text-tertiary'),
  disabled: cssVar('text-disabled'),
} as const;

// Border Colors (theme-aware)
export const border = {
  primary: cssVar('border-primary'),
  secondary: cssVar('border-secondary'),
  accent: cssVar('border-accent'),
  glow: cssVar('border-glow'),
} as const;

// Category Colors
export const category = {
  entertainment: cssVar('category-entertainment'),
  movies: cssVar('category-movies'),
  celebrity: cssVar('category-celebrity'),
  trending: cssVar('category-trending'),
  historic: cssVar('category-historic'),
  ott: cssVar('category-ott'),
  reviews: cssVar('category-reviews'),
} as const;

// Gradient Presets
export const gradients = {
  hot: cssVar('gradient-hot'),
  entertainment: cssVar('gradient-entertainment'),
  gossip: cssVar('gradient-gossip'),
  reviews: cssVar('gradient-reviews'),
  sports: cssVar('gradient-sports'),
  politics: cssVar('gradient-politics'),
  crime: cssVar('gradient-crime'),
  world: cssVar('gradient-world'),
  tech: cssVar('gradient-tech'),
  business: cssVar('gradient-business'),
  health: cssVar('gradient-health'),
  lifestyle: cssVar('gradient-lifestyle'),
  viral: cssVar('gradient-viral'),
  premium: cssVar('gradient-premium'),
  celestial: cssVar('gradient-celestial'),
} as const;

// Combined colors export
export const colors = {
  brand,
  semantic,
  background,
  text,
  border,
  category,
  gradients,
  cssVar,
} as const;

export type ColorToken = 
  | keyof typeof brand
  | keyof typeof semantic
  | keyof typeof background
  | keyof typeof text
  | keyof typeof border
  | keyof typeof category;

