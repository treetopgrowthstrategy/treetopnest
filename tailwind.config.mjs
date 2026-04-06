/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:    '#0f1a0c',
          mid:     '#172212',
          green:   '#2D5A27',
          bright:  '#3d7a35',
          gold:    '#8B6914',
          cream:   '#F5F0E8',
          muted:   'rgba(245,240,232,0.55)',
          faint:   'rgba(245,240,232,0.18)',
          border:  'rgba(245,240,232,0.1)',
          gborder: 'rgba(45,90,39,0.35)',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body:    ['Lato', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.2em',
      }
    },
  },
  plugins: [],
}
