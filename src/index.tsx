import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings, MoodEntry, WellnessActivity, MoodStats, Emotion } from './types';
import { renderHTML, renderLoadingState } from './template';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for API routes
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

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
// MoodMash Service Worker - Version 2.0.0 with i18n fix
const CACHE_NAME = 'moodmash-v2.0.0';
const ASSETS = [
  '/static/styles.css',
  '/static/app.js',
  '/static/log.js',
  '/static/activities.js',
  '/static/i18n.js',
  '/static/utils.js',
  '/static/onboarding.js',
  '/static/chatbot.js',
  '/static/accessibility.js',
  '/static/auth.js'
];

self.addEventListener('install', e => {
  console.log('SW v2.0.0: Installing...');
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  console.log('SW v2.0.0: Activating...');
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
  
  // Network-first for JS files (always get fresh)
  if (e.request.url.includes('/static/') && e.request.url.endsWith('.js')) {
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
  
  // Cache-first for other assets
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
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Log Mood - MoodMash</title>
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
                        <a href="/log" class="text-primary px-3 py-2 rounded-md text-sm font-medium border-b-2 border-primary">Log Mood</a>
                        <a href="/activities" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Activities</a>
                        <a href="/about" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">About</a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div id="app" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Content loaded by log.js -->
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
        <script src="/static/log.js"></script>
    </body>
    </html>
  `);
});

// Activities page
app.get('/activities', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wellness Activities - MoodMash</title>
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
                        <a href="/activities" class="text-primary px-3 py-2 rounded-md text-sm font-medium border-b-2 border-primary">Activities</a>
                        <a href="/about" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">About</a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div id="app" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Content loaded by activities.js -->
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/activities.js"></script>
    </body>
    </html>
  `);
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
