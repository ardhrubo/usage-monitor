import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  base: './',
  build: {
    outDir: '../dist/renderer',
    assetsDir: 'assets',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  },
  plugins: [],
  resolve: {
    alias: {
      '@renderer': '/src',
      '@shared': '/../../shared'
    }
  }
});
