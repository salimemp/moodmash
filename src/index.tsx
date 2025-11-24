import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Bindings, MoodEntry, WellnessActivity, MoodStats, Emotion } from './types';
import { renderHTML, renderLoadingState } from './template';
import * as bcrypt from 'bcryptjs';
import { 
  initOAuthProviders, 
  createSession, 
  getSession, 
  deleteSession, 
  getCurrentUser,
  requireAuth,
  type Session
} from './auth';

// Analytics and Security
import { 
  analyticsMiddleware, 
  trackPageView, 
  trackEvent, 
  logError 
} from './middleware/analytics';
import { HealthMetricsService } from './services/health-metrics';
import { 
  securityMiddleware, 
  rateLimiter, 
  sanitizeInput,
  isValidEmail,
  isStrongPassword
} from './middleware/security';

// Media Processing
import {
  uploadToR2,
  downloadFromR2,
  deleteFromR2,
  generateFileKey,
  detectFileType,
  validateFileUpload,
  saveMediaFile,
  getMediaFile,
  listUserMediaFiles,
  deleteMediaFile,
  type MediaFile
} from './utils/media';

// Secrets Management
import {
  getSecret,
  storeSecret,
  getEnvVar,
  setEnvVar,
  getCloudflareSecret
} from './utils/secrets';

const app = new Hono<{ Bindings: Bindings }>();

// Global Security Middleware (applies to all routes)
app.use('*', securityMiddleware);

// Analytics Middleware (track all API calls)
app.use('/api/*', analyticsMiddleware);

// Performance Tracking Middleware
app.use('/api/*', async (c, next) => {
  const startTime = Date.now();
  const { trackPerformance } = await import('./services/performance-monitoring');

  await next();

  const responseTime = Date.now() - startTime;
  
  // Track in background (don't await)
  trackPerformance(c.env, {
    endpoint: c.req.path,
    method: c.req.method,
    response_time_ms: responseTime,
    status_code: c.res.status,
    timestamp: new Date().toISOString(),
  }).catch(console.error);
});

// Enable CORS for API routes
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// =============================================================================
// OAUTH AUTHENTICATION ROUTES
// =============================================================================

// Google OAuth - Initiate
app.get('/auth/google', async (c) => {
  const { google } = initOAuthProviders(c.env);
  const state = crypto.randomUUID();
  const url = await google.createAuthorizationURL(state, {
    scopes: ['email', 'profile']
  });
  
  // Store state in cookie for CSRF protection
  setCookie(c, 'oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'Lax'
  });
  
  return c.redirect(url.toString());
});

// Google OAuth - Callback
app.get('/auth/google/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'oauth_state');
  
  if (!code || !state || state !== storedState) {
    return c.redirect('/?error=oauth_failed');
  }
  
  try {
    const { google } = initOAuthProviders(c.env);
    const tokens = await google.validateAuthorizationCode(code);
    
    // Fetch user info
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.accessToken}` }
    });
    
    const user = await response.json();
    
    // Create session
    const session: Session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: 'google',
      isPremium: false, // Check database for premium status
      createdAt: Date.now()
    };
    
    const sessionToken = createSession(session);
    
    // Set session cookie
    setCookie(c, 'session_token', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'Lax'
    });
    
    // Clean up state cookie
    deleteCookie(c, 'oauth_state');
    
    return c.redirect('/?login=success');
  } catch (error) {
    console.error('Google OAuth error:', error);
    return c.redirect('/?error=oauth_failed');
  }
});

// GitHub OAuth - Initiate
app.get('/auth/github', async (c) => {
  const { github } = initOAuthProviders(c.env);
  const state = crypto.randomUUID();
  const url = await github.createAuthorizationURL(state, {
    scopes: ['user:email']
  });
  
  setCookie(c, 'oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: true,
    maxAge: 60 * 10,
    sameSite: 'Lax'
  });
  
  return c.redirect(url.toString());
});

// GitHub OAuth - Callback
app.get('/auth/github/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'oauth_state');
  
  if (!code || !state || state !== storedState) {
    return c.redirect('/?error=oauth_failed');
  }
  
  try {
    const { github } = initOAuthProviders(c.env);
    const tokens = await github.validateAuthorizationCode(code);
    
    // Fetch user info
    const response = await fetch('https://api.github.com/user', {
      headers: { 
        Authorization: `Bearer ${tokens.accessToken}`,
        'User-Agent': 'MoodMash'
      }
    });
    
    const user = await response.json();
    
    // Fetch primary email if not public
    let email = user.email;
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: { 
          Authorization: `Bearer ${tokens.accessToken}`,
          'User-Agent': 'MoodMash'
        }
      });
      const emails = await emailResponse.json();
      email = emails.find((e: any) => e.primary)?.email || emails[0]?.email;
    }
    
    const session: Session = {
      userId: user.id.toString(),
      email: email,
      name: user.name || user.login,
      picture: user.avatar_url,
      provider: 'github',
      isPremium: false,
      createdAt: Date.now()
    };
    
    const sessionToken = createSession(session);
    
    setCookie(c, 'session_token', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'Lax'
    });
    
    deleteCookie(c, 'oauth_state');
    
    return c.redirect('/?login=success');
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return c.redirect('/?error=oauth_failed');
  }
});

// Facebook OAuth - Initiate
app.get('/auth/facebook', async (c) => {
  const { facebook } = initOAuthProviders(c.env);
  const state = crypto.randomUUID();
  const url = await facebook.createAuthorizationURL(state, {
    scopes: ['email', 'public_profile']
  });
  
  setCookie(c, 'oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: true,
    maxAge: 60 * 10,
    sameSite: 'Lax'
  });
  
  return c.redirect(url.toString());
});

// Facebook OAuth - Callback
app.get('/auth/facebook/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'oauth_state');
  
  if (!code || !state || state !== storedState) {
    return c.redirect('/?error=oauth_failed');
  }
  
  try {
    const { facebook } = initOAuthProviders(c.env);
    const tokens = await facebook.validateAuthorizationCode(code);
    
    // Fetch user info
    const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokens.accessToken}`);
    const user = await response.json();
    
    const session: Session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture?.data?.url,
      provider: 'facebook',
      isPremium: false,
      createdAt: Date.now()
    };
    
    const sessionToken = createSession(session);
    
    setCookie(c, 'session_token', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'Lax'
    });
    
    deleteCookie(c, 'oauth_state');
    
    return c.redirect('/?login=success');
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return c.redirect('/?error=oauth_failed');
  }
});

// Logout
app.post('/auth/logout', (c) => {
  const token = getCookie(c, 'session_token');
  if (token) {
    deleteSession(token);
  }
  deleteCookie(c, 'session_token');
  return c.json({ success: true });
});

// Get current user
app.get('/api/auth/me', (c) => {
  const user = getCurrentUser(c);
  if (!user) {
    return c.json({ authenticated: false }, 401);
  }
  return c.json({ authenticated: true, user });
});

// =============================================================================
// API ROUTES
// =============================================================================

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all mood entries (with optional filters)
app.get('/api/moods', async (c) => {
  const { DB } = c.env;
  const limit = c.req.query('limit') || '50';
  const emotion = c.req.query('emotion');
  
  try {
    let query = `SELECT * FROM mood_entries WHERE user_id = 1`;
    
    if (emotion) {
      query += ` AND emotion = '${emotion}'`;
    }
    
    query += ` ORDER BY logged_at DESC LIMIT ${limit}`;
    
    const result = await DB.prepare(query).all();
    
    // Parse JSON fields
    const moods = result.results.map((row: any) => ({
      ...row,
      activities: row.activities ? JSON.parse(row.activities) : [],
    }));
    
    return c.json({ moods });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get single mood entry
app.get('/api/moods/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    const result = await DB.prepare(
      'SELECT * FROM mood_entries WHERE id = ? AND user_id = 1'
    ).bind(id).first();
    
    if (!result) {
      return c.json({ error: 'Mood entry not found' }, 404);
    }
    
    const mood: any = {
      ...result,
      activities: result.activities ? JSON.parse(result.activities as string) : [],
    };
    
    return c.json({ mood });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Create new mood entry
app.post('/api/moods', async (c) => {
  const { DB } = c.env;
  
  try {
    const body = await c.req.json<MoodEntry>();
    
    // Validate required fields
    if (!body.emotion || !body.intensity || !body.logged_at) {
      return c.json({ error: 'Missing required fields: emotion, intensity, logged_at' }, 400);
    }
    
    // Validate intensity range
    if (body.intensity < 1 || body.intensity > 5) {
      return c.json({ error: 'Intensity must be between 1 and 5' }, 400);
    }
    
    // Convert activities array to JSON string
    const activitiesJson = body.activities ? JSON.stringify(body.activities) : null;
    
    const result = await DB.prepare(`
      INSERT INTO mood_entries (
        user_id, emotion, intensity, notes, weather, 
        sleep_hours, activities, social_interaction, logged_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      1, // user_id (default for MVP)
      body.emotion,
      body.intensity,
      body.notes || null,
      body.weather || null,
      body.sleep_hours || null,
      activitiesJson,
      body.social_interaction || null,
      body.logged_at
    ).run();
    
    return c.json({ 
      id: result.meta.last_row_id,
      message: 'Mood entry created successfully' 
    }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Update mood entry
app.put('/api/moods/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    const body = await c.req.json<Partial<MoodEntry>>();
    
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    
    if (body.emotion) {
      updates.push('emotion = ?');
      values.push(body.emotion);
    }
    if (body.intensity !== undefined) {
      if (body.intensity < 1 || body.intensity > 5) {
        return c.json({ error: 'Intensity must be between 1 and 5' }, 400);
      }
      updates.push('intensity = ?');
      values.push(body.intensity);
    }
    if (body.notes !== undefined) {
      updates.push('notes = ?');
      values.push(body.notes);
    }
    if (body.weather !== undefined) {
      updates.push('weather = ?');
      values.push(body.weather);
    }
    if (body.sleep_hours !== undefined) {
      updates.push('sleep_hours = ?');
      values.push(body.sleep_hours);
    }
    if (body.activities !== undefined) {
      updates.push('activities = ?');
      values.push(JSON.stringify(body.activities));
    }
    if (body.social_interaction !== undefined) {
      updates.push('social_interaction = ?');
      values.push(body.social_interaction);
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }
    
    values.push(id, 1); // Add id and user_id for WHERE clause
    
    await DB.prepare(`
      UPDATE mood_entries 
      SET ${updates.join(', ')} 
      WHERE id = ? AND user_id = ?
    `).bind(...values).run();
    
    return c.json({ message: 'Mood entry updated successfully' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Delete mood entry
app.delete('/api/moods/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    await DB.prepare(
      'DELETE FROM mood_entries WHERE id = ? AND user_id = 1'
    ).bind(id).run();
    
    return c.json({ message: 'Mood entry deleted successfully' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// BULK MOOD OPERATIONS (v10.0) - Phase 3
// ============================================================================

// Bulk update moods
app.put('/api/moods/bulk', async (c) => {
  const { DB } = c.env;
  
  try {
    const { ids, updates } = await c.req.json<{ ids: number[], updates: Partial<MoodEntry> }>();
    
    if (!ids || ids.length === 0) {
      return c.json({ error: 'No mood IDs provided' }, 400);
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      return c.json({ error: 'No updates provided' }, 400);
    }
    
    // Validate intensity if provided
    if (updates.intensity !== undefined && (updates.intensity < 1 || updates.intensity > 5)) {
      return c.json({ error: 'Intensity must be between 1 and 5' }, 400);
    }
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    
    if (updates.emotion) {
      updateFields.push('emotion = ?');
      values.push(updates.emotion);
    }
    if (updates.intensity !== undefined) {
      updateFields.push('intensity = ?');
      values.push(updates.intensity);
    }
    if (updates.notes !== undefined) {
      updateFields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.weather !== undefined) {
      updateFields.push('weather = ?');
      values.push(updates.weather);
    }
    if (updates.sleep_hours !== undefined) {
      updateFields.push('sleep_hours = ?');
      values.push(updates.sleep_hours);
    }
    if (updates.activities !== undefined) {
      updateFields.push('activities = ?');
      values.push(JSON.stringify(updates.activities));
    }
    if (updates.social_interaction !== undefined) {
      updateFields.push('social_interaction = ?');
      values.push(updates.social_interaction);
    }
    
    if (updateFields.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }
    
    // Update all moods in a batch
    const placeholders = ids.map(() => '?').join(',');
    const query = `
      UPDATE mood_entries 
      SET ${updateFields.join(', ')} 
      WHERE id IN (${placeholders}) AND user_id = ?
    `;
    
    await DB.prepare(query).bind(...values, ...ids, 1).run();
    
    return c.json({ 
      message: `${ids.length} mood entries updated successfully`,
      updated_count: ids.length
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Bulk delete moods
app.delete('/api/moods/bulk', async (c) => {
  const { DB } = c.env;
  
  try {
    const { ids } = await c.req.json<{ ids: number[] }>();
    
    if (!ids || ids.length === 0) {
      return c.json({ error: 'No mood IDs provided' }, 400);
    }
    
    const placeholders = ids.map(() => '?').join(',');
    const result = await DB.prepare(`
      DELETE FROM mood_entries 
      WHERE id IN (${placeholders}) AND user_id = ?
    `).bind(...ids, 1).run();
    
    return c.json({ 
      message: `${ids.length} mood entries deleted successfully`,
      deleted_count: ids.length
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// MOOD STATISTICS
// ============================================================================

// Get mood statistics
app.get('/api/stats', async (c) => {
  const { DB } = c.env;
  const days = parseInt(c.req.query('days') || '30');
  
  try {
    // Get mood distribution
    const distribution = await DB.prepare(`
      SELECT emotion, COUNT(*) as count, AVG(intensity) as avg_intensity
      FROM mood_entries
      WHERE user_id = 1 
        AND logged_at >= datetime('now', '-${days} days')
      GROUP BY emotion
      ORDER BY count DESC
    `).all();
    
    // Get total entries
    const total = await DB.prepare(`
      SELECT COUNT(*) as count 
      FROM mood_entries 
      WHERE user_id = 1 
        AND logged_at >= datetime('now', '-${days} days')
    `).first();
    
    // Get average intensity
    const avgIntensity = await DB.prepare(`
      SELECT AVG(intensity) as avg 
      FROM mood_entries 
      WHERE user_id = 1 
        AND logged_at >= datetime('now', '-${days} days')
    `).first();
    
    // Calculate mood distribution
    const moodDistribution: Record<string, number> = {};
    distribution.results.forEach((row: any) => {
      moodDistribution[row.emotion] = row.count;
    });
    
    // Determine most common emotion
    const mostCommon = distribution.results.length > 0 
      ? (distribution.results[0] as any).emotion 
      : 'neutral';
    
    // Calculate trend (comparing first half vs second half)
    const midpoint = Math.floor(days / 2);
    const recentAvg = await DB.prepare(`
      SELECT AVG(intensity) as avg 
      FROM mood_entries 
      WHERE user_id = 1 
        AND logged_at >= datetime('now', '-${midpoint} days')
    `).first();
    
    const olderAvg = await DB.prepare(`
      SELECT AVG(intensity) as avg 
      FROM mood_entries 
      WHERE user_id = 1 
        AND logged_at >= datetime('now', '-${days} days')
        AND logged_at < datetime('now', '-${midpoint} days')
    `).first();
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAvg && olderAvg) {
      const diff = (recentAvg.avg as number) - (olderAvg.avg as number);
      if (diff > 0.3) trend = 'improving';
      else if (diff < -0.3) trend = 'declining';
    }
    
    // Generate insights
    const insights: string[] = [];
    if (trend === 'improving') {
      insights.push('Your mood has been improving recently! Keep up the good work.');
    } else if (trend === 'declining') {
      insights.push('Your mood seems to be declining. Consider trying some wellness activities.');
    }
    
    if (moodDistribution['anxious'] && moodDistribution['anxious'] > (total?.count as number || 0) * 0.3) {
      insights.push('You\'ve been experiencing anxiety frequently. Meditation might help.');
    }
    
    if (moodDistribution['tired'] && moodDistribution['tired'] > (total?.count as number || 0) * 0.3) {
      insights.push('Fatigue is common in your recent entries. Focus on sleep quality.');
    }
    
    if (!insights.length) {
      insights.push('Your mood is relatively balanced. Continue your current habits!');
    }
    
    const stats: MoodStats = {
      total_entries: (total?.count as number) || 0,
      most_common_emotion: mostCommon as Emotion,
      average_intensity: Math.round((avgIntensity?.avg as number || 0) * 10) / 10,
      mood_distribution: moodDistribution,
      recent_trend: trend,
      insights
    };
    
    return c.json({ stats });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get wellness activities (optionally filtered by target emotion)
app.get('/api/activities', async (c) => {
  const { DB } = c.env;
  const emotion = c.req.query('emotion');
  
  try {
    let query = 'SELECT * FROM wellness_activities';
    
    if (emotion) {
      query += ` WHERE target_emotions LIKE '%"${emotion}"%'`;
    }
    
    query += ' ORDER BY duration_minutes ASC';
    
    const result = await DB.prepare(query).all();
    
    // Parse JSON fields
    const activities = result.results.map((row: any) => ({
      ...row,
      target_emotions: JSON.parse(row.target_emotions),
    }));
    
    return c.json({ activities });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Log activity completion
app.post('/api/activities/:id/log', async (c) => {
  const { DB } = c.env;
  const activityId = c.req.param('id');
  
  try {
    const body = await c.req.json<{ 
      completed: boolean; 
      rating?: number; 
      feedback?: string;
      mood_entry_id?: number;
    }>();
    
    await DB.prepare(`
      INSERT INTO activity_log (user_id, activity_id, mood_entry_id, completed, rating, feedback)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      1,
      activityId,
      body.mood_entry_id || null,
      body.completed ? 1 : 0,
      body.rating || null,
      body.feedback || null
    ).run();
    
    return c.json({ message: 'Activity logged successfully' }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// NEW FEATURES API ENDPOINTS
// =============================================================================

// Express Your Mood - Create mood with extended fields
app.post('/api/moods/express', async (c) => {
  const { DB } = c.env;
  
  try {
    const body = await c.req.json<{
      emotion: string;
      intensity: number;
      notes?: string;
      privacy?: string;
      tags?: string[];
      color_value?: string;
      text_entry?: string;
      voice_note_url?: string;
      entry_mode?: string;
      logged_at: string;
    }>();
    
    // Validate required fields
    if (!body.emotion || !body.intensity || !body.logged_at) {
      return c.json({ error: 'Missing required fields: emotion, intensity, logged_at' }, 400);
    }
    
    // Validate intensity range
    if (body.intensity < 1 || body.intensity > 5) {
      return c.json({ error: 'Intensity must be between 1 and 5' }, 400);
    }
    
    // Validate privacy
    if (body.privacy && !['private', 'friends', 'public'].includes(body.privacy)) {
      return c.json({ error: 'Privacy must be private, friends, or public' }, 400);
    }
    
    const tagsJson = body.tags ? JSON.stringify(body.tags) : null;
    
    const result = await DB.prepare(`
      INSERT INTO mood_entries (
        user_id, emotion, intensity, notes, logged_at,
        privacy, tags, color_value, text_entry, voice_note_url, entry_mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      1,
      body.emotion,
      body.intensity,
      body.notes || null,
      body.logged_at,
      body.privacy || 'private',
      tagsJson,
      body.color_value || null,
      body.text_entry || null,
      body.voice_note_url || null,
      body.entry_mode || 'express'
    ).run();
    
    return c.json({ 
      id: result.meta.last_row_id,
      message: 'Mood entry created successfully via Express mode' 
    }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Quick Select - Fast mood logging
app.post('/api/moods/quick', async (c) => {
  const { DB } = c.env;
  
  try {
    const body = await c.req.json<{
      emotion: string;
      intensity?: number;
      logged_at?: string;
    }>();
    
    if (!body.emotion) {
      return c.json({ error: 'Missing required field: emotion' }, 400);
    }
    
    const intensity = body.intensity || 3; // Default to medium
    const loggedAt = body.logged_at || new Date().toISOString();
    
    // Insert mood entry
    const result = await DB.prepare(`
      INSERT INTO mood_entries (
        user_id, emotion, intensity, logged_at, entry_mode
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(1, body.emotion, intensity, loggedAt, 'quick').run();
    
    // Update quick select history
    await DB.prepare(`
      INSERT INTO quick_select_history (user_id, emotion, last_used_at, use_count)
      VALUES (?, ?, CURRENT_TIMESTAMP, 1)
      ON CONFLICT(user_id, emotion) 
      DO UPDATE SET 
        last_used_at = CURRENT_TIMESTAMP,
        use_count = use_count + 1
    `).bind(1, body.emotion).run();
    
    return c.json({ 
      id: result.meta.last_row_id,
      message: 'Quick mood logged successfully' 
    }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get quick select history (recently used emojis)
app.get('/api/quick-select/history', async (c) => {
  const { DB } = c.env;
  
  try {
    const result = await DB.prepare(`
      SELECT emotion, use_count, last_used_at
      FROM quick_select_history
      WHERE user_id = 1
      ORDER BY last_used_at DESC
      LIMIT 6
    `).all();
    
    return c.json({ history: result.results });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get mood insights with caching
app.get('/api/insights', async (c) => {
  const { DB } = c.env;
  const periodType = c.req.query('period') || 'weekly'; // daily, weekly, monthly
  const days = periodType === 'daily' ? 1 : periodType === 'weekly' ? 7 : 30;
  
  try {
    // Check cache first
    const cached = await DB.prepare(`
      SELECT * FROM mood_insights_cache
      WHERE user_id = 1 
        AND period_type = ?
        AND calculated_at >= datetime('now', '-1 hour')
      ORDER BY calculated_at DESC
      LIMIT 1
    `).bind(periodType).first();
    
    if (cached) {
      return c.json({
        insights: {
          dominant_mood: cached.dominant_mood,
          mood_stability_score: cached.mood_stability_score,
          average_intensity: cached.average_intensity,
          total_entries: cached.total_entries,
          mood_distribution: JSON.parse(cached.mood_distribution as string),
          timeline_data: JSON.parse(cached.timeline_data as string),
        },
        cached: true
      });
    }
    
    // Calculate fresh insights
    // Get mood distribution
    const distribution = await DB.prepare(`
      SELECT emotion, COUNT(*) as count, AVG(intensity) as avg_intensity
      FROM mood_entries
      WHERE user_id = 1 
        AND logged_at >= datetime('now', '-${days} days')
      GROUP BY emotion
      ORDER BY count DESC
    `).all();
    
    // Get timeline data (grouped by day)
    const timeline = await DB.prepare(`
      SELECT 
        DATE(logged_at) as date,
        emotion,
        AVG(intensity) as avg_intensity,
        COUNT(*) as count
      FROM mood_entries
      WHERE user_id = 1 
        AND logged_at >= datetime('now', '-${days} days')
      GROUP BY DATE(logged_at), emotion
      ORDER BY date DESC
    `).all();
    
    // Calculate mood stability (standard deviation of intensity)
    const allIntensities = await DB.prepare(`
      SELECT intensity
      FROM mood_entries
      WHERE user_id = 1 
        AND logged_at >= datetime('now', '-${days} days')
    `).all();
    
    let stabilityScore = 1.0;
    if (allIntensities.results.length > 1) {
      const intensities = allIntensities.results.map((r: any) => r.intensity);
      const mean = intensities.reduce((a: number, b: number) => a + b, 0) / intensities.length;
      const variance = intensities.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / intensities.length;
      const stdDev = Math.sqrt(variance);
      stabilityScore = Math.max(0, 1 - (stdDev / 5)); // Normalize to 0-1
    }
    
    // Build mood distribution object
    const moodDistribution: Record<string, number> = {};
    distribution.results.forEach((row: any) => {
      moodDistribution[row.emotion] = row.count;
    });
    
    // Determine dominant mood
    const dominantMood = distribution.results.length > 0 
      ? (distribution.results[0] as any).emotion 
      : 'neutral';
    
    // Get total and average
    const total = allIntensities.results.length;
    const avgIntensity = allIntensities.results.length > 0
      ? allIntensities.results.reduce((a: number, r: any) => a + r.intensity, 0) / total
      : 0;
    
    const insights = {
      dominant_mood: dominantMood,
      mood_stability_score: Math.round(stabilityScore * 100) / 100,
      average_intensity: Math.round(avgIntensity * 10) / 10,
      total_entries: total,
      mood_distribution: moodDistribution,
      timeline_data: timeline.results,
    };
    
    // Cache the results
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - days);
    const periodEnd = new Date();
    
    await DB.prepare(`
      INSERT INTO mood_insights_cache (
        user_id, period_type, period_start, period_end,
        dominant_mood, mood_stability_score, average_intensity, total_entries,
        mood_distribution, timeline_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      1,
      periodType,
      periodStart.toISOString().split('T')[0],
      periodEnd.toISOString().split('T')[0],
      insights.dominant_mood,
      insights.mood_stability_score,
      insights.average_intensity,
      insights.total_entries,
      JSON.stringify(insights.mood_distribution),
      JSON.stringify(insights.timeline_data)
    ).run();
    
    return c.json({ insights, cached: false });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// AI WELLNESS TIPS & GAMIFICATION & COLOR PSYCHOLOGY APIS
// =============================================================================

// Generate AI Wellness Tips
app.post('/api/wellness-tips/generate', async (c) => {
  const { DB } = c.env;
  
  try {
    const body = await c.req.json<{
      mood: string;
      categories: string[];
    }>();
    
    // In production, integrate with OpenAI API
    // For now, return curated tips based on mood and category
    const tips = generateMockTips(body.mood, body.categories);
    
    // Store tips in database
    for (const tip of tips) {
      await DB.prepare(`
        INSERT INTO ai_wellness_tips (user_id, tip_text, category, mood_context, ai_model)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        1,
        tip.tip_text,
        tip.category,
        JSON.stringify({ mood: body.mood }),
        'mock-ai'
      ).run();
    }
    
    return c.json({ tips });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Rate wellness tip
app.post('/api/wellness-tips/:id/rate', async (c) => {
  const { DB } = c.env;
  const tipId = c.req.param('id');
  
  try {
    const body = await c.req.json<{ is_helpful: boolean }>();
    
    await DB.prepare(`
      UPDATE ai_wellness_tips 
      SET is_helpful = ?, rated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(body.is_helpful ? 1 : 0, tipId).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get challenges and user progress
app.get('/api/challenges', async (c) => {
  const { DB } = c.env;
  
  try {
    // Get active challenges
    const challenges = await DB.prepare(`
      SELECT * FROM challenges 
      WHERE is_active = TRUE
      ORDER BY difficulty, challenge_type
    `).all();
    
    // Get user progress for all challenges
    const progress = await DB.prepare(`
      SELECT challenge_id, current_value, goal_value, is_completed, completion_percentage
      FROM user_challenge_progress
      WHERE user_id = 1
    `).all();
    
    // Convert progress array to object keyed by challenge_id
    const progressMap: Record<number, any> = {};
    for (const p of progress.results) {
      progressMap[(p as any).challenge_id] = p;
    }
    
    return c.json({ 
      challenges: challenges.results,
      progress: progressMap
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get user achievements
app.get('/api/achievements', async (c) => {
  const { DB } = c.env;
  
  try {
    const achievements = await DB.prepare(`
      SELECT * FROM achievements
      WHERE user_id = 1
      ORDER BY unlocked_at DESC
    `).all();
    
    return c.json({ achievements: achievements.results });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get user gamification stats
app.get('/api/gamification', async (c) => {
  const { DB } = c.env;
  
  try {
    const gamification = await DB.prepare(`
      SELECT * FROM user_gamification
      WHERE user_id = 1
    `).first();
    
    return c.json({ gamification: gamification || {} });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get color psychology data
app.get('/api/color-psychology', async (c) => {
  const { DB } = c.env;
  
  try {
    const colors = await DB.prepare(`
      SELECT * FROM color_psychology
      ORDER BY color_name
    `).all();
    
    return c.json({ colors: colors.results });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Track color usage
app.post('/api/color-psychology/track', async (c) => {
  const { DB } = c.env;
  
  try {
    const body = await c.req.json<{ color_code: string }>();
    
    // Get current mood for context
    const latestMood = await DB.prepare(`
      SELECT emotion FROM mood_entries
      WHERE user_id = 1
      ORDER BY logged_at DESC
      LIMIT 1
    `).first();
    
    // Update or insert color preference
    await DB.prepare(`
      INSERT INTO user_color_preferences (user_id, color_code, use_count, mood_when_selected)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(user_id, color_code) 
      DO UPDATE SET 
        use_count = use_count + 1,
        last_used_at = CURRENT_TIMESTAMP,
        mood_when_selected = excluded.mood_when_selected
    `).bind(1, body.color_code, (latestMood as any)?.emotion || null).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Helper function to generate mock tips
function generateMockTips(mood: string, categories: string[]): any[] {
  const tips: any[] = [];
  
  const tipsMap: Record<string, Record<string, string>> = {
    mindfulness: {
      anxious: 'Try a 5-minute breathing exercise. Focus on slow, deep breaths to calm your nervous system.',
      stressed: 'Practice mindful meditation for 10 minutes. Find a quiet space and focus on the present moment.',
      sad: 'Try loving-kindness meditation. Direct compassionate thoughts toward yourself and others.',
      tired: 'Take a mindful rest break. Close your eyes and scan your body for areas of tension.',
      default: 'Practice mindfulness by observing your thoughts without judgment for 5 minutes.'
    },
    exercise: {
      energetic: 'Go for a 30-minute run or high-intensity workout to channel your energy positively.',
      tired: 'Try gentle yoga or stretching. Even 10 minutes can boost your energy levels.',
      stressed: 'Take a brisk 20-minute walk outdoors. Physical movement helps reduce stress hormones.',
      angry: 'Try boxing or kickboxing. Physical exercise is a healthy way to release anger.',
      default: 'Engage in 30 minutes of moderate exercise to boost your mood and energy.'
    },
    sleep: {
      tired: 'Prioritize 7-9 hours of sleep tonight. Create a calming bedtime routine.',
      stressed: 'Try the 4-7-8 breathing technique before bed to promote relaxation.',
      anxious: 'Avoid screens 1 hour before bed. Blue light can interfere with sleep quality.',
      default: 'Maintain a consistent sleep schedule. Go to bed and wake up at the same time daily.'
    },
    nutrition: {
      energetic: 'Fuel your energy with complex carbs and protein. Try oatmeal with nuts.',
      tired: 'Stay hydrated and eat iron-rich foods. Consider a spinach and berry smoothie.',
      stressed: 'Try omega-3 rich foods like salmon or walnuts to support brain health.',
      default: 'Eat a balanced diet with plenty of fruits, vegetables, and whole grains.'
    },
    social: {
      sad: 'Reach out to a friend or loved one. Social connection can significantly improve mood.',
      alone: 'Consider joining a community group or class to meet like-minded people.',
      stressed: 'Talk to someone you trust about what\'s bothering you. Sharing helps.',
      default: 'Spend quality time with supportive people. Social bonds are vital for wellbeing.'
    }
  };
  
  for (const category of categories) {
    const categoryTips = tipsMap[category];
    if (categoryTips) {
      const tipText = categoryTips[mood] || categoryTips.default;
      tips.push({
        id: Math.floor(Math.random() * 10000),
        category,
        tip_text: tipText
      });
    }
  }
  
  return tips;
}

// =============================================================================
// AUTHENTICATION APIS
// =============================================================================

// Check current session
app.get('/api/auth/me', async (c) => {
  const { DB } = c.env;
  
  try {
    // Get session token from cookie or header
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '') || 
                        c.req.cookie('session_token');
    
    if (!sessionToken) {
      return c.json({ error: 'Not authenticated' }, 401);
    }
    
    // Validate session
    const session = await DB.prepare(`
      SELECT s.*, u.id, u.username, u.email, u.name, u.avatar_url
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
    `).bind(sessionToken).first();
    
    if (!session) {
      return c.json({ error: 'Invalid or expired session' }, 401);
    }
    
    // Update last activity
    await DB.prepare(`
      UPDATE sessions SET last_activity_at = datetime('now') WHERE id = ?
    `).bind(session.id).run();
    
    return c.json({
      id: session.user_id,
      username: session.username,
      email: session.email,
      name: session.name,
      avatar_url: session.avatar_url
    });
  } catch (error) {
    console.error('Session check error:', error);
    return c.json({ error: 'Session check failed' }, 500);
  }
});

// Register new user
app.post('/api/auth/register', async (c) => {
  const { DB } = c.env;
  
  try {
    const { username, email, password } = await c.req.json();
    
    // Validate input
    if (!username || !email || !password) {
      return c.json({ error: 'All fields are required' }, 400);
    }
    
    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }
    
    // Check if username or email already exists
    const existingUser = await DB.prepare(`
      SELECT id FROM users WHERE username = ? OR email = ?
    `).bind(username, email).first();
    
    if (existingUser) {
      return c.json({ error: 'Username or email already exists' }, 409);
    }
    
    // Hash password with bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = await DB.prepare(`
      INSERT INTO users (username, email, password_hash, is_verified, is_active)
      VALUES (?, ?, ?, 0, 1)
    `).bind(username, email, passwordHash).run();
    
    const userId = result.meta.last_row_id;
    
    // Create session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await DB.prepare(`
      INSERT INTO sessions (user_id, session_token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      userId,
      sessionToken,
      expiresAt.toISOString(),
      c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      c.req.header('User-Agent') || 'unknown'
    ).run();
    
    // Log security event
    await DB.prepare(`
      INSERT INTO security_audit_log (user_id, event_type, event_details, ip_address, success)
      VALUES (?, 'register', ?, ?, 1)
    `).bind(
      userId,
      JSON.stringify({ username, email }),
      c.req.header('CF-Connecting-IP') || 'unknown'
    ).run();
    
    // Set session cookie
    c.header('Set-Cookie', `session_token=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}`);
    
    return c.json({
      success: true,
      user: { id: userId, username, email },
      sessionToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Login user
app.post('/api/auth/login', async (c) => {
  const { DB } = c.env;
  
  try {
    const { username, password, trustDevice } = await c.req.json();
    
    if (!username || !password) {
      return c.json({ error: 'Username and password required' }, 400);
    }
    
    // Find user
    const user = await DB.prepare(`
      SELECT * FROM users 
      WHERE (username = ? OR email = ?) AND is_active = 1
    `).bind(username, username).first();
    
    if (!user) {
      // Log failed attempt
      await DB.prepare(`
        INSERT INTO security_audit_log (event_type, event_details, ip_address, success)
        VALUES ('login_failed', ?, ?, 0)
      `).bind(
        JSON.stringify({ username }),
        c.req.header('CF-Connecting-IP') || 'unknown'
      ).run();
      
      return c.json({ error: 'Invalid username or password' }, 401);
    }
    
    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await DB.prepare(`
        UPDATE users SET failed_login_attempts = failed_login_attempts + 1
        WHERE id = ?
      `).bind(user.id).run();
      
      return c.json({ error: 'Invalid username or password' }, 401);
    }
    
    // Reset failed attempts
    await DB.prepare(`
      UPDATE users 
      SET failed_login_attempts = 0, last_login_at = datetime('now'), login_count = login_count + 1
      WHERE id = ?
    `).bind(user.id).run();
    
    // Create session
    const sessionToken = crypto.randomUUID();
    const expiresAt = trustDevice 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    
    await DB.prepare(`
      INSERT INTO sessions (user_id, session_token, is_trusted, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      sessionToken,
      trustDevice ? 1 : 0,
      expiresAt.toISOString(),
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent') || 'unknown'
    ).run();
    
    // Log security event
    await DB.prepare(`
      INSERT INTO security_audit_log (user_id, event_type, event_details, ip_address, success)
      VALUES (?, 'login', ?, ?, 1)
    `).bind(
      user.id,
      JSON.stringify({ trusted: trustDevice }),
      c.req.header('CF-Connecting-IP') || 'unknown'
    ).run();
    
    // Set session cookie
    const maxAge = trustDevice ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
    c.header('Set-Cookie', `session_token=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`);
    
    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url
      },
      sessionToken
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Logout
app.post('/api/auth/logout', async (c) => {
  const { DB } = c.env;
  
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '') || 
                        c.req.cookie('session_token');
    
    if (sessionToken) {
      await DB.prepare(`
        DELETE FROM sessions WHERE session_token = ?
      `).bind(sessionToken).run();
    }
    
    c.header('Set-Cookie', 'session_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

// OAuth redirect endpoints (placeholders)
app.get('/api/auth/oauth/:provider', async (c) => {
  const provider = c.req.param('provider');
  
  // In production, implement proper OAuth flow
  return c.json({ 
    error: 'OAuth not yet configured',
    message: `Please configure ${provider} OAuth credentials`,
    provider 
  }, 501);
});

// WebAuthn challenge endpoint (placeholder)
app.get('/api/auth/webauthn/login/challenge', async (c) => {
  return c.json({ 
    error: 'WebAuthn not yet configured',
    message: 'Please configure WebAuthn/Passkeys'
  }, 501);
});

// WebAuthn verify endpoint (placeholder)
app.post('/api/auth/webauthn/login/verify', async (c) => {
  return c.json({ 
    error: 'WebAuthn not yet configured',
    message: 'Please configure WebAuthn/Passkeys'
  }, 501);
});

// Password reset request
app.post('/api/auth/password-reset/request', async (c) => {
  const { DB } = c.env;
  
  try {
    const { email } = await c.req.json();
    
    const user = await DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(email).first();
    
    if (user) {
      const resetToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await DB.prepare(`
        INSERT INTO password_resets (user_id, reset_token, expires_at)
        VALUES (?, ?, ?)
      `).bind(user.id, resetToken, expiresAt.toISOString()).run();
      
      // In production, send email with reset link
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }
    
    // Always return success to prevent email enumeration
    return c.json({ success: true, message: 'If that email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    return c.json({ error: 'Password reset failed' }, 500);
  }
});

// =============================================================================
// MAGIC LINK AUTHENTICATION
// =============================================================================

// Request magic link (passwordless login)
app.post('/api/auth/magic-link/request', async (c) => {
  const { DB } = c.env;
  
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Check if user exists, if not create account
    let user = await DB.prepare(`
      SELECT id, email, username FROM users WHERE email = ?
    `).bind(email).first();

    if (!user) {
      // Create new user account (magic link registration)
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      const result = await DB.prepare(`
        INSERT INTO users (username, email, is_verified, is_active)
        VALUES (?, ?, 1, 1)
      `).bind(username, email).run();
      
      user = {
        id: result.meta.last_row_id,
        email,
        username
      };

      // Log registration event
      await DB.prepare(`
        INSERT INTO security_audit_log (user_id, event_type, event_details, ip_address, success)
        VALUES (?, 'magic_link_register', ?, ?, 1)
      `).bind(
        user.id,
        JSON.stringify({ email }),
        c.req.header('CF-Connecting-IP') || 'unknown'
      ).run();
    }

    // Generate magic link token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store magic link
    await DB.prepare(`
      INSERT INTO magic_links (user_id, email, token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      email,
      token,
      expiresAt.toISOString(),
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent') || 'unknown'
    ).run();

    // In production, send email with magic link
    const magicLink = `https://f4c6804f.moodmash.pages.dev/auth/magic?token=${token}`;
    console.log(`Magic link for ${email}: ${magicLink}`);
    console.log(`Token: ${token}`);

    // Log magic link request
    await DB.prepare(`
      INSERT INTO security_audit_log (user_id, event_type, event_details, ip_address, success)
      VALUES (?, 'magic_link_request', ?, ?, 1)
    `).bind(
      user.id,
      JSON.stringify({ email }),
      c.req.header('CF-Connecting-IP') || 'unknown'
    ).run();

    return c.json({ 
      success: true, 
      message: 'Magic link sent to your email',
      // Development only - remove in production
      debug: {
        token,
        link: magicLink,
        expires_in_minutes: 15
      }
    });
  } catch (error) {
    console.error('Magic link request error:', error);
    return c.json({ error: 'Failed to send magic link' }, 500);
  }
});

// Verify magic link and create session
app.get('/api/auth/magic-link/verify', async (c) => {
  const { DB } = c.env;
  
  try {
    const token = c.req.query('token');
    
    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    // Find magic link
    const magicLink = await DB.prepare(`
      SELECT ml.*, u.id as user_id, u.username, u.email, u.name, u.avatar_url
      FROM magic_links ml
      JOIN users u ON ml.user_id = u.id
      WHERE ml.token = ? AND ml.used_at IS NULL
    `).bind(token).first();

    if (!magicLink) {
      return c.json({ error: 'Invalid or already used magic link' }, 401);
    }

    // Check if expired
    const expiresAt = new Date(magicLink.expires_at);
    if (expiresAt < new Date()) {
      return c.json({ error: 'Magic link has expired' }, 401);
    }

    // Mark magic link as used
    await DB.prepare(`
      UPDATE magic_links SET used_at = datetime('now') WHERE id = ?
    `).bind(magicLink.id).run();

    // Create session
    const sessionToken = crypto.randomUUID();
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await DB.prepare(`
      INSERT INTO sessions (user_id, session_token, is_trusted, expires_at, ip_address, user_agent)
      VALUES (?, ?, 1, ?, ?, ?)
    `).bind(
      magicLink.user_id,
      sessionToken,
      sessionExpiresAt.toISOString(),
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent') || 'unknown'
    ).run();

    // Log successful magic link login
    await DB.prepare(`
      INSERT INTO security_audit_log (user_id, event_type, event_details, ip_address, success)
      VALUES (?, 'magic_link_login', ?, ?, 1)
    `).bind(
      magicLink.user_id,
      JSON.stringify({ email: magicLink.email }),
      c.req.header('CF-Connecting-IP') || 'unknown'
    ).run();

    // Set session cookie
    c.header('Set-Cookie', `session_token=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}`);

    return c.json({
      success: true,
      user: {
        id: magicLink.user_id,
        username: magicLink.username,
        email: magicLink.email,
        name: magicLink.name,
        avatar_url: magicLink.avatar_url
      },
      sessionToken
    });
  } catch (error) {
    console.error('Magic link verification error:', error);
    return c.json({ error: 'Failed to verify magic link' }, 500);
  }
});

// =============================================================================
// API TOKEN MANAGEMENT
// =============================================================================

// Create user API token
app.post('/api/tokens/user', async (c) => {
  const { DB } = c.env;
  
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '') || 
                        c.req.cookie('session_token');
    
    // Verify session
    const session = await DB.prepare(`
      SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')
    `).bind(sessionToken).first();
    
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name, description, permissions, scopes, expires_in_days } = await c.req.json();

    // Generate token
    const token = `moodmash_user_${crypto.randomUUID().replace(/-/g, '')}`;
    const tokenHash = await bcrypt.hash(token, 10);

    // Calculate expiration
    const expiresAt = expires_in_days 
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000)
      : null;

    // Insert token
    const result = await DB.prepare(`
      INSERT INTO user_api_tokens (
        user_id, name, description, token, token_hash, 
        permissions, scopes, expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      session.user_id,
      name || 'Personal Access Token',
      description || '',
      token,
      tokenHash,
      JSON.stringify(permissions || ['read', 'write']),
      JSON.stringify(scopes || ['moods', 'activities', 'profile']),
      expiresAt ? expiresAt.toISOString() : null
    ).run();

    return c.json({
      success: true,
      token_id: result.meta.last_row_id,
      token, // Only shown once!
      name,
      permissions,
      scopes,
      expires_at: expiresAt
    });
  } catch (error) {
    console.error('Create token error:', error);
    return c.json({ error: 'Failed to create token' }, 500);
  }
});

// List user's API tokens (without showing actual tokens)
app.get('/api/tokens/user', async (c) => {
  const { DB } = c.env;
  
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '') || 
                        c.req.cookie('session_token');
    
    const session = await DB.prepare(`
      SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')
    `).bind(sessionToken).first();
    
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const tokens = await DB.prepare(`
      SELECT id, name, description, permissions, scopes, is_active, 
             last_used_at, usage_count, expires_at, created_at
      FROM user_api_tokens
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(session.user_id).all();

    return c.json({ tokens: tokens.results });
  } catch (error) {
    console.error('List tokens error:', error);
    return c.json({ error: 'Failed to list tokens' }, 500);
  }
});

// Revoke user API token
app.delete('/api/tokens/user/:id', async (c) => {
  const { DB } = c.env;
  
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '') || 
                        c.req.cookie('session_token');
    
    const session = await DB.prepare(`
      SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')
    `).bind(sessionToken).first();
    
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const tokenId = c.req.param('id');

    await DB.prepare(`
      DELETE FROM user_api_tokens WHERE id = ? AND user_id = ?
    `).bind(tokenId, session.user_id).run();

    return c.json({ success: true, message: 'Token revoked' });
  } catch (error) {
    console.error('Revoke token error:', error);
    return c.json({ error: 'Failed to revoke token' }, 500);
  }
});

// =============================================================================
// R2 FILE STORAGE APIs
// =============================================================================

// Upload file to R2
app.post('/api/files/upload', async (c) => {
  const { DB, R2 } = c.env;
  
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '') || 
                        c.req.cookie('session_token');
    
    const session = await DB.prepare(`
      SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')
    `).bind(sessionToken).first();
    
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get form data
    const formData = await c.req.formData();
    const file = formData.get('file');
    const fileType = formData.get('type') || 'document';
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Generate unique file key
    const timestamp = Date.now();
    const randomStr = crypto.randomUUID().substring(0, 8);
    const fileExtension = file.name.split('.').pop();
    const fileKey = `${session.user_id}/${timestamp}-${randomStr}.${fileExtension}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await R2.put(fileKey, arrayBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    });

    // Record in database
    const result = await DB.prepare(`
      INSERT INTO file_uploads (
        user_id, filename, original_filename, file_key, 
        file_size, mime_type, file_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      session.user_id,
      fileKey,
      file.name,
      fileKey,
      arrayBuffer.byteLength,
      file.type,
      fileType
    ).run();

    return c.json({
      success: true,
      file_id: result.meta.last_row_id,
      file_key: fileKey,
      filename: file.name,
      size: arrayBuffer.byteLength,
      mime_type: file.type,
      access_url: `/api/files/${fileKey}`
    });
  } catch (error) {
    console.error('File upload error:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// Download file from R2
app.get('/api/files/:key{.+}', async (c) => {
  const { DB, R2 } = c.env;
  
  try {
    const fileKey = c.req.param('key');
    
    // Get file metadata from database
    const file = await DB.prepare(`
      SELECT * FROM file_uploads WHERE file_key = ? AND deleted_at IS NULL
    `).bind(fileKey).first();

    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Get file from R2
    const object = await R2.get(fileKey);
    
    if (!object) {
      return c.json({ error: 'File not found in storage' }, 404);
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || file.mime_type,
        'Content-Length': object.size.toString(),
        'Content-Disposition': `inline; filename="${file.original_filename}"`,
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch (error) {
    console.error('File download error:', error);
    return c.json({ error: 'Failed to download file' }, 500);
  }
});

// List user's uploaded files
app.get('/api/files', async (c) => {
  const { DB } = c.env;
  
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '') || 
                        c.req.cookie('session_token');
    
    const session = await DB.prepare(`
      SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')
    `).bind(sessionToken).first();
    
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const files = await DB.prepare(`
      SELECT id, filename, original_filename, file_key, file_size, 
             mime_type, file_type, uploaded_at
      FROM file_uploads
      WHERE user_id = ? AND deleted_at IS NULL
      ORDER BY uploaded_at DESC
      LIMIT 100
    `).bind(session.user_id).all();

    return c.json({ 
      files: files.results.map(f => ({
        ...f,
        access_url: `/api/files/${f.file_key}`
      }))
    });
  } catch (error) {
    console.error('List files error:', error);
    return c.json({ error: 'Failed to list files' }, 500);
  }
});

// Delete file
app.delete('/api/files/:id', async (c) => {
  const { DB, R2 } = c.env;
  
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '') || 
                        c.req.cookie('session_token');
    
    const session = await DB.prepare(`
      SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')
    `).bind(sessionToken).first();
    
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const fileId = c.req.param('id');

    // Get file info
    const file = await DB.prepare(`
      SELECT file_key FROM file_uploads WHERE id = ? AND user_id = ?
    `).bind(fileId, session.user_id).first();

    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Delete from R2
    await R2.delete(file.file_key);

    // Mark as deleted in database
    await DB.prepare(`
      UPDATE file_uploads SET deleted_at = datetime('now') WHERE id = ?
    `).bind(fileId).run();

    return c.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Delete file error:', error);
    return c.json({ error: 'Failed to delete file' }, 500);
  }
});

// =============================================================================
// =============================================================================
// ANALYTICS & MONITORING APIS
// =============================================================================

// Get analytics dashboard data (admin only)
app.get('/api/analytics/dashboard', async (c) => {
  try {
    const { env } = c;
    
    // TODO: Add admin authentication check
    
    const [stats, recentErrors, topEndpoints] = await Promise.all([
      // Overall stats
      env.DB.prepare(`
        SELECT 
          COUNT(*) as total_events,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(CASE WHEN event_type = 'error' THEN 1 END) as error_count
        FROM analytics_events
        WHERE created_at > datetime('now', '-24 hours')
      `).first(),
      
      // Recent errors
      env.DB.prepare(`
        SELECT error_type, severity, error_message, created_at
        FROM error_logs
        WHERE resolved = 0
        ORDER BY created_at DESC
        LIMIT 10
      `).all(),
      
      // Top API endpoints by call count
      env.DB.prepare(`
        SELECT 
          endpoint, 
          COUNT(*) as call_count,
          AVG(response_time_ms) as avg_response_time
        FROM api_metrics
        WHERE created_at > datetime('now', '-24 hours')
        GROUP BY endpoint
        ORDER BY call_count DESC
        LIMIT 10
      `).all()
    ]);

    return c.json({
      stats: stats || {},
      recentErrors: recentErrors.results,
      topEndpoints: topEndpoints.results
    });
  } catch (error: any) {
    await logError(c, 'api', error.message, 'medium', { endpoint: '/api/analytics/dashboard' });
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// Get user analytics
app.get('/api/analytics/users/:userId', async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'));
    const { env } = c;
    
    const userAnalytics = await env.DB.prepare(`
      SELECT * FROM user_analytics WHERE user_id = ?
    `).bind(userId).first();

    if (!userAnalytics) {
      return c.json({ error: 'User analytics not found' }, 404);
    }

    return c.json({ analytics: userAnalytics });
  } catch (error: any) {
    await logError(c, 'api', error.message, 'low');
    return c.json({ error: 'Failed to fetch user analytics' }, 500);
  }
});

// =============================================================================
// MEDIA MANAGEMENT APIS
// =============================================================================

// Upload media file
app.post('/api/media/upload', async (c) => {
  try {
    const { env } = c;
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const visibility = (formData.get('visibility') as string) || 'private';
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Get user from session
    const sessionToken = getCookie(c, 'session');
    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const session = await env.DB.prepare(`
      SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')
    `).bind(sessionToken).first();

    if (!session) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    const userId = session.user_id as number;

    // Validate file
    const validation = validateFileUpload(file, 50);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    // Generate file key and upload to R2
    const fileKey = generateFileKey(userId, file.name);
    const arrayBuffer = await file.arrayBuffer();
    
    await uploadToR2(env.R2, fileKey, arrayBuffer, {
      'content-type': file.type
    });

    // Save metadata to database
    const mediaFile: MediaFile = {
      userId,
      fileKey,
      originalFilename: file.name,
      fileType: detectFileType(file.type),
      mimeType: file.type,
      fileSizeBytes: file.size,
      processingStatus: 'completed',
      visibility: visibility as 'private' | 'public' | 'friends'
    };

    const fileId = await saveMediaFile(env.DB, mediaFile);

    // Track event
    await trackEvent(c, 'user_action', 'file_upload', {
      fileType: mediaFile.fileType,
      fileSize: file.size
    }, userId);

    return c.json({
      id: fileId,
      fileKey,
      url: `https://moodmash.win/api/media/${fileId}`,
      message: 'File uploaded successfully'
    });
  } catch (error: any) {
    await logError(c, 'api', error.message, 'high', { endpoint: '/api/media/upload' });
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// Get media file
app.get('/api/media/:id', async (c) => {
  try {
    const fileId = parseInt(c.req.param('id'));
    const { env } = c;

    // Get user from session (optional for public files)
    const sessionToken = getCookie(c, 'session');
    let userId: number | undefined;
    
    if (sessionToken) {
      const session = await env.DB.prepare(`
        SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')
      `).bind(sessionToken).first();
      userId = session?.user_id as number | undefined;
    }

    // Get file metadata
    const mediaFile = await getMediaFile(env.DB, fileId, userId);
    if (!mediaFile) {
      return c.json({ error: 'File not found or access denied' }, 404);
    }

    // Download from R2
    const object = await downloadFromR2(env.R2, mediaFile.fileKey);
    if (!object) {
      return c.json({ error: 'File not found in storage' }, 404);
    }

    // Return file
    return new Response(object.body, {
      headers: {
        'Content-Type': mediaFile.mimeType,
        'Content-Disposition': `inline; filename="${mediaFile.originalFilename}"`
      }
    });
  } catch (error: any) {
    await logError(c, 'api', error.message, 'medium');
    return c.json({ error: 'Failed to retrieve file' }, 500);
  }
});

// List user's media files
app.get('/api/media', async (c) => {
  try {
    const { env } = c;
    const fileType = c.req.query('type');
    
    // Get user from session
    const sessionToken = getCookie(c, 'session');
    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const session = await env.DB.prepare(`
      SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')
    `).bind(sessionToken).first();

    if (!session) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    const userId = session.user_id as number;
    const files = await listUserMediaFiles(env.DB, userId, fileType);

    return c.json({ files });
  } catch (error: any) {
    await logError(c, 'api', error.message, 'low');
    return c.json({ error: 'Failed to list files' }, 500);
  }
});

// Delete media file
app.delete('/api/media/:id', async (c) => {
  try {
    const fileId = parseInt(c.req.param('id'));
    const { env } = c;
    
    // Get user from session
    const sessionToken = getCookie(c, 'session');
    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const session = await env.DB.prepare(`
      SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')
    `).bind(sessionToken).first();

    if (!session) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    const userId = session.user_id as number;
    const deleted = await deleteMediaFile(env.DB, env.R2, fileId, userId);

    if (!deleted) {
      return c.json({ error: 'File not found or access denied' }, 404);
    }

    // Track event
    await trackEvent(c, 'user_action', 'file_delete', { fileId }, userId);

    return c.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    await logError(c, 'api', error.message, 'medium');
    return c.json({ error: 'Failed to delete file' }, 500);
  }
});

// =============================================================================
// SECRETS MANAGEMENT APIS (Admin only)
// =============================================================================

// Get secret (requires master key)
app.get('/api/secrets/:key', async (c) => {
  try {
    const keyName = c.req.param('key');
    const masterKey = c.req.header('X-Master-Key');
    
    if (!masterKey) {
      return c.json({ error: 'Master key required' }, 401);
    }

    const { env } = c;
    const value = await getSecret(env.DB, keyName, masterKey);
    
    if (!value) {
      return c.json({ error: 'Secret not found' }, 404);
    }

    return c.json({ value });
  } catch (error: any) {
    await logError(c, 'api', error.message, 'critical', { endpoint: '/api/secrets/:key' });
    return c.json({ error: 'Failed to retrieve secret' }, 500);
  }
});

// Store secret (requires master key and admin auth)
app.post('/api/secrets', async (c) => {
  try {
    const { keyName, value, description, category } = await c.req.json();
    const masterKey = c.req.header('X-Master-Key');
    
    if (!masterKey) {
      return c.json({ error: 'Master key required' }, 401);
    }

    // Get user from session
    const sessionToken = getCookie(c, 'session');
    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { env } = c;
    const session = await env.DB.prepare(`
      SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')
    `).bind(sessionToken).first();

    if (!session) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    await storeSecret(
      env.DB,
      keyName,
      value,
      description || '',
      category || 'general',
      session.user_id as number,
      masterKey
    );

    return c.json({ message: 'Secret stored successfully' });
  } catch (error: any) {
    await logError(c, 'api', error.message, 'critical');
    return c.json({ error: 'Failed to store secret' }, 500);
  }
});

// SOCIAL FEED APIS
// =============================================================================

// Get social feed
app.get('/api/social/feed', async (c) => {
  const { DB } = c.env;
  const filter = c.req.query('filter') || 'all';
  
  try {
    let query = `
      SELECT 
        sp.*,
        u.name as user_name,
        EXISTS(SELECT 1 FROM social_post_likes WHERE post_id = sp.id AND user_id = 1) as user_liked
      FROM social_posts sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.visibility = 'public'
    `;
    
    // Add filters
    if (filter === 'friends') {
      query += ` AND sp.user_id IN (SELECT following_id FROM user_follows WHERE follower_id = 1 AND status = 'accepted')`;
    } else if (filter !== 'all') {
      query += ` AND sp.emotion = '${filter}'`;
    }
    
    query += ` ORDER BY sp.created_at DESC LIMIT 50`;
    
    const posts = await DB.prepare(query).all();
    
    return c.json({ posts: posts.results });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Create new post
app.post('/api/social/posts', async (c) => {
  const { DB } = c.env;
  
  try {
    const body = await c.req.json<{
      content: string;
      emotion: string;
      visibility?: string;
      emotion_intensity?: number;
    }>();
    
    if (!body.content || !body.emotion) {
      return c.json({ error: 'Content and emotion are required' }, 400);
    }
    
    const result = await DB.prepare(`
      INSERT INTO social_posts (user_id, content, emotion, emotion_intensity, visibility)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      1,
      body.content,
      body.emotion,
      body.emotion_intensity || 3,
      body.visibility || 'public'
    ).run();
    
    // Update user profile post count
    await DB.prepare(`
      UPDATE user_profiles 
      SET total_posts = total_posts + 1
      WHERE user_id = 1
    `).run();
    
    return c.json({ 
      id: result.meta.last_row_id,
      message: 'Post created successfully'
    }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Toggle like on post
app.post('/api/social/posts/:id/like', async (c) => {
  const { DB } = c.env;
  const postId = c.req.param('id');
  
  try {
    // Check if already liked
    const existing = await DB.prepare(`
      SELECT id FROM social_post_likes
      WHERE post_id = ? AND user_id = 1
    `).bind(postId).first();
    
    if (existing) {
      // Unlike
      await DB.prepare(`
        DELETE FROM social_post_likes
        WHERE post_id = ? AND user_id = 1
      `).bind(postId).run();
      
      await DB.prepare(`
        UPDATE social_posts
        SET like_count = like_count - 1
        WHERE id = ?
      `).bind(postId).run();
    } else {
      // Like
      await DB.prepare(`
        INSERT INTO social_post_likes (post_id, user_id)
        VALUES (?, ?)
      `).bind(postId, 1).run();
      
      await DB.prepare(`
        UPDATE social_posts
        SET like_count = like_count + 1
        WHERE id = ?
      `).bind(postId).run();
    }
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get post comments
app.get('/api/social/posts/:id/comments', async (c) => {
  const { DB } = c.env;
  const postId = c.req.param('id');
  
  try {
    const comments = await DB.prepare(`
      SELECT 
        c.*,
        u.name as user_name
      FROM social_post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).bind(postId).all();
    
    return c.json({ comments: comments.results });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Add comment to post
app.post('/api/social/posts/:id/comments', async (c) => {
  const { DB } = c.env;
  const postId = c.req.param('id');
  
  try {
    const body = await c.req.json<{ content: string }>();
    
    if (!body.content) {
      return c.json({ error: 'Comment content is required' }, 400);
    }
    
    const result = await DB.prepare(`
      INSERT INTO social_post_comments (post_id, user_id, content)
      VALUES (?, ?, ?)
    `).bind(postId, 1, body.content).run();
    
    // Update post comment count
    await DB.prepare(`
      UPDATE social_posts
      SET comment_count = comment_count + 1
      WHERE id = ?
    `).bind(postId).run();
    
    return c.json({ 
      id: result.meta.last_row_id,
      message: 'Comment added successfully'
    }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get user profile
app.get('/api/social/profile/:userId', async (c) => {
  const { DB } = c.env;
  const userId = c.req.param('userId');
  
  try {
    const profile = await DB.prepare(`
      SELECT up.*, u.email, u.name
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE up.user_id = ?
    `).bind(userId).first();
    
    return c.json({ profile });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// AUTHENTICATION PAGE ROUTES
// =============================================================================

// Login page
app.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - MoodMash</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body>
        <div id="auth-container"></div>
        
        <script src="/static/i18n.js"></script>
        <script src="/static/utils.js"></script>
        <script>
          // Set initial view to login
          window.initialAuthView = 'login';
        </script>
        <script src="/static/auth.js"></script>
    </body>
    </html>
  `);
});

// Register page
app.get('/register', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Register - MoodMash</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body>
        <div id="auth-container"></div>
        
        <script src="/static/i18n.js"></script>
        <script src="/static/utils.js"></script>
        <script>
          // Set initial view to register
          window.initialAuthView = 'register';
        </script>
        <script src="/static/auth.js"></script>
    </body>
    </html>
  `);
});

// Magic link verification page
app.get('/auth/magic', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Magic Link - MoodMash</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body>
        <div id="magic-link-container"></div>
        
        <script src="/static/i18n.js"></script>
        <script src="/static/utils.js"></script>
        <script src="/static/magic-link.js"></script>
    </body>
    </html>
  `);
});

// =============================================================================
// PWA ROUTES
// =============================================================================

// Manifest
app.get('/manifest.json', async (c) => {
  return c.json({
    name: 'MoodMash - Mood Tracking',
    short_name: 'MoodMash',
    description: 'Intelligent mood tracking and emotional wellness platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#6366f1',
    theme_color: '#6366f1',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/static/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable'
      }
    ],
    categories: ['health', 'lifestyle', 'medical'],
    shortcuts: [
      {
        name: 'Log Mood',
        short_name: 'Log',
        description: 'Quickly log your current mood',
        url: '/log'
      },
      {
        name: 'View Dashboard',
        short_name: 'Dashboard',
        description: 'View your mood statistics',
        url: '/'
      }
    ]
  });
});

// Service Worker
app.get('/sw.js', (c) => {
  return c.text(`
// MoodMash Service Worker - Version 6.0.0 - Social Feed feature
const CACHE_NAME = 'moodmash-v6.0.0';
const ASSETS = [
  '/static/styles.css',
  '/static/app.js',
  '/static/log.js',
  '/static/activities.js',
  '/static/express.js',
  '/static/insights.js',
  '/static/quick-select.js',
  '/static/wellness-tips.js',
  '/static/challenges.js',
  '/static/color-psychology.js',
  '/static/social-feed.js',
  '/static/i18n.js',
  '/static/utils.js',
  '/static/onboarding.js',
  '/static/chatbot.js',
  '/static/accessibility.js',
  '/static/auth.js'
];

self.addEventListener('install', e => {
  console.log('SW v6.0.0: Installing...');
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  console.log('SW v6.0.0: Activating and cleaning old caches...');
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('SW: Deleting old cache:', key);
          return caches.delete(key);
        }
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Skip API requests
  if (e.request.url.includes('/api/')) return;
  
  // Network-first for all JS/HTML files (always get fresh)
  if (e.request.url.includes('/static/') || 
      e.request.url.match(/\\/(log|activities|express|insights|quick-select|wellness-tips|challenges|color-psychology|social-feed|about)$/)) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const clone = r.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  
  // Cache-first for other assets (images, fonts, etc.)
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
  `, 200, { 'Content-Type': 'application/javascript' });
});

// =============================================================================
// WEB PAGES
// =============================================================================

// Home page
app.get('/', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="/static/app.js"></script>
  `;
  return c.html(renderHTML('Dashboard', content, 'dashboard'));
});

// Log mood page
app.get('/log', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="/static/log.js"></script>
  `;
  return c.html(renderHTML('Log Mood', content, 'log'));
});

// Activities page
app.get('/activities', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="/static/activities.js"></script>
  `;
  return c.html(renderHTML('Wellness Activities', content, 'activities'));
});

// Health Dashboard page (v9.0)
app.get('/health-dashboard', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="/static/health-dashboard.js"></script>
  `;
  return c.html(renderHTML('Health Dashboard', content, 'health-dashboard'));
});

// Privacy Center page (v9.0)
app.get('/privacy-center', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="/static/privacy-center.js"></script>
  `;
  return c.html(renderHTML('Privacy Center', content, 'privacy-center'));
});

// Support Resources page (v9.0)
app.get('/support', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="/static/support.js"></script>
  `;
  return c.html(renderHTML('Support Resources', content, 'support'));
});

// HIPAA Compliance Dashboard (v9.5 Phase 2)
app.get('/hipaa-compliance', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="/static/hipaa-compliance.js"></script>
  `;
  return c.html(renderHTML('HIPAA Compliance Dashboard', content, 'hipaa-compliance'));
});

// Security Monitoring Dashboard (v9.5 Phase 2)
app.get('/security-monitoring', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="/static/security-monitoring.js"></script>
  `;
  return c.html(renderHTML('Security Monitoring', content, 'security-monitoring'));
});

// Research Center Dashboard (v9.5 Phase 2)
app.get('/research-center', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="/static/research-center.js"></script>
  `;
  return c.html(renderHTML('Research Center', content, 'research-center'));
});

// Privacy Education Center (v9.5 Phase 2)
app.get('/privacy-education', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="/static/privacy-education.js"></script>
  `;
  return c.html(renderHTML('Privacy Education', content, 'privacy-education'));
});

// ========================================
// AI-POWERED MOOD INTELLIGENCE API ROUTES
// Using Gemini 2.0 Flash for advanced mood analysis
// ========================================

import { createAIService } from './services/gemini-ai';

// 1. Mood Pattern Recognition
app.post('/api/ai/patterns', async (c) => {
  try {
    const { env } = c;
    const aiService = createAIService(env.GEMINI_API_KEY);
    
    // Get user's mood entries from database
    const userId = 1; // TODO: Get from session
    const moods = await env.DB.prepare(`
      SELECT * FROM mood_entries 
      WHERE user_id = ? 
      ORDER BY logged_at DESC 
      LIMIT 30
    `).bind(userId).all();
    
    const result = await aiService.analyzeMoodPatterns(moods.results as any[]);
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[AI Patterns] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2. Predictive Mood Forecasting
app.post('/api/ai/forecast', async (c) => {
  try {
    const { env } = c;
    const aiService = createAIService(env.GEMINI_API_KEY);
    const body = await c.req.json();
    
    // Get user's mood history
    const userId = 1; // TODO: Get from session
    const moods = await env.DB.prepare(`
      SELECT * FROM mood_entries 
      WHERE user_id = ? 
      ORDER BY logged_at DESC 
      LIMIT 60
    `).bind(userId).all();
    
    const result = await aiService.forecastMood(moods.results as any[], body.currentContext);
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[AI Forecast] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 3. Contextual Mood Analysis
app.post('/api/ai/context', async (c) => {
  try {
    const { env } = c;
    const aiService = createAIService(env.GEMINI_API_KEY);
    
    const userId = 1; // TODO: Get from session
    const moods = await env.DB.prepare(`
      SELECT * FROM mood_entries 
      WHERE user_id = ? 
      ORDER BY logged_at DESC 
      LIMIT 30
    `).bind(userId).all();
    
    const result = await aiService.analyzeContext(moods.results as any[]);
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[AI Context] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 4. Causal Factor Identification
app.post('/api/ai/causes', async (c) => {
  try {
    const { env } = c;
    const aiService = createAIService(env.GEMINI_API_KEY);
    
    const userId = 1; // TODO: Get from session
    const moods = await env.DB.prepare(`
      SELECT * FROM mood_entries 
      WHERE user_id = ? 
      ORDER BY logged_at DESC 
      LIMIT 45
    `).bind(userId).all();
    
    const result = await aiService.identifyCausalFactors(moods.results as any[]);
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[AI Causes] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 5. Personalized Recommendations
app.post('/api/ai/recommend', async (c) => {
  try {
    const { env } = c;
    const aiService = createAIService(env.GEMINI_API_KEY);
    const body = await c.req.json();
    
    const userId = 1; // TODO: Get from session
    const moods = await env.DB.prepare(`
      SELECT * FROM mood_entries 
      WHERE user_id = ? 
      ORDER BY logged_at DESC 
      LIMIT 20
    `).bind(userId).all();
    
    const result = await aiService.getRecommendations(
      body.currentMood,
      body.intensity,
      moods.results as any[],
      body.preferences
    );
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[AI Recommend] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 6. Crisis Intervention System
app.post('/api/ai/crisis-check', async (c) => {
  try {
    const { env } = c;
    const aiService = createAIService(env.GEMINI_API_KEY);
    
    const userId = 1; // TODO: Get from session
    const moods = await env.DB.prepare(`
      SELECT * FROM mood_entries 
      WHERE user_id = ? 
      ORDER BY logged_at DESC 
      LIMIT 21
    `).bind(userId).all();
    
    const result = await aiService.checkCrisis(moods.results as any[]);
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[AI Crisis] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 7. Early Risk Detection
app.post('/api/ai/risk-detect', async (c) => {
  try {
    const { env } = c;
    const aiService = createAIService(env.GEMINI_API_KEY);
    
    const userId = 1; // TODO: Get from session
    const moods = await env.DB.prepare(`
      SELECT * FROM mood_entries 
      WHERE user_id = ? 
      ORDER BY logged_at DESC 
      LIMIT 30
    `).bind(userId).all();
    
    const result = await aiService.detectRisk(moods.results as any[]);
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[AI Risk] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 8. Advanced Mood Analytics
app.post('/api/ai/analytics', async (c) => {
  try {
    const { env } = c;
    const aiService = createAIService(env.GEMINI_API_KEY);
    
    const userId = 1; // TODO: Get from session
    const moods = await env.DB.prepare(`
      SELECT * FROM mood_entries 
      WHERE user_id = ? 
      ORDER BY logged_at DESC 
      LIMIT 90
    `).bind(userId).all();
    
    const result = await aiService.getAdvancedAnalytics(moods.results as any[]);
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[AI Analytics] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// HEALTH DASHBOARD API ENDPOINTS (v9.0)
// ============================================================================

// 1. Get current health metrics
app.get('/api/health/metrics', async (c) => {
  try {
    const { env } = c;
    const userId = 1; // TODO: Get from session
    
    // Get mood data for last 30 days
    const moods = await env.DB.prepare(`
      SELECT * FROM mood_entries 
      WHERE user_id = ? 
      AND logged_at >= datetime('now', '-30 days')
      ORDER BY logged_at DESC
    `).bind(userId).all();
    
    const metrics = HealthMetricsService.calculateMetrics(moods.results as any[], 30);
    
    // Store metrics in database
    await env.DB.prepare(`
      INSERT INTO health_metrics (
        user_id, mental_health_score, mood_stability_index, sleep_quality_score,
        activity_consistency, stress_level, crisis_risk_level, mood_trend,
        positive_emotion_ratio, negative_emotion_ratio, best_time_of_day,
        worst_time_of_day, data_points_used, calculation_period_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      metrics.mental_health_score,
      metrics.mood_stability_index,
      metrics.sleep_quality_score,
      metrics.activity_consistency,
      metrics.stress_level,
      metrics.crisis_risk_level,
      metrics.mood_trend,
      metrics.positive_emotion_ratio,
      metrics.negative_emotion_ratio,
      metrics.best_time_of_day,
      metrics.worst_time_of_day,
      metrics.data_points_used,
      metrics.calculation_period_days
    ).run();
    
    return c.json({ success: true, data: metrics });
  } catch (error: any) {
    console.error('[Health Metrics] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2. Get health trends (compare periods)
app.get('/api/health/trends/:period', async (c) => {
  try {
    const { env } = c;
    const userId = 1; // TODO: Get from session
    const period = c.req.param('period'); // "7d", "30d", "90d"
    
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    // Get current period data
    const currentMoods = await env.DB.prepare(`
      SELECT * FROM mood_entries 
      WHERE user_id = ? 
      AND logged_at >= datetime('now', '-${days} days')
      ORDER BY logged_at DESC
    `).bind(userId).all();
    
    // Get previous period data for comparison
    const previousMoods = await env.DB.prepare(`
      SELECT * FROM mood_entries 
      WHERE user_id = ? 
      AND logged_at >= datetime('now', '-${days * 2} days')
      AND logged_at < datetime('now', '-${days} days')
      ORDER BY logged_at DESC
    `).bind(userId).all();
    
    const trends = HealthMetricsService.calculateTrends(
      currentMoods.results as any[],
      previousMoods.results as any[],
      period
    );
    
    return c.json({ success: true, data: trends });
  } catch (error: any) {
    console.error('[Health Trends] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 3. Get historical health metrics
app.get('/api/health/history', async (c) => {
  try {
    const { env } = c;
    const userId = 1; // TODO: Get from session
    
    const history = await env.DB.prepare(`
      SELECT * FROM health_metrics 
      WHERE user_id = ? 
      ORDER BY calculated_at DESC 
      LIMIT 90
    `).bind(userId).all();
    
    return c.json({ success: true, data: history.results });
  } catch (error: any) {
    console.error('[Health History] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// HIPAA COMPLIANCE API ENDPOINTS (v9.5) - Phase 2
// ============================================================================

import { HIPAAComplianceService } from './services/hipaa-compliance';

// 1. Get compliance status
app.get('/api/hipaa/status', async (c) => {
  try {
    const { env } = c;
    const status = await HIPAAComplianceService.getComplianceStatus(env.DB);
    return c.json({ success: true, data: status });
  } catch (error: any) {
    console.error('[HIPAA Status] Error:', error);
    await HIPAAComplianceService.logAudit(env.DB, {
      action: 'GET_HIPAA_STATUS',
      contains_phi: false,
      success: false,
      failure_reason: error.message
    });
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2. Get audit logs
app.get('/api/hipaa/audit-logs', async (c) => {
  try {
    const { env } = c;
    const userId = c.req.query('user_id');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    let query = `
      SELECT * FROM hipaa_audit_logs 
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const logs = await env.DB.prepare(query).bind(...params).all();
    
    await HIPAAComplianceService.logAudit(env.DB, {
      action: 'VIEW_AUDIT_LOGS',
      contains_phi: true,
      phi_fields: ['user_id'],
      success: true
    });
    
    return c.json({ success: true, data: logs.results, count: logs.results.length });
  } catch (error: any) {
    console.error('[HIPAA Audit Logs] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 3. Generate BAA template
app.post('/api/hipaa/baa', async (c) => {
  try {
    const { env } = c;
    const { organization_name, effective_date } = await c.req.json();
    
    if (!organization_name) {
      return c.json({ success: false, error: 'Organization name required' }, 400);
    }
    
    const baaContent = HIPAAComplianceService.generateBAATemplate(
      organization_name,
      effective_date || new Date().toISOString().split('T')[0]
    );
    
    await HIPAAComplianceService.logAudit(env.DB, {
      action: 'GENERATE_BAA',
      resource_type: 'baa_template',
      contains_phi: false,
      success: true
    });
    
    return c.json({ 
      success: true, 
      data: { 
        content: baaContent,
        organization_name,
        effective_date: effective_date || new Date().toISOString().split('T')[0]
      }
    });
  } catch (error: any) {
    console.error('[BAA Generation] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 4. Get security incidents
app.get('/api/hipaa/incidents', async (c) => {
  try {
    const { env } = c;
    const status = c.req.query('status');
    
    let query = 'SELECT * FROM security_incidents WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      query += ' AND incident_status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY detected_at DESC LIMIT 50';
    
    const incidents = await env.DB.prepare(query).bind(...params).all();
    
    await HIPAAComplianceService.logAudit(env.DB, {
      action: 'VIEW_SECURITY_INCIDENTS',
      contains_phi: true,
      success: true
    });
    
    return c.json({ success: true, data: incidents.results });
  } catch (error: any) {
    console.error('[Security Incidents] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 5. Create HIPAA policy
app.post('/api/hipaa/policies', async (c) => {
  try {
    const { env } = c;
    const { policy_type, title, version, content, effective_date } = await c.req.json();
    
    if (!policy_type || !title || !version || !content) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }
    
    const result = await env.DB.prepare(`
      INSERT INTO hipaa_policies (policy_type, title, version, content, effective_date, policy_status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `).bind(policy_type, title, version, content, effective_date || new Date().toISOString()).run();
    
    await HIPAAComplianceService.logAudit(env.DB, {
      action: 'CREATE_HIPAA_POLICY',
      resource_type: 'hipaa_policy',
      resource_id: result.meta.last_row_id?.toString(),
      contains_phi: false,
      success: true
    });
    
    return c.json({ success: true, data: { id: result.meta.last_row_id } });
  } catch (error: any) {
    console.error('[Create Policy] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// SECURITY MONITORING API ENDPOINTS (v9.5) - Phase 2
// ============================================================================

import { SecurityMonitoringService } from './services/security-monitoring';

// 1. Get security dashboard stats
app.get('/api/security/dashboard', async (c) => {
  try {
    const { env } = c;
    const stats = await SecurityMonitoringService.getDashboardStats(env.DB);
    
    await SecurityMonitoringService.logEvent(env.DB, {
      event_type: 'VIEW_SECURITY_DASHBOARD',
      severity: 'low',
      description: 'Security dashboard accessed'
    });
    
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('[Security Dashboard] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2. Get security events
app.get('/api/security/events', async (c) => {
  try {
    const { env } = c;
    const severity = c.req.query('severity');
    const limit = parseInt(c.req.query('limit') || '100');
    
    let query = 'SELECT * FROM security_events WHERE 1=1';
    const params: any[] = [];
    
    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);
    
    const events = await env.DB.prepare(query).bind(...params).all();
    
    return c.json({ success: true, data: events.results });
  } catch (error: any) {
    console.error('[Security Events] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 3. Get failed logins
app.get('/api/security/failed-logins', async (c) => {
  try {
    const { env } = c;
    const limit = parseInt(c.req.query('limit') || '100');
    
    const logins = await env.DB.prepare(`
      SELECT * FROM failed_logins 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).bind(limit).all();
    
    return c.json({ success: true, data: logins.results });
  } catch (error: any) {
    console.error('[Failed Logins] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 4. Get security alerts
app.get('/api/security/alerts', async (c) => {
  try {
    const { env } = c;
    const status = c.req.query('status');
    
    let query = 'SELECT * FROM security_alerts WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      query += ' AND alert_status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 50';
    
    const alerts = await env.DB.prepare(query).bind(...params).all();
    
    return c.json({ success: true, data: alerts.results });
  } catch (error: any) {
    console.error('[Security Alerts] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 5. Get compliance checklist
app.get('/api/security/compliance-checklist', async (c) => {
  try {
    const { env } = c;
    
    // Check if checklist is empty and initialize if needed
    const count = await env.DB.prepare('SELECT COUNT(*) as count FROM compliance_checklist').first();
    if (count?.count === 0) {
      await SecurityMonitoringService.initializeComplianceChecklist(env.DB);
    }
    
    const checklist = await SecurityMonitoringService.getComplianceChecklist(env.DB);
    
    return c.json({ success: true, data: checklist });
  } catch (error: any) {
    console.error('[Compliance Checklist] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 6. Update compliance check
app.put('/api/security/compliance-checklist/:id', async (c) => {
  try {
    const { env } = c;
    const checkId = parseInt(c.req.param('id'));
    const { is_compliant, notes } = await c.req.json();
    
    await SecurityMonitoringService.updateComplianceCheck(env.DB, checkId, is_compliant, notes);
    
    await SecurityMonitoringService.logEvent(env.DB, {
      event_type: 'UPDATE_COMPLIANCE_CHECK',
      severity: 'low',
      description: `Compliance check ${checkId} updated: ${is_compliant ? 'compliant' : 'non-compliant'}`
    });
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[Update Compliance Check] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 7. Get rate limit hits
app.get('/api/security/rate-limits', async (c) => {
  try {
    const { env } = c;
    
    const rateLimits = await env.DB.prepare(`
      SELECT * FROM rate_limit_hits 
      WHERE timestamp >= datetime('now', '-24 hours')
      ORDER BY hit_count DESC 
      LIMIT 50
    `).all();
    
    return c.json({ success: true, data: rateLimits.results });
  } catch (error: any) {
    console.error('[Rate Limits] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// SOCIAL FEATURES & GROUPS API ENDPOINTS (v10.0) - Phase 3
// ============================================================================

// Get social feed
app.get('/api/social/feed', async (c) => {
  try {
    const { env } = c;
    const userId = 1; // TODO: Get from session
    const limit = parseInt(c.req.query('limit') || '20');
    
    // Get mood shares from friends
    const feed = await env.DB.prepare(`
      SELECT ms.*, me.emotion, me.intensity, me.notes, me.logged_at,
             u.name as user_name, up.display_name, up.avatar_url,
             (SELECT COUNT(*) FROM mood_reactions WHERE mood_share_id = ms.id) as reaction_count,
             (SELECT COUNT(*) FROM mood_comments WHERE mood_share_id = ms.id) as comment_count
      FROM mood_shares ms
      JOIN mood_entries me ON ms.mood_entry_id = me.id
      JOIN users u ON ms.user_id = u.id
      LEFT JOIN user_profiles up ON ms.user_id = up.user_id
      WHERE ms.user_id IN (
        SELECT friend_id FROM friendships 
        WHERE user_id = ? AND friendship_status = 'accepted'
      )
      OR ms.share_type = 'public'
      ORDER BY ms.shared_at DESC
      LIMIT ?
    `).bind(userId, limit).all();
    
    return c.json({ success: true, data: feed.results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Share mood
app.post('/api/social/share', async (c) => {
  try {
    const { env } = c;
    const userId = 1;
    const { mood_entry_id, share_type, caption, allow_comments } = await c.req.json();
    
    const result = await env.DB.prepare(`
      INSERT INTO mood_shares (mood_entry_id, user_id, share_type, caption, allow_comments)
      VALUES (?, ?, ?, ?, ?)
    `).bind(mood_entry_id, userId, share_type || 'friends', caption || null, allow_comments !== false ? 1 : 0).run();
    
    return c.json({ success: true, data: { id: result.meta.last_row_id } });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Add friend request
app.post('/api/social/friends/request', async (c) => {
  try {
    const { env } = c;
    const userId = 1;
    const { friend_id } = await c.req.json();
    
    await env.DB.prepare(`
      INSERT OR IGNORE INTO friendships (user_id, friend_id, friendship_status)
      VALUES (?, ?, 'pending')
    `).bind(userId, friend_id).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get user's friends
app.get('/api/social/friends', async (c) => {
  try {
    const { env } = c;
    const userId = 1;
    
    const friends = await env.DB.prepare(`
      SELECT f.*, u.name, u.email, up.display_name, up.avatar_url
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      LEFT JOIN user_profiles up ON f.friend_id = up.user_id
      WHERE f.user_id = ? AND f.friendship_status = 'accepted'
      ORDER BY f.accepted_at DESC
    `).bind(userId).all();
    
    return c.json({ success: true, data: friends.results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create mood group
app.post('/api/groups', async (c) => {
  try {
    const { env } = c;
    const userId = 1;
    const { name, description, group_type } = await c.req.json();
    
    const result = await env.DB.prepare(`
      INSERT INTO mood_groups (name, description, group_type, creator_id)
      VALUES (?, ?, ?, ?)
    `).bind(name, description || null, group_type || 'public', userId).run();
    
    const groupId = result.meta.last_row_id;
    
    // Add creator as admin
    await env.DB.prepare(`
      INSERT INTO group_members (group_id, user_id, member_role)
      VALUES (?, ?, 'admin')
    `).bind(groupId, userId).run();
    
    return c.json({ success: true, data: { id: groupId } });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get all groups
app.get('/api/groups', async (c) => {
  try {
    const { env } = c;
    const type = c.req.query('type') || 'public';
    
    const groups = await env.DB.prepare(`
      SELECT g.*, u.name as creator_name,
             (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as actual_member_count
      FROM mood_groups g
      JOIN users u ON g.creator_id = u.id
      WHERE g.group_type = ?
      ORDER BY g.created_at DESC
      LIMIT 50
    `).bind(type).all();
    
    return c.json({ success: true, data: groups.results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Join group
app.post('/api/groups/:id/join', async (c) => {
  try {
    const { env } = c;
    const userId = 1;
    const groupId = c.req.param('id');
    
    await env.DB.prepare(`
      INSERT OR IGNORE INTO group_members (group_id, user_id, member_role)
      VALUES (?, ?, 'member')
    `).bind(groupId, userId).run();
    
    // Update member count
    await env.DB.prepare(`
      UPDATE mood_groups 
      SET member_count = (SELECT COUNT(*) FROM group_members WHERE group_id = ?)
      WHERE id = ?
    `).bind(groupId, groupId).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get group moods
app.get('/api/groups/:id/moods', async (c) => {
  try {
    const { env } = c;
    const groupId = c.req.param('id');
    
    const moods = await env.DB.prepare(`
      SELECT gm.*, me.emotion, me.intensity, me.notes, me.logged_at,
             u.name as user_name, up.display_name, up.avatar_url
      FROM group_moods gm
      JOIN mood_entries me ON gm.mood_entry_id = me.id
      JOIN users u ON gm.user_id = u.id
      LEFT JOIN user_profiles up ON gm.user_id = up.user_id
      WHERE gm.group_id = ?
      ORDER BY gm.created_at DESC
      LIMIT 50
    `).bind(groupId).all();
    
    return c.json({ success: true, data: moods.results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// PRODUCTION MONITORING & PERFORMANCE API ENDPOINTS (v10.0) - Phase 3
// ============================================================================

import {
  trackPerformance,
  getEndpointStats,
  getPerformanceDashboard,
  getPerformanceAlerts,
  type PerformanceMetric,
} from './services/performance-monitoring';
import * as CacheService from './services/cache';

// Get performance dashboard
app.get('/api/performance/dashboard', async (c) => {
  try {
    // Check cache first
    const cached = CacheService.get(CacheService.CacheKeys.performanceDashboard());
    if (cached) {
      return c.json(cached, 200, CacheService.getCacheHeaders(CacheService.CacheTTL.SHORT));
    }

    const dashboard = await getPerformanceDashboard(c.env);

    // Cache for 1 minute
    CacheService.set(CacheService.CacheKeys.performanceDashboard(), dashboard, CacheService.CacheTTL.SHORT);

    return c.json(dashboard, 200, CacheService.getCacheHeaders(CacheService.CacheTTL.SHORT));
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get endpoint-specific statistics
app.get('/api/performance/endpoint-stats', async (c) => {
  try {
    const endpoint = c.req.query('endpoint');
    const timeframe = (c.req.query('timeframe') || 'hour') as 'hour' | 'day' | 'week';

    if (!endpoint) {
      return c.json({ error: 'endpoint parameter required' }, 400);
    }

    const stats = await getEndpointStats(c.env, endpoint, timeframe);
    return c.json({ success: true, stats }, 200, CacheService.getCacheHeaders(CacheService.CacheTTL.SHORT));
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get performance alerts
app.get('/api/performance/alerts', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const alerts = await getPerformanceAlerts(c.env, limit);

    return c.json({ success: true, alerts }, 200, CacheService.getCacheHeaders(CacheService.CacheTTL.SHORT));
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get cache statistics
app.get('/api/performance/cache-stats', async (c) => {
  try {
    const stats = CacheService.getStats();
    return c.json({ success: true, stats }, 200, CacheService.getNoCacheHeaders());
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Clear cache (admin only)
app.post('/api/performance/clear-cache', async (c) => {
  try {
    const { pattern } = await c.req.json();

    if (pattern) {
      CacheService.delPattern(pattern);
    } else {
      CacheService.clear();
    }

    return c.json({ success: true, message: 'Cache cleared' }, 200, CacheService.getNoCacheHeaders());
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// System health check
app.get('/api/health/status', async (c) => {
  try {
    const start = Date.now();

    // Check database connection
    const dbCheck = await c.env.DB.prepare('SELECT 1').first();
    const dbResponseTime = Date.now() - start;

    // Get cache stats
    const cacheStats = CacheService.getStats();

    // Get recent performance data
    const recentMetrics = await c.env.DB.prepare(`
      SELECT AVG(response_time_ms) as avg_time
      FROM performance_metrics
      WHERE timestamp > datetime('now', '-5 minutes')
    `).first();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbCheck ? 'healthy' : 'unhealthy',
          response_time_ms: dbResponseTime,
        },
        cache: {
          status: 'healthy',
          hit_rate: cacheStats.hit_rate.toFixed(2) + '%',
          total_entries: cacheStats.total_entries,
        },
        performance: {
          status: (recentMetrics?.avg_time || 0) < 500 ? 'healthy' : 'degraded',
          avg_response_time_ms: recentMetrics?.avg_time || 0,
        },
      },
    };

    return c.json(health, 200, CacheService.getNoCacheHeaders());
  } catch (error: any) {
    return c.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// ============================================================================
// RESEARCH CENTER API ENDPOINTS (v9.5) - Phase 2
// ============================================================================

import { ResearchAnonymizationService } from './services/research-anonymization';

// 1. Get research dashboard stats
app.get('/api/research/dashboard', async (c) => {
  try {
    const { env } = c;
    const stats = await ResearchAnonymizationService.getResearchDashboard(env.DB);
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('[Research Dashboard] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2. Get user consents
app.get('/api/research/consents/:userId', async (c) => {
  try {
    const { env } = c;
    const userId = parseInt(c.req.param('userId'));
    const consents = await ResearchAnonymizationService.getUserConsents(env.DB, userId);
    return c.json({ success: true, data: consents });
  } catch (error: any) {
    console.error('[Research Consents] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 3. Manage consent (create/update)
app.post('/api/research/consent', async (c) => {
  try {
    const { env } = c;
    const { user_id, consent_type, consent_given, can_revoke, data_retention_days } = await c.req.json();
    
    if (!user_id || !consent_type || consent_given === undefined) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }
    
    await ResearchAnonymizationService.manageConsent(env.DB, {
      user_id,
      consent_type,
      consent_given,
      can_revoke: can_revoke ?? true,
      data_retention_days
    });
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[Manage Consent] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 4. Anonymize mood data
app.post('/api/research/anonymize/mood', async (c) => {
  try {
    const { env } = c;
    const { user_id } = await c.req.json();
    
    if (!user_id) {
      return c.json({ success: false, error: 'User ID required' }, 400);
    }
    
    const result = await ResearchAnonymizationService.anonymizeMoodData(env.DB, user_id);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[Anonymize Mood] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 5. Anonymize health metrics
app.post('/api/research/anonymize/health', async (c) => {
  try {
    const { env } = c;
    const { user_id } = await c.req.json();
    
    if (!user_id) {
      return c.json({ success: false, error: 'User ID required' }, 400);
    }
    
    const result = await ResearchAnonymizationService.anonymizeHealthMetrics(env.DB, user_id);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[Anonymize Health] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 6. Get aggregated research statistics
app.get('/api/research/stats', async (c) => {
  try {
    const { env } = c;
    const stats = await ResearchAnonymizationService.getAggregatedStats(env.DB);
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('[Research Stats] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 7. Create export request
app.post('/api/research/export', async (c) => {
  try {
    const { env } = c;
    const { export_type, requester_name, requester_email, purpose, irb_approval } = await c.req.json();
    
    if (!export_type || !requester_name || !requester_email || !purpose) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }
    
    const exportId = await ResearchAnonymizationService.createExportRequest(env.DB, {
      export_type,
      requester_name,
      requester_email,
      purpose,
      irb_approval
    });
    
    return c.json({ success: true, data: { export_id: exportId } });
  } catch (error: any) {
    console.error('[Create Export] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// PRIVACY CENTER API ENDPOINTS (v9.0) - GDPR Compliance
// ============================================================================

// 1. Get user data summary
app.get('/api/user/data-summary', async (c) => {
  try {
    const { env } = c;
    const userId = 1; // TODO: Get from session
    
    // Count all user data
    const moodCount = await env.DB.prepare('SELECT COUNT(*) as count FROM mood_entries WHERE user_id = ?').bind(userId).first();
    const activityCount = await env.DB.prepare('SELECT COUNT(*) as count FROM activities WHERE user_id = ?').bind(userId).first();
    const healthMetricsCount = await env.DB.prepare('SELECT COUNT(*) as count FROM health_metrics WHERE user_id = ?').bind(userId).first();
    const exportCount = await env.DB.prepare('SELECT COUNT(*) as count FROM data_exports WHERE user_id = ?').bind(userId).first();
    
    // Get account info
    const user = await env.DB.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').bind(userId).first();
    
    // Get consent status
    const consents = await env.DB.prepare('SELECT * FROM user_consents WHERE user_id = ?').bind(userId).all();
    
    const summary = {
      account: {
        user_id: user?.id,
        email: user?.email,
        name: user?.name,
        created_at: user?.created_at
      },
      data_counts: {
        mood_entries: moodCount?.count || 0,
        activities: activityCount?.count || 0,
        health_metrics: healthMetricsCount?.count || 0,
        data_exports: exportCount?.count || 0
      },
      consents: consents.results || [],
      total_storage_estimate: '~2 MB' // Rough estimate
    };
    
    return c.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('[Data Summary] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2. Export all user data (GDPR Article 20 - Right to Data Portability)
app.get('/api/user/export-data', async (c) => {
  try {
    const { env } = c;
    const userId = 1; // TODO: Get from session
    const format = c.req.query('format') || 'json'; // json, csv
    
    // Fetch all user data
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    const moods = await env.DB.prepare('SELECT * FROM mood_entries WHERE user_id = ?').bind(userId).all();
    const activities = await env.DB.prepare('SELECT * FROM activities WHERE user_id = ?').bind(userId).all();
    const healthMetrics = await env.DB.prepare('SELECT * FROM health_metrics WHERE user_id = ?').bind(userId).all();
    const professionalConnections = await env.DB.prepare('SELECT * FROM professional_connections WHERE user_id = ?').bind(userId).all();
    const consents = await env.DB.prepare('SELECT * FROM user_consents WHERE user_id = ?').bind(userId).all();
    
    const exportData = {
      export_date: new Date().toISOString(),
      export_version: '9.0.0',
      user_account: user,
      mood_entries: moods.results,
      activities: activities.results,
      health_metrics: healthMetrics.results,
      professional_connections: professionalConnections.results,
      consents: consents.results
    };
    
    // Log export request
    await env.DB.prepare(`
      INSERT INTO data_exports (user_id, export_type, export_scope, status, records_count)
      VALUES (?, ?, ?, ?, ?)
    `).bind(userId, format, 'all_data', 'completed', moods.results.length).run();
    
    if (format === 'csv') {
      // Convert to CSV (simplified)
      const csv = convertToCSV(exportData);
      return c.text(csv, 200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="moodmash-data.csv"' });
    }
    
    // Return JSON
    return c.json({ success: true, data: exportData }, 200, {
      'Content-Disposition': 'attachment; filename="moodmash-data.json"'
    });
  } catch (error: any) {
    console.error('[Data Export] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 3. Delete specific mood entry
app.delete('/api/moods/:id', async (c) => {
  try {
    const { env } = c;
    const userId = 1; // TODO: Get from session
    const moodId = c.req.param('id');
    
    // Verify ownership and delete
    const result = await env.DB.prepare('DELETE FROM mood_entries WHERE id = ? AND user_id = ?').bind(moodId, userId).run();
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'Mood entry not found or unauthorized' }, 404);
    }
    
    return c.json({ success: true, message: 'Mood entry deleted successfully' });
  } catch (error: any) {
    console.error('[Delete Mood] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 4. Delete all user data (GDPR Article 17 - Right to Erasure)
app.delete('/api/user/delete-account', async (c) => {
  try {
    const { env } = c;
    const userId = 1; // TODO: Get from session
    const confirmation = c.req.query('confirm');
    
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return c.json({ success: false, error: 'Confirmation required. Pass ?confirm=DELETE_MY_ACCOUNT' }, 400);
    }
    
    // Delete all user data (cascade deletes handled by foreign keys)
    await env.DB.prepare('DELETE FROM mood_entries WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM activities WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM health_metrics WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM professional_connections WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM user_consents WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM data_exports WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM support_access_log WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
    
    return c.json({ success: true, message: 'Account and all data permanently deleted' });
  } catch (error: any) {
    console.error('[Delete Account] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 5. Update user consent preferences
app.post('/api/consent/update', async (c) => {
  try {
    const { env } = c;
    const userId = 1; // TODO: Get from session
    const { consent_type, consent_given } = await c.req.json();
    
    // Validate consent type
    const validTypes = ['privacy_policy', 'terms_of_service', 'data_collection', 'ai_analysis', 'research_participation', 'marketing_emails'];
    if (!validTypes.includes(consent_type)) {
      return c.json({ success: false, error: 'Invalid consent type' }, 400);
    }
    
    // Update or insert consent
    await env.DB.prepare(`
      INSERT INTO user_consents (user_id, consent_type, consent_given, consent_date, consent_version)
      VALUES (?, ?, ?, datetime('now'), '9.0')
      ON CONFLICT(user_id, consent_type) DO UPDATE SET
        consent_given = excluded.consent_given,
        consent_date = excluded.consent_date,
        revoked_date = CASE WHEN excluded.consent_given = 0 THEN datetime('now') ELSE NULL END
    `).bind(userId, consent_type, consent_given ? 1 : 0).run();
    
    return c.json({ success: true, message: 'Consent preference updated' });
  } catch (error: any) {
    console.error('[Update Consent] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Helper function to convert data to CSV
function convertToCSV(data: any): string {
  let csv = '# MoodMash Data Export\n';
  csv += `# Export Date: ${data.export_date}\n\n`;
  
  // Mood Entries
  if (data.mood_entries && data.mood_entries.length > 0) {
    csv += '## Mood Entries\n';
    const headers = Object.keys(data.mood_entries[0]).join(',');
    csv += headers + '\n';
    data.mood_entries.forEach((entry: any) => {
      csv += Object.values(entry).join(',') + '\n';
    });
    csv += '\n';
  }
  
  return csv;
}

// ============================================================================
// SUPPORT RESOURCES API ENDPOINTS (v9.0)
// ============================================================================

import { allSupportResources, searchResources, filterByType, filterByCountry } from './data/support-resources';

// Get all support resources or search/filter
app.get('/api/support/resources', async (c) => {
  try {
    const query = c.req.query('q');
    const type = c.req.query('type');
    const country = c.req.query('country');
    
    let resources = allSupportResources;
    
    if (query) {
      resources = searchResources(query, resources);
    }
    
    if (type) {
      resources = filterByType(type, resources);
    }
    
    if (country) {
      resources = filterByCountry(country, resources);
    }
    
    return c.json({ success: true, data: resources, count: resources.length });
  } catch (error: any) {
    console.error('[Support Resources] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get crisis hotlines specifically
app.get('/api/support/hotlines', async (c) => {
  try {
    const country = c.req.query('country');
    
    let hotlines = filterByType('crisis_hotline');
    
    if (country) {
      hotlines = filterByCountry(country, hotlines);
    }
    
    return c.json({ success: true, data: hotlines, count: hotlines.length });
  } catch (error: any) {
    console.error('[Crisis Hotlines] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Log support resource access (for analytics - respects privacy)
app.post('/api/support/log-access', async (c) => {
  try {
    const { env } = c;
    const { resource_type, resource_id, resource_title, accessed_from } = await c.req.json();
    
    // Optional: only log if user is logged in
    const userId = 1; // TODO: Get from session, or null for anonymous
    
    await env.DB.prepare(`
      INSERT INTO support_access_log (user_id, resource_type, resource_id, resource_title, accessed_from)
      VALUES (?, ?, ?, ?, ?)
    `).bind(userId, resource_type, resource_id, resource_title, accessed_from).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[Log Support Access] Error:', error);
    // Don't fail if logging fails
    return c.json({ success: true });
  }
});

// AI Insights Dashboard Page
app.get('/ai-insights', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="/static/ai-insights.js"></script>
  `;
  return c.html(renderHTML('AI Insights', content, 'ai-insights'));
});

// Express Your Mood page
app.get('/express', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="/static/express.js"></script>
  `;
  return c.html(renderHTML('Express Your Mood', content, 'express'));
});

// Daily Mood Insights page
app.get('/insights', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="/static/insights.js"></script>
  `;
  return c.html(renderHTML('Mood Insights', content, 'insights'));
});

// Quick Select (can be embedded or standalone)
app.get('/quick-select', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="/static/quick-select.js"></script>
  `;
  return c.html(renderHTML('Quick Mood Select', content, 'quick-select'));
});

// AI Wellness Tips page
app.get('/wellness-tips', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="/static/wellness-tips.js"></script>
  `;
  return c.html(renderHTML('Personalized Wellness Tips', content, 'wellness-tips'));
});

// Challenges & Achievements page
app.get('/challenges', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="/static/challenges.js"></script>
  `;
  return c.html(renderHTML('Challenges & Achievements', content, 'challenges'));
});

// Color Psychology page
app.get('/color-psychology', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="/static/color-psychology.js"></script>
  `;
  return c.html(renderHTML('Color Psychology', content, 'color-psychology'));
});

// Social Feed page
app.get('/social-feed', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="/static/social-feed.js"></script>
  `;
  return c.html(renderHTML('Social Feed', content, 'social-feed'));
});

// Mood-Synchronized Groups Dashboard (v10.0 Phase 3)
app.get('/mood-groups', (c) => {
  const content = `
    ${renderLoadingState()}
    <script src="/static/mood-groups.js"></script>
  `;
  return c.html(renderHTML('Mood Groups', content, 'mood-groups'));
});

// API Documentation page
app.get('/api-docs', (c) => {
  return c.redirect('/static/api-docs.html');
});

// Privacy Policy page
app.get('/privacy-policy', (c) => {
  return c.redirect('/static/privacy-policy.html');
});

// About page
// Admin Dashboard Route
app.get('/admin', (c) => {
  // TODO: Add admin authentication check
  return c.redirect('/static/admin-dashboard.html');
});

app.get('/about', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>About - MoodMash</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#6366f1',
                  secondary: '#8b5cf6',
                }
              }
            }
          }
        </script>
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
        <!-- Navigation -->
        <nav class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <i class="fas fa-brain text-primary text-2xl mr-3"></i>
                        <span class="text-2xl font-bold text-gray-800">MoodMash</span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
                        <a href="/log" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Log Mood</a>
                        <a href="/activities" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Activities</a>
                        <a href="/about" class="text-primary px-3 py-2 rounded-md text-sm font-medium border-b-2 border-primary">About</a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 class="text-4xl font-bold text-gray-800 mb-6">About MoodMash</h1>
            
            <div class="bg-white rounded-lg shadow-md p-8 mb-6">
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
                <p class="text-gray-600 mb-4">
                    MoodMash is an intelligent mood tracking and emotional wellness platform designed to help you 
                    understand, track, and improve your emotional wellbeing through data-driven insights and 
                    personalized recommendations.
                </p>
            </div>
            
            <div class="bg-white rounded-lg shadow-md p-8 mb-6">
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">Current Features (MVP v1.0)</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex items-start">
                        <i class="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                        <div>
                            <h3 class="font-semibold text-gray-700">Mood Logging</h3>
                            <p class="text-sm text-gray-600">Track your emotions with intensity and context</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                        <div>
                            <h3 class="font-semibold text-gray-700">Visual Analytics</h3>
                            <p class="text-sm text-gray-600">Charts and insights about your mood patterns</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                        <div>
                            <h3 class="font-semibold text-gray-700">Wellness Activities</h3>
                            <p class="text-sm text-gray-600">Personalized recommendations based on your mood</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                        <div>
                            <h3 class="font-semibold text-gray-700">Context Tracking</h3>
                            <p class="text-sm text-gray-600">Weather, sleep, activities, and social factors</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-md p-8 mb-6">
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">Future Vision</h2>
                <div class="space-y-3">
                    <div class="flex items-start">
                        <i class="fas fa-rocket text-primary mt-1 mr-3"></i>
                        <div>
                            <h3 class="font-semibold text-gray-700">AI/ML Pattern Recognition</h3>
                            <p class="text-sm text-gray-600">Advanced algorithms to predict mood changes and identify triggers</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-rocket text-primary mt-1 mr-3"></i>
                        <div>
                            <h3 class="font-semibold text-gray-700">Genomics Integration</h3>
                            <p class="text-sm text-gray-600">Personalized wellness based on genetic insights</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-rocket text-primary mt-1 mr-3"></i>
                        <div>
                            <h3 class="font-semibold text-gray-700">Social Features</h3>
                            <p class="text-sm text-gray-600">Mood matching, anonymous messaging, and group challenges</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-rocket text-primary mt-1 mr-3"></i>
                        <div>
                            <h3 class="font-semibold text-gray-700">Professional Integration</h3>
                            <p class="text-sm text-gray-600">Connect with therapists and healthcare providers</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-md p-8">
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">Privacy & Security</h2>
                <p class="text-gray-600">
                    Your emotional and health data is deeply personal. MoodMash is built with privacy-first 
                    principles, using end-to-end encryption and giving you complete control over your data. 
                    As we expand to include genomics and advanced features, we will maintain the highest 
                    standards of data protection and regulatory compliance (GDPR, HIPAA).
                </p>
            </div>
        </div>
    </body>
    </html>
  `);
});

export default app;
