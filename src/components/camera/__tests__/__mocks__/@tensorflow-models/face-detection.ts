// Mock for TensorFlow face detection
import { vi } from 'vitest';

const SupportedModels = {
  MediaPipeFaceDetector: 'MediaPipeFaceDetector'
};

// Mock face detection
const mockFaceDetector = {
  estimateFaces: vi.fn().mockResolvedValue([
    {
      box: {
        xMin: 100,
        yMin: 100,
        width: 200,
        height: 200
      },
      keypoints: [
        { x: 150, y: 150, name: 'nose' },
        { x: 125, y: 125, name: 'leftEye' },
        { x: 175, y: 125, name: 'rightEye' }
      ]
    }
  ])
};

// Mock detector creation function
const createDetector = vi.fn().mockResolvedValue(mockFaceDetector);

export { createDetector, SupportedModels };

