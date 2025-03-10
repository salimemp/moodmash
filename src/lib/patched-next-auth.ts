/**
 * This file contains patched exports from next-auth to work around compatibility issues.
 */

// Re-export from next-auth
export * from 'next-auth';
export { default } from 'next-auth';

// Fix the server-side import issues
if (typeof window === 'undefined') {
  // This is server-side, so we'll have access to the NextAuth internals
  try {
    const nextAuthPath = require.resolve('next-auth');
    const fs = require('fs');
    const path = require('path');
    
    // Path to the env.js file that's causing issues
    const envPath = path.join(path.dirname(nextAuthPath), 'lib', 'env.js');
    
    // Check if the file exists and hasn't been patched yet
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf8');
      
      // Only patch if it has the problematic import
      if (content.includes('next/server')) {
        console.log('Patching next-auth server import...');
        // Replace the problematic import with the correct one
        content = content.replace(
          `import { cookies } from "next/server"`,
          `import { cookies } from "next/headers"`
        );
        
        // Write the patched file
        fs.writeFileSync(envPath, content, 'utf8');
        console.log('next-auth server import patched successfully!');
      }
    }
  } catch (error) {
    console.error('Error patching next-auth:', error);
  }
} 