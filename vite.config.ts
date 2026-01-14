import { defineConfig } from 'vite'
import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'

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
    minify: 'esbuild', // Enable minification for production builds
    sourcemap: false,
    chunkSizeWarningLimit: 500, // Lower threshold to catch large chunks
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress certain warnings
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
      output: {
        // Code splitting configuration
        manualChunks: {
          // Vendor chunks
          'vendor-hono': ['hono', 'hono/cors', 'hono/cookie'],
        }
      }
    }
  },
  optimizeDeps: {
    include: ['hono', 'hono/cors', 'hono/cookie']
  },
  // Enable tree shaking
  esbuild: {
    treeShaking: true,
    drop: ['debugger'], // Remove debugger statements in production
  }
})
