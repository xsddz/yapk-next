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
        gray: {
          850: '#1a1d29',
        },
        // Light theme colors
        surface: {
          light: '#ffffff',
          DEFAULT: '#f8fafc',
          dark: '#1f2937',
        },
        panel: {
          light: '#f1f5f9',
          DEFAULT: '#e2e8f0',
          dark: '#374151',
        }
      }
    },
  },
  plugins: [],
}
