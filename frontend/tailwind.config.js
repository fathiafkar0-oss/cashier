/** Warna semantik dibaca dari variabel CSS di src/index.css, sehingga satu kelas
 *  (mis. bg-panel) mengikuti tema terang/gelap dari elemen induknya. */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'ui-serif', 'Georgia', 'serif'],
        script: ['"Great Vibes"', 'cursive'],
      },
      colors: {
        // Halaman awal (landing)
        navy: { DEFAULT: '#0B1A2E', deep: '#071222', soft: '#132842' },
        gold: { DEFAULT: '#E9C89B', soft: '#F3DDBC' },
        // Palet sumber
        abyss: '#10161A',
        dana: '#566680',
        periwinkle: '#8E9CB7',
        movie: '#B4C0D5',
        timid: '#DAE1EE',
        foam: '#F5F7FB',
        // Token semantik
        canvas: token('canvas'),
        panel: token('panel'),
        raised: token('raised'),
        'raised-2': token('raised-2'),
        line: token('line'),
        'line-strong': token('line-strong'),
        ink: token('ink'),
        soft: token('soft'),
        faint: token('faint'),
        accent: token('accent'),
        'accent-hover': token('accent-hover'),
        'on-accent': token('on-accent'),
        'accent-text': token('accent-text'),
        success: token('success'),
        danger: token('danger'),
        warn: token('warn'),
        'on-status': token('on-status'),
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        tide: {
          from: { transform: 'translateY(var(--tide-from, 18px))' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 180ms ease-out',
        slideUp: 'slideUp 240ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        tide: 'tide 1100ms cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
