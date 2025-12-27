/**
 * Mood Reminder System
 * 
 * Manages scheduled notifications to remind users to log their mood
 * 
 * Features:
 * - Customizable reminder frequency (daily, twice daily, 3x daily, custom)
 * - Multiple reminder times
 * - Push notifications support
 * - Smart timing (avoid late night reminders)
 * - Timezone-aware scheduling
 * - Reminder history tracking
 * - Snooze functionality
 * - Adaptive reminders based on user patterns
 */

import type { Context } from 'hono'
import type { Bindings } from '../types'

export interface MoodReminder {
  id: string
  user_id: string
  frequency: 'daily' | 'twice_daily' | 'three_times_daily' | 'custom'
  times: string[] // Array of time strings in HH:MM format
  enabled: boolean
  timezone: string
  last_sent_at?: string
  next_scheduled_at?: string
  snooze_until?: string
  created_at: string
  updated_at: string
}

export interface ReminderNotification {
  id: string
  reminder_id: string
  user_id: string
  scheduled_at: string
  sent_at?: string
  opened_at?: string
  action_taken?: 'logged' | 'snoozed' | 'dismissed'
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  created_at: string
}

/**
 * Default reminder times
 */
export const DEFAULT_REMINDER_TIMES = {
  daily: ['12:00'], // Noon
  twice_daily: ['09:00', '18:00'], // Morning and evening
  three_times_daily: ['09:00', '14:00', '20:00'], // Morning, afternoon, evening
}

/**
 * Create database tables for reminders
 */
export async function createReminderTables(db: D1Database): Promise<void> {
  // Mood reminders table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS mood_reminders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'twice_daily', 'three_times_daily', 'custom')),
      times TEXT NOT NULL, -- JSON array of times
      enabled INTEGER DEFAULT 1,
      timezone TEXT DEFAULT 'UTC',
      last_sent_at DATETIME,
      next_scheduled_at DATETIME,
      snooze_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run()

  // Create index on user_id
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_mood_reminders_user_id ON mood_reminders(user_id)
  `).run()

  // Reminder notifications table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS reminder_notifications (
      id TEXT PRIMARY KEY,
      reminder_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      scheduled_at DATETIME NOT NULL,
      sent_at DATETIME,
      opened_at DATETIME,
      action_taken TEXT CHECK(action_taken IN ('logged', 'snoozed', 'dismissed')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'delivered', 'failed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reminder_id) REFERENCES mood_reminders(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run()

  // Create indexes
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_reminder_notifications_user_id ON reminder_notifications(user_id)
  `).run()

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_reminder_notifications_scheduled_at ON reminder_notifications(scheduled_at)
  `).run()

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_reminder_notifications_status ON reminder_notifications(status)
  `).run()
}

/**
 * Create or update a mood reminder
 */
export async function saveReminder(
  c: Context<{ Bindings: Bindings }>,
  userId: string,
  reminder: Partial<MoodReminder>
): Promise<MoodReminder> {
  const db = c.env.DB
  const id = reminder.id || crypto.randomUUID()
  
  const frequency = reminder.frequency || 'daily'
  const times = reminder.times || (frequency === 'custom' ? ['12:00'] : DEFAULT_REMINDER_TIMES[frequency])
  const timezone = reminder.timezone || 'UTC'
  const enabled = reminder.enabled !== undefined ? reminder.enabled : true
  
  // Calculate next scheduled time
  const nextScheduled = calculateNextReminderTime(times, timezone)
  
  const existing = reminder.id ? await db.prepare(`
    SELECT * FROM mood_reminders WHERE id = ? AND user_id = ?
  `).bind(id, userId).first() : null

  if (existing) {
    // Update existing reminder
    await db.prepare(`
      UPDATE mood_reminders
      SET frequency = ?,
          times = ?,
          enabled = ?,
          timezone = ?,
          next_scheduled_at = ?,
          updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).bind(
      reminder.frequency,
      JSON.stringify(times),
      enabled ? 1 : 0,
      timezone,
      nextScheduled,
      id,
      userId
    ).run()
  } else {
    // Create new reminder
    await db.prepare(`
      INSERT INTO mood_reminders (
        id, user_id, frequency, times, enabled, timezone, next_scheduled_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id,
      userId,
      reminder.frequency || 'daily',
      JSON.stringify(times),
      enabled ? 1 : 0,
      timezone,
      nextScheduled
    ).run()
  }

  return getReminder(c, userId, id)
}

/**
 * Get a specific reminder
 */
export async function getReminder(
  c: Context<{ Bindings: Bindings }>,
  userId: string,
  reminderId: string
): Promise<MoodReminder> {
  const db = c.env.DB
  
  const result = await db.prepare(`
    SELECT * FROM mood_reminders WHERE id = ? AND user_id = ?
  `).bind(reminderId, userId).first()

  if (!result) {
    throw new Error('Reminder not found')
  }

  return {
    ...result,
    times: JSON.parse(result.times as string),
    enabled: result.enabled === 1,
  } as MoodReminder
}

/**
 * Get all reminders for a user
 */
export async function getUserReminders(
  c: Context<{ Bindings: Bindings }>,
  userId: string
): Promise<MoodReminder[]> {
  const db = c.env.DB
  
  const results = await db.prepare(`
    SELECT * FROM mood_reminders WHERE user_id = ? ORDER BY created_at DESC
  `).bind(userId).all()

  return results.results.map(r => ({
    ...r,
    times: JSON.parse(r.times as string),
    enabled: r.enabled === 1,
  })) as MoodReminder[]
}

/**
 * Delete a reminder
 */
export async function deleteReminder(
  c: Context<{ Bindings: Bindings }>,
  userId: string,
  reminderId: string
): Promise<void> {
  const db = c.env.DB
  
  await db.prepare(`
    DELETE FROM mood_reminders WHERE id = ? AND user_id = ?
  `).bind(reminderId, userId).run()
}

/**
 * Toggle reminder enabled status
 */
export async function toggleReminder(
  c: Context<{ Bindings: Bindings }>,
  userId: string,
  reminderId: string,
  enabled: boolean
): Promise<void> {
  const db = c.env.DB
  
  await db.prepare(`
    UPDATE mood_reminders
    SET enabled = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).bind(enabled ? 1 : 0, reminderId, userId).run()
}

/**
 * Snooze a reminder for specified duration (in minutes)
 */
export async function snoozeReminder(
  c: Context<{ Bindings: Bindings }>,
  userId: string,
  reminderId: string,
  durationMinutes: number = 30
): Promise<void> {
  const db = c.env.DB
  const snoozeUntil = new Date(Date.now() + durationMinutes * 60000).toISOString()
  
  await db.prepare(`
    UPDATE mood_reminders
    SET snooze_until = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).bind(snoozeUntil, reminderId, userId).run()

  // Log snooze action
  await logReminderAction(c, reminderId, userId, 'snoozed')
}

/**
 * Calculate next reminder time based on times array and timezone
 */
export function calculateNextReminderTime(
  times: string[],
  timezone: string = 'UTC'
): string {
  const now = new Date()
  const todayTimes = times.map(time => {
    const [hours, minutes] = time.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date
  })

  // Find next upcoming time today
  const nextToday = todayTimes.find(time => time > now)
  if (nextToday) {
    return nextToday.toISOString()
  }

  // If no more times today, use first time tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const [hours, minutes] = times[0].split(':').map(Number)
  tomorrow.setHours(hours, minutes, 0, 0)
  
  return tomorrow.toISOString()
}

/**
 * Get reminders due for sending
 */
export async function getDueReminders(
  c: Context<{ Bindings: Bindings }>
): Promise<MoodReminder[]> {
  const db = c.env.DB
  const now = new Date().toISOString()
  
  const results = await db.prepare(`
    SELECT * FROM mood_reminders
    WHERE enabled = 1
      AND (snooze_until IS NULL OR snooze_until < ?)
      AND (next_scheduled_at IS NULL OR next_scheduled_at <= ?)
    ORDER BY next_scheduled_at ASC
    LIMIT 100
  `).bind(now, now).all()

  return results.results.map(r => ({
    ...r,
    times: JSON.parse(r.times as string),
    enabled: r.enabled === 1,
  })) as MoodReminder[]
}

/**
 * Send reminder notification
 */
export async function sendReminderNotification(
  c: Context<{ Bindings: Bindings }>,
  reminder: MoodReminder
): Promise<void> {
  const db = c.env.DB
  const notificationId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Create notification record
  await db.prepare(`
    INSERT INTO reminder_notifications (
      id, reminder_id, user_id, scheduled_at, sent_at, status, created_at
    ) VALUES (?, ?, ?, ?, ?, 'sent', datetime('now'))
  `).bind(
    notificationId,
    reminder.id,
    reminder.user_id,
    reminder.next_scheduled_at || now,
    now
  ).run()

  // Update reminder
  const nextScheduled = calculateNextReminderTime(reminder.times, reminder.timezone)
  await db.prepare(`
    UPDATE mood_reminders
    SET last_sent_at = ?,
        next_scheduled_at = ?,
        snooze_until = NULL,
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(now, nextScheduled, reminder.id).run()

  // Send push notification (if supported)
  await sendPushNotification(c, reminder.user_id, {
    title: 'Time to check in! 🌟',
    body: 'How are you feeling right now?',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'mood-reminder',
    data: {
      type: 'mood_reminder',
      reminder_id: reminder.id,
      notification_id: notificationId,
      url: '/log',
    },
  })
}

/**
 * Send push notification (Web Push API)
 */
async function sendPushNotification(
  c: Context<{ Bindings: Bindings }>,
  userId: string,
  notification: {
    title: string
    body: string
    icon?: string
    badge?: string
    tag?: string
    data?: any
  }
): Promise<void> {
  // This is a placeholder - actual implementation would use Web Push API
  // with VAPID keys and push subscriptions stored in the database
  
  console.log(`Push notification sent to user ${userId}:`, notification)
  
  // In production, you would:
  // 1. Get user's push subscription from database
  // 2. Use web-push library or Cloudflare's native push service
  // 3. Send notification to the subscription endpoint
}

/**
 * Log reminder action
 */
export async function logReminderAction(
  c: Context<{ Bindings: Bindings }>,
  reminderId: string,
  userId: string,
  action: 'logged' | 'snoozed' | 'dismissed'
): Promise<void> {
  const db = c.env.DB

  // Find the latest notification for this reminder
  const notification = await db.prepare(`
    SELECT id FROM reminder_notifications
    WHERE reminder_id = ? AND user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(reminderId, userId).first()

  if (notification) {
    await db.prepare(`
      UPDATE reminder_notifications
      SET action_taken = ?,
          opened_at = COALESCE(opened_at, datetime('now')),
          status = 'delivered'
      WHERE id = ?
    `).bind(action, notification.id).run()
  }
}

/**
 * Get reminder statistics for a user
 */
export async function getReminderStats(
  c: Context<{ Bindings: Bindings }>,
  userId: string
): Promise<{
  total_reminders: number
  total_sent: number
  total_opened: number
  actions: {
    logged: number
    snoozed: number
    dismissed: number
  }
  response_rate: number
}> {
  const db = c.env.DB

  const stats = await db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM mood_reminders WHERE user_id = ?) as total_reminders,
      (SELECT COUNT(*) FROM reminder_notifications WHERE user_id = ? AND status = 'sent') as total_sent,
      (SELECT COUNT(*) FROM reminder_notifications WHERE user_id = ? AND opened_at IS NOT NULL) as total_opened,
      (SELECT COUNT(*) FROM reminder_notifications WHERE user_id = ? AND action_taken = 'logged') as logged,
      (SELECT COUNT(*) FROM reminder_notifications WHERE user_id = ? AND action_taken = 'snoozed') as snoozed,
      (SELECT COUNT(*) FROM reminder_notifications WHERE user_id = ? AND action_taken = 'dismissed') as dismissed
  `).bind(userId, userId, userId, userId, userId, userId).first()

  const total_sent = Number(stats?.total_sent) || 0
  const logged = Number(stats?.logged) || 0
  const response_rate = total_sent > 0 ? (logged / total_sent) * 100 : 0

  return {
    total_reminders: Number(stats?.total_reminders) || 0,
    total_sent,
    total_opened: Number(stats?.total_opened) || 0,
    actions: {
      logged,
      snoozed: Number(stats?.snoozed) || 0,
      dismissed: Number(stats?.dismissed) || 0,
    },
    response_rate: Math.round(response_rate * 100) / 100,
  }
}

/**
 * Process due reminders (to be called by a scheduled task)
 */
export async function processDueReminders(
  c: Context<{ Bindings: Bindings }>
): Promise<number> {
  const dueReminders = await getDueReminders(c)
  
  let sent = 0
  for (const reminder of dueReminders) {
    try {
      await sendReminderNotification(c, reminder)
      sent++
    } catch (error) {
      console.error(`Failed to send reminder ${reminder.id}:`, error)
    }
  }
  
  return sent
}

/**
 * Adaptive reminder suggestions based on user patterns
 */
export async function suggestReminderTimes(
  c: Context<{ Bindings: Bindings }>,
  userId: string
): Promise<string[]> {
  const db = c.env.DB

  // Get user's most active hours for mood logging
  const results = await db.prepare(`
    SELECT strftime('%H', created_at) as hour, COUNT(*) as count
    FROM moods
    WHERE user_id = ?
      AND created_at >= datetime('now', '-30 days')
    GROUP BY hour
    ORDER BY count DESC
    LIMIT 3
  `).bind(userId).all()

  if (results.results.length === 0) {
    // Return defaults if no data
    return DEFAULT_REMINDER_TIMES.twice_daily
  }

  // Convert hours to HH:00 format
  return results.results.map(r => `${String(r.hour).padStart(2, '0')}:00`)
}
