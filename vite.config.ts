import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const plugins = [
  react(),
  // vite-plugin-pwa@1.x types target vite 5–7; we run on vite 8 (works at runtime)
  VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'icon.svg', 'icon-mask.svg'],
    manifest: {
      name: 'Jorvis',
      short_name: 'Jorvis',
      description: 'Jorvis — local-first project tracker. Jarvis, but you do the thinking.',
      theme_color: '#0e1014',
      background_color: '#0e1014',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: 'icon-mask.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
      navigateFallback: '/index.html',
    },
  }),
] as never;

export default defineConfig({
  plugins,
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    css: false,
  },
});
