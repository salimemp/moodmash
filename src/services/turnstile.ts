/**
 * Cloudflare Turnstile (Captcha) Service
 * Version: 10.1 (Premium Features)
 * 
 * Features:
 * - Turnstile verification
 * - Bot detection
 * - Rate limiting integration
 */

import type { Bindings } from '../types';

export interface TurnstileVerificationResult {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  error_codes?: string[];
  action?: string;
  cdata?: string;
}

/**
 * Verify Cloudflare Turnstile token
 */
export async function verifyTurnstile(
  env: Bindings,
  token: string,
  remoteIP?: string
): Promise<TurnstileVerificationResult> {
  try {
    // Cloudflare Turnstile verification endpoint
    const endpoint = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    // Get Turnstile secret from environment
    const secret = env.TURNSTILE_SECRET_KEY || 'DEMO_SECRET';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: remoteIP,
      }),
    });

    const result: TurnstileVerificationResult = await response.json();

    return result;
  } catch (error) {
    console.error('Turnstile verification failed:', error);
    return {
      success: false,
      error_codes: ['internal-error'],
    };
  }
}

/**
 * Log captcha verification attempt
 */
export async function logCaptchaVerification(
  env: Bindings,
  userId: number | null,
  ipAddress: string | null,
  action: string,
  success: boolean,
  challengeTs?: string,
  hostname?: string,
  errorCodes?: string[]
): Promise<void> {
  try {
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO captcha_verifications (
        user_id, ip_address, action, success,
        challenge_ts, hostname, error_codes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        userId,
        ipAddress,
        action,
        success ? 1 : 0,
        challengeTs || null,
        hostname || null,
        errorCodes ? JSON.stringify(errorCodes) : null,
        now
      )
      .run();
  } catch (error) {
    console.error('Failed to log captcha verification:', error);
  }
}

/**
 * Check if IP has too many failed captcha attempts
 */
export async function checkCaptchaRateLimit(
  env: Bindings,
  ipAddress: string,
  timeWindowMinutes: number = 15
): Promise<{ blocked: boolean; attempts: number; limit: number }> {
  try {
    const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString();

    const result = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM captcha_verifications
      WHERE ip_address = ?
        AND success = 0
        AND created_at > ?
    `)
      .bind(ipAddress, since)
      .first();

    const attempts = result?.count as number || 0;
    const limit = 5; // Max 5 failed attempts in time window

    return {
      blocked: attempts >= limit,
      attempts,
      limit,
    };
  } catch (error) {
    console.error('Failed to check captcha rate limit:', error);
    return { blocked: false, attempts: 0, limit: 5 };
  }
}

/**
 * Get captcha verification stats
 */
export async function getCaptchaStats(
  env: Bindings,
  timeframe: 'hour' | 'day' | 'week' = 'day'
): Promise<Record<string, unknown> | null> {
  try {
    const timeframeMinutes = {
      hour: 60,
      day: 1440,
      week: 10080,
    };

    const minutes = timeframeMinutes[timeframe];
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

    // Overall stats
    const overall = await env.DB.prepare(`
      SELECT
        COUNT(*) as total_attempts,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
      FROM captcha_verifications
      WHERE created_at > ?
    `)
      .bind(since)
      .first();

    // By action
    const byAction = await env.DB.prepare(`
      SELECT
        action,
        COUNT(*) as attempts,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful
      FROM captcha_verifications
      WHERE created_at > ?
      GROUP BY action
      ORDER BY attempts DESC
    `)
      .bind(since)
      .all();

    // Top IPs with failed attempts
    const topFailedIPs = await env.DB.prepare(`
      SELECT
        ip_address,
        COUNT(*) as failed_attempts
      FROM captcha_verifications
      WHERE created_at > ?
        AND success = 0
      GROUP BY ip_address
      ORDER BY failed_attempts DESC
      LIMIT 10
    `)
      .bind(since)
      .all();

    const total = overall?.total_attempts as number || 0;
    const successful = overall?.successful as number || 0;

    return {
      overall: {
        total_attempts: total,
        successful,
        failed: overall?.failed || 0,
        success_rate: total > 0 ? ((successful / total) * 100).toFixed(2) : '0.00',
      },
      by_action: byAction.results || [],
      top_failed_ips: topFailedIPs.results || [],
      timeframe,
      last_updated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to get captcha stats:', error);
    return null;
  }
}

/**
 * Generate Turnstile widget HTML
 */
export function getTurnstileWidget(siteKey: string, action: string = 'submit'): string {
  return `
    <div class="cf-turnstile" 
         data-sitekey="${siteKey}" 
         data-action="${action}"
         data-theme="light"
         data-size="normal">
    </div>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  `;
}
