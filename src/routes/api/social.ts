// Social API - Sharing & Activity Feed - Phase 3
import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { getCurrentUser } from '../../middleware/auth';

interface SharedMood {
  id: number;
  mood_id: number;
  user_id: number;
  shared_with: string;
  group_id: number | null;
  caption: string | null;
  privacy: string;
  like_count: number;
  comment_count: number;
  created_at: string;
}

interface Activity {
  id: number;
  user_id: number;
  type: string;
  actor_id: number | null;
  target_type: string | null;
  target_id: number | null;
  data: string;
  is_read: boolean;
  created_at: string;
}

interface Reaction {
  id: number;
  target_type: string;
  target_id: number;
  user_id: number;
  type: string;
  created_at: string;
}

const socialRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Helper to create activity
async function createActivity(
  db: D1Database,
  userId: number,
  type: string,
  actorId: number | null,
  targetType: string | null,
  targetId: number | null,
  data: Record<string, unknown> = {}
): Promise<void> {
  await db.prepare(
    `INSERT INTO activities (user_id, type, actor_id, target_type, target_id, data)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(userId, type, actorId, targetType, targetId, JSON.stringify(data)).run();
}

// Helper to check if users are friends
async function areFriends(db: D1Database, userId1: number, userId2: number): Promise<boolean> {
  const friendship = await db.prepare(
    `SELECT id FROM friendships 
     WHERE user_id = ? AND friend_id = ? AND status = 'accepted'`
  ).bind(userId1, userId2).first();
  return !!friendship;
}

// Share a mood
socialRoutes.post('/api/share/mood/:id', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const moodId = parseInt(c.req.param('id'));

  // Verify mood belongs to user
  const mood = await c.env.DB.prepare(
    'SELECT * FROM mood_entries WHERE id = ? AND user_id = ?'
  ).bind(moodId, user.id).first();

  if (!mood) {
    return c.json({ error: 'Mood entry not found' }, 404);
  }

  const body = await c.req.json<{
    shared_with?: string;
    group_id?: number;
    caption?: string;
    privacy?: string;
  }>();

  const sharedWith = body.shared_with || 'friends';
  const privacy = body.privacy || 'friends';

  if (!['public', 'friends', 'group'].includes(sharedWith)) {
    return c.json({ error: 'Invalid shared_with value' }, 400);
  }

  if (!['public', 'friends', 'private'].includes(privacy)) {
    return c.json({ error: 'Invalid privacy value' }, 400);
  }

  // If sharing to group, verify membership
  if (sharedWith === 'group' && body.group_id) {
    const membership = await c.env.DB.prepare(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?'
    ).bind(body.group_id, user.id).first();

    if (!membership) {
      return c.json({ error: 'Must be a member of the group to share' }, 403);
    }
  }

  // Create shared mood
  const result = await c.env.DB.prepare(
    `INSERT INTO shared_moods (mood_id, user_id, shared_with, group_id, caption, privacy)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    moodId,
    user.id,
    sharedWith,
    body.group_id || null,
    body.caption || null,
    privacy
  ).run();

  // Create activities for friends
  if (sharedWith === 'friends' || sharedWith === 'public') {
    const friends = await c.env.DB.prepare(
      `SELECT friend_id FROM friendships WHERE user_id = ? AND status = 'accepted'`
    ).bind(user.id).all<{ friend_id: number }>();

    for (const friend of friends.results || []) {
      await createActivity(c.env.DB, friend.friend_id, 'mood_shared', user.id, 'shared_mood', result.meta.last_row_id, {
        message: `${user.name || user.email} shared their mood`
      });
    }
  }

  return c.json({
    success: true,
    shared_mood: {
      id: result.meta.last_row_id,
      mood_id: moodId,
      shared_with: sharedWith,
      privacy
    }
  });
});

// Get activity feed
socialRoutes.get('/api/feed', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const filter = c.req.query('filter') || 'all'; // all, friends, groups
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const offset = (page - 1) * limit;

  let query: string;
  let params: (number | string)[];

  if (filter === 'friends') {
    // Only friends' shared moods
    query = `
      SELECT 
        sm.id, sm.mood_id, sm.user_id, sm.shared_with, sm.caption, sm.privacy,
        sm.like_count, sm.comment_count, sm.created_at,
        me.emotion, me.intensity, me.notes as mood_notes,
        u.name as author_name, u.avatar_url as author_avatar,
        p.display_name as author_display_name,
        (SELECT type FROM reactions WHERE target_type = 'shared_mood' AND target_id = sm.id AND user_id = ?) as user_reaction
      FROM shared_moods sm
      JOIN mood_entries me ON sm.mood_id = me.id
      JOIN users u ON sm.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE sm.user_id IN (
        SELECT friend_id FROM friendships WHERE user_id = ? AND status = 'accepted'
      )
      AND sm.privacy IN ('public', 'friends')
      ORDER BY sm.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params = [user.id, user.id, limit, offset];
  } else if (filter === 'groups') {
    // Group posts
    query = `
      SELECT 
        gp.id, gp.group_id, gp.user_id, gp.content, gp.mood_entry_id,
        gp.like_count, gp.comment_count, gp.created_at,
        g.name as group_name,
        me.emotion, me.intensity,
        u.name as author_name, u.avatar_url as author_avatar,
        p.display_name as author_display_name,
        'group_post' as type,
        (SELECT type FROM reactions WHERE target_type = 'group_post' AND target_id = gp.id AND user_id = ?) as user_reaction
      FROM group_posts gp
      JOIN groups g ON gp.group_id = g.id
      JOIN users u ON gp.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN mood_entries me ON gp.mood_entry_id = me.id
      WHERE gp.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = ?
      )
      ORDER BY gp.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params = [user.id, user.id, limit, offset];
  } else {
    // Combined feed - friends' moods + own + group posts
    query = `
      SELECT * FROM (
        SELECT 
          sm.id, 'shared_mood' as type, sm.user_id, sm.caption as content,
          sm.like_count, sm.comment_count, sm.created_at,
          me.emotion, me.intensity,
          u.name as author_name, u.avatar_url as author_avatar,
          p.display_name as author_display_name,
          NULL as group_name, NULL as group_id,
          (SELECT type FROM reactions WHERE target_type = 'shared_mood' AND target_id = sm.id AND user_id = ?) as user_reaction
        FROM shared_moods sm
        JOIN mood_entries me ON sm.mood_id = me.id
        JOIN users u ON sm.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE (
          sm.user_id = ?
          OR (sm.user_id IN (SELECT friend_id FROM friendships WHERE user_id = ? AND status = 'accepted')
              AND sm.privacy IN ('public', 'friends'))
          OR sm.privacy = 'public'
        )
        
        UNION ALL
        
        SELECT 
          gp.id, 'group_post' as type, gp.user_id, gp.content,
          gp.like_count, gp.comment_count, gp.created_at,
          me.emotion, me.intensity,
          u.name as author_name, u.avatar_url as author_avatar,
          p.display_name as author_display_name,
          g.name as group_name, g.id as group_id,
          (SELECT type FROM reactions WHERE target_type = 'group_post' AND target_id = gp.id AND user_id = ?) as user_reaction
        FROM group_posts gp
        JOIN groups g ON gp.group_id = g.id
        JOIN users u ON gp.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN mood_entries me ON gp.mood_entry_id = me.id
        WHERE gp.group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)
      ) combined
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    params = [user.id, user.id, user.id, user.id, user.id, limit, offset];
  }

  const feed = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    feed: feed.results || [],
    page,
    limit,
    hasMore: (feed.results || []).length === limit
  });
});

// Get activities/notifications
socialRoutes.get('/api/activities', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const unreadOnly = c.req.query('unread') === 'true';
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      a.*,
      u.name as actor_name, u.avatar_url as actor_avatar,
      p.display_name as actor_display_name
    FROM activities a
    LEFT JOIN users u ON a.actor_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE a.user_id = ?
  `;

  if (unreadOnly) {
    query += ' AND a.is_read = 0';
  }

  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';

  const activities = await c.env.DB.prepare(query)
    .bind(user.id, limit, offset)
    .all<Activity & { actor_name: string | null; actor_avatar: string | null; actor_display_name: string | null }>();

  // Get unread count
  const unreadCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM activities WHERE user_id = ? AND is_read = 0'
  ).bind(user.id).first<{ count: number }>();

  return c.json({
    activities: (activities.results || []).map(a => ({
      ...a,
      data: JSON.parse(a.data || '{}')
    })),
    unread_count: unreadCount?.count || 0,
    page,
    limit
  });
});

// Mark activities as read
socialRoutes.post('/api/activities/read', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json<{ ids?: number[]; all?: boolean }>();

  if (body.all) {
    await c.env.DB.prepare(
      'UPDATE activities SET is_read = 1 WHERE user_id = ?'
    ).bind(user.id).run();
  } else if (body.ids && body.ids.length > 0) {
    const placeholders = body.ids.map(() => '?').join(',');
    await c.env.DB.prepare(
      `UPDATE activities SET is_read = 1 WHERE user_id = ? AND id IN (${placeholders})`
    ).bind(user.id, ...body.ids).run();
  }

  return c.json({ success: true });
});

// Add reaction
socialRoutes.post('/api/reactions', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json<{
    target_type: string;
    target_id: number;
    type: string;
  }>();

  if (!['shared_mood', 'group_post', 'comment'].includes(body.target_type)) {
    return c.json({ error: 'Invalid target_type' }, 400);
  }

  if (!['like', 'love', 'support', 'hug', 'celebrate'].includes(body.type)) {
    return c.json({ error: 'Invalid reaction type' }, 400);
  }

  // Check target exists and get author
  let authorId: number | null = null;
  
  if (body.target_type === 'shared_mood') {
    const target = await c.env.DB.prepare(
      'SELECT user_id FROM shared_moods WHERE id = ?'
    ).bind(body.target_id).first<{ user_id: number }>();
    
    if (!target) {
      return c.json({ error: 'Shared mood not found' }, 404);
    }
    authorId = target.user_id;
  } else if (body.target_type === 'group_post') {
    const target = await c.env.DB.prepare(
      'SELECT user_id FROM group_posts WHERE id = ?'
    ).bind(body.target_id).first<{ user_id: number }>();
    
    if (!target) {
      return c.json({ error: 'Group post not found' }, 404);
    }
    authorId = target.user_id;
  } else if (body.target_type === 'comment') {
    const target = await c.env.DB.prepare(
      'SELECT user_id FROM comments WHERE id = ?'
    ).bind(body.target_id).first<{ user_id: number }>();
    
    if (!target) {
      return c.json({ error: 'Comment not found' }, 404);
    }
    authorId = target.user_id;
  }

  // Check existing reaction
  const existing = await c.env.DB.prepare(
    'SELECT id, type FROM reactions WHERE target_type = ? AND target_id = ? AND user_id = ?'
  ).bind(body.target_type, body.target_id, user.id).first<Reaction>();

  if (existing) {
    if (existing.type === body.type) {
      // Remove reaction (toggle off)
      await c.env.DB.prepare(
        'DELETE FROM reactions WHERE id = ?'
      ).bind(existing.id).run();

      // Decrement like count
      if (body.target_type === 'shared_mood') {
        await c.env.DB.prepare(
          'UPDATE shared_moods SET like_count = like_count - 1 WHERE id = ?'
        ).bind(body.target_id).run();
      } else if (body.target_type === 'group_post') {
        await c.env.DB.prepare(
          'UPDATE group_posts SET like_count = like_count - 1 WHERE id = ?'
        ).bind(body.target_id).run();
      }

      return c.json({ success: true, action: 'removed' });
    } else {
      // Update reaction type
      await c.env.DB.prepare(
        'UPDATE reactions SET type = ? WHERE id = ?'
      ).bind(body.type, existing.id).run();

      return c.json({ success: true, action: 'updated', type: body.type });
    }
  }

  // Add new reaction
  await c.env.DB.prepare(
    `INSERT INTO reactions (target_type, target_id, user_id, type) VALUES (?, ?, ?, ?)`
  ).bind(body.target_type, body.target_id, user.id, body.type).run();

  // Increment like count
  if (body.target_type === 'shared_mood') {
    await c.env.DB.prepare(
      'UPDATE shared_moods SET like_count = like_count + 1 WHERE id = ?'
    ).bind(body.target_id).run();
  } else if (body.target_type === 'group_post') {
    await c.env.DB.prepare(
      'UPDATE group_posts SET like_count = like_count + 1 WHERE id = ?'
    ).bind(body.target_id).run();
  }

  // Create activity for author
  if (authorId && authorId !== user.id) {
    await createActivity(c.env.DB, authorId, 'reaction', user.id, body.target_type, body.target_id, {
      reaction_type: body.type,
      message: `${user.name || user.email} reacted to your post`
    });
  }

  return c.json({ success: true, action: 'added', type: body.type });
});

// Add comment
socialRoutes.post('/api/comments', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json<{
    target_type: string;
    target_id: number;
    content: string;
    parent_id?: number;
  }>();

  if (!['shared_mood', 'group_post'].includes(body.target_type)) {
    return c.json({ error: 'Invalid target_type' }, 400);
  }

  if (!body.content || body.content.length < 1) {
    return c.json({ error: 'Content is required' }, 400);
  }

  // Check target exists and get author
  let authorId: number | null = null;
  
  if (body.target_type === 'shared_mood') {
    const target = await c.env.DB.prepare(
      'SELECT user_id FROM shared_moods WHERE id = ?'
    ).bind(body.target_id).first<{ user_id: number }>();
    
    if (!target) {
      return c.json({ error: 'Shared mood not found' }, 404);
    }
    authorId = target.user_id;
  } else if (body.target_type === 'group_post') {
    const target = await c.env.DB.prepare(
      'SELECT user_id FROM group_posts WHERE id = ?'
    ).bind(body.target_id).first<{ user_id: number }>();
    
    if (!target) {
      return c.json({ error: 'Group post not found' }, 404);
    }
    authorId = target.user_id;
  }

  // Add comment
  const result = await c.env.DB.prepare(
    `INSERT INTO comments (target_type, target_id, user_id, content, parent_id)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(body.target_type, body.target_id, user.id, body.content, body.parent_id || null).run();

  // Increment comment count
  if (body.target_type === 'shared_mood') {
    await c.env.DB.prepare(
      'UPDATE shared_moods SET comment_count = comment_count + 1 WHERE id = ?'
    ).bind(body.target_id).run();
  } else if (body.target_type === 'group_post') {
    await c.env.DB.prepare(
      'UPDATE group_posts SET comment_count = comment_count + 1 WHERE id = ?'
    ).bind(body.target_id).run();
  }

  // Create activity for author
  if (authorId && authorId !== user.id) {
    await createActivity(c.env.DB, authorId, 'comment', user.id, body.target_type, body.target_id, {
      comment_preview: body.content.substring(0, 50),
      message: `${user.name || user.email} commented on your post`
    });
  }

  return c.json({
    success: true,
    comment: {
      id: result.meta.last_row_id,
      target_type: body.target_type,
      target_id: body.target_id,
      content: body.content,
      user_id: user.id
    }
  });
});

// Get comments for a target
socialRoutes.get('/api/comments', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const targetType = c.req.query('target_type');
  const targetId = c.req.query('target_id');

  if (!targetType || !targetId) {
    return c.json({ error: 'target_type and target_id are required' }, 400);
  }

  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const offset = (page - 1) * limit;

  const comments = await c.env.DB.prepare(`
    SELECT 
      c.*,
      u.name as author_name, u.avatar_url as author_avatar,
      p.display_name as author_display_name
    FROM comments c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE c.target_type = ? AND c.target_id = ?
    ORDER BY c.created_at ASC
    LIMIT ? OFFSET ?
  `).bind(targetType, parseInt(targetId), limit, offset).all();

  return c.json({
    comments: comments.results || [],
    page,
    limit
  });
});

// Delete comment
socialRoutes.delete('/api/comments/:id', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const commentId = parseInt(c.req.param('id'));

  const comment = await c.env.DB.prepare(
    'SELECT * FROM comments WHERE id = ?'
  ).bind(commentId).first<{ id: number; user_id: number; target_type: string; target_id: number }>();

  if (!comment) {
    return c.json({ error: 'Comment not found' }, 404);
  }

  if (comment.user_id !== user.id) {
    return c.json({ error: 'Not authorized to delete this comment' }, 403);
  }

  await c.env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(commentId).run();

  // Decrement comment count
  if (comment.target_type === 'shared_mood') {
    await c.env.DB.prepare(
      'UPDATE shared_moods SET comment_count = comment_count - 1 WHERE id = ?'
    ).bind(comment.target_id).run();
  } else if (comment.target_type === 'group_post') {
    await c.env.DB.prepare(
      'UPDATE group_posts SET comment_count = comment_count - 1 WHERE id = ?'
    ).bind(comment.target_id).run();
  }

  return c.json({ success: true });
});

// Get shared mood details
socialRoutes.get('/api/shared-moods/:id', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const sharedMoodId = parseInt(c.req.param('id'));

  const sharedMood = await c.env.DB.prepare(`
    SELECT 
      sm.*,
      me.emotion, me.intensity, me.notes as mood_notes, me.logged_at,
      u.name as author_name, u.avatar_url as author_avatar,
      p.display_name as author_display_name, p.bio as author_bio
    FROM shared_moods sm
    JOIN mood_entries me ON sm.mood_id = me.id
    JOIN users u ON sm.user_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE sm.id = ?
  `).bind(sharedMoodId).first();

  if (!sharedMood) {
    return c.json({ error: 'Shared mood not found' }, 404);
  }

  // Check privacy
  const sm = sharedMood as unknown as SharedMood & { author_name: string };
  if (sm.privacy === 'private' && sm.user_id !== user.id) {
    return c.json({ error: 'Access denied' }, 403);
  }

  if (sm.privacy === 'friends' && sm.user_id !== user.id) {
    const isFriend = await areFriends(c.env.DB, user.id, sm.user_id);
    if (!isFriend) {
      return c.json({ error: 'Access denied' }, 403);
    }
  }

  // Get user's reaction
  const userReaction = await c.env.DB.prepare(
    'SELECT type FROM reactions WHERE target_type = ? AND target_id = ? AND user_id = ?'
  ).bind('shared_mood', sharedMoodId, user.id).first<{ type: string }>();

  // Get reactions summary
  const reactions = await c.env.DB.prepare(`
    SELECT type, COUNT(*) as count
    FROM reactions
    WHERE target_type = 'shared_mood' AND target_id = ?
    GROUP BY type
  `).bind(sharedMoodId).all<{ type: string; count: number }>();

  return c.json({
    ...sharedMood,
    user_reaction: userReaction?.type || null,
    reactions_summary: reactions.results || []
  });
});

// Delete shared mood
socialRoutes.delete('/api/shared-moods/:id', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const sharedMoodId = parseInt(c.req.param('id'));

  const result = await c.env.DB.prepare(
    'DELETE FROM shared_moods WHERE id = ? AND user_id = ?'
  ).bind(sharedMoodId, user.id).run();

  if (result.meta.changes === 0) {
    return c.json({ error: 'Shared mood not found or not authorized' }, 404);
  }

  return c.json({ success: true });
});

export default socialRoutes;
