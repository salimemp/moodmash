/**
 * API E2E Tests
 * Tests for API endpoints
 */
import { test, expect } from '@playwright/test';

test.describe('Health API', () => {
  test('should respond to health check', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('ok');
  });
});

test.describe('Authentication API', () => {
  test('should return 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.get('/api/auth/me');
    expect(response.status()).toBe(401);
  });

  test('should have login endpoint', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: 'test@example.com', password: 'password' }
    });
    // Should return error for invalid credentials, not 404
    expect([400, 401, 403]).toContain(response.status());
  });

  test('should have register endpoint', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: { email: 'newuser@example.com', password: 'TestPass123' }
    });
    // Should return some response, not 404
    expect(response.status()).not.toBe(404);
  });
});

test.describe('Mood API', () => {
  test('should require authentication for mood endpoints', async ({ request }) => {
    const response = await request.get('/api/moods');
    expect(response.status()).toBe(401);
  });

  test('should require authentication to create mood', async ({ request }) => {
    const response = await request.post('/api/moods', {
      data: { mood: 'happy', intensity: 5 }
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Static Assets', () => {
  test('should serve static CSS', async ({ request }) => {
    const response = await request.get('/static/styles.css');
    expect(response.status()).toBe(200);
  });

  test('should serve static JavaScript', async ({ request }) => {
    const response = await request.get('/static/app.js');
    expect(response.status()).toBe(200);
  });
});
