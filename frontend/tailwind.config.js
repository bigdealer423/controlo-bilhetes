/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // ✅ ADICIONA ESTA LINHA
  theme: {
    extend: {},
  },
  plugins: [],
}
