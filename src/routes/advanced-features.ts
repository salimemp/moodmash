import { getErrorMessage, CalendarMoodEntry } from '../types';
/**
 * Advanced Features API Routes
 * Push Notifications, Geolocation, Search, Calendar, Export
 */

import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { buildSearchQuery, buildFilterClause, highlightSearchTerms } from '../utils/search';
import { generateCalendarMonth, populateCalendarWithMoods, generateICalExport } from '../utils/calendar';
import { exportToJSON, exportToCSV, exportToPDFHTML, generateExportFilename, ExportData, ExportMoodEntry } from '../utils/data-export';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// =============================================================================
// PUSH NOTIFICATIONS
// =============================================================================

// Subscribe to push notifications
app.post('/push/subscribe', async (c) => {
  const { DB } = c.env;
  const userId = 1; // TODO: Get from session
  
  try {
    const { endpoint, keys } = await c.req.json();
    
    // Check if subscription already exists
    const existing = await DB.prepare(`
      SELECT id FROM push_subscriptions 
      WHERE user_id = ? AND endpoint = ?
    `).bind(userId, endpoint).first();
    
    if (existing) {
      return c.json({ success: true, message: 'Already subscribed', id: existing.id });
    }
    
    // Insert new subscription
    const result = await DB.prepare(`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      userId,
      endpoint,
      keys.p256dh,
      keys.auth,
      c.req.header('User-Agent') || 'unknown'
    ).run();
    
    return c.json({ 
      success: true, 
      id: result.meta.last_row_id,
      message: 'Successfully subscribed to push notifications'
    });
  } catch (error: unknown) {
    console.error('[Push] Subscribe error:', error);
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Unsubscribe from push notifications
app.post('/push/unsubscribe', async (c) => {
  const { DB } = c.env;
  const userId = 1; // TODO: Get from session
  
  try {
    const { endpoint } = await c.req.json();
    
    await DB.prepare(`
      DELETE FROM push_subscriptions 
      WHERE user_id = ? AND endpoint = ?
    `).bind(userId, endpoint).run();
    
    return c.json({ success: true, message: 'Successfully unsubscribed' });
  } catch (error: unknown) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Get notification preferences
app.get('/push/preferences', async (c) => {
  const { DB } = c.env;
  const userId = 1; // TODO: Get from session
  
  try {
    let prefs = await DB.prepare(`
      SELECT * FROM notification_preferences WHERE user_id = ?
    `).bind(userId).first();
    
    // Create default if doesn't exist
    if (!prefs) {
      await DB.prepare(`
        INSERT INTO notification_preferences (user_id) VALUES (?)
      `).bind(userId).run();
      
      prefs = await DB.prepare(`
        SELECT * FROM notification_preferences WHERE user_id = ?
      `).bind(userId).first();
    }
    
    return c.json({ success: true, preferences: prefs });
  } catch (error: unknown) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Update notification preferences
app.put('/push/preferences', async (c) => {
  const { DB } = c.env;
  const userId = 1; // TODO: Get from session
  
  try {
    const prefs = await c.req.json();
    
    await DB.prepare(`
      UPDATE notification_preferences 
      SET daily_reminder = ?,
          reminder_time = ?,
          wellness_tips = ?,
          challenge_updates = ?,
          streak_milestones = ?,
          social_interactions = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(
      prefs.daily_reminder ? 1 : 0,
      prefs.reminder_time || '20:00',
      prefs.wellness_tips ? 1 : 0,
      prefs.challenge_updates ? 1 : 0,
      prefs.streak_milestones ? 1 : 0,
      prefs.social_interactions ? 1 : 0,
      userId
    ).run();
    
    return c.json({ success: true, message: 'Preferences updated' });
  } catch (error: unknown) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// =============================================================================
// GEOLOCATION
// =============================================================================

// Get location info from Cloudflare headers
app.get('/location/info', async (c) => {
  return c.json({
    city: c.req.header('CF-IPCity'),
    country: c.req.header('CF-IPCountry'),
    timezone: c.req.header('CF-Timezone'),
    latitude: c.req.header('CF-IPLatitude'),
    longitude: c.req.header('CF-IPLongitude')
  });
});

// Save location for mood entry
app.post('/location/save', async (c) => {
  const { DB } = c.env;
  
  try {
    const { mood_entry_id, latitude, longitude, accuracy, city, country, timezone } = await c.req.json();
    
    // Check if location already exists
    const existing = await DB.prepare(`
      SELECT id FROM mood_locations WHERE mood_entry_id = ?
    `).bind(mood_entry_id).first();
    
    if (existing) {
      // Update existing
      await DB.prepare(`
        UPDATE mood_locations 
        SET latitude = ?, longitude = ?, accuracy = ?, city = ?, country = ?, timezone = ?
        WHERE mood_entry_id = ?
      `).bind(latitude, longitude, accuracy, city, country, timezone, mood_entry_id).run();
    } else {
      // Insert new
      await DB.prepare(`
        INSERT INTO mood_locations (mood_entry_id, latitude, longitude, accuracy, city, country, timezone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(mood_entry_id, latitude, longitude, accuracy, city, country, timezone).run();
    }
    
    return c.json({ success: true, message: 'Location saved' });
  } catch (error: unknown) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Get location preferences
app.get('/location/preferences', async (c) => {
  const { DB } = c.env;
  const userId = 1; // TODO: Get from session
  
  try {
    let prefs = await DB.prepare(`
      SELECT * FROM location_preferences WHERE user_id = ?
    `).bind(userId).first();
    
    if (!prefs) {
      await DB.prepare(`
        INSERT INTO location_preferences (user_id) VALUES (?)
      `).bind(userId).run();
      
      prefs = await DB.prepare(`
        SELECT * FROM location_preferences WHERE user_id = ?
      `).bind(userId).first();
    }
    
    return c.json({ success: true, preferences: prefs });
  } catch (error: unknown) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Update location preferences
app.put('/location/preferences', async (c) => {
  const { DB } = c.env;
  const userId = 1; // TODO: Get from session
  
  try {
    const prefs = await c.req.json();
    
    await DB.prepare(`
      UPDATE location_preferences 
      SET location_tracking = ?,
          precision_level = ?,
          share_with_insights = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(
      prefs.location_tracking ? 1 : 0,
      prefs.precision_level || 'city',
      prefs.share_with_insights ? 1 : 0,
      userId
    ).run();
    
    return c.json({ success: true, message: 'Location preferences updated' });
  } catch (error: unknown) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// =============================================================================
// FULL-TEXT SEARCH
// =============================================================================

// Search mood entries
app.post('/search', async (c) => {
  const { DB } = c.env;
  const userId = 1; // TODO: Get from session
  
  try {
    const { query, filters, limit = 50, offset = 0 } = await c.req.json();
    
    if (!query || query.trim().length < 2) {
      return c.json({ error: 'Query must be at least 2 characters' }, 400);
    }
    
    const startTime = Date.now();
    
    // Build FTS5 query
    const ftsQuery = buildSearchQuery(query);
    const filterClause = buildFilterClause(filters);
    
    // Search using FTS5
    const sql = `
      SELECT 
        me.*,
        snippet(mood_entries_fts, 1, '<mark>', '</mark>', '...', 32) as highlight,
        rank
      FROM mood_entries me
      JOIN mood_entries_fts fts ON me.id = fts.rowid
      ${filterClause.clause ? filterClause.clause.replace('WHERE', 'AND') : ''}
      WHERE me.user_id = ? AND fts MATCH ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `;
    
    const results = await DB.prepare(sql).bind(
      userId,
      ...filterClause.params,
      ftsQuery,
      limit,
      offset
    ).all();
    
    const searchTime = Date.now() - startTime;
    
    // Log search
    await DB.prepare(`
      INSERT INTO search_history (user_id, query, results_count)
      VALUES (?, ?, ?)
    `).bind(userId, query, results.results.length).run();
    
    return c.json({
      success: true,
      results: results.results,
      stats: {
        totalResults: results.results.length,
        searchTime,
        query
      }
    });
  } catch (error: unknown) {
    console.error('[Search] Error:', error);
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Get search history
app.get('/search/history', async (c) => {
  const { DB } = c.env;
  const userId = 1; // TODO: Get from session
  
  try {
    const results = await DB.prepare(`
      SELECT query, COUNT(*) as count, MAX(searched_at) as last_searched
      FROM search_history
      WHERE user_id = ?
      GROUP BY query
      ORDER BY last_searched DESC
      LIMIT 10
    `).bind(userId).all();
    
    return c.json({ success: true, history: results.results });
  } catch (error: unknown) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// =============================================================================
// CALENDAR
// =============================================================================

// Get calendar data for a month
app.get('/calendar/:year/:month', async (c) => {
  const { DB } = c.env;
  const userId = 1; // TODO: Get from session
  
  try {
    const year = parseInt(c.req.param('year'));
    const month = parseInt(c.req.param('month'));
    
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return c.json({ error: 'Invalid year or month' }, 400);
    }
    
    // Generate calendar structure
    let calendar = generateCalendarMonth(year, month);
    
    // Get mood entries for the month
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = `${year}-${String(month).padStart(2, '0')}-${calendar.totalDays}`;
    
    const moods = await DB.prepare(`
      SELECT * FROM mood_entries
      WHERE user_id = ? 
        AND DATE(logged_at) >= DATE(?)
        AND DATE(logged_at) <= DATE(?)
      ORDER BY logged_at ASC
    `).bind(userId, firstDay, lastDay).all<CalendarMoodEntry>();
    
    // Populate calendar with moods
    calendar = populateCalendarWithMoods(calendar, moods.results || []);
    
    return c.json({ success: true, calendar });
  } catch (error: unknown) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Export calendar to iCal format
app.get('/calendar/export/ical', async (c) => {
  const { DB } = c.env;
  const userId = 1; // TODO: Get from session
  
  try {
    const dateFrom = c.req.query('from');
    const dateTo = c.req.query('to');
    
    let sql = 'SELECT * FROM mood_entries WHERE user_id = ?';
    const params: (string | number)[] = [userId];
    
    if (dateFrom) {
      sql += ' AND logged_at >= ?';
      params.push(dateFrom);
    }
    
    if (dateTo) {
      sql += ' AND logged_at <= ?';
      params.push(dateTo);
    }
    
    sql += ' ORDER BY logged_at ASC';
    
    const moods = await DB.prepare(sql).bind(...params).all<CalendarMoodEntry>();
    
    const icalContent = generateICalExport(moods.results || []);
    
    return c.text(icalContent, 200, {
      'Content-Type': 'text/calendar',
      'Content-Disposition': 'attachment; filename="moodmash-calendar.ics"'
    });
  } catch (error: unknown) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// =============================================================================
// DATA EXPORT
// =============================================================================

// Export mood data
app.post('/export', async (c) => {
  const { DB } = c.env;
  const userId = 1; // TODO: Get from session
  
  try {
    const { format, dateFrom, dateTo, includeNotes, includeActivities, includeInsights } = await c.req.json();
    
    if (!['json', 'csv', 'pdf'].includes(format)) {
      return c.json({ error: 'Invalid format. Use json, csv, or pdf' }, 400);
    }
    
    // Build query
    let sql = 'SELECT * FROM mood_entries WHERE user_id = ?';
    const params: (string | number)[] = [userId];
    
    if (dateFrom) {
      sql += ' AND logged_at >= ?';
      params.push(dateFrom);
    }
    
    if (dateTo) {
      sql += ' AND logged_at <= ?';
      params.push(dateTo);
    }
    
    sql += ' ORDER BY logged_at DESC';
    
    const moods = await DB.prepare(sql).bind(...params).all<ExportMoodEntry>();
    const moodEntries = moods.results || [];
    
    // Prepare export data
    const exportData: ExportData = {
      user: {
        username: 'user', // TODO: Get from session
        email: 'user@moodmash.win'
      },
      exportDate: new Date().toISOString(),
      dateRange: {
        from: dateFrom || moodEntries[moodEntries.length - 1]?.logged_at || new Date().toISOString(),
        to: dateTo || moodEntries[0]?.logged_at || new Date().toISOString()
      },
      moodEntries,
      activities: includeActivities ? [] : undefined,
      insights: includeInsights ? { averageIntensity: 0, mostFrequentEmotion: '', totalEntries: 0, daysTracked: 0 } : undefined
    };
    
    let content: string;
    let mimeType: string;
    let filename: string;
    
    if (format === 'json') {
      content = exportToJSON(exportData);
      mimeType = 'application/json';
      filename = generateExportFilename('json');
    } else if (format === 'csv') {
      content = exportToCSV(exportData);
      mimeType = 'text/csv';
      filename = generateExportFilename('csv');
    } else {
      content = exportToPDFHTML(exportData);
      mimeType = 'text/html';
      filename = generateExportFilename('html');
    }
    
    // Log export
    await DB.prepare(`
      INSERT INTO export_history (user_id, export_type, date_from, date_to, record_count, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      format,
      dateFrom || null,
      dateTo || null,
      moodEntries.length,
      c.req.header('CF-Connecting-IP') || 'unknown'
    ).run();
    
    return c.text(content, 200, {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`
    });
  } catch (error: unknown) {
    console.error('[Export] Error:', error);
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Get export history
app.get('/export/history', async (c) => {
  const { DB } = c.env;
  const userId = 1; // TODO: Get from session
  
  try {
    const results = await DB.prepare(`
      SELECT * FROM export_history
      WHERE user_id = ?
      ORDER BY exported_at DESC
      LIMIT 20
    `).bind(userId).all();
    
    return c.json({ success: true, history: results.results });
  } catch (error: unknown) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

export default app;
