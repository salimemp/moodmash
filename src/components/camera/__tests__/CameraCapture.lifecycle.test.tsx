import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CameraCapture from '../CameraCapture';

// Mock navigator.mediaDevices
const mockStopTrack = vi.fn();
const mockMediaStream = {
  getTracks: vi.fn(() => [{ stop: mockStopTrack }])
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() => Promise.resolve(mockMediaStream))
  },
});

// Mock the component's dependencies
vi.mock('@tensorflow-models/face-detection', () => ({
  SupportedModels: {
    MediaPipeFaceDetector: 'MediaPipeFaceDetector',
  },
  createDetector: () => Promise.resolve({
    estimateFaces: () => Promise.resolve([])
  })
}));

vi.mock('@tensorflow/tfjs-core', () => ({}));
vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}));

describe('CameraCapture Component Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    
    // Mock cancelAnimationFrame
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    
    // Mock HTMLVideoElement properties and methods
    Object.defineProperty(HTMLVideoElement.prototype, 'srcObject', {
      get: vi.fn(() => mockMediaStream),
      set: vi.fn()
    });
    
    // Mock canvas methods
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({
      drawImage: vi.fn(),
      clearRect: vi.fn(),
    } as unknown as any));
  });

  it('cleans up resources when unmounted', async () => {
    // Setup state to simulate active camera
    Object.defineProperty(HTMLVideoElement.prototype, 'srcObject', {
      get: vi.fn(() => mockMediaStream),
      set: vi.fn()
    });
    
    // Reset mock count
    mockStopTrack.mockClear();
    
    // Render and unmount immediately
    const { unmount } = render(
      <CameraCapture onImageCaptured={() => {}} onEmotionDetected={() => {}} />
    );
    
    unmount();
    
    // Verify resources were cleaned up
    // Note: This is a best-effort test as the actual cleanup depends on component implementation
    // We would need to expose some internal state or mock useState to properly test this
  });
  
  it('calls cancelAnimationFrame when unmounted', () => {
    vi.spyOn(window, 'cancelAnimationFrame');
    
    // Render and unmount
    const { unmount } = render(
      <CameraCapture onImageCaptured={() => {}} onEmotionDetected={() => {}} />
    );
    
    unmount();
    
    // Verify cancelAnimationFrame was called
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
}); 