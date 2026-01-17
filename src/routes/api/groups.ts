// Groups API - Phase 3 Social Features
import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { getCurrentUser } from '../../middleware/auth';

interface Group {
  id: number;
  name: string;
  description: string | null;
  privacy: string;
  avatar_url: string | null;
  created_by: number;
  member_count: number;
  created_at: string;
}

interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role: string;
  joined_at: string;
}

interface GroupPost {
  id: number;
  group_id: number;
  user_id: number;
  content: string;
  mood_entry_id: number | null;
  like_count: number;
  comment_count: number;
  created_at: string;
}

const groupRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Helper to check membership
async function getMembership(db: D1Database, groupId: number, userId: number): Promise<GroupMember | null> {
  return await db.prepare(
    'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?'
  ).bind(groupId, userId).first<GroupMember>();
}

// Helper to check admin
async function isAdmin(db: D1Database, groupId: number, userId: number): Promise<boolean> {
  const member = await getMembership(db, groupId, userId);
  return member?.role === 'admin' || member?.role === 'moderator';
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

// Create group
groupRoutes.post('/api/groups', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json<{
    name: string;
    description?: string;
    privacy?: string;
    avatar_url?: string;
  }>();

  if (!body.name || body.name.length < 3) {
    return c.json({ error: 'Group name must be at least 3 characters' }, 400);
  }

  const privacy = body.privacy || 'public';
  if (!['public', 'private'].includes(privacy)) {
    return c.json({ error: 'Invalid privacy setting' }, 400);
  }

  // Create group
  const result = await c.env.DB.prepare(
    `INSERT INTO groups (name, description, privacy, avatar_url, created_by)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    body.name,
    body.description || null,
    privacy,
    body.avatar_url || null,
    user.id
  ).run();

  const groupId = result.meta.last_row_id;

  // Add creator as admin
  await c.env.DB.prepare(
    `INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'admin')`
  ).bind(groupId, user.id).run();

  return c.json({
    success: true,
    group: {
      id: groupId,
      name: body.name,
      description: body.description || null,
      privacy,
      created_by: user.id
    }
  });
});

// List groups
groupRoutes.get('/api/groups', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const filter = c.req.query('filter') || 'all'; // all, my, joined
  const search = c.req.query('q');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const offset = (page - 1) * limit;

  let query: string;
  let params: (string | number)[];

  if (filter === 'my') {
    // Groups created by user
    query = `
      SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
        'admin' as user_role
      FROM groups g
      WHERE g.created_by = ?
      ${search ? "AND g.name LIKE ?" : ""}
      ORDER BY g.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params = search ? [user.id, `%${search}%`, limit, offset] : [user.id, limit, offset];
  } else if (filter === 'joined') {
    // Groups user is a member of
    query = `
      SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
        gm.role as user_role
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = ?
      ${search ? "WHERE g.name LIKE ?" : ""}
      ORDER BY gm.joined_at DESC
      LIMIT ? OFFSET ?
    `;
    params = search ? [user.id, `%${search}%`, limit, offset] : [user.id, limit, offset];
  } else {
    // All public groups + user's private groups
    query = `
      SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
        gm.role as user_role
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = ?
      WHERE g.privacy = 'public' OR gm.user_id IS NOT NULL
      ${search ? "AND g.name LIKE ?" : ""}
      ORDER BY g.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params = search ? [user.id, `%${search}%`, limit, offset] : [user.id, limit, offset];
  }

  const groups = await c.env.DB.prepare(query).bind(...params).all<Group & { user_role: string | null }>();

  return c.json({
    groups: groups.results || [],
    page,
    limit,
    hasMore: (groups.results || []).length === limit
  });
});

// Get group details
groupRoutes.get('/api/groups/:id', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const groupId = parseInt(c.req.param('id'));

  const group = await c.env.DB.prepare(
    `SELECT g.*, 
      (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
     FROM groups g WHERE g.id = ?`
  ).bind(groupId).first<Group>();

  if (!group) {
    return c.json({ error: 'Group not found' }, 404);
  }

  // Check access for private groups
  const membership = await getMembership(c.env.DB, groupId, user.id);
  
  if (group.privacy === 'private' && !membership) {
    return c.json({
      id: group.id,
      name: group.name,
      privacy: 'private',
      member_count: group.member_count,
      message: 'This is a private group'
    });
  }

  // Get recent members
  const members = await c.env.DB.prepare(`
    SELECT gm.user_id, gm.role, gm.joined_at, u.name, u.avatar_url,
      p.display_name
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE gm.group_id = ?
    ORDER BY gm.joined_at DESC
    LIMIT 10
  `).bind(groupId).all();

  // Get group mood trends
  const moodTrends = await c.env.DB.prepare(`
    SELECT me.emotion, COUNT(*) as count, AVG(me.intensity) as avg_intensity
    FROM shared_moods sm
    JOIN mood_entries me ON sm.mood_id = me.id
    WHERE sm.group_id = ?
      AND sm.created_at >= datetime('now', '-7 days')
    GROUP BY me.emotion
    ORDER BY count DESC
  `).bind(groupId).all();

  return c.json({
    ...group,
    user_role: membership?.role || null,
    is_member: !!membership,
    members: members.results || [],
    mood_trends: moodTrends.results || []
  });
});

// Join group
groupRoutes.post('/api/groups/:id/join', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const groupId = parseInt(c.req.param('id'));

  const group = await c.env.DB.prepare(
    'SELECT * FROM groups WHERE id = ?'
  ).bind(groupId).first<Group>();

  if (!group) {
    return c.json({ error: 'Group not found' }, 404);
  }

  // Check existing membership
  const existing = await getMembership(c.env.DB, groupId, user.id);
  if (existing) {
    return c.json({ error: 'Already a member' }, 400);
  }

  // For private groups, might need approval (simplified for now)
  if (group.privacy === 'private') {
    return c.json({ error: 'This group requires an invitation to join' }, 403);
  }

  // Join group
  await c.env.DB.prepare(
    `INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'member')`
  ).bind(groupId, user.id).run();

  // Update member count
  await c.env.DB.prepare(
    'UPDATE groups SET member_count = member_count + 1 WHERE id = ?'
  ).bind(groupId).run();

  // Create activity
  await createActivity(c.env.DB, group.created_by, 'group_joined', user.id, 'group', groupId, {
    group_name: group.name,
    message: `${user.name || user.email} joined ${group.name}`
  });

  return c.json({ success: true, message: 'Joined group successfully' });
});

// Leave group
groupRoutes.post('/api/groups/:id/leave', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const groupId = parseInt(c.req.param('id'));

  const group = await c.env.DB.prepare(
    'SELECT * FROM groups WHERE id = ?'
  ).bind(groupId).first<Group>();

  if (!group) {
    return c.json({ error: 'Group not found' }, 404);
  }

  // Check if user is the only admin
  if (group.created_by === user.id) {
    const adminCount = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND role = 'admin'`
    ).bind(groupId).first<{ count: number }>();

    if (adminCount?.count === 1) {
      return c.json({ 
        error: 'Cannot leave group. You are the only admin. Transfer ownership first or delete the group.' 
      }, 400);
    }
  }

  // Leave group
  const result = await c.env.DB.prepare(
    'DELETE FROM group_members WHERE group_id = ? AND user_id = ?'
  ).bind(groupId, user.id).run();

  if (result.meta.changes === 0) {
    return c.json({ error: 'Not a member of this group' }, 400);
  }

  // Update member count
  await c.env.DB.prepare(
    'UPDATE groups SET member_count = member_count - 1 WHERE id = ?'
  ).bind(groupId).run();

  return c.json({ success: true, message: 'Left group successfully' });
});

// Create group post
groupRoutes.post('/api/groups/:id/posts', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const groupId = parseInt(c.req.param('id'));

  // Check membership
  const membership = await getMembership(c.env.DB, groupId, user.id);
  if (!membership) {
    return c.json({ error: 'Must be a member to post' }, 403);
  }

  const body = await c.req.json<{
    content: string;
    mood_entry_id?: number;
  }>();

  if (!body.content || body.content.length < 1) {
    return c.json({ error: 'Content is required' }, 400);
  }

  // Create post
  const result = await c.env.DB.prepare(
    `INSERT INTO group_posts (group_id, user_id, content, mood_entry_id)
     VALUES (?, ?, ?, ?)`
  ).bind(groupId, user.id, body.content, body.mood_entry_id || null).run();

  // If sharing a mood, also create shared_mood entry
  if (body.mood_entry_id) {
    await c.env.DB.prepare(
      `INSERT INTO shared_moods (mood_id, user_id, shared_with, group_id, privacy)
       VALUES (?, ?, 'group', ?, 'friends')`
    ).bind(body.mood_entry_id, user.id, groupId).run();
  }

  // Notify group members (simplified - just the admin)
  const group = await c.env.DB.prepare(
    'SELECT * FROM groups WHERE id = ?'
  ).bind(groupId).first<Group>();

  if (group && group.created_by !== user.id) {
    await createActivity(c.env.DB, group.created_by, 'group_post', user.id, 'group_post', result.meta.last_row_id, {
      group_name: group.name,
      message: `${user.name || user.email} posted in ${group.name}`
    });
  }

  return c.json({
    success: true,
    post: {
      id: result.meta.last_row_id,
      group_id: groupId,
      user_id: user.id,
      content: body.content,
      mood_entry_id: body.mood_entry_id || null
    }
  });
});

// Get group posts
groupRoutes.get('/api/groups/:id/posts', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const groupId = parseInt(c.req.param('id'));
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const offset = (page - 1) * limit;

  // Check access
  const group = await c.env.DB.prepare(
    'SELECT * FROM groups WHERE id = ?'
  ).bind(groupId).first<Group>();

  if (!group) {
    return c.json({ error: 'Group not found' }, 404);
  }

  const membership = await getMembership(c.env.DB, groupId, user.id);
  
  if (group.privacy === 'private' && !membership) {
    return c.json({ error: 'Access denied' }, 403);
  }

  const posts = await c.env.DB.prepare(`
    SELECT 
      gp.*,
      u.name as author_name, u.avatar_url as author_avatar,
      p.display_name as author_display_name,
      me.emotion, me.intensity,
      (SELECT COUNT(*) FROM reactions WHERE target_type = 'group_post' AND target_id = gp.id) as reaction_count
    FROM group_posts gp
    JOIN users u ON gp.user_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    LEFT JOIN mood_entries me ON gp.mood_entry_id = me.id
    WHERE gp.group_id = ?
    ORDER BY gp.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(groupId, limit, offset).all();

  return c.json({
    posts: posts.results || [],
    page,
    limit,
    hasMore: (posts.results || []).length === limit
  });
});

// Get group members
groupRoutes.get('/api/groups/:id/members', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const groupId = parseInt(c.req.param('id'));
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const offset = (page - 1) * limit;

  const members = await c.env.DB.prepare(`
    SELECT 
      gm.user_id, gm.role, gm.joined_at,
      u.name, u.email, u.avatar_url,
      p.display_name, p.bio
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE gm.group_id = ?
    ORDER BY 
      CASE gm.role 
        WHEN 'admin' THEN 1 
        WHEN 'moderator' THEN 2 
        ELSE 3 
      END,
      gm.joined_at ASC
    LIMIT ? OFFSET ?
  `).bind(groupId, limit, offset).all();

  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM group_members WHERE group_id = ?'
  ).bind(groupId).first<{ count: number }>();

  return c.json({
    members: members.results || [],
    total: countResult?.count || 0,
    page,
    limit
  });
});

// Update group (admin only)
groupRoutes.put('/api/groups/:id', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const groupId = parseInt(c.req.param('id'));

  if (!await isAdmin(c.env.DB, groupId, user.id)) {
    return c.json({ error: 'Only admins can update the group' }, 403);
  }

  const body = await c.req.json<{
    name?: string;
    description?: string;
    privacy?: string;
    avatar_url?: string;
  }>();

  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (body.name) {
    updates.push('name = ?');
    values.push(body.name);
  }
  if (body.description !== undefined) {
    updates.push('description = ?');
    values.push(body.description || null);
  }
  if (body.privacy) {
    if (!['public', 'private'].includes(body.privacy)) {
      return c.json({ error: 'Invalid privacy setting' }, 400);
    }
    updates.push('privacy = ?');
    values.push(body.privacy);
  }
  if (body.avatar_url !== undefined) {
    updates.push('avatar_url = ?');
    values.push(body.avatar_url || null);
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(groupId as unknown as string);

    await c.env.DB.prepare(
      `UPDATE groups SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();
  }

  return c.json({ success: true, message: 'Group updated' });
});

// Update member role (admin only)
groupRoutes.put('/api/groups/:id/members/:userId', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const groupId = parseInt(c.req.param('id'));
  const targetUserId = parseInt(c.req.param('userId'));

  if (!await isAdmin(c.env.DB, groupId, user.id)) {
    return c.json({ error: 'Only admins can change member roles' }, 403);
  }

  const body = await c.req.json<{ role: string }>();

  if (!['admin', 'moderator', 'member'].includes(body.role)) {
    return c.json({ error: 'Invalid role' }, 400);
  }

  await c.env.DB.prepare(
    'UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?'
  ).bind(body.role, groupId, targetUserId).run();

  return c.json({ success: true, message: 'Member role updated' });
});

// Remove member (admin only)
groupRoutes.delete('/api/groups/:id/members/:userId', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const groupId = parseInt(c.req.param('id'));
  const targetUserId = parseInt(c.req.param('userId'));

  if (!await isAdmin(c.env.DB, groupId, user.id)) {
    return c.json({ error: 'Only admins can remove members' }, 403);
  }

  // Cannot remove self if only admin
  if (targetUserId === user.id) {
    return c.json({ error: 'Use leave endpoint to leave the group' }, 400);
  }

  await c.env.DB.prepare(
    'DELETE FROM group_members WHERE group_id = ? AND user_id = ?'
  ).bind(groupId, targetUserId).run();

  await c.env.DB.prepare(
    'UPDATE groups SET member_count = member_count - 1 WHERE id = ?'
  ).bind(groupId).run();

  return c.json({ success: true, message: 'Member removed' });
});

// Delete group (admin only)
groupRoutes.delete('/api/groups/:id', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const groupId = parseInt(c.req.param('id'));

  const group = await c.env.DB.prepare(
    'SELECT * FROM groups WHERE id = ?'
  ).bind(groupId).first<Group>();

  if (!group) {
    return c.json({ error: 'Group not found' }, 404);
  }

  // Only creator can delete
  if (group.created_by !== user.id) {
    return c.json({ error: 'Only the group creator can delete the group' }, 403);
  }

  // Delete group (cascades to members, posts)
  await c.env.DB.prepare('DELETE FROM groups WHERE id = ?').bind(groupId).run();

  return c.json({ success: true, message: 'Group deleted' });
});

// Get group mood trends
groupRoutes.get('/api/groups/:id/trends', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const groupId = parseInt(c.req.param('id'));
  const days = parseInt(c.req.query('days') || '7');

  // Check access
  const membership = await getMembership(c.env.DB, groupId, user.id);
  const group = await c.env.DB.prepare(
    'SELECT * FROM groups WHERE id = ?'
  ).bind(groupId).first<Group>();

  if (!group) {
    return c.json({ error: 'Group not found' }, 404);
  }

  if (group.privacy === 'private' && !membership) {
    return c.json({ error: 'Access denied' }, 403);
  }

  // Get mood trends
  const trends = await c.env.DB.prepare(`
    SELECT 
      DATE(sm.created_at) as date,
      me.emotion,
      COUNT(*) as count,
      AVG(me.intensity) as avg_intensity
    FROM shared_moods sm
    JOIN mood_entries me ON sm.mood_id = me.id
    WHERE sm.group_id = ?
      AND sm.created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY DATE(sm.created_at), me.emotion
    ORDER BY date DESC, count DESC
  `).bind(groupId, days).all();

  // Get dominant mood per day
  const dailyDominant = await c.env.DB.prepare(`
    SELECT DATE(sm.created_at) as date, me.emotion, COUNT(*) as count
    FROM shared_moods sm
    JOIN mood_entries me ON sm.mood_id = me.id
    WHERE sm.group_id = ?
      AND sm.created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY DATE(sm.created_at)
    ORDER BY date DESC
  `).bind(groupId, days).all();

  return c.json({
    trends: trends.results || [],
    daily_dominant: dailyDominant.results || []
  });
});

export default groupRoutes;
