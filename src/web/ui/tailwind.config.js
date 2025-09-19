module.exports = {
  content: [
    './src/**/*.{vue,html,js}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#6366f1',
        accent: '#10b981',
        dark: '#1e293b',
        light: '#f8fafc',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    }
  },
  plugins: [],
  darkMode: 'class',
}