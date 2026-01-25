'use client';

/**
 * Empty State Component
 * 
 * Graceful placeholder when content is not available.
 * Prevents broken UI and guides users.
 * 
 * Features:
 * - Multiple variants for different contexts
 * - Optional action button
 * - Icon customization
 * - Accessible messaging
 * 
 * REFACTORED to use design system primitives (Button, Text)
 */

import { ReactNode } from 'react';
import {
  Film,
  Search,
  Inbox,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Tv,
  Users,
  Heart,
  Star,
} from 'lucide-react';

// Import design system primitives
import { Button } from '@/components/ui/primitives/Button';
import { Text, Heading } from '@/components/ui/primitives/Text';

// ============================================================
// TYPES
// ============================================================

type EmptyStateVariant =
  | 'default'
  | 'search'
  | 'movies'
  | 'reviews'
  | 'collections'
  | 'celebrities'
  | 'favorites'
  | 'error'
  | 'offline';

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================
// VARIANT CONFIG
// ============================================================

const VARIANT_CONFIG: Record<
  EmptyStateVariant,
  { icon: ReactNode; title: string; description: string }
> = {
  default: {
    icon: <Inbox className="w-12 h-12" />,
    title: 'No content available',
    description: 'There is nothing to display at the moment.',
  },
  search: {
    icon: <Search className="w-12 h-12" />,
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
  },
  movies: {
    icon: <Film className="w-12 h-12" />,
    title: 'No movies found',
    description: 'We couldn\'t find any movies matching your criteria.',
  },
  reviews: {
    icon: <Star className="w-12 h-12" />,
    title: 'No reviews yet',
    description: 'Reviews for this content are not available yet.',
  },
  collections: {
    icon: <Tv className="w-12 h-12" />,
    title: 'No collections available',
    description: 'Collections will appear here once they are created.',
  },
  celebrities: {
    icon: <Users className="w-12 h-12" />,
    title: 'No celebrities found',
    description: 'We couldn\'t find any celebrities matching your search.',
  },
  favorites: {
    icon: <Heart className="w-12 h-12" />,
    title: 'No favorites yet',
    description: 'Start adding movies and content to your favorites.',
  },
  error: {
    icon: <AlertCircle className="w-12 h-12" />,
    title: 'Something went wrong',
    description: 'We encountered an error while loading this content.',
  },
  offline: {
    icon: <RefreshCw className="w-12 h-12" />,
    title: 'You\'re offline',
    description: 'Please check your internet connection and try again.',
  },
};

// ============================================================
// ACTION BUTTON COMPONENT (Now uses Button primitive)
// ============================================================

function ActionButton({ action }: { action: EmptyStateAction }) {
  const buttonVariant = action.variant === 'secondary' ? 'secondary' : 'primary';

  if (action.href) {
    return (
      <Button
        as="a"
        href={action.href}
        variant={buttonVariant}
        rightIcon={<ArrowRight className="w-4 h-4" />}
      >
        {action.label}
      </Button>
    );
  }

  return (
    <Button onClick={action.onClick} variant={buttonVariant}>
      {action.label}
    </Button>
  );
}

// ============================================================
// MAIN COMPONENT (Now uses Text primitives)
// ============================================================

export function EmptyState({
  variant = 'default',
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = '',
  size = 'md',
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayIcon = icon || config.icon;

  const sizeConfig = {
    sm: {
      container: 'py-6',
      iconSize: 'w-10 h-10',
      titleVariant: 'heading-sm' as const,
      descVariant: 'body-sm' as const,
    },
    md: {
      container: 'py-12',
      iconSize: 'w-12 h-12',
      titleVariant: 'heading-md' as const,
      descVariant: 'body-sm' as const,
    },
    lg: {
      container: 'py-16',
      iconSize: 'w-16 h-16',
      titleVariant: 'heading-lg' as const,
      descVariant: 'body-md' as const,
    },
  }[size];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${sizeConfig.container} ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="mb-4 text-[var(--text-tertiary)]">
        {displayIcon}
      </div>

      {/* Title - Using Heading primitive */}
      <Heading level="h3" className={`mb-2 ${sizeConfig.titleVariant === 'heading-sm' ? 'text-base' : sizeConfig.titleVariant === 'heading-lg' ? 'text-xl' : 'text-lg'}`}>
        {displayTitle}
      </Heading>

      {/* Description - Using Text primitive */}
      <Text
        variant={sizeConfig.descVariant}
        color="secondary"
        className="max-w-md mx-auto mb-6"
      >
        {displayDescription}
      </Text>

      {/* Actions - Using Button primitives */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action && <ActionButton action={action} />}
          {secondaryAction && (
            <ActionButton action={{ ...secondaryAction, variant: 'secondary' }} />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SPECIALIZED EMPTY STATES
// ============================================================

export function NoSearchResults({
  query,
  onClear,
}: {
  query?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      variant="search"
      title={query ? `No results for "${query}"` : 'No results found'}
      description="Try different keywords or remove some filters."
      action={
        onClear
          ? { label: 'Clear search', onClick: onClear, variant: 'secondary' }
          : undefined
      }
    />
  );
}

export function NoMoviesFound({
  showBrowse = true,
}: {
  showBrowse?: boolean;
}) {
  return (
    <EmptyState
      variant="movies"
      action={showBrowse ? { label: 'Browse all movies', href: '/movies' } : undefined}
    />
  );
}

export function ErrorState({
  onRetry,
  message,
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <EmptyState
      variant="error"
      description={message}
      action={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
    />
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      variant="offline"
      action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
    />
  );
}

export default EmptyState;
