import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    // More aggressive optimization
    rollupOptions: {
      output: {
        manualChunks: undefined, // Disable code splitting for Workers
      },
    },
  },
  optimizeDeps: {
    include: ['hono', 'hono/cors', 'hono/cookie', 'bcryptjs'],
    exclude: [],
    // Force pre-bundling
    force: true,
  },
  // Increase timeout
  server: {
    hmr: {
      timeout: 60000,
    },
  },
})
