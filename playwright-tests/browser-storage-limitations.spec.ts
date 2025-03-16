import { expect, Page, test } from '@playwright/test';
import { setupTestEnvironment } from './helpers/auth-helpers';

/**
 * Test suite for browser storage limitations
 * Specifically focuses on:
 * - Storage quota exceeded scenarios
 * - Private browsing limitations
 * - IndexedDB availability issues
 * - Storage permission denied
 */
test.describe('Browser Storage Limitations', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    // Create a fresh context for each test
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Set up test environment (login, etc)
    await setupTestEnvironment(page);
    
    // Navigate to encryption setup
    await page.goto('/settings/encryption');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/storage-before-each.png' });
  });
  
  test('should handle localStorage quota exceeded errors', async () => {
    // Mock localStorage to simulate quota exceeded
    await page.addInitScript(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key.includes('encryption')) {
          throw new DOMException('QuotaExceededError', 'QuotaExceededError');
        }
        originalSetItem.call(this, key, value);
      };
    });
    
    // Start the encryption setup process
    await page.getByRole('button', { name: /set up encryption/i }).click();
    
    // Complete the password creation process
    await page.getByText(/create a strong encryption password/i).waitFor();
    await page.getByLabel(/password/i).fill('SuperSecureP@ssw0rd123');
    await page.getByRole('button', { name: /continue|next/i }).click();
    
    // This should trigger the storage error when the app tries to save the password/keys
    
    // Verify error UI is shown
    await expect(page.getByText(/storage (error|limit|quota|full)/i)).toBeVisible();
    
    // Verify guidance is provided
    await expect(page.getByText(/clear (browser data|cache|storage)|free up space/i)).toBeVisible();
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/localstorage-quota-exceeded.png' });
  });
  
  test('should handle indexedDB unavailable in private browsing', async ({ browser }) => {
    // Create a new browser context with settings that simulate incognito/private mode
    // Note: Not all browsers allow detecting incognito mode, so we simulate its effects
    const incognitoContext = await browser.newContext({
      acceptDownloads: false, // More restricted like private browsing
    });
    const incognitoPage = await incognitoContext.newPage();
    
    // Set up basic auth in simulated private browsing
    try {
      await setupTestEnvironment(incognitoPage);
    } catch (error) {
      console.log('Setup error in private browsing:', error);
      // Continue anyway - we expect some errors in private mode
    }
    
    // Navigate to encryption setup page
    await incognitoPage.goto('/settings/encryption');
    await incognitoPage.waitForLoadState('networkidle');
    
    // Mock IndexedDB to simulate private browsing limitations
    await incognitoPage.addInitScript(() => {
      // In some browsers, IndexedDB is completely disabled in private mode
      // In others, it's available but data doesn't persist
      // We'll simulate the first case for testing
      window.indexedDB = undefined as any;
    });
    
    // Try to start encryption setup
    await incognitoPage.getByRole('button', { name: /set up encryption/i }).click();
    
    // Check for private browsing warning
    await expect(incognitoPage.getByText(/private (browsing|mode)|incognito/i)).toBeVisible();
    await expect(incognitoPage.getByText(/storage (limitations|not available|restricted)/i)).toBeVisible();
    
    // Take a screenshot for debugging
    await incognitoPage.screenshot({ path: 'test-results/indexeddb-private-browsing.png' });
    
    // Clean up
    await incognitoContext.close();
  });
  
  test('should detect and handle insufficient storage space', async () => {
    // Mock the Storage API's estimate method to return low space
    await page.addInitScript(() => {
      if (navigator.storage && navigator.storage.estimate) {
        // No need to store original implementation since we're not using it
        // Just add a comment explaining our mock implementation
        console.log('Overriding storage estimate method');
        
        navigator.storage.estimate = async () => {
          // Return mock values simulating nearly full storage
          return {
            quota: 100 * 1024 * 1024, // 100MB total
            usage: 99 * 1024 * 1024,  // 99MB used (almost full)
            usageDetails: {}
          };
        };
      }
    });
    
    // Start the encryption setup process
    await page.getByRole('button', { name: /set up encryption/i }).click();
    
    // Verify the app checks available storage before proceeding
    await expect(page.getByText(/checking storage space/i)).toBeVisible({ timeout: 10000 });
    
    // Verify warning about low storage is shown
    await expect(page.getByText(/low (storage|disk) space/i)).toBeVisible();
    
    // Verify recommendation to free up space is provided
    await expect(page.getByText(/free up (space|storage)|clear (cache|data)/i)).toBeVisible();
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/low-storage-warning.png' });
  });
  
  test('should handle permission denied for storage access', async () => {
    // Mock storage permission to be denied
    await page.addInitScript(() => {
      // Override permission query results
      if (navigator.permissions && navigator.permissions.query) {
        const originalQuery = navigator.permissions.query;
        navigator.permissions.query = async (opts) => {
          if (opts.name === 'persistent-storage') {
            return { state: 'denied', addEventListener: () => {}, removeEventListener: () => {} } as any;
          }
          return originalQuery.call(navigator.permissions, opts);
        };
      }
      
      // Mock persistent storage API
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist = async () => false;
      }
    });
    
    // Start the encryption setup process
    await page.getByRole('button', { name: /set up encryption/i }).click();
    
    // Complete the password creation steps
    await page.getByText(/create a strong encryption password/i).waitFor();
    await page.getByLabel(/password/i).fill('SuperSecureP@ssw0rd123');
    await page.getByRole('button', { name: /continue|next/i }).click();
    
    // Verify warning about storage permissions
    await expect(
      page.getByText(/storage permission denied|cannot store (persistent|permanent) data/i)
    ).toBeVisible();
    
    // Verify user guidance for browser settings
    await expect(
      page.getByText(/browser settings|privacy settings|enable storage/i)
    ).toBeVisible();
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/storage-permission-denied.png' });
  });
}); 