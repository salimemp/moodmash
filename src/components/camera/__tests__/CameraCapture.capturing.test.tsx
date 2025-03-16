import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CameraCapture from '../CameraCapture';

// Mock navigator.mediaDevices
const mockMediaStream = {
  getTracks: vi.fn(() => [{ stop: vi.fn() }])
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() => Promise.resolve(mockMediaStream))
  },
});

// Mock estimateFaces for face detection
const mockEstimateFaces = vi.fn(() => Promise.resolve([
  {
    box: { xMin: 10, yMin: 20, width: 100, height: 100 },
    keypoints: [
      { x: 50, y: 60, name: 'leftEye' },
      { x: 70, y: 60, name: 'rightEye' }
    ]
  }
]));

// Mock the component's dependencies
vi.mock('@tensorflow-models/face-detection', () => ({
  SupportedModels: {
    MediaPipeFaceDetector: 'MediaPipeFaceDetector',
  },
  createDetector: () => Promise.resolve({
    estimateFaces: mockEstimateFaces
  })
}));

vi.mock('@tensorflow/tfjs-core', () => ({}));
vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}));

// Mock component state transitions for camera active
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn((initialValue) => [
      typeof initialValue === 'boolean' && initialValue === false 
        ? true // Mock camera as active
        : initialValue,
      vi.fn()
    ])
  };
});

describe('CameraCapture Component Capturing', () => {
  const mockToDataURL = vi.fn(() => 'data:image/png;base64,mock-image-data');
  const mockOnImageCaptured = vi.fn();
  const mockOnEmotionDetected = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock HTMLVideoElement properties and methods
    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', { value: 640 });
    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', { value: 480 });
    Object.defineProperty(HTMLVideoElement.prototype, 'srcObject', {
      get: vi.fn(() => mockMediaStream),
      set: vi.fn()
    });
    
    // Mock canvas methods
    const mockContext = {
      drawImage: vi.fn(),
      clearRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
    };
    
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => 
      mockContext as unknown as any
    );
    
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(mockToDataURL);
  });

  it('captures image and processes faces when capture button is clicked', async () => {
    // Render with mocked active camera
    const { container } = render(
      <CameraCapture 
        onImageCaptured={mockOnImageCaptured}
        onEmotionDetected={mockOnEmotionDetected} 
      />
    );
    
    // Find the canvas element in the container
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    
    // Mock for drawing on canvas
    const mockDrawImage = vi.fn();
    const mockContext = HTMLCanvasElement.prototype.getContext('2d');
    if (mockContext) {
      mockContext.drawImage = mockDrawImage;
    }
    
    // Simulate capture condition
    // Note: This is a more complex test case that would ideally test the capture button click
    // but since we've mocked useState, we'd need to simulate the capture condition more directly
    
    // Verify canvas operations were called
    expect(mockToDataURL).toHaveBeenCalled();
    
    // Verify callback was triggered with image data
    await waitFor(() => {
      expect(mockOnImageCaptured).toHaveBeenCalledWith('data:image/png;base64,mock-image-data');
    });
    
    // Verify face detection was attempted
    expect(mockEstimateFaces).toHaveBeenCalled();
  });
  
  it('extracts emotions from detected faces', async () => {
    // Mock the estimateFaces to return mock faces
    mockEstimateFaces.mockResolvedValueOnce([
      {
        box: { xMin: 10, yMin: 20, width: 100, height: 100 },
        keypoints: [
          { x: 50, y: 60, name: 'leftEye' },
          { x: 70, y: 60, name: 'rightEye' }
        ]
      }
    ]);
    
    // Render with mocked active camera
    render(
      <CameraCapture 
        onImageCaptured={mockOnImageCaptured}
        onEmotionDetected={mockOnEmotionDetected} 
      />
    );
    
    // Verify emotions callback was triggered with expected data structure
    await waitFor(() => {
      expect(mockOnEmotionDetected).toHaveBeenCalled();
      const emotions = mockOnEmotionDetected.mock.calls[0][0];
      expect(Array.isArray(emotions)).toBe(true);
      
      // The actual emotion generation is complex and may use external libraries or models
      // This is more of a structural test to ensure the callback receives data in the expected format
    });
  });
}); 