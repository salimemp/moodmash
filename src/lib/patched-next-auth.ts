/**
 * This file contains patched exports from next-auth to work around compatibility issues.
 */

import fs from 'fs';
import path from 'path';

// Re-export from next-auth
export * from 'next-auth';
export { default } from 'next-auth';

/**
 * Patch for next-auth to fix the import issue with cookies
 * This is a temporary fix until next-auth is updated
 */
export function patchNextAuth() {
  // Skip patching in production to avoid console logs
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  try {
    // Find the next-auth env.js file that needs patching
    const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
    const envPath = path.resolve(
      nodeModulesPath,
      'next-auth',
      'lib',
      'env.js'
    );

    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf8');

      // Only patch if it has the problematic import
      if (content.includes('next/server')) {
        // eslint-disable-next-line no-console
        console.log('Patching next-auth server import...');
        
        // Replace the problematic import with the correct one
        content = content.replace(
          `import { cookies } from "next/server"`,
          `import { cookies } from "next/headers"`
        );

        // Write the patched file
        fs.writeFileSync(envPath, content, 'utf8');
        // eslint-disable-next-line no-console
        console.log('next-auth server import patched successfully!');
      }
    }
  } catch {
    // Silent fail - don't break the app if patching fails
  }
}
