/**
 * Captcha API Routes
 * Handles Cloudflare Turnstile verification
 */

import { Hono } from 'hono';
import type { Bindings, TurnstileVerificationResult } from '../../types';

const captcha = new Hono<{ Bindings: Bindings }>();

// Verify captcha token
captcha.post('/verify', async (c) => {
  const { TURNSTILE_SECRET_KEY } = c.env;

  if (!TURNSTILE_SECRET_KEY) {
    // If not configured, skip verification
    return c.json({ success: true, message: 'Captcha not configured' });
  }

  try {
    const body = await c.req.json<{ token: string }>();

    if (!body.token) {
      return c.json({ success: false, error: 'Token required' }, 400);
    }

    const ip = c.req.header('CF-Connecting-IP') || '';

    const formData = new FormData();
    formData.append('secret', TURNSTILE_SECRET_KEY);
    formData.append('response', body.token);
    formData.append('remoteip', ip);

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });

    const verification = await result.json() as TurnstileVerificationResult;

    if (verification.success) {
      return c.json({ success: true });
    } else {
      return c.json({
        success: false,
        error: 'Verification failed',
        codes: verification['error-codes']
      }, 400);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: message }, 500);
  }
});

// Get captcha stats (admin only - simplified)
captcha.get('/stats', async (c) => {
  // In production, track verification stats
  return c.json({
    stats: {
      totalVerifications: 0,
      successRate: 100,
      lastVerification: null
    }
  });
});

export default captcha;
