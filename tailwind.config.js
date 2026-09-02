/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          bg: '#0B0E11',
          surface: '#151920',
          nested: '#1d2023',
          'nested-2': '#191c1f',
          hover: '#22262b',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          strong: 'rgba(255,255,255,0.12)',
        },
        accent: {
          salmon: '#ffb3ad',
          'salmon-dim': 'rgba(255,179,173,0.15)',
          red: '#EF4444',
          'red-dim': 'rgba(239,68,68,0.15)',
        },
        status: {
          success: '#22C55E',
          'success-dim': 'rgba(34,197,94,0.15)',
          pending: '#F59E0B',
          'pending-dim': 'rgba(245,158,11,0.15)',
          error: '#EF4444',
          'error-dim': 'rgba(239,68,68,0.15)',
          neutral: '#6B7280',
          'neutral-dim': 'rgba(107,114,128,0.15)',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '1rem',
        btn: '0.5rem',
      },
    },
  },
  plugins: [],
};
