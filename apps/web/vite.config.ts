import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

import { consoleForwardPlugin } from "./vite-console-forward-plugin"

/// <reference types="vite/client" />

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    consoleForwardPlugin({
      // Enable console forwarding (default: true in dev mode)
      enabled: true,

      // Custom API endpoint (default: '/api/debug/client-logs')
      endpoint: "/api/debug/client-logs",

      // Which console levels to forward (default: all)
      levels: ["log", "warn", "error", "info", "debug"],
    }),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
    //   manifest: {
    //     name: 'Sway Internal',
    //     short_name: 'Sway',
    //     description: 'Sway Internal Platform',
    //     theme_color: '#1a1a1a',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     orientation: 'portrait',
    //     scope: '/',
    //     start_url: '/',
    //     icons: [
    //       {
    //         src: '/icons/icon-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png',
    //         purpose: 'any maskable'
    //       },
    //       {
    //         src: '/icons/icon-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       }
    //     ]
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    //     cleanupOutdatedCaches: true,
    //     clientsClaim: true,
    //     sourcemap: true,
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/api\.*/i,
    //         handler: 'NetworkFirst',
    //         options: {
    //           cacheName: 'api-cache',
    //           networkTimeoutSeconds: 10,
    //           expiration: {
    //             maxEntries: 100,
    //             maxAgeSeconds: 60 * 60 * 24, // 24 hours
    //           },
    //           cacheableResponse: {
    //             statuses: [0, 200],
    //           },
    //         },
    //       },
    //     ],
    //   }
    // })
  ],

  // Resolve aliases for cleaner imports and workspace packages
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "~": path.resolve(__dirname, "./src"),
    },
  },

  // Development server configuration
  server: {
    port: 5173,
    host: true, // Allow external connections
    open: true, // Open browser automatically
  },

  // Build configuration
  build: {
    outDir: "dist",
    sourcemap: true,
    // Optimize for modern browsers in development
    target: "esnext",
  },

  // Environment variables configuration
  envPrefix: "VITE_",

  // Define global constants
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
  },

  // Optimize dependencies - include workspace packages
  optimizeDeps: {
    include: ["@trpc/client", "@trpc/react-query"],
  },
})
