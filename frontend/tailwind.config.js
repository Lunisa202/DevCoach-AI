import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    resolve(__dirname, 'index.html'),
    resolve(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      keyframes: {
        'audio-bar': {
          '0%, 100%': { height: '20%' },
          '50%': { height: '100%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'audioWave': {
          '0%': { transform: 'scaleY(0.3)', opacity: '0.7' },
          '100%': { transform: 'scaleY(1)', opacity: '1' },
        },
        'dotPulse': {
          '0%, 20%': { opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'livePulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'fadeInOut': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'audio-bar': 'audio-bar 0.6s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
