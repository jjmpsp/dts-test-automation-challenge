import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './public',
  server: {
    port: 31010,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: process.env.API_BASE_URL || 'http://localhost:41010',
        changeOrigin: true,
      },
      '/runs': {
        target: process.env.API_BASE_URL || 'http://localhost:41010',
        changeOrigin: true,
      },
      '/artifacts': {
        target: process.env.API_BASE_URL || 'http://localhost:41010',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html')
      }
    }
  },
  publicDir: false
});