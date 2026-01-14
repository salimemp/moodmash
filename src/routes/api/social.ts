/**
 * Social API Routes
 * Handles social feed, posts, likes, comments, friends, connections
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

interface SocialPost {
  id: number;
  user_id: number;
  content: string;
  emotion: string;
  emotion_intensity: number;
  visibility: string;
  like_count: number;
  comment_count: number;
  created_at: string;
}

interface SocialPostBody {
  content: string;
  emotion: string;
  visibility?: string;
  emotion_intensity?: number;
}

interface CommentBody {
  content: string;
}

interface ConnectionBody {
  target_user_id: number;
  connection_type?: string;
}

interface MessageBody {
  recipient_id: number;
  content: string;
}

const social = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
social.use('*', requireAuth);

// Get social feed
social.get('/feed', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const filter = c.req.query('filter') || 'all';

  try {
    let query = `
      SELECT 
        sp.*,
        u.name as user_name,
        EXISTS(SELECT 1 FROM social_post_likes WHERE post_id = sp.id AND user_id = ?) as user_liked
      FROM social_posts sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.visibility = 'public'
    `;
    const params: (string | number)[] = [user!.id];

    if (filter === 'friends') {
      query += ` AND sp.user_id IN (SELECT following_id FROM user_follows WHERE follower_id = ? AND status = 'accepted')`;
      params.push(user!.id);
    } else if (filter !== 'all') {
      query += ` AND sp.emotion = ?`;
      params.push(filter);
    }

    query += ` ORDER BY sp.created_at DESC LIMIT 50`;

    const stmt = DB.prepare(query);
    const posts = await stmt.bind(...params).all();

    return c.json({ posts: posts.results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Create new post
social.post('/posts', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<SocialPostBody>();

    if (!body.content || !body.emotion) {
      return c.json({ error: 'Content and emotion are required' }, 400);
    }

    const result = await DB.prepare(`
      INSERT INTO social_posts (user_id, content, emotion, emotion_intensity, visibility)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      user!.id,
      body.content,
      body.emotion,
      body.emotion_intensity || 3,
      body.visibility || 'public'
    ).run();

    await DB.prepare(`
      UPDATE user_profiles 
      SET total_posts = total_posts + 1
      WHERE user_id = ?
    `).bind(user!.id).run();

    return c.json({
      id: result.meta.last_row_id,
      message: 'Post created successfully'
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Toggle like on post
social.post('/posts/:id/like', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const postId = c.req.param('id');

  try {
    const existing = await DB.prepare(`
      SELECT id FROM social_post_likes
      WHERE post_id = ? AND user_id = ?
    `).bind(postId, user!.id).first();

    if (existing) {
      await DB.prepare(`
        DELETE FROM social_post_likes
        WHERE post_id = ? AND user_id = ?
      `).bind(postId, user!.id).run();

      await DB.prepare(`
        UPDATE social_posts
        SET like_count = like_count - 1
        WHERE id = ?
      `).bind(postId).run();
    } else {
      await DB.prepare(`
        INSERT INTO social_post_likes (post_id, user_id)
        VALUES (?, ?)
      `).bind(postId, user!.id).run();

      await DB.prepare(`
        UPDATE social_posts
        SET like_count = like_count + 1
        WHERE id = ?
      `).bind(postId).run();
    }

    return c.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get post comments
social.get('/posts/:id/comments', async (c) => {
  const { DB } = c.env;
  const postId = c.req.param('id');

  try {
    const comments = await DB.prepare(`
      SELECT 
        c.*,
        u.name as user_name
      FROM social_post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).bind(postId).all();

    return c.json({ comments: comments.results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Add comment to post
social.post('/posts/:id/comments', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const postId = c.req.param('id');

  try {
    const body = await c.req.json<CommentBody>();

    if (!body.content) {
      return c.json({ error: 'Comment content is required' }, 400);
    }

    const result = await DB.prepare(`
      INSERT INTO social_post_comments (post_id, user_id, content)
      VALUES (?, ?, ?)
    `).bind(postId, user!.id, body.content).run();

    await DB.prepare(`
      UPDATE social_posts
      SET comment_count = comment_count + 1
      WHERE id = ?
    `).bind(postId).run();

    return c.json({
      id: result.meta.last_row_id,
      message: 'Comment added successfully'
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get user profile
social.get('/profile/:userId', async (c) => {
  const { DB } = c.env;
  const userId = c.req.param('userId');

  try {
    const profile = await DB.prepare(`
      SELECT up.*, u.email, u.name
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE up.user_id = ?
    `).bind(userId).first();

    return c.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Share mood
social.post('/share', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{ mood_id: number; visibility?: string }>();

    const mood = await DB.prepare(
      'SELECT * FROM mood_entries WHERE id = ? AND user_id = ?'
    ).bind(body.mood_id, user!.id).first();

    if (!mood) {
      return c.json({ error: 'Mood not found' }, 404);
    }

    const result = await DB.prepare(`
      INSERT INTO social_posts (user_id, mood_id, visibility, content, emotion)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      user!.id,
      body.mood_id,
      body.visibility || 'public',
      (mood as Record<string, unknown>).note || '',
      (mood as Record<string, unknown>).emotion
    ).run();

    return c.json({ id: result.meta.last_row_id }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Send friend request
social.post('/friends/request', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{ target_user_id: number }>();

    const existing = await DB.prepare(`
      SELECT id FROM user_follows
      WHERE follower_id = ? AND following_id = ?
    `).bind(user!.id, body.target_user_id).first();

    if (existing) {
      return c.json({ error: 'Friend request already sent' }, 400);
    }

    await DB.prepare(`
      INSERT INTO user_follows (follower_id, following_id, status)
      VALUES (?, ?, 'pending')
    `).bind(user!.id, body.target_user_id).run();

    return c.json({ message: 'Friend request sent' }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get friends list
social.get('/friends', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const friends = await DB.prepare(`
      SELECT u.id, u.name, u.email, uf.status, uf.created_at
      FROM user_follows uf
      JOIN users u ON uf.following_id = u.id
      WHERE uf.follower_id = ? AND uf.status = 'accepted'
    `).bind(user!.id).all();

    return c.json({ friends: friends.results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get connections
social.get('/connections', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const connections = await DB.prepare(`
      SELECT sc.*, u.name, u.email
      FROM social_connections sc
      JOIN users u ON sc.connected_user_id = u.id
      WHERE sc.user_id = ?
      ORDER BY sc.created_at DESC
    `).bind(user!.id).all();

    return c.json({ connections: connections.results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Create connection
social.post('/connections', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<ConnectionBody>();

    const result = await DB.prepare(`
      INSERT INTO social_connections (user_id, connected_user_id, connection_type)
      VALUES (?, ?, ?)
    `).bind(user!.id, body.target_user_id, body.connection_type || 'friend').run();

    return c.json({ id: result.meta.last_row_id }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Update connection
social.put('/connections/:id', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const connectionId = c.req.param('id');

  try {
    const body = await c.req.json<{ status?: string; connection_type?: string }>();

    await DB.prepare(`
      UPDATE social_connections
      SET status = COALESCE(?, status), connection_type = COALESCE(?, connection_type)
      WHERE id = ? AND user_id = ?
    `).bind(body.status || null, body.connection_type || null, connectionId, user!.id).run();

    return c.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Send message
social.post('/messages', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<MessageBody>();

    const result = await DB.prepare(`
      INSERT INTO social_messages (sender_id, recipient_id, content)
      VALUES (?, ?, ?)
    `).bind(user!.id, body.recipient_id, body.content).run();

    return c.json({ id: result.meta.last_row_id }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get messages with user
social.get('/messages/:userId', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const targetUserId = c.req.param('userId');

  try {
    const messages = await DB.prepare(`
      SELECT * FROM social_messages
      WHERE (sender_id = ? AND recipient_id = ?)
         OR (sender_id = ? AND recipient_id = ?)
      ORDER BY created_at ASC
      LIMIT 100
    `).bind(user!.id, targetUserId, targetUserId, user!.id).all();

    return c.json({ messages: messages.results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default social;
