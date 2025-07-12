/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
    "./src/renderer/index.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'electric-teal': '#1ABC9C',
        'charcoal': '#2C3E50',
        'off-white': '#ECF0F1',
        'dark-bg': '#1a1a2e',
        'dark-card': '#16213e',
        'dark-accent': '#0f3460',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'custom': '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
        'custom-dark': '0 4px 14px 0 rgba(0, 0, 0, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};