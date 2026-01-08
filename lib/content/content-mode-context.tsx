'use client';

/**
 * Content Mode Context
 * 
 * Provides global content filtering based on user preference.
 * Default mode is 'family_safe' which hides adult content.
 */

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  ReactNode 
} from 'react';

// ============================================================
// TYPES
// ============================================================

export type ContentMode = 'family_safe' | 'standard' | 'adult';

export interface ContentModeContextValue {
  /** Current content mode */
  mode: ContentMode;
  /** Set the content mode */
  setMode: (mode: ContentMode) => void;
  /** Check if current mode allows adult content */
  allowsAdultContent: boolean;
  /** Check if current mode is family safe */
  isFamilySafe: boolean;
  /** Age verification status */
  isAgeVerified: boolean;
  /** Verify age (for adult mode) */
  verifyAge: (isOver18: boolean) => void;
  /** Reset to family safe mode */
  resetToSafe: () => void;
}

// ============================================================
// STORAGE KEY
// ============================================================

const STORAGE_KEY = 'teluguvibes_content_mode';
const AGE_VERIFIED_KEY = 'teluguvibes_age_verified';

// ============================================================
// CONTEXT
// ============================================================

const ContentModeContext = createContext<ContentModeContextValue | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================

export interface ContentModeProviderProps {
  children: ReactNode;
  /** Default mode if not stored */
  defaultMode?: ContentMode;
}

export function ContentModeProvider({ 
  children, 
  defaultMode = 'family_safe' 
}: ContentModeProviderProps) {
  const [mode, setModeState] = useState<ContentMode>(defaultMode);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as ContentMode | null;
      const ageVerified = localStorage.getItem(AGE_VERIFIED_KEY) === 'true';
      
      if (stored && ['family_safe', 'standard', 'adult'].includes(stored)) {
        // Only allow adult mode if age was verified
        if (stored === 'adult' && !ageVerified) {
          setModeState('standard');
        } else {
          setModeState(stored);
        }
      }
      
      setIsAgeVerified(ageVerified);
      setIsHydrated(true);
    }
  }, []);

  // Persist to storage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [mode, isHydrated]);

  const setMode = useCallback((newMode: ContentMode) => {
    // Require age verification for adult mode
    if (newMode === 'adult' && !isAgeVerified) {
      console.warn('Age verification required for adult mode');
      return;
    }
    setModeState(newMode);
  }, [isAgeVerified]);

  const verifyAge = useCallback((isOver18: boolean) => {
    setIsAgeVerified(isOver18);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AGE_VERIFIED_KEY, String(isOver18));
    }
  }, []);

  const resetToSafe = useCallback(() => {
    setModeState('family_safe');
    setIsAgeVerified(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'family_safe');
      localStorage.removeItem(AGE_VERIFIED_KEY);
    }
  }, []);

  const value: ContentModeContextValue = {
    mode,
    setMode,
    allowsAdultContent: mode === 'adult' && isAgeVerified,
    isFamilySafe: mode === 'family_safe',
    isAgeVerified,
    verifyAge,
    resetToSafe,
  };

  return (
    <ContentModeContext.Provider value={value}>
      {children}
    </ContentModeContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useContentMode(): ContentModeContextValue {
  const context = useContext(ContentModeContext);
  
  if (context === undefined) {
    // Return safe defaults if provider is missing
    return {
      mode: 'family_safe',
      setMode: () => {},
      allowsAdultContent: false,
      isFamilySafe: true,
      isAgeVerified: false,
      verifyAge: () => {},
      resetToSafe: () => {},
    };
  }
  
  return context;
}

// ============================================================
// EXPORTS
// ============================================================

export { ContentModeContext };

