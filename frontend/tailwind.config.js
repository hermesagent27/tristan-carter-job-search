/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{vue,ts,tsx,js,jsx}",
    "./components/**/*.{vue,ts,tsx,js,jsx}",
    "./pages/**/*.{vue,ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#22c55e',
        accent: '#f59e0b',
      }
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light']
  }
}
