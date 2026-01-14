/**
 * Media Processing Utilities for MoodMash
 * Image optimization, video transcoding, thumbnail generation
 */

import { Context } from 'hono';
import type { R2Bucket, R2ObjectBody } from '@cloudflare/workers-types';


/** Database row type for media files */
interface MediaRow {
  id: string;
  user_id: number;
  file_key: string;
  original_filename: string;
  file_type: 'image' | 'video' | 'audio' | 'document';
  mime_type: string;
  file_size_bytes: number;
  duration_seconds?: number | null;
  width?: number | null;
  height?: number | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  variants?: string | null;
  metadata?: string | null;
  visibility: 'private' | 'public' | 'friends';
  created_at: string;
}

export interface MediaFile {
  id?: number | string;
  userId: number;
  fileKey: string;
  originalFilename: string;
  fileType: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  fileSizeBytes: number;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  variants?: Record<string, string>;
  metadata?: Record<string, unknown>;
  visibility: 'private' | 'public' | 'friends';
}

/**
 * Upload file to R2 Storage
 */
export async function uploadToR2(
  r2: R2Bucket,
  key: string,
  file: ArrayBuffer,
  metadata?: Record<string, string>
): Promise<void> {
  await r2.put(key, file, {
    httpMetadata: metadata,
  });
}

/**
 * Download file from R2 Storage
 */
export async function downloadFromR2(
  r2: R2Bucket,
  key: string
): Promise<R2ObjectBody | null> {
  return await r2.get(key);
}

/**
 * Delete file from R2 Storage
 */
export async function deleteFromR2(
  r2: R2Bucket,
  key: string
): Promise<void> {
  await r2.delete(key);
}

/**
 * Generate unique file key
 */
export function generateFileKey(userId: number, filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const extension = filename.split('.').pop();
  return `users/${userId}/${timestamp}-${random}.${extension}`;
}

/**
 * Detect file type from MIME type
 */
export function detectFileType(mimeType: string): MediaFile['fileType'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  maxSizeMB: number = 50
): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'application/pdf'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed'
    };
  }

  return { valid: true };
}

/**
 * Save media file metadata to database
 */
export async function saveMediaFile(
  db: D1Database,
  mediaFile: MediaFile
): Promise<number> {
  const result = await db.prepare(`
    INSERT INTO media_files (
      user_id, file_key, original_filename, file_type, mime_type,
      file_size_bytes, duration_seconds, width, height,
      processing_status, variants, metadata, visibility, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    mediaFile.userId,
    mediaFile.fileKey,
    mediaFile.originalFilename,
    mediaFile.fileType,
    mediaFile.mimeType,
    mediaFile.fileSizeBytes,
    mediaFile.duration || null,
    mediaFile.width || null,
    mediaFile.height || null,
    mediaFile.processingStatus,
    JSON.stringify(mediaFile.variants || {}),
    JSON.stringify(mediaFile.metadata || {}),
    mediaFile.visibility
  ).run();

  return result.meta.last_row_id as number;
}

/**
 * Get media file by ID
 */
export async function getMediaFile(
  db: D1Database,
  fileId: number,
  userId?: number
): Promise<MediaFile | null> {
  let query = `
    SELECT * FROM media_files WHERE id = ?
  `;
  const bindings: (string | number | null)[] = [fileId];

  // If userId provided, check ownership or public visibility
  if (userId) {
    query += ` AND (user_id = ? OR visibility = 'public')`;
    bindings.push(userId);
  } else {
    query += ` AND visibility = 'public'`;
  }

  const result = await db.prepare(query).bind(...bindings).first();
  
  if (!result) return null;

  return {
    id: result.id as number,
    userId: result.user_id as number,
    fileKey: result.file_key as string,
    originalFilename: result.original_filename as string,
    fileType: result.file_type as MediaFile['fileType'],
    mimeType: result.mime_type as string,
    fileSizeBytes: result.file_size_bytes as number,
    duration: result.duration_seconds as number | undefined,
    width: result.width as number | undefined,
    height: result.height as number | undefined,
    processingStatus: result.processing_status as MediaFile['processingStatus'],
    variants: JSON.parse(result.variants as string || '{}'),
    metadata: JSON.parse(result.metadata as string || '{}'),
    visibility: result.visibility as MediaFile['visibility']
  };
}

/**
 * List user media files
 */
export async function listUserMediaFiles(
  db: D1Database,
  userId: number,
  fileType?: string,
  limit: number = 50
): Promise<MediaFile[]> {
  let query = `
    SELECT * FROM media_files
    WHERE user_id = ?
  `;
  const bindings: (string | number | null)[] = [userId];

  if (fileType) {
    query += ` AND file_type = ?`;
    bindings.push(fileType);
  }

  query += ` ORDER BY created_at DESC LIMIT ?`;
  bindings.push(limit);

  const results = await db.prepare(query).bind(...bindings).all<MediaRow>();
  
  return (results.results || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    fileKey: row.file_key,
    originalFilename: row.original_filename,
    fileType: row.file_type,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    duration: row.duration_seconds,
    width: row.width,
    height: row.height,
    processingStatus: row.processing_status,
    variants: JSON.parse(row.variants || '{}') as Record<string, string>,
    metadata: JSON.parse(row.metadata || '{}') as Record<string, unknown>,
    visibility: row.visibility
  }));
}

/**
 * Delete media file
 */
export async function deleteMediaFile(
  db: D1Database,
  r2: R2Bucket,
  fileId: number,
  userId: number
): Promise<boolean> {
  // Get file details
  const file = await db.prepare(`
    SELECT file_key, variants FROM media_files
    WHERE id = ? AND user_id = ?
  `).bind(fileId, userId).first();

  if (!file) return false;

  // Delete from R2
  await deleteFromR2(r2, file.file_key as string);
  
  // Delete variants if any
  const variants = JSON.parse(file.variants as string || '{}');
  for (const key of Object.values(variants)) {
    if (typeof key === 'string') {
      await deleteFromR2(r2, key);
    }
  }

  // Delete from database
  await db.prepare(`
    DELETE FROM media_files WHERE id = ?
  `).bind(fileId).run();

  return true;
}

/**
 * Queue image processing task
 */
export async function queueImageProcessing(
  db: D1Database,
  mediaFileId: number,
  taskType: 'thumbnail' | 'resize' | 'compress' | 'watermark',
  params?: Record<string, any>,
  priority: number = 5
): Promise<number> {
  const result = await db.prepare(`
    INSERT INTO image_processing_queue (
      media_file_id, task_type, task_params, priority, status, created_at
    ) VALUES (?, ?, ?, ?, 'pending', datetime('now'))
  `).bind(
    mediaFileId,
    taskType,
    JSON.stringify(params || {}),
    priority
  ).run();

  return result.meta.last_row_id as number;
}

/**
 * Queue video processing task
 */
export async function queueVideoProcessing(
  db: D1Database,
  mediaFileId: number,
  taskType: 'transcode' | 'thumbnail' | 'compress' | 'trim',
  outputFormat: string = 'mp4',
  params?: Record<string, any>
): Promise<number> {
  const result = await db.prepare(`
    INSERT INTO video_processing_queue (
      media_file_id, task_type, output_format, task_params, status, created_at
    ) VALUES (?, ?, ?, ?, 'pending', datetime('now'))
  `).bind(
    mediaFileId,
    taskType,
    outputFormat,
    JSON.stringify(params || {})
  ).run();

  return result.meta.last_row_id as number;
}

/**
 * Update processing status
 */
export async function updateProcessingStatus(
  db: D1Database,
  mediaFileId: number,
  status: MediaFile['processingStatus'],
  error?: string
): Promise<void> {
  await db.prepare(`
    UPDATE media_files
    SET processing_status = ?,
        processing_error = ?,
        processed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE processed_at END,
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(status, error || null, status, mediaFileId).run();
}

/**
 * Generate public URL for media file
 */
export function generatePublicUrl(
  fileKey: string,
  bucketUrl: string = 'https://moodmash-storage.r2.cloudflarestorage.com'
): string {
  return `${bucketUrl}/${fileKey}`;
}

/**
 * Extract image dimensions (basic validation)
 */
export async function extractImageDimensions(
  arrayBuffer: ArrayBuffer
): Promise<{ width?: number; height?: number }> {
  // This is a placeholder - in production, you'd use a proper image parsing library
  // For Cloudflare Workers, you might use external APIs or Workers AI
  return { width: undefined, height: undefined };
}

/**
 * Generate thumbnail URL
 */
export function getThumbnailUrl(mediaFile: MediaFile): string | null {
  if (mediaFile.variants && mediaFile.variants.thumbnail) {
    return generatePublicUrl(mediaFile.variants.thumbnail);
  }
  return null;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Generate safe filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}
