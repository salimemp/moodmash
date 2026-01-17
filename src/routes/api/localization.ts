import { Hono } from 'hono';
import type { Bindings } from '../../types';

const localization = new Hono<{ Bindings: Bindings }>();

// Supported languages
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false }
];

// GET /api/translations/languages - Get supported languages
localization.get('/languages', (c) => {
  return c.json({ success: true, languages: SUPPORTED_LANGUAGES });
});

// GET /api/translations/:language - Get translations for a language
localization.get('/:language', async (c) => {
  const language = c.req.param('language');
  
  if (!SUPPORTED_LANGUAGES.find(l => l.code === language)) {
    return c.json({ success: false, error: 'Language not supported' }, 400);
  }
  
  try {
    // Try to get from database first
    const dbTranslations = await c.env.DB.prepare(`
      SELECT key, value FROM translations WHERE language = ?
    `).bind(language).all();
    
    if (dbTranslations.results?.length) {
      const translations: Record<string, string> = {};
      dbTranslations.results.forEach((t: any) => {
        translations[t.key] = t.value;
      });
      return c.json({ success: true, language, translations });
    }
    
    // Return empty - client will use static JSON files
    return c.json({
      success: true,
      language,
      translations: {},
      useStatic: true
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch translations' }, 500);
  }
});

// POST /api/preferences/language - Set user language preference
localization.post('/preferences', async (c) => {
  const userId = c.get('userId') as string;
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
  
  const { language, theme, timezone } = await c.req.json();
  
  if (language && !SUPPORTED_LANGUAGES.find(l => l.code === language)) {
    return c.json({ success: false, error: 'Language not supported' }, 400);
  }
  
  try {
    // Upsert user preferences
    await c.env.DB.prepare(`
      INSERT INTO user_preferences (user_id, language, theme, timezone)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        language = COALESCE(?, language),
        theme = COALESCE(?, theme),
        timezone = COALESCE(?, timezone),
        updated_at = datetime('now')
    `).bind(userId, language || 'en', theme || 'system', timezone || 'UTC', language, theme, timezone).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to save preferences' }, 500);
  }
});

// GET /api/preferences - Get user preferences
localization.get('/preferences', async (c) => {
  const userId = c.get('userId') as string;
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
  
  try {
    const prefs = await c.env.DB.prepare(`
      SELECT * FROM user_preferences WHERE user_id = ?
    `).bind(userId).first();
    
    return c.json({
      success: true,
      preferences: prefs || {
        language: 'en',
        theme: 'system',
        timezone: 'UTC',
        notifications_enabled: true,
        voice_enabled: true,
        tts_rate: 1.0,
        accessibility_mode: false
      }
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch preferences' }, 500);
  }
});

export default localization;
