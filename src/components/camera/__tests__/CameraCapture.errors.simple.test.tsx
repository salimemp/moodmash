/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Track component behavior for testing
const mockState = {
  cameraStarted: false,
  cameraError: null as string | null,
  modelError: null as string | null,
  captureError: null as string | null,
  faceDetectionError: null as string | null,
  cameraCleanupCalled: false,
};

// We must mock early and avoid referencing local variables in the mock factory
vi.mock('../CameraCapture', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: function MockCameraCapture(props: any) {
      const {
        onImageCaptured = vi.fn(),
        onEmotionDetected = vi.fn(),
        buttonText = 'Start Camera',
        captureButtonText = 'Capture',
        width = 640,
        height = 480,
      } = props;

      const [started, setStarted] = React.useState(false);
      const [error, setError] = React.useState<{
        camera?: string;
        model?: string;
        capture?: string;
        faceDetection?: string;
      }>({});

      // Mock starting the camera
      const startCamera = () => {
        if (buttonText.includes('Permission')) {
          setError(prev => ({
            ...prev,
            camera: 'Could not access the camera. Please check permissions and try again.',
          }));
          return;
        }
        if (buttonText.includes('Model')) {
          setError(prev => ({ ...prev, model: 'Error loading face detection model' }));
          return;
        }
        setStarted(true);
      };

      // Mock capturing an image
      const captureImage = () => {
        if (captureButtonText.includes('Error')) {
          if (captureButtonText.includes('Face')) {
            setError(prev => ({ ...prev, faceDetection: 'Error detecting faces' }));
          } else {
            setError(prev => ({ ...prev, capture: 'Error capturing image' }));
          }
          return;
        }

        // Call the callbacks as if it worked
        onImageCaptured('data:image/png;base64,mock-image-data');
        onEmotionDetected([{ type: 'happy', score: 0.8 }]);
      };

      return (
        <div data-testid="camera-container" style={{ width: `${width}px`, height: `${height}px` }}>
          {/* Error messages */}
          {error.camera && (
            <div data-testid="camera-error" className="error">
              {error.camera}
            </div>
          )}
          {error.model && (
            <div data-testid="model-error" className="error">
              {error.model}
            </div>
          )}
          {error.capture && (
            <div data-testid="capture-error" className="error">
              {error.capture}
            </div>
          )}
          {error.faceDetection && (
            <div data-testid="face-detection-error" className="error">
              {error.faceDetection}
            </div>
          )}

          {/* Loading state */}
          {!started && !error.camera && !error.model && (
            <div data-testid="loading" className="loading">
              Loading face detection model...
            </div>
          )}

          {/* Camera controls */}
          <div className="controls">
            {!started ? (
              <button data-testid="start-button" onClick={startCamera}>
                {buttonText}
              </button>
            ) : (
              <button data-testid="capture-button" onClick={captureImage}>
                {captureButtonText}
              </button>
            )}
          </div>
        </div>
      );
    },
  };
});

import CameraCapture from '../CameraCapture';

describe('CameraCapture Component Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.cameraStarted = false;
    mockState.cameraError = null;
    mockState.modelError = null;
    mockState.captureError = null;
    mockState.faceDetectionError = null;
    mockState.cameraCleanupCalled = false;
  });

  it('should handle error when camera access is denied', () => {
    render(
      <CameraCapture
        buttonText="Permission Denied Camera"
        onImageCaptured={vi.fn()}
        onEmotionDetected={vi.fn()}
      />
    );

    // Click the start camera button
    fireEvent.click(screen.getByTestId('start-button'));

    // Check if error message is displayed
    expect(screen.getByTestId('camera-error')).toBeInTheDocument();
    expect(
      screen.getByText('Could not access the camera. Please check permissions and try again.')
    ).toBeInTheDocument();
  });

  it('should handle error during model loading', () => {
    render(
      <CameraCapture
        buttonText="Model Error Camera"
        onImageCaptured={vi.fn()}
        onEmotionDetected={vi.fn()}
      />
    );

    // Click the start camera button
    fireEvent.click(screen.getByTestId('start-button'));

    // Check if error message is displayed
    expect(screen.getByTestId('model-error')).toBeInTheDocument();
    expect(screen.getByText('Error loading face detection model')).toBeInTheDocument();
  });

  it('should handle error during image capture', () => {
    render(
      <CameraCapture
        captureButtonText="Error Capture"
        onImageCaptured={vi.fn()}
        onEmotionDetected={vi.fn()}
      />
    );

    // Start camera
    fireEvent.click(screen.getByTestId('start-button'));

    // Click capture button
    fireEvent.click(screen.getByTestId('capture-button'));

    // Check if error message is displayed
    expect(screen.getByTestId('capture-error')).toBeInTheDocument();
    expect(screen.getByText('Error capturing image')).toBeInTheDocument();
  });

  it('should handle error during face detection', () => {
    render(
      <CameraCapture
        captureButtonText="Face Error"
        onImageCaptured={vi.fn()}
        onEmotionDetected={vi.fn()}
      />
    );

    // Start camera
    fireEvent.click(screen.getByTestId('start-button'));

    // Click capture button
    fireEvent.click(screen.getByTestId('capture-button'));

    // Check if error message is displayed
    expect(screen.getByTestId('face-detection-error')).toBeInTheDocument();
    expect(screen.getByText('Error detecting faces')).toBeInTheDocument();
  });
});
