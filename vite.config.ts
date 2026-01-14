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
    // Chunk size warnings - set to 300KB to catch large chunks
    chunkSizeWarningLimit: 300,
    // Note: Cloudflare Pages requires inlineDynamicImports which is incompatible with manualChunks
    // Code splitting is achieved at the source level through modular route organization
    // Client-side code splitting is handled by the ScriptLoader in public/static/
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
      output: {
        // Ensure consistent output names for better caching
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Compact output for smaller bundles
        compact: true
      },
      // Tree-shake side-effect-free modules
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    }
  },
  optimizeDeps: {
    include: ['hono', 'hono/cors', 'hono/cookie', 'bcryptjs'],
    // Exclude heavy dependencies that aren't needed for SSR
    exclude: []
  },
  esbuild: {
    treeShaking: true,
    drop: ['debugger'],
    // Remove console.log in production
    pure: process.env.NODE_ENV === 'production' ? ['console.log'] : [],
    // Minification options
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  }
})
