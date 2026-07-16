/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        loom: {
          wood: '#8B4513',        // primary
          'wood-light': '#A0522D',
          sand: '#D4A574',        // secondary
          gold: '#C8A45C',        // accent
          parchment: '#FDF5E6',   // background
          cream: '#FFF8F0',       // surface
          ink: '#3E2723',         // text primary
          'ink-light': '#6D4C41', // text muted
          beige: '#D7B89C',       // border
          error: '#B22222'
        }
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Lora', 'serif'],
      }
    },
  },
  plugins: [],
}
