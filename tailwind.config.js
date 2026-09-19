/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hud: {
          bg: '#080C14',
          surface: '#0E1626',
          card: '#131D31',
          cardHover: '#1A2742',
          border: '#1E2F4D',
          borderLight: '#2D446E',
          text: '#F1F5F9',
          muted: '#94A3B8',
          dark: '#64748B',
        },
        recycle: {
          emerald: '#10B981',
          emeraldDark: '#059669',
          emeraldLight: '#34D399',
          cyan: '#06B6D4',
          cyanLight: '#22D3EE',
          amber: '#F59E0B',
          amberDark: '#D97706',
          rose: '#F43F5E',
          purple: '#8B5CF6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'scan-line': 'scanLine 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        scanLine: {
          '0%, 100%': { transform: 'translateY(0%)', opacity: '0.8' },
          '50%': { transform: 'translateY(100%)', opacity: '0.2' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
