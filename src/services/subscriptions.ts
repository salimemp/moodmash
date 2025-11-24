/**
 * Subscription & Premium Features Service
 * Version: 10.1 (Premium Features)
 * 
 * Features:
 * - Subscription management
 * - Feature gate checking
 * - Usage tracking
 * - Plan upgrades/downgrades
 */

import type { Bindings } from '../types';

export interface SubscriptionPlan {
  id: number;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_moods_per_month: number;
  max_groups: number;
  max_friends: number;
  is_active: number;
}

export interface UserSubscription {
  id: number;
  user_id: number;
  plan_id: number;
  plan_name: string;
  plan_display_name: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  billing_cycle: 'monthly' | 'yearly' | 'lifetime';
  start_date: string;
  end_date?: string;
  trial_end_date?: string;
  auto_renew: number;
  features: string[];
}

export interface FeatureGateResult {
  allowed: boolean;
  reason?: string;
  current_plan: string;
  required_plan: string;
  upgrade_url?: string;
}

/**
 * Get user's active subscription
 */
export async function getUserSubscription(
  env: Bindings,
  userId: number
): Promise<UserSubscription | null> {
  try {
    const result = await env.DB.prepare(`
      SELECT 
        s.*,
        p.name as plan_name,
        p.display_name as plan_display_name,
        p.features
      FROM user_subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.user_id = ?
        AND s.status IN ('active', 'trial')
        AND (s.end_date IS NULL OR s.end_date > datetime('now'))
      ORDER BY s.created_at DESC
      LIMIT 1
    `)
      .bind(userId)
      .first();

    if (!result) {
      // Return free plan by default
      return await getFreePlanSubscription(env, userId);
    }

    return {
      ...result,
      features: JSON.parse(result.features as string),
    } as UserSubscription;
  } catch (error) {
    console.error('Failed to get user subscription:', error);
    return null;
  }
}

/**
 * Get free plan as default subscription
 */
async function getFreePlanSubscription(
  env: Bindings,
  userId: number
): Promise<UserSubscription> {
  const freePlan = await env.DB.prepare(`
    SELECT * FROM subscription_plans WHERE name = 'free'
  `).first();

  return {
    id: 0,
    user_id: userId,
    plan_id: freePlan?.id as number,
    plan_name: 'free',
    plan_display_name: 'Free',
    status: 'active',
    billing_cycle: 'lifetime',
    start_date: new Date().toISOString(),
    auto_renew: 0,
    features: JSON.parse((freePlan?.features as string) || '[]'),
  };
}

/**
 * Check if user has access to a feature
 */
export async function checkFeatureAccess(
  env: Bindings,
  userId: number,
  featureId: string
): Promise<FeatureGateResult> {
  try {
    // Get user's subscription
    const subscription = await getUserSubscription(env, userId);
    if (!subscription) {
      return {
        allowed: false,
        reason: 'No active subscription',
        current_plan: 'none',
        required_plan: 'free',
      };
    }

    // Check if feature is in user's plan
    if (subscription.features.includes(featureId)) {
      return {
        allowed: true,
        current_plan: subscription.plan_name,
        required_plan: subscription.plan_name,
      };
    }

    // Get required plan for feature
    const feature = await env.DB.prepare(`
      SELECT required_plan FROM premium_features WHERE feature_id = ?
    `)
      .bind(featureId)
      .first();

    return {
      allowed: false,
      reason: `This feature requires ${feature?.required_plan || 'a premium'} plan`,
      current_plan: subscription.plan_name,
      required_plan: (feature?.required_plan as string) || 'premium',
      upgrade_url: '/subscription',
    };
  } catch (error) {
    console.error('Failed to check feature access:', error);
    return {
      allowed: false,
      reason: 'Error checking access',
      current_plan: 'unknown',
      required_plan: 'premium',
    };
  }
}

/**
 * Track feature usage
 */
export async function trackFeatureUsage(
  env: Bindings,
  userId: number,
  featureId: string
): Promise<void> {
  try {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO feature_usage (user_id, feature_id, usage_count, month, last_used_at)
      VALUES (?, ?, 1, ?, ?)
      ON CONFLICT(user_id, feature_id, month)
      DO UPDATE SET 
        usage_count = usage_count + 1,
        last_used_at = ?
    `)
      .bind(userId, featureId, month, now, now)
      .run();
  } catch (error) {
    console.error('Failed to track feature usage:', error);
  }
}

/**
 * Check usage limits
 */
export async function checkUsageLimit(
  env: Bindings,
  userId: number,
  limitType: 'moods' | 'groups' | 'friends'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  try {
    const subscription = await getUserSubscription(env, userId);
    if (!subscription) {
      return { allowed: false, current: 0, limit: 0 };
    }

    // Get current usage
    const month = new Date().toISOString().slice(0, 7);
    let current = 0;
    let limit = 0;

    if (limitType === 'moods') {
      const result = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM moods
        WHERE user_id = ?
          AND strftime('%Y-%m', logged_at) = ?
      `)
        .bind(userId, month)
        .first();
      current = result?.count as number || 0;
      
      const plan = await env.DB.prepare(`
        SELECT max_moods_per_month FROM subscription_plans WHERE id = ?
      `).bind(subscription.plan_id).first();
      limit = plan?.max_moods_per_month as number || 50;
    } else if (limitType === 'groups') {
      const result = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM group_members
        WHERE user_id = ?
      `)
        .bind(userId)
        .first();
      current = result?.count as number || 0;
      
      const plan = await env.DB.prepare(`
        SELECT max_groups FROM subscription_plans WHERE id = ?
      `).bind(subscription.plan_id).first();
      limit = plan?.max_groups as number || 3;
    } else if (limitType === 'friends') {
      const result = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM friend_connections
        WHERE (user_id = ? OR friend_id = ?)
          AND status = 'accepted'
      `)
        .bind(userId, userId)
        .first();
      current = result?.count as number || 0;
      
      const plan = await env.DB.prepare(`
        SELECT max_friends FROM subscription_plans WHERE id = ?
      `).bind(subscription.plan_id).first();
      limit = plan?.max_friends as number || 20;
    }

    return {
      allowed: limit === -1 || current < limit,
      current,
      limit,
    };
  } catch (error) {
    console.error('Failed to check usage limit:', error);
    return { allowed: false, current: 0, limit: 0 };
  }
}

/**
 * Get all subscription plans
 */
export async function getSubscriptionPlans(
  env: Bindings
): Promise<SubscriptionPlan[]> {
  try {
    const result = await env.DB.prepare(`
      SELECT * FROM subscription_plans
      WHERE is_active = 1
      ORDER BY price_monthly ASC
    `).all();

    return (result.results || []).map((plan: any) => ({
      ...plan,
      features: JSON.parse(plan.features),
    }));
  } catch (error) {
    console.error('Failed to get subscription plans:', error);
    return [];
  }
}

/**
 * Create or upgrade subscription
 */
export async function createSubscription(
  env: Bindings,
  userId: number,
  planId: number,
  billingCycle: 'monthly' | 'yearly',
  paymentMethod?: string
): Promise<UserSubscription | null> {
  try {
    const now = new Date().toISOString();
    const startDate = now;
    const endDate = billingCycle === 'monthly'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // Cancel existing subscriptions
    await env.DB.prepare(`
      UPDATE user_subscriptions
      SET status = 'cancelled', updated_at = ?
      WHERE user_id = ? AND status = 'active'
    `)
      .bind(now, userId)
      .run();

    // Create new subscription
    const result = await env.DB.prepare(`
      INSERT INTO user_subscriptions (
        user_id, plan_id, status, billing_cycle,
        start_date, end_date, auto_renew, payment_method,
        created_at, updated_at
      ) VALUES (?, ?, 'active', ?, ?, ?, 1, ?, ?, ?)
    `)
      .bind(userId, planId, billingCycle, startDate, endDate, paymentMethod, now, now)
      .run();

    if (result.success) {
      return await getUserSubscription(env, userId);
    }

    return null;
  } catch (error) {
    console.error('Failed to create subscription:', error);
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  env: Bindings,
  userId: number
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    await env.DB.prepare(`
      UPDATE user_subscriptions
      SET status = 'cancelled', auto_renew = 0, updated_at = ?
      WHERE user_id = ? AND status = 'active'
    `)
      .bind(now, userId)
      .run();

    return true;
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    return false;
  }
}

/**
 * Get subscription stats for user
 */
export async function getSubscriptionStats(
  env: Bindings,
  userId: number
): Promise<any> {
  try {
    const subscription = await getUserSubscription(env, userId);
    if (!subscription) {
      return null;
    }

    // Get usage stats
    const moodUsage = await checkUsageLimit(env, userId, 'moods');
    const groupUsage = await checkUsageLimit(env, userId, 'groups');
    const friendUsage = await checkUsageLimit(env, userId, 'friends');

    // Get feature usage this month
    const month = new Date().toISOString().slice(0, 7);
    const featureUsage = await env.DB.prepare(`
      SELECT feature_id, usage_count
      FROM feature_usage
      WHERE user_id = ? AND month = ?
      ORDER BY usage_count DESC
    `)
      .bind(userId, month)
      .all();

    return {
      subscription,
      usage: {
        moods: moodUsage,
        groups: groupUsage,
        friends: friendUsage,
      },
      feature_usage: featureUsage.results || [],
      available_features: subscription.features,
    };
  } catch (error) {
    console.error('Failed to get subscription stats:', error);
    return null;
  }
}
