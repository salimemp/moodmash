/**
 * Feature Flags System for MoodMash
 * Enables A/B testing, gradual rollouts, and kill switches
 */

import type { Context } from 'hono';

export interface FeatureFlag {
  id: number;
  flag_name: string;
  description: string;
  enabled: boolean;
  rollout_percentage: number;
  target_user_ids: string; // JSON array
  target_segments: string; // JSON array
  target_countries: string; // JSON array
  environment: string;
  category: string;
  tags: string; // JSON array
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  start_date: string | null;
  end_date: string | null;
  impressions_count: number;
  enabled_count: number;
}

export interface FeatureFlagCheck {
  flagName: string;
  enabled: boolean;
  reason: string;
}

/**
 * Check if a feature flag is enabled for a specific user
 */
export async function isFeatureEnabled(
  c: Context,
  flagName: string,
  userId?: number,
  options?: {
    sessionId?: string;
    country?: string;
    segment?: string;
  }
): Promise<boolean> {
  try {
    const db = c.env.DB;
    const environment = c.env.ENVIRONMENT || 'production';

    // Get the feature flag
    const flag = await db.prepare(`
      SELECT * FROM feature_flags 
      WHERE flag_name = ? 
      AND (environment = ? OR environment = 'all')
      LIMIT 1
    `).bind(flagName, environment).first<FeatureFlag>();

    if (!flag) {
      // Flag doesn't exist, default to false
      return false;
    }

    // Check if flag is disabled globally
    if (!flag.enabled) {
      await logFlagEvaluation(c, flag.id, flagName, userId, false, 'globally_disabled');
      return false;
    }

    // Check scheduling (start_date and end_date)
    const now = new Date();
    if (flag.start_date && new Date(flag.start_date) > now) {
      await logFlagEvaluation(c, flag.id, flagName, userId, false, 'not_started');
      return false;
    }
    if (flag.end_date && new Date(flag.end_date) < now) {
      await logFlagEvaluation(c, flag.id, flagName, userId, false, 'expired');
      return false;
    }

    // Check user-specific override first
    if (userId) {
      const override = await db.prepare(`
        SELECT * FROM feature_flag_overrides 
        WHERE flag_id = ? AND user_id = ?
        AND (expires_at IS NULL OR expires_at > datetime('now'))
        LIMIT 1
      `).bind(flag.id, userId).first();

      if (override) {
        const enabled = !!override.enabled;
        await logFlagEvaluation(c, flag.id, flagName, userId, enabled, 'user_override');
        return enabled;
      }
    }

    // Check if user is in target_user_ids
    if (userId && flag.target_user_ids) {
      try {
        const targetIds: number[] = JSON.parse(flag.target_user_ids);
        if (targetIds.includes(userId)) {
          await logFlagEvaluation(c, flag.id, flagName, userId, true, 'target_user');
          return true;
        }
      } catch (e) {
        console.error('Error parsing target_user_ids:', e);
      }
    }

    // Check if user segment matches
    if (options?.segment && flag.target_segments) {
      try {
        const targetSegments: string[] = JSON.parse(flag.target_segments);
        if (targetSegments.includes(options.segment)) {
          await logFlagEvaluation(c, flag.id, flagName, userId, true, 'target_segment');
          return true;
        }
      } catch (e) {
        console.error('Error parsing target_segments:', e);
      }
    }

    // Check if country matches
    if (options?.country && flag.target_countries) {
      try {
        const targetCountries: string[] = JSON.parse(flag.target_countries);
        if (targetCountries.includes(options.country)) {
          await logFlagEvaluation(c, flag.id, flagName, userId, true, 'target_country');
          return true;
        }
      } catch (e) {
        console.error('Error parsing target_countries:', e);
      }
    }

    // Check rollout percentage (hash-based for consistent results per user)
    if (flag.rollout_percentage === 100) {
      await logFlagEvaluation(c, flag.id, flagName, userId, true, 'full_rollout');
      return true;
    }

    if (flag.rollout_percentage === 0) {
      await logFlagEvaluation(c, flag.id, flagName, userId, false, 'no_rollout');
      return false;
    }

    // Use consistent hash-based rollout
    const identifier = userId?.toString() || options?.sessionId || Math.random().toString();
    const hash = simpleHash(identifier + flagName);
    const bucket = hash % 100;
    const enabled = bucket < flag.rollout_percentage;

    await logFlagEvaluation(c, flag.id, flagName, userId, enabled, `rollout_${flag.rollout_percentage}%`);
    return enabled;

  } catch (error) {
    console.error(`Error checking feature flag ${flagName}:`, error);
    return false; // Fail closed
  }
}

/**
 * Get multiple feature flags at once
 */
export async function getFeatureFlags(
  c: Context,
  flagNames: string[],
  userId?: number,
  options?: {
    sessionId?: string;
    country?: string;
    segment?: string;
  }
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  for (const flagName of flagNames) {
    results[flagName] = await isFeatureEnabled(c, flagName, userId, options);
  }

  return results;
}

/**
 * Get all enabled feature flags for a user
 */
export async function getAllEnabledFlags(
  c: Context,
  userId?: number,
  options?: {
    sessionId?: string;
    country?: string;
    segment?: string;
  }
): Promise<string[]> {
  try {
    const db = c.env.DB;
    const environment = c.env.ENVIRONMENT || 'production';

    // Get all enabled flags
    const flags = await db.prepare(`
      SELECT flag_name FROM feature_flags 
      WHERE enabled = 1 
      AND (environment = ? OR environment = 'all')
    `).bind(environment).all<{ flag_name: string }>();

    const enabledFlags: string[] = [];

    for (const flag of flags.results) {
      const enabled = await isFeatureEnabled(c, flag.flag_name, userId, options);
      if (enabled) {
        enabledFlags.push(flag.flag_name);
      }
    }

    return enabledFlags;
  } catch (error) {
    console.error('Error getting all enabled flags:', error);
    return [];
  }
}

/**
 * Log feature flag evaluation for analytics
 */
async function logFlagEvaluation(
  c: Context,
  flagId: number,
  flagName: string,
  userId: number | undefined,
  enabled: boolean,
  reason: string
): Promise<void> {
  try {
    const db = c.env.DB;
    const ipAddress = c.req.header('cf-connecting-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    const sessionId = c.req.header('x-session-id') || null;

    // Log the evaluation event (non-blocking)
    await db.prepare(`
      INSERT INTO feature_flag_events (
        flag_id, flag_name, event_type, user_id, flag_enabled,
        ip_address, user_agent, session_id, created_at
      ) VALUES (?, ?, 'evaluated', ?, ?, ?, ?, ?, datetime('now'))
    `).bind(flagId, flagName, userId || null, enabled ? 1 : 0, ipAddress, userAgent, sessionId).run();

    // Update flag statistics
    await db.prepare(`
      UPDATE feature_flags 
      SET impressions_count = impressions_count + 1,
          enabled_count = enabled_count + ?
      WHERE id = ?
    `).bind(enabled ? 1 : 0, flagId).run();

  } catch (error) {
    // Don't throw - logging failures shouldn't break the app
    console.error('Error logging flag evaluation:', error);
  }
}

/**
 * Simple hash function for consistent percentage-based rollouts
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Create or update a feature flag
 */
export async function upsertFeatureFlag(
  c: Context,
  flag: {
    flag_name: string;
    description?: string;
    enabled: boolean;
    rollout_percentage: number;
    target_user_ids?: number[];
    target_segments?: string[];
    target_countries?: string[];
    environment?: string;
    category?: string;
    tags?: string[];
    start_date?: string;
    end_date?: string;
  },
  userId: number
): Promise<FeatureFlag> {
  const db = c.env.DB;

  const result = await db.prepare(`
    INSERT INTO feature_flags (
      flag_name, description, enabled, rollout_percentage,
      target_user_ids, target_segments, target_countries,
      environment, category, tags, start_date, end_date,
      created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(flag_name) DO UPDATE SET
      description = excluded.description,
      enabled = excluded.enabled,
      rollout_percentage = excluded.rollout_percentage,
      target_user_ids = excluded.target_user_ids,
      target_segments = excluded.target_segments,
      target_countries = excluded.target_countries,
      environment = excluded.environment,
      category = excluded.category,
      tags = excluded.tags,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      updated_by = excluded.updated_by,
      updated_at = datetime('now')
  `).bind(
    flag.flag_name,
    flag.description || null,
    flag.enabled ? 1 : 0,
    flag.rollout_percentage,
    flag.target_user_ids ? JSON.stringify(flag.target_user_ids) : null,
    flag.target_segments ? JSON.stringify(flag.target_segments) : null,
    flag.target_countries ? JSON.stringify(flag.target_countries) : null,
    flag.environment || 'production',
    flag.category || 'feature',
    flag.tags ? JSON.stringify(flag.tags) : null,
    flag.start_date || null,
    flag.end_date || null,
    userId,
    userId
  ).run();

  // Get the created/updated flag
  const createdFlag = await db.prepare(`
    SELECT * FROM feature_flags WHERE flag_name = ?
  `).bind(flag.flag_name).first<FeatureFlag>();

  // Log the event
  await db.prepare(`
    INSERT INTO feature_flag_events (
      flag_id, flag_name, event_type, user_id, created_at
    ) VALUES (?, ?, ?, ?, datetime('now'))
  `).bind(createdFlag!.id, flag.flag_name, result.meta.changes > 0 ? 'updated' : 'created', userId).run();

  return createdFlag!;
}

/**
 * Delete a feature flag
 */
export async function deleteFeatureFlag(
  c: Context,
  flagName: string,
  userId: number
): Promise<boolean> {
  const db = c.env.DB;

  const flag = await db.prepare(`
    SELECT id FROM feature_flags WHERE flag_name = ?
  `).bind(flagName).first<{ id: number }>();

  if (!flag) return false;

  // Log deletion event
  await db.prepare(`
    INSERT INTO feature_flag_events (
      flag_id, flag_name, event_type, user_id, created_at
    ) VALUES (?, ?, 'deleted', ?, datetime('now'))
  `).bind(flag.id, flagName, userId).run();

  // Delete the flag
  await db.prepare(`
    DELETE FROM feature_flags WHERE flag_name = ?
  `).bind(flagName).run();

  return true;
}
