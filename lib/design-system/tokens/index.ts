/**
 * Design System Tokens
 * 
 * Central export for all design tokens.
 * Import from here for type-safe access to the design system.
 * 
 * @example
 * import { colors, spacing, typography } from '@/lib/design-system/tokens';
 * 
 * <div style={{ 
 *   background: colors.background.primary,
 *   padding: spacing.md,
 *   fontSize: typography.fontSize.base 
 * }}>
 *   Content
 * </div>
 */

// Core token exports
export { colors, brand, semantic, background, text, border, category, gradients, cssVar } from './colors';
export type { ColorToken } from './colors';

export { spacing, spacingPx, gap } from './spacing';
export type { SpacingToken, GapToken } from './spacing';

export { typography, fonts, fontSize, fontWeight, lineHeight, letterSpacing, textVariants } from './typography';
export type { FontSizeToken, FontWeightToken, TextVariant } from './typography';

export { elevation, shadows, glows } from './shadows';
export type { ShadowToken, GlowToken } from './shadows';

export { radius } from './radius';
export type { RadiusToken } from './radius';

export { animation, duration, easing, transitions } from './animation';
export type { DurationToken, EasingToken } from './animation';

export { breakpoints, mediaQueries } from './breakpoints';
export type { BreakpointToken } from './breakpoints';

// Convenience re-export of all tokens as a single object
import { colors as colorsObj } from './colors';
import { spacing as spacingObj } from './spacing';
import { typography as typographyObj } from './typography';
import { elevation as elevationObj } from './shadows';
import { radius as radiusObj } from './radius';
import { animation as animationObj } from './animation';
import { breakpoints as breakpointsObj } from './breakpoints';

export const tokens = {
  colors: colorsObj,
  spacing: spacingObj,
  typography: typographyObj,
  elevation: elevationObj,
  radius: radiusObj,
  animation: animationObj,
  breakpoints: breakpointsObj,
} as const;

