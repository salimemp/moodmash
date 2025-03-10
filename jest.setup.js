// Set up any global Jest configurations here

// Mock the process.env values
process.env = {
  ...process.env,
  NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
};

// Mock console.error in tests to avoid noisy test output
global.console.error = jest.fn();

// Extend Jest matchers if needed
expect.extend({
  // Add custom matchers here if needed
}); 