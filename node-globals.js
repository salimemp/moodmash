// Polyfill for Node.js globals in browser environment
export const crypto = globalThis.crypto;
export const process = { env: { NODE_ENV: 'production' } };
