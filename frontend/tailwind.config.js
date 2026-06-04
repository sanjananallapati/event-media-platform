/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
          400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
          800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065',
        },
        secondary: {
          50: '#f8fafc',  100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
          400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
          800: '#1e293b', 900: '#0f172a', 950: '#020617',
        },
      },
      fontFamily: {
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-syne)',    'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-violet':    '0 0 25px rgba(124,58,237,0.3)',
        'glow-violet-lg': '0 0 50px rgba(124,58,237,0.45)',
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-in-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in':   'scaleIn 0.2s ease-out',
        shimmer:      'shimmer 2s linear infinite',
        float:        'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' },                                        '100%': { opacity: '1' } },
        slideUp:   { '0%': { transform: 'translateY(10px)', opacity: '0' },         '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { '0%': { transform: 'translateY(-10px)', opacity: '0' },        '100%': { transform: 'translateY(0)', opacity: '1' } },
        scaleIn:   { '0%': { transform: 'scale(0.95)', opacity: '0' },              '100%': { transform: 'scale(1)', opacity: '1' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' },                       '100%': { backgroundPosition: '200% 0' } },
        float:     { '0%, 100%': { transform: 'translateY(0px)' },                  '50%': { transform: 'translateY(-12px)' } },
        pulseGlow: { '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },         '50%': { opacity: '0.7', transform: 'scale(1.05)' } },
      },
      borderColor: {
        DEFAULT: '#27272A',
      },
    },
  },
  plugins: [],
};