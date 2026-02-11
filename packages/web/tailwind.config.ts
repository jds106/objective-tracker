import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
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
    },
  },
  plugins: [],
} satisfies Config;
