import { defineConfig } from 'vite'
import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'

export default defineConfig({
  plugins: [
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx' // Main entry point (modular version)
    })
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    // Note: Cloudflare Pages requires inlineDynamicImports which is incompatible with manualChunks
    // Code splitting is achieved at the source level through modular route organization
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
      output: {
        // Ensure consistent output names
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  optimizeDeps: {
    include: ['hono', 'hono/cors', 'hono/cookie', 'bcryptjs']
  },
  esbuild: {
    treeShaking: true,
    drop: ['debugger'],
    // Remove console.log in production
    pure: process.env.NODE_ENV === 'production' ? ['console.log'] : []
  }
})
