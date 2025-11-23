/**
 * Analytics Middleware for MoodMash
 * Tracks page views, API calls, and user events
 */

import { Context } from 'hono';

interface AnalyticsContext {
  startTime: number;
  endpoint: string;
  method: string;
  userId?: number;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Track API call metrics
 */
export async function trackApiCall(
  c: Context,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  userId?: number,
  error?: { type: string; message: string }
) {
  try {
    const db = c.env.DB;
    const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';

    // Track in api_metrics
    await db.prepare(`
      INSERT INTO api_metrics (
        endpoint, method, status_code, response_time_ms,
        user_id, ip_address, user_agent,
        error_type, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      endpoint,
      method,
      statusCode,
      responseTime,
      userId || null,
      ipAddress,
      userAgent,
      error?.type || null,
      error?.message || null
    ).run();

    // Track in analytics_events
    const eventType = statusCode >= 400 ? 'error' : 'api_call';
    await db.prepare(`
      INSERT INTO analytics_events (
        event_type, event_name, user_id, session_id,
        api_endpoint, api_method, api_status_code, api_response_time_ms,
        context, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      eventType,
      `${method} ${endpoint}`,
      userId || null,
      c.req.header('x-session-id') || null,
      endpoint,
      method,
      statusCode,
      responseTime,
      JSON.stringify({ ipAddress, userAgent })
    ).run();

    // Update user analytics if user is logged in
    if (userId) {
      await db.prepare(`
        INSERT INTO user_analytics (user_id, total_api_calls, last_active_at, created_at)
        VALUES (?, 1, datetime('now'), datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          total_api_calls = total_api_calls + 1,
          last_active_at = datetime('now'),
          updated_at = datetime('now')
      `).bind(userId).run();
    }
  } catch (error) {
    console.error('Analytics tracking failed:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
}

/**
 * Track page view
 */
export async function trackPageView(
  c: Context,
  pageUrl: string,
  pageTitle?: string,
  userId?: number,
  sessionId?: string
) {
  try {
    const db = c.env.DB;
    const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    const referrer = c.req.header('referer') || c.req.header('referrer') || '';

    // Detect device type
    const ua = userAgent.toLowerCase();
    let deviceType = 'desktop';
    if (ua.includes('mobile')) deviceType = 'mobile';
    else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'tablet';

    await db.prepare(`
      INSERT INTO page_views (
        user_id, session_id, page_url, page_title, referrer,
        ip_address, user_agent, device_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      userId || null,
      sessionId || 'anonymous',
      pageUrl,
      pageTitle || '',
      referrer,
      ipAddress,
      userAgent,
      deviceType
    ).run();

    // Track in analytics_events
    await db.prepare(`
      INSERT INTO analytics_events (
        event_type, event_name, user_id, session_id,
        page_url, page_title, context, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      'page_view',
      pageUrl,
      userId || null,
      sessionId || 'anonymous',
      pageUrl,
      pageTitle || '',
      JSON.stringify({ ipAddress, userAgent, deviceType, referrer })
    ).run();

    // Update user analytics
    if (userId) {
      await db.prepare(`
        INSERT INTO user_analytics (user_id, total_page_views, last_active_at, created_at)
        VALUES (?, 1, datetime('now'), datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          total_page_views = total_page_views + 1,
          last_active_at = datetime('now'),
          updated_at = datetime('now')
      `).bind(userId).run();
    }
  } catch (error) {
    console.error('Page view tracking failed:', error);
  }
}

/**
 * Track custom event
 */
export async function trackEvent(
  c: Context,
  eventType: string,
  eventName: string,
  properties?: Record<string, any>,
  userId?: number
) {
  try {
    const db = c.env.DB;
    const ipAddress = c.req.header('cf-connecting-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';

    await db.prepare(`
      INSERT INTO analytics_events (
        event_type, event_name, user_id, properties, context, created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      eventType,
      eventName,
      userId || null,
      JSON.stringify(properties || {}),
      JSON.stringify({ ipAddress, userAgent })
    ).run();
  } catch (error) {
    console.error('Event tracking failed:', error);
  }
}

/**
 * Log error with context
 */
export async function logError(
  c: Context,
  errorType: string,
  errorMessage: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  options?: {
    errorCode?: string;
    stackTrace?: string;
    userId?: number;
    sessionId?: string;
    endpoint?: string;
    method?: string;
    requestBody?: any;
  }
) {
  try {
    const db = c.env.DB;
    const ipAddress = c.req.header('cf-connecting-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';

    await db.prepare(`
      INSERT INTO error_logs (
        error_type, severity, error_code, error_message, stack_trace,
        user_id, session_id, endpoint, method, request_body,
        ip_address, user_agent, environment, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'production', datetime('now'))
    `).bind(
      errorType,
      severity,
      options?.errorCode || null,
      errorMessage,
      options?.stackTrace || null,
      options?.userId || null,
      options?.sessionId || null,
      options?.endpoint || null,
      options?.method || null,
      options?.requestBody ? JSON.stringify(options.requestBody) : null,
      ipAddress,
      userAgent
    ).run();
  } catch (error) {
    console.error('Error logging failed:', error);
  }
}

/**
 * Analytics middleware - wraps API calls with tracking
 */
export async function analyticsMiddleware(c: Context, next: () => Promise<void>) {
  const startTime = Date.now();
  const endpoint = c.req.path;
  const method = c.req.method;
  
  try {
    await next();
    
    const responseTime = Date.now() - startTime;
    const statusCode = c.res?.status || 200;
    
    // Get user ID from session if available
    const sessionCookie = c.req.header('cookie')?.split(';')
      .find((c: string) => c.trim().startsWith('session='))
      ?.split('=')[1];
    
    let userId: number | undefined;
    if (sessionCookie && c.env.DB) {
      const session = await c.env.DB.prepare(`
        SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')
      `).bind(sessionCookie).first();
      userId = session?.user_id;
    }
    
    // Track the API call
    await trackApiCall(c, endpoint, method, statusCode, responseTime, userId);
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const statusCode = c.res?.status || 500;
    
    // Track error
    await trackApiCall(
      c,
      endpoint,
      method,
      statusCode,
      responseTime,
      undefined,
      {
        type: error.name || 'Error',
        message: error.message || 'Unknown error'
      }
    );
    
    // Log error
    await logError(
      c,
      'api',
      error.message || 'Unknown error',
      statusCode >= 500 ? 'critical' : 'high',
      {
        stackTrace: error.stack,
        endpoint,
        method
      }
    );
    
    throw error;
  }
}
