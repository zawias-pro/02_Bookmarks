import { defineConfig, type Plugin } from 'vite'
import { execFileSync } from 'node:child_process'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const appVersion = process.env.VITE_APP_VERSION ?? execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()
const versionPlugin = (): Plugin => ({
  name: 'app-version',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: appVersion }) })
  },
})

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  server: {
    port: 5177,
  },
  plugins: [
    react(),
    versionPlugin(),
    VitePWA({
      injectRegister: false,
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/files/bookmarks_coll_01/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'bookmark-icons',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7,
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: '02_Bookmarks',
        short_name: '02_Bookmarks',
        description: 'Offline-first Bookmarks Manager with PocketBase synchronization',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
