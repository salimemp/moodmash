/**
 * API Tests
 * Tests for API request handling, response formatting, and error handling
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('API Utilities', () => {
  describe('Response Formatting', () => {
    interface ApiResponse<T = any> {
      success: boolean;
      data?: T;
      error?: string;
      message?: string;
    }

    const successResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
      success: true,
      data,
      message,
    });

    const errorResponse = (error: string, status?: number): ApiResponse => ({
      success: false,
      error,
    });

    it('should format success responses', () => {
      const response = successResponse({ id: 1, name: 'Test' }, 'Created successfully');
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ id: 1, name: 'Test' });
      expect(response.message).toBe('Created successfully');
    });

    it('should format error responses', () => {
      const response = errorResponse('Not found');
      expect(response.success).toBe(false);
      expect(response.error).toBe('Not found');
    });
  });

  describe('Request Validation', () => {
    const validateRequest = (body: any, requiredFields: string[]): { valid: boolean; missing: string[] } => {
      const missing = requiredFields.filter(field => {
        const value = body[field];
        return value === undefined || value === null || value === '';
      });
      return { valid: missing.length === 0, missing };
    };

    it('should validate complete requests', () => {
      const result = validateRequest(
        { email: 'test@example.com', password: 'secret' },
        ['email', 'password']
      );
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should identify missing fields', () => {
      const result = validateRequest(
        { email: 'test@example.com' },
        ['email', 'password']
      );
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('password');
    });

    it('should reject empty values', () => {
      const result = validateRequest(
        { email: '', password: null },
        ['email', 'password']
      );
      expect(result.valid).toBe(false);
      expect(result.missing).toHaveLength(2);
    });
  });

  describe('Query Parameter Parsing', () => {
    const parseQueryParams = (url: string): Record<string, string> => {
      const urlObj = new URL(url, 'http://localhost');
      const params: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      return params;
    };

    const parsePagination = (params: Record<string, string>): { page: number; limit: number; offset: number } => {
      const page = Math.max(1, parseInt(params.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(params.limit || '20', 10)));
      const offset = (page - 1) * limit;
      return { page, limit, offset };
    };

    it('should parse query parameters', () => {
      const params = parseQueryParams('/api/moods?page=2&limit=10');
      expect(params.page).toBe('2');
      expect(params.limit).toBe('10');
    });

    it('should parse pagination with defaults', () => {
      const pagination = parsePagination({});
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(20);
      expect(pagination.offset).toBe(0);
    });

    it('should handle invalid pagination values', () => {
      const pagination = parsePagination({ page: '-1', limit: '999' });
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(100);
    });
  });

  describe('Rate Limiting', () => {
    class RateLimiter {
      private requests: Map<string, number[]> = new Map();
      private maxRequests: number;
      private windowMs: number;

      constructor(maxRequests: number = 100, windowMs: number = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
      }

      check(key: string): { allowed: boolean; remaining: number; resetMs: number } {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        
        let timestamps = this.requests.get(key) || [];
        timestamps = timestamps.filter(t => t > windowStart);
        
        const allowed = timestamps.length < this.maxRequests;
        
        if (allowed) {
          timestamps.push(now);
          this.requests.set(key, timestamps);
        }

        return {
          allowed,
          remaining: Math.max(0, this.maxRequests - timestamps.length),
          resetMs: timestamps.length > 0 ? timestamps[0] + this.windowMs - now : 0,
        };
      }
    }

    it('should allow requests within limit', () => {
      const limiter = new RateLimiter(5, 1000);
      for (let i = 0; i < 5; i++) {
        const result = limiter.check('user1');
        expect(result.allowed).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const limiter = new RateLimiter(3, 1000);
      
      limiter.check('user1');
      limiter.check('user1');
      limiter.check('user1');
      
      const result = limiter.check('user1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should track different users separately', () => {
      const limiter = new RateLimiter(2, 1000);
      
      limiter.check('user1');
      limiter.check('user1');
      
      const result = limiter.check('user2');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Error Handling', () => {
    const httpStatusText = (status: number): string => {
      const statusTexts: Record<number, string> = {
        200: 'OK',
        201: 'Created',
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        429: 'Too Many Requests',
        500: 'Internal Server Error',
      };
      return statusTexts[status] || 'Unknown Error';
    };

    it('should return correct status text', () => {
      expect(httpStatusText(200)).toBe('OK');
      expect(httpStatusText(404)).toBe('Not Found');
      expect(httpStatusText(500)).toBe('Internal Server Error');
    });

    it('should handle unknown status codes', () => {
      expect(httpStatusText(999)).toBe('Unknown Error');
    });
  });
});
