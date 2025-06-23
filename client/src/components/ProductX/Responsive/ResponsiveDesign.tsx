import React, { useState, useEffect, createContext, useContext } from 'react';
import { productXColors } from '../../../styles/productXTheme';

// Responsive design interfaces
interface ResponsiveContextType {
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  orientation: 'portrait' | 'landscape';
  screenSize: { width: number; height: number };
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns: {
    mobile: number;
    tablet: number;
    desktop: number;
    wide?: number;
  };
  gap?: number;
  className?: string;
}

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  className?: string;
}

interface MobileNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

interface TouchGestureProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  children: React.ReactNode;
  className?: string;
}

// Breakpoint definitions
const breakpoints = {
  mobile: 320,
  tablet: 768,
  desktop: 1200,
  wide: 1536
};

// Responsive Context
const ResponsiveContext = createContext<ResponsiveContextType | null>(null);

export const ResponsiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    window.addEventListener('orientationchange', updateScreenSize);

    return () => {
      window.removeEventListener('resize', updateScreenSize);
      window.removeEventListener('orientationchange', updateScreenSize);
    };
  }, []);

  const getBreakpoint = (): 'mobile' | 'tablet' | 'desktop' | 'wide' => {
    const width = screenSize.width;
    if (width >= breakpoints.wide) return 'wide';
    if (width >= breakpoints.desktop) return 'desktop';
    if (width >= breakpoints.tablet) return 'tablet';
    return 'mobile';
  };

  const breakpoint = getBreakpoint();

  const contextValue: ResponsiveContextType = {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isWide: breakpoint === 'wide',
    orientation,
    screenSize
  };

  return (
    <ResponsiveContext.Provider value={contextValue}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useResponsive = () => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within ResponsiveProvider');
  }
  return context;
};

// Responsive Grid Component
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns,
  gap = 4,
  className = ''
}) => {
  const { breakpoint } = useResponsive();
  
  const getColumns = () => {
    switch (breakpoint) {
      case 'mobile': return columns.mobile;
      case 'tablet': return columns.tablet;
      case 'desktop': return columns.desktop;
      case 'wide': return columns.wide || columns.desktop;
      default: return columns.mobile;
    }
  };

  const gridColumns = getColumns();
  
  return (
    <div 
      className={`grid gap-${gap} ${className}`}
      style={{ 
        gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
        gap: `${gap * 0.25}rem`
      }}
    >
      {children}
    </div>
  );
};

// Responsive Container Component
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'full',
  padding = true,
  className = ''
}) => {
  const { isMobile, isTablet } = useResponsive();

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-full';
    }
  };

  const getPaddingClass = () => {
    if (!padding) return '';
    if (isMobile) return 'px-4 py-2';
    if (isTablet) return 'px-6 py-4';
    return 'px-8 py-6';
  };

  return (
    <div className={`mx-auto ${getMaxWidthClass()} ${getPaddingClass()} ${className}`}>
      {children}
    </div>
  );
};

// Mobile Navigation Component
export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onToggle,
  children
}) => {
  const { isMobile } = useResponsive();

  if (!isMobile) return null;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 lg:hidden"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${
            isOpen ? 'rotate-45 translate-y-1' : ''
          }`}></span>
          <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 mt-1 ${
            isOpen ? 'opacity-0' : ''
          }`}></span>
          <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 mt-1 ${
            isOpen ? '-rotate-45 -translate-y-1' : ''
          }`}></span>
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Mobile Menu */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 z-50 lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 pt-16 h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
};

// Touch Gesture Component
export const TouchGesture: React.FC<TouchGestureProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  children,
  className = ''
}) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [initialDistance, setInitialDistance] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    
    if (e.touches.length === 1) {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    } else if (e.touches.length === 2 && onPinch) {
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      setInitialDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && onPinch && initialDistance) {
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance;
      onPinch(scale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    if (e.changedTouches.length === 1) {
      setTouchEnd({
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      });
    }
    
    setInitialDistance(null);
  };

  useEffect(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
    if (isRightSwipe && onSwipeRight) onSwipeRight();
    if (isUpSwipe && onSwipeUp) onSwipeUp();
    if (isDownSwipe && onSwipeDown) onSwipeDown();
  }, [touchEnd, touchStart, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

// Responsive Text Component
export const ResponsiveText: React.FC<{
  children: React.ReactNode;
  size: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  className?: string;
}> = ({ children, size, className = '' }) => {
  const { breakpoint } = useResponsive();
  
  const getTextSize = () => {
    switch (breakpoint) {
      case 'mobile': return size.mobile;
      case 'tablet': return size.tablet;
      case 'desktop':
      case 'wide': return size.desktop;
      default: return size.mobile;
    }
  };

  return (
    <span className={`${getTextSize()} ${className}`}>
      {children}
    </span>
  );
};

// Responsive Image Component
export const ResponsiveImage: React.FC<{
  src: string;
  alt: string;
  sizes: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  className?: string;
}> = ({ src, alt, sizes, className = '' }) => {
  const { breakpoint } = useResponsive();
  
  const getImageSrc = () => {
    switch (breakpoint) {
      case 'mobile': return sizes.mobile;
      case 'tablet': return sizes.tablet;
      case 'desktop':
      case 'wide': return sizes.desktop;
      default: return sizes.mobile;
    }
  };

  return (
    <img 
      src={getImageSrc()} 
      alt={alt} 
      className={`w-full h-auto ${className}`}
      loading="lazy"
    />
  );
};

// Responsive Spacing Hook
export const useResponsiveSpacing = () => {
  const { breakpoint } = useResponsive();
  
  const getSpacing = (mobile: number, tablet: number, desktop: number) => {
    switch (breakpoint) {
      case 'mobile': return mobile;
      case 'tablet': return tablet;
      case 'desktop':
      case 'wide': return desktop;
      default: return mobile;
    }
  };

  return { getSpacing };
};

// Responsive Visibility Hook
export const useResponsiveVisibility = () => {
  const { isMobile, isTablet, isDesktop, isWide } = useResponsive();
  
  const showOnMobile = (show: boolean = true) => show && isMobile;
  const showOnTablet = (show: boolean = true) => show && isTablet;
  const showOnDesktop = (show: boolean = true) => show && (isDesktop || isWide);
  const hideOnMobile = () => !isMobile;
  const hideOnTablet = () => !isTablet;
  const hideOnDesktop = () => !(isDesktop || isWide);

  return {
    showOnMobile,
    showOnTablet,
    showOnDesktop,
    hideOnMobile,
    hideOnTablet,
    hideOnDesktop
  };
};

// Performance Optimization Hook
export const usePerformanceOptimization = () => {
  const { isMobile, isTablet } = useResponsive();
  const [isVisible, setIsVisible] = useState(false);

  const shouldLazyLoad = isMobile || isTablet;
  const shouldReduceAnimations = isMobile;
  const shouldOptimizeImages = isMobile;

  const observeVisibility = (element: HTMLElement) => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    if (element) observer.observe(element);
    return () => observer.disconnect();
  };

  return {
    shouldLazyLoad,
    shouldReduceAnimations,
    shouldOptimizeImages,
    isVisible,
    observeVisibility
  };
};

// Export all components and hooks
export default {
  ResponsiveProvider,
  ResponsiveGrid,
  ResponsiveContainer,
  MobileNavigation,
  TouchGesture,
  ResponsiveText,
  ResponsiveImage,
  useResponsive,
  useResponsiveSpacing,
  useResponsiveVisibility,
  usePerformanceOptimization
};
