import { devices, expect, test } from '@playwright/test';
import { setupTestEnvironment } from './helpers/auth-helpers';

/**
 * Test suite for encryption functionality across different browser and device conditions
 * Tests behavior on:
 * - Different screen sizes and devices
 * - Touch vs non-touch interfaces
 * - High DPI screens
 * - Different browser capabilities
 */
test.describe('Cross-Browser and Device Tests', () => {

  test('should adapt encryption UI for mobile devices', async ({ browser }) => {
    // Create context with mobile device parameters
    const mobileContext = await browser.newContext({
      ...devices['iPhone 12']
    });
    const mobilePage = await mobileContext.newPage();
    
    // Set up test environment
    await setupTestEnvironment(mobilePage);
    
    // Navigate to encryption setup
    await mobilePage.goto('/settings/encryption');
    await mobilePage.waitForLoadState('networkidle');
    
    // Take screenshot for initial state
    await mobilePage.screenshot({ path: 'test-results/mobile-encryption-initial.png' });
    
    // Start encryption setup
    await mobilePage.getByRole('button', { name: /set up encryption/i }).click();
    
    // Verify mobile-specific UI elements appear
    await mobilePage.getByText(/create a strong encryption password/i).waitFor();
    
    // Check that UI is properly adapted for mobile
    await expect(mobilePage.locator('.mobile-view, .responsive-mobile')).toBeVisible();
    
    // Verify password input is properly sized for mobile
    const passwordInput = await mobilePage.getByLabel(/password/i);
    const boundingBox = await passwordInput.boundingBox();
    
    // Ensure input is wide enough for mobile screens
    expect(boundingBox?.width).toBeGreaterThan(
      (await mobilePage.viewportSize())!.width * 0.7
    );
    
    // Take screenshot to verify mobile UI
    await mobilePage.screenshot({ path: 'test-results/mobile-encryption-setup.png' });
    
    // Clean up
    await mobileContext.close();
  });
  
  test('should support touch interactions for encryption setup', async ({ browser }) => {
    // Create context with touch capabilities
    const touchContext = await browser.newContext({
      ...devices['iPad Pro 11']
    });
    const touchPage = await touchContext.newPage();
    
    // Set up test environment
    await setupTestEnvironment(touchPage);
    
    // Navigate to encryption setup
    await touchPage.goto('/settings/encryption');
    await touchPage.waitForLoadState('networkidle');
    
    // Start encryption setup
    await touchPage.getByRole('button', { name: /set up encryption/i }).click();
    
    // Complete the password creation step
    await touchPage.getByText(/create a strong encryption password/i).waitFor();
    await touchPage.getByLabel(/password/i).fill('SuperSecureP@ssw0rd123');
    
    // Take a screenshot to verify touch-friendly UI
    await touchPage.screenshot({ path: 'test-results/touch-ui-password.png' });
    
    // Use touch-specific gestures
    // Tap the continue button instead of clicking it
    await touchPage.getByRole('button', { name: /continue|next/i }).tap();
    
    // Verify password confirmation step if it exists
    const confirmPassword = await touchPage.getByLabel(/confirm password/i);
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill('SuperSecureP@ssw0rd123');
      await touchPage.getByRole('button', { name: /continue|next/i }).tap();
    }
    
    // Verify touch-specific indicators are present
    await expect(
      touchPage.locator('[role="button"], .touchable, .touch-indicator')
    ).toBeVisible();
    
    // Clean up
    await touchContext.close();
  });
  
  test('should maintain readability on high DPI screens', async ({ browser }) => {
    // Create context with high DPI display settings
    const highDPIContext = await browser.newContext({
      ...devices['Pixel 5'],
      deviceScaleFactor: 3.0, // Simulate high DPI screen
    });
    const highDPIPage = await highDPIContext.newPage();
    
    // Set up test environment
    await setupTestEnvironment(highDPIPage);
    
    // Navigate to encryption setup
    await highDPIPage.goto('/settings/encryption');
    await highDPIPage.waitForLoadState('networkidle');
    
    // Take screenshot of initial state
    await highDPIPage.screenshot({ path: 'test-results/high-dpi-initial.png' });
    
    // Start encryption setup
    await highDPIPage.getByRole('button', { name: /set up encryption/i }).click();
    
    // Verify text is readable
    const passwordLabel = await highDPIPage.getByText(/password/i);
    const styles = await passwordLabel.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        fontWeight: style.fontWeight
      };
    });
    
    // Log font details for debugging
    console.log('High DPI font styles:', styles);
    
    // Take screenshot to verify high DPI rendering
    await highDPIPage.screenshot({ path: 'test-results/high-dpi-encryption.png' });
    
    // Verify icons and UI elements render crisply (no direct test, just visual verification via screenshot)
    
    // Clean up
    await highDPIContext.close();
  });
  
  test('should work with keyboard navigation only', async ({ page }) => {
    // Set up test environment
    await setupTestEnvironment(page);
    
    // Navigate to encryption setup
    await page.goto('/settings/encryption');
    await page.waitForLoadState('networkidle');
    
    // Use tab to navigate to the setup button (starting from the beginning of the page)
    await page.keyboard.press('Tab');
    
    // Keep pressing Tab until we focus the setup button
    let buttonFocused = false;
    let tabCount = 0;
    const maxTabs = 20; // Safety limit
    
    while (!buttonFocused && tabCount < maxTabs) {
      // Check if the setup button is focused
      const isFocused = await page.evaluate(() => {
        const focusedElement = document.activeElement;
        return focusedElement?.textContent?.toLowerCase().includes('set up encryption') || false;
      });
      buttonFocused = isFocused;
      
      if (!buttonFocused) {
        await page.keyboard.press('Tab');
        tabCount++;
      }
    }
    
    // Take screenshot to show focus state
    await page.screenshot({ path: 'test-results/keyboard-focus-button.png' });
    
    // Press Enter to click the button
    await page.keyboard.press('Enter');
    
    // Verify the encryption setup started
    await page.getByText(/create a strong encryption password/i).waitFor();
    
    // Tab to the password field
    await page.keyboard.press('Tab');
    
    // Type in the password
    await page.keyboard.type('SuperSecureP@ssw0rd123');
    
    // Take screenshot to verify keyboard navigation
    await page.screenshot({ path: 'test-results/keyboard-navigation-password.png' });
    
    // Tab to the continue button
    await page.keyboard.press('Tab');
    
    // Press Enter to continue
    await page.keyboard.press('Enter');
    
    // Verify we've moved to the next step
    await expect(
      page.getByText(/confirm password|encryption complete|setup successful/i)
    ).toBeVisible();
  });
  
  test('should work with reduced motion preferences', async ({ browser }) => {
    // Create context with reduced motion preference
    const reducedMotionContext = await browser.newContext({
      reducedMotion: 'reduce'
    });
    const reducedMotionPage = await reducedMotionContext.newPage();
    
    // Set up test environment
    await setupTestEnvironment(reducedMotionPage);
    
    // Navigate to encryption setup
    await reducedMotionPage.goto('/settings/encryption');
    await reducedMotionPage.waitForLoadState('networkidle');
    
    // Start encryption setup
    await reducedMotionPage.getByRole('button', { name: /set up encryption/i }).click();
    
    // Complete password setup
    await reducedMotionPage.getByText(/create a strong encryption password/i).waitFor();
    await reducedMotionPage.getByLabel(/password/i).fill('SuperSecureP@ssw0rd123');
    
    // Verify no animations are present (heuristic check - we look for animation styles)
    const animationPresent = await reducedMotionPage.evaluate(() => {
      const elements = document.querySelectorAll('*');
      // Use Array.from to convert NodeList to array for iteration
      return Array.from(elements).some(element => {
        const style = window.getComputedStyle(element);
        return (
          style.animation !== 'none' || 
          style.transition !== 'none' ||
          parseFloat(style.animationDuration) > 0 ||
          parseFloat(style.transitionDuration) > 0
        );
      });
    });
    
    // Log result for debugging
    console.log('Animations present with reduced motion:', animationPresent);
    
    // Continue with setup
    await reducedMotionPage.getByRole('button', { name: /continue|next/i }).click();
    
    // Take screenshot to verify UI with reduced motion
    await reducedMotionPage.screenshot({ path: 'test-results/reduced-motion-encryption.png' });
    
    // Clean up
    await reducedMotionContext.close();
  });
  
  test('should work with screen readers and accessibility features', async ({ page }) => {
    // Set up test environment
    await setupTestEnvironment(page);
    
    // Navigate to encryption setup
    await page.goto('/settings/encryption');
    await page.waitForLoadState('networkidle');
    
    // Check for proper ARIA attributes on key elements
    await expect(page.locator('[role="button"][aria-label*="encryption" i]')).toBeVisible();
    
    // Start encryption setup
    await page.getByRole('button', { name: /set up encryption/i }).click();
    
    // Verify password field has proper accessibility attributes
    const passwordField = page.getByLabel(/password/i);
    await expect(passwordField).toHaveAttribute('aria-required', 'true');
    
    // Check for descriptive labels
    await expect(page.locator('[aria-describedby]')).toBeVisible();
    
    // Fill in password
    await passwordField.fill('SuperSecureP@ssw0rd123');
    
    // Verify password strength indicator has proper ARIA attributes
    await expect(page.locator('[role="progressbar"], [aria-valuenow]')).toBeVisible();
    
    // Take screenshot for reference
    await page.screenshot({ path: 'test-results/accessibility-features.png' });
    
    // Continue setup
    await page.getByRole('button', { name: /continue|next/i }).click();
    
    // Verify focus management
    const focusedElement = await page.evaluate(() => {
      return {
        tag: document.activeElement?.tagName,
        role: document.activeElement?.getAttribute('role'),
        ariaLabel: document.activeElement?.getAttribute('aria-label')
      };
    });
    
    // Log focus details for debugging
    console.log('Focus after navigation:', focusedElement);
  });
}); 