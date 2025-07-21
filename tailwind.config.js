// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  // ADIÇÃO: Habilita o dark mode baseado numa classe no elemento <html>
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores do Design Final
        'brand-green': '#19B884',
        'brand-blue': '#007BFF',
        
        // Cores do Light Mode
        'light-primary': '#F7F8FC',
        'light-secondary': '#FFFFFF',
        'light-tertiary': '#E9ECEF',
        'dark-text': '#212529',
        'gray-text': '#6C757D',
        'danger-text': '#DC3545',
        'success-text': '#19B884',

        // ADIÇÃO: Cores para o Dark Mode
        'dark-primary': '#121212',
        'dark-secondary': '#1E1E1E',
        'dark-tertiary': '#2C2C2C',
        'light-text': '#E0E0E0',
      },
      boxShadow: {
        'card': '0px 4px 25px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};
