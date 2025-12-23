import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Base path: '/' para Firebase, '/avalia-360/' para GitHub Pages
  base: process.env.VITE_BASE_PATH || '/avalia-360/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Otimizações de bundle
    target: 'es2020',
    minify: 'esbuild', // Usa esbuild (mais rápido que terser)
    rollupOptions: {
      output: {
        // Manual chunks para vendor splitting
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/firestore'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  // Otimizações de dependências
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
