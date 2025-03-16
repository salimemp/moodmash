import { validateAudioFormat } from '@/lib/voice/utils';
import { VoiceClient } from '@/lib/voice/voice-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Voice Environment Compatibility', () => {
  let originalUserAgent: string;
  let originalMediaDevices: any;
  let originalMediaRecorder: any;
  
  beforeEach(() => {
    // Save original properties
    originalUserAgent = navigator.userAgent;
    originalMediaDevices = navigator.mediaDevices;
    originalMediaRecorder = window.MediaRecorder;
    
    // Mock default MediaRecorder
    window.MediaRecorder = vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof MediaRecorder;
    
    // Mock MediaRecorder.isTypeSupported
    (window.MediaRecorder as any).isTypeSupported = vi.fn().mockReturnValue(true);
    
    // Mock mediaDevices API
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{
            stop: vi.fn(),
          }],
        }),
      },
      configurable: true,
      writable: true,
    });
  });
  
  afterEach(() => {
    // Restore original properties
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      configurable: true,
    });
    
    window.MediaRecorder = originalMediaRecorder;
    
    vi.clearAllMocks();
  });

  describe('Browser Detection and Compatibility', () => {
    it('should detect unsupported browsers and handle gracefully', async () => {
      // Remove MediaRecorder to simulate unsupported browser
      (window as any).MediaRecorder = undefined;
      
      const voiceClient = new VoiceClient();
      let errorCaught = false;
      
      try {
        await voiceClient.startRecording();
      } catch (error) {
        errorCaught = true;
        expect(error).toBeDefined();
      }
      
      expect(errorCaught).toBe(true);
    });
    
    it('should handle browsers without mediaDevices API', async () => {
      // Remove mediaDevices to simulate old browser
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        configurable: true,
      });
      
      const voiceClient = new VoiceClient();
      let errorCaught = false;
      
      try {
        await voiceClient.startRecording();
      } catch (error) {
        errorCaught = true;
        expect(error).toBeDefined();
      }
      
      expect(errorCaught).toBe(true);
    });
  });
  
  describe('Audio Format Support', () => {
    it('should handle different browser audio format support', async () => {
      // Mock different browser support for audio formats
      (window.MediaRecorder as any).isTypeSupported = (mimeType: string) => {
        // Simulate a browser that only supports webm
        return mimeType === 'audio/webm';
      };
      
      // Test support for different formats
      expect(validateAudioFormat('audio/webm')).toBe(true);
      expect(validateAudioFormat('audio/mp3')).toBe(true); // Our utility should allow it even if browser doesn't
      
      // Now simulate a browser that doesn't support any of these
      (window.MediaRecorder as any).isTypeSupported = () => false;
      
      // Our utility should still function but might lead to runtime errors
      expect(validateAudioFormat('audio/webm')).toBe(true);
    });
  });
  
  describe('Media Access Permissions', () => {
    it('should handle permission denied for microphone access', async () => {
      // Simulate permission denied error
      const permissionError = new Error('Permission denied');
      permissionError.name = 'NotAllowedError';
      
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockRejectedValue(permissionError),
        },
        configurable: true,
      });
      
      // Set up error handler
      let errorHandlerCalled = false;
      let capturedError: Error | null = null;
      
      const voiceClient = new VoiceClient({
        onError: (error: Error) => {
          errorHandlerCalled = true;
          capturedError = error;
        },
      });
      
      // Attempt to record
      try {
        await voiceClient.startRecording();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBe(permissionError);
      }
      
      expect(errorHandlerCalled).toBe(true);
      expect(capturedError).toBe(permissionError);
    });
    
    it('should handle no microphone available', async () => {
      // Simulate device not found error
      const deviceError = new Error('Device not found');
      deviceError.name = 'NotFoundError';
      
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockRejectedValue(deviceError),
        },
        configurable: true,
      });
      
      const voiceClient = new VoiceClient();
      
      // Attempt to record
      await expect(voiceClient.startRecording()).rejects.toThrow('Device not found');
    });
  });
  
  describe('Mobile Device Handling', () => {
    it('should handle iOS safari specific behavior', async () => {
      // Mock iOS Safari user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      });
      
      const voiceClient = new VoiceClient();
      
      // We can't fully test iOS-specific code paths in Node,
      // but we can verify the class initializes without errors
      expect(voiceClient).toBeDefined();
    });
    
    it('should handle Android Chrome specific behavior', async () => {
      // Mock Android Chrome user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        configurable: true,
      });
      
      const voiceClient = new VoiceClient();
      
      // Verify initialization works
      expect(voiceClient).toBeDefined();
    });
  });
}); 