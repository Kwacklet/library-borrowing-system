// vite.config.js - settings for the Vite dev server and build.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // During local development only: forward /api/... calls to the APIs.
    // In Docker, Nginx does this job instead.
    proxy: {
      '/api/books': {
        target: 'http://localhost:3001',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/borrowings': {
        target: 'http://localhost:3002',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
