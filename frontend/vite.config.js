import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // We register the service worker ourselves in main.jsx so a detected update can
      // force an immediate reload - otherwise an already-open tab keeps running the old
      // JS bundle until the user manually hard-refreshes, which looked like recurring bugs.
      injectRegister: false,
      manifest: {
        name: 'Digitweb eBay Team Dashboard',
        short_name: 'Digitweb',
        description: 'eBay operations, team, and task management dashboard.',
        theme_color: '#2563eb',
        background_color: '#f6f8fb',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // API calls go to a different origin (ecommerce-central-backend.teckvora.com) and
        // must always hit the network - never let the service worker cache/serve them.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
