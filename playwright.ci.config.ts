import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * CI-specific Playwright configuration
 * This extends the base configuration with settings optimized for CI environments
 */
export default defineConfig({
  ...baseConfig,
  
  // Increase timeout for CI environments
  timeout: 60000,
  
  // Override workers to reduce parallelism in CI
  workers: 2,
  
  // Override reporter to generate GitHub-compatible output
  reporter: [
    ['html'],
    ['github'],
    ['json', { outputFile: 'test-results/test-results.json' }]
  ],
  
  // CI-specific test use configuration
  use: {
    ...baseConfig.use,
    // Always capture traces in CI for debugging
    trace: 'on',
    // Take screenshots for all tests in CI
    screenshot: 'on',
    // Record videos for all tests in CI
    video: 'on',
  },
  
  // Limit projects in CI to reduce resource usage
  projects: [
    {
      name: 'chromium',
      use: { ...baseConfig.projects?.find(p => p.name === 'chromium')?.use },
    },
    // Firefox is included for cross-browser testing
    {
      name: 'firefox',
      use: { ...baseConfig.projects?.find(p => p.name === 'firefox')?.use },
    }
    // Skipping webkit, mobile-chrome, and mobile-safari for faster CI runs
  ],
  
  // Configure web server behavior
  webServer: baseConfig.webServer ? {
    ...baseConfig.webServer,
    reuseExistingServer: false, // Always use a fresh server in CI
  } : undefined,
}); 