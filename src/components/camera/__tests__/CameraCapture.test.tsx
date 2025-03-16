import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CameraCapture from '../CameraCapture';

// Mock dependencies
vi.mock('@tensorflow-models/face-detection', () => ({
  SupportedModels: {
    MediaPipeFaceDetector: 'MediaPipeFaceDetector',
  },
  createDetector: vi.fn(() => Promise.resolve({
    estimateFaces: vi.fn(() => Promise.resolve([
      {
        box: { xMin: 10, yMin: 20, width: 100, height: 100 },
        keypoints: [
          { x: 50, y: 60, name: 'leftEye' },
          { x: 70, y: 60, name: 'rightEye' }
        ]
      }
    ]))
  }))
}));

vi.mock('@tensorflow/tfjs-core', () => ({}));
vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}));

// Mock console.error
console.error = vi.fn();

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

// Mock LoadingSpinner component
vi.mock('../../common/LoadingSpinner', () => ({
  default: () => <div role="status">Loading Spinner</div>
}));

describe('CameraCapture Component Rendering', () => {
  const mockOnImageCaptured = vi.fn();
  const mockOnEmotionDetected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock canvas and video methods
    const mockContext = {
      drawImage: vi.fn(),
      clearRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
    };

    // Use vi.spyOn instead of direct assignment
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() =>
      mockContext as unknown as any
    );

    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() =>
      'data:image/png;base64,mock-image-data'
    );

    // Mock video properties
    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', { value: 640 });
    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', { value: 480 });
  });

  it('renders correctly with default props', () => {
    render(
      <CameraCapture
        onImageCaptured={mockOnImageCaptured}
        onEmotionDetected={mockOnEmotionDetected}
      />
    );

    const startButton = screen.getByText('Start Camera');
    expect(startButton).toBeInTheDocument();
  });

  it('renders the start camera button', () => {
    render(
      <CameraCapture
        onImageCaptured={mockOnImageCaptured}
        onEmotionDetected={mockOnEmotionDetected}
      />
    );

    const startButton = screen.getByText('Start Camera');
    expect(startButton).toBeInTheDocument();
    expect(startButton).toBeEnabled();
  });

  it('renders with custom dimensions', () => {
    const customWidth = 800;
    const customHeight = 600;

    render(
      <CameraCapture
        onImageCaptured={mockOnImageCaptured}
        onEmotionDetected={mockOnEmotionDetected}
        width={customWidth}
        height={customHeight}
      />
    );

    const container = screen.getByTestId('camera-container');
    expect(container).toHaveAttribute('style', expect.stringContaining(`width: ${customWidth}px`));
    expect(container).toHaveAttribute('style', expect.stringContaining(`height: ${customHeight}px`));
  });

  it('renders with custom buttonText', () => {
    const customButtonText = 'Activate Camera';

    render(
      <CameraCapture
        onImageCaptured={mockOnImageCaptured}
        onEmotionDetected={mockOnEmotionDetected}
        buttonText={customButtonText}
      />
    );

    const startButton = screen.getByText(customButtonText);
    expect(startButton).toBeInTheDocument();
  });

  it('shows loading message for face detection model', () => {
    render(
      <CameraCapture
        onImageCaptured={mockOnImageCaptured}
        onEmotionDetected={mockOnEmotionDetected}
      />
    );

    expect(screen.getByText('Loading face detection model...')).toBeInTheDocument();
  });
}); 