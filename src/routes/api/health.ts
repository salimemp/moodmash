// Phase 5: Health, Wearables & Sleep API Routes (Mock Data)
import { Hono } from 'hono';
import type { Env, Variables } from '../../types';

const health = new Hono<{ Bindings: Env; Variables: Variables }>();

// Helper: Get current user
function getCurrentUser(c: any) {
  const user = c.get('user');
  if (!user) throw new Error('Unauthorized');
  return user;
}

// Helper: Generate deterministic random for a date/userId
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Mock Data Generators
function generateMockHealthMetrics(userId: number, date: string) {
  const seed = userId * 1000 + new Date(date).getTime() / 86400000;
  const random = seededRandom(seed);
  
  return {
    date,
    steps: Math.floor(5000 + random * 10000),
    heart_rate_avg: Math.floor(60 + random * 30),
    heart_rate_min: Math.floor(50 + random * 15),
    heart_rate_max: Math.floor(100 + random * 60),
    calories_burned: Math.floor(1500 + random * 1000),
    active_minutes: Math.floor(20 + random * 60),
    distance_meters: Math.floor(3000 + random * 8000),
    floors_climbed: Math.floor(random * 20)
  };
}

function generateMockSleepData(userId: number, date: string) {
  const seed = userId * 2000 + new Date(date).getTime() / 86400000;
  const random = seededRandom(seed);
  
  const totalMinutes = Math.floor(300 + random * 180); // 5-8 hours
  const deepPercent = 0.15 + random * 0.1;
  const remPercent = 0.2 + random * 0.1;
  const awakePercent = 0.05 + random * 0.05;
  const lightPercent = 1 - deepPercent - remPercent - awakePercent;
  
  return {
    date,
    duration_minutes: totalMinutes,
    quality_score: Math.floor(50 + random * 50),
    deep_minutes: Math.floor(totalMinutes * deepPercent),
    light_minutes: Math.floor(totalMinutes * lightPercent),
    rem_minutes: Math.floor(totalMinutes * remPercent),
    awake_minutes: Math.floor(totalMinutes * awakePercent),
    sleep_start: `${23 - Math.floor(random * 2)}:${String(Math.floor(random * 60)).padStart(2, '0')}`,
    sleep_end: `${6 + Math.floor(random * 2)}:${String(Math.floor(random * 60)).padStart(2, '0')}`
  };
}

// ==================== WEARABLES ====================

// GET /api/wearables - Get connected wearables
health.get('/wearables', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;

    const connections = await db.prepare(
      `SELECT provider, connected, last_sync, created_at FROM wearable_connections WHERE user_id = ?`
    ).bind(user.id).all();

    const availableProviders = [
      { id: 'fitbit', name: 'Fitbit', icon: '⌚', color: '#00B0B9' },
      { id: 'apple_watch', name: 'Apple Watch', icon: '🍎', color: '#000000' },
      { id: 'garmin', name: 'Garmin', icon: '🏃', color: '#007DC5' },
      { id: 'samsung', name: 'Samsung Galaxy Watch', icon: '📱', color: '#1428A0' },
      { id: 'xiaomi', name: 'Xiaomi Mi Band', icon: '🔘', color: '#FF6700' }
    ];

    const connected = (connections.results || []).map((c: any) => c.provider);

    return c.json({
      providers: availableProviders.map(p => ({
        ...p,
        connected: connected.includes(p.id),
        lastSync: (connections.results || []).find((c: any) => c.provider === p.id)?.last_sync
      }))
    });
  } catch (error) {
    console.error('Get wearables error:', error);
    return c.json({ error: 'Failed to get wearables' }, 500);
  }
});

// POST /api/wearables/connect - Connect a wearable (mock)
health.post('/wearables/connect', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;
    const { provider } = await c.req.json();

    const validProviders = ['fitbit', 'apple_watch', 'garmin', 'samsung', 'xiaomi'];
    if (!validProviders.includes(provider)) {
      return c.json({ error: 'Invalid provider' }, 400);
    }

    await db.prepare(
      `INSERT OR REPLACE INTO wearable_connections (user_id, provider, connected, last_sync, mock_data_seed)
       VALUES (?, ?, 1, datetime('now'), ?)`
    ).bind(user.id, provider, Math.floor(Math.random() * 1000000)).run();

    // Generate 30 days of mock health data
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const metrics = generateMockHealthMetrics(user.id, dateStr);
      await db.prepare(
        `INSERT OR REPLACE INTO health_metrics (user_id, date, steps, heart_rate_avg, heart_rate_min, heart_rate_max, 
         calories_burned, active_minutes, distance_meters, floors_climbed, is_mock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
      ).bind(user.id, dateStr, metrics.steps, metrics.heart_rate_avg, metrics.heart_rate_min, 
             metrics.heart_rate_max, metrics.calories_burned, metrics.active_minutes, 
             metrics.distance_meters, metrics.floors_climbed).run();
    }

    return c.json({ 
      success: true, 
      message: `${provider} connected successfully (demo mode)`,
      note: 'This is a demo connection with simulated data'
    });
  } catch (error) {
    console.error('Connect wearable error:', error);
    return c.json({ error: 'Failed to connect wearable' }, 500);
  }
});

// DELETE /api/wearables/disconnect - Disconnect a wearable
health.delete('/wearables/disconnect', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;
    const { provider } = await c.req.json();

    await db.prepare(
      `DELETE FROM wearable_connections WHERE user_id = ? AND provider = ?`
    ).bind(user.id, provider).run();

    return c.json({ success: true, message: 'Wearable disconnected' });
  } catch (error) {
    console.error('Disconnect wearable error:', error);
    return c.json({ error: 'Failed to disconnect wearable' }, 500);
  }
});

// GET /api/wearables/data - Get wearable data
health.get('/wearables/data', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;
    const days = parseInt(c.req.query('days') || '7');

    const metrics = await db.prepare(
      `SELECT * FROM health_metrics 
       WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
       ORDER BY date DESC`
    ).bind(user.id, days).all();

    // Calculate averages
    const results = metrics.results || [];
    const avgSteps = results.length ? Math.floor(results.reduce((a: number, b: any) => a + b.steps, 0) / results.length) : 0;
    const avgCalories = results.length ? Math.floor(results.reduce((a: number, b: any) => a + b.calories_burned, 0) / results.length) : 0;
    const avgActiveMinutes = results.length ? Math.floor(results.reduce((a: number, b: any) => a + b.active_minutes, 0) / results.length) : 0;
    const avgHeartRate = results.length ? Math.floor(results.reduce((a: number, b: any) => a + b.heart_rate_avg, 0) / results.length) : 0;

    return c.json({
      metrics: results,
      summary: {
        avgSteps,
        avgCalories,
        avgActiveMinutes,
        avgHeartRate,
        totalSteps: results.reduce((a: number, b: any) => a + b.steps, 0),
        daysTracked: results.length
      }
    });
  } catch (error) {
    console.error('Get wearable data error:', error);
    return c.json({ error: 'Failed to get wearable data' }, 500);
  }
});

// GET /api/wearables/correlations - Mood-activity correlations
health.get('/wearables/correlations', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;

    // Get mood data and health data for correlation
    const data = await db.prepare(
      `SELECT 
         h.date,
         h.steps,
         h.active_minutes,
         h.heart_rate_avg,
         AVG(m.intensity) as avg_mood
       FROM health_metrics h
       LEFT JOIN mood_entries m ON h.user_id = m.user_id AND date(m.logged_at) = h.date
       WHERE h.user_id = ?
       GROUP BY h.date
       ORDER BY h.date DESC
       LIMIT 30`
    ).bind(user.id).all();

    // Calculate simple correlation scores
    const results = data.results || [];
    let stepsMoodCorr = 0;
    let activityMoodCorr = 0;
    
    if (results.length > 5) {
      // Simple correlation calculation (Pearson approximation)
      const stepsArr = results.map((r: any) => r.steps).filter((s: number) => s > 0);
      const moodArr = results.map((r: any) => r.avg_mood || 5).filter((m: number) => m > 0);
      
      if (stepsArr.length === moodArr.length && stepsArr.length > 0) {
        const avgSteps = stepsArr.reduce((a: number, b: number) => a + b, 0) / stepsArr.length;
        const avgMood = moodArr.reduce((a: number, b: number) => a + b, 0) / moodArr.length;
        
        let num = 0, den1 = 0, den2 = 0;
        for (let i = 0; i < stepsArr.length; i++) {
          const ds = stepsArr[i] - avgSteps;
          const dm = moodArr[i] - avgMood;
          num += ds * dm;
          den1 += ds * ds;
          den2 += dm * dm;
        }
        
        stepsMoodCorr = den1 && den2 ? num / Math.sqrt(den1 * den2) : 0;
      }
    }

    return c.json({
      correlations: {
        stepsMood: Math.round(stepsMoodCorr * 100) / 100,
        activityMood: Math.round((stepsMoodCorr * 0.9) * 100) / 100, // Similar correlation
        heartRateMood: Math.round((stepsMoodCorr * -0.3) * 100) / 100 // Inverse correlation typically
      },
      insights: [
        stepsMoodCorr > 0.3 
          ? "Your mood tends to improve on days you're more active! 🏃" 
          : stepsMoodCorr < -0.3 
            ? "Higher activity seems to correlate with lower mood. Consider rest days." 
            : "No strong correlation between activity and mood detected yet.",
        "Keep logging to improve correlation accuracy!"
      ],
      dataPoints: results
    });
  } catch (error) {
    console.error('Get correlations error:', error);
    return c.json({ error: 'Failed to get correlations' }, 500);
  }
});

// ==================== SLEEP TRACKING ====================

// GET /api/sleep/data - Get sleep data
health.get('/sleep/data', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;
    const days = parseInt(c.req.query('days') || '7');

    let sleepData = await db.prepare(
      `SELECT * FROM sleep_data 
       WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
       ORDER BY date DESC`
    ).bind(user.id, days).all();

    // If no data, generate mock data
    if ((sleepData.results || []).length === 0) {
      const today = new Date();
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const sleep = generateMockSleepData(user.id, dateStr);
        await db.prepare(
          `INSERT OR REPLACE INTO sleep_data (user_id, date, duration_minutes, quality_score, 
           deep_minutes, light_minutes, rem_minutes, awake_minutes, sleep_start, sleep_end, is_mock)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
        ).bind(user.id, dateStr, sleep.duration_minutes, sleep.quality_score, 
               sleep.deep_minutes, sleep.light_minutes, sleep.rem_minutes, 
               sleep.awake_minutes, sleep.sleep_start, sleep.sleep_end).run();
      }

      sleepData = await db.prepare(
        `SELECT * FROM sleep_data WHERE user_id = ? ORDER BY date DESC LIMIT ?`
      ).bind(user.id, days).all();
    }

    const results = sleepData.results || [];
    const avgDuration = results.length ? Math.floor(results.reduce((a: number, b: any) => a + b.duration_minutes, 0) / results.length) : 0;
    const avgQuality = results.length ? Math.floor(results.reduce((a: number, b: any) => a + b.quality_score, 0) / results.length) : 0;

    return c.json({
      sleep: results,
      summary: {
        avgDuration,
        avgDurationFormatted: `${Math.floor(avgDuration / 60)}h ${avgDuration % 60}m`,
        avgQuality,
        avgDeepMinutes: results.length ? Math.floor(results.reduce((a: number, b: any) => a + b.deep_minutes, 0) / results.length) : 0,
        avgRemMinutes: results.length ? Math.floor(results.reduce((a: number, b: any) => a + b.rem_minutes, 0) / results.length) : 0,
        daysTracked: results.length
      }
    });
  } catch (error) {
    console.error('Get sleep data error:', error);
    return c.json({ error: 'Failed to get sleep data' }, 500);
  }
});

// GET /api/sleep/trends - Get sleep trends
health.get('/sleep/trends', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;

    // Weekly averages for last 4 weeks
    const trends = await db.prepare(
      `SELECT 
         strftime('%W', date) as week,
         AVG(duration_minutes) as avg_duration,
         AVG(quality_score) as avg_quality,
         AVG(deep_minutes) as avg_deep,
         COUNT(*) as days
       FROM sleep_data
       WHERE user_id = ? AND date >= date('now', '-28 days')
       GROUP BY strftime('%W', date)
       ORDER BY week DESC`
    ).bind(user.id).all();

    // Sleep-mood correlation
    const correlation = await db.prepare(
      `SELECT 
         s.quality_score,
         AVG(m.intensity) as avg_mood
       FROM sleep_data s
       LEFT JOIN mood_entries m ON s.user_id = m.user_id AND date(m.logged_at) = s.date
       WHERE s.user_id = ?
       GROUP BY s.date
       ORDER BY s.date DESC
       LIMIT 14`
    ).bind(user.id).all();

    // Calculate correlation
    const corrData = correlation.results || [];
    let sleepMoodCorr = 0;
    
    if (corrData.length > 3) {
      const qualityArr = corrData.map((r: any) => r.quality_score);
      const moodArr = corrData.map((r: any) => r.avg_mood || 5);
      
      const avgQuality = qualityArr.reduce((a: number, b: number) => a + b, 0) / qualityArr.length;
      const avgMood = moodArr.reduce((a: number, b: number) => a + b, 0) / moodArr.length;
      
      let num = 0, den1 = 0, den2 = 0;
      for (let i = 0; i < qualityArr.length; i++) {
        const dq = qualityArr[i] - avgQuality;
        const dm = moodArr[i] - avgMood;
        num += dq * dm;
        den1 += dq * dq;
        den2 += dm * dm;
      }
      
      sleepMoodCorr = den1 && den2 ? num / Math.sqrt(den1 * den2) : 0;
    }

    return c.json({
      weeklyTrends: trends.results || [],
      correlation: {
        sleepMood: Math.round(sleepMoodCorr * 100) / 100
      },
      insights: [
        sleepMoodCorr > 0.3 ? "Better sleep quality correlates with better mood! 😴" : 
        sleepMoodCorr < -0.3 ? "Interesting - your sleep patterns show an unusual mood correlation." :
        "Keep tracking to discover your sleep-mood patterns.",
        "Aim for 7-9 hours of sleep for optimal mood."
      ]
    });
  } catch (error) {
    console.error('Get sleep trends error:', error);
    return c.json({ error: 'Failed to get sleep trends' }, 500);
  }
});

// ==================== HEALTH INSIGHTS ====================

// GET /api/health/metrics - Get health metrics
health.get('/metrics', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;
    const days = parseInt(c.req.query('days') || '7');

    const metrics = await db.prepare(
      `SELECT * FROM health_metrics 
       WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
       ORDER BY date DESC`
    ).bind(user.id, days).all();

    return c.json({ metrics: metrics.results || [] });
  } catch (error) {
    console.error('Get health metrics error:', error);
    return c.json({ error: 'Failed to get health metrics' }, 500);
  }
});

// GET /api/health/insights - Get health insights
health.get('/insights', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;

    // Get recent health and mood data
    const healthData = await db.prepare(
      `SELECT * FROM health_metrics WHERE user_id = ? ORDER BY date DESC LIMIT 7`
    ).bind(user.id).all();

    const sleepData = await db.prepare(
      `SELECT * FROM sleep_data WHERE user_id = ? ORDER BY date DESC LIMIT 7`
    ).bind(user.id).all();

    const moodData = await db.prepare(
      `SELECT date(logged_at) as date, AVG(intensity) as avg_intensity, emotion
       FROM mood_entries WHERE user_id = ? 
       GROUP BY date(logged_at) ORDER BY date DESC LIMIT 7`
    ).bind(user.id).all();

    const healthResults = healthData.results || [];
    const sleepResults = sleepData.results || [];
    const moodResults = moodData.results || [];

    const insights = [];

    // Steps insight
    if (healthResults.length > 0) {
      const avgSteps = healthResults.reduce((a: number, b: any) => a + b.steps, 0) / healthResults.length;
      if (avgSteps < 5000) {
        insights.push({
          type: 'activity',
          title: 'Increase Daily Steps',
          description: 'Your average is below 5,000 steps. Try adding a 10-minute walk.',
          priority: 'medium'
        });
      } else if (avgSteps > 10000) {
        insights.push({
          type: 'activity',
          title: 'Great Activity Level! 🎉',
          description: 'You\'re averaging over 10,000 steps daily. Keep it up!',
          priority: 'positive'
        });
      }
    }

    // Sleep insight
    if (sleepResults.length > 0) {
      const avgQuality = sleepResults.reduce((a: number, b: any) => a + b.quality_score, 0) / sleepResults.length;
      const avgDuration = sleepResults.reduce((a: number, b: any) => a + b.duration_minutes, 0) / sleepResults.length;
      
      if (avgQuality < 60) {
        insights.push({
          type: 'sleep',
          title: 'Improve Sleep Quality',
          description: 'Your sleep quality score is below optimal. Consider a consistent bedtime routine.',
          priority: 'high'
        });
      }
      if (avgDuration < 420) { // Less than 7 hours
        insights.push({
          type: 'sleep',
          title: 'Get More Sleep',
          description: 'You\'re averaging less than 7 hours. Most adults need 7-9 hours.',
          priority: 'medium'
        });
      }
    }

    // Mood insight
    if (moodResults.length > 0) {
      const avgIntensity = moodResults.reduce((a: number, b: any) => a + (b.avg_intensity || 5), 0) / moodResults.length;
      if (avgIntensity < 4) {
        insights.push({
          type: 'mood',
          title: 'Mood Support',
          description: 'Your mood has been lower lately. Consider activities that bring you joy.',
          priority: 'high'
        });
      }
    }

    // Generic positive insight
    if (insights.length === 0) {
      insights.push({
        type: 'general',
        title: 'You\'re Doing Great! 🌟',
        description: 'Your health metrics look good. Keep maintaining your healthy habits!',
        priority: 'positive'
      });
    }

    return c.json({ insights });
  } catch (error) {
    console.error('Get health insights error:', error);
    return c.json({ error: 'Failed to get health insights' }, 500);
  }
});

// GET /api/health/wellness-score - Get overall wellness score
health.get('/wellness-score', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;

    // Calculate wellness score from various metrics
    const healthData = await db.prepare(
      `SELECT AVG(steps) as avg_steps, AVG(active_minutes) as avg_active, AVG(heart_rate_avg) as avg_hr
       FROM health_metrics WHERE user_id = ? AND date >= date('now', '-7 days')`
    ).bind(user.id).first();

    const sleepData = await db.prepare(
      `SELECT AVG(quality_score) as avg_quality, AVG(duration_minutes) as avg_duration
       FROM sleep_data WHERE user_id = ? AND date >= date('now', '-7 days')`
    ).bind(user.id).first();

    const moodData = await db.prepare(
      `SELECT AVG(intensity) as avg_mood
       FROM mood_entries WHERE user_id = ? AND logged_at >= datetime('now', '-7 days')`
    ).bind(user.id).first();

    // Calculate component scores
    let activityScore = 50;
    if (healthData?.avg_steps) {
      activityScore = Math.min(100, Math.floor((healthData.avg_steps as number / 10000) * 100));
    }

    let sleepScore = 50;
    if (sleepData?.avg_quality) {
      sleepScore = Math.floor(sleepData.avg_quality as number);
    }

    let moodScore = 50;
    if (moodData?.avg_mood) {
      moodScore = Math.floor((moodData.avg_mood as number / 10) * 100);
    }

    // Stress score (inverse of heart rate variability approximation)
    let stressScore = 60;
    if (healthData?.avg_hr) {
      const hr = healthData.avg_hr as number;
      stressScore = hr < 70 ? 80 : hr < 85 ? 60 : 40;
    }

    // Overall wellness score (weighted average)
    const overallScore = Math.floor(
      activityScore * 0.25 +
      sleepScore * 0.30 +
      moodScore * 0.30 +
      stressScore * 0.15
    );

    // Store today's wellness score
    const today = new Date().toISOString().split('T')[0];
    await db.prepare(
      `INSERT OR REPLACE INTO wellness_scores 
       (user_id, date, overall_score, mood_score, sleep_score, activity_score, stress_score)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(user.id, today, overallScore, moodScore, sleepScore, activityScore, stressScore).run();

    return c.json({
      overall: overallScore,
      components: {
        activity: activityScore,
        sleep: sleepScore,
        mood: moodScore,
        stress: stressScore
      },
      trend: 'stable', // Would calculate from historical data
      recommendations: [
        activityScore < 60 ? 'Try to increase daily activity' : null,
        sleepScore < 60 ? 'Focus on improving sleep quality' : null,
        moodScore < 60 ? 'Consider mood-boosting activities' : null
      ].filter(Boolean)
    });
  } catch (error) {
    console.error('Get wellness score error:', error);
    return c.json({ error: 'Failed to calculate wellness score' }, 500);
  }
});

// GET /api/health/mood-heatmap - Get mood heatmap data (calendar view)
health.get('/mood-heatmap', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;
    const days = parseInt(c.req.query('days') || '90');

    const moodData = await db.prepare(
      `SELECT date(logged_at) as date, AVG(intensity) as avg_intensity, emotion
       FROM mood_entries 
       WHERE user_id = ? AND logged_at >= datetime('now', '-' || ? || ' days')
       GROUP BY date(logged_at)
       ORDER BY date`
    ).bind(user.id, days).all();

    // Transform to calendar format
    const heatmapData = (moodData.results || []).map((row: any) => ({
      date: row.date,
      value: row.avg_intensity,
      emotion: row.emotion,
      color: getEmotionColor(row.emotion, row.avg_intensity)
    }));

    return c.json({ heatmap: heatmapData });
  } catch (error) {
    console.error('Get mood heatmap error:', error);
    return c.json({ error: 'Failed to get mood heatmap' }, 500);
  }
});

// Helper: Get emotion color for heatmap
function getEmotionColor(emotion: string, intensity: number): string {
  const colors: Record<string, string[]> = {
    happy: ['#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24', '#F59E0B'],
    sad: ['#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6'],
    angry: ['#FEE2E2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444'],
    anxious: ['#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC', '#A855F7'],
    calm: ['#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399', '#10B981'],
    excited: ['#FFEDD5', '#FDBA74', '#FB923C', '#F97316', '#EA580C'],
    tired: ['#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563'],
    stressed: ['#FCE7F3', '#FBCFE8', '#F9A8D4', '#F472B6', '#EC4899'],
    neutral: ['#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280']
  };
  
  const emotionColors = colors[emotion.toLowerCase()] || colors.neutral;
  const index = Math.min(Math.floor(intensity / 2.5), 4);
  return emotionColors[index];
}

// GET /api/health/mood-radar - Get emotion distribution for radar chart
health.get('/mood-radar', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;
    const days = parseInt(c.req.query('days') || '30');

    const emotions = await db.prepare(
      `SELECT emotion, COUNT(*) as count, AVG(intensity) as avg_intensity
       FROM mood_entries 
       WHERE user_id = ? AND logged_at >= datetime('now', '-' || ? || ' days')
       GROUP BY emotion`
    ).bind(user.id, days).all();

    const allEmotions = ['happy', 'sad', 'angry', 'anxious', 'calm', 'excited', 'tired', 'stressed', 'neutral'];
    const emotionData = (emotions.results || []) as any[];
    
    const radarData = allEmotions.map(emotion => {
      const found = emotionData.find((e: any) => e.emotion?.toLowerCase() === emotion);
      return {
        emotion,
        count: found?.count || 0,
        avgIntensity: Math.round((found?.avg_intensity || 0) * 10) / 10
      };
    });

    return c.json({ radar: radarData });
  } catch (error) {
    console.error('Get mood radar error:', error);
    return c.json({ error: 'Failed to get mood radar data' }, 500);
  }
});

export default health;
