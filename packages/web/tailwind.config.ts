import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#0f172a',
          raised: '#1e293b',
          overlay: '#334155',
        },
        health: {
          'on-track': '#10b981',
          'at-risk': '#f59e0b',
          behind: '#ef4444',
          'not-started': '#64748b',
        },
      },
      keyframes: {
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in-left': 'slide-in-left 0.2s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
