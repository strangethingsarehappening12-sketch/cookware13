/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFFFFF',
        ink: '#000000',
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
        thick: '6px 6px 0 0 #000000',
        thickSm: '4px 4px 0 0 #000000',
      },
    },
  },
  plugins: [],
}
