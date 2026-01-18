import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';

const subscription = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Tier definitions with limits
const TIER_LIMITS = {
  free: {
    moods_per_month: 30,
    friends: 5,
    groups: 2,
    voice_journals: 0,
    ai_messages: 0
  },
  pro: {
    moods_per_month: -1, // unlimited
    friends: 50,
    groups: 10,
    voice_journals: 20,
    ai_messages: 50
  },
  premium: {
    moods_per_month: -1,
    friends: -1,
    groups: -1,
    voice_journals: -1,
    ai_messages: -1
  }
};

// GET /api/subscription/tiers - Get all subscription tiers
subscription.get('/tiers', async (c) => {
  try {
    const tiers = await c.env.DB.prepare(`
      SELECT id, name, description, features, limits, price_monthly, price_yearly
      FROM subscription_tiers
      WHERE is_active = 1
      ORDER BY price_monthly ASC
    `).all();
    
    const formattedTiers = tiers.results?.map((tier: any) => ({
      ...tier,
      features: JSON.parse(tier.features || '[]'),
      limits: JSON.parse(tier.limits || '{}')
    })) || [];
    
    return c.json({ success: true, tiers: formattedTiers });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch tiers' }, 500);
  }
});

// GET /api/subscription/current - Get user's current subscription
subscription.get('/current', async (c) => {
  const userId = c.get('userId') as string;
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
  
  try {
    // Get or create user subscription (default to free)
    let sub = await c.env.DB.prepare(`
      SELECT us.*, st.name as tier_name, st.features, st.limits
      FROM user_subscriptions us
      JOIN subscription_tiers st ON us.tier_id = st.id
      WHERE us.user_id = ?
    `).bind(userId).first();
    
    if (!sub) {
      // Create default free subscription
      await c.env.DB.prepare(`
        INSERT INTO user_subscriptions (user_id, tier_id) VALUES (?, 'free')
      `).bind(userId).run();
      
      sub = await c.env.DB.prepare(`
        SELECT us.*, st.name as tier_name, st.features, st.limits
        FROM user_subscriptions us
        JOIN subscription_tiers st ON us.tier_id = st.id
        WHERE us.user_id = ?
      `).bind(userId).first();
    }
    
    return c.json({
      success: true,
      subscription: {
        ...sub,
        features: JSON.parse((sub as any).features || '[]'),
        limits: JSON.parse((sub as any).limits || '{}')
      }
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch subscription' }, 500);
  }
});

// GET /api/usage/current - Get user's current usage
subscription.get('/usage', async (c) => {
  const userId = c.get('userId') as string;
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  try {
    // Get or create usage record
    let usage = await c.env.DB.prepare(`
      SELECT * FROM usage_tracking WHERE user_id = ? AND month = ?
    `).bind(userId, currentMonth).first();
    
    if (!usage) {
      await c.env.DB.prepare(`
        INSERT INTO usage_tracking (user_id, month) VALUES (?, ?)
      `).bind(userId, currentMonth).run();
      
      usage = {
        moods_count: 0,
        friends_count: 0,
        groups_count: 0,
        voice_journals_count: 0,
        ai_messages_count: 0
      };
    }
    
    // Get user's tier limits
    const sub = await c.env.DB.prepare(`
      SELECT st.limits
      FROM user_subscriptions us
      JOIN subscription_tiers st ON us.tier_id = st.id
      WHERE us.user_id = ?
    `).bind(userId).first();
    
    const limits = sub ? JSON.parse((sub as any).limits || '{}') : TIER_LIMITS.free;
    
    return c.json({
      success: true,
      usage: {
        month: currentMonth,
        moods: { used: (usage as any).moods_count || 0, limit: limits.moods_per_month },
        friends: { used: (usage as any).friends_count || 0, limit: limits.friends },
        groups: { used: (usage as any).groups_count || 0, limit: limits.groups },
        voice_journals: { used: (usage as any).voice_journals_count || 0, limit: limits.voice_journals },
        ai_messages: { used: (usage as any).ai_messages_count || 0, limit: limits.ai_messages }
      }
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch usage' }, 500);
  }
});

// POST /api/subscription/check-limit - Check if user can perform action
subscription.post('/check-limit', async (c) => {
  const userId = c.get('userId') as string;
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
  
  const { action } = await c.req.json();
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  try {
    const usage = await c.env.DB.prepare(`
      SELECT * FROM usage_tracking WHERE user_id = ? AND month = ?
    `).bind(userId, currentMonth).first();
    
    const sub = await c.env.DB.prepare(`
      SELECT st.limits FROM user_subscriptions us
      JOIN subscription_tiers st ON us.tier_id = st.id
      WHERE us.user_id = ?
    `).bind(userId).first();
    
    const limits = sub ? JSON.parse((sub as any).limits || '{}') : TIER_LIMITS.free;
    
    const actionMap: Record<string, { usageKey: string; limitKey: string }> = {
      mood: { usageKey: 'moods_count', limitKey: 'moods_per_month' },
      friend: { usageKey: 'friends_count', limitKey: 'friends' },
      group: { usageKey: 'groups_count', limitKey: 'groups' },
      voice_journal: { usageKey: 'voice_journals_count', limitKey: 'voice_journals' },
      ai_message: { usageKey: 'ai_messages_count', limitKey: 'ai_messages' }
    };
    
    const mapping = actionMap[action];
    if (!mapping) return c.json({ success: false, error: 'Invalid action' }, 400);
    
    const currentUsage = usage ? (usage as any)[mapping.usageKey] || 0 : 0;
    const limit = limits[mapping.limitKey];
    
    const allowed = limit === -1 || currentUsage < limit;
    
    return c.json({
      success: true,
      allowed,
      current: currentUsage,
      limit: limit === -1 ? 'unlimited' : limit,
      message: allowed ? null : `You've reached your ${action} limit. Upgrade to continue!`
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to check limit' }, 500);
  }
});

// POST /api/subscription/increment - Increment usage counter
subscription.post('/increment', async (c) => {
  const userId = c.get('userId') as string;
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
  
  const { action } = await c.req.json();
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const columnMap: Record<string, string> = {
    mood: 'moods_count',
    friend: 'friends_count',
    group: 'groups_count',
    voice_journal: 'voice_journals_count',
    ai_message: 'ai_messages_count'
  };
  
  const column = columnMap[action];
  if (!column) return c.json({ success: false, error: 'Invalid action' }, 400);
  
  try {
    // Ensure usage record exists
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO usage_tracking (user_id, month) VALUES (?, ?)
    `).bind(userId, currentMonth).run();
    
    // Increment counter
    await c.env.DB.prepare(`
      UPDATE usage_tracking SET ${column} = ${column} + 1, updated_at = datetime('now')
      WHERE user_id = ? AND month = ?
    `).bind(userId, currentMonth).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to increment usage' }, 500);
  }
});

export default subscription;
