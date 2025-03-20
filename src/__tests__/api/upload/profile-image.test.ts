import * as rateLimit from '@/lib/auth/rate-limit';
import * as authUtils from '@/lib/auth/utils';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { Readable } from 'stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Create parse mock first
const parseMock = vi.fn();

// Mock uuid module - match the import in the implementation: import { v4 as uuidv4 } from 'uuid'
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('mock-uuid')
}));

// Mock formidable module - this needs to be done with vi.mock
vi.mock('formidable', () => {
  return {
    default: function() {
      return {
        parse: parseMock
      };
    }
  };
});

// Import the API handler after mocking formidable
import handler from '@/pages/api/upload/profile-image';

// Define mock file type to match formidable's File type
interface MockFile {
  originalFilename: string | null;
  filepath: string;
  size: number;
  mimetype: string;
  [key: string]: any;
}

// Helper to create mock request and response
function createMocks(method = 'POST') {
  // Create request stream for formidable
  const stream = new Readable();
  stream.push('mock file content');
  stream.push(null);
  
  const req = {
    method,
    headers: {},
    socket: {
      destroy: vi.fn(),
    },
    // Properties used by formidable
    pipe: vi.fn().mockReturnValue(stream),
    unpipe: vi.fn(),
    on: vi.fn(),
  } as unknown as NextApiRequest;
  
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn(),
  } as unknown as NextApiResponse;
  
  return { req, res };
}

describe('Profile Image Upload API', () => {
  // Setup spies for all dependencies
  let existsSyncSpy: any;
  let mkdirSyncSpy: any;
  let copyFileSyncSpy: any;
  let unlinkSyncSpy: any;
  let extnameSpy: any;
  let getSessionSpy: any;
  let rateLimitSpy: any;
  
  beforeEach(() => {
    // Clear all previous mocks
    vi.resetAllMocks();
    
    // Setup spies on various modules
    existsSyncSpy = vi.spyOn(fs, 'existsSync').mockImplementation((filepath) => {
      return !String(filepath).includes('uploads');
    });
    
    mkdirSyncSpy = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
    copyFileSyncSpy = vi.spyOn(fs, 'copyFileSync').mockImplementation(() => undefined);
    unlinkSyncSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
    
    // We still use join in the implementation, but we don't need to assert on it in tests
    vi.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));
    extnameSpy = vi.spyOn(path, 'extname').mockImplementation((filename) => {
      const parts = String(filename).split('.');
      return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
    });
    
    getSessionSpy = vi.spyOn(authUtils, 'getSessionFromReq').mockImplementation((_req) => {
      // Default to null, tests will override this via createMocks
      return Promise.resolve(null);
    });
    
    rateLimitSpy = vi.spyOn(rateLimit, 'rateLimit').mockResolvedValue(true);
    
    // Default mock for form parsing
    parseMock.mockImplementation((_req: any, callback: any) => {
      const mockFile: MockFile = {
        originalFilename: 'test.jpg',
        filepath: 'tmp/test.jpg',
        size: 1024,
        mimetype: 'image/jpeg',
      };
      callback(null, {}, { file: mockFile });
    });
    
    // Set the environment variable for the URL
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_APP_URL;
  });
  
  it('should return 405 for non-POST requests', async () => {
    const mocks = createMocks('GET');
    
    await handler(mocks.req, mocks.res);
    
    expect(mocks.res.status).toHaveBeenCalledWith(405);
    expect(mocks.res.json).toHaveBeenCalledWith({ message: 'Method not allowed' });
  });
  
  it('should return 401 for unauthenticated requests', async () => {
    const mocks = createMocks('POST');
    getSessionSpy.mockResolvedValue(null);
    
    await handler(mocks.req, mocks.res);
    
    expect(mocks.res.status).toHaveBeenCalledWith(401);
    expect(mocks.res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });
  
  it('should create uploads directory if it does not exist', async () => {
    const mocks = createMocks('POST');
    getSessionSpy.mockResolvedValue({ user: { id: 'user-123' } });
    
    await handler(mocks.req, mocks.res);
    
    expect(mkdirSyncSpy).toHaveBeenCalled();
  });
  
  it('should return 400 if no file is uploaded', async () => {
    const mocks = createMocks('POST');
    getSessionSpy.mockResolvedValue({ user: { id: 'user-123' } });
    
    // Mock form parse to return no files
    parseMock.mockImplementation((_req: any, callback: any) => {
      callback(null, {}, {});
    });
    
    await handler(mocks.req, mocks.res);
    
    expect(mocks.res.status).toHaveBeenCalledWith(400);
    expect(mocks.res.json).toHaveBeenCalledWith({ message: 'No file uploaded' });
  });
  
  it('should handle multiple files in the field', async () => {
    const mocks = createMocks('POST');
    getSessionSpy.mockResolvedValue({ user: { id: 'user-123' } });
    
    // Mock form parse to return array of files
    parseMock.mockImplementation((_req: any, callback: any) => {
      const mockFiles: MockFile[] = [
        {
          originalFilename: 'test1.jpg',
          filepath: 'tmp/test1.jpg',
          size: 1024,
          mimetype: 'image/jpeg',
        }
      ];
      callback(null, {}, { file: mockFiles });
    });
    
    await handler(mocks.req, mocks.res);
    
    expect(copyFileSyncSpy).toHaveBeenCalled();
    expect(unlinkSyncSpy).toHaveBeenCalled();
    expect(mocks.res.status).toHaveBeenCalledWith(200);
  });
  
  it('should handle form parsing errors', async () => {
    const mocks = createMocks('POST');
    getSessionSpy.mockResolvedValue({ user: { id: 'user-123' } });
    
    // Mock form parse to throw an error
    parseMock.mockImplementation((_req: any, callback: any) => {
      callback(new Error('Form parsing error'), {}, {});
    });
    
    await handler(mocks.req, mocks.res);
    
    expect(mocks.res.status).toHaveBeenCalledWith(500);
    expect(mocks.res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
  
  it('should handle file system errors', async () => {
    const mocks = createMocks('POST');
    getSessionSpy.mockResolvedValue({ user: { id: 'user-123' } });
    
    // Mock copyFileSync to throw error
    copyFileSyncSpy.mockImplementation(() => {
      throw new Error('File system error');
    });
    
    await handler(mocks.req, mocks.res);
    
    expect(mocks.res.status).toHaveBeenCalledWith(500);
    expect(mocks.res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
  
  it('should skip file operations if the uploaded file does not exist', async () => {
    const mocks = createMocks('POST');
    getSessionSpy.mockResolvedValue({ user: { id: 'user-123' } });
    
    // Mock existsSync to return false for the uploaded file
    existsSyncSpy.mockImplementation(() => false);
    
    await handler(mocks.req, mocks.res);
    
    expect(copyFileSyncSpy).not.toHaveBeenCalled();
    expect(unlinkSyncSpy).not.toHaveBeenCalled();
    expect(mocks.res.status).toHaveBeenCalledWith(200);
  });
  
  it('should use default filename if originalFilename is not provided', async () => {
    const mocks = createMocks('POST');
    getSessionSpy.mockResolvedValue({ user: { id: 'user-123' } });
    
    // Mock form parse to return file without originalFilename
    parseMock.mockImplementation((_req: any, callback: any) => {
      const mockFile: MockFile = {
        originalFilename: null,
        filepath: 'tmp/unknown.file',
        size: 1024,
        mimetype: 'application/octet-stream',
      };
      callback(null, {}, { file: mockFile });
    });
    
    await handler(mocks.req, mocks.res);
    
    expect(mocks.res.status).toHaveBeenCalledWith(200);
    // Should use default filename 'image.jpg'
    expect(extnameSpy).toHaveBeenCalledWith('image.jpg');
  });
  
  it('should successfully upload a file and return the URL', async () => {
    const mocks = createMocks('POST');
    getSessionSpy.mockResolvedValue({ user: { id: 'user-123' } });
    
    await handler(mocks.req, mocks.res);
    
    expect(copyFileSyncSpy).toHaveBeenCalled();
    expect(unlinkSyncSpy).toHaveBeenCalled();
    expect(mocks.res.status).toHaveBeenCalledWith(200);
    expect(mocks.res.json).toHaveBeenCalledWith({
      message: 'File uploaded successfully',
      url: 'http://localhost:3000/uploads/undefined.jpg',
    });
  });
  
  it('should block requests that exceed rate limit', async () => {
    const mocks = createMocks('POST');
    
    // Mock rate limit to fail
    rateLimitSpy.mockResolvedValue(false);
    
    await handler(mocks.req, mocks.res);
    
    // When rate limit fails, the function returns early
    // so we just expect rate limit to have been called
    expect(rateLimitSpy).toHaveBeenCalledWith(mocks.req, mocks.res, 'general');
    // The handler should not proceed to call getSessionFromReq if rate limiting fails
    expect(getSessionSpy).not.toHaveBeenCalled();
  });
  
  it('should use default URL when NEXT_PUBLIC_APP_URL is not set', async () => {
    const mocks = createMocks('POST');
    getSessionSpy.mockResolvedValue({ user: { id: 'user-123' } });
    
    // Ensure the environment variable is not set
    delete process.env.NEXT_PUBLIC_APP_URL;
    
    await handler(mocks.req, mocks.res);
    
    expect(copyFileSyncSpy).toHaveBeenCalled();
    expect(unlinkSyncSpy).toHaveBeenCalled();
    expect(mocks.res.status).toHaveBeenCalledWith(200);
    expect(mocks.res.json).toHaveBeenCalledWith({
      message: 'File uploaded successfully',
      url: 'http://localhost:3000/uploads/undefined.jpg',
    });
  });
}); 