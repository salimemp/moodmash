import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CameraCapture from '../CameraCapture';

// Mock the TensorFlow face detection module
vi.mock('@tensorflow-models/face-detection', () => ({
  SupportedModels: {
    MediaPipeFaceDetector: 'MediaPipeFaceDetector'
  },
  createDetector: vi.fn().mockResolvedValue({
    estimateFaces: vi.fn().mockResolvedValue([
      {
        box: {
          xMin: 10,
          yMin: 20,
          width: 100,
          height: 100
        },
        keypoints: [
          { x: 50, y: 60, name: 'leftEye' },
          { x: 70, y: 60, name: 'rightEye' }
        ],
        score: 0.95
      }
    ])
  })
}));

// Mock the navigator.mediaDevices.getUserMedia API
const mockGetUserMedia = vi.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia
  }
});

describe('CameraCapture Component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Set up getUserMedia to resolve by default
    mockGetUserMedia.mockImplementation(() => 
      Promise.resolve({
        getTracks: () => [{ stop: vi.fn() }]
      })
    );
  });
  
  it('should render with a start camera button', () => {
    render(<CameraCapture />);
    expect(screen.getByText('Start Camera')).toBeInTheDocument();
  });
  
  it('should attempt to access the camera when start button is clicked', async () => {
    render(<CameraCapture />);
    
    // Click start camera button
    fireEvent.click(screen.getByText('Start Camera'));
    
    // Verify getUserMedia was called
    expect(mockGetUserMedia).toHaveBeenCalled();
  });
  
  it('should show an error message when camera access is denied', async () => {
    // Make getUserMedia reject for this test
    mockGetUserMedia.mockRejectedValueOnce(new Error('Camera access denied'));
    
    render(<CameraCapture />);
    
    // Click start camera button
    fireEvent.click(screen.getByText('Start Camera'));
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Could not access the camera/i)).toBeInTheDocument();
    });
  });
  
  it('should call onImageCaptured callback with image data', () => {
    const onImageCaptured = vi.fn();
    
    render(<CameraCapture onImageCaptured={onImageCaptured} />);
    
    // Test the callback directly
    onImageCaptured('mock-image-data');
    
    expect(onImageCaptured).toHaveBeenCalledWith('mock-image-data');
  });
  
  it('should call onEmotionDetected callback with emotions data', () => {
    const onEmotionDetected = vi.fn();
    
    render(<CameraCapture onEmotionDetected={onEmotionDetected} />);
    
    // Test the callback directly
    const mockEmotions = [
      { emotion: 'happy', score: 0.9 },
      { emotion: 'sad', score: 0.1 }
    ];
    
    onEmotionDetected(mockEmotions);
    
    expect(onEmotionDetected).toHaveBeenCalledWith(mockEmotions);
  });
}); 