/**
 * Mood Entry API Routes
 * Handles mood logging, editing, deletion, and retrieval
 */

import { Hono } from 'hono';
import type { Bindings, MoodEntry } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';
import { uploadToR2, deleteFromR2, generateFileKey } from '../../utils/media';

const mood = new Hono<{ Bindings: Bindings }>();

// Apply auth middleware to all mood routes
mood.use('*', requireAuth);

// Get all mood entries for user
mood.get('/', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  const moods = await DB.prepare(
    'SELECT * FROM mood_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 100'
  )
    .bind(user!.id)
    .all();

  return c.json(moods.results);
});

// Get single mood entry
mood.get('/:id', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const id = c.req.param('id');

  const mood = await DB.prepare(
    'SELECT * FROM mood_entries WHERE id = ? AND user_id = ?'
  )
    .bind(id, user!.id)
    .first() as MoodEntry | null;

  if (!mood) {
    return c.json({ error: 'Mood entry not found' }, 404);
  }

  return c.json(mood);
});

// Create mood entry
mood.post('/', async (c) => {
  const { DB, R2 } = c.env;
  const user = await getCurrentUser(c);
  const formData = await c.req.formData();

  // Extract mood data
  const emotion = formData.get('emotion') as string;
  const intensity = parseInt(formData.get('intensity') as string);
  const note = formData.get('note') as string || null;
  const activities = formData.get('activities') as string || '[]';
  const weather = formData.get('weather') as string || null;
  const sleep_hours = parseFloat(formData.get('sleep_hours') as string) || null;
  const social_interaction = formData.get('social_interaction') as string || null;
  const photo = formData.get('photo') as File | null;

  // Validate
  if (!emotion || !intensity) {
    return c.json({ error: 'Emotion and intensity required' }, 400);
  }

  // Upload photo if provided
  let photoUrl: string | null = null;
  if (photo && photo.size > 0 && R2) {
    const key = generateFileKey(user!.id, photo.name);
    const fileBuffer = await photo.arrayBuffer();
    await uploadToR2(R2, key, fileBuffer);
    photoUrl = `/api/files/${key}`;
  }

  // Insert mood entry
  const result = await DB.prepare(
    `INSERT INTO mood_entries 
    (user_id, emotion, intensity, note, activities, weather, sleep_hours, social_interaction, photo_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      user!.id,
      emotion,
      intensity,
      note,
      activities,
      weather,
      sleep_hours,
      social_interaction,
      photoUrl,
      new Date().toISOString()
    )
    .run();

  const newMood = await DB.prepare('SELECT * FROM mood_entries WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first() as MoodEntry;

  return c.json(newMood, 201);
});

// Update mood entry
mood.put('/:id', async (c) => {
  const { DB, R2 } = c.env;
  const user = await getCurrentUser(c);
  const id = c.req.param('id');

  // Check ownership
  const existing = await DB.prepare(
    'SELECT * FROM mood_entries WHERE id = ? AND user_id = ?'
  )
    .bind(id, user!.id)
    .first() as MoodEntry | null;

  if (!existing) {
    return c.json({ error: 'Mood entry not found' }, 404);
  }

  const formData = await c.req.formData();
  const emotion = formData.get('emotion') as string || existing.emotion;
  const intensity = parseInt(formData.get('intensity') as string) || existing.intensity;
  const note = formData.get('note') as string || existing.note;
  const activities = formData.get('activities') as string || existing.activities;
  const weather = formData.get('weather') as string || existing.weather;
  const sleep_hours = parseFloat(formData.get('sleep_hours') as string) || existing.sleep_hours;
  const social_interaction = formData.get('social_interaction') as string || existing.social_interaction;
  const photo = formData.get('photo') as File | null;

  // Handle photo update
  let photoUrl = existing.photo_url;
  if (photo && photo.size > 0 && R2) {
    // Delete old photo
    if (existing.photo_url) {
      const oldKey = existing.photo_url.replace('/api/files/', '');
      await deleteFromR2(R2, oldKey);
    }
    
    // Upload new photo
    const key = generateFileKey(user!.id, photo.name);
    const fileBuffer = await photo.arrayBuffer();
    await uploadToR2(R2, key, fileBuffer);
    photoUrl = `/api/files/${key}`;
  }

  // Update entry
  await DB.prepare(
    `UPDATE mood_entries 
    SET emotion = ?, intensity = ?, note = ?, activities = ?, weather = ?, 
        sleep_hours = ?, social_interaction = ?, photo_url = ?, updated_at = ?
    WHERE id = ? AND user_id = ?`
  )
    .bind(
      emotion,
      intensity,
      note,
      activities,
      weather,
      sleep_hours,
      social_interaction,
      photoUrl,
      new Date().toISOString(),
      id,
      user!.id
    )
    .run();

  const updated = await DB.prepare('SELECT * FROM mood_entries WHERE id = ?')
    .bind(id)
    .first() as MoodEntry;

  return c.json(updated);
});

// Delete mood entry
mood.delete('/:id', async (c) => {
  const { DB, R2 } = c.env;
  const user = await getCurrentUser(c);
  const id = c.req.param('id');

  // Check ownership and get photo
  const existing = await DB.prepare(
    'SELECT photo_url FROM mood_entries WHERE id = ? AND user_id = ?'
  )
    .bind(id, user!.id)
    .first() as { photo_url: string | null } | null;

  if (!existing) {
    return c.json({ error: 'Mood entry not found' }, 404);
  }

  // Delete photo from R2
  if (existing.photo_url && R2) {
    const key = existing.photo_url.replace('/api/files/', '');
    await deleteFromR2(R2, key);
  }

  // Delete entry
  await DB.prepare('DELETE FROM mood_entries WHERE id = ? AND user_id = ?')
    .bind(id, user!.id)
    .run();

  return c.json({ success: true });
});

// Quick mood entry (simplified)
mood.post('/quick', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const { emotion, intensity } = await c.req.json();

  if (!emotion || !intensity) {
    return c.json({ error: 'Emotion and intensity required' }, 400);
  }

  const result = await DB.prepare(
    'INSERT INTO mood_entries (user_id, emotion, intensity, created_at) VALUES (?, ?, ?, ?)'
  )
    .bind(user!.id, emotion, intensity, new Date().toISOString())
    .run();

  const newMood = await DB.prepare('SELECT * FROM mood_entries WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();

  return c.json(newMood, 201);
});

export default mood;
