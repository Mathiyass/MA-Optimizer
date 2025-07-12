import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  root: path.join(__dirname, 'src/renderer'),
  build: {
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.join(__dirname, 'src/renderer/index.html'),
      },
    },
  },
  server: {
    port: 12000,
    host: '0.0.0.0',
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
      '@renderer': path.join(__dirname, 'src/renderer'),
      '@main': path.join(__dirname, 'src/main'),
      '@common': path.join(__dirname, 'src/common'),
      '@algorithms': path.join(__dirname, 'src/algorithms'),
      '@api': path.join(__dirname, 'src/api'),
      '@database': path.join(__dirname, 'src/database'),
    },
  },
});