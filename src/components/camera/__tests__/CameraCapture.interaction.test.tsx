import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CameraCapture from '../CameraCapture';

// Mock TensorFlow modules
vi.mock('@tensorflow-models/face-detection', () => ({
  SupportedModels: {
    MediaPipeFaceDetector: 'MediaPipeFaceDetector',
  },
  createDetector: vi.fn().mockResolvedValue({
    estimateFaces: vi.fn().mockResolvedValue([
      {
        box: { xMin: 10, yMin: 20, width: 100, height: 100 },
        keypoints: [
          { x: 50, y: 60, name: 'leftEye' },
          { x: 70, y: 60, name: 'rightEye' }
        ]
      }
    ])
  })
}));

vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}));
vi.mock('@tensorflow/tfjs-core', () => ({}));

describe('CameraCapture Component Interaction', () => {
  // Mock for canvas and video elements
  const mockVideoPlay = vi.fn();
  const mockDrawImage = vi.fn();
  const mockClearRect = vi.fn();
  const mockStrokeRect = vi.fn();
  const mockBeginPath = vi.fn();
  const mockArc = vi.fn();
  const mockFill = vi.fn();
  const mockToDataURL = vi.fn().mockReturnValue('data:image/jpeg;base64,mockedImageData');
  
  // Mock media stream tracks
  const mockTrackStop = vi.fn();
  
  // Callbacks for component props
  const mockOnImageCaptured = vi.fn();
  const mockOnEmotionDetected = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock getUserMedia
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: mockTrackStop }]
        })
      }
    });
    
    // Mock HTMLVideoElement
    Object.defineProperty(HTMLVideoElement.prototype, 'play', { value: mockVideoPlay });
    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', { value: 640 });
    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', { value: 480 });
    
    // Mock HTMLCanvasElement
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => ({
        drawImage: mockDrawImage,
        clearRect: mockClearRect,
        strokeRect: mockStrokeRect,
        beginPath: mockBeginPath,
        arc: mockArc,
        fill: mockFill,
        strokeStyle: '',
        fillStyle: '',
        lineWidth: 1
      })
    });
    
    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', { value: mockToDataURL });
  });
  
  it('should start camera when start button is clicked', async () => {
    render(
      <CameraCapture
        onImageCaptured={mockOnImageCaptured}
        onEmotionDetected={mockOnEmotionDetected}
      />
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText('Loading face detection model...')).not.toBeInTheDocument();
    });
    
    // Click start camera button
    fireEvent.click(screen.getByText('Start Camera'));
    
    // Check if getUserMedia was called
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    
    // Check if camera is active (capture button appears)
    await waitFor(() => {
      expect(screen.getByText('Capture')).toBeInTheDocument();
    });
  });
  
  it('should stop camera when button is clicked after camera is started', async () => {
    render(
      <CameraCapture
        onImageCaptured={mockOnImageCaptured}
        onEmotionDetected={mockOnEmotionDetected}
      />
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText('Loading face detection model...')).not.toBeInTheDocument();
    });
    
    // Start camera
    fireEvent.click(screen.getByText('Start Camera'));
    
    // Wait for camera to be active
    await waitFor(() => {
      expect(screen.getByText('Capture')).toBeInTheDocument();
    });
    
    // Stop camera
    fireEvent.click(screen.getByText('Start Camera'));
    
    // Verify track.stop was called
    expect(mockTrackStop).toHaveBeenCalled();
    
    // Capture button should disappear
    await waitFor(() => {
      expect(screen.queryByText('Capture')).not.toBeInTheDocument();
    });
  });
  
  it('should capture image and call onImageCaptured when capture button is clicked', async () => {
    render(
      <CameraCapture
        onImageCaptured={mockOnImageCaptured}
        onEmotionDetected={mockOnEmotionDetected}
      />
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText('Loading face detection model...')).not.toBeInTheDocument();
    });
    
    // Start camera
    fireEvent.click(screen.getByText('Start Camera'));
    
    // Wait for camera to be active
    await waitFor(() => {
      expect(screen.getByText('Capture')).toBeInTheDocument();
    });
    
    // Capture image
    fireEvent.click(screen.getByText('Capture'));
    
    // Check if canvas drawImage was called
    expect(mockDrawImage).toHaveBeenCalled();
    
    // Check if toDataURL was called
    expect(mockToDataURL).toHaveBeenCalled();
    
    // Check if onImageCaptured callback was called with the image data
    expect(mockOnImageCaptured).toHaveBeenCalledWith('data:image/jpeg;base64,mockedImageData');
  });
  
  it('should detect faces and call onEmotionDetected when capture button is clicked', async () => {
    render(
      <CameraCapture
        onImageCaptured={mockOnImageCaptured}
        onEmotionDetected={mockOnEmotionDetected}
      />
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText('Loading face detection model...')).not.toBeInTheDocument();
    });
    
    // Start camera
    fireEvent.click(screen.getByText('Start Camera'));
    
    // Wait for camera to be active
    await waitFor(() => {
      expect(screen.getByText('Capture')).toBeInTheDocument();
    });
    
    // Capture image
    fireEvent.click(screen.getByText('Capture'));
    
    // Check if onEmotionDetected callback was called
    expect(mockOnEmotionDetected).toHaveBeenCalled();
    
    // Verify the format of the emotions data
    const emotions = mockOnEmotionDetected.mock.calls[0][0];
    expect(Array.isArray(emotions)).toBe(true);
    expect(emotions.length).toBeGreaterThan(0);
    expect(emotions[0]).toHaveProperty('emotion');
    expect(emotions[0]).toHaveProperty('score');
  });
  
  it('should work with custom button text', async () => {
    const customButtonText = 'Enable Camera';
    const customCaptureText = 'Take Photo';
    
    render(
      <CameraCapture
        onImageCaptured={mockOnImageCaptured}
        onEmotionDetected={mockOnEmotionDetected}
        buttonText={customButtonText}
        captureButtonText={customCaptureText}
      />
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText('Loading face detection model...')).not.toBeInTheDocument();
    });
    
    // Verify custom button text
    expect(screen.getByText(customButtonText)).toBeInTheDocument();
    
    // Start camera
    fireEvent.click(screen.getByText(customButtonText));
    
    // Wait for camera to be active
    await waitFor(() => {
      expect(screen.getByText(customCaptureText)).toBeInTheDocument();
    });
  });
}); 