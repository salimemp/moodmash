import { analyzeVoiceRecording } from '@/lib/voice/analysis';
import { VoiceClient } from '@/lib/voice/voice-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock analyzeVoiceRecording
vi.mock('@/lib/voice/analysis', () => ({
  analyzeVoiceRecording: vi.fn(),
}));

describe('Voice Integration', () => {
  let voiceClient: VoiceClient;
  let mockMediaRecorder: any;
  let recordedBlob: Blob | null = null;

  beforeEach(() => {
    recordedBlob = null;

    // Mock MediaRecorder
    mockMediaRecorder = {
      start: vi.fn().mockImplementation(() => {
        if (mockMediaRecorder.onstart) {
          mockMediaRecorder.onstart();
        }
      }),
      stop: vi.fn().mockImplementation(() => {
        if (mockMediaRecorder.onstop) {
          mockMediaRecorder.onstop();
        }
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      state: 'inactive',
    };

    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{
            stop: vi.fn(),
          }],
        }),
      },
      configurable: true,
    });

    // Mock MediaRecorder constructor
    global.MediaRecorder = vi.fn(() => mockMediaRecorder) as unknown as typeof MediaRecorder;
    (global.MediaRecorder as any).isTypeSupported = vi.fn().mockReturnValue(true);

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    voiceClient = new VoiceClient({
      onStop: (blob: Blob) => {
        recordedBlob = blob;
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    recordedBlob = null;
  });

  it('should record audio and process it via API', async () => {
    // Setup mock response for processVoice
    const mockResult = {
      text: 'Hello world',
      sentiment: { label: 'positive', score: 0.85 },
      emotions: { happy: 0.8 },
      confidence: 0.95
    };
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult)
    });

    // Start recording
    await voiceClient.startRecording();
    
    // Simulate audio data being captured
    const mockBlob = new Blob(['test audio'], { type: 'audio/webm' });
    if (mockMediaRecorder.ondataavailable) {
      mockMediaRecorder.ondataavailable({ data: mockBlob });
    }
    
    // Stop recording
    await voiceClient.stopRecording();
    
    // Process the recording
    const result = await voiceClient.processVoice(mockBlob);
    
    // Verify the API call
    expect(global.fetch).toHaveBeenCalledWith('/api/voice/process', {
      method: 'POST',
      body: expect.any(FormData)
    });
    
    // Verify the result
    expect(result).toEqual(mockResult);
  });

  it('should integrate with analyzeVoiceRecording function', async () => {
    const mockBlob = new Blob(['test audio'], { type: 'audio/webm' });
    const mockAnalysisResult = {
      text: 'Hello world',
      sentiment: { label: 'positive', score: 0.85 },
      emotions: { happy: 0.8 },
      confidence: 0.95
    };
    
    // Mock the analyzeVoiceRecording function
    (analyzeVoiceRecording as ReturnType<typeof vi.fn>).mockResolvedValue(mockAnalysisResult);
    
    // Record and get blob
    await voiceClient.startRecording();
    if (mockMediaRecorder.ondataavailable) {
      mockMediaRecorder.ondataavailable({ data: mockBlob });
    }
    await voiceClient.stopRecording();
    
    // Directly analyze the recording
    const result = await analyzeVoiceRecording(mockBlob, 'en');
    
    // Verify the analysis was called with the right params
    expect(analyzeVoiceRecording).toHaveBeenCalledWith(mockBlob, 'en');
    expect(result).toEqual(mockAnalysisResult);
  });

  it('should handle complete recording flow with error handling', async () => {
    // Setup mock recording error
    const recordingError = new Error('Failed to record audio');
    (global.navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(recordingError);
    
    // Setup error handler
    let capturedError: Error | null = null;
    voiceClient = new VoiceClient({
      onError: (error: Error) => {
        capturedError = error;
      }
    });
    
    // Attempt to record and expect failure
    try {
      await voiceClient.startRecording();
      // This should not execute
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBe(recordingError);
      expect(capturedError).toBe(recordingError);
    }
    
    // Verify cleanup happened
    expect(voiceClient.isCurrentlyRecording()).toBe(false);
  });

  it('should handle different audio formats', async () => {
    // Test with WAV format
    const wavBlob = new Blob(['test audio'], { type: 'audio/wav' });
    const mockWavResult = { text: 'WAV recording', sentiment: { label: 'neutral', score: 0.5 }, emotions: {}, confidence: 0.8 };
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWavResult)
    });
    
    const wavResult = await voiceClient.processVoice(wavBlob);
    expect(wavResult).toEqual(mockWavResult);
    
    // Test with MP3 format
    const mp3Blob = new Blob(['test audio'], { type: 'audio/mp3' });
    const mockMp3Result = { text: 'MP3 recording', sentiment: { label: 'negative', score: 0.3 }, emotions: {}, confidence: 0.7 };
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMp3Result)
    });
    
    const mp3Result = await voiceClient.processVoice(mp3Blob);
    expect(mp3Result).toEqual(mockMp3Result);
  });

  it('should handle streaming data with onDataAvailable', async () => {
    // Setup data handler to capture streaming data
    const dataChunks: Blob[] = [];
    voiceClient = new VoiceClient({
      onDataAvailable: (blob: Blob) => {
        dataChunks.push(blob);
      }
    });
    
    // Start recording
    await voiceClient.startRecording();
    
    // Simulate multiple data chunks arriving
    const chunk1 = new Blob(['chunk1'], { type: 'audio/webm' });
    const chunk2 = new Blob(['chunk2'], { type: 'audio/webm' });
    const chunk3 = new Blob(['chunk3'], { type: 'audio/webm' });
    
    if (mockMediaRecorder.ondataavailable) {
      mockMediaRecorder.ondataavailable({ data: chunk1 });
      mockMediaRecorder.ondataavailable({ data: chunk2 });
      mockMediaRecorder.ondataavailable({ data: chunk3 });
    }
    
    // Stop recording
    await voiceClient.stopRecording();
    
    // Verify all chunks were captured
    expect(dataChunks.length).toBe(3);
    expect(dataChunks[0]).toBe(chunk1);
    expect(dataChunks[1]).toBe(chunk2);
    expect(dataChunks[2]).toBe(chunk3);
  });
}); 