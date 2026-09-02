/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          page: '#0a0a0a',
          card: '#141414',
        },
        sentiment: {
          positive: '#22c55e',
          negative: '#ef4444',
          neutral: '#737373',
        },
      },
    },
  },
  plugins: [],
}
