/**
 * AI API Routes
 * Handles AI-powered mood analysis, patterns, forecasting, recommendations
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

interface MoodData {
  emotion: string;
  intensity: number;
  note?: string;
  activities?: string[];
  weather?: string;
  sleep_hours?: number;
  created_at: string;
}

interface AnalysisRequest {
  moods?: MoodData[];
  timeframe?: string;
  context?: string;
}

interface CrisisCheckRequest {
  current_emotion: string;
  intensity: number;
  recent_moods?: MoodData[];
  notes?: string;
}

const ai = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
ai.use('*', requireAuth);

// Analyze mood patterns
ai.post('/patterns', async (c) => {
  const { DB, GEMINI_API_KEY } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<AnalysisRequest>();

    // Get recent moods for analysis
    const moods = await DB.prepare(`
      SELECT emotion, intensity, note, activities, weather, sleep_hours, created_at
      FROM mood_entries
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 30
    `).bind(user!.id).all();

    if (!moods.results || moods.results.length === 0) {
      return c.json({ patterns: [], message: 'Not enough data for pattern analysis' });
    }

    // Basic pattern analysis (can be enhanced with AI)
    const emotionCounts: Record<string, number> = {};
    const intensityByEmotion: Record<string, number[]> = {};

    for (const mood of moods.results) {
      const moodData = mood as unknown as MoodData;
      emotionCounts[moodData.emotion] = (emotionCounts[moodData.emotion] || 0) + 1;
      if (!intensityByEmotion[moodData.emotion]) {
        intensityByEmotion[moodData.emotion] = [];
      }
      intensityByEmotion[moodData.emotion].push(moodData.intensity);
    }

    const patterns = Object.entries(emotionCounts).map(([emotion, count]) => ({
      emotion,
      frequency: count,
      percentage: Math.round((count / moods.results!.length) * 100),
      avgIntensity: intensityByEmotion[emotion].reduce((a, b) => a + b, 0) / intensityByEmotion[emotion].length
    }));

    return c.json({ patterns: patterns.sort((a, b) => b.frequency - a.frequency) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Forecast mood trends
ai.post('/forecast', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const moods = await DB.prepare(`
      SELECT emotion, intensity, created_at
      FROM mood_entries
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 14
    `).bind(user!.id).all();

    if (!moods.results || moods.results.length < 3) {
      return c.json({ forecast: null, message: 'Need more data for forecasting' });
    }

    // Calculate trend
    const recentIntensities = moods.results.slice(0, 7).map(m => (m as unknown as MoodData).intensity);
    const olderIntensities = moods.results.slice(7).map(m => (m as unknown as MoodData).intensity);

    const recentAvg = recentIntensities.reduce((a, b) => a + b, 0) / recentIntensities.length;
    const olderAvg = olderIntensities.length > 0 
      ? olderIntensities.reduce((a, b) => a + b, 0) / olderIntensities.length 
      : recentAvg;

    const trend = recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable';

    return c.json({
      forecast: {
        trend,
        recentAvgIntensity: Math.round(recentAvg * 10) / 10,
        confidence: Math.min(moods.results.length * 5, 100)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get contextual insights
ai.post('/context', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{ context: string }>();

    const moods = await DB.prepare(`
      SELECT emotion, intensity, weather, sleep_hours, social_interaction
      FROM mood_entries
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 30
    `).bind(user!.id).all();

    // Analyze context correlations
    const insights: string[] = [];

    if (moods.results && moods.results.length > 0) {
      const moodData = moods.results as Array<{
        emotion: string;
        intensity: number;
        weather?: string;
        sleep_hours?: number;
        social_interaction?: string;
      }>;

      // Sleep correlation
      const goodSleepMoods = moodData.filter(m => m.sleep_hours && m.sleep_hours >= 7);
      if (goodSleepMoods.length > 0) {
        const avgGoodSleep = goodSleepMoods.reduce((a, b) => a + b.intensity, 0) / goodSleepMoods.length;
        if (avgGoodSleep > 3) {
          insights.push('Good sleep (7+ hours) correlates with better mood');
        }
      }

      // Social correlation
      const socialMoods = moodData.filter(m => m.social_interaction === 'friends' || m.social_interaction === 'family');
      if (socialMoods.length >= 3) {
        insights.push('Social interactions tend to improve your mood');
      }
    }

    return c.json({ insights, context: body.context });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Analyze mood causes
ai.post('/causes', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const moods = await DB.prepare(`
      SELECT emotion, intensity, activities, weather, sleep_hours, note
      FROM mood_entries
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(user!.id).all();

    const causes: Record<string, { positive: number; negative: number }> = {};

    for (const mood of moods.results || []) {
      const m = mood as unknown as MoodData;
      const isPositive = m.intensity >= 3;

      if (m.weather) {
        if (!causes[`weather:${m.weather}`]) causes[`weather:${m.weather}`] = { positive: 0, negative: 0 };
        causes[`weather:${m.weather}`][isPositive ? 'positive' : 'negative']++;
      }

      if (m.sleep_hours) {
        const sleepCategory = m.sleep_hours >= 7 ? 'good_sleep' : m.sleep_hours >= 5 ? 'moderate_sleep' : 'poor_sleep';
        if (!causes[sleepCategory]) causes[sleepCategory] = { positive: 0, negative: 0 };
        causes[sleepCategory][isPositive ? 'positive' : 'negative']++;
      }
    }

    return c.json({ causes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get AI recommendations
ai.post('/recommend', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const latestMood = await DB.prepare(`
      SELECT emotion, intensity
      FROM mood_entries
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(user!.id).first() as { emotion: string; intensity: number } | null;

    const recommendations: string[] = [];

    if (latestMood) {
      if (latestMood.emotion === 'anxious' || latestMood.emotion === 'stressed') {
        recommendations.push('Try deep breathing exercises for 5 minutes');
        recommendations.push('Consider a short mindfulness meditation');
        recommendations.push('Take a walk in nature if possible');
      } else if (latestMood.emotion === 'sad') {
        recommendations.push('Reach out to a friend or loved one');
        recommendations.push('Engage in a favorite hobby');
        recommendations.push('Listen to uplifting music');
      } else if (latestMood.emotion === 'tired') {
        recommendations.push('Take a short power nap (15-20 minutes)');
        recommendations.push('Do some light stretching');
        recommendations.push('Have a healthy snack');
      } else {
        recommendations.push('Keep up the good work!');
        recommendations.push('Consider journaling about what made today good');
        recommendations.push('Share your positive mood with others');
      }
    } else {
      recommendations.push('Start by logging your first mood entry');
    }

    return c.json({ recommendations });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Crisis check
ai.post('/crisis-check', async (c) => {
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<CrisisCheckRequest>();

    const concerningEmotions = ['anxious', 'sad', 'stressed', 'angry'];
    const isConcerning = concerningEmotions.includes(body.current_emotion) && body.intensity >= 4;

    const resources = isConcerning ? [
      { name: 'National Suicide Prevention Lifeline', phone: '988' },
      { name: 'Crisis Text Line', text: 'HOME to 741741' },
      { name: 'SAMHSA National Helpline', phone: '1-800-662-4357' }
    ] : [];

    return c.json({
      needsSupport: isConcerning,
      message: isConcerning 
        ? "It seems like you're going through a difficult time. Remember, you're not alone." 
        : "You're doing okay. Keep tracking your moods!",
      resources
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Risk detection
ai.post('/risk-detect', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const recentMoods = await DB.prepare(`
      SELECT emotion, intensity, created_at
      FROM mood_entries
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 7
    `).bind(user!.id).all();

    const negativeEmotions = ['sad', 'anxious', 'stressed', 'angry'];
    const negativeCount = (recentMoods.results || []).filter(m => {
      const mood = m as { emotion: string; intensity: number };
      return negativeEmotions.includes(mood.emotion) && mood.intensity >= 3;
    }).length;

    const riskLevel = negativeCount >= 5 ? 'high' : negativeCount >= 3 ? 'moderate' : 'low';

    return c.json({
      riskLevel,
      negativeCount,
      totalChecked: recentMoods.results?.length || 0,
      recommendation: riskLevel === 'high' 
        ? 'Consider reaching out to a mental health professional'
        : riskLevel === 'moderate'
        ? 'Try some self-care activities'
        : 'Keep up the great work!'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Analytics
ai.post('/analytics', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total_entries,
        AVG(intensity) as avg_intensity,
        MIN(created_at) as first_entry,
        MAX(created_at) as last_entry
      FROM mood_entries
      WHERE user_id = ?
    `).bind(user!.id).first() as {
      total_entries: number;
      avg_intensity: number;
      first_entry: string;
      last_entry: string;
    } | null;

    const emotionDistribution = await DB.prepare(`
      SELECT emotion, COUNT(*) as count
      FROM mood_entries
      WHERE user_id = ?
      GROUP BY emotion
      ORDER BY count DESC
    `).bind(user!.id).all();

    return c.json({
      stats: stats || { total_entries: 0, avg_intensity: 0 },
      emotionDistribution: emotionDistribution.results || []
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default ai;
