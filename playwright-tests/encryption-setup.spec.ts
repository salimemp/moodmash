import { expect, test } from '@playwright/test';
import { cleanupTestEnvironment, navigateToEncryptionSettings, setupTestEnvironment } from './helpers/auth-helpers';
import { findElement, safeClickButton, Selector, takeScreenshot } from './helpers/test-setup';

// Default test timeout increased for more reliable tests
test.setTimeout(60000);

test.describe('Encryption Setup Flow', () => {
  // Before each test, set up the testing environment and navigate to encryption settings
  test.beforeEach(async ({ page }) => {
    // Set up test environment with a clean user state
    await setupTestEnvironment(page);
    
    // Navigate to encryption settings page
    await navigateToEncryptionSettings(page);
    
    // Verify we're on the encryption page
    const encryptionHeader = await findElement(page, Selector.Text, [
      'End-to-end encryption',
      'Encryption Settings',
      'E2E Encryption'
    ]);
    expect(encryptionHeader).not.toBeNull();
  });
  
  // After each test, clean up
  test.afterEach(async ({ page }) => {
    await cleanupTestEnvironment(page);
  });
  
  test('should complete the full encryption setup flow', async ({ page }) => {
    // Take screenshot of starting state
    await takeScreenshot(page, 'encryption-start');
    
    // Step 1: Start at the intro page
    const introText = await findElement(page, Selector.Text, [
      'End-to-end encryption ensures',
      'Your data will be encrypted'
    ]);
    expect(introText).not.toBeNull();
    
    const importantText = await findElement(page, Selector.Text, [
      'Important',
      'Warning'
    ]);
    expect(importantText).not.toBeNull();
    
    // Click the Next button to proceed
    await safeClickButton(page, ['Next', 'Continue', 'Get Started']);
    
    // Step 2: Create password
    const createPasswordText = await findElement(page, Selector.Text, [
      'Create a strong password',
      'Choose a password'
    ]);
    expect(createPasswordText).not.toBeNull();
    
    // Take screenshot of password creation
    await takeScreenshot(page, 'password-creation');
    
    // Enter a strong password
    const passwordInput = await findElement(page, Selector.Input, [
      'Encryption Password',
      'Password',
      'Create Password'
    ]);
    expect(passwordInput).not.toBeNull();
    await passwordInput?.fill('SecureTestPassword123!');
    
    // Click Next to proceed
    await safeClickButton(page, ['Next', 'Continue']);
    
    // Step 3: Confirm password
    const confirmText = await findElement(page, Selector.Text, [
      'Confirm Password',
      'Verify Password'
    ]);
    expect(confirmText).not.toBeNull();
    
    // Take screenshot of password confirmation
    await takeScreenshot(page, 'password-confirmation');
    
    // Enter the confirmation password
    const confirmPasswordInput = await findElement(page, Selector.Input, [
      'Confirm Password',
      'Verify Password',
      'Re-enter Password'
    ]);
    expect(confirmPasswordInput).not.toBeNull();
    await confirmPasswordInput?.fill('SecureTestPassword123!');
    
    // Click Enable Encryption to complete setup
    await safeClickButton(page, ['Enable Encryption', 'Turn On Encryption', 'Encrypt Data']);
    
    // Step 4: Verify completion
    const successText = await findElement(page, Selector.Text, [
      'Encryption is active',
      'Your data is now encrypted',
      'Setup complete'
    ]);
    expect(successText).not.toBeNull();
    
    // Take screenshot of completion
    await takeScreenshot(page, 'encryption-complete');
  });
  
  test('should show error when passwords do not match', async ({ page }) => {
    // Navigate through to password creation
    await safeClickButton(page, ['Next', 'Continue', 'Get Started']);
    
    // Enter a password
    const passwordInput = await findElement(page, Selector.Input, ['Encryption Password', 'Password']);
    expect(passwordInput).not.toBeNull();
    await passwordInput?.fill('SecureTestPassword123!');
    
    // Proceed to confirmation step
    await safeClickButton(page, ['Next', 'Continue']);
    
    // Enter a different password
    const confirmPasswordInput = await findElement(page, Selector.Input, ['Confirm Password', 'Verify Password']);
    expect(confirmPasswordInput).not.toBeNull();
    await confirmPasswordInput?.fill('DifferentPassword123!');
    
    // Verify error message appears
    const errorText = await findElement(page, Selector.Text, [
      'Passwords do not match',
      'Passwords must match',
      'The passwords you entered do not match'
    ]);
    expect(errorText).not.toBeNull();
    
    // Take screenshot of the error state
    await takeScreenshot(page, 'passwords-mismatch');
  });
  
  test('should validate password strength', async ({ page }) => {
    // Navigate to password creation
    await safeClickButton(page, ['Next', 'Continue', 'Get Started']);
    
    // Enter a weak password
    const passwordInput = await findElement(page, Selector.Input, ['Encryption Password', 'Password']);
    expect(passwordInput).not.toBeNull();
    await passwordInput?.fill('weak');
    
    // Check for validation message
    const validationError = await findElement(page, Selector.Text, [
      'Password must be at least 8 characters',
      'Password is too weak',
      'Use a stronger password'
    ]);
    expect(validationError).not.toBeNull();
    
    // Take screenshot of the validation error
    await takeScreenshot(page, 'weak-password');
  });
  
  test('should allow navigation back to previous steps', async ({ page }) => {
    // Navigate to password creation
    await safeClickButton(page, ['Next', 'Continue', 'Get Started']);
    
    // Verify we're on the password creation step
    const passwordInput = await findElement(page, Selector.Input, ['Encryption Password', 'Password']);
    expect(passwordInput).not.toBeNull();
    
    // Go back to intro
    await safeClickButton(page, ['Back', 'Previous', 'Go Back']);
    
    // Verify we're back at the intro
    const introText = await findElement(page, Selector.Text, [
      'End-to-end encryption ensures',
      'Your data will be encrypted'
    ]);
    expect(introText).not.toBeNull();
  });
  
  // Note: This test requires mocking API responses or using test accounts
  test('should handle encryption setup errors', async ({ page }) => {
    // Mock a failed API response
    await page.route('**/api/encryption/setup', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Failed to set up encryption' })
      });
    });
    
    // Navigate through to password confirmation
    await safeClickButton(page, ['Next', 'Continue', 'Get Started']);
    const passwordInput = await findElement(page, Selector.Input, ['Encryption Password', 'Password']);
    expect(passwordInput).not.toBeNull();
    await passwordInput?.fill('SecureTestPassword123!');
    
    await safeClickButton(page, ['Next', 'Continue']);
    const confirmPasswordInput = await findElement(page, Selector.Input, ['Confirm Password', 'Verify Password']);
    expect(confirmPasswordInput).not.toBeNull();
    await confirmPasswordInput?.fill('SecureTestPassword123!');
    
    // Attempt to enable encryption
    await safeClickButton(page, ['Enable Encryption', 'Turn On Encryption', 'Encrypt Data']);
    
    // Verify error is displayed
    const errorText = await findElement(page, Selector.Text, [
      'An error occurred',
      'Setup failed',
      'Could not enable encryption'
    ]);
    expect(errorText).not.toBeNull();
    
    // Take screenshot of the error state
    await takeScreenshot(page, 'setup-error');
  });
}); 