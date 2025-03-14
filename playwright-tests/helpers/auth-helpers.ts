import { Page } from '@playwright/test';
import { findElement, safeClickButton, Selector, setupWithRetry, takeScreenshot } from './test-setup';

/**
 * Helper functions for authentication in Playwright tests
 */

/**
 * Sign in with the specified credentials
 * 
 * @param page - Playwright page object
 * @param email - User email
 * @param password - User password
 * @returns Promise that resolves when signed in
 */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await setupWithRetry(page, 'Sign In', async (p) => {
    // Navigate to the sign-in page
    await p.goto('/signin');
    
    // Take screenshot for debugging if needed
    await takeScreenshot(p, 'signin-page');
    
    // Find email input with fallbacks
    const emailInput = await findElement(p, Selector.Input, ['Email', 'email', 'username', 'Username']);
    if (!emailInput) throw new Error('Could not find email input field');
    await emailInput.fill(email);
    
    // Find password input with fallbacks
    const passwordInput = await findElement(p, Selector.Input, ['Password', 'password']);
    if (!passwordInput) throw new Error('Could not find password input field');
    await passwordInput.fill(password);
    
    // Submit the form
    const signInButton = await findElement(p, Selector.Button, ['Sign In', 'Login', 'Log in', 'signin', 'login']);
    if (!signInButton) throw new Error('Could not find sign in button');
    await signInButton.click();
    
    // Wait for navigation to complete
    try {
      await p.waitForURL('/**', { timeout: 10000 });
    } catch (error) {
      // Take screenshot if navigation failed
      await takeScreenshot(p, 'signin-failed');
      throw new Error('Sign in navigation failed');
    }
  });
}

/**
 * Navigate to the encryption settings page
 * 
 * @param page - Playwright page object
 * @returns Promise that resolves when navigation is complete
 */
export async function navigateToEncryptionSettings(page: Page): Promise<void> {
  await setupWithRetry(page, 'Navigate to Encryption Settings', async (p) => {
    // Take screenshot of starting point
    await takeScreenshot(p, 'before-navigation');
    
    // Find and click settings - try multiple approaches
    let settingsClicked = false;
    
    // Try direct settings button
    const settingsButton = await findElement(p, Selector.Button, [
      'Settings', 'settings', 'Setting', 'Preferences', 'Account'
    ]);
    
    if (settingsButton) {
      await settingsButton.click();
      settingsClicked = true;
    }
    
    // If not found, try user menu first
    if (!settingsClicked) {
      const userMenu = await findElement(p, Selector.Button, [
        'User Menu', 'Profile', 'Account', 'avatar'
      ]);
      
      if (userMenu) {
        await userMenu.click();
        await p.waitForTimeout(500); // Wait for menu to open
        
        // Now try to find settings in the dropdown
        settingsClicked = await safeClickButton(p, [
          'Settings', 'Account Settings', 'Preferences'
        ]);
      }
    }
    
    if (!settingsClicked) {
      // If still not clicked, try direct URL
      await p.goto('/settings');
      settingsClicked = true;
    }
    
    // Navigate to encryption section
    const encryptionLink = await findElement(p, Selector.Link, [
      'Encryption', 'Security', 'Privacy', 'E2E Encryption'
    ]);
    
    if (encryptionLink) {
      await encryptionLink.click();
    } else {
      // Try direct URL as fallback
      await p.goto('/settings/encryption');
    }
    
    // Verify we're on the encryption page
    const encryptionTitle = await findElement(p, Selector.Text, [
      'End-to-end encryption', 'Encryption', 'E2E Encryption'
    ]);
    
    if (!encryptionTitle) {
      await takeScreenshot(p, 'encryption-navigation-failed');
      throw new Error('Could not navigate to encryption settings');
    }
  });
}

/**
 * Create a test user with a secure environment
 * This should be used when you need a clean state for encryption tests
 * 
 * @param page - Playwright page object
 * @returns Promise that resolves when setup is complete
 */
export async function setupTestEnvironment(page: Page): Promise<void> {
  await setupWithRetry(page, 'Test Environment Setup', async (p) => {
    // Try to use API to create or reset test user if available
    try {
      // Create a test user via API
      const response = await p.request.post('/api/test/setup', {
        data: {
          createTestUser: true,
          resetEncryption: true
        },
        timeout: 5000
      });
      
      if (response.ok()) {
        console.log('Test user created/reset via API');
      }
    } catch (error) {
      console.log('API for test user setup not available, using fallback sign-in');
    }
    
    // Then sign in with that test user
    await signIn(p, 'test@example.com', 'TestPassword123!');
  });
}

/**
 * Clean up after encryption tests
 * 
 * @param page - Playwright page object
 * @returns Promise that resolves when cleanup is complete
 */
export async function cleanupTestEnvironment(page: Page): Promise<void> {
  try {
    // Try to reset encryption via API
    await page.request.post('/api/test/cleanup', {
      data: {
        resetEncryption: true
      },
      timeout: 5000
    });
    console.log('Test environment cleaned up via API');
  } catch (error) {
    console.log('API cleanup not available, skipping');
    // Take final screenshot for debugging
    await takeScreenshot(page, 'test-completion');
  }
} 