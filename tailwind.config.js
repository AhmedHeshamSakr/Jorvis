import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        stage: { slate: '#6b7ca8', sand: '#c4a66f', sage: '#85b89d', rose: '#9a6b71' },
      },
      fontFamily: { sans: ['var(--font-app)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [typography],
};
