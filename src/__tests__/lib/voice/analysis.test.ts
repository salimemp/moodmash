import { analyzeVoiceRecording } from '@/lib/voice/analysis';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the environment variables
vi.mock('@/env.mjs', () => ({
  env: {
    ASSEMBLYAI_API_KEY: 'mock-api-key',
  },
}));

describe('Voice Analysis Module', () => {
  // Create a mock blob for testing
  const createMockBlob = () => {
    return new Blob(['mock audio data'], { type: 'audio/wav' });
  };

  // Mock global fetch
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock setTimeout to avoid waiting in tests
    vi.spyOn(global, 'setTimeout').mockImplementation((fn) => {
      fn();
      return 0 as any;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should upload audio and return analysis results', async () => {
    // Mock the API responses
    mockFetch
      // First call - upload
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ upload_url: 'https://example.com/upload/123' }),
      } as Response)
      // Second call - transcription request
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'transcript-123' }),
      } as Response)
      // Third call - polling for results
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'transcript-123',
          status: 'completed',
          text: 'This is a test transcription',
          confidence: 0.95,
          sentiment_analysis_results: [
            {
              text: 'This is a test transcription',
              sentiment: 'positive',
              confidence: 0.87,
            },
          ],
          emotion_analysis_results: [
            {
              text: 'This is a test transcription',
              emotions: {
                happy: 0.8,
                sad: 0.1,
                neutral: 0.1,
              },
            },
          ],
        }),
      } as Response);

    const result = await analyzeVoiceRecording(createMockBlob(), 'en');

    // Verify the result structure
    expect(result).toEqual({
      text: 'This is a test transcription',
      sentiment: {
        label: 'positive',
        score: 0.87,
      },
      emotions: {
        happy: 0.8,
        sad: 0.1,
        neutral: 0.1,
      },
      confidence: 0.95,
    });

    // Verify API calls
    expect(mockFetch).toHaveBeenCalledTimes(3);
    
    // Verify upload request
    expect(mockFetch.mock.calls[0][0]).toBe('https://api.assemblyai.com/v2/upload');
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('mock-api-key');
    
    // Verify transcription request
    expect(mockFetch.mock.calls[1][0]).toBe('https://api.assemblyai.com/v2/transcript');
    expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe('mock-api-key');
    expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toEqual({
      audio_url: 'https://example.com/upload/123',
      language_code: 'en',
      sentiment_analysis: true,
      emotion_detection: true,
    });
    
    // Verify polling request
    expect(mockFetch.mock.calls[2][0]).toBe('https://api.assemblyai.com/v2/transcript/transcript-123');
    expect(mockFetch.mock.calls[2][1].headers.Authorization).toBe('mock-api-key');
  });

  it('should handle upload failures', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    } as Response);

    await expect(analyzeVoiceRecording(createMockBlob(), 'en')).rejects.toThrow('Failed to upload audio file');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle transcription request failures', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ upload_url: 'https://example.com/upload/123' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

    await expect(analyzeVoiceRecording(createMockBlob(), 'en')).rejects.toThrow('Failed to start transcription');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should handle polling failures', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ upload_url: 'https://example.com/upload/123' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'transcript-123' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

    await expect(analyzeVoiceRecording(createMockBlob(), 'en')).rejects.toThrow('Failed to get transcription status');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should handle transcription errors from the API', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ upload_url: 'https://example.com/upload/123' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'transcript-123' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'transcript-123',
          status: 'error',
          error: 'Audio file could not be processed',
        }),
      } as Response);

    await expect(analyzeVoiceRecording(createMockBlob(), 'en')).rejects.toThrow('Audio file could not be processed');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should handle unknown errors from the API', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ upload_url: 'https://example.com/upload/123' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'transcript-123' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'transcript-123',
          status: 'error',
        }),
      } as Response);

    await expect(analyzeVoiceRecording(createMockBlob(), 'en')).rejects.toThrow('Unknown error occurred');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should handle transcription timeouts', async () => {
    // Mock the API responses for a timeout scenario
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ upload_url: 'https://example.com/upload/123' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'transcript-123' }),
      } as Response);

    // Create responses for polling that always return "processing"
    for (let i = 0; i < 5; i++) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'transcript-123',
          status: 'processing',
        }),
      } as Response);
    }

    // Use a very small number of max polling attempts for the test
    await expect(
      analyzeVoiceRecording(createMockBlob(), 'en', { 
        maxPollingAttempts: 5,
        pollingInterval: 0  // No delay for tests
      })
    ).rejects.toThrow('Transcription timed out');
    
    // Initial call + transcription call + 5 polling calls
    expect(mockFetch).toHaveBeenCalledTimes(7);
  });

  it('should handle partial results gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ upload_url: 'https://example.com/upload/123' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'transcript-123' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'transcript-123',
          status: 'completed',
          text: 'This is a test transcription',
          // Missing confidence, sentiment, and emotions
        }),
      } as Response);

    const result = await analyzeVoiceRecording(createMockBlob(), 'en');

    // Verify the result has default values for missing fields
    expect(result).toEqual({
      text: 'This is a test transcription',
      sentiment: {
        label: 'neutral',
        score: 0,
      },
      emotions: {},
      confidence: 0,
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should use custom polling options', async () => {
    // Mock setTimeout to verify polling interval
    let timeoutDuration = 0;
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ upload_url: 'https://example.com/upload/123' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'transcript-123' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'transcript-123',
          status: 'processing',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'transcript-123',
          status: 'completed',
          text: 'This is a test transcription',
          confidence: 0.9,
        }),
      } as Response);

    // Reset the mock implementation to capture the timeout duration
    vi.spyOn(global, 'setTimeout').mockImplementation((fn: Function, ms?: number) => {
      if (ms) timeoutDuration = ms;
      fn();
      return 0 as any;
    });

    await analyzeVoiceRecording(createMockBlob(), 'en', {
      pollingInterval: 5000,  // 5 seconds
      maxPollingAttempts: 10,
    });

    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(timeoutDuration).toBe(5000);
  });

  it('should support different language codes', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ upload_url: 'https://example.com/upload/123' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'transcript-123' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'transcript-123',
          status: 'completed',
          text: 'Esto es una prueba',
          confidence: 0.9,
        }),
      } as Response);

    await analyzeVoiceRecording(createMockBlob(), 'es');

    // Verify that the language code was passed correctly
    expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toEqual({
      audio_url: 'https://example.com/upload/123',
      language_code: 'es',
      sentiment_analysis: true,
      emotion_detection: true,
    });
  });
}); 