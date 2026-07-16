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
          error: '#B22222',       // error
          success: '#2D5016',     // success (handloom green)
          warning: '#CD7F32',     // warning (bronze)
        }
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Lora', 'serif'],
      },
      boxShadow: {
        'vintage': '0 4px 12px rgba(0,0,0,0.1)',
        'vintage-lg': '0 8px 24px rgba(0,0,0,0.12)',
        'inset-vintage': 'inset 0 2px 4px rgba(0,0,0,0.05)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'weave': 'weave 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        weave: {
          '0%, 100%': { transform: 'translateX(-2px)' },
          '50%': { transform: 'translateX(2px)' },
        }
      }
    },
  },
  plugins: [],
}
