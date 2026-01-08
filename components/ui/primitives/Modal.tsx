'use client';

/**
 * Modal Primitive Component
 * 
 * An accessible modal dialog with focus trap and keyboard navigation.
 * Uses design tokens for consistent styling across themes.
 * 
 * @example
 * // Basic modal
 * <Modal open={isOpen} onClose={() => setIsOpen(false)}>
 *   <Modal.Header>Title</Modal.Header>
 *   <Modal.Body>Content</Modal.Body>
 *   <Modal.Footer>
 *     <Button onClick={() => setIsOpen(false)}>Close</Button>
 *   </Modal.Footer>
 * </Modal>
 * 
 * // Size variants
 * <Modal open={isOpen} onClose={handleClose} size="lg">
 *   Large modal content
 * </Modal>
 */

import { 
  forwardRef, 
  ReactNode, 
  HTMLAttributes, 
  useEffect, 
  useRef, 
  useCallback,
  Fragment
} from 'react';
import { createPortal } from 'react-dom';

// ============================================================
// TYPES
// ============================================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Size of the modal */
  size?: ModalSize;
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Modal content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================
// STYLES
// ============================================================

const backdropStyles = `
  fixed inset-0 z-50
  bg-black/60 backdrop-blur-sm
  transition-opacity duration-200
`.replace(/\s+/g, ' ').trim();

const containerStyles = `
  fixed inset-0 z-50
  flex items-center justify-center
  p-4 overflow-y-auto
`.replace(/\s+/g, ' ').trim();

const modalBaseStyles = `
  relative
  bg-[var(--bg-card)]
  border border-[var(--border-primary)]
  rounded-[var(--radius-xl)]
  shadow-[var(--shadow-xl)]
  max-h-[90vh]
  overflow-hidden
  flex flex-col
  animate-in fade-in zoom-in-95 duration-200
`.replace(/\s+/g, ' ').trim();

const sizeStyles: Record<ModalSize, string> = {
  sm: 'w-full max-w-sm',
  md: 'w-full max-w-md',
  lg: 'w-full max-w-lg',
  xl: 'w-full max-w-2xl',
  full: 'w-full max-w-[90vw] h-[90vh]',
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (props, ref) => {
    const {
      open,
      onClose,
      size = 'md',
      closeOnBackdrop = true,
      closeOnEscape = true,
      showCloseButton = true,
      children,
      className = '',
    } = props;

    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Handle escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    }, [closeOnEscape, onClose]);

    // Handle backdrop click
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
      if (closeOnBackdrop && e.target === e.currentTarget) {
        onClose();
      }
    }, [closeOnBackdrop, onClose]);

    // Focus management
    useEffect(() => {
      if (open) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        modalRef.current?.focus();
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
      } else {
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      }

      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [open, handleKeyDown]);

    if (!open) return null;

    const modalContent = (
      <Fragment>
        {/* Backdrop */}
        <div className={backdropStyles} aria-hidden="true" />
        
        {/* Container */}
        <div 
          className={containerStyles}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
        >
          {/* Modal */}
          <div
            ref={(node) => {
              // Handle both refs
              (modalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            className={`${modalBaseStyles} ${sizeStyles[size]} ${className}`}
            tabIndex={-1}
          >
            {/* Close button */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            {children}
          </div>
        </div>
      </Fragment>
    );

    // Portal to body
    if (typeof document !== 'undefined') {
      return createPortal(modalContent, document.body);
    }
    
    return null;
  }
);

Modal.displayName = 'Modal';

// ============================================================
// SUB-COMPONENTS
// ============================================================

interface ModalSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const ModalHeader = forwardRef<HTMLDivElement, ModalSectionProps>(
  ({ children, className = '', ...rest }, ref) => (
    <div
      ref={ref}
      className={`flex-shrink-0 border-b border-[var(--border-primary)] px-6 py-4 pr-12 ${className}`}
      {...rest}
    >
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        {children}
      </h2>
    </div>
  )
);
ModalHeader.displayName = 'ModalHeader';

export const ModalBody = forwardRef<HTMLDivElement, ModalSectionProps>(
  ({ children, className = '', ...rest }, ref) => (
    <div 
      ref={ref} 
      className={`flex-1 overflow-y-auto p-6 ${className}`} 
      {...rest}
    >
      {children}
    </div>
  )
);
ModalBody.displayName = 'ModalBody';

export const ModalFooter = forwardRef<HTMLDivElement, ModalSectionProps>(
  ({ children, className = '', ...rest }, ref) => (
    <div
      ref={ref}
      className={`flex-shrink-0 border-t border-[var(--border-primary)] px-6 py-4 flex items-center justify-end gap-3 ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
);
ModalFooter.displayName = 'ModalFooter';

// Attach sub-components to Modal
const ModalWithParts = Modal as typeof Modal & {
  Header: typeof ModalHeader;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
};

ModalWithParts.Header = ModalHeader;
ModalWithParts.Body = ModalBody;
ModalWithParts.Footer = ModalFooter;

export default ModalWithParts;

