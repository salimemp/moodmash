/**
 * Configuration values for rate limits
 * 
 * This module contains type definitions and configuration for 
 * different rate limit scenarios in the application.
 */

// Define rate limit types
export type RateLimitType =
  | 'general'
  | 'auth'
  | 'mfa'
  | 'api'
  | 'login'
  | 'passwordReset'
  | 'emailVerification';

// Rate limit configuration interface
export interface RateLimitConfig {
  max: number;
  window: number;
  message: string;
}

// Configure rate limits for different actions
export const rateLimits: Record<RateLimitType, RateLimitConfig> = {
  general: {
    max: 60,
    window: 60,
    message: 'Too many requests, please try again later.',
  },
  auth: {
    max: 10,
    window: 60,
    message: 'Too many authentication attempts, please try again later.',
  },
  mfa: {
    max: 5,
    window: 60,
    message: 'Too many MFA attempts, please try again later.',
  },
  api: {
    max: 60,
    window: 60,
    message: 'Rate limit exceeded, please try again later.',
  },
  login: {
    max: 5,
    window: 60 * 15, // 15 minutes
    message: 'Too many login attempts. Please try again later.',
  },
  passwordReset: {
    max: 3,
    window: 60 * 15, // 15 minutes
    message: 'Too many password reset attempts. Please try again later.',
  },
  emailVerification: {
    max: 5,
    window: 60 * 15, // 15 minutes
    message: 'Too many email verification attempts. Please try again later.',
  },
};

// Helper function to generate rate limit keys
export function generateRateLimitKey(type: RateLimitType, identifier: string): string {
  return `ratelimit:${type}:${identifier}`;
}

export function generateIPRateLimitKey(type: RateLimitType, ip: string): string {
  return `ratelimit:${type}:ip:${ip}`;
} 