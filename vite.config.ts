import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Yellow Box Fleet Management',
        short_name: 'Yellow Box',
        description: 'Fleet management system for delivery riders in Dubai',
        theme_color: '#FFD700',
        background_color: '#000000',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'any',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          },
          {
            src: 'icon-192.png',
            type: 'image/png',
            sizes: '192x192',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console logs in production
        drop_debugger: true,
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core - keep small and separate
          if (id.includes('react/') && !id.includes('react-dom')) {
            return 'react-core';
          }
          if (id.includes('react-dom')) {
            return 'react-dom';
          }
          
          // Firebase modules - split more granularly
          if (id.includes('firebase/app')) {
            return 'firebase-core';
          }
          if (id.includes('firebase/auth')) {
            return 'firebase-auth';
          }
          if (id.includes('firebase/firestore')) {
            return 'firebase-firestore';
          }
          if (id.includes('firebase/storage')) {
            return 'firebase-storage';
          }
          if (id.includes('firebase/functions') || id.includes('firebase/analytics')) {
            return 'firebase-misc';
          }
          
          // Router
          if (id.includes('react-router')) {
            return 'router';
          }
          
          // Radix UI - split into logical groups
          if (id.includes('@radix-ui/react-dialog') || 
              id.includes('@radix-ui/react-alert-dialog') ||
              id.includes('@radix-ui/react-popover') ||
              id.includes('@radix-ui/react-tooltip')) {
            return 'radix-overlays';
          }
          if (id.includes('@radix-ui/react-select') || 
              id.includes('@radix-ui/react-checkbox') ||
              id.includes('@radix-ui/react-radio-group') ||
              id.includes('@radix-ui/react-switch') ||
              id.includes('@radix-ui/react-slider')) {
            return 'radix-forms';
          }
          if (id.includes('@radix-ui/react-dropdown-menu') ||
              id.includes('@radix-ui/react-context-menu') ||
              id.includes('@radix-ui/react-menubar') ||
              id.includes('@radix-ui/react-navigation-menu')) {
            return 'radix-navigation';
          }
          if (id.includes('@radix-ui')) {
            return 'radix-misc';
          }
          
          // React Query
          if (id.includes('@tanstack/react-query')) {
            return 'react-query';
          }
          
          // Form libraries
          if (id.includes('react-hook-form') || id.includes('@hookform')) {
            return 'react-forms';
          }
          if (id.includes('zod')) {
            return 'validation';
          }
          
          // Google Maps - separate chunk due to size
          if (id.includes('@react-google-maps') || id.includes('google-maps')) {
            return 'google-maps';
          }
          
          // Charts and PDF - heavy libraries
          if (id.includes('recharts')) {
            return 'charts';
          }
          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'pdf-export';
          }
          
          // Date utilities
          if (id.includes('date-fns')) {
            return 'date-utils';
          }
          
          // UI utilities
          if (id.includes('clsx') || 
              id.includes('tailwind-merge') || 
              id.includes('class-variance-authority')) {
            return 'ui-utils';
          }
          
          // Icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          
          // Other utilities
          if (id.includes('uuid') || 
              id.includes('sonner') ||
              id.includes('cmdk')) {
            return 'misc-utils';
          }
          
          // PWA and workbox
          if (id.includes('workbox') || id.includes('vite-plugin-pwa')) {
            return 'pwa';
          }
          
          // Remaining node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
}));
