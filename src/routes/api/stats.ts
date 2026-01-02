/**
 * Stats and Analytics API Routes
 * Handles mood statistics, insights, and patterns
 */

import { Hono } from 'hono';
import type { Bindings, MoodStats } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

const stats = new Hono<{ Bindings: Bindings }>();

// Apply auth middleware
stats.use('*', requireAuth);

// Get mood statistics
stats.get('/', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const days = parseInt(c.req.query('days') || '30');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all mood entries for the period
  const moods = await DB.prepare(
    'SELECT emotion, intensity, created_at FROM mood_entries WHERE user_id = ? AND created_at >= ? ORDER BY created_at DESC'
  )
    .bind(user!.id, startDate.toISOString())
    .all();

  if (!moods.results || moods.results.length === 0) {
    return c.json({
      total_entries: 0,
      average_intensity: 0,
      most_common_emotion: null,
      emotion_distribution: {},
      intensity_trend: [],
    });
  }

  // Calculate statistics
  const entries = moods.results as any[];
  const totalEntries = entries.length;
  const totalIntensity = entries.reduce((sum: number, m: any) => sum + m.intensity, 0);
  const averageIntensity = totalIntensity / totalEntries;

  // Emotion distribution
  const emotionCounts: Record<string, number> = {};
  entries.forEach((m: any) => {
    emotionCounts[m.emotion] = (emotionCounts[m.emotion] || 0) + 1;
  });

  // Find most common emotion
  const mostCommonEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0][0];

  // Intensity trend (last 7 days)
  const intensityTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayMoods = entries.filter((m: any) => m.created_at.startsWith(dateStr));
    const dayAvg = dayMoods.length > 0
      ? dayMoods.reduce((sum: number, m: any) => sum + m.intensity, 0) / dayMoods.length
      : 0;

    intensityTrend.push({
      date: dateStr,
      average_intensity: Math.round(dayAvg * 10) / 10,
      count: dayMoods.length,
    });
  }

  return c.json({
    total_entries: totalEntries,
    average_intensity: Math.round(averageIntensity * 10) / 10,
    most_common_emotion: mostCommonEmotion,
    emotion_distribution: emotionCounts,
    intensity_trend: intensityTrend,
    period_days: days,
  });
});

// Get insights (AI-powered analysis)
stats.get('/insights', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  // Get recent mood entries
  const moods = await DB.prepare(
    'SELECT * FROM mood_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 30'
  )
    .bind(user!.id)
    .all();

  if (!moods.results || moods.results.length === 0) {
    return c.json({
      insights: ['Start logging your moods to get personalized insights!'],
      patterns: [],
      recommendations: [],
    });
  }

  const entries = moods.results as any[];

  // Simple pattern detection
  const insights = [];
  const patterns = [];
  const recommendations = [];

  // Check for trends
  const recentIntensities = entries.slice(0, 7).map((m: any) => m.intensity);
  const avgRecent = recentIntensities.reduce((a: number, b: number) => a + b, 0) / recentIntensities.length;
  const olderIntensities = entries.slice(7, 14).map((m: any) => m.intensity);
  const avgOlder = olderIntensities.length > 0
    ? olderIntensities.reduce((a: number, b: number) => a + b, 0) / olderIntensities.length
    : avgRecent;

  if (avgRecent > avgOlder + 1) {
    insights.push('Your mood has been improving lately! Keep up the good work! 📈');
  } else if (avgRecent < avgOlder - 1) {
    insights.push('Your mood has been declining. Consider reaching out to a friend or trying a wellness activity. 💙');
    recommendations.push('Talk to someone you trust');
    recommendations.push('Try a relaxing activity like meditation');
  }

  // Check for consistency
  const hasLogged3Days = entries.filter((m: any) => {
    const daysAgo = (Date.now() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 3;
  }).length >= 3;

  if (hasLogged3Days) {
    insights.push('Great job staying consistent with your mood tracking! 🌟');
  }

  // Weather correlation
  const weatherMoods = entries.filter((m: any) => m.weather);
  if (weatherMoods.length > 5) {
    const sunnyMoods = weatherMoods.filter((m: any) => m.weather === 'sunny');
    const rainyMoods = weatherMoods.filter((m: any) => m.weather === 'rainy');

    if (sunnyMoods.length > 0 && rainyMoods.length > 0) {
      const sunnyAvg = sunnyMoods.reduce((sum: number, m: any) => sum + m.intensity, 0) / sunnyMoods.length;
      const rainyAvg = rainyMoods.reduce((sum: number, m: any) => sum + m.intensity, 0) / rainyMoods.length;

      if (sunnyAvg > rainyAvg + 1.5) {
        patterns.push('You tend to feel better on sunny days ☀️');
        recommendations.push('Try to spend time outdoors when possible');
      }
    }
  }

  // Sleep correlation
  const sleepMoods = entries.filter((m: any) => m.sleep_hours !== null);
  if (sleepMoods.length > 5) {
    const goodSleep = sleepMoods.filter((m: any) => m.sleep_hours >= 7);
    const poorSleep = sleepMoods.filter((m: any) => m.sleep_hours < 6);

    if (goodSleep.length > 0 && poorSleep.length > 0) {
      const goodSleepAvg = goodSleep.reduce((sum: number, m: any) => sum + m.intensity, 0) / goodSleep.length;
      const poorSleepAvg = poorSleep.reduce((sum: number, m: any) => sum + m.intensity, 0) / poorSleep.length;

      if (goodSleepAvg > poorSleepAvg + 1) {
        patterns.push('Better sleep is linked to better mood 😴');
        recommendations.push('Maintain a consistent sleep schedule');
      }
    }
  }

  // Social interaction
  const socialMoods = entries.filter((m: any) => m.social_interaction);
  if (socialMoods.length > 5) {
    const highSocial = socialMoods.filter((m: any) => m.social_interaction === 'high');
    const lowSocial = socialMoods.filter((m: any) => m.social_interaction === 'low');

    if (highSocial.length > 0 && lowSocial.length > 0) {
      const highSocialAvg = highSocial.reduce((sum: number, m: any) => sum + m.intensity, 0) / highSocial.length;
      const lowSocialAvg = lowSocial.reduce((sum: number, m: any) => sum + m.intensity, 0) / lowSocial.length;

      if (highSocialAvg > lowSocialAvg + 1) {
        patterns.push('Social connection boosts your mood 🤝');
        recommendations.push('Schedule regular time with friends and family');
      }
    }
  }

  return c.json({
    insights: insights.length > 0 ? insights : ['Keep logging to discover patterns!'],
    patterns,
    recommendations,
  });
});

export default stats;
