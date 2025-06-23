import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { productXColors } from '../../../styles/productXTheme';

// Accessibility context interfaces
interface AccessibilityContextType {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  setFontSize: (size: 'small' | 'medium' | 'large' | 'extra-large') => void;
  toggleScreenReaderMode: () => void;
  announceToScreenReader: (message: string) => void;
}

interface KeyboardNavigationProps {
  children: React.ReactNode;
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  trapFocus?: boolean;
}

interface ScreenReaderProps {
  children: React.ReactNode;
  label?: string;
  description?: string;
  role?: string;
  live?: 'polite' | 'assertive' | 'off';
}

interface SkipLinksProps {
  links: Array<{
    href: string;
    label: string;
  }>;
}

interface FocusManagementProps {
  children: React.ReactNode;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  trapFocus?: boolean;
}

// Accessibility Context
const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large' | 'extra-large'>('medium');
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for user preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    setReducedMotion(prefersReducedMotion);
    setHighContrast(prefersHighContrast);

    // Detect keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true);
      }
    };

    const handleMouseDown = () => {
      setKeyboardNavigation(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    // Apply accessibility classes to document
    document.documentElement.classList.toggle('high-contrast', highContrast);
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
    document.documentElement.classList.toggle('screen-reader-mode', screenReaderMode);
    document.documentElement.classList.toggle('keyboard-navigation', keyboardNavigation);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [highContrast, reducedMotion, screenReaderMode, keyboardNavigation, fontSize]);

  const toggleHighContrast = () => setHighContrast(prev => !prev);
  const toggleReducedMotion = () => setReducedMotion(prev => !prev);
  const setFontSize = (size: 'small' | 'medium' | 'large' | 'extra-large') => setFontSizeState(size);
  const toggleScreenReaderMode = () => setScreenReaderMode(prev => !prev);

  const announceToScreenReader = (message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  return (
    <AccessibilityContext.Provider value={{
      highContrast,
      reducedMotion,
      fontSize,
      screenReaderMode,
      keyboardNavigation,
      toggleHighContrast,
      toggleReducedMotion,
      setFontSize,
      toggleScreenReaderMode,
      announceToScreenReader
    }}>
      {children}
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// Skip Links Component
export const SkipLinks: React.FC<SkipLinksProps> = ({ links }) => {
  return (
    <div className="skip-links">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

// Keyboard Navigation Component
export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  onEscape,
  onEnter,
  onArrowKeys,
  trapFocus = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { keyboardNavigation } = useAccessibility();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!keyboardNavigation) return;

      switch (e.key) {
        case 'Escape':
          if (onEscape) {
            e.preventDefault();
            onEscape();
          }
          break;
        case 'Enter':
          if (onEnter) {
            e.preventDefault();
            onEnter();
          }
          break;
        case 'ArrowUp':
          if (onArrowKeys) {
            e.preventDefault();
            onArrowKeys('up');
          }
          break;
        case 'ArrowDown':
          if (onArrowKeys) {
            e.preventDefault();
            onArrowKeys('down');
          }
          break;
        case 'ArrowLeft':
          if (onArrowKeys) {
            e.preventDefault();
            onArrowKeys('left');
          }
          break;
        case 'ArrowRight':
          if (onArrowKeys) {
            e.preventDefault();
            onArrowKeys('right');
          }
          break;
        case 'Tab':
          if (trapFocus && containerRef.current) {
            const focusableElements = containerRef.current.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardNavigation, onEscape, onEnter, onArrowKeys, trapFocus]);

  return (
    <div ref={containerRef} className="keyboard-navigation-container">
      {children}
    </div>
  );
};

// Screen Reader Component
export const ScreenReader: React.FC<ScreenReaderProps> = ({
  children,
  label,
  description,
  role,
  live = 'polite'
}) => {
  return (
    <div
      aria-label={label}
      aria-describedby={description ? `desc-${Math.random()}` : undefined}
      role={role}
      aria-live={live}
    >
      {children}
      {description && (
        <div id={`desc-${Math.random()}`} className="sr-only">
          {description}
        </div>
      )}
    </div>
  );
};

// Focus Management Component
export const FocusManagement: React.FC<FocusManagementProps> = ({
  children,
  autoFocus = false,
  restoreFocus = false,
  trapFocus = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (autoFocus && containerRef.current) {
      const firstFocusable = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    return () => {
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [autoFocus, restoreFocus]);

  return (
    <KeyboardNavigation trapFocus={trapFocus}>
      <div ref={containerRef}>
        {children}
      </div>
    </KeyboardNavigation>
  );
};

// Accessibility Settings Panel
export const AccessibilitySettings: React.FC = () => {
  const {
    highContrast,
    reducedMotion,
    fontSize,
    screenReaderMode,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    toggleScreenReaderMode
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="accessibility-settings">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Accessibility Settings"
        aria-expanded={isOpen}
      >
        ♿
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Accessibility Settings</h3>
            
            <div className="space-y-4">
              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <label htmlFor="high-contrast" className="text-sm font-medium text-gray-700">
                  High Contrast
                </label>
                <button
                  id="high-contrast"
                  onClick={toggleHighContrast}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    highContrast ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={highContrast}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      highContrast ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <label htmlFor="reduced-motion" className="text-sm font-medium text-gray-700">
                  Reduced Motion
                </label>
                <button
                  id="reduced-motion"
                  onClick={toggleReducedMotion}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={reducedMotion}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      reducedMotion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Font Size */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Font Size
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`px-3 py-2 text-xs rounded-md border ${
                        fontSize === size
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {size === 'extra-large' ? 'XL' : size.charAt(0).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Screen Reader Mode */}
              <div className="flex items-center justify-between">
                <label htmlFor="screen-reader" className="text-sm font-medium text-gray-700">
                  Screen Reader Mode
                </label>
                <button
                  id="screen-reader"
                  onClick={toggleScreenReaderMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    screenReaderMode ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={screenReaderMode}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      screenReaderMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Accessible Button Component
export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
}> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  ariaLabel,
  ariaDescribedBy,
  className = ''
}) => {
  const { keyboardNavigation } = useAccessibility();

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
      case 'secondary':
        return 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-1.5 text-sm';
      case 'medium':
        return 'px-4 py-2 text-base';
      case 'large':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        rounded-md font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${keyboardNavigation ? 'focus:ring-2' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// Accessible Form Field Component
export const AccessibleFormField: React.FC<{
  label: string;
  children: React.ReactNode;
  error?: string;
  help?: string;
  required?: boolean;
  id: string;
}> = ({ label, children, error, help, required = false, id }) => {
  const errorId = error ? `${id}-error` : undefined;
  const helpId = help ? `${id}-help` : undefined;

  return (
    <div className="form-field">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-describedby': [helpId, errorId].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required
        } as any)}
      </div>
      
      {help && (
        <p id={helpId} className="mt-1 text-sm text-gray-600">
          {help}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Export all components
export default {
  AccessibilityProvider,
  SkipLinks,
  KeyboardNavigation,
  ScreenReader,
  FocusManagement,
  AccessibilitySettings,
  AccessibleButton,
  AccessibleFormField,
  useAccessibility
};
