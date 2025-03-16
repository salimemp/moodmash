import { env } from '@/env.mjs';
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

// Mock rate limit storage
vi.mock('@/lib/auth/rate-limit-storage', () => ({
  rateLimitStorage: {
    get: vi.fn().mockResolvedValue(null),
    increment: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(true),
  },
}));

describe('Voice Processing API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed',
    });
  });

  it('should return 400 if no audio file is provided', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    (formidable as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      parse: vi.fn().mockResolvedValueOnce([{}, {}]),
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'No audio file provided',
    });
  });

  it('should process audio file and return analysis results', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    const mockAudioFile = {
      filepath: '/tmp/test.webm',
      mimetype: 'audio/webm',
    };

    (formidable as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      parse: vi.fn().mockResolvedValueOnce([
        { language: ['en'] },
        { audio: [mockAudioFile] },
      ]),
    });

    const mockUploadResponse = {
      upload_url: 'https://example.com/upload',
    };

    const mockTranscriptId = 'test-transcript-id';

    const mockAnalysisResult = {
      id: mockTranscriptId,
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
    };

    mockFetch
      // Upload request
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUploadResponse),
      })
      // Transcription request
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: mockTranscriptId }),
      })
      // Polling request
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalysisResult),
      });

    await handler(req, res);

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

    // Verify API calls
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenNthCalledWith(1, 'https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': env.ASSEMBLYAI_API_KEY,
      },
      body: expect.any(Blob),
    });

    expect(mockFetch).toHaveBeenNthCalledWith(2, 'https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': env.ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: mockUploadResponse.upload_url,
        language_code: 'en',
        sentiment_analysis: true,
        emotion_detection: true,
      }),
    });

    expect(mockFetch).toHaveBeenNthCalledWith(3, `https://api.assemblyai.com/v2/transcript/${mockTranscriptId}`, {
      headers: {
        'Authorization': env.ASSEMBLYAI_API_KEY,
      },
    });

    // Verify cleanup
    expect(fsSync.unlinkSync).toHaveBeenCalledWith(mockAudioFile.filepath);
  });

  it('should handle upload errors', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    const mockAudioFile = {
      filepath: '/tmp/test.webm',
      mimetype: 'audio/webm',
    };

    (formidable as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      parse: vi.fn().mockResolvedValueOnce([
        { language: ['en'] },
        { audio: [mockAudioFile] },
      ]),
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to process voice recording',
    });
  });

  it('should handle transcription errors', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    const mockAudioFile = {
      filepath: '/tmp/test.webm',
      mimetype: 'audio/webm',
    };

    (formidable as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      parse: vi.fn().mockResolvedValueOnce([
        { language: ['en'] },
        { audio: [mockAudioFile] },
      ]),
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ upload_url: 'https://example.com/upload' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to process voice recording',
    });
  });
}); 