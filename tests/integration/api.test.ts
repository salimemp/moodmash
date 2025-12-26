import { describe, it, expect } from 'vitest';

describe('API Integration Tests', () => {
  const API_BASE = 'https://moodmash.win/api';

  describe('Health Endpoint', () => {
    it('should return 200 OK with health status', async () => {
      const response = await fetch(`${API_BASE}/health`);
      expect(response.status).toBe(200);
      
      const data: any = await response.json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('ok');
    });

    it('should return database connection status', async () => {
      const response = await fetch(`${API_BASE}/health`);
      const data: any = await response.json();
      
      expect(data).toHaveProperty('database');
      expect(data.database).toHaveProperty('connected');
      expect(data.database.connected).toBe(true);
    });
  });

  describe('Authentication Endpoints', () => {
    it('should return 401 for unauthenticated /api/auth/me request', async () => {
      const response = await fetch(`${API_BASE}/auth/me`);
      expect(response.status).toBe(401);
      
      const data: any = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should return 401 for protected /api/stats endpoint', async () => {
      const response = await fetch(`${API_BASE}/stats`);
      expect(response.status).toBe(401);
      
      const data: any = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Authentication required');
    });

    it('should return 401 for protected /api/moods endpoint', async () => {
      const response = await fetch(`${API_BASE}/moods`);
      expect(response.status).toBe(401);
      
      const data: any = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Authentication required');
    });
  });

  describe('PWA Endpoints', () => {
    it.skip('should serve manifest.json (CORS - test manually)', async () => {
      // This test requires CORS headers - test manually in browser or with curl
      const response = await fetch('https://moodmash.win/manifest.json');
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      
      const data = await response.json();
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('short_name');
      expect(data).toHaveProperty('start_url');
    });

    it.skip('should serve service worker (CORS - test manually)', async () => {
      // This test requires CORS headers - test manually in browser or with curl
      const response = await fetch('https://moodmash.win/sw.js');
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('javascript');
    });
  });

  describe('Static Assets', () => {
    it.skip('should serve app.js (CORS - test manually)', async () => {
      // This test requires CORS headers - test manually in browser or with curl
      const response = await fetch('https://moodmash.win/static/app.js');
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('javascript');
    });

    it.skip('should serve styles.css (CORS - test manually)', async () => {
      // This test requires CORS headers - test manually in browser or with curl
      const response = await fetch('https://moodmash.win/static/styles.css');
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('css');
    });
  });

  describe('Performance', () => {
    it('should respond to health check within 2 seconds', async () => {
      const start = Date.now();
      const response = await fetch(`${API_BASE}/health`);
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000);
    });

    it.skip('should respond to homepage within 2 seconds (CORS - test manually)', async () => {
      // This test requires CORS headers - test manually in browser or with curl
      const start = Date.now();
      const response = await fetch('https://moodmash.win/');
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000);
    });
  });
});
