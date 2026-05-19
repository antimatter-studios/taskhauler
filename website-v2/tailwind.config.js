/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', '"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#08080b',
          900: '#0c0c11',
          800: '#15151c',
          700: '#1e1e28',
          600: '#2a2a36',
          500: '#3b3b4a',
          400: '#5a5a6c',
          300: '#8a8aa0',
          200: '#b8b8c8',
          100: '#dcdcea',
        },
        cream: {
          50: '#fafaf9',
          100: '#f5f5f0',
          200: '#ebe9e1',
        },
        accent: {
          DEFAULT: '#5b5bd6',
          50: '#eef0ff',
          400: '#7e7df0',
          600: '#4a48b8',
        },
        live: {
          DEFAULT: '#84cc16',
          dim: '#65a30d',
          glow: '#a3e635',
        },
        signal: {
          amber: '#facc15',
          red: '#f87171',
        },
      },
      backgroundImage: {
        'grain': "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"2\" /></filter><rect width=\"200\" height=\"200\" filter=\"url(%23n)\" opacity=\"0.4\" /></svg>')",
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'marquee': 'marquee 40s linear infinite',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.5)' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
