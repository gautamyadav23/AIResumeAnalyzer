/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // Violet
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        slate: {
          750: '#1e293b',
          850: '#0f172a',
          950: '#020617',
        },
        theme: {
          primary: 'rgb(var(--color-primary) / <alpha-value>)',
          'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
          success: 'rgb(var(--color-success) / <alpha-value>)',
          'success-hover': 'rgb(var(--color-success-hover) / <alpha-value>)',
          warning: 'rgb(var(--color-warning) / <alpha-value>)',
          'warning-hover': 'rgb(var(--color-warning-hover) / <alpha-value>)',
          danger: 'rgb(var(--color-danger) / <alpha-value>)',
          'danger-hover': 'rgb(var(--color-danger-hover) / <alpha-value>)',
          info: 'rgb(var(--color-info) / <alpha-value>)',
          'info-hover': 'rgb(var(--color-info-hover) / <alpha-value>)',
          bg: 'rgb(var(--bg-app) / <alpha-value>)',
          card: 'rgb(var(--bg-card) / <alpha-value>)',
          'card-hover': 'rgb(var(--bg-card-hover) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          text: 'rgb(var(--text-main) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
