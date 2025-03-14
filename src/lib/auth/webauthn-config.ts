/**
 * WebAuthn Configuration Module
 * Contains all configuration settings for WebAuthn operations
 */

// Get domain from environment or use default
export const getRpID = (): string => {
  return process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
    : 'localhost';
};

// RP name is what the user will see during authentication
export const rpName = 'MoodMash';

// Timeout duration for WebAuthn operations (in milliseconds)
export const timeoutDuration = 60000; // 1 minute

// Supported algorithms for WebAuthn
export const supportedAlgorithmIDs = [-7, -257]; // ES256, RS256

// Get the expected origin for verification
export const getExpectedOrigin = (): string => {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}; 