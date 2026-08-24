/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0a2569',
          'navy-dark': '#071b4d',
          'navy-light': '#163a91',
          blue: '#0052cc',
          'blue-hover': '#0043a8',
          soft: '#e8f0fe',
          'soft-hover': '#d2e3fc',
          'soft-dark': '#bed6fb',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      screens: {
        'print': {'raw': 'print'},
      }
    },
  },
  plugins: [],
}
