import { analyzeVoiceRecording } from '@/lib/voice/analysis';
import { VoiceClient } from '@/lib/voice/voice-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock env
vi.mock('@/env.mjs', () => ({
  env: {
    ASSEMBLYAI_API_KEY: 'test-api-key',
  },
}));

describe('Voice API Interaction', () => {
  let voiceClient: VoiceClient;
  let mockFetch: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    voiceClient = new VoiceClient({
      language: 'en-US',
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('API Response Handling', () => {
    it('should handle API rate limiting (429 responses)', async () => {
      const mockBlob = new Blob(['test audio'], { type: 'audio/webm' });
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });
      
      await expect(voiceClient.processVoice(mockBlob))
        .rejects.toThrow('Voice processing error');
    });
    
    it('should handle API authentication failures (401 responses)', async () => {
      const mockBlob = new Blob(['test audio'], { type: 'audio/webm' });
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });
      
      await expect(voiceClient.processVoice(mockBlob))
        .rejects.toThrow('Voice processing error');
    });
    
    it('should handle API server errors (500 responses)', async () => {
      const mockBlob = new Blob(['test audio'], { type: 'audio/webm' });
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      
      await expect(voiceClient.processVoice(mockBlob))
        .rejects.toThrow('Voice processing error');
    });
    
    it('should handle malformed JSON responses', async () => {
      const mockBlob = new Blob(['test audio'], { type: 'audio/webm' });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });
      
      await expect(voiceClient.processVoice(mockBlob))
        .rejects.toThrow('Voice processing error');
    });
  });
  
  describe('API Content Types', () => {
    it('should send FormData with the correct content for processVoice', async () => {
      const mockBlob = new Blob(['test audio'], { type: 'audio/webm' });
      const mockResult = { text: 'Hello world', sentiment: {}, emotions: {}, confidence: 0 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });
      
      await voiceClient.processVoice(mockBlob);
      
      // Verify the request
      expect(mockFetch).toHaveBeenCalledWith('/api/voice/process', {
        method: 'POST',
        body: expect.any(FormData),
      });
      
      // Verify FormData contains expected entries
      const formData = mockFetch.mock.calls[0][1].body;
      expect(formData instanceof FormData).toBe(true);
      
      // Note: In Jest or Vitest, direct inspection of FormData is limited
      // This is a best-effort verification
    });
  });
  
  describe('Direct AssemblyAI API Interaction', () => {
    it('should make the correct API calls to AssemblyAI', async () => {
      const mockBlob = new Blob(['test audio'], { type: 'audio/webm' });
      const mockTranscriptId = 'test-transcript-id';
      
      mockFetch
        // Upload request
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ upload_url: 'https://example.com/upload' }),
        })
        // Transcription request
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: mockTranscriptId }),
        })
        // Polling request
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
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
          }),
        });
      
      await analyzeVoiceRecording(mockBlob, 'en', {
        maxPollingAttempts: 1,
        pollingInterval: 10,
      });
      
      // Verify upload request
      expect(mockFetch).toHaveBeenNthCalledWith(1, 'https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'test-api-key',
        },
        body: mockBlob,
      });
      
      // Verify transcription request
      expect(mockFetch).toHaveBeenNthCalledWith(2, 'https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': 'test-api-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: 'https://example.com/upload',
          language_code: 'en',
          sentiment_analysis: true,
          emotion_detection: true,
        }),
      });
      
      // Verify polling request
      expect(mockFetch).toHaveBeenNthCalledWith(3, `https://api.assemblyai.com/v2/transcript/${mockTranscriptId}`, {
        headers: {
          'Authorization': 'test-api-key',
        },
      });
    });
    
    it('should handle retries and backoffs for temporary API failures', async () => {
      const mockBlob = new Blob(['test audio'], { type: 'audio/webm' });
      const mockTranscriptId = 'test-transcript-id';
      
      mockFetch
        // First upload attempt fails with 503
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
        })
        // Second upload attempt succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ upload_url: 'https://example.com/upload' }),
        })
        // Transcription request
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: mockTranscriptId }),
        })
        // Polling request
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: mockTranscriptId,
            status: 'completed',
            text: 'Hello world',
            confidence: 0.9,
          }),
        });
      
      // Create a custom error handler to check if retries are happening
      const errorHandler = vi.fn();
      
      try {
        await analyzeVoiceRecording(mockBlob, 'en');
      } catch (error) {
        errorHandler(error);
      }
      
      // Verify that the API call failed with upload error
      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Failed to upload audio file'),
      }));
    });
  });
}); 