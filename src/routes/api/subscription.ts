/**
 * Subscription API Routes
 * Handles subscription plans, features, usage limits
 */

import { Hono } from 'hono';
import type { Bindings, SubscriptionInfo } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: number;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: PlanFeature[];
}

const subscription = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
subscription.use('*', requireAuth);

// Get current subscription
subscription.get('/', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const sub = await DB.prepare(`
      SELECT * FROM user_subscriptions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(user!.id).first() as SubscriptionInfo | null;

    if (!sub) {
      return c.json({
        subscription: {
          plan: 'free',
          plan_name: 'Free',
          status: 'active',
          features: ['Basic mood tracking', 'Daily insights']
        }
      });
    }

    return c.json({ subscription: sub });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get available plans
subscription.get('/plans', async (c) => {
  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'month',
      features: [
        { name: 'Basic mood tracking', included: true },
        { name: 'Daily insights', included: true },
        { name: 'Mood history (30 days)', included: true, limit: 30 },
        { name: 'AI recommendations', included: false },
        { name: 'Export data', included: false }
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 9.99,
      interval: 'month',
      features: [
        { name: 'Basic mood tracking', included: true },
        { name: 'Daily insights', included: true },
        { name: 'Unlimited mood history', included: true },
        { name: 'AI recommendations', included: true },
        { name: 'Export data', included: true },
        { name: 'Priority support', included: true }
      ]
    },
    {
      id: 'premium_yearly',
      name: 'Premium (Annual)',
      price: 79.99,
      interval: 'year',
      features: [
        { name: 'All Premium features', included: true },
        { name: '2 months free', included: true }
      ]
    }
  ];

  return c.json({ plans });
});

// Subscribe to a plan
subscription.post('/subscribe', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{ plan_id: string; payment_method?: string }>();

    if (!body.plan_id) {
      return c.json({ error: 'Plan ID is required' }, 400);
    }

    // In production, integrate with Stripe/payment provider
    const result = await DB.prepare(`
      INSERT INTO user_subscriptions (user_id, plan, status, start_date)
      VALUES (?, ?, 'active', CURRENT_TIMESTAMP)
    `).bind(user!.id, body.plan_id).run();

    return c.json({
      message: 'Subscription created',
      subscription_id: result.meta.last_row_id
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Cancel subscription
subscription.post('/cancel', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    await DB.prepare(`
      UPDATE user_subscriptions
      SET status = 'cancelled', end_date = CURRENT_TIMESTAMP
      WHERE user_id = ? AND status = 'active'
    `).bind(user!.id).run();

    return c.json({ message: 'Subscription cancelled' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Check if feature is available
subscription.get('/check-feature', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const feature = c.req.query('feature');

  if (!feature) {
    return c.json({ error: 'Feature name is required' }, 400);
  }

  try {
    const sub = await DB.prepare(`
      SELECT plan FROM user_subscriptions
      WHERE user_id = ? AND status = 'active'
    `).bind(user!.id).first() as { plan: string } | null;

    const isPremium = sub && (sub.plan === 'premium' || sub.plan === 'premium_yearly');

    const premiumFeatures = ['ai_recommendations', 'export_data', 'unlimited_history', 'priority_support'];
    const hasFeature = !premiumFeatures.includes(feature) || isPremium;

    return c.json({ feature, available: hasFeature, currentPlan: sub?.plan || 'free' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get usage limits
subscription.get('/usage-limit', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const sub = await DB.prepare(`
      SELECT plan FROM user_subscriptions
      WHERE user_id = ? AND status = 'active'
    `).bind(user!.id).first() as { plan: string } | null;

    const isPremium = sub && (sub.plan === 'premium' || sub.plan === 'premium_yearly');

    const usage = await DB.prepare(`
      SELECT COUNT(*) as count FROM mood_entries
      WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
    `).bind(user!.id).first() as { count: number };

    return c.json({
      currentUsage: usage.count,
      limit: isPremium ? null : 100,
      isPremium
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default subscription;
