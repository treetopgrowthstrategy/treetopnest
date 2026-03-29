/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: '#F5F0E8',
          dark: '#1A1208',
          brown: '#3D2B1A',
          green: '#2D5A27',
          accent: '#8B6914',
          card: '#F0E8D8',
          border: '#D4C4A0',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Lato', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
