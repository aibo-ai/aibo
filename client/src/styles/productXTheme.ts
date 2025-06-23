// Product X - Sleep Company Design System Theme Configuration
// Based on the comprehensive UI/UX design specifications

export const productXColors = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#2563EB', // Primary Brand Color
    600: '#1d4ed8',
    700: '#1e40af',
    800: '#1e3a8a',
    900: '#1e3a8a',
  },
  
  // Secondary Success Green
  secondary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10B981', // Success Green
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  
  // Accent Warning Amber
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#F59E0B', // Warning Amber
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Alert Critical Red
  alert: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#EF4444', // Critical Red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Neutral Grays
  neutral: {
    50: '#F8FAFC', // Background
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Surface and Text
  surface: '#FFFFFF', // Pure White
  textPrimary: '#1F2937', // Dark Gray
  textSecondary: '#6B7280', // Medium Gray
  
  // Sleep Company Brand Colors
  sleepBrand: {
    primary: '#2563EB',
    secondary: '#10B981',
    accent: '#F59E0B',
    neutral: '#64748b',
  }
};

export const productXTypography = {
  fontFamily: {
    primary: ['Inter', 'system-ui', 'sans-serif'],
    heading: ['Inter', 'system-ui', 'sans-serif'],
    body: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
  },
  
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
  
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  }
};

export const productXSpacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
};

export const productXBorderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

export const productXShadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
};

export const productXBreakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Component-specific theme configurations
export const productXComponents = {
  card: {
    background: productXColors.surface,
    border: productXColors.neutral[200],
    shadow: productXShadows.base,
    borderRadius: productXBorderRadius.lg,
    padding: productXSpacing[6],
  },
  
  button: {
    primary: {
      background: productXColors.primary[500],
      color: productXColors.surface,
      hover: productXColors.primary[600],
      focus: productXColors.primary[700],
    },
    secondary: {
      background: productXColors.secondary[500],
      color: productXColors.surface,
      hover: productXColors.secondary[600],
      focus: productXColors.secondary[700],
    },
    accent: {
      background: productXColors.accent[500],
      color: productXColors.surface,
      hover: productXColors.accent[600],
      focus: productXColors.accent[700],
    },
  },
  
  dashboard: {
    background: productXColors.neutral[50],
    cardBackground: productXColors.surface,
    headerBackground: productXColors.surface,
    sidebarBackground: productXColors.surface,
    borderColor: productXColors.neutral[200],
  },
  
  chart: {
    primary: productXColors.primary[500],
    secondary: productXColors.secondary[500],
    accent: productXColors.accent[500],
    alert: productXColors.alert[500],
    neutral: productXColors.neutral[400],
    grid: productXColors.neutral[200],
    text: productXColors.textSecondary,
  }
};

// Agent-specific color schemes
export const agentColorSchemes = {
  marketResearch: {
    primary: productXColors.primary[500],
    secondary: productXColors.primary[100],
    accent: productXColors.primary[600],
  },
  competitiveIntelligence: {
    primary: productXColors.alert[500],
    secondary: productXColors.alert[100],
    accent: productXColors.alert[600],
  },
  trendAnalysis: {
    primary: productXColors.secondary[500],
    secondary: productXColors.secondary[100],
    accent: productXColors.secondary[600],
  },
  userProfiles: {
    primary: productXColors.accent[500],
    secondary: productXColors.accent[100],
    accent: productXColors.accent[600],
  },
  audienceExpansion: {
    primary: '#8B5CF6', // Purple
    secondary: '#F3E8FF',
    accent: '#7C3AED',
  },
  mediaIntelligence: {
    primary: '#06B6D4', // Cyan
    secondary: '#CFFAFE',
    accent: '#0891B2',
  },
  strategicRecommendations: {
    primary: '#84CC16', // Lime
    secondary: '#F7FEE7',
    accent: '#65A30D',
  }
};

export default {
  colors: productXColors,
  typography: productXTypography,
  spacing: productXSpacing,
  borderRadius: productXBorderRadius,
  shadows: productXShadows,
  breakpoints: productXBreakpoints,
  components: productXComponents,
  agentColorSchemes,
};
