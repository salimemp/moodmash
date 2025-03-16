import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MoodAR from '../MoodAR';

// Mock console.error to prevent error output during tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

// Restore original console.error after tests
afterEach(() => {
  console.error = originalConsoleError;
});

// Mock Three.js with error conditions
vi.mock('three', () => {
  // Mock for successful rendering
  const mockSuccessRenderer = {
    setSize: vi.fn(),
    setClearColor: vi.fn(),
    render: vi.fn(),
    domElement: document.createElement('canvas')
  };
  
  // Mock for renderer that throws error
  const mockErrorRenderer = {
    setSize: vi.fn(),
    setClearColor: vi.fn(),
    render: vi.fn(() => {
      throw new Error('Rendering error');
    }),
    domElement: document.createElement('canvas')
  };
  
  // Track which renderer to return
  let useErrorRenderer = false;
  
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
    WebGLRenderer: vi.fn().mockImplementation(() => {
      if (useErrorRenderer) {
        return mockErrorRenderer;
      }
      return mockSuccessRenderer;
    }),
    // Toggle error renderer for testing
    __useErrorRenderer: (value: boolean) => {
      useErrorRenderer = value;
    },
    TextureLoader: vi.fn().mockImplementation(() => ({
      load: vi.fn((url, onLoad, _, onError) => {
        // For testing error handling in texture loading
        if (url === 'error-texture.png' && onError) {
          setTimeout(() => onError(new Error('Failed to load texture')), 10);
          return { url };
        }
        
        const mockTexture = { url };
        if (onLoad) setTimeout(() => onLoad(mockTexture), 10);
        return mockTexture;
      })
    })),
    BoxGeometry: vi.fn(),
    SphereGeometry: vi.fn(),
    CylinderGeometry: vi.fn(),
    MeshStandardMaterial: vi.fn(),
    Mesh: vi.fn().mockImplementation(() => ({
      rotation: { x: 0, y: 0, z: 0 },
      position: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    })),
    Color: vi.fn().mockImplementation((color) => ({ color })),
    AmbientLight: vi.fn().mockImplementation(() => ({ 
      type: 'AmbientLight'
    })),
    DirectionalLight: vi.fn().mockImplementation(() => ({
      type: 'DirectionalLight',
      position: { set: vi.fn() }
    })),
    PlaneGeometry: vi.fn(),
    BackSide: 'BackSide'
  };
});

// Mock LoadingSpinner component
vi.mock('../../common/LoadingSpinner', () => ({
  default: function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  }
}));

describe('MoodAR Component Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    require('three').__useErrorRenderer(false);
  });
  
  it('displays error message when initialization fails', () => {
    // Force WebGLRenderer to fail by throwing an error during construction
    const ThreeJS = require('three');
    const originalWebGLRenderer = ThreeJS.WebGLRenderer;
    
    ThreeJS.WebGLRenderer = vi.fn().mockImplementationOnce(() => {
      throw new Error('WebGL not supported');
    });
    
    render(<MoodAR emotions={[
      { type: 'joy', score: 0.8 }
    ]} />);
    
    // Restore the original renderer
    ThreeJS.WebGLRenderer = originalWebGLRenderer;
    
    // Verify error message is shown
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });
  
  it('displays error message when rendering fails', () => {
    // Use the error renderer that throws during render
    require('three').__useErrorRenderer(true);
    
    render(<MoodAR emotions={[
      { type: 'joy', score: 0.8 }
    ]} />);
    
    // Verify error message is shown after animation frame tries to render
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });
  
  it('handles texture loading errors gracefully', () => {
    // Provide an error-triggering image URL
    render(<MoodAR 
      emotions={[{ type: 'joy', score: 0.8 }]} 
      capturedImage="error-texture.png" 
    />);
    
    // Verify the component still renders despite texture error
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });
  
  it('shows error message for unsupported browser or device', () => {
    // Remove window.WebGLRenderingContext to simulate unsupported browser
    const originalContext = window.WebGLRenderingContext;
    // @ts-ignore - Intentionally removing this for testing
    window.WebGLRenderingContext = undefined;
    
    render(<MoodAR emotions={[
      { type: 'joy', score: 0.8 }
    ]} />);
    
    // Restore the context after test
    window.WebGLRenderingContext = originalContext;
    
    // Verify appropriate error message
    expect(screen.getByText(/browser does not support WebGL/i)).toBeInTheDocument();
  });
}); 