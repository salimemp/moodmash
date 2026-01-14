/**
 * Groups API Routes
 * Handles mood groups, group membership, group moods
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

interface GroupRow {
  id: number;
  name: string;
  description: string;
  created_by: number;
  member_count: number;
  created_at: string;
}

interface CreateGroupBody {
  name: string;
  description?: string;
  is_private?: boolean;
}

const groups = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
groups.use('*', requireAuth);

// Create group
groups.post('/', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<CreateGroupBody>();

    if (!body.name) {
      return c.json({ error: 'Group name is required' }, 400);
    }

    const result = await DB.prepare(`
      INSERT INTO mood_groups (name, description, created_by, is_private)
      VALUES (?, ?, ?, ?)
    `).bind(
      body.name,
      body.description || '',
      user!.id,
      body.is_private ? 1 : 0
    ).run();

    // Add creator as member
    await DB.prepare(`
      INSERT INTO group_members (group_id, user_id, role)
      VALUES (?, ?, 'admin')
    `).bind(result.meta.last_row_id, user!.id).run();

    return c.json({ id: result.meta.last_row_id, message: 'Group created' }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get all groups (user is member of or public)
groups.get('/', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const allGroups = await DB.prepare(`
      SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
        EXISTS(SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = ?) as is_member
      FROM mood_groups g
      WHERE g.is_private = 0 OR g.id IN (SELECT group_id FROM group_members WHERE user_id = ?)
      ORDER BY g.created_at DESC
      LIMIT 50
    `).bind(user!.id, user!.id).all();

    return c.json({ groups: allGroups.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Join group
groups.post('/:id/join', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const groupId = c.req.param('id');

  try {
    // Check if already member
    const existing = await DB.prepare(`
      SELECT id FROM group_members
      WHERE group_id = ? AND user_id = ?
    `).bind(groupId, user!.id).first();

    if (existing) {
      return c.json({ error: 'Already a member' }, 400);
    }

    await DB.prepare(`
      INSERT INTO group_members (group_id, user_id, role)
      VALUES (?, ?, 'member')
    `).bind(groupId, user!.id).run();

    return c.json({ message: 'Joined group successfully' }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get group moods
groups.get('/:id/moods', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const groupId = c.req.param('id');

  try {
    // Verify membership
    const member = await DB.prepare(`
      SELECT id FROM group_members
      WHERE group_id = ? AND user_id = ?
    `).bind(groupId, user!.id).first();

    if (!member) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    const moods = await DB.prepare(`
      SELECT gm.*, u.name as user_name
      FROM group_mood_shares gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY gm.shared_at DESC
      LIMIT 50
    `).bind(groupId).all();

    return c.json({ moods: moods.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default groups;
