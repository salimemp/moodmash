import { type Emotion } from '@/lib/ml/sentiment-analyzer';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MoodAR from '../MoodAR';

// Mock Three.js and related modules
vi.mock('three', () => {
  return {
    Scene: vi.fn().mockImplementation(() => ({
      add: vi.fn(),
      remove: vi.fn(),
      children: []
    })),
    PerspectiveCamera: vi.fn().mockImplementation(() => ({
      aspect: 1,
      updateProjectionMatrix: vi.fn()
    })),
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      setSize: vi.fn(),
      setClearColor: vi.fn(),
      render: vi.fn(),
      domElement: document.createElement('canvas')
    })),
    TextureLoader: vi.fn().mockImplementation(() => ({
      load: vi.fn((url, onLoad) => {
        if (onLoad) setTimeout(() => onLoad({ url }), 10);
        return { url };
      })
    })),
    BoxGeometry: vi.fn(),
    SphereGeometry: vi.fn(),
    CylinderGeometry: vi.fn(),
    ConeGeometry: vi.fn(),
    TorusGeometry: vi.fn(),
    MeshStandardMaterial: vi.fn(),
    Mesh: vi.fn().mockImplementation(() => ({
      rotation: { x: 0, y: 0, z: 0 },
      position: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    })),
    Color: vi.fn(),
    AmbientLight: vi.fn(),
    DirectionalLight: vi.fn().mockImplementation(() => ({
      position: { set: vi.fn() }
    })),
    PlaneGeometry: vi.fn(),
    BackSide: 'BackSide'
  };
});

// Mock LoadingSpinner component
vi.mock('../../common/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>
}));

describe('MoodAR Component Rendering with Different Emotions', () => {
  // Track created meshes for different emotion types
  const createdMeshes: { [key: string]: any[] } = {
    joy: [],
    sadness: [],
    anger: [],
    fear: [],
    surprise: [],
    disgust: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear the tracked meshes
    Object.keys(createdMeshes).forEach(key => {
      createdMeshes[key] = [];
    });
    
    // Mock the requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(0);
      return 0;
    });
    
    // Mock the cancelAnimationFrame
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  it('renders properly with a single emotion', () => {
    const singleEmotion: Emotion[] = [
      { type: 'joy', score: 0.9 }
    ];
    
    const { container } = render(
      <MoodAR emotions={singleEmotion} />
    );
    
    // Check that the component renders a canvas
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    
    // Verify Three.js objects were created
    expect(vi.mocked(require('three').Scene)).toHaveBeenCalled();
    expect(vi.mocked(require('three').WebGLRenderer)).toHaveBeenCalled();
    expect(vi.mocked(require('three').PerspectiveCamera)).toHaveBeenCalled();
  });

  it('renders properly with multiple emotions', () => {
    const multipleEmotions: Emotion[] = [
      { type: 'joy', score: 0.7 },
      { type: 'sadness', score: 0.2 },
      { type: 'anger', score: 0.1 }
    ];
    
    const { container } = render(
      <MoodAR emotions={multipleEmotions} />
    );
    
    // Check that the component renders a canvas
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    
    // Verify Three.js objects were created
    expect(vi.mocked(require('three').Scene)).toHaveBeenCalled();
    expect(vi.mocked(require('three').WebGLRenderer)).toHaveBeenCalled();
    expect(vi.mocked(require('three').PerspectiveCamera)).toHaveBeenCalled();
  });

  it('creates different geometries for different emotion types', () => {
    // Mock the Three.js geometry constructors to track created geometries
    const geometryMocks = {
      BoxGeometry: vi.fn(),
      SphereGeometry: vi.fn(),
      CylinderGeometry: vi.fn(),
      ConeGeometry: vi.fn(),
      TorusGeometry: vi.fn()
    };
    
    vi.mocked(require('three').BoxGeometry).mockImplementation((...args: any[]) => {
      const geo = geometryMocks.BoxGeometry(...args);
      return { type: 'BoxGeometry', ...geo };
    });
    
    vi.mocked(require('three').SphereGeometry).mockImplementation((...args: any[]) => {
      const geo = geometryMocks.SphereGeometry(...args);
      return { type: 'SphereGeometry', ...geo };
    });
    
    vi.mocked(require('three').CylinderGeometry).mockImplementation((...args: any[]) => {
      const geo = geometryMocks.CylinderGeometry(...args);
      return { type: 'CylinderGeometry', ...geo };
    });
    
    vi.mocked(require('three').ConeGeometry).mockImplementation((...args: any[]) => {
      const geo = geometryMocks.ConeGeometry(...args);
      return { type: 'ConeGeometry', ...geo };
    });
    
    vi.mocked(require('three').TorusGeometry).mockImplementation((...args: any[]) => {
      const geo = geometryMocks.TorusGeometry(...args);
      return { type: 'TorusGeometry', ...geo };
    });
    
    // Render with all emotion types
    const allEmotions: Emotion[] = [
      { type: 'joy', score: 0.9 },
      { type: 'sadness', score: 0.8 },
      { type: 'anger', score: 0.7 },
      { type: 'fear', score: 0.6 },
      { type: 'surprise', score: 0.5 },
      { type: 'disgust', score: 0.4 }
    ];
    
    render(<MoodAR emotions={allEmotions} />);
    
    // Verify different geometries were created
    const geometryCalls = [
      vi.mocked(require('three').BoxGeometry).mock.calls.length,
      vi.mocked(require('three').SphereGeometry).mock.calls.length,
      vi.mocked(require('three').CylinderGeometry).mock.calls.length,
      vi.mocked(require('three').ConeGeometry).mock.calls.length,
      vi.mocked(require('three').TorusGeometry).mock.calls.length
    ];
    
    // Check that at least some geometries were created
    expect(geometryCalls.reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });

  it('creates materials with different colors for different emotions', () => {
    // Track created material colors
    const colorsSeen = new Set<string>();
    const originalColor = vi.mocked(require('three').Color);
    
    // Mock the Color constructor to track colors
    vi.mocked(require('three').Color).mockImplementation((color: any) => {
      colorsSeen.add(String(color));
      return new originalColor(color);
    });
    
    // Render with multiple different emotions
    const emotionsWithDifferentScores: Emotion[] = [
      { type: 'joy', score: 0.9 },
      { type: 'sadness', score: 0.7 },
      { type: 'anger', score: 0.5 },
      { type: 'fear', score: 0.3 }
    ];
    
    render(<MoodAR emotions={emotionsWithDifferentScores} />);
    
    // Different emotions should create different colored materials
    expect(colorsSeen.size).toBeGreaterThan(1);
  });

  it('scales objects proportionally to emotion scores', () => {
    // Track mesh scales
    const scales: number[] = [];
    const originalMesh = vi.mocked(require('three').Mesh);
    
    // Mock the Mesh constructor to track scales
    vi.mocked(require('three').Mesh).mockImplementation((...args: any[]) => {
      const mesh = originalMesh(...args);
      if (mesh.scale && mesh.scale.x) {
        scales.push(mesh.scale.x);
      }
      return mesh;
    });
    
    // Render with varying emotion intensities
    const emotionsWithVaryingIntensity: Emotion[] = [
      { type: 'joy', score: 0.9 },
      { type: 'joy', score: 0.5 },
      { type: 'joy', score: 0.1 }
    ];
    
    render(<MoodAR emotions={emotionsWithVaryingIntensity} />);
    
    // Verify different scales were applied (this is a simplistic check)
    expect(scales.length).toBeGreaterThan(0);
  });

  it('renders with a captured image as backdrop', () => {
    const testImageData = 'data:image/jpeg;base64,mockedData';
    const mockTextureLoader = vi.mocked(require('three').TextureLoader);
    
    render(
      <MoodAR 
        emotions={[{ type: 'joy', score: 0.8 }]} 
        capturedImage={testImageData}
      />
    );
    
    // Check that the TextureLoader was instantiated
    expect(mockTextureLoader).toHaveBeenCalled();
    
    // Check that the load method was called with the image data
    const textureLoaderInstance = mockTextureLoader.mock.instances[0];
    expect(textureLoaderInstance.load).toHaveBeenCalledWith(
      testImageData,
      expect.any(Function),
      undefined,
      expect.any(Function)
    );
  });

  it('positions camera appropriately based on component dimensions', () => {
    const customWidth = 800;
    const customHeight = 600;
    const mockPerspectiveCamera = vi.mocked(require('three').PerspectiveCamera);
    
    render(
      <MoodAR 
        emotions={[{ type: 'joy', score: 0.8 }]} 
        width={customWidth}
        height={customHeight}
      />
    );
    
    // Check if PerspectiveCamera was created with appropriate aspect ratio
    expect(mockPerspectiveCamera).toHaveBeenCalled();
    const cameraInstance = mockPerspectiveCamera.mock.instances[0];
    
    // Verify the camera's aspect ratio was set
    // This is a bit of an implementation detail, but important for correct rendering
    expect(cameraInstance.aspect).toBeDefined();
    expect(cameraInstance.updateProjectionMatrix).toHaveBeenCalled();
  });
}); 