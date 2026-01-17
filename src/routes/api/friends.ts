// Friends API - Phase 3 Social Features
import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { getCurrentUser } from '../../middleware/auth';

interface UserProfile {
  id: number;
  user_id: number;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  profile_visibility: string;
  mood_visibility: string;
}

interface Friendship {
  id: number;
  user_id: number;
  friend_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FriendWithProfile {
  id: number;
  user_id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
  display_name: string | null;
  bio: string | null;
  friendship_status: string;
  created_at: string;
}

const friendRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Helper to ensure user profile exists
async function ensureProfile(db: D1Database, userId: number): Promise<void> {
  const existing = await db.prepare(
    'SELECT id FROM user_profiles WHERE user_id = ?'
  ).bind(userId).first();
  
  if (!existing) {
    await db.prepare(
      `INSERT INTO user_profiles (user_id) VALUES (?)`
    ).bind(userId).run();
  }
}

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

// Send friend request
friendRoutes.post('/api/friends/request', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json<{ friend_id?: number; email?: string }>();
  let friendId = body.friend_id;

  // Find user by email if friend_id not provided
  if (!friendId && body.email) {
    const friendUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(body.email).first<{ id: number }>();
    
    if (!friendUser) {
      return c.json({ error: 'User not found' }, 404);
    }
    friendId = friendUser.id;
  }

  if (!friendId) {
    return c.json({ error: 'friend_id or email is required' }, 400);
  }

  if (friendId === user.id) {
    return c.json({ error: 'Cannot add yourself as a friend' }, 400);
  }

  // Check if friend allows requests
  const friendProfile = await c.env.DB.prepare(
    'SELECT allow_friend_requests FROM user_profiles WHERE user_id = ?'
  ).bind(friendId).first<{ allow_friend_requests: boolean }>();

  if (friendProfile && !friendProfile.allow_friend_requests) {
    return c.json({ error: 'User is not accepting friend requests' }, 403);
  }

  // Check existing friendship
  const existing = await c.env.DB.prepare(
    `SELECT id, status FROM friendships 
     WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`
  ).bind(user.id, friendId, friendId, user.id).first<Friendship>();

  if (existing) {
    if (existing.status === 'accepted') {
      return c.json({ error: 'Already friends' }, 400);
    }
    if (existing.status === 'pending') {
      return c.json({ error: 'Friend request already pending' }, 400);
    }
    if (existing.status === 'blocked') {
      return c.json({ error: 'Cannot send request' }, 403);
    }
  }

  // Create friend request
  await c.env.DB.prepare(
    `INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, 'pending')`
  ).bind(user.id, friendId).run();

  // Create activity for the friend
  await createActivity(c.env.DB, friendId, 'friend_request', user.id, 'user', user.id, {
    message: `${user.name || user.email} sent you a friend request`
  });

  return c.json({ success: true, message: 'Friend request sent' });
});

// Accept friend request
friendRoutes.post('/api/friends/accept/:id', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const requestId = parseInt(c.req.param('id'));

  // Find the request where current user is the recipient
  const request = await c.env.DB.prepare(
    `SELECT id, user_id, friend_id FROM friendships 
     WHERE id = ? AND friend_id = ? AND status = 'pending'`
  ).bind(requestId, user.id).first<Friendship>();

  if (!request) {
    return c.json({ error: 'Friend request not found' }, 404);
  }

  // Update status to accepted
  await c.env.DB.prepare(
    `UPDATE friendships SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(requestId).run();

  // Create reverse friendship
  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO friendships (user_id, friend_id, status) VALUES (?, ?, 'accepted')`
  ).bind(user.id, request.user_id).run();

  // Create activity for the requester
  await createActivity(c.env.DB, request.user_id, 'friend_accepted', user.id, 'user', user.id, {
    message: `${user.name || user.email} accepted your friend request`
  });

  return c.json({ success: true, message: 'Friend request accepted' });
});

// Decline friend request
friendRoutes.post('/api/friends/decline/:id', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const requestId = parseInt(c.req.param('id'));

  const result = await c.env.DB.prepare(
    `DELETE FROM friendships WHERE id = ? AND friend_id = ? AND status = 'pending'`
  ).bind(requestId, user.id).run();

  if (result.meta.changes === 0) {
    return c.json({ error: 'Friend request not found' }, 404);
  }

  return c.json({ success: true, message: 'Friend request declined' });
});

// Remove friend
friendRoutes.delete('/api/friends/:id', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const friendId = parseInt(c.req.param('id'));

  // Delete both directions of friendship
  await c.env.DB.prepare(
    `DELETE FROM friendships 
     WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`
  ).bind(user.id, friendId, friendId, user.id).run();

  return c.json({ success: true, message: 'Friend removed' });
});

// Get friends list
friendRoutes.get('/api/friends', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const status = c.req.query('status') || 'accepted';
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const offset = (page - 1) * limit;

  let query: string;
  let countQuery: string;

  if (status === 'pending') {
    // Get pending requests sent TO the user
    query = `
      SELECT 
        f.id, f.user_id, f.status as friendship_status, f.created_at,
        u.email, u.name, u.avatar_url,
        p.display_name, p.bio
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE f.friend_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `;
    countQuery = `SELECT COUNT(*) as count FROM friendships WHERE friend_id = ? AND status = 'pending'`;
  } else {
    // Get accepted friends
    query = `
      SELECT 
        f.id, f.friend_id as user_id, f.status as friendship_status, f.created_at,
        u.email, u.name, u.avatar_url,
        p.display_name, p.bio
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE f.user_id = ? AND f.status = 'accepted'
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `;
    countQuery = `SELECT COUNT(*) as count FROM friendships WHERE user_id = ? AND status = 'accepted'`;
  }

  const [friends, countResult] = await Promise.all([
    c.env.DB.prepare(query).bind(user.id, limit, offset).all<FriendWithProfile>(),
    c.env.DB.prepare(countQuery).bind(user.id).first<{ count: number }>()
  ]);

  return c.json({
    friends: friends.results || [],
    total: countResult?.count || 0,
    page,
    limit,
    hasMore: offset + limit < (countResult?.count || 0)
  });
});

// Get friend suggestions
friendRoutes.get('/api/friends/suggestions', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const limit = Math.min(parseInt(c.req.query('limit') || '10'), 20);

  // Get suggestions based on mutual friends
  const suggestions = await c.env.DB.prepare(`
    SELECT DISTINCT 
      u.id as user_id, u.email, u.name, u.avatar_url,
      p.display_name, p.bio,
      (
        SELECT COUNT(*) FROM friendships f1
        JOIN friendships f2 ON f1.friend_id = f2.user_id
        WHERE f1.user_id = ? AND f2.friend_id = u.id
        AND f1.status = 'accepted' AND f2.status = 'accepted'
      ) as mutual_friends
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE u.id != ?
      AND (p.allow_friend_requests IS NULL OR p.allow_friend_requests = 1)
      AND NOT EXISTS (
        SELECT 1 FROM friendships f 
        WHERE (f.user_id = ? AND f.friend_id = u.id)
        OR (f.user_id = u.id AND f.friend_id = ?)
      )
    ORDER BY mutual_friends DESC
    LIMIT ?
  `).bind(user.id, user.id, user.id, user.id, limit).all<{
    user_id: number;
    email: string;
    name: string | null;
    avatar_url: string | null;
    display_name: string | null;
    bio: string | null;
    mutual_friends: number;
  }>();

  return c.json({ suggestions: suggestions.results || [] });
});

// Search users
friendRoutes.get('/api/friends/search', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const q = c.req.query('q');
  if (!q || q.length < 2) {
    return c.json({ error: 'Search query must be at least 2 characters' }, 400);
  }

  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const searchTerm = `%${q}%`;

  const users = await c.env.DB.prepare(`
    SELECT 
      u.id as user_id, u.email, u.name, u.avatar_url,
      p.display_name, p.bio, p.profile_visibility,
      CASE 
        WHEN f.status = 'accepted' THEN 'friend'
        WHEN f.status = 'pending' AND f.user_id = ? THEN 'request_sent'
        WHEN f.status = 'pending' AND f.friend_id = ? THEN 'request_received'
        ELSE 'none'
      END as friendship_status
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    LEFT JOIN friendships f ON 
      (f.user_id = ? AND f.friend_id = u.id) OR 
      (f.user_id = u.id AND f.friend_id = ?)
    WHERE u.id != ?
      AND (p.profile_visibility IS NULL OR p.profile_visibility != 'private')
      AND (u.email LIKE ? OR u.name LIKE ? OR p.display_name LIKE ?)
    LIMIT ?
  `).bind(user.id, user.id, user.id, user.id, user.id, searchTerm, searchTerm, searchTerm, limit).all<{
    user_id: number;
    email: string;
    name: string | null;
    avatar_url: string | null;
    display_name: string | null;
    bio: string | null;
    profile_visibility: string | null;
    friendship_status: string;
  }>();

  return c.json({ users: users.results || [] });
});

// Get user profile (public view)
friendRoutes.get('/api/users/:id/profile', async (c) => {
  const user = await getCurrentUser(c);
  const profileUserId = parseInt(c.req.param('id'));

  // Get profile
  const profile = await c.env.DB.prepare(`
    SELECT 
      u.id, u.email, u.name, u.avatar_url, u.created_at,
      p.display_name, p.bio, p.location, p.profile_visibility, p.mood_visibility
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE u.id = ?
  `).bind(profileUserId).first<{
    id: number;
    email: string;
    name: string | null;
    avatar_url: string | null;
    created_at: string;
    display_name: string | null;
    bio: string | null;
    location: string | null;
    profile_visibility: string | null;
    mood_visibility: string | null;
  }>();

  if (!profile) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Check visibility
  const isOwner = user?.id === profileUserId;
  const visibility = profile.profile_visibility || 'public';

  if (visibility === 'private' && !isOwner) {
    return c.json({ error: 'Profile is private' }, 403);
  }

  // Check if friends
  let isFriend = false;
  let friendshipStatus = 'none';

  if (user && !isOwner) {
    const friendship = await c.env.DB.prepare(`
      SELECT status FROM friendships 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `).bind(user.id, profileUserId, profileUserId, user.id).first<{ status: string }>();

    if (friendship) {
      friendshipStatus = friendship.status;
      isFriend = friendship.status === 'accepted';
    }
  }

  if (visibility === 'friends' && !isOwner && !isFriend) {
    return c.json({
      id: profile.id,
      display_name: profile.display_name || profile.name,
      avatar_url: profile.avatar_url,
      profile_visibility: 'friends',
      message: 'This profile is only visible to friends'
    });
  }

  // Get friend count
  const friendCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM friendships WHERE user_id = ? AND status = 'accepted'`
  ).bind(profileUserId).first<{ count: number }>();

  // Get recent shared moods if allowed
  let recentMoods: unknown[] = [];
  const moodVisibility = profile.mood_visibility || 'friends';

  if (isOwner || moodVisibility === 'public' || (moodVisibility === 'friends' && isFriend)) {
    const moods = await c.env.DB.prepare(`
      SELECT sm.id, sm.caption, sm.created_at, me.emotion, me.intensity
      FROM shared_moods sm
      JOIN mood_entries me ON sm.mood_id = me.id
      WHERE sm.user_id = ? AND sm.privacy IN ('public', 'friends')
      ORDER BY sm.created_at DESC
      LIMIT 5
    `).bind(profileUserId).all();
    recentMoods = moods.results || [];
  }

  return c.json({
    id: profile.id,
    email: isOwner ? profile.email : undefined,
    name: profile.name,
    display_name: profile.display_name,
    bio: profile.bio,
    location: profile.location,
    avatar_url: profile.avatar_url,
    created_at: profile.created_at,
    profile_visibility: profile.profile_visibility,
    mood_visibility: isOwner ? profile.mood_visibility : undefined,
    friend_count: friendCount?.count || 0,
    friendship_status: isOwner ? 'self' : friendshipStatus,
    recent_moods: recentMoods
  });
});

// Update privacy settings
friendRoutes.put('/api/users/privacy', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json<{
    profile_visibility?: string;
    mood_visibility?: string;
    allow_friend_requests?: boolean;
    show_mood_history?: boolean;
  }>();

  await ensureProfile(c.env.DB, user.id);

  const updates: string[] = [];
  const values: (string | boolean)[] = [];

  if (body.profile_visibility) {
    if (!['public', 'friends', 'private'].includes(body.profile_visibility)) {
      return c.json({ error: 'Invalid profile_visibility' }, 400);
    }
    updates.push('profile_visibility = ?');
    values.push(body.profile_visibility);
  }

  if (body.mood_visibility) {
    if (!['public', 'friends', 'private'].includes(body.mood_visibility)) {
      return c.json({ error: 'Invalid mood_visibility' }, 400);
    }
    updates.push('mood_visibility = ?');
    values.push(body.mood_visibility);
  }

  if (typeof body.allow_friend_requests === 'boolean') {
    updates.push('allow_friend_requests = ?');
    values.push(body.allow_friend_requests);
  }

  if (typeof body.show_mood_history === 'boolean') {
    updates.push('show_mood_history = ?');
    values.push(body.show_mood_history);
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');

    await c.env.DB.prepare(
      `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = ?`
    ).bind(...values, user.id).run();
  }

  return c.json({ success: true, message: 'Privacy settings updated' });
});

// Update user profile
friendRoutes.put('/api/users/profile', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json<{
    display_name?: string;
    bio?: string;
    location?: string;
    avatar_url?: string;
  }>();

  await ensureProfile(c.env.DB, user.id);

  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (body.display_name !== undefined) {
    updates.push('display_name = ?');
    values.push(body.display_name || null);
  }

  if (body.bio !== undefined) {
    updates.push('bio = ?');
    values.push(body.bio || null);
  }

  if (body.location !== undefined) {
    updates.push('location = ?');
    values.push(body.location || null);
  }

  if (body.avatar_url !== undefined) {
    updates.push('avatar_url = ?');
    values.push(body.avatar_url || null);
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');

    await c.env.DB.prepare(
      `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = ?`
    ).bind(...values, user.id).run();
  }

  return c.json({ success: true, message: 'Profile updated' });
});

export default friendRoutes;
