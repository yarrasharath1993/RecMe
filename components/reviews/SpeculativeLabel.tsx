'use client';

/**
 * SpeculativeLabel Component
 * 
 * Visual indicator that content is speculative, not factual.
 * Part of the content governance system to clearly distinguish
 * fact from opinion/speculation.
 */

import { AlertTriangle, Info, MessageSquare, HelpCircle } from 'lucide-react';
import type { GovernanceContentType } from '@/lib/governance/types';

export interface SpeculativeLabelProps {
  /** The type of speculative content */
  type?: 'speculation' | 'rumor' | 'opinion' | 'editorial' | 'fan_theory';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show full label or just icon */
  iconOnly?: boolean;
  /** Custom label text */
  label?: string;
  /** Additional info/tooltip text */
  info?: string;
  /** Additional class names */
  className?: string;
}

const typeConfig = {
  speculation: {
    icon: AlertTriangle,
    label: 'Speculation',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'This content is speculative and not verified.',
  },
  rumor: {
    icon: MessageSquare,
    label: 'Rumor',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'This is based on unverified reports or hearsay.',
  },
  opinion: {
    icon: MessageSquare,
    label: 'Opinion',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'This represents personal opinion, not fact.',
  },
  editorial: {
    icon: Info,
    label: 'Editorial',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'This is editorial content based on analysis.',
  },
  fan_theory: {
    icon: HelpCircle,
    label: 'Fan Theory',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    description: 'This is a fan-generated theory, not official.',
  },
};

const sizeConfig = {
  sm: {
    badge: 'px-1.5 py-0.5 text-[10px] gap-1',
    icon: 'w-3 h-3',
  },
  md: {
    badge: 'px-2 py-1 text-xs gap-1.5',
    icon: 'w-4 h-4',
  },
  lg: {
    badge: 'px-3 py-1.5 text-sm gap-2',
    icon: 'w-5 h-5',
  },
};

export function SpeculativeLabel({
  type = 'speculation',
  size = 'md',
  iconOnly = false,
  label: customLabel,
  info,
  className = '',
}: SpeculativeLabelProps) {
  const config = typeConfig[type];
  const sizes = sizeConfig[size];
  const TypeIcon = config.icon;
  const displayLabel = customLabel || config.label;
  const displayInfo = info || config.description;

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${sizes.badge}
        ${config.bgColor}
        ${config.color}
        ${className}
      `}
      title={displayInfo}
      role="status"
      aria-label={`${displayLabel}: ${displayInfo}`}
    >
      <TypeIcon className={sizes.icon} />
      {!iconOnly && <span>{displayLabel}</span>}
    </span>
  );
}

// Wrapper component for speculative sections
interface SpeculativeSectionProps {
  /** The type of speculative content */
  type?: 'speculation' | 'rumor' | 'opinion' | 'editorial' | 'fan_theory';
  /** Section title */
  title?: string;
  /** Whether the section is collapsible */
  collapsible?: boolean;
  /** Whether the section starts collapsed */
  defaultCollapsed?: boolean;
  /** Children content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

export function SpeculativeSection({
  type = 'speculation',
  title,
  collapsible = false,
  defaultCollapsed = false,
  children,
  className = '',
}: SpeculativeSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const config = typeConfig[type];

  return (
    <div
      className={`rounded-lg border ${config.borderColor} overflow-hidden ${className}`}
      style={{ backgroundColor: config.bgColor.replace('bg-', '').replace('-50', '-50/30') }}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-3 py-2 ${config.bgColor}`}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        style={{ cursor: collapsible ? 'pointer' : 'default' }}
      >
        <div className="flex items-center gap-2">
          <SpeculativeLabel type={type} size="sm" />
          {title && (
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {title}
            </span>
          )}
        </div>
        
        {collapsible && (
          <button
            type="button"
            className={`p-1 rounded hover:bg-black/5 ${config.color}`}
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      {(!collapsible || !isCollapsed) && (
        <div className="px-3 py-2">
          {/* Warning notice */}
          <div className={`flex items-start gap-2 mb-2 text-xs ${config.color}`}>
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{config.description}</span>
          </div>
          
          {/* Actual content */}
          <div className="text-sm text-[var(--text-secondary)]">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';

// Helper function to check if content type is speculative
export function isSpeculativeContent(contentType: GovernanceContentType): boolean {
  return contentType === 'speculative' || contentType === 'opinion' || contentType === 'editorial';
}

// Helper function to get appropriate label for content type
export function getContentTypeLabel(contentType: GovernanceContentType): { label: string; icon: typeof AlertTriangle } {
  switch (contentType) {
    case 'speculative':
      return { label: 'Speculation', icon: AlertTriangle };
    case 'opinion':
      return { label: 'Opinion', icon: MessageSquare };
    case 'editorial':
      return { label: 'Editorial', icon: Info };
    case 'verified_fact':
      return { label: 'Verified Fact', icon: Info };
    case 'archive':
      return { label: 'Archived', icon: Info };
    case 'kids_safe':
      return { label: 'Family Safe', icon: Info };
    case 'fan_content':
      return { label: 'Fan Content', icon: Info };
    case 'promotional':
      return { label: 'Promotional', icon: Info };
    default:
      return { label: contentType, icon: Info };
  }
}

export default SpeculativeLabel;
