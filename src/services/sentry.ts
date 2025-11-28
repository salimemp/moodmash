/**
 * Sentry.io Error Tracking Service (Simplified for Cloudflare Workers)
 * For MoodMash - Cloudflare Pages/Workers
 * 
 * Note: @sentry/cloudflare doesn't require explicit initialization
 * It works automatically when SENTRY_DSN is set in environment
 */

import * as Sentry from '@sentry/cloudflare';
import type { Context } from 'hono';
import type { Bindings } from '../types';

/**
 * Check if Sentry is configured
 */
export function isSentryConfigured(env: Bindings): boolean {
  return Boolean(env.SENTRY_DSN);
}

/**
 * Hash email for privacy
 */
function hashEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (!domain) return email;
  
  const visible = username.substring(0, 2);
  const hash = simpleHash(username);
  return `${visible}***${hash}@${domain}`;
}

/**
 * Simple hash function
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 6);
}

/**
 * Set user context for Sentry
 * Wrapped in try-catch to prevent crashes
 */
export function setSentryUser(userId: number, username: string, email: string) {
  try {
    Sentry.setUser({
      id: userId.toString(),
      username: username,
      email: hashEmail(email),
    });
  } catch (error) {
    // Silently ignore to prevent app crashes
    console.error('[Sentry] Failed to set user:', error);
  }
}

/**
 * Clear user context
 * Wrapped in try-catch to prevent crashes
 */
export function clearSentryUser() {
  try {
    Sentry.setUser(null);
  } catch (error) {
    // Silently ignore to prevent app crashes
    console.error('[Sentry] Failed to clear user:', error);
  }
}

/**
 * Capture error with context
 * Wrapped in try-catch to prevent crashes
 */
export function captureError(error: Error, context?: {
  endpoint?: string;
  userId?: number;
  method?: string;
  statusCode?: number;
  [key: string]: unknown;
}) {
  try {
    Sentry.captureException(error, {
      tags: {
        endpoint: context?.endpoint,
        method: context?.method,
        status_code: context?.statusCode?.toString(),
      },
      extra: context,
    });
  } catch (err) {
    // Silently ignore to prevent app crashes
    console.error('[Sentry] Failed to capture error:', err);
  }
}

/**
 * Capture message
 * Wrapped in try-catch to prevent crashes
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  try {
    Sentry.captureMessage(message, level);
  } catch (error) {
    // Silently ignore to prevent app crashes
    console.error('[Sentry] Failed to capture message:', error);
  }
}

/**
 * Add breadcrumb
 * Wrapped in try-catch to prevent crashes
 */
export function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
  try {
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  } catch (error) {
    // Silently ignore to prevent app crashes
    console.error('[Sentry] Failed to add breadcrumb:', error);
  }
}

/**
 * Middleware to add Sentry context
 * Wrapped in defensive try-catch to prevent Sentry errors from breaking the app
 */
export async function sentryMiddleware(
  c: Context<{ Bindings: Bindings }>,
  next: () => Promise<void>
) {
  if (!isSentryConfigured(c.env)) {
    return await next();
  }

  try {
    // Add request context (wrapped in try-catch to prevent crashes)
    try {
      Sentry.setContext('request', {
        method: c.req.method,
        url: c.req.url,
        path: c.req.path,
        headers: {
          'user-agent': c.req.header('user-agent'),
          'content-type': c.req.header('content-type'),
        },
      });
    } catch (contextError) {
      // Silently ignore context errors to prevent app crashes
      console.error('[Sentry] Failed to set context:', contextError);
    }

    await next();
  } catch (error) {
    // Capture error (wrapped in try-catch to prevent crashes)
    try {
      captureError(error as Error, {
        endpoint: c.req.path,
        method: c.req.method,
        statusCode: c.res?.status || 500,
      });
    } catch (captureErr) {
      // Silently ignore capture errors to prevent app crashes
      console.error('[Sentry] Failed to capture error:', captureErr);
    }
    
    throw error;
  }
}

export default {
  isSentryConfigured,
  setSentryUser,
  clearSentryUser,
  captureError,
  captureMessage,
  addBreadcrumb,
  sentryMiddleware,
};
