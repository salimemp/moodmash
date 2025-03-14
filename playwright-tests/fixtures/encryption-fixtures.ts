import { test as base, Page } from '@playwright/test';
import { cleanupTestEnvironment, navigateToEncryptionSettings, signIn } from '../helpers/auth-helpers';

/**
 * Custom fixtures for encryption testing
 * These fixtures provide pre-configured environments for testing specific encryption scenarios
 */

// Define fixture types
type EncryptionFixtures = {
  encryptionReadyPage: Page;
  encryptedUserPage: Page;
};

// A test fixture with a user that has encryption available but not set up
export const test = base.extend<EncryptionFixtures>({
  encryptionReadyPage: async ({ page }, use) => {
    // Sign in with a test user
    await signIn(page, 'test@example.com', 'TestPassword123!');
    
    // Navigate to encryption settings
    await navigateToEncryptionSettings(page);
    
    // Make sure encryption is not already set up
    // You might need to add logic here to reset encryption if needed
    
    // Now the page is ready for encryption setup tests
    await use(page);
    
    // Clean up after tests
    await cleanupTestEnvironment(page);
  },
  
  // A fixture with a user that already has encryption enabled
  encryptedUserPage: async ({ page }, use) => {
    // Sign in with a test user that already has encryption set up
    await signIn(page, 'encrypted@example.com', 'SecurePassword456!');
    
    // Navigate to encryption settings
    await navigateToEncryptionSettings(page);
    
    // Provide the page for testing
    await use(page);
    
    // Clean up is not needed for this fixture since we're not changing the encryption state
  }
});

// Re-export expect for convenience
export { expect } from '@playwright/test';

