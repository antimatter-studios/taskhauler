import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // When traffic reaches the frontend via the DDT reverse proxy, /api/v1
  // never gets here — DDT routes it straight to taskhauler-backend-v1.
  // This proxy block only matters for raw `vite` dev hits on localhost:3000.
  // Each API version maps to its own deployable; add a new block per version.
  const backendV1 = env.VITE_BACKEND_V1_URL || 'http://taskhauler-backend-v1:8080'

  return {
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: ['taskhauler-v2.localhost', 'localhost'],
      hmr: {
        clientPort: 3000,
      },
      proxy: {
        '/api/v1': {
          target: backendV1,
          changeOrigin: true,
        },
      },
    },
  }
})
