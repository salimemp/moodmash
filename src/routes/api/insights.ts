/**
 * Insights API Routes
 * Handles mood insights, wellness tips, color psychology
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

interface WellnessTip {
  id: number;
  content: string;
  category: string;
  mood_target: string;
}

const insights = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
insights.use('*', requireAuth);

// Get personalized insights
insights.get('/', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    // Get recent moods for analysis
    const recentMoods = await DB.prepare(`
      SELECT emotion, intensity, created_at
      FROM mood_entries
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 14
    `).bind(user!.id).all();

    const moods = recentMoods.results as Array<{
      emotion: string;
      intensity: number;
      created_at: string;
    }> || [];

    const insightsList: string[] = [];

    if (moods.length === 0) {
      insightsList.push('Start logging your moods to get personalized insights!');
    } else {
      // Calculate averages and trends
      const avgIntensity = moods.reduce((sum, m) => sum + m.intensity, 0) / moods.length;
      const emotionCounts: Record<string, number> = {};
      moods.forEach(m => {
        emotionCounts[m.emotion] = (emotionCounts[m.emotion] || 0) + 1;
      });

      const dominantEmotion = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      if (dominantEmotion) {
        insightsList.push(`Your most common mood lately is "${dominantEmotion}"`);
      }

      if (avgIntensity >= 3.5) {
        insightsList.push('Your mood intensity has been relatively high - great engagement!');
      } else if (avgIntensity < 2.5) {
        insightsList.push('Your mood intensity has been low - consider activities that boost engagement');
      }

      if (moods.length >= 7) {
        insightsList.push(`You've logged ${moods.length} moods in the past 2 weeks - keep it up!`);
      }
    }

    return c.json({ insights: insightsList, moodCount: moods.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Generate wellness tips
insights.post('/wellness-tips/generate', async (c) => {
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

    const tips: string[] = [];

    if (latestMood) {
      switch (latestMood.emotion) {
        case 'anxious':
        case 'stressed':
          tips.push('Try box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s');
          tips.push('Take a 10-minute walk outside');
          tips.push('Write down 3 things you can control right now');
          break;
        case 'sad':
          tips.push('Reach out to a friend or family member');
          tips.push('Listen to uplifting music');
          tips.push('Practice self-compassion - treat yourself as you would a friend');
          break;
        case 'angry':
          tips.push('Count to 10 slowly before reacting');
          tips.push('Physical exercise can help release tension');
          tips.push('Write down what triggered your anger');
          break;
        case 'tired':
          tips.push('Take a short power nap (15-20 minutes)');
          tips.push('Hydrate and have a healthy snack');
          tips.push('Gentle stretching can boost energy');
          break;
        default:
          tips.push('Keep a gratitude journal');
          tips.push('Share your positive mood with others');
          tips.push('Plan something enjoyable for later');
      }
    } else {
      tips.push('Start by logging your first mood entry');
      tips.push('Set a daily reminder to check in with yourself');
      tips.push('Explore the activities section for wellness ideas');
    }

    return c.json({ tips, basedOn: latestMood?.emotion || 'general' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Rate wellness tip
insights.post('/wellness-tips/:id/rate', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const tipId = c.req.param('id');

  try {
    const body = await c.req.json<{ rating: number; helpful: boolean }>();

    await DB.prepare(`
      INSERT INTO tip_ratings (tip_id, user_id, rating, helpful)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (tip_id, user_id) DO UPDATE SET rating = ?, helpful = ?
    `).bind(tipId, user!.id, body.rating, body.helpful ? 1 : 0, body.rating, body.helpful ? 1 : 0).run();

    return c.json({ message: 'Rating saved' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get color psychology info
insights.get('/color-psychology', async (c) => {
  const colorPsychology = [
    { color: 'blue', emotion: 'calm', description: 'Promotes relaxation and peace' },
    { color: 'red', emotion: 'energetic', description: 'Increases energy and passion' },
    { color: 'yellow', emotion: 'happy', description: 'Encourages optimism and creativity' },
    { color: 'green', emotion: 'balanced', description: 'Represents growth and harmony' },
    { color: 'purple', emotion: 'creative', description: 'Inspires imagination and spirituality' },
    { color: 'orange', emotion: 'enthusiastic', description: 'Stimulates social interaction' }
  ];

  return c.json({ colors: colorPsychology });
});

// Track color psychology interaction
insights.post('/color-psychology/track', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{ color: string; action: string }>();

    await DB.prepare(`
      INSERT INTO color_interactions (user_id, color, action)
      VALUES (?, ?, ?)
    `).bind(user!.id, body.color, body.action).run();

    return c.json({ message: 'Interaction tracked' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Quick select history
insights.get('/quick-select/history', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const history = await DB.prepare(`
      SELECT emotion, COUNT(*) as count
      FROM mood_entries
      WHERE user_id = ?
      GROUP BY emotion
      ORDER BY count DESC
      LIMIT 5
    `).bind(user!.id).all();

    return c.json({ frequentEmotions: history.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default insights;
