/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212', // Spotify-like black background
        surface: '#181818',   // Slightly lighter for cards/sidebar
        primary: '#1DB954',   // Neon green accent
        primaryHover: '#1ed760',
        textMain: '#FFFFFF',
        textSub: '#B3B3B3',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
