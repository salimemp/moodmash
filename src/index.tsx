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

const app = new Hono<{ Bindings: Bindings }>();

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

// About page
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
