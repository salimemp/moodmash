import { expect, Page, test } from '@playwright/test';
import { setupTestEnvironment } from './helpers/auth-helpers';
import { mockNetworkRequest } from './helpers/network-mock';

/**
 * Test suite for encryption edge cases
 * Covers:
 * - Network errors during encryption setup
 * - Browser storage limitations 
 * - Different device/browser conditions
 */
test.describe('Encryption Edge Cases', () => {
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
    await page.screenshot({ path: 'test-results/edge-cases-before-each.png' });
  });
  
  test('should handle network errors during encryption key generation', async () => {
    // Start the encryption setup process
    await page.getByRole('button', { name: /set up encryption/i }).click();
    
    // Begin password creation step
    await page.getByText(/create a strong encryption password/i).waitFor();
    await page.getByLabel(/password/i).fill('StrongP@ssw0rd123');
    
    // Intercept the network request that would occur during key generation
    await mockNetworkRequest(
      page, 
      '**/api/encryption/setup',
      { status: 500, body: { error: 'Network error' } }
    );
    
    // Attempt to continue, which should trigger the key generation
    await page.getByRole('button', { name: /continue|next/i }).click();
    
    // Verify error handling UI is shown
    await expect(page.getByText(/unable to generate encryption key/i)).toBeVisible();
    await expect(page.getByText(/network error|connection problem/i)).toBeVisible();
    
    // Verify retry button is available
    await expect(page.getByRole('button', { name: /retry|try again/i })).toBeVisible();
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/network-error-handled.png' });
  });

  test('should handle browser storage limitations', async () => {
    // Mock localStorage to throw quota exceeded error
    await page.evaluate(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key.includes('encryption')) {
          throw new Error('QuotaExceededError: The quota has been exceeded.');
        }
        originalSetItem.call(this, key, value);
      };
    });
    
    // Start the encryption setup process
    await page.getByRole('button', { name: /set up encryption/i }).click();
    
    // Complete the password setup
    await page.getByText(/create a strong encryption password/i).waitFor();
    await page.getByLabel(/password/i).fill('StrongP@ssw0rd123');
    await page.getByRole('button', { name: /continue|next/i }).click();
    
    // Confirm password (if required)
    const confirmPasswordElement = await page.getByLabel(/confirm password/i);
    if (await confirmPasswordElement.isVisible()) {
      await confirmPasswordElement.fill('StrongP@ssw0rd123');
      await page.getByRole('button', { name: /continue|next/i }).click();
    }
    
    // At this point, trying to save the encryption key to localStorage should fail
    
    // Verify storage error handling UI is shown
    await expect(page.getByText(/storage error|browser storage|quota exceeded/i)).toBeVisible();
    
    // Verify alternative storage options or guidance is provided
    await expect(page.getByText(/try clearing some space|use a different browser/i)).toBeVisible();
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/storage-limitation-handled.png' });
  });

  test('should adapt UI for different device sizes', async ({ browserName, isMobile }) => {
    // Take a screenshot of initial state for reference
    await page.screenshot({ path: `test-results/encryption-${browserName}-initial.png` });
    
    // Start the encryption setup process
    await page.getByRole('button', { name: /set up encryption/i }).click();
    
    // Complete basic setup steps
    await page.getByText(/create a strong encryption password/i).waitFor();
    await page.getByLabel(/password/i).fill('StrongP@ssw0rd123');
    
    // Test responsive behavior
    if (isMobile) {
      // Verify mobile-specific UI elements
      await expect(page.locator('.mobile-only-controls')).toBeVisible();
      
      // Check if warnings are properly displayed on mobile
      const warningText = await page.getByText(/password strength/i);
      await expect(warningText).toBeVisible();
      
      // Verify spacing and layout
      const passwordInput = await page.getByLabel(/password/i);
      const boundingBox = await passwordInput.boundingBox();
      
      // On mobile, input should take most of the width
      expect(boundingBox?.width).toBeGreaterThan(
        (await page.viewportSize())!.width * 0.7
      );
    } else {
      // Verify desktop-specific UI elements
      await expect(page.locator('.desktop-controls')).toBeVisible();
      
      // Check password strength indicator position
      const strengthIndicator = await page.locator('.password-strength-meter');
      const indicatorBox = await strengthIndicator.boundingBox();
      
      // Should be on the right side on desktop
      expect(indicatorBox?.x).toBeGreaterThan(
        (await page.viewportSize())!.width * 0.5
      );
    }
    
    // Take screenshots to verify responsive behavior
    await page.screenshot({ 
      path: `test-results/encryption-${browserName}-${isMobile ? 'mobile' : 'desktop'}.png` 
    });
  });

  test('should gracefully handle slow connections', async () => {
    // Create a throttled context that simulates slow network
    await page.context().route('**/*', async (route) => {
      // Add a delay to all requests to simulate slow network
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    // Start the encryption setup
    await page.getByRole('button', { name: /set up encryption/i }).click();
    
    // Verify loading indicators appear during slow operations
    await page.getByText(/create a strong encryption password/i).waitFor();
    await page.getByLabel(/password/i).fill('StrongP@ssw0rd123');
    
    // Click continue and check for loading state
    await page.getByRole('button', { name: /continue|next/i }).click();
    
    // Verify loading indicator shows up
    await expect(page.locator('.loading-indicator, [role="progressbar"]')).toBeVisible();
    
    // Take a screenshot of loading state
    await page.screenshot({ path: 'test-results/slow-connection-loading.png' });
    
    // Wait for the operation to complete (might take longer due to throttling)
    await page.waitForSelector('.loading-indicator, [role="progressbar"]', { state: 'hidden', timeout: 10000 });
    
    // Verify the operation completed successfully despite slow connection
    await expect(page.getByText(/setup (completed|successful)/i)).toBeVisible();
  });
}); 