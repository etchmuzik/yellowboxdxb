
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
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
        manualChunks: {
          // Split code into chunks for better loading performance
          'react-vendor': ['react', 'react-dom'],
          'firebase-auth': ['firebase/app', 'firebase/auth'],
          'firebase-db': ['firebase/firestore', 'firebase/storage', 'firebase/functions'],
          'router': ['react-router-dom'],
          'radix-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-toast'],
          'utils': ['date-fns', 'clsx', 'tailwind-merge'],
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
}));
