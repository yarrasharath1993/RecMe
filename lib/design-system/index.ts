/**
 * Design System
 * 
 * Central entry point for the Telugu Portal design system.
 * 
 * @example
 * import { colors, spacing, Button, Text, Badge } from '@/lib/design-system';
 */

// Re-export all tokens
export * from './tokens';

// Re-export UI primitives
export { Button, IconButton } from '@/components/ui/primitives/Button';
export type { ButtonProps, ButtonVariant, ButtonSize, IconButtonProps } from '@/components/ui/primitives/Button';

export { Text, Heading, Paragraph, Caption, Label } from '@/components/ui/primitives/Text';
export type { TextProps, TextColor, TextWeight, TextAlign } from '@/components/ui/primitives/Text';

export { Badge, StatusDot, StatusBadge } from '@/components/ui/primitives/Badge';
export type { BadgeProps, BadgeVariant, BadgeSize, BadgeGradient, StatusDotProps, StatusBadgeProps } from '@/components/ui/primitives/Badge';

