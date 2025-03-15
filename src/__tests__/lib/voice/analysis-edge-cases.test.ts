import { analyzeVoiceRecording } from '@/lib/voice/analysis';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock env
vi.mock('@/env.mjs', () => ({
  env: {
    ASSEMBLYAI_API_KEY: 'test-api-key',
  },
}));

describe('Voice Analysis Edge Cases', () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should properly handle transcription timeout', async () => {
    const mockAudioBlob = new Blob(['test audio'], { type: 'audio/webm' });

    // Setup successful upload and transcription start
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ upload_url: 'https://example.com/upload' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'test-transcript-id' }),
      });

    // Make polling responses always return "processing" to trigger the timeout
    for (let i = 0; i < 31; i++) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'test-transcript-id',
            status: 'processing',
          }),
      });
    }

    // Override setTimeout to execute immediately for faster test
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = vi.fn(callback => {
      callback();
      return undefined;
    }) as unknown as typeof global.setTimeout;

    try {
      // Use very small maxPollingAttempts to trigger timeout quickly
      await analyzeVoiceRecording(mockAudioBlob, 'en', {
        maxPollingAttempts: 3,
        pollingInterval: 0,
      });

      // If we reach here, the test should fail
      expect(true).toBe(false);
    } catch (error: unknown) {
      // Verify we got the expected timeout error
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toBe('Transcription timed out');
      }
    } finally {
      // Restore the original setTimeout
      global.setTimeout = originalSetTimeout;
    }

    // Verify we made the expected number of fetch calls
    // 1 for upload + 1 for transcription start + 3 polling attempts
    expect(mockFetch).toHaveBeenCalledTimes(5);
  });
});
