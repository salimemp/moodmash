import helloHandler from '@/pages/api/hello';
import { createMocks } from 'node-mocks-http';
import { describe, expect, it } from 'vitest';

// Tests for Hello API
// Validates basic API functionality
describe('Hello API', () => {
  // Verifies that the API returns the expected response
  // Ensures the API works correctly
  it('should return 200 with the expected response', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await helloHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      name: 'John Doe',
    });
  });

  // Verifies that the API works with different HTTP methods
  // Ensures the API is method-agnostic
  it('should work with different HTTP methods', async () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE'] as const;
    
    for (const method of methods) {
      const { req, res } = createMocks({
        method,
      });

      await helloHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        name: 'John Doe',
      });
    }
  });
}); 