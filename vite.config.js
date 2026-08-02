import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Warn only past a generous threshold; recharts is the one legitimately large vendor chunk.
    chunkSizeWarningLimit: 350,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-recharts': ['recharts'],
        },
      },
    },
  },
})