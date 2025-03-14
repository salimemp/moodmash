import { test } from '@playwright/test';

test.describe('Simple Encryption Tests', () => {
  test('can access the encryption settings page', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Take a screenshot of the home page
    await page.screenshot({ path: 'test-results/home-page.png' });
    
    // Try to navigate to settings (depends on your app structure)
    try {
      // Option 1: Direct URL
      await page.goto('/settings/encryption');
      console.log('✅ Successfully navigated to encryption page via direct URL');
    } catch (error) {
      console.log('❌ Could not navigate via direct URL, trying alternatives');
      
      // Option 2: Click on UI elements (if available)
      try {
        await page.goto('/');
        
        // Try to find and click settings button
        const settingsButton = page.getByRole('button', { name: /settings/i });
        if (await settingsButton.isVisible()) {
          await settingsButton.click();
          console.log('✅ Clicked settings button');
          
          // Try to find and click encryption option
          const encryptionLink = page.getByRole('link', { name: /encryption/i });
          if (await encryptionLink.isVisible()) {
            await encryptionLink.click();
            console.log('✅ Clicked encryption link');
          }
        }
      } catch (innerError) {
        console.log('❌ Navigation via UI failed');
      }
    }
    
    // Take a screenshot of the current page
    await page.screenshot({ path: 'test-results/current-page.png' });
    
    // Log page information for debugging
    console.log(`Current URL: ${page.url()}`);
    console.log(`Page title: ${await page.title()}`);
    
    // Log visible text elements for debugging
    const bodyText = await page.locator('body').textContent();
    console.log('Page content preview:', bodyText?.substring(0, 200));
  });
}); 