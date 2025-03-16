import { VoiceClient } from '@/lib/voice/voice-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface MockMediaRecorder {
  start: () => void;
  stop: () => void;
  addEventListener: (event: string, handler: (event: { data: Blob }) => void) => void;
  removeEventListener: (event: string, handler: (event: { data: Blob }) => void) => void;
  state: string;
  ondataavailable?: (event: { data: Blob }) => void;
  onstart?: () => void;
  onstop?: () => void;
  onerror?: (event: { error: Error }) => void;
}

describe('VoiceClient', () => {
  let voiceClient: VoiceClient;
  let mockMediaRecorder: MockMediaRecorder;
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
      addEventListener: vi.fn((event: string, handler: (event: { data: Blob }) => void) => {
        if (event === 'dataavailable') {
          mockMediaRecorder.ondataavailable = handler;
        }
      }),
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

  it('should initialize correctly', () => {
    expect(voiceClient).toBeDefined();
  });

  it('should start recording when startRecording is called', async () => {
    await voiceClient.startRecording();
    expect(mockMediaRecorder.start).toHaveBeenCalled();
  });

  it('should stop recording when stopRecording is called', async () => {
    await voiceClient.startRecording();
    await voiceClient.stopRecording();
    expect(mockMediaRecorder.stop).toHaveBeenCalled();
  });

  it('should throw error if startRecording is called while already recording', async () => {
    await voiceClient.startRecording();
    await expect(voiceClient.startRecording()).rejects.toThrow('Already recording');
  });

  it('should throw error if stopRecording is called while not recording', async () => {
    await expect(voiceClient.stopRecording()).rejects.toThrow('Not recording');
  });

  it('should handle dataavailable event and provide blob through onStop', async () => {
    const mockBlob = new Blob(['test'], { type: 'audio/webm' });
    
    await voiceClient.startRecording();
    
    if (mockMediaRecorder.ondataavailable) {
      mockMediaRecorder.ondataavailable({ data: mockBlob });
      await voiceClient.stopRecording();
      
      expect(recordedBlob).toBeDefined();
      expect(recordedBlob).toBeInstanceOf(Blob);
      expect(recordedBlob?.type).toBe('audio/webm');
    }
  });

  it('should handle recording errors', async () => {
    const errorMessage = 'Failed to get user media';
    (global.navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error(errorMessage));
    await expect(voiceClient.startRecording()).rejects.toThrow(errorMessage);
  });

  it('should clean up resources when stopRecording is called', async () => {
    const mockTrack = { stop: vi.fn() };
    (global.navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      getTracks: () => [mockTrack],
    });

    await voiceClient.startRecording();
    await voiceClient.stopRecording();
    expect(mockTrack.stop).toHaveBeenCalled();
  });

  it('should correctly report recording status with isCurrentlyRecording', async () => {
    expect(voiceClient.isCurrentlyRecording()).toBe(false);
    
    await voiceClient.startRecording();
    expect(voiceClient.isCurrentlyRecording()).toBe(true);
    
    await voiceClient.stopRecording();
    expect(voiceClient.isCurrentlyRecording()).toBe(false);
  });

  it('should process voice recordings via API', async () => {
    const mockBlob = new Blob(['test audio'], { type: 'audio/webm' });
    const mockResult = {
      text: 'Hello world',
      sentiment: { label: 'positive', score: 0.85 },
      emotions: { happy: 0.8 },
      confidence: 0.95
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult)
    });

    const result = await voiceClient.processVoice(mockBlob);
    
    expect(global.fetch).toHaveBeenCalledWith('/api/voice/process', {
      method: 'POST',
      body: expect.any(FormData)
    });
    expect(result).toEqual(mockResult);
  });

  it('should handle API errors in processVoice', async () => {
    const mockBlob = new Blob(['test audio'], { type: 'audio/webm' });
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    await expect(voiceClient.processVoice(mockBlob)).rejects.toThrow('Voice processing error');
  });

  it('should handle network errors in processVoice', async () => {
    const mockBlob = new Blob(['test audio'], { type: 'audio/webm' });
    const networkError = new Error('Network error');
    
    global.fetch = vi.fn().mockRejectedValueOnce(networkError);

    await expect(voiceClient.processVoice(mockBlob)).rejects.toThrow('Voice processing error');
  });
}); 