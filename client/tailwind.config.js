/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-orange': '#FF6B00',
        'brand-teal': '#008E97',
      }
    },
  },
  plugins: [],
}
