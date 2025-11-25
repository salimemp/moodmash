/**
 * Push Notifications Utility
 * Uses Web Push API for browser notifications
 * Supports reminders, mood check-ins, and wellness tips
 */

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Request permission for push notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Push notifications not supported');
  }
  
  const permission = await Notification.requestPermission();
  console.log('[Push] Permission:', permission);
  return permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  vapidPublicKey: string
): Promise<PushSubscriptionData> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications not supported');
  }
  
  // Get service worker registration
  const registration = await navigator.serviceWorker.ready;
  
  // Subscribe to push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });
  
  // Extract subscription data
  const subscriptionJson = subscription.toJSON();
  
  return {
    endpoint: subscriptionJson.endpoint!,
    keys: {
      p256dh: subscriptionJson.keys!.p256dh,
      auth: subscriptionJson.keys!.auth
    }
  };
}

/**
 * Get current push subscription
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }
  
  const registration = await navigator.serviceWorker.ready;
  return await registration.pushManager.getSubscription();
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  const subscription = await getCurrentSubscription();
  if (subscription) {
    return await subscription.unsubscribe();
  }
  return false;
}

/**
 * Show local notification (doesn't require push)
 */
export async function showLocalNotification(
  payload: NotificationPayload
): Promise<void> {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }
  
  if (Notification.permission !== 'granted') {
    throw new Error('Notification permission not granted');
  }
  
  const registration = await navigator.serviceWorker.ready;
  
  await registration.showNotification(payload.title, {
    body: payload.body,
    icon: payload.icon || '/static/icons/icon-192x192.png',
    badge: payload.badge || '/static/icons/badge-72x72.png',
    tag: payload.tag,
    data: payload.data,
    actions: payload.actions,
    vibrate: [200, 100, 200],
    requireInteraction: false
  });
}

/**
 * Schedule daily mood reminder
 */
export function scheduleDailyReminder(hour: number = 20, minute: number = 0) {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hour, minute, 0, 0);
  
  // If time has passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const delay = scheduledTime.getTime() - now.getTime();
  
  setTimeout(() => {
    showLocalNotification({
      title: '🌈 Time to Log Your Mood',
      body: 'How are you feeling today? Take a moment to check in with yourself.',
      tag: 'daily-reminder',
      data: { type: 'daily_reminder', url: '/log' },
      actions: [
        { action: 'log', title: 'Log Mood' },
        { action: 'dismiss', title: 'Later' }
      ]
    }).catch(console.error);
    
    // Schedule next day
    scheduleDailyReminder(hour, minute);
  }, delay);
}

/**
 * Convert VAPID key from URL-safe base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Notification templates
 */
export const NotificationTemplates = {
  moodReminder: (): NotificationPayload => ({
    title: '🌈 Mood Check-In',
    body: 'How are you feeling right now?',
    tag: 'mood-reminder',
    data: { type: 'mood_reminder', url: '/log' },
    actions: [
      { action: 'log', title: 'Log Mood' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  }),
  
  wellnessTip: (tip: string): NotificationPayload => ({
    title: '💡 Wellness Tip',
    body: tip,
    tag: 'wellness-tip',
    data: { type: 'wellness_tip', url: '/wellness-tips' }
  }),
  
  challengeComplete: (challengeName: string): NotificationPayload => ({
    title: '🎉 Challenge Complete!',
    body: `Congratulations! You completed "${challengeName}"`,
    tag: 'challenge-complete',
    data: { type: 'challenge_complete', url: '/challenges' },
    actions: [
      { action: 'view', title: 'View Challenges' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  }),
  
  streakMilestone: (days: number): NotificationPayload => ({
    title: '🔥 Streak Milestone!',
    body: `Amazing! You've logged your mood for ${days} days in a row!`,
    tag: 'streak-milestone',
    data: { type: 'streak_milestone', url: '/insights' }
  })
};
