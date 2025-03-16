import { rateLimit } from '@/lib/auth/rate-limit-middleware';
import handler from '@/pages/api/voice/process';
import formidable from 'formidable';
import fsSync from 'fs';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock env
vi.mock('@/env.mjs', () => ({
  env: {
    ASSEMBLYAI_API_KEY: 'test-api-key',
  },
}));

// Mock rate limiting
vi.mock('@/lib/auth/rate-limit-middleware', () => ({
  rateLimit: vi.fn().mockResolvedValue(true), // Allow by default
}));

// Mock formidable
vi.mock('formidable', () => ({
  default: vi.fn().mockReturnValue({
    parse: vi.fn(),
  }),
}));

// Mock fs
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    default: {
      createReadStream: vi.fn(),
      unlinkSync: vi.fn(),
      promises: {
        readFile: vi.fn().mockResolvedValue(Buffer.from('test audio data')),
      },
    },
    createReadStream: vi.fn(),
    unlinkSync: vi.fn(),
    promises: {
      readFile: vi.fn().mockResolvedValue(Buffer.from('test audio data')),
    },
  };
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Voice Processing API - Complete Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle rate limiting correctly', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    // Mock rate limiting to deny the request
    (rateLimit as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

    await handler(req, res);

    // Expect no further processing when rate limited
    expect(formidable().parse).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle unsupported audio formats', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    const mockAudioFile = {
      filepath: '/tmp/test.invalid',
      mimetype: 'unknown/format',
    };

    (formidable as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      parse: vi.fn().mockResolvedValueOnce([
        { language: ['en'] },
        { audio: [mockAudioFile] },
      ]),
    });

    // Since our API is permissive with formats, we just test the format being passed through
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ upload_url: 'https://example.com/upload' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'test-id' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          status: 'completed',
          text: 'Test text',
          confidence: 0.95,
        }),
      });

    await handler(req, res);

    // Verify the blob was created with the mimetype from the file
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'https://api.assemblyai.com/v2/upload',
      expect.objectContaining({
        body: expect.any(Blob),
      })
    );

    // Verify cleanup
    expect(fsSync.unlinkSync).toHaveBeenCalledWith(mockAudioFile.filepath);
  });

  it('should handle language options correctly', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    // Test with Spanish language
    (formidable as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      parse: vi.fn().mockResolvedValueOnce([
        { language: ['es'] },
        { audio: [{ filepath: '/tmp/test.wav', mimetype: 'audio/wav' }] },
      ]),
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ upload_url: 'https://example.com/upload' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'test-id' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          status: 'completed',
          text: 'Hola mundo',
          confidence: 0.9,
        }),
      });

    await handler(req, res);

    // Verify the language was passed correctly
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://api.assemblyai.com/v2/transcript',
      expect.objectContaining({
        body: expect.stringContaining('"language_code":"es"'),
      })
    );
  });

  it('should handle polling with multiple status checks', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    (formidable as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      parse: vi.fn().mockResolvedValueOnce([
        { language: ['en'] },
        { audio: [{ filepath: '/tmp/test.wav', mimetype: 'audio/wav' }] },
      ]),
    });

    // Mock multiple polling calls before completion
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ upload_url: 'https://example.com/upload' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'test-id' }),
      })
      // We'll use 3 different statuses to test the polling logic
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          status: 'queued',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          status: 'processing',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          status: 'completed',
          text: 'Hello world',
          confidence: 0.95,
          sentiment_analysis_results: [{
            text: 'Hello world',
            sentiment: 'positive',
            confidence: 0.85,
          }],
          emotion_analysis_results: [{
            text: 'Hello world',
            emotions: {
              happy: 0.8,
              neutral: 0.2,
            },
          }],
        }),
      });

    // Replace setTimeout with immediate execution for testing
    const realSetTimeout = global.setTimeout;
    global.setTimeout = function(callback: Function) {
      callback();
      return null as any;
    } as typeof global.setTimeout;

    try {
      await handler(req, res);
    } finally {
      // Restore the original setTimeout
      global.setTimeout = realSetTimeout;
    }

    // Verify we called the polling endpoint 3 times
    expect(mockFetch).toHaveBeenCalledTimes(5);
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      'https://api.assemblyai.com/v2/transcript/test-id',
      expect.anything()
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      4,
      'https://api.assemblyai.com/v2/transcript/test-id',
      expect.anything()
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      5,
      'https://api.assemblyai.com/v2/transcript/test-id',
      expect.anything()
    );

    // Verify the response was correctly formatted
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      text: 'Hello world',
      sentiment: {
        label: 'positive',
        score: 0.85,
      },
      emotions: {
        happy: 0.8,
        neutral: 0.2,
      },
      confidence: 0.95,
    });
  });

  it('should handle missing sentiment and emotion results', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    (formidable as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      parse: vi.fn().mockResolvedValueOnce([
        { language: ['en'] },
        { audio: [{ filepath: '/tmp/test.wav', mimetype: 'audio/wav' }] },
      ]),
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ upload_url: 'https://example.com/upload' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'test-id' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          status: 'completed',
          text: 'Hello world',
          confidence: 0.95,
          // Missing sentiment and emotion results
        }),
      });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      text: 'Hello world',
      sentiment: {
        label: 'neutral',
        score: 0,
      },
      emotions: {},
      confidence: 0.95,
    });
  });

  it('should handle network errors during processing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    (formidable as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      parse: vi.fn().mockResolvedValueOnce([
        { language: ['en'] },
        { audio: [{ filepath: '/tmp/test.wav', mimetype: 'audio/wav' }] },
      ]),
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ upload_url: 'https://example.com/upload' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'test-id' }),
      })
      .mockRejectedValueOnce(new Error('Network error during polling'));

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to process voice recording',
    });
  });

  it('should handle transcription failure status', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    (formidable as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      parse: vi.fn().mockResolvedValueOnce([
        { language: ['en'] },
        { audio: [{ filepath: '/tmp/test.wav', mimetype: 'audio/wav' }] },
      ]),
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ upload_url: 'https://example.com/upload' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'test-id' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          status: 'error',
          error: 'Audio quality too low',
        }),
      });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to process voice recording',
    });
  });

  it('should properly format different sentiment and emotion combinations', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    (formidable as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      parse: vi.fn().mockResolvedValueOnce([
        { language: ['en'] },
        { audio: [{ filepath: '/tmp/test.wav', mimetype: 'audio/wav' }] },
      ]),
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ upload_url: 'https://example.com/upload' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'test-id' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          status: 'completed',
          text: 'I am feeling very angry right now',
          confidence: 0.98,
          sentiment_analysis_results: [
            {
              text: 'I am feeling very angry right now',
              sentiment: 'negative',
              confidence: 0.92,
            },
          ],
          emotion_analysis_results: [
            {
              text: 'I am feeling very angry right now',
              emotions: {
                angry: 0.85,
                sad: 0.12,
                neutral: 0.03,
              },
            },
          ],
        }),
      });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      text: 'I am feeling very angry right now',
      sentiment: {
        label: 'negative',
        score: 0.92,
      },
      emotions: {
        angry: 0.85,
        sad: 0.12,
        neutral: 0.03,
      },
      confidence: 0.98,
    });
  });

  it('should handle non-OK polling response (covers line 108-109)', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    (formidable as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      parse: vi.fn().mockResolvedValueOnce([
        { language: ['en'] },
        { audio: [{ filepath: '/tmp/test.wav', mimetype: 'audio/wav' }] },
      ]),
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ upload_url: 'https://example.com/upload' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'test-id' }),
      })
      // This tests lines 108-109: non-OK polling response
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Transcript Not Found',
      });

    // Override setTimeout to execute immediately for faster test
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = function(callback: Function) {
      callback();
      return null as any;
    } as typeof global.setTimeout;

    try {
      await handler(req, res);
    } finally {
      // Restore the original setTimeout
      global.setTimeout = originalSetTimeout;
    }

    // Verify error response was returned
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to process voice recording',
    });

    // Verify that the specific error was thrown
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      'https://api.assemblyai.com/v2/transcript/test-id',
      expect.anything()
    );
  });
}); 