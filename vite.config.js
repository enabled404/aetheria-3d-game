import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'esnext',
    sourcemap: false
  },
  server: {
    port: 3000,
    open: false
  }
});
