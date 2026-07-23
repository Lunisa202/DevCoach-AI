/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'audio-bar': {
          '0%, 100%': { height: '20%' },
          '50%': { height: '100%' },
        },
      },
      animation: {
        'audio-bar': 'audio-bar 0.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
