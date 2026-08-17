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
    proxy: {
      '/api': {
        target: 'http://localhost:5190',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:5190',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:5190',
        ws: true,
      },
    },
  },
})