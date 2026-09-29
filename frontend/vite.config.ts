import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': '/src/app',
    },
  },
  build: {
    rollupOptions: {
      external: [
        '@radix-ui/react-separator',
        '@radix-ui/react-slider',
        '@radix-ui/react-switch',
        '@radix-ui/react-tabs',
        '@radix-ui/react-progress',
        '@radix-ui/react-scroll-area',
      ],
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  server: {
    // Backend (Backend/CRM.API.csproj) listens on http://localhost:5241 (Properties/launchSettings.json)
    proxy: {
      '/api': {
        target: 'http://localhost:5241',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://localhost:5241',
        changeOrigin: true,
        ws: true,
      },
      '/ws': {
        target: 'ws://localhost:5241',
        ws: true,
      },
    },
  },
})