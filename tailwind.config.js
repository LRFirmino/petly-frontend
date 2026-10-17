/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          900: '#143c32',
          800: '#1b4e40',
          600: '#2f7661',
          100: '#dceee7',
          50: '#f4f7f5'
        },
        ink: '#24332f'
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif']
      }
    },
  },
  plugins: [],
}
