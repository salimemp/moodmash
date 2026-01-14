/**
 * Files API Routes
 * Handles file upload, download, listing, deletion via R2
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';
import {
  uploadToR2,
  downloadFromR2,
  deleteFromR2,
  generateFileKey
} from '../../utils/media';

interface FileRow {
  id: number;
  user_id: number;
  filename: string;
  file_key: string;
  file_size: number;
  content_type: string;
  created_at: string;
}

const files = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
files.use('*', requireAuth);

// Upload file
files.post('/upload', async (c) => {
  const { DB, R2 } = c.env;
  const user = await getCurrentUser(c);

  if (!R2) {
    return c.json({ error: 'File storage not configured' }, 503);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: 'File size exceeds 10MB limit' }, 400);
    }

    const key = generateFileKey(user!.id, file.name);
    const fileBuffer = await file.arrayBuffer();

    await uploadToR2(R2, key, fileBuffer);

    // Save file metadata
    const result = await DB.prepare(`
      INSERT INTO user_files (user_id, filename, file_key, file_size, content_type)
      VALUES (?, ?, ?, ?, ?)
    `).bind(user!.id, file.name, key, file.size, file.type || 'application/octet-stream').run();

    return c.json({
      id: result.meta.last_row_id,
      key,
      filename: file.name,
      url: `/api/files/${key}`
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Download file
files.get('/:key{.+}', async (c) => {
  const { DB, R2 } = c.env;
  const user = await getCurrentUser(c);
  const key = c.req.param('key');

  if (!R2) {
    return c.json({ error: 'File storage not configured' }, 503);
  }

  try {
    // Verify ownership
    const fileRecord = await DB.prepare(`
      SELECT * FROM user_files
      WHERE file_key = ? AND user_id = ?
    `).bind(key, user!.id).first() as FileRow | null;

    if (!fileRecord) {
      return c.json({ error: 'File not found' }, 404);
    }

    const fileData = await downloadFromR2(R2, key);

    if (!fileData) {
      return c.json({ error: 'File not found in storage' }, 404);
    }

    // Convert R2ObjectBody to ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': fileRecord.content_type,
        'Content-Disposition': `inline; filename="${fileRecord.filename}"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// List user files
files.get('/', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const filesList = await DB.prepare(`
      SELECT id, filename, file_key, file_size, content_type, created_at
      FROM user_files
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).bind(user!.id).all();

    return c.json({ files: filesList.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Delete file
files.delete('/:id', async (c) => {
  const { DB, R2 } = c.env;
  const user = await getCurrentUser(c);
  const fileId = c.req.param('id');

  if (!R2) {
    return c.json({ error: 'File storage not configured' }, 503);
  }

  try {
    // Get file and verify ownership
    const fileRecord = await DB.prepare(`
      SELECT file_key FROM user_files
      WHERE id = ? AND user_id = ?
    `).bind(fileId, user!.id).first() as { file_key: string } | null;

    if (!fileRecord) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Delete from R2
    await deleteFromR2(R2, fileRecord.file_key);

    // Delete from database
    await DB.prepare(`
      DELETE FROM user_files
      WHERE id = ? AND user_id = ?
    `).bind(fileId, user!.id).run();

    return c.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default files;
