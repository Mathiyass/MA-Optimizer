/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff00ff',
          light: '#ff66ff',
          dark: '#cc00cc',
        },
        secondary: {
          DEFAULT: '#00ffff',
          light: '#66ffff',
          dark: '#00cccc',
        },
        accent: {
          DEFAULT: '#ff5500',
          light: '#ff884d',
          dark: '#cc4400',
        },
        background: {
          DEFAULT: '#0f0e1d',
          light: '#1a1b2e',
          dark: '#080814',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 10px #ff00ff, 0 0 20px #ff00ff',
        'neon-cyan': '0 0 10px #00ffff, 0 0 20px #00ffff',
        'neon-orange': '0 0 10px #ff5500, 0 0 20px #ff5500',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 5px #ff00ff, 0 0 10px #ff00ff' },
          '100%': { textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff' },
        },
      },
    },
  },
  plugins: [],
}