/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Light theme surfaces (AdhereTech-inspired) — keeps old class names,
        // so bg-dark-700 now renders as a white card, etc.
        dark: {
          950: '#e9eef6',
          900: '#f4f7fb',
          800: '#ffffff',
          700: '#ffffff',
          600: '#f1f5fa',
          500: '#e7edf6',
          400: '#dbe4f0',
        },
        navy: {
          900: '#132a54',
          800: '#16336b',
          700: '#1b3f85',
        },
        mint: {
          300: '#7ee8c7',
          400: '#4fd1a5',
          500: '#2fbf8f',
        },
      },
      boxShadow: {
        glow:          '0 10px 30px -8px rgba(37, 99, 235, 0.18)',
        'glow-cyan':   '0 10px 30px -8px rgba(13, 148, 136, 0.18)',
        'glow-violet': '0 10px 30px -8px rgba(109, 40, 217, 0.15)',
        card:          '0 2px 12px rgba(19, 42, 84, 0.06)',
      },
    },
  },
  plugins: [],
};
