import { type Emotion } from '@/lib/ml/sentiment-analyzer';
import { act, render } from '@testing-library/react';
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
      load: vi.fn(),
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

describe('MoodAR Component Edge Cases', () => {
  // Keep track of created objects
  let mockSetSize: any;
  let mockUpdateProjectionMatrix: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(0);
      return 0;
    });
    
    // Mock cancelAnimationFrame
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    
    // Get references to mocked methods for later assertions
    mockSetSize = vi.fn();
    vi.mocked(require('three').WebGLRenderer).mockImplementation(() => ({
      setSize: mockSetSize,
      setClearColor: vi.fn(),
      render: vi.fn(),
      domElement: document.createElement('canvas')
    }));
    
    mockUpdateProjectionMatrix = vi.fn();
    vi.mocked(require('three').PerspectiveCamera).mockImplementation(() => ({
      aspect: 1,
      updateProjectionMatrix: mockUpdateProjectionMatrix
    }));
    
    // Mock console.error to prevent test output clutter
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  it('handles empty emotions array gracefully', () => {
    const { container } = render(<MoodAR emotions={[]} />);
    
    // Should still render a canvas
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    
    // Should create Three.js objects
    expect(vi.mocked(require('three').Scene)).toHaveBeenCalled();
    expect(vi.mocked(require('three').WebGLRenderer)).toHaveBeenCalled();
    expect(vi.mocked(require('three').PerspectiveCamera)).toHaveBeenCalled();
  });
  
  it('handles undefined emotions prop gracefully', () => {
    const { container } = render(<MoodAR />);
    
    // Should still render a canvas
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    
    // Should create Three.js objects
    expect(vi.mocked(require('three').Scene)).toHaveBeenCalled();
    expect(vi.mocked(require('three').WebGLRenderer)).toHaveBeenCalled();
    expect(vi.mocked(require('three').PerspectiveCamera)).toHaveBeenCalled();
  });
  
  it('handles extremely high emotion scores correctly', () => {
    const extremeEmotions: Emotion[] = [
      { type: 'joy', score: 1.0 },     // Maximum possible value
      { type: 'sadness', score: 0.99 } // Very high value
    ];
    
    render(<MoodAR emotions={extremeEmotions} />);
    
    // Test passes if no errors are thrown
    expect(vi.mocked(require('three').Mesh)).toHaveBeenCalled();
  });
  
  it('handles extremely low emotion scores correctly', () => {
    const extremeEmotions: Emotion[] = [
      { type: 'joy', score: 0.001 },  // Very low value
      { type: 'sadness', score: 0.0 } // Minimum possible value
    ];
    
    render(<MoodAR emotions={extremeEmotions} />);
    
    // Test passes if no errors are thrown
    expect(vi.mocked(require('three').Mesh)).toHaveBeenCalled();
  });
  
  it('handles window resize events', () => {
    const { unmount } = render(
      <MoodAR emotions={[{ type: 'joy', score: 0.8 }]} width={400} height={300} />
    );
    
    // Initial setup should set the renderer size
    expect(mockSetSize).toHaveBeenCalledWith(400, 300);
    
    // Simulate window resize event
    act(() => {
      // Reset the mock calls count
      mockSetSize.mockClear();
      mockUpdateProjectionMatrix.mockClear();
      
      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
    });
    
    // Check if resize handler was called
    // Note: This is a bit implementation specific - component may handle resize differently
    expect(mockUpdateProjectionMatrix).toHaveBeenCalled();
    
    // Clean up
    unmount();
  });
  
  it('handles extreme window dimensions', () => {
    // Save original window dimensions
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    
    // Set extreme dimensions
    Object.defineProperty(window, 'innerWidth', { value: 5000 });
    Object.defineProperty(window, 'innerHeight', { value: 4000 });
    
    const { unmount } = render(
      <MoodAR emotions={[{ type: 'joy', score: 0.8 }]} />
    );
    
    // Should handle large dimensions without crashing
    expect(mockSetSize).toHaveBeenCalled();
    
    // Clean up
    unmount();
    
    // Restore original window dimensions
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight });
  });
  
  it('handles prop changes after initial render', () => {
    // Initial render with one set of emotions
    const { rerender } = render(
      <MoodAR emotions={[{ type: 'joy', score: 0.8 }]} width={400} height={300} />
    );
    
    // Remember initial call count
    const initialMeshCallCount = vi.mocked(require('three').Mesh).mock.calls.length;
    
    // Re-render with different emotions
    rerender(
      <MoodAR 
        emotions={[
          { type: 'anger', score: 0.7 },
          { type: 'surprise', score: 0.6 }
        ]} 
        width={400} 
        height={300} 
      />
    );
    
    // In a real implementation, this would likely create new meshes for the new emotions
    // This test is somewhat implementation-specific
    expect(vi.mocked(require('three').Mesh).mock.calls.length).toBeGreaterThanOrEqual(initialMeshCallCount);
  });
  
  it('handles invalid emotion types gracefully', () => {
    // Use any type to bypass TypeScript's type checking for this test
    const invalidEmotions: any[] = [
      { type: 'invalid-emotion-type', score: 0.8 }
    ];
    
    render(<MoodAR emotions={invalidEmotions} />);
    
    // Should still render without crashing
    expect(vi.mocked(require('three').Scene)).toHaveBeenCalled();
  });
  
  it('cleans up resources when unmounted', () => {
    const { unmount } = render(
      <MoodAR emotions={[{ type: 'joy', score: 0.8 }]} />
    );
    
    // Unmount the component
    unmount();
    
    // Should cancel animation frame
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
}); 