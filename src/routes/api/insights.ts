// Mood Insights & Analytics API
import { Hono } from 'hono';
import type { Env, Variables, MoodEntry, MoodAnalytics, MoodTrend, VoiceJournal } from '../../types';
import { getCurrentUser } from '../../middleware/auth';
import { generateMoodInsights } from '../../services/gemini';

const insights = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get mood analytics/insights
insights.get('/api/insights', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const period = c.req.query('period') || '7d'; // 7d, 30d, 90d
  
  let daysBack = 7;
  if (period === '30d') daysBack = 30;
  else if (period === '90d') daysBack = 90;

  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  // Get moods for period
  const moodsResult = await c.env.DB.prepare(
    `SELECT id, user_id, emotion, intensity, notes, logged_at, created_at 
     FROM mood_entries 
     WHERE user_id = ? AND logged_at >= ? AND logged_at <= ?
     ORDER BY logged_at ASC`
  ).bind(user.id, startDate, now).all<MoodEntry>();
  
  const moods = moodsResult.results || [];

  // Get voice journals for AI context
  const journalsResult = await c.env.DB.prepare(
    `SELECT * FROM voice_journals 
     WHERE user_id = ? AND created_at >= ?
     ORDER BY created_at DESC LIMIT 10`
  ).bind(user.id, startDate).all<VoiceJournal>();
  
  const voiceJournals = journalsResult.results || [];

  // Calculate analytics
  const analytics = calculateAnalytics(moods, daysBack);

  // Get AI insights if configured
  if (c.env.GEMINI_API_KEY && moods.length >= 3) {
    const aiInsights = await generateMoodInsights(
      c.env.GEMINI_API_KEY,
      moods,
      voiceJournals
    );
    analytics.insights = [...analytics.insights, ...aiInsights];
  }

  return c.json(analytics);
});

// Get weekly trends
insights.get('/api/insights/trends', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const weeks = parseInt(c.req.query('weeks') || '4');
  const startDate = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString();

  const moodsResult = await c.env.DB.prepare(
    `SELECT emotion, intensity, logged_at 
     FROM mood_entries 
     WHERE user_id = ? AND logged_at >= ?
     ORDER BY logged_at ASC`
  ).bind(user.id, startDate).all<MoodEntry>();
  
  const moods = moodsResult.results || [];
  const weeklyTrends = calculateWeeklyTrends(moods, weeks);

  return c.json({ trends: weeklyTrends });
});

// Get emotion distribution
insights.get('/api/insights/emotions', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const period = c.req.query('period') || '30d';
  let daysBack = 30;
  if (period === '7d') daysBack = 7;
  else if (period === '90d') daysBack = 90;

  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  const result = await c.env.DB.prepare(
    `SELECT emotion, COUNT(*) as count, AVG(intensity) as avg_intensity
     FROM mood_entries 
     WHERE user_id = ? AND logged_at >= ?
     GROUP BY emotion
     ORDER BY count DESC`
  ).bind(user.id, startDate).all<{ emotion: string; count: number; avg_intensity: number }>();

  return c.json({ 
    emotions: result.results || [],
    period: daysBack
  });
});

// Get correlations (time of day, day of week)
insights.get('/api/insights/correlations', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const moodsResult = await c.env.DB.prepare(
    `SELECT emotion, intensity, logged_at 
     FROM mood_entries 
     WHERE user_id = ? AND logged_at >= ?`
  ).bind(user.id, startDate).all<MoodEntry>();
  
  const moods = moodsResult.results || [];
  
  // Calculate time correlations
  const byHour: Record<number, { total: number; count: number }> = {};
  const byDayOfWeek: Record<number, { total: number; count: number }> = {};

  for (const mood of moods) {
    const date = new Date(mood.logged_at);
    const hour = date.getHours();
    const day = date.getDay();

    if (!byHour[hour]) byHour[hour] = { total: 0, count: 0 };
    byHour[hour].total += mood.intensity;
    byHour[hour].count++;

    if (!byDayOfWeek[day]) byDayOfWeek[day] = { total: 0, count: 0 };
    byDayOfWeek[day].total += mood.intensity;
    byDayOfWeek[day].count++;
  }

  const hourlyAvg = Object.entries(byHour).map(([hour, data]) => ({
    hour: parseInt(hour),
    avgIntensity: data.count > 0 ? data.total / data.count : 0
  })).sort((a, b) => a.hour - b.hour);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dailyAvg = Object.entries(byDayOfWeek).map(([day, data]) => ({
    day: dayNames[parseInt(day)],
    avgIntensity: data.count > 0 ? data.total / data.count : 0
  }));

  return c.json({
    byTimeOfDay: hourlyAvg,
    byDayOfWeek: dailyAvg
  });
});

// Helper functions
function calculateAnalytics(moods: MoodEntry[], daysBack: number): MoodAnalytics {
  const emotionCounts: Record<string, number> = {};
  let totalIntensity = 0;

  for (const mood of moods) {
    emotionCounts[mood.emotion] = (emotionCounts[mood.emotion] || 0) + 1;
    totalIntensity += mood.intensity;
  }

  const avgIntensity = moods.length > 0 ? totalIntensity / moods.length : 0;
  const weeklyTrends = calculateWeeklyTrends(moods, Math.ceil(daysBack / 7));

  // Generate basic insights
  const insights = [];
  const dominantEmotion = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];

  if (dominantEmotion) {
    insights.push({
      type: 'pattern' as const,
      title: 'Dominant Emotion',
      description: `Your most frequent emotion has been "${dominantEmotion}" over the past ${daysBack} days.`
    });
  }

  if (avgIntensity >= 4) {
    insights.push({
      type: 'trend' as const,
      title: 'High Intensity',
      description: 'Your average mood intensity has been high. Consider reflecting on what\'s driving these strong feelings.'
    });
  }

  return {
    totalEntries: moods.length,
    avgIntensity,
    emotionDistribution: emotionCounts,
    weeklyTrends,
    insights
  };
}

function calculateWeeklyTrends(moods: MoodEntry[], weeks: number): MoodTrend[] {
  const trends: MoodTrend[] = [];
  const now = new Date();

  for (let i = 0; i < weeks; i++) {
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weekMoods = moods.filter(m => {
      const date = new Date(m.logged_at);
      return date >= weekStart && date < weekEnd;
    });

    if (weekMoods.length > 0) {
      const emotionCounts: Record<string, number> = {};
      let totalIntensity = 0;

      for (const mood of weekMoods) {
        emotionCounts[mood.emotion] = (emotionCounts[mood.emotion] || 0) + 1;
        totalIntensity += mood.intensity;
      }

      const dominantEmotion = Object.entries(emotionCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';

      trends.unshift({
        date: weekStart.toISOString().split('T')[0],
        avgIntensity: totalIntensity / weekMoods.length,
        dominantEmotion,
        count: weekMoods.length
      });
    }
  }

  return trends;
}

export default insights;
