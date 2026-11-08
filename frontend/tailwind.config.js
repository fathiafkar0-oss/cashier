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
        sans: ['Jost', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'ui-serif', 'Georgia', 'serif'],
        script: ['"Cormorant Garamond"', 'ui-serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '3px',
        md: '4px',
        lg: '4px',
        xl: '6px',
        '2xl': '8px',
        '3xl': '10px',
      },
      colors: {
        // Palet klasik MICRODINE
        navy: { DEFAULT: '#0A1D4B', deep: '#171721', soft: '#102760' },
        crimson: { DEFAULT: '#9E0E18', dark: '#7E0B13' },
        gold: { DEFAULT: '#CC9E4A', soft: '#DDB76E' },
        ivory: { DEFAULT: '#F7EBE0', paper: '#FDF8F2', line: '#E2D0BE' },
        obsidian: '#171721',
        // Nama lama dipetakan ke palet baru agar kelas lama tetap konsisten
        abyss: '#171721',
        dana: '#0A1D4B',
        periwinkle: '#2E4A8F',
        movie: '#E2D0BE',
        timid: '#F7EBE0',
        foam: '#FDF8F2',
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
