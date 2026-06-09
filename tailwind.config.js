/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3b6cf6',
          dark: '#2f54d4',
        },
        ink: '#1c2330',
        panel: '#f6f7fb',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 30px rgba(20,30,60,0.08)',
      },
    },
  },
  plugins: [],
}
