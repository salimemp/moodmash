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
    // Code splitting and tree shaking optimizations
    target: 'esnext',
    minify: 'esbuild', // Use esbuild (100x faster than terser)
    // Note: Cloudflare Workers require inlineDynamicImports
    // Manual chunks are not supported with this option
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Disable source maps for production (smaller bundle)
    sourcemap: false,
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev server
    include: ['hono', 'hono/cors', 'hono/cookie'],
    exclude: [],
  },
})
