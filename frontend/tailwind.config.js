/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#05080f',
          900: '#0a0e1a',
          800: '#0d1221',
          700: '#111827',
          600: '#1a2236',
          500: '#1e2d45',
          400: '#243352',
        },
      },
      boxShadow: {
        glow:    '0 0 20px rgba(59,130,246,0.15)',
        'glow-cyan':   '0 0 20px rgba(6,182,212,0.15)',
        'glow-violet': '0 0 20px rgba(139,92,246,0.15)',
      },
    },
  },
  plugins: [],
};
