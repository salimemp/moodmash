import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Ensures the test-results directory exists for screenshots
 */
export function ensureResultsDir() {
  const dir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Takes a screenshot and saves it to the test-results directory
 * 
 * @param page - Playwright page object
 * @param name - Name of the screenshot
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  ensureResultsDir();
  await page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
}

/**
 * Creates a test environment with retry logic
 * 
 * @param page - Playwright page object
 * @param testName - Name of the test (for logging)
 * @param setupFn - Function to set up the test environment
 */
export async function setupWithRetry(
  page: Page, 
  testName: string, 
  setupFn: (page: Page) => Promise<void>
): Promise<void> {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      await setupFn(page);
      console.log(`✅ Test setup successful for: ${testName}`);
      return;
    } catch (error) {
      attempts++;
      console.log(`❌ Test setup failed for: ${testName} (Attempt ${attempts}/${maxAttempts})`);
      console.error(error);
      
      if (attempts >= maxAttempts) {
        console.log(`⚠️ Max attempts reached for: ${testName}. Taking debug screenshot.`);
        await takeScreenshot(page, `setup-failure-${testName.replace(/\s+/g, '-').toLowerCase()}`);
        throw error;
      }
      
      // Wait before retrying
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Safely attempt to find and click a button
 * 
 * @param page - Playwright page object
 * @param buttonNames - Array of possible button names/text to look for
 * @returns True if a button was found and clicked
 */
export async function safeClickButton(page: Page, buttonNames: string[]): Promise<boolean> {
  for (const name of buttonNames) {
    try {
      const button = page.getByRole('button', { name: new RegExp(name, 'i') });
      if (await button.isVisible()) {
        await button.click();
        return true;
      }
    } catch (error) {
      console.log(`Button "${name}" not found or not clickable`);
    }
  }
  
  return false;
}

/**
 * Type enum for lazy loading selectors
 */
export enum Selector {
  Text = 'text',
  Button = 'button',
  Link = 'link',
  Input = 'input'
}

/**
 * Attempt to find elements using different selector strategies
 * Useful when UI selectors might change or differ between environments
 * 
 * @param page - Playwright page object
 * @param type - Type of selector (text, button, etc.)
 * @param possibleValues - Array of possible text/names to look for
 * @returns The first matching selector or null if none found
 */
export async function findElement(page: Page, type: Selector, possibleValues: string[]) {
  for (const value of possibleValues) {
    try {
      let element;
      
      switch (type) {
        case Selector.Text:
          element = page.getByText(new RegExp(value, 'i'));
          break;
        case Selector.Button:
          element = page.getByRole('button', { name: new RegExp(value, 'i') });
          break;
        case Selector.Link:
          element = page.getByRole('link', { name: new RegExp(value, 'i') });
          break;
        case Selector.Input:
          element = page.getByLabel(new RegExp(value, 'i'));
          break;
      }
      
      if (await element.isVisible()) {
        return element;
      }
    } catch (error) {
      // Continue to next possible value
    }
  }
  
  return null;
} 