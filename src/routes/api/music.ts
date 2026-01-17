// Music Therapy API Endpoints
import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { getCurrentUser } from '../../middleware/auth';
import { musicPlaylists, musicCategories, moodMusicRecommendations } from '../../data/music-playlists';

const music = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all playlists
music.get('/playlists', async (c) => {
  try {
    const url = new URL(c.req.url);
    const category = url.searchParams.get('category');
    const mood = url.searchParams.get('mood');
    const search = url.searchParams.get('search');
    
    let playlists = [...musicPlaylists];
    
    // Filter by category
    if (category) {
      playlists = playlists.filter(p => p.category === category);
    }
    
    // Filter by mood tag
    if (mood) {
      playlists = playlists.filter(p => p.moodTags.includes(mood));
    }
    
    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      playlists = playlists.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.moodTags.some(t => t.toLowerCase().includes(searchLower))
      );
    }
    
    // Simplify for list view
    const playlistList = playlists.map(({ tracks, ...rest }) => ({
      ...rest,
      trackCount: tracks.length
    }));
    
    return c.json({
      success: true,
      playlists: playlistList,
      total: playlistList.length
    });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return c.json({ success: false, error: 'Failed to fetch playlists' }, 500);
  }
});

// Get single playlist with tracks
music.get('/playlists/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const playlist = musicPlaylists.find(p => p.id === id);
    
    if (!playlist) {
      return c.json({ success: false, error: 'Playlist not found' }, 404);
    }
    
    return c.json({ success: true, playlist });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return c.json({ success: false, error: 'Failed to fetch playlist' }, 500);
  }
});

// Get music categories
music.get('/categories', async (c) => {
  try {
    return c.json({
      success: true,
      categories: musicCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ success: false, error: 'Failed to fetch categories' }, 500);
  }
});

// Get mood-based recommendations
music.get('/recommendations', async (c) => {
  try {
    const user = await getCurrentUser(c);
    
    const url = new URL(c.req.url);
    const mood = url.searchParams.get('mood') || 'neutral';
    const desiredMood = url.searchParams.get('desiredMood');
    const timeOfDay = url.searchParams.get('timeOfDay') || getTimeOfDay();
    
    // Get recommended playlist IDs based on mood
    const recommendedIds = moodMusicRecommendations[mood] || moodMusicRecommendations.neutral;
    
    // Add desired mood recommendations if specified
    let allRecommendedIds = [...recommendedIds];
    if (desiredMood && desiredMood !== mood) {
      const desiredIds = moodMusicRecommendations[desiredMood] || [];
      allRecommendedIds = [...new Set([...allRecommendedIds, ...desiredIds])];
    }
    
    // Time of day adjustments
    const timeAdjustments: Record<string, string[]> = {
      morning: ['playlist_morning_motivation', 'playlist_happy_vibes'],
      afternoon: ['playlist_focus_flow', 'playlist_study_ambient'],
      evening: ['playlist_calm_mind', 'playlist_stress_relief'],
      night: ['playlist_deep_sleep', 'playlist_sleep_stories']
    };
    
    const timeBasedIds = timeAdjustments[timeOfDay] || [];
    allRecommendedIds = [...new Set([...allRecommendedIds, ...timeBasedIds])].slice(0, 8);
    
    // Get playlists
    let recommendations = musicPlaylists
      .filter(p => allRecommendedIds.includes(p.id))
      .map(({ tracks, ...rest }) => ({
        ...rest,
        trackCount: tracks.length,
        recommendedFor: mood
      }));
    
    // If not enough, add general playlists
    if (recommendations.length < 6) {
      const additional = musicPlaylists
        .filter(p => !recommendations.some(r => r.id === p.id))
        .map(({ tracks, ...rest }) => ({
          ...rest,
          trackCount: tracks.length,
          recommendedFor: 'general'
        }))
        .slice(0, 6 - recommendations.length);
      recommendations = [...recommendations, ...additional];
    }
    
    // If user is logged in, add personalized recommendations based on history
    let personalizedIds: string[] = [];
    if (user) {
      const history = await c.env.DB.prepare(`
        SELECT playlist_id, COUNT(*) as play_count
        FROM music_listening_history
        WHERE user_id = ? AND playlist_id IS NOT NULL
        GROUP BY playlist_id
        ORDER BY play_count DESC
        LIMIT 3
      `).bind(user.id).all();
      
      if (history.results && history.results.length > 0) {
        personalizedIds = history.results.map((h: Record<string, unknown>) => h.playlist_id as string);
      }
    }
    
    return c.json({
      success: true,
      recommendations,
      basedOn: { mood, desiredMood, timeOfDay },
      personalized: personalizedIds
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return c.json({ success: false, error: 'Failed to fetch recommendations' }, 500);
  }
});

// Log play event
music.post('/play', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { playlistId, trackId, duration, moodBefore, moodAfter, completed } = body;
    
    await c.env.DB.prepare(`
      INSERT INTO music_listening_history (id, user_id, playlist_id, track_id, duration, mood_before, mood_after, completed, played_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      crypto.randomUUID(),
      user.id,
      playlistId || null,
      trackId || null,
      duration || null,
      moodBefore || null,
      moodAfter || null,
      completed ? 1 : 0
    ).run();
    
    // Check for music listening achievements
    const achievements = await checkMusicAchievements(c.env.DB, String(user.id));
    
    return c.json({
      success: true,
      message: 'Play logged',
      achievements
    });
  } catch (error) {
    console.error('Error logging play:', error);
    return c.json({ success: false, error: 'Failed to log play' }, 500);
  }
});

// Get listening history
music.get('/history', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const history = await c.env.DB.prepare(`
      SELECT * FROM music_listening_history
      WHERE user_id = ?
      ORDER BY played_at DESC
      LIMIT 50
    `).bind(user.id).all();
    
    // Enrich with playlist details
    const enrichedHistory = (history.results || []).map((h: Record<string, unknown>) => {
      const playlist = musicPlaylists.find(p => p.id === h.playlist_id);
      return {
        ...h,
        playlistTitle: playlist?.title || 'Unknown',
        playlistCategory: playlist?.category || 'unknown'
      };
    });
    
    return c.json({
      success: true,
      history: enrichedHistory
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return c.json({ success: false, error: 'Failed to fetch history' }, 500);
  }
});

// Get favorites
music.get('/favorites', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const favorites = await c.env.DB.prepare(`
      SELECT playlist_id FROM music_favorites WHERE user_id = ? AND playlist_id IS NOT NULL
    `).bind(user.id).all();
    
    const favoriteIds = favorites.results?.map((f: Record<string, unknown>) => f.playlist_id) || [];
    const favoritePlaylists = musicPlaylists
      .filter(p => favoriteIds.includes(p.id))
      .map(({ tracks, ...rest }) => ({ ...rest, trackCount: tracks.length }));
    
    return c.json({
      success: true,
      favorites: favoritePlaylists
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return c.json({ success: false, error: 'Failed to fetch favorites' }, 500);
  }
});

// Add favorite
music.post('/favorites/:id', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const playlistId = c.req.param('id');
    
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO music_favorites (id, user_id, playlist_id)
      VALUES (?, ?, ?)
    `).bind(crypto.randomUUID(), user.id, playlistId).run();
    
    return c.json({ success: true, message: 'Added to favorites' });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return c.json({ success: false, error: 'Failed to add favorite' }, 500);
  }
});

// Remove favorite
music.delete('/favorites/:id', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const playlistId = c.req.param('id');
    
    await c.env.DB.prepare(`
      DELETE FROM music_favorites WHERE user_id = ? AND playlist_id = ?
    `).bind(user.id, playlistId).run();
    
    return c.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return c.json({ success: false, error: 'Failed to remove favorite' }, 500);
  }
});

// Get listening statistics
music.get('/stats', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Total listening time
    const totalTime = await c.env.DB.prepare(`
      SELECT SUM(duration) as total_seconds, COUNT(*) as total_plays
      FROM music_listening_history
      WHERE user_id = ?
    `).bind(user.id).first();
    
    // Most played playlists
    const topPlaylists = await c.env.DB.prepare(`
      SELECT playlist_id, COUNT(*) as play_count, SUM(duration) as total_time
      FROM music_listening_history
      WHERE user_id = ? AND playlist_id IS NOT NULL
      GROUP BY playlist_id
      ORDER BY play_count DESC
      LIMIT 5
    `).bind(user.id).all();
    
    // Mood improvement stats
    const moodStats = await c.env.DB.prepare(`
      SELECT 
        AVG(mood_after - mood_before) as avg_improvement,
        COUNT(*) as sessions_with_mood
      FROM music_listening_history
      WHERE user_id = ? AND mood_before IS NOT NULL AND mood_after IS NOT NULL
    `).bind(user.id).first();
    
    // Most listened category
    const categoryStats = await c.env.DB.prepare(`
      SELECT playlist_id, COUNT(*) as play_count
      FROM music_listening_history
      WHERE user_id = ? AND playlist_id IS NOT NULL
      GROUP BY playlist_id
    `).bind(user.id).all();
    
    const categoryCounts: Record<string, number> = {};
    (categoryStats.results || []).forEach((stat: Record<string, unknown>) => {
      const playlist = musicPlaylists.find(p => p.id === stat.playlist_id);
      if (playlist) {
        const category = playlist.category;
        categoryCounts[category] = (categoryCounts[category] || 0) + (stat.play_count as number);
      }
    });
    
    const topCategory = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    // Enrich top playlists with names
    const enrichedTopPlaylists = (topPlaylists.results || []).map((tp: Record<string, unknown>) => {
      const playlist = musicPlaylists.find(p => p.id === tp.playlist_id);
      return {
        ...tp,
        title: playlist?.title || 'Unknown',
        category: playlist?.category || 'unknown'
      };
    });
    
    return c.json({
      success: true,
      stats: {
        totalMinutes: Math.round((totalTime?.total_seconds as number || 0) / 60),
        totalPlays: totalTime?.total_plays || 0,
        topPlaylists: enrichedTopPlaylists,
        moodImprovement: moodStats?.avg_improvement || 0,
        sessionsWithMood: moodStats?.sessions_with_mood || 0,
        favoriteCategory: topCategory ? { name: topCategory[0], count: topCategory[1] } : null
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ success: false, error: 'Failed to fetch stats' }, 500);
  }
});

// Get mood-music correlation analysis
music.get('/mood-correlation', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Get listening sessions with mood data
    const sessions = await c.env.DB.prepare(`
      SELECT playlist_id, mood_before, mood_after
      FROM music_listening_history
      WHERE user_id = ? AND mood_before IS NOT NULL AND mood_after IS NOT NULL
    `).bind(user.id).all();
    
    // Analyze by category
    const categoryEffects: Record<string, { totalImprovement: number; count: number }> = {};
    
    (sessions.results || []).forEach((session: Record<string, unknown>) => {
      const playlist = musicPlaylists.find(p => p.id === session.playlist_id);
      if (playlist) {
        const category = playlist.category;
        if (!categoryEffects[category]) {
          categoryEffects[category] = { totalImprovement: 0, count: 0 };
        }
        categoryEffects[category].totalImprovement += (session.mood_after as number) - (session.mood_before as number);
        categoryEffects[category].count += 1;
      }
    });
    
    // Calculate averages and find most effective
    const analysis = Object.entries(categoryEffects)
      .map(([category, data]) => ({
        category,
        avgImprovement: data.count > 0 ? data.totalImprovement / data.count : 0,
        sessionCount: data.count
      }))
      .sort((a, b) => b.avgImprovement - a.avgImprovement);
    
    const mostEffective = analysis.length > 0 ? analysis[0] : null;
    
    return c.json({
      success: true,
      correlation: {
        byCategory: analysis,
        mostEffective,
        totalAnalyzed: sessions.results?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching mood correlation:', error);
    return c.json({ success: false, error: 'Failed to fetch correlation' }, 500);
  }
});

// Helper function to check music achievements
async function checkMusicAchievements(db: D1Database, userId: string): Promise<string[]> {
  const unlockedAchievements: string[] = [];
  
  try {
    // Get total listening time
    const stats = await db.prepare(`
      SELECT SUM(duration) as total_seconds
      FROM music_listening_history
      WHERE user_id = ?
    `).bind(userId).first();
    
    const totalHours = ((stats?.total_seconds as number) || 0) / 3600;
    
    // Check listening-based achievements
    const listeningAchievements = [
      { id: 'ach_music_listener', threshold: 10 },
      { id: 'ach_music_therapy', threshold: 100 }
    ];
    
    for (const achievement of listeningAchievements) {
      if (totalHours >= achievement.threshold) {
        const existing = await db.prepare(`
          SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?
        `).bind(userId, achievement.id).first();
        
        if (!existing) {
          await db.prepare(`
            INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at)
            VALUES (?, ?, ?, datetime('now'))
          `).bind(crypto.randomUUID(), userId, achievement.id).run();
          unlockedAchievements.push(achievement.id);
        }
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
  
  return unlockedAchievements;
}

// Helper function to get time of day
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export default music;
