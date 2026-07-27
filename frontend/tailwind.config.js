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
        // Light Theme
        'bg-primary': '#FAF9F6',
        'bg-secondary': '#F5F3EF',
        'bg-card': '#FFFFFF',
        'accent-primary': '#4F6DFF',
        'accent-secondary': '#5FA8A5',
        'text-primary': '#1E293B',
        'text-muted': '#64748B',
        'success': '#22C55E',
        'warning': '#F59E0B',
        'danger': '#EF4444',
        // Dark (Chalkboard)
        'chalk-bg': '#1E3A34',
        'chalk-secondary': '#243B35',
        'chalk-card': '#2B423D',
        'chalk-text': '#F8FAFC',
        'chalk-muted': '#CBD5E1',
        'chalk-accent': '#4ADE80',
        'chalk-accent2': '#6EE7B7',
        'chalk-yellow': '#FDE68A',
        'chalk-cyan': '#67E8F9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Satoshi', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        geist: ['Geist', 'Inter', 'sans-serif'],
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-subtle': 'bounceSub 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(79,109,255,0.3)' },
          '50%': { boxShadow: '0 0 0 12px rgba(79,109,255,0)' },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        bounceSub: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'elevated': '0 4px 24px rgba(0,0,0,0.10)',
        'modal': '0 20px 60px rgba(0,0,0,0.15)',
        'glow-primary': '0 0 20px rgba(79,109,255,0.3)',
        'glow-chalk': '0 0 20px rgba(74,222,128,0.25)',
      },
      borderRadius: {
        'card': '12px',
        'modal': '16px',
      },
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [],
}
