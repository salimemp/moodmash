/**
 * Premium Feature Gate Middleware
 * Version: 10.1 (Premium Features)
 * 
 * Middleware to protect premium features and check subscriptions
 */

import type { Context, Next } from 'hono';
import type { Bindings, Variables } from '../types';
import { checkFeatureAccess, trackFeatureUsage, checkUsageLimit } from '../services/subscriptions';

/**
 * Middleware to require a specific feature access
 */
export function requireFeature(featureId: string) {
  return async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
    try {
      // Get user ID from session/token (simplified - you should get from actual auth)
      const userId = parseInt(c.req.header('X-User-ID') || '1');

      // Check feature access
      const access = await checkFeatureAccess(c.env, userId, featureId);

      if (!access.allowed) {
        return c.json({
          error: 'Premium feature required',
          message: access.reason,
          current_plan: access.current_plan,
          required_plan: access.required_plan,
          upgrade_url: access.upgrade_url || '/subscription',
        }, 403);
      }

      // Track feature usage
      await trackFeatureUsage(c.env, userId, featureId);

      await next();
    } catch (error) {
      console.error('Feature gate error:', error);
      return c.json({ error: 'Failed to check feature access' }, 500);
    }
  };
}

/**
 * Middleware to check usage limits
 */
export function requireUsageLimit(limitType: 'moods' | 'groups' | 'friends') {
  return async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
    try {
      const userId = parseInt(c.req.header('X-User-ID') || '1');

      const usage = await checkUsageLimit(c.env, userId, limitType);

      if (!usage.allowed) {
        return c.json({
          error: 'Usage limit reached',
          message: `You've reached your ${limitType} limit for this month`,
          current: usage.current,
          limit: usage.limit,
          upgrade_url: '/subscription',
        }, 403);
      }

      await next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      return c.json({ error: 'Failed to check usage limit' }, 500);
    }
  };
}

/**
 * Middleware to add premium status to response
 */
export async function addPremiumContext(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) {
  try {
    const userId = parseInt(c.req.header('X-User-ID') || '1');

    // Import getUserSubscription dynamically
    const { getUserSubscription } = await import('../services/subscriptions');
    const subscription = await getUserSubscription(c.env, userId);

    // Add to context
    c.set('subscription', subscription);
    c.set('isPremium', subscription?.plan_name === 'premium' || subscription?.plan_name === 'enterprise');

    await next();
  } catch (error) {
    console.error('Premium context error:', error);
    await next();
  }
}

/**
 * Feature configuration
 */
export const PREMIUM_FEATURES = {
  // Free features
  MOOD_TRACKING: 'mood_tracking',
  BASIC_INSIGHTS: 'basic_insights',
  WELLNESS_TIPS: 'wellness_tips',

  // Basic plan features
  ADVANCED_INSIGHTS: 'advanced_insights',
  HEALTH_METRICS: 'health_metrics',
  DATA_EXPORT: 'data_export',
  SOCIAL_FEED: 'social_feed',

  // Premium plan features
  AI_INSIGHTS: 'ai_insights',
  MOOD_GROUPS: 'mood_groups',
  RESEARCH_DATA: 'research_data',
  PRIORITY_SUPPORT: 'priority_support',

  // Enterprise features
  TEAM_DASHBOARD: 'team_dashboard',
  API_ACCESS: 'api_access',
  WHITE_LABEL: 'white_label',
};

/**
 * Plan hierarchy
 */
export const PLAN_LEVELS = {
  free: 0,
  basic: 1,
  premium: 2,
  enterprise: 3,
};

/**
 * Check if plan has access to feature
 */
export function planHasFeature(planName: string, featurePlan: string): boolean {
  const planLevel = PLAN_LEVELS[planName as keyof typeof PLAN_LEVELS] || 0;
  const featureLevel = PLAN_LEVELS[featurePlan as keyof typeof PLAN_LEVELS] || 0;
  return planLevel >= featureLevel;
}
