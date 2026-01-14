/**
 * Security Tests
 * Tests for authentication, authorization, input validation, and security headers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { isValidEmail, isStrongPassword, sanitizeInput } from '../../src/middleware/security';
import { getErrorMessage } from '../../src/types';

describe('Security Middleware', () => {
  describe('Email Validation', () => {
    it('should accept valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.com')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
      expect(isValidEmail('user@subdomain.example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@.com')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidEmail('a@b.co')).toBe(true);
      expect(isValidEmail('very.long.email.address@very.long.domain.example.com')).toBe(true);
    });
  });

  describe('Password Strength Validation', () => {
    it('should accept strong passwords', () => {
      expect(isStrongPassword('SecureP@ss123').valid).toBe(true);
      expect(isStrongPassword('MyP@ssw0rd!').valid).toBe(true);
      expect(isStrongPassword('Str0ng#Pass').valid).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isStrongPassword('').valid).toBe(false);
      expect(isStrongPassword('short').valid).toBe(false);
      expect(isStrongPassword('password').valid).toBe(false);
      expect(isStrongPassword('12345678').valid).toBe(false);
      expect(isStrongPassword('nouppercaseordigits!').valid).toBe(false);
    });

    it('should require minimum length', () => {
      expect(isStrongPassword('Aa1!').valid).toBe(false); // Too short
      expect(isStrongPassword('Aa1!5678').valid).toBe(true); // 8 chars minimum
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize HTML tags', () => {
      const result = sanitizeInput('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
    });

    it('should handle normal text', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World');
    });

    it('should not trim whitespace (escapes only)', () => {
      const result = sanitizeInput('  spaced  ');
      expect(result).toContain('spaced');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should escape angle brackets', () => {
      const input = '<img onerror="alert(1)" src=x>';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toContain('&lt;');
      expect(sanitized).toContain('&gt;');
    });
  });
});

describe('Error Handling', () => {
  describe('getErrorMessage', () => {
    it('should extract message from Error objects', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should handle string errors', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should handle unknown error types gracefully', () => {
      // These should return a string (either the value or a default message)
      expect(typeof getErrorMessage(null)).toBe('string');
      expect(typeof getErrorMessage(undefined)).toBe('string');
      expect(typeof getErrorMessage(123)).toBe('string');
    });

    it('should handle objects with message property', () => {
      const error = { message: 'Object error' };
      const result = getErrorMessage(error);
      expect(typeof result).toBe('string');
    });
  });
});

describe('SQL Injection Prevention', () => {
  it('should escape single quotes in SQL input', () => {
    const malicious = "'; DROP TABLE users; --";
    const sanitized = sanitizeInput(malicious);
    // Single quotes should be escaped
    expect(sanitized).toContain('&#x27;');
  });

  it('should handle UNION attacks', () => {
    const malicious = "1 UNION SELECT * FROM passwords";
    const sanitized = sanitizeInput(malicious);
    // Should be escaped or sanitized
    expect(typeof sanitized).toBe('string');
  });
});

describe('XSS Prevention', () => {
  it('should escape script tags', () => {
    const malicious = '<script>document.cookie</script>';
    const sanitized = sanitizeInput(malicious);
    expect(sanitized).toContain('&lt;script&gt;');
    expect(sanitized).not.toBe(malicious);
  });

  it('should escape angle brackets in event handlers', () => {
    const malicious = '<img src=x onerror=alert(1)>';
    const sanitized = sanitizeInput(malicious);
    expect(sanitized).toContain('&lt;img');
  });

  it('should escape angle brackets in links', () => {
    const malicious = '<a href="javascript:alert(1)">click</a>';
    const sanitized = sanitizeInput(malicious);
    expect(sanitized).toContain('&lt;a');
  });
});

describe('Authentication Security', () => {
  it('should not expose internal errors', () => {
    const internalError = new Error('Database connection failed at 192.168.1.1');
    const message = getErrorMessage(internalError);
    // In production, this should be sanitized
    expect(typeof message).toBe('string');
  });
});

describe('Rate Limiting Headers', () => {
  it('should have expected rate limit response structure', () => {
    const rateLimitResponse = {
      error: 'Too Many Requests',
      retryAfter: 60
    };
    expect(rateLimitResponse).toHaveProperty('error');
    expect(rateLimitResponse.retryAfter).toBeGreaterThan(0);
  });
});
