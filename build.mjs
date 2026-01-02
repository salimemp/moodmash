import * as esbuild from 'esbuild'

console.log('[Build] Starting esbuild...')

try {
  await esbuild.build({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    outfile: 'dist/_worker.js',
    format: 'esm',
    platform: 'browser',
    target: 'esnext',
    minify: true,
    sourcemap: false,
    external: ['__STATIC_CONTENT_MANIFEST'],
    mainFields: ['browser', 'module', 'main'],
    define: {
      'process.env.NODE_ENV': '"production"',
      'global': 'globalThis',
    },
    inject: ['./node-globals.js'],
    logLevel: 'info',
  })
  
  console.log('[Build] ✓ Success! dist/_worker.js created')
} catch (error) {
  console.error('[Build] ✗ Failed:', error)
  process.exit(1)
}
