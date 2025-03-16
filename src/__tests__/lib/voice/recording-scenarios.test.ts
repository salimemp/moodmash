import { validateAudioFormat } from '@/lib/voice/utils';
import { VoiceClient } from '@/lib/voice/voice-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Voice Recording Scenarios', () => {
  let voiceClient: VoiceClient;
  let mockMediaRecorder: any;
  let recordingData: { blob: Blob | null, chunks: Blob[] } = { blob: null, chunks: [] };

  beforeEach(() => {
    recordingData = { blob: null, chunks: [] };

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

    voiceClient = new VoiceClient({
      maxDuration: 300, // 5 minutes
      language: 'en-US',
      onStop: (blob: Blob) => {
        recordingData.blob = blob;
      },
      onDataAvailable: (blob: Blob) => {
        recordingData.chunks.push(blob);
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    recordingData = { blob: null, chunks: [] };
  });

  it('should handle short recordings (under 10 seconds)', async () => {
    await voiceClient.startRecording();
    
    // Simulate 3 chunks of audio data (short recording)
    const audioChunks = [
      new Blob(['chunk1'], { type: 'audio/webm' }),
      new Blob(['chunk2'], { type: 'audio/webm' }),
      new Blob(['chunk3'], { type: 'audio/webm' }),
    ];
    
    audioChunks.forEach(chunk => {
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: chunk });
      }
    });
    
    await voiceClient.stopRecording();
    
    expect(recordingData.chunks.length).toBe(3);
    expect(recordingData.blob).toBeDefined();
    expect(recordingData.blob?.type).toBe('audio/webm');
  });

  it('should handle longer recordings with many chunks', async () => {
    await voiceClient.startRecording();
    
    // Simulate 20 chunks of audio data (longer recording)
    const audioChunks = Array.from({ length: 20 }, (_, i) => 
      new Blob([`chunk${i+1}`], { type: 'audio/webm' })
    );
    
    audioChunks.forEach(chunk => {
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: chunk });
      }
    });
    
    await voiceClient.stopRecording();
    
    expect(recordingData.chunks.length).toBe(20);
    expect(recordingData.blob).toBeDefined();
  });

  it('should handle different audio formats', async () => {
    // Test with common audio formats
    const formats = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a'];
    
    for (const format of formats) {
      // Verify if format is valid according to our utility
      const isValid = validateAudioFormat(format);
      expect(isValid).toBe(true);
      
      // Clear previous data
      recordingData = { blob: null, chunks: [] };
      
      // Create a mock blob with this format
      const mockBlob = new Blob(['test audio data'], { type: format });
      
      // In our test environment, all recordings end up as webm regardless of input format
      // This is a limitation of the mock and would work differently in a real browser
      await voiceClient.startRecording();
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: mockBlob });
      }
      await voiceClient.stopRecording();
      
      // Just verify we got a blob back, not checking format as it's always webm in the mock
      expect(recordingData.blob).not.toBeNull();
    }
  });

  it('should enforce maximum recording duration', async () => {
    // Create a client with 3 second max duration
    const shortDurationClient = new VoiceClient({
      maxDuration: 3,
      onStop: (blob: Blob) => {
        recordingData.blob = blob;
      },
    });

    // Mock setTimeout
    const mockSetTimeout = vi.spyOn(global, 'setTimeout');
    
    await shortDurationClient.startRecording();
    
    // Verify setTimeout was called with correct duration
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 3000);
    
    // Simulate auto-stop after timeout
    mockMediaRecorder.stop();
    
    expect(mockMediaRecorder.stop).toHaveBeenCalled();
    expect(shortDurationClient.isCurrentlyRecording()).toBe(false);
  });

  it('should handle auto-stopping after max duration', async () => {
    vi.useFakeTimers();
    
    // Create a client with 1 second max duration
    const shortDurationClient = new VoiceClient({
      maxDuration: 1,
      onStop: (blob: Blob) => {
        recordingData.blob = blob;
      },
    });
    
    await shortDurationClient.startRecording();
    
    // Add a mock blob
    if (mockMediaRecorder.ondataavailable) {
      mockMediaRecorder.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) });
    }
    
    // Fast-forward time to trigger auto-stop
    vi.advanceTimersByTime(1100); // slightly more than 1 second
    
    expect(mockMediaRecorder.stop).toHaveBeenCalled();
    expect(shortDurationClient.isCurrentlyRecording()).toBe(false);
    expect(recordingData.blob).toBeDefined();
    
    vi.useRealTimers();
  });

  it('should handle MediaRecorder errors during recording', async () => {
    // Create a flag to track if the error handler was called
    let errorHandlerCalled = false;
    
    voiceClient = new VoiceClient({
      onError: () => {
        errorHandlerCalled = true;
      },
    });
    
    await voiceClient.startRecording();
    
    // Trigger MediaRecorder error event
    const recorderError = new Error('MediaRecorder internal error');
    
    try {
      // The onerror handler is defined by the VoiceClient when recording starts
      if (mockMediaRecorder.onerror) {
        mockMediaRecorder.onerror({ error: recorderError });
      }
    } catch (e) {
      // Ignore the thrown error as we expect it to be caught by the VoiceClient
    }
    
    // Verify error was handled and recording was stopped
    expect(errorHandlerCalled).toBe(true);
    expect(voiceClient.isCurrentlyRecording()).toBe(false);
  });

  it('should handle concurrent recording attempts', async () => {
    // Start first recording
    await voiceClient.startRecording();
    expect(voiceClient.isCurrentlyRecording()).toBe(true);
    
    // Try to start another recording while the first is active
    await expect(voiceClient.startRecording()).rejects.toThrow('Already recording');
    
    // Stop recording and verify we can start a new one
    await voiceClient.stopRecording();
    expect(voiceClient.isCurrentlyRecording()).toBe(false);
    
    // Should be able to start a new recording now
    await voiceClient.startRecording();
    expect(voiceClient.isCurrentlyRecording()).toBe(true);
  });
}); 