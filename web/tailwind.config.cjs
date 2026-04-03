/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0c1117',
        card: '#111821',
        accent: '#4fd1c5',
        danger: '#f56565',
        warn: '#f6ad55',
        success: '#48bb78',
        border: '#1e2632',
        muted: '#9fb0c5',
      },
    },
  },
  plugins: [],
};
