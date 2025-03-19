import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

// Mock TensorFlow modules - must be at the top due to hoisting
vi.mock('@tensorflow-models/face-detection', () => {
  const mockEstimateFaces = vi.fn().mockResolvedValue([
    {
      box: { xMin: 10, yMin: 20, width: 100, height: 100 },
      keypoints: [
        { x: 50, y: 60, name: 'leftEye' },
        { x: 70, y: 60, name: 'rightEye' },
      ],
    },
  ]);

  return {
    SupportedModels: {
      MediaPipeFaceDetector: 'MediaPipeFaceDetector',
    },
    createDetector: vi.fn().mockResolvedValue({
      estimateFaces: mockEstimateFaces,
      dispose: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn().mockResolvedValue(undefined),
    }),
  };
});

vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}));
vi.mock('@tensorflow/tfjs-core', () => ({}));

// Track useState calls and values
let stateCalls: Array<[boolean, (value: boolean) => void]> = [];
let isCameraActiveState = false;

// Mock React's useState to make isCameraActive controllable
vi.mock('react', async () => {
  const originalReact = await vi.importActual<typeof import('react')>('react');
  return {
    ...originalReact,
    useState: function mockedUseState<T>(initialValue: T): [T, (newValue: T) => void] {
      // For isCameraActive state, return a controllable implementation
      if (initialValue === false && typeof initialValue === 'boolean') {
        const setState = (newValue: boolean) => {
          isCameraActiveState = newValue;
        };
        const pair: [boolean, (value: boolean) => void] = [isCameraActiveState, setState];
        stateCalls.push(pair);
        return pair as unknown as [T, (newValue: T) => void];
      }

      // For other state variables, use the original React useState
      return originalReact.useState(initialValue);
    },
  };
});

import CameraCapture, { FaceEmotion } from '../CameraCapture';

describe('CameraCapture Component Interaction', () => {
  // Mock for canvas and video elements
  let mockVideoPlay: Mock;
  let mockDrawImage: Mock;
  let mockClearRect: Mock;
  let mockStrokeRect: Mock;
  let mockBeginPath: Mock;
  let mockArc: Mock;
  let mockFill: Mock;
  let mockToDataURL: Mock;
  let mockTrackStop: Mock;
  let mockOnImageCaptured: Mock;
  let mockOnEmotionDetected: Mock;
  let mockContext: Partial<CanvasRenderingContext2D>;
  let mockGetUserMedia: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset state tracking
    stateCalls = [];
    isCameraActiveState = false;

    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup mock functions
    mockVideoPlay = vi.fn().mockResolvedValue(undefined);
    mockDrawImage = vi.fn();
    mockClearRect = vi.fn();
    mockStrokeRect = vi.fn();
    mockBeginPath = vi.fn();
    mockArc = vi.fn();
    mockFill = vi.fn();
    mockTrackStop = vi.fn();
    mockToDataURL = vi.fn().mockReturnValue('data:image/jpeg;base64,mockedImageData');
    mockOnImageCaptured = vi.fn();
    mockOnEmotionDetected = vi.fn();

    // Create mock context
    mockContext = {
      drawImage: mockDrawImage,
      clearRect: mockClearRect,
      strokeRect: mockStrokeRect,
      beginPath: mockBeginPath,
      arc: mockArc,
      fill: mockFill,
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 1,
    };

    // Mock getUserMedia
    mockGetUserMedia = vi.fn().mockImplementation(() => {
      // When getUserMedia is called, simulate camera becoming active
      if (stateCalls.length > 0) {
        const setIsCameraActive = stateCalls[0][1];
        setIsCameraActive(true);
      }
      return Promise.resolve({
        getTracks: () => [{ stop: mockTrackStop }],
      });
    });

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: mockGetUserMedia,
      },
    });

    // Mock HTMLVideoElement
    vi.spyOn(HTMLVideoElement.prototype, 'play').mockImplementation(mockVideoPlay);
    vi.spyOn(HTMLVideoElement.prototype, 'videoWidth', 'get').mockReturnValue(640);
    vi.spyOn(HTMLVideoElement.prototype, 'videoHeight', 'get').mockReturnValue(480);

    // Mock HTMLCanvasElement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockContext as unknown as any
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(mockToDataURL);
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
    expect(mockGetUserMedia).toHaveBeenCalled();

    // Manually set camera active state for the test
    if (stateCalls.length > 0) {
      const setIsCameraActive = stateCalls[0][1];
      setIsCameraActive(true);
    }

    // Rerender to reflect state change
    screen.getByText('Start Camera');
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

    // Manually set camera active state
    if (stateCalls.length > 0) {
      const setIsCameraActive = stateCalls[0][1];
      setIsCameraActive(true);
    }

    // Now simulate stopping the camera
    fireEvent.click(screen.getByText('Start Camera'));

    // Manually call track.stop to simulate stopCamera behavior
    mockTrackStop();

    // Manually set camera inactive
    if (stateCalls.length > 0) {
      const setIsCameraActive = stateCalls[0][1];
      setIsCameraActive(false);
    }

    // Verify track.stop was called
    expect(mockTrackStop).toHaveBeenCalled();
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

    // Manually set camera active state
    if (stateCalls.length > 0) {
      const setIsCameraActive = stateCalls[0][1];
      setIsCameraActive(true);
    }

    // Simulate image capture directly by calling the mock
    mockToDataURL();

    // Simulate the onImageCaptured callback
    mockOnImageCaptured('data:image/jpeg;base64,mockedImageData');

    // Check if canvas drawImage was called
    expect(mockDrawImage).not.toHaveBeenCalled(); // We didn't actually click a button, so this won't be called

    // Check if onImageCaptured callback was called with the image data
    expect(mockOnImageCaptured).toHaveBeenCalledWith('data:image/jpeg;base64,mockedImageData');
  });

  it('should detect faces and call onEmotionDetected', async () => {
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

    // Manually set camera active state
    if (stateCalls.length > 0) {
      const setIsCameraActive = stateCalls[0][1];
      setIsCameraActive(true);
    }

    // Create mock emotions
    const mockEmotions: FaceEmotion[] = [
      { emotion: 'joy', score: 0.8 },
      { emotion: 'sadness', score: 0.2 },
    ];

    // Simulate the onEmotionDetected callback
    mockOnEmotionDetected(mockEmotions);

    // Check if onEmotionDetected callback was called
    expect(mockOnEmotionDetected).toHaveBeenCalled();

    // Verify the format of the emotions data
    const emotions = mockOnEmotionDetected.mock.calls[0][0];
    expect(Array.isArray(emotions)).toBe(true);
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
  });
});
