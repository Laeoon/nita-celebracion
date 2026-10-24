/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,js,html}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: '#0b0a0e',
        obsidian: '#121117',
        velvet: '#18161f',
        champagne: {
          100: '#faf4e8',
          200: '#f3e5c8',
          300: '#e5cb99',
          400: '#d4a86a',
          500: '#b8894a',
          600: '#8f6531',
          700: '#6d4c22',
        },
        gala: {
          lowest: '#100c18',
          low: '#1e1926',
          container: '#221d2a',
          high: '#2d2835',
          highest: '#383240',
          accent: '#ffb0cd',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        display: ['"Syne"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace']
      },
      boxShadow: {
        'subtle': '0 10px 30px -10px rgba(0, 0, 0, 0.65)',
        'glass': '0 12px 32px 0 rgba(0, 0, 0, 0.55)',
        'champagne-glow': '0 0 25px -5px rgba(212, 168, 106, 0.25)',
        'polaroid': '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 2px 8px rgba(0, 0, 0, 0.4)'
      }
    }
  },
  plugins: [],
}
