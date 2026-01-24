/**
 * R2 Storage Service
 * 
 * Provides file upload, download, and management operations for Cloudflare R2 storage.
 * 
 * Use cases:
 * - ASSETS bucket: Static assets, meditation audio, yoga videos
 * - USER_UPLOADS bucket: User profile pictures, voice recordings
 * - BACKUPS bucket: Database backups, export files
 */

import type { R2Bucket, R2Object, R2ObjectBody, R2Objects, R2ListOptions } from '@cloudflare/workers-types';

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

export interface UploadResult {
  key: string;
  size: number;
  etag: string;
  url: string;
}

export class R2Service {
  constructor(
    private bucket: R2Bucket,
    private bucketName: string,
    private publicUrl?: string
  ) {}

  /**
   * Upload a file to R2
   */
  async uploadFile(
    key: string,
    data: ReadableStream | ArrayBuffer | Blob | string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const httpMetadata: R2HTTPMetadata = {};
    
    if (options.contentType) {
      httpMetadata.contentType = options.contentType;
    }
    if (options.cacheControl) {
      httpMetadata.cacheControl = options.cacheControl;
    }

    const object = await this.bucket.put(key, data, {
      httpMetadata,
      customMetadata: options.metadata,
    });

    return {
      key: object.key,
      size: object.size,
      etag: object.etag,
      url: this.getPublicUrl(key),
    };
  }

  /**
   * Upload a user file with automatic key generation
   */
  async uploadUserFile(
    userId: string,
    file: Blob | ArrayBuffer,
    fileType: 'profile' | 'voice' | 'export',
    filename: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const timestamp = Date.now();
    const extension = filename.split('.').pop() || '';
    const key = `users/${userId}/${fileType}/${timestamp}.${extension}`;
    
    return this.uploadFile(key, file, options);
  }

  /**
   * Get a file from R2
   */
  async getFile(key: string): Promise<R2ObjectBody | null> {
    return await this.bucket.get(key);
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    const head = await this.bucket.head(key);
    return head !== null;
  }

  /**
   * Get file metadata without downloading content
   */
  async getFileMetadata(key: string): Promise<R2Object | null> {
    return await this.bucket.head(key);
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(keys: string[]): Promise<void> {
    await this.bucket.delete(keys);
  }

  /**
   * List files in R2 bucket
   */
  async listFiles(options?: R2ListOptions): Promise<R2Objects> {
    return await this.bucket.list(options);
  }

  /**
   * List files for a specific user
   */
  async listUserFiles(
    userId: string,
    fileType?: 'profile' | 'voice' | 'export'
  ): Promise<R2Objects> {
    const prefix = fileType 
      ? `users/${userId}/${fileType}/`
      : `users/${userId}/`;
    
    return await this.bucket.list({ prefix });
  }

  /**
   * Generate a public URL for a file
   */
  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    // Default to Cloudflare R2 public bucket URL pattern
    return `https://${this.bucketName}.r2.cloudflarestorage.com/${key}`;
  }

  /**
   * Generate a signed URL for temporary access (requires additional setup)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // Note: Signed URLs require additional configuration in Cloudflare
    // This is a placeholder for future implementation
    // For now, use public URLs or serve files through the worker
    return this.getPublicUrl(key);
  }

  /**
   * Copy a file within the bucket
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<UploadResult> {
    const sourceObject = await this.getFile(sourceKey);
    if (!sourceObject) {
      throw new Error(`Source file not found: ${sourceKey}`);
    }

    const result = await this.uploadFile(destinationKey, sourceObject.body, {
      contentType: sourceObject.httpMetadata?.contentType,
      metadata: sourceObject.customMetadata as Record<string, string>,
    });

    return result;
  }

  /**
   * Get total storage usage for a user
   */
  async getUserStorageUsage(userId: string): Promise<number> {
    let totalSize = 0;
    let cursor: string | undefined;

    do {
      const result = await this.bucket.list({
        prefix: `users/${userId}/`,
        cursor,
      });

      for (const object of result.objects) {
        totalSize += object.size;
      }

      cursor = result.truncated ? result.cursor : undefined;
    } while (cursor);

    return totalSize;
  }
}

/**
 * HTTP metadata interface for R2 uploads
 */
interface R2HTTPMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  cacheExpiry?: Date;
}

/**
 * Factory functions for creating R2 services
 */
export function createAssetsService(bucket: R2Bucket): R2Service {
  return new R2Service(bucket, 'moodmash-assets', 'https://assets.moodmash.win');
}

export function createUserUploadsService(bucket: R2Bucket): R2Service {
  return new R2Service(bucket, 'moodmash-user-uploads');
}

export function createBackupsService(bucket: R2Bucket): R2Service {
  return new R2Service(bucket, 'moodmash-backups');
}
