import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://jonmorris.github.io/ADHD-Plan/
  base: '/ADHD-Plan/',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
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
