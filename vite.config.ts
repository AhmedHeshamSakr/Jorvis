import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string };

const plugins = [
  react(),
  // vite-plugin-pwa@1.x types target vite 5–7; we run on vite 8 (works at runtime)
  VitePWA({
    registerType: 'prompt',
    includeAssets: [
      'favicon.svg',
      'icon.svg',
      'icon-mask.svg',
      'icon-192.png',
      'icon-512.png',
      'icon-maskable-512.png',
      'apple-touch-icon.png',
    ],
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
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
      navigateFallback: '/index.html',
    },
  }),
] as never;

export default defineConfig({
  plugins,
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    css: false,
  },
});
