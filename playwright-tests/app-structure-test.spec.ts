import { test } from '@playwright/test';

test.describe('Application Structure Tests', () => {
  test('identify available routes', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Take a screenshot of the home page
    await page.screenshot({ path: 'test-results/home-page.png' });
    
    // Log page information
    console.log(`Current URL: ${page.url()}`);
    console.log(`Page title: ${await page.title()}`);
    
    // Get all links on the page
    const links = await page.getByRole('link').all();
    console.log(`Found ${links.length} links on the page`);
    
    // Log each link's text and href
    for (const link of links) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      console.log(`Link: "${text?.trim()}" -> ${href}`);
    }
    
    // Find all buttons
    const buttons = await page.getByRole('button').all();
    console.log(`Found ${buttons.length} buttons on the page`);
    
    // Log each button's text
    for (const button of buttons) {
      const text = await button.textContent();
      console.log(`Button: "${text?.trim()}"`);
    }
    
    // Try to find any encryption-related content
    const bodyContent = await page.locator('body').textContent();
    const encryptionKeywords = [
      'encryption', 'encrypt', 'security', 'password', 'secure', 'privacy'
    ];
    
    for (const keyword of encryptionKeywords) {
      if (bodyContent?.toLowerCase().includes(keyword.toLowerCase())) {
        console.log(`Found keyword "${keyword}" on the page`);
      }
    }
    
    // Try to navigate to some test routes
    const testRoutes = [
      '/test-mood',
      '/enhanced-mood',
      '/settings',
      '/account'
    ];
    
    for (const route of testRoutes) {
      await page.goto(route);
      console.log(`Navigation to ${route}: ${page.url()}`);
      
      // Check if we got a 404
      const is404 = await page.getByText('404').isVisible();
      if (is404) {
        console.log(`Route ${route} returned a 404 page`);
      } else {
        await page.screenshot({ path: `test-results/route-${route.replace(/\//g, '-')}.png` });
      }
    }
  });
}); 