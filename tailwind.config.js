/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: 'rgb(var(--color-cream) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        clay: '#00C805',
        clayDark: '#00A004',
        moss: '#3E7A4C',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        fun: ['"Luckiest Guy"', 'cursive'],
      },
      boxShadow: {
        thick: '6px 6px 0 0 rgb(var(--color-ink))',
        thickSm: '4px 4px 0 0 rgb(var(--color-ink))',
      },
    },
  },
  plugins: [],
}
