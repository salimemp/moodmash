import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock TensorFlow modules
vi.mock('@tensorflow-models/face-detection', () => ({
  SupportedModels: {
    MediaPipeFaceDetector: 'MediaPipeFaceDetector',
  },
  createDetector: vi.fn()
}));

vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}));
vi.mock('@tensorflow/tfjs-core', () => ({}));

// Import the component
import CameraCapture from '../CameraCapture';

// Save original console.error
const originalConsoleError = console.error;

describe('CameraCapture Component Error Handling', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock console.error to prevent cluttering test output
    console.error = vi.fn();
    
    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }]
        })
      },
    });
    
    // Default mock for createDetector
    const faceDetection = require('@tensorflow-models/face-detection');
    faceDetection.createDetector.mockResolvedValue({
      estimateFaces: vi.fn().mockResolvedValue([])
    });
  });
  
  afterAll(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });
  
  it('should handle error when camera access is denied', async () => {
    // Override getUserMedia to reject with a permission error
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValueOnce(new Error('Permission denied'));
    
    render(
      <CameraCapture
        onImageCaptured={() => {}}
        onEmotionDetected={() => {}}
      />
    );
    
    // Click the start camera button
    fireEvent.click(screen.getByText('Start Camera'));
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Could not access the camera. Please check permissions and try again.')).toBeInTheDocument();
    });
    
    // Verify console.error was called with the error
    expect(console.error).toHaveBeenCalled();
  });
  
  it('should handle error during model loading', async () => {
    // Override createDetector to reject with an error
    const faceDetection = require('@tensorflow-models/face-detection');
    faceDetection.createDetector.mockRejectedValueOnce(new Error('Failed to load model'));
    
    render(
      <CameraCapture
        onImageCaptured={() => {}}
        onEmotionDetected={() => {}}
      />
    );
    
    // When model fails to load, it should show an error in the UI
    await waitFor(() => {
      expect(screen.getByText('Loading face detection model...')).toBeInTheDocument();
    });
    
    // Verify console.error was called with the error
    expect(console.error).toHaveBeenCalled();
  });
  
  it('should handle error during face detection', async () => {
    // Mock successful model loading but failed face detection
    const mockEstimateFaces = vi.fn().mockRejectedValueOnce(new Error('Face detection failed'));
    const faceDetection = require('@tensorflow-models/face-detection');
    faceDetection.createDetector.mockResolvedValueOnce({
      estimateFaces: mockEstimateFaces
    });
    
    render(
      <CameraCapture
        onImageCaptured={() => {}}
        onEmotionDetected={() => {}}
      />
    );
    
    // Wait for the model to be ready
    await waitFor(() => {
      expect(screen.queryByText('Loading face detection model...')).not.toBeInTheDocument();
    });
    
    // Start camera
    fireEvent.click(screen.getByText('Start Camera'));
    
    // Wait for camera to be active
    await waitFor(() => {
      expect(screen.getByText('Capture')).toBeInTheDocument();
    });
    
    // Trigger capture which should trigger face detection
    fireEvent.click(screen.getByText('Capture'));
    
    // Verify that face detection was attempted
    expect(mockEstimateFaces).toHaveBeenCalled();
    
    // Verify console.error was called with the error
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));
  });
  
  it('should cleanup camera resources when unmounted', async () => {
    const mockTrackStop = vi.fn();
    
    // Setup mock implementation for getUserMedia
    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: mockTrackStop }]
    });
    
    const { unmount } = render(
      <CameraCapture
        onImageCaptured={() => {}}
        onEmotionDetected={() => {}}
      />
    );
    
    // Start camera
    fireEvent.click(screen.getByText('Start Camera'));
    
    // Wait for camera to be active
    await waitFor(() => {
      expect(screen.getByText('Capture')).toBeInTheDocument();
    });
    
    // Unmount component
    unmount();
    
    // Verify that camera tracks were stopped
    expect(mockTrackStop).toHaveBeenCalled();
  });
}); 