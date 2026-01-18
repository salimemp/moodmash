import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';

const analytics = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST /api/analytics/event - Track analytics event
analytics.post('/event', async (c) => {
  const userId = c.get('userId') as string;
  const { event_type, event_data, page_url, referrer, session_id } = await c.req.json();
  
  if (!event_type) {
    return c.json({ success: false, error: 'Event type required' }, 400);
  }
  
  try {
    const id = crypto.randomUUID();
    const userAgent = c.req.header('user-agent') || '';
    
    await c.env.DB.prepare(`
      INSERT INTO analytics_events (id, user_id, event_type, event_data, page_url, referrer, user_agent, session_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, userId || null, event_type, JSON.stringify(event_data || {}), page_url, referrer, userAgent, session_id).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to track event' }, 500);
  }
});

// GET /api/analytics/dashboard - Get analytics dashboard (admin only)
analytics.get('/dashboard', async (c) => {
  const userId = c.get('userId') as string;
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
  
  // Check if user is admin (simple check - you might want more robust admin verification)
  const user = await c.env.DB.prepare(`SELECT role FROM users WHERE id = ?`).bind(userId).first();
  if ((user as any)?.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Total users
    const totalUsers = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM users`).first();
    
    // New users today
    const newUsersToday = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE date(created_at) = date('now')
    `).first();
    
    // New users this week
    const newUsersWeek = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-7 days')
    `).first();
    
    // Active users today (based on sessions or events)
    const dauResult = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM analytics_events 
      WHERE date(created_at) = date('now') AND user_id IS NOT NULL
    `).first();
    
    // Monthly active users
    const mauResult = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM analytics_events 
      WHERE created_at >= datetime('now', '-30 days') AND user_id IS NOT NULL
    `).first();
    
    // Total moods logged
    const totalMoods = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM moods`).first();
    
    // Moods logged today
    const moodsToday = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM moods WHERE date(created_at) = date('now')
    `).first();
    
    // Voice journals
    const totalVoiceJournals = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM voice_journals`).first();
    
    // Chatbot conversations
    const totalConversations = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM chatbot_conversations`).first();
    
    // Chatbot messages
    const totalMessages = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM chatbot_messages`).first();
    
    // Daily user growth (last 30 days)
    const userGrowth = await c.env.DB.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count 
      FROM users 
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all();
    
    // Daily moods (last 30 days)
    const moodTrends = await c.env.DB.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count 
      FROM moods 
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all();
    
    // Emotion distribution
    const emotionDistribution = await c.env.DB.prepare(`
      SELECT emotion, COUNT(*) as count 
      FROM moods 
      GROUP BY emotion
      ORDER BY count DESC
    `).all();
    
    // Feature usage
    const featureUsage = await c.env.DB.prepare(`
      SELECT event_type, COUNT(*) as count 
      FROM analytics_events 
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT 10
    `).all();
    
    // Subscription distribution
    const subscriptionDist = await c.env.DB.prepare(`
      SELECT tier_id, COUNT(*) as count 
      FROM user_subscriptions 
      GROUP BY tier_id
    `).all();
    
    // Page views by page
    const pageViews = await c.env.DB.prepare(`
      SELECT page_url, COUNT(*) as count 
      FROM analytics_events 
      WHERE event_type = 'page_view' AND created_at >= datetime('now', '-30 days')
      GROUP BY page_url
      ORDER BY count DESC
      LIMIT 10
    `).all();
    
    return c.json({
      success: true,
      dashboard: {
        overview: {
          totalUsers: (totalUsers as any)?.count || 0,
          newUsersToday: (newUsersToday as any)?.count || 0,
          newUsersWeek: (newUsersWeek as any)?.count || 0,
          dau: (dauResult as any)?.count || 0,
          mau: (mauResult as any)?.count || 0,
          totalMoods: (totalMoods as any)?.count || 0,
          moodsToday: (moodsToday as any)?.count || 0,
          totalVoiceJournals: (totalVoiceJournals as any)?.count || 0,
          totalConversations: (totalConversations as any)?.count || 0,
          totalMessages: (totalMessages as any)?.count || 0
        },
        charts: {
          userGrowth: userGrowth.results || [],
          moodTrends: moodTrends.results || [],
          emotionDistribution: emotionDistribution.results || [],
          featureUsage: featureUsage.results || [],
          subscriptionDist: subscriptionDist.results || [],
          pageViews: pageViews.results || []
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return c.json({ success: false, error: 'Failed to fetch analytics' }, 500);
  }
});

// GET /api/analytics/retention - Get retention metrics
analytics.get('/retention', async (c) => {
  const userId = c.get('userId') as string;
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
  
  const user = await c.env.DB.prepare(`SELECT role FROM users WHERE id = ?`).bind(userId).first();
  if ((user as any)?.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }
  
  try {
    // Weekly retention cohorts
    const cohorts = await c.env.DB.prepare(`
      WITH cohorts AS (
        SELECT 
          strftime('%Y-%W', created_at) as cohort_week,
          id as user_id
        FROM users
        WHERE created_at >= datetime('now', '-8 weeks')
      ),
      activity AS (
        SELECT 
          user_id,
          strftime('%Y-%W', created_at) as activity_week
        FROM analytics_events
        WHERE user_id IS NOT NULL
        GROUP BY user_id, activity_week
      )
      SELECT 
        c.cohort_week,
        COUNT(DISTINCT c.user_id) as cohort_size,
        COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week THEN c.user_id END) as week_0,
        COUNT(DISTINCT CASE WHEN a.activity_week > c.cohort_week THEN c.user_id END) as retained
      FROM cohorts c
      LEFT JOIN activity a ON c.user_id = a.user_id
      GROUP BY c.cohort_week
      ORDER BY c.cohort_week DESC
    `).all();
    
    return c.json({
      success: true,
      retention: {
        cohorts: cohorts.results || []
      }
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch retention' }, 500);
  }
});

export default analytics;
