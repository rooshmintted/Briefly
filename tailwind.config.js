/**
 * Tailwind CSS configuration for Briefly Desktop
 * Implements the design system specified in the PRD with custom colors and typography
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Light theme colors
        primary: {
          50: '#eff6ff',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
        },
        // Custom color scheme from PRD
        background: {
          light: '#ffffff',
          dark: '#0a0a0a',
        },
        text: {
          primary: {
            light: '#1a1a1a',
            dark: '#ffffff',
          },
          secondary: {
            light: '#666666',
            dark: '#a3a3a3',
          }
        },
        accent: {
          light: '#2563eb',
          dark: '#3b82f6',
        }
      },
      fontSize: {
        'headline': ['32px', { lineHeight: '1.2', fontWeight: '600' }],
        'subheadline': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-large': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'metadata': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 