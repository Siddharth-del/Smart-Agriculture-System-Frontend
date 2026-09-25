import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    server: {
      port: 5173,
      // Optional: proxy API calls in dev to avoid CORS entirely (set VITE_API_URL empty to use it).
      proxy: env.VITE_DEV_PROXY_TARGET
        ? { '/api': env.VITE_DEV_PROXY_TARGET, '/health': env.VITE_DEV_PROXY_TARGET }
        : undefined,
    },
    build: {
      target: 'es2022',
      sourcemap: mode === 'staging' ? true : 'hidden',
      chunkSizeWarningLimit: 400,
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
  }
})
