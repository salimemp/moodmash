/**
 * Media API Routes
 * Handles media upload, retrieval, listing, deletion
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';
import {
  uploadToR2,
  downloadFromR2,
  deleteFromR2,
  generateFileKey,
  listUserMediaFiles,
  type MediaFile
} from '../../utils/media';

const media = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
media.use('*', requireAuth);

// Upload media
media.post('/upload', async (c) => {
  const { DB, R2 } = c.env;
  const user = await getCurrentUser(c);

  if (!R2) {
    return c.json({ error: 'Media storage not configured' }, 503);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const mediaType = formData.get('type') as string || 'image';

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/wav', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'File type not allowed' }, 400);
    }

    // Validate file size (20MB max for media)
    if (file.size > 20 * 1024 * 1024) {
      return c.json({ error: 'File size exceeds 20MB limit' }, 400);
    }

    const key = generateFileKey(user!.id, file.name);
    const buffer = await file.arrayBuffer();
    await uploadToR2(R2, key, buffer);

    // Save to database
    const result = await DB.prepare(`
      INSERT INTO media_files (user_id, file_key, original_filename, file_type, mime_type, file_size_bytes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(user!.id, key, file.name, mediaType, file.type, file.size).run();

    return c.json({
      id: result.meta.last_row_id,
      key,
      filename: file.name,
      url: `/api/media/${result.meta.last_row_id}`
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get media by ID
media.get('/:id', async (c) => {
  const { DB, R2 } = c.env;
  const user = await getCurrentUser(c);
  const mediaId = c.req.param('id');

  if (!R2) {
    return c.json({ error: 'Media storage not configured' }, 503);
  }

  try {
    const mediaRecord = await DB.prepare(`
      SELECT file_key, mime_type FROM media_files
      WHERE id = ? AND user_id = ?
    `).bind(mediaId, user!.id).first() as { file_key: string; mime_type: string } | null;

    if (!mediaRecord) {
      return c.json({ error: 'Media not found' }, 404);
    }

    const fileData = await downloadFromR2(R2, mediaRecord.file_key);

    if (!fileData) {
      return c.json({ error: 'File not found in storage' }, 404);
    }

    // Convert R2ObjectBody to ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': mediaRecord.mime_type,
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// List user media
media.get('/', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const mediaType = c.req.query('type');

  try {
    let query = `
      SELECT id, file_key, original_filename, file_type, mime_type, file_size_bytes, created_at
      FROM media_files
      WHERE user_id = ?
    `;
    const params: (number | string)[] = [user!.id];

    if (mediaType) {
      query += ' AND file_type = ?';
      params.push(mediaType);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const mediaList = await DB.prepare(query).bind(...params).all();
    return c.json({ media: mediaList.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Delete media
media.delete('/:id', async (c) => {
  const { DB, R2 } = c.env;
  const user = await getCurrentUser(c);
  const mediaId = c.req.param('id');

  if (!R2) {
    return c.json({ error: 'Media storage not configured' }, 503);
  }

  try {
    const mediaRecord = await DB.prepare(`
      SELECT file_key FROM media_files
      WHERE id = ? AND user_id = ?
    `).bind(mediaId, user!.id).first() as { file_key: string } | null;

    if (!mediaRecord) {
      return c.json({ error: 'Media not found' }, 404);
    }

    // Delete from R2
    await deleteFromR2(R2, mediaRecord.file_key);

    // Delete from database
    await DB.prepare(`
      DELETE FROM media_files
      WHERE id = ? AND user_id = ?
    `).bind(mediaId, user!.id).run();

    return c.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default media;
