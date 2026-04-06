/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:      '#050D05',
          bgalt:   '#0A1A0A',
          green:   '#00C853',
          text:    '#F0FFF0',
          sub:     '#8FAF8F',
          muted:   '#4A6A4A',
          border:  '#1A3A1A',
          card:    '#050D05',
        }
      },
      fontFamily: {
        serif:  ['"Instrument Serif"', 'serif'],
        sans:   ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
