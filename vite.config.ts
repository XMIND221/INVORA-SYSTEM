import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 8080,
    strictPort: false,
    open: true,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'retention-imprudent-whisking.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io',
    ],
  },
  preview: {
    port: 8080,
    strictPort: false,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'retention-imprudent-whisking.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
