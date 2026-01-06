/**
 * UI Primitives
 * 
 * Foundational, stateless building blocks for the design system.
 * These components are theme-aware and use design tokens.
 * 
 * @example
 * import { Button, Text, Badge } from '@/components/ui/primitives';
 */

// Button
export { Button, IconButton } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize, IconButtonProps } from './Button';

// Text/Typography
export { Text, Heading, Paragraph, Caption, Label } from './Text';
export type { TextProps, TextColor, TextWeight, TextAlign } from './Text';

// Badge
export { Badge, StatusDot, StatusBadge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize, BadgeGradient, StatusDotProps, StatusBadgeProps } from './Badge';

