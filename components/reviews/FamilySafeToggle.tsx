'use client';

/**
 * FamilySafeToggle Component
 * 
 * Allows users to filter content to family-safe only.
 * Part of the content governance UI system.
 */

import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldOff, Baby, Info } from 'lucide-react';

interface FamilySafeToggleProps {
  /** Current state - controlled mode */
  isEnabled?: boolean;
  /** Callback when toggle changes */
  onChange?: (enabled: boolean) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show label */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Whether to persist preference */
  persist?: boolean;
  /** Additional class names */
  className?: string;
}

const STORAGE_KEY = 'family-safe-mode';

export function FamilySafeToggle({
  isEnabled: controlledEnabled,
  onChange,
  size = 'md',
  showLabel = true,
  label = 'Family Safe',
  persist = true,
  className = '',
}: FamilySafeToggleProps) {
  // Internal state for uncontrolled mode
  const [internalEnabled, setInternalEnabled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine if controlled or uncontrolled
  const isControlled = controlledEnabled !== undefined;
  const enabled = isControlled ? controlledEnabled : internalEnabled;

  // Load persisted preference on mount
  useEffect(() => {
    if (!isControlled && persist && typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') {
        setInternalEnabled(true);
      }
    }
  }, [isControlled, persist]);

  const handleToggle = () => {
    const newValue = !enabled;
    
    if (isControlled) {
      onChange?.(newValue);
    } else {
      setInternalEnabled(newValue);
      onChange?.(newValue);
      
      // Persist if enabled
      if (persist && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(newValue));
      }
    }
  };

  const sizeConfig = {
    sm: {
      toggle: 'w-8 h-4',
      dot: 'w-3 h-3',
      dotTranslate: 'translate-x-4',
      icon: 'w-3 h-3',
      text: 'text-xs',
      gap: 'gap-1.5',
    },
    md: {
      toggle: 'w-10 h-5',
      dot: 'w-4 h-4',
      dotTranslate: 'translate-x-5',
      icon: 'w-4 h-4',
      text: 'text-sm',
      gap: 'gap-2',
    },
    lg: {
      toggle: 'w-12 h-6',
      dot: 'w-5 h-5',
      dotTranslate: 'translate-x-6',
      icon: 'w-5 h-5',
      text: 'text-base',
      gap: 'gap-2.5',
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={`relative inline-flex items-center ${config.gap} ${className}`}>
      {/* Toggle Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={handleToggle}
        className={`
          relative inline-flex flex-shrink-0 cursor-pointer rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${config.toggle}
          ${enabled 
            ? 'bg-green-500 focus:ring-green-500' 
            : 'bg-gray-300 focus:ring-gray-500'
          }
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        <span
          className={`
            pointer-events-none relative inline-block rounded-full
            bg-white shadow transform transition-transform duration-200 ease-in-out
            ${config.dot}
            ${enabled ? config.dotTranslate : 'translate-x-0.5'}
          `}
          style={{ top: '50%', transform: `translateY(-50%) ${enabled ? 'translateX(' + config.dotTranslate.replace('translate-x-', '') + ')' : 'translateX(2px)'}` }}
        >
          {enabled ? (
            <ShieldCheck className={`${config.icon} text-green-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
          ) : (
            <ShieldOff className={`${config.icon} text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
          )}
        </span>
      </button>

      {/* Label */}
      {showLabel && (
        <div className="flex items-center gap-1">
          <span className={`${config.text} font-medium text-[var(--text-primary)]`}>
            {label}
          </span>
          <button
            type="button"
            className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label="More information about family safe mode"
          >
            <Info className={config.icon} />
          </button>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute z-50 bottom-full left-0 mb-2 w-64 p-3 rounded-lg shadow-lg border bg-white text-sm"
          style={{
            borderColor: 'var(--border-primary, #e5e7eb)',
          }}
        >
          <div className="flex items-start gap-2 mb-2">
            <Baby className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="font-medium text-[var(--text-primary)]">
              Family Safe Mode
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            When enabled, only shows content rated U/G (Universal). 
            Hides movies with violence, mature themes, or adult content.
          </p>
          <div className="mt-2 pt-2 border-t border-[var(--border-primary)]">
            <p className="text-[10px] text-[var(--text-tertiary)]">
              Preference is saved for your next visit.
            </p>
          </div>
          {/* Arrow */}
          <div
            className="absolute top-full left-4 w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid white',
            }}
          />
        </div>
      )}
    </div>
  );
}

// Compact badge for indicating family-safe content
export function FamilySafeBadge({
  rating,
  size = 'sm',
  className = '',
}: {
  rating?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const isFamilySafe = rating && ['U', 'G', 'U/A'].includes(rating.toUpperCase());

  if (!isFamilySafe) return null;

  const sizeConfig = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 font-medium ${sizeConfig[size]} ${className}`}
    >
      <Shield className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      Family Safe
    </span>
  );
}

export default FamilySafeToggle;
