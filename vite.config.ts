import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Capacitor plugins target native (Android/iOS) and are unused in the
    // web preview. Excluding them keeps the dependency optimizer from
    // failing to bundle their native entry points.
    exclude: ['@capacitor/core', '@capacitor/camera', '@capacitor/barcode-scanner'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
  },
});
