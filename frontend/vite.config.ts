import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // When traffic reaches the frontend via the DDT reverse proxy, /api/v1
  // never gets here — DDT routes it straight to taskhauler-backend.
  // This proxy block only matters for raw `vite` dev hits on localhost:3000.
  const backend = env.VITE_BACKEND_URL || 'http://taskhauler-backend:8080'

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
      allowedHosts: ['taskhauler.localhost', 'localhost'],
      hmr: {
        // Browser reaches vite through the DDT proxy on port 80, not the
        // container-internal port 3000. WS upgrade must target the same.
        clientPort: 80,
      },
      proxy: {
        '/api/v1': {
          target: backend,
          changeOrigin: true,
        },
      },
    },
  }
})
