import { Page, Route } from '@playwright/test';

/**
 * Interface for mock response configuration
 */
interface MockResponseOptions {
  status?: number;
  body?: any;
  headers?: Record<string, string>;
  contentType?: string;
  delay?: number;
}

/**
 * Default options for mock responses
 */
const defaultOptions: MockResponseOptions = {
  status: 200,
  body: {},
  headers: {
    'Content-Type': 'application/json'
  },
  delay: 0
};

/**
 * Mock a network request to return a specific response
 * 
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to match (string or RegExp)
 * @param options - Options for the mock response
 * @returns Promise that resolves when the mock is set up
 */
export async function mockNetworkRequest(
  page: Page,
  urlPattern: string | RegExp,
  options: MockResponseOptions
): Promise<void> {
  const mockOptions = { ...defaultOptions, ...options };
  
  await page.route(urlPattern, async (route: Route) => {
    // Apply delay if specified
    if (mockOptions.delay && mockOptions.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, mockOptions.delay));
    }
    
    // Determine content type
    const contentType = mockOptions.contentType || 
      mockOptions.headers?.['Content-Type'] || 
      'application/json';
      
    // Create response body
    let body: string | Buffer;
    if (contentType.includes('application/json') && typeof mockOptions.body === 'object') {
      body = JSON.stringify(mockOptions.body);
    } else if (typeof mockOptions.body === 'string') {
      body = mockOptions.body;
    } else {
      body = JSON.stringify(mockOptions.body);
    }
    
    // Fulfill the route with mock response
    await route.fulfill({
      status: mockOptions.status,
      headers: {
        ...mockOptions.headers,
        'Content-Type': contentType
      },
      body
    });
  });
}

/**
 * Handler for simulating network errors in Playwright tests
 * Interrupts the request to simulate a network error
 * 
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to match (string or RegExp)
 * @returns Promise that resolves when the error handler is set up
 */
export async function networkErrorHandler(
  page: Page,
  urlPattern: string | RegExp
): Promise<void> {
  await page.route(urlPattern, async (route: Route) => {
    await route.abort('failed');
  });
}

/**
 * Simulate a slow network connection
 * 
 * @param page - Playwright page object
 * @param delay - Delay in milliseconds to add to each request
 * @returns Promise that resolves when the throttling is set up
 */
export async function simulateSlowNetwork(
  page: Page,
  delay: number = 1000
): Promise<void> {
  await page.route('**/*', async (route: Route) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    await route.continue();
  });
}

/**
 * Simulate an offline connection
 * 
 * @param page - Playwright page object
 * @returns Promise that resolves when offline mode is set up
 */
export async function simulateOffline(page: Page): Promise<void> {
  await page.context().setOffline(true);
}

/**
 * Restore normal network conditions
 * 
 * @param page - Playwright page object
 * @returns Promise that resolves when normal conditions are restored
 */
export async function restoreNetwork(page: Page): Promise<void> {
  await page.context().setOffline(false);
  await page.unrouteAll();
}

/**
 * Simulate intermittent network connectivity
 * 
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to match (string or RegExp)
 * @param failureRate - Probability of request failure (0-1)
 * @returns Promise that resolves when the intermittent connection is set up
 */
export async function simulateIntermittentConnection(
  page: Page,
  urlPattern: string | RegExp = '**/*',
  failureRate: number = 0.3
): Promise<void> {
  await page.route(urlPattern, async (route: Route) => {
    if (Math.random() < failureRate) {
      await route.abort('failed');
    } else {
      await route.continue();
    }
  });
} 