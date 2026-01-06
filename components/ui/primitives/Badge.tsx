'use client';

/**
 * Badge Primitive Component
 * 
 * A compact label component for status, categories, and tags.
 * Uses design tokens for consistent styling across themes.
 * 
 * @example
 * // Default primary badge
 * <Badge>New</Badge>
 * 
 * // Success status badge
 * <Badge variant="success">Published</Badge>
 * 
 * // Badge with icon
 * <Badge variant="warning" icon={<AlertCircle className="w-3 h-3" />}>
 *   Draft
 * </Badge>
 * 
 * // Pill style badge
 * <Badge pill>Featured</Badge>
 * 
 * // Gradient badge for special emphasis
 * <Badge gradient="hot">Hot</Badge>
 */

import { forwardRef, ReactNode } from 'react';

// ============================================================
// TYPES
// ============================================================

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
export type BadgeSize = 'sm' | 'md';
export type BadgeGradient = 'hot' | 'entertainment' | 'sports' | 'glam' | 'reviews' | 'new';

export interface BadgeProps {
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Size preset */
  size?: BadgeSize;
  /** Use gradient background instead of solid */
  gradient?: BadgeGradient;
  /** Pill shape (fully rounded) */
  pill?: boolean;
  /** Optional leading icon */
  icon?: ReactNode;
  /** Badge content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================
// STYLES
// ============================================================

const baseStyles = `
  inline-flex items-center font-medium
`.replace(/\s+/g, ' ').trim();

const variantStyles: Record<BadgeVariant, string> = {
  primary: `
    bg-[rgba(255,107,0,0.15)] text-[var(--brand-primary)]
  `.replace(/\s+/g, ' ').trim(),
  
  secondary: `
    bg-[var(--bg-tertiary)] text-[var(--text-secondary)]
  `.replace(/\s+/g, ' ').trim(),
  
  success: `
    bg-[var(--success-bg)] text-[var(--success)]
  `.replace(/\s+/g, ' ').trim(),
  
  error: `
    bg-[var(--error-bg)] text-[var(--error)]
  `.replace(/\s+/g, ' ').trim(),
  
  warning: `
    bg-[var(--warning-bg)] text-[var(--warning)]
  `.replace(/\s+/g, ' ').trim(),
  
  info: `
    bg-[var(--info-bg)] text-[var(--info)]
  `.replace(/\s+/g, ' ').trim(),
};

const gradientStyles: Record<BadgeGradient, string> = {
  hot: `
    bg-gradient-to-r from-orange-500 to-pink-500 text-white
    shadow-sm
  `.replace(/\s+/g, ' ').trim(),
  
  entertainment: `
    bg-gradient-to-r from-purple-600 to-purple-800 text-white
    shadow-sm
  `.replace(/\s+/g, ' ').trim(),
  
  sports: `
    bg-gradient-to-r from-emerald-500 to-cyan-500 text-white
    shadow-sm
  `.replace(/\s+/g, ' ').trim(),
  
  glam: `
    bg-gradient-to-r from-purple-500 to-pink-500 text-white
    shadow-sm
  `.replace(/\s+/g, ' ').trim(),
  
  reviews: `
    bg-gradient-to-r from-amber-400 to-orange-500 text-black
    shadow-sm
  `.replace(/\s+/g, ' ').trim(),
  
  new: `
    bg-gradient-to-r from-emerald-500 to-green-600 text-white
    shadow-sm
  `.replace(/\s+/g, ' ').trim(),
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1',
  md: 'px-2 py-0.5 text-xs gap-1.5',
};

// ============================================================
// COMPONENT
// ============================================================

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      gradient,
      pill = false,
      icon,
      children,
      className = '',
    },
    ref
  ) => {
    const classes = [
      baseStyles,
      gradient ? gradientStyles[gradient] : variantStyles[variant],
      sizeStyles[size],
      pill ? 'rounded-full' : 'rounded',
      gradient ? 'font-bold uppercase tracking-wide' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <span ref={ref} className={classes}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// ============================================================
// STATUS DOT COMPONENT
// ============================================================

export type StatusDotVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface StatusDotProps {
  variant?: StatusDotVariant;
  /** Animate with pulse effect */
  pulse?: boolean;
  /** Size in pixels */
  size?: number;
  className?: string;
}

const dotVariantStyles: Record<StatusDotVariant, string> = {
  success: 'bg-[var(--success)]',
  error: 'bg-[var(--error)]',
  warning: 'bg-[var(--warning)]',
  info: 'bg-[var(--info)]',
  neutral: 'bg-[var(--text-tertiary)]',
};

export function StatusDot({
  variant = 'neutral',
  pulse = false,
  size = 8,
  className = '',
}: StatusDotProps) {
  return (
    <span
      className={`
        inline-block rounded-full
        ${dotVariantStyles[variant]}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

// ============================================================
// BADGE WITH DOT CONVENIENCE COMPONENT
// ============================================================

export interface StatusBadgeProps extends Omit<BadgeProps, 'icon'> {
  /** Status indicator variant */
  status?: StatusDotVariant;
}

export function StatusBadge({ status = 'neutral', children, ...props }: StatusBadgeProps) {
  return (
    <Badge icon={<StatusDot variant={status} size={6} />} {...props}>
      {children}
    </Badge>
  );
}

export default Badge;

