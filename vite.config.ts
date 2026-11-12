import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://jonmorris.github.io/ADHD-Plan/
  base: '/ADHD-Plan/',
  // Shown at the bottom of the app, to tell which version a phone is running
  define: {
    __BUILD__: JSON.stringify(
      `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · ${(process.env.GITHUB_SHA ?? 'local').slice(0, 7)}`,
    ),
  },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      // Precache the bundled font too, so the app looks right offline
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,woff2}'] },
      manifest: {
        // A fresh id makes Chrome treat this as a new app, so phones holding a stale install can install again
        id: 'adhd-plan',
        name: 'ADHD Plan',
        short_name: 'ADHD Plan',
        start_url: '.',
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#2f6fde',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
