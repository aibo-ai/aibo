/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary color palette
        primary: {
          DEFAULT: '#1A365D', // Deep blue - Conveys trust and professionalism
          light: '#2A4A7F',
          dark: '#0F2A4A'
        },
        // Secondary color palette
        secondary: {
          DEFAULT: '#2C7A7B', // Teal - Adds a modern tech feel
          light: '#38A3A5',
          dark: '#206567'
        },
        // Accent color
        accent: {
          DEFAULT: '#D69E2E', // Amber - Highlights important elements
          light: '#ECC94B',
          dark: '#B7791F'
        },
        // B2B Accent color
        b2b: {
          DEFAULT: '#553C9A', // Royal Purple - Distinguishes B2B-specific elements
          light: '#6B46C1',
          dark: '#44337A'
        },
        // B2C Accent color
        b2c: {
          DEFAULT: '#F56565', // Coral - Distinguishes B2C-specific elements
          light: '#FC8181',
          dark: '#C53030'
        },
        // Neutrals
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'mono': ['Roboto Mono', 'monospace']
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      boxShadow: {
        'subtle': '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'large': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      spacing: {
        '72': '18rem',
        '80': '20rem',
        '96': '24rem',
      },
      maxWidth: {
        'screen-sm': '640px',
        'screen-md': '768px',
        'screen-lg': '1024px',
        'screen-xl': '1280px',
        'screen-2xl': '1536px',
      },
      screens: {
        'sm': '640px',   // Mobile
        'md': '768px',   // Tablet
        'lg': '1024px',  // Desktop
        'xl': '1280px',  // Large Desktop
        '2xl': '1536px', // Extra Large Desktop
      },
    },
  },
  plugins: [],
}
