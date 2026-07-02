/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D8B15C',
          hover: '#c49d47',
          glow: 'rgba(216, 177, 92, 0.15)',
          tint: 'rgba(216, 177, 92, 0.08)',
        },
        dark: {
          DEFAULT: '#0B0B0B',
          panel: 'rgba(20, 20, 28, 0.65)',
          sidebar: '#101016',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        editorial: ['Outfit', 'Poppins', 'sans-serif'],
      },
      borderRadius: {
        'lg': '24px',
        'md': '16px',
        'sm': '10px',
      }
    },
  },
  plugins: [],
}
